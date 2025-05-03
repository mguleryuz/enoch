interface EnochianWord {
  word: string
  meaning: string
}

interface EnochianRoot {
  english_letter: string
  enochian_name: string
  numeric_value: number
  meaning: string
  symbol: string
}

interface TranslationResult {
  translationText: string
  phoneticText: string
  symbolText: string
  stats: {
    direct: number
    partial: number
    missing: number
    constructed: number
    total: number
  }
  wordAnalysis: Record<string, Array<{ letter: string; root?: EnochianRoot }>>
  constructionDetails: Record<
    string,
    {
      original: string
      result: string
      method: 'direct' | 'partial' | 'constructed' | 'missing'
      explanation: string
    }
  >
  phraseMatches: Record<string, string>
}

interface TranslationOptions {
  fuzzyMatching?: boolean
  pluralHandling?: boolean
  contextAware?: boolean
  rootConstruction?: boolean
  checkPhrases?: boolean
}

// Function to fetch Enochian lexicon data
export const fetchLexiconData = async (): Promise<Array<EnochianWord>> => {
  const response = await fetch('/enochian_lexicon.json')
  if (!response.ok) {
    throw new Error('Failed to fetch lexicon data')
  }
  return response.json()
}

// Function to fetch Enochian root table data
export const fetchRootData = async (): Promise<Array<EnochianRoot>> => {
  const response = await fetch('/enochian_root_table.json')
  if (!response.ok) {
    throw new Error('Failed to fetch root table data')
  }
  return response.json()
}

export { Translator as EnochianTranslator }
export class Translator {
  private lexiconData: Array<EnochianWord> = []
  private rootData: Array<EnochianRoot> = []
  private enochianLetterMap: Record<string, { name: string; symbol: string }> =
    {}
  private meaningToWordMap = new Map<string, string>()
  private wordToMeaningMap = new Map<string, Array<string>>()
  private stemMap = new Map<string, Array<string>>()
  private phraseMap = new Map<string, string>()

  constructor(lexiconData: Array<EnochianWord>, rootData: Array<EnochianRoot>) {
    this.lexiconData = lexiconData
    this.rootData = rootData
    this.initializeMaps()
  }

  private initializeMaps(): void {
    // Create letter map from root data
    this.enochianLetterMap = this.rootData.reduce<
      Record<string, { name: string; symbol: string }>
    >((map, root) => {
      const letter = root.english_letter.toLowerCase()
      if (letter) {
        map[letter] = {
          name: root.enochian_name,
          symbol: root.symbol,
        }
      }
      return map
    }, {})

    // Create meaning to word map and word to meaning map
    this.lexiconData.forEach((entry) => {
      // Store the original word to meaning mapping
      const meanings: Array<string> = []

      // Clean up the meaning by removing dashes, parentheses, etc.
      const cleanedMeaning = entry.meaning
        .toLowerCase()
        .replace(/^-\s*/, '') // Remove leading dash
        .replace(/\(.*?\)/g, '') // Remove text in parentheses
        .trim()

      // If the meaning includes multiple words or phrases (separated by commas)
      cleanedMeaning.split(/,|;/).forEach((meaningPart) => {
        const trimmedMeaning = meaningPart.trim()
        if (trimmedMeaning) {
          this.meaningToWordMap.set(trimmedMeaning, entry.word)

          // Also store entire phrases for exact phrase matching
          this.phraseMap.set(trimmedMeaning, entry.word)

          // Add to our meanings array for this word
          meanings.push(trimmedMeaning)

          // Create stem versions for better matching
          const stem = this.stemWord(trimmedMeaning)
          if (stem && stem !== trimmedMeaning) {
            if (!this.stemMap.has(stem)) {
              this.stemMap.set(stem, [])
            }
            this.stemMap.get(stem)?.push(entry.word)
          }

          // Add single words from phrases for better matching
          if (trimmedMeaning.includes(' ')) {
            trimmedMeaning.split(' ').forEach((word) => {
              if (word.length > 2) {
                // Only consider meaningful words
                const wordStem = this.stemWord(word)
                if (wordStem && !this.stemMap.has(wordStem)) {
                  this.stemMap.set(wordStem, [])
                }
                if (wordStem) {
                  this.stemMap.get(wordStem)?.push(entry.word)
                }
              }
            })
          }
        }
      })

      // Store word to meanings mapping
      this.wordToMeaningMap.set(entry.word, meanings)
    })
  }

  // Simple stemming function to handle plurals and common suffixes
  private stemWord(word: string): string {
    word = word.toLowerCase().trim()
    if (word.length <= 3) return word

    // Handle common plurals
    if (word.endsWith('s') && !word.endsWith('ss')) {
      return word.slice(0, -1)
    }

    // Handle common suffixes
    if (word.endsWith('ing')) {
      return word.slice(0, -3)
    }
    if (word.endsWith('ed')) {
      return word.slice(0, -2)
    }
    if (word.endsWith('ly')) {
      return word.slice(0, -2)
    }

    return word
  }

  // Entry point for translation
  public translate(
    text: string,
    options: TranslationOptions = {},
  ): TranslationResult {
    const defaultOptions: Required<TranslationOptions> = {
      fuzzyMatching: true,
      pluralHandling: true,
      contextAware: true,
      rootConstruction: true,
      checkPhrases: true,
    }

    const opts = { ...defaultOptions, ...options }

    // Handle empty input
    if (!text.trim()) {
      return this.createEmptyResult()
    }

    // Check for exact phrase match first
    if (opts.checkPhrases) {
      const phraseResult = this.checkForPhraseMatch(text.trim())
      if (phraseResult) return phraseResult
    }

    // Process individual words
    return this.processText(text, opts)
  }

  // Create an empty result for empty input
  private createEmptyResult(): TranslationResult {
    return {
      translationText: '',
      phoneticText: '',
      symbolText: '',
      stats: { direct: 0, partial: 0, missing: 0, constructed: 0, total: 0 },
      wordAnalysis: {},
      constructionDetails: {},
      phraseMatches: {},
    }
  }

  // Check if the entire input is a phrase match
  private checkForPhraseMatch(text: string): TranslationResult | null {
    // Try direct match from the phrase map
    const exactPhraseMatch = this.phraseMap.get(text.toLowerCase())
    if (exactPhraseMatch) {
      return this.createPhraseMatchResult(
        text,
        exactPhraseMatch,
        `Complete phrase match: "${text}" → "${exactPhraseMatch}"`,
      )
    }

    // Try fuzzy phrase matching
    const phraseMatch = this.findFuzzyPhraseMatch(text)
    if (phraseMatch) {
      return this.createPhraseMatchResult(
        text,
        phraseMatch.enochianWord,
        phraseMatch.explanation,
      )
    }

    return null
  }

  // Create a result object for phrase matches
  private createPhraseMatchResult(
    originalText: string,
    enochianWord: string,
    explanation: string,
  ): TranslationResult {
    const wordAnalysis: Record<
      string,
      Array<{ letter: string; root?: EnochianRoot }>
    > = {}
    wordAnalysis[enochianWord] = this.analyzeRoots(enochianWord)

    const constructionDetails: Record<
      string,
      {
        original: string
        result: string
        method: 'direct' | 'partial' | 'constructed' | 'missing'
        explanation: string
      }
    > = {}
    constructionDetails[originalText] = {
      original: originalText,
      result: enochianWord,
      method: 'direct' as const,
      explanation,
    }

    const phraseMatches: Record<string, string> = {}
    phraseMatches[originalText] = enochianWord

    // Convert the Enochian word to its phonetic and symbolic representations
    const phoneticText = this.convertToPhonetic(enochianWord)
    const symbolText = this.convertToSymbols(enochianWord)

    return {
      translationText: enochianWord,
      phoneticText: phoneticText, // Convert to phonetic representation
      symbolText: symbolText, // Convert to symbol representation
      stats: {
        direct: 1,
        partial: 0,
        missing: 0,
        constructed: 0,
        total: 1,
      },
      wordAnalysis,
      constructionDetails,
      phraseMatches,
    }
  }

  // Find a fuzzy phrase match
  private findFuzzyPhraseMatch(text: string): {
    match: string
    enochianWord: string
    explanation: string
  } | null {
    // Look for exact matches first
    for (const [phrase, word] of this.phraseMap.entries()) {
      if (phrase.toLowerCase() === text.toLowerCase()) {
        return {
          match: phrase,
          enochianWord: word,
          explanation: `Complete phrase match: "${text}" → "${word}"`,
        }
      }
    }

    // If no exact match, look for closest matches
    let bestMatch: string | null = null
    let bestEnochianWord: string | null = null
    let bestScore = 0

    for (const [phrase, word] of this.phraseMap.entries()) {
      // Only consider phrases with spaces (multiple words)
      if (phrase.includes(' ')) {
        // If the phrase is fully contained in the normalized text
        if (text.toLowerCase().includes(phrase.toLowerCase())) {
          const score = phrase.length / text.length
          if (score > bestScore) {
            bestScore = score
            bestMatch = phrase
            bestEnochianWord = word
          }
        }
        // Or if the normalized text is fully contained in the phrase
        else if (phrase.toLowerCase().includes(text.toLowerCase())) {
          const score = text.length / phrase.length
          if (score > bestScore) {
            bestScore = score
            bestMatch = phrase
            bestEnochianWord = word
          }
        }
      }
    }

    if (bestMatch && bestEnochianWord && bestScore > 0.7) {
      return {
        match: bestMatch,
        enochianWord: bestEnochianWord,
        explanation: `Phrase match found: "${text}" is similar to "${bestMatch}" → "${bestEnochianWord}"`,
      }
    }

    return null
  }

  // Process text by translating each word
  private processText(
    text: string,
    options: Required<TranslationOptions>,
  ): TranslationResult {
    const words = text.split(/\s+/)
    const stats = {
      direct: 0,
      partial: 0,
      missing: 0,
      constructed: 0,
      total: words.length,
    }
    const wordAnalysis = {}
    const constructionDetails = {}
    const phraseMatches = {}

    // First check for multi-word phrases
    const processedWords = [...words]
    if (options.checkPhrases) {
      this.findMultiWordPhrases(
        processedWords,
        phraseMatches,
        constructionDetails,
        wordAnalysis,
        stats,
      )
    }

    // Create a map to keep track of which markers have been processed
    const processedMarkers = new Set<string>()

    // Now process individual words
    const result = processedWords
      .map((word, index) => {
        // Skip phrase markers that were replaced during phrase matching
        if (word.startsWith('__PHRASE_MATCH_')) {
          // Check if this marker has already been processed
          if (processedMarkers.has(word)) return ''

          // Extract the Enochian word from the marker
          // Format is __PHRASE_MATCH_i_j_EnochianWord__
          const match = word.match(/__PHRASE_MATCH_\d+_\d+_([A-Z]+)__/)
          if (match && match[1]) {
            // Mark this marker as processed
            processedMarkers.add(word)
            return match[1]
          }

          // Fallback - use the associated phrase
          for (const [phrase, enochianWord] of Object.entries(phraseMatches)) {
            // Find the phrase that corresponds to this marker by checking
            // if all words in the range are the same marker
            const startIdx = processedWords.indexOf(word)
            if (startIdx !== -1) {
              // Mark this marker as processed
              processedMarkers.add(word)
              return enochianWord
            }
          }

          return '' // Fallback - should not happen
        }

        return this.translateWord(
          word,
          stats,
          wordAnalysis,
          constructionDetails,
          options,
        )
      })
      .filter(Boolean) // Remove empty strings (from phrases)

    // Calculate final translated text
    const translationText = result.join(' ')

    // Generate phonetic and symbol versions from the translation
    const { phoneticText, symbolText } = this.generateAlternateFormats(
      translationText,
      constructionDetails,
      phraseMatches,
    )

    return {
      translationText,
      phoneticText,
      symbolText,
      stats,
      wordAnalysis,
      constructionDetails,
      phraseMatches,
    }
  }

  // Find multi-word phrases in the input
  private findMultiWordPhrases(
    words: Array<string>,
    phraseMatches: Record<string, string>,
    constructionDetails: Record<string, any>,
    wordAnalysis: Record<string, any>,
    stats: {
      direct: number
      partial: number
      missing: number
      constructed: number
      total: number
    },
  ): void {
    // Try different sliding windows of words
    for (let i = 0; i < words.length; i++) {
      // Skip if this word is already part of a phrase
      if (words[i].startsWith('__PHRASE_MATCH_')) continue

      for (let j = Math.min(words.length, i + 4); j > i + 1; j--) {
        // Skip if any of these words are already part of a phrase
        if (words.slice(i, j).some((w) => w.startsWith('__PHRASE_MATCH_')))
          continue

        const phrase = words.slice(i, j).join(' ')
        const match = this.findFuzzyPhraseMatch(phrase)

        if (match) {
          // Mark these words as part of a phrase
          phraseMatches[phrase] = match.enochianWord

          // Add to construction details
          constructionDetails[phrase] = {
            original: phrase,
            result: match.enochianWord,
            method: 'direct',
            explanation: match.explanation,
          }

          // Add to word analysis
          wordAnalysis[match.enochianWord] = this.analyzeRoots(
            match.enochianWord,
          )

          // Create unique marker for this phrase
          const marker = `__PHRASE_MATCH_${i}_${j}_${match.enochianWord}__`

          // Skip these words in future processing
          for (let k = i; k < j; k++) {
            words[k] = marker
          }

          // Track stats
          stats.direct++

          // Skip ahead
          i = j - 1
          break
        }
      }
    }
  }

  // Translate a single word
  private translateWord(
    originalWord: string,
    stats: {
      direct: number
      partial: number
      missing: number
      constructed: number
      total: number
    },
    wordAnalysis: Record<string, any>,
    constructionDetails: Record<string, any>,
    options: Required<TranslationOptions>,
  ): string {
    // Skip punctuation-only words
    if (/^[.,;:!?'"()-]+$/.test(originalWord)) {
      return originalWord
    }

    // Extract any surrounding punctuation
    const leadingPunct = originalWord.match(/^([.,;:!?'"()-]+)/)?.[1] || ''
    const trailingPunct = originalWord.match(/([.,;:!?'"()-]+)$/)?.[1] || ''

    // Get the actual word without punctuation
    const word = originalWord
      .slice(leadingPunct.length, originalWord.length - trailingPunct.length)
      .toLowerCase()

    // Handle single-letter words specially (like "I", "a")
    const singleLetterMatch = this.handleSingleLetterWord(word)
    if (singleLetterMatch) {
      const result = leadingPunct + singleLetterMatch.result + trailingPunct

      // Add to word analysis
      wordAnalysis[singleLetterMatch.result] = this.analyzeRoots(
        singleLetterMatch.result,
      )

      // Add construction details
      constructionDetails[originalWord] = {
        original: word,
        result: singleLetterMatch.result,
        method: singleLetterMatch.method,
        explanation: singleLetterMatch.explanation,
      }

      stats.direct++
      return result
    }

    // Try direct match
    let match = this.meaningToWordMap.get(word)
    if (match) {
      const result = leadingPunct + match + trailingPunct

      // Add to word analysis
      wordAnalysis[match] = this.analyzeRoots(match)

      // Add construction details
      constructionDetails[originalWord] = {
        original: word,
        result: match,
        method: 'direct',
        explanation: `Direct match found in lexicon: "${word}" → "${match}"`,
      }

      stats.direct++
      return result
    }

    // Try plural handling
    if (options.pluralHandling && word.endsWith('s') && !word.endsWith('ss')) {
      const singular = word.slice(0, -1)
      match = this.meaningToWordMap.get(singular)

      if (match) {
        const result = leadingPunct + match + trailingPunct

        // Add to word analysis
        wordAnalysis[match] = this.analyzeRoots(match)

        // Add construction details
        constructionDetails[originalWord] = {
          original: word,
          result: match,
          method: 'direct',
          explanation: `Matched by removing plural 's': "${word}" → "${singular}" → "${match}"`,
        }

        stats.direct++
        return result
      }
    }

    // Try fuzzy matching
    if (options.fuzzyMatching) {
      const fuzzyMatch = this.findFuzzyMatch(word)
      if (fuzzyMatch) {
        const result = leadingPunct + fuzzyMatch.word + trailingPunct

        // Add to word analysis
        wordAnalysis[fuzzyMatch.word] = this.analyzeRoots(fuzzyMatch.word)

        // Add construction details
        constructionDetails[originalWord] = {
          original: word,
          result: fuzzyMatch.word,
          method: 'partial',
          explanation: fuzzyMatch.explanation,
        }

        stats.partial++
        return result
      }
    }

    // Try word construction
    if (options.rootConstruction) {
      const constructed = this.constructWordFromRoots(word)
      if (constructed) {
        const result = leadingPunct + constructed.word + trailingPunct

        // Add to word analysis
        wordAnalysis[constructed.word] = this.analyzeRoots(constructed.word)

        // Add construction details
        constructionDetails[originalWord] = {
          original: word,
          result: constructed.word,
          method: 'constructed',
          explanation: constructed.explanation,
        }

        stats.constructed++
        return result
      }
    }

    // If all else fails, mark as missing
    const result = leadingPunct + `[${word}]` + trailingPunct

    // Add construction details for missing word
    constructionDetails[originalWord] = {
      original: word,
      result: `[${word}]`,
      method: 'missing',
      explanation: `No match found. Word remains untranslated.`,
    }

    stats.missing++
    return result
  }

  // Handle single-letter words like "I", "a"
  private handleSingleLetterWord(word: string): {
    result: string
    method: 'direct' | 'partial' | 'constructed'
    explanation: string
  } | null {
    if (word.length === 1 && /[a-z]/i.test(word)) {
      // Look for exact matches
      const match = this.meaningToWordMap.get(word)
      if (match) {
        return {
          result: match,
          method: 'direct',
          explanation: `Direct match found for single letter: "${word}" → "${match}"`,
        }
      }

      // Special case for "I"
      if (word.toLowerCase() === 'i') {
        // Look for matches with meanings containing "i" as a standalone pronoun
        const possibleMatches = Array.from(
          this.meaningToWordMap.entries(),
        ).filter(
          ([meaning, _]) =>
            meaning.toLowerCase() === 'i' ||
            meaning.toLowerCase() === 'i ' ||
            meaning.toLowerCase() === ' i ' ||
            meaning.toLowerCase() === ' i',
        )

        if (possibleMatches.length > 0) {
          const [meaning, enochianWord] = possibleMatches[0]
          return {
            result: enochianWord,
            method: 'direct',
            explanation: `Match found for pronoun: "${word}" → "${meaning}" → "${enochianWord}"`,
          }
        }
      }

      // Fall back to using Enochian letter name
      const root = this.findRootForLetter(word)
      if (root) {
        return {
          result: root.enochian_name,
          method: 'constructed',
          explanation: `Using Enochian letter name: "${word}" → "${root.enochian_name}" (${root.meaning.split(':')[0].trim()})`,
        }
      }
    }
    return null
  }

  // Find a fuzzy match for a word
  private findFuzzyMatch(word: string): {
    word: string
    explanation: string
  } | null {
    // Try stemming first
    const stemmed = this.stemWord(word)
    const stemMatches = this.stemMap.get(stemmed)

    if (stemMatches && stemMatches.length > 0) {
      return {
        word: stemMatches[0],
        explanation: `Partial match via stemming: "${word}" → "${stemmed}" → "${stemMatches[0]}"`,
      }
    }

    // Try partial matching with known meanings
    let bestMatch: string | null = null
    let bestMatchScore = 0
    let matchExplanation = ''

    for (const [meaning, enochianWord] of this.meaningToWordMap.entries()) {
      // Check if meaning contains word or word contains meaning
      if (meaning.includes(word) || word.includes(meaning)) {
        const score = meaning.includes(word)
          ? word.length / meaning.length
          : meaning.length / word.length

        // Keep track of the best match
        if (score > bestMatchScore) {
          bestMatchScore = score
          bestMatch = enochianWord
          matchExplanation = meaning.includes(word)
            ? `Partial match (word found in meaning): "${word}" appears in "${meaning}" → "${enochianWord}"`
            : `Partial match (meaning found in word): "${meaning}" appears in "${word}" → "${enochianWord}"`
        }
      }
    }

    if (bestMatch && bestMatchScore > 0.5) {
      return {
        word: bestMatch,
        explanation: matchExplanation,
      }
    }

    return null
  }

  // Find the root information for a letter
  private findRootForLetter(letter: string): EnochianRoot | undefined {
    return this.rootData.find(
      (root) => root.english_letter.toLowerCase() === letter.toLowerCase(),
    )
  }

  // Construct a word from English using root meanings
  private constructWordFromRoots(word: string): {
    word: string
    explanation: string
  } | null {
    // First check for direct meaning matches
    const singleWordMatches = Array.from(this.meaningToWordMap.entries())
      .filter(([meaning, _]) => {
        return (
          meaning.toLowerCase() === word.toLowerCase() ||
          meaning.toLowerCase().includes(` ${word.toLowerCase()} `) ||
          meaning.toLowerCase().endsWith(` ${word.toLowerCase()}`)
        )
      })
      .sort((a, b) => {
        // Prioritize exact matches
        if (a[0].toLowerCase() === word.toLowerCase()) return -1
        if (b[0].toLowerCase() === word.toLowerCase()) return 1
        return a[0].length - b[0].length // Shorter meanings are more precise
      })

    if (singleWordMatches.length > 0) {
      const [meaning, enochianWord] = singleWordMatches[0]
      return {
        word: enochianWord,
        explanation: `Found in lexicon: "${word}" appears in meaning "${meaning}" → "${enochianWord}"`,
      }
    }

    // For short words, map directly using the first letters
    if (word.length <= 3) {
      const letters = Array.from(word.toLowerCase())
      const constructedWord = letters
        .map((l) => {
          const root = this.findRootForLetter(l)
          return root ? root.enochian_name.charAt(0).toLowerCase() : l
        })
        .join('')

      // Capitalize constructed word
      const finalWord =
        constructedWord.charAt(0).toUpperCase() + constructedWord.slice(1)

      return {
        word: finalWord,
        explanation: `Constructed using the first letter of each root name (${letters
          .map((l) => {
            const root = this.findRootForLetter(l)
            return root ? `${l}→${root.enochian_name}` : l
          })
          .join(', ')})`,
      }
    }

    // For longer words, use significant roots
    const significantRoots = Array.from(word.toLowerCase())
      .filter((char) => /[a-z]/i.test(char))
      .map((letter) => this.findRootForLetter(letter))
      .filter(Boolean)

    if (significantRoots.length > 0) {
      // Take first 3 significant roots
      const usedRoots = significantRoots.slice(0, 3)
      const constructedWord = usedRoots
        .map((root) => root?.enochian_name.charAt(0).toLowerCase())
        .join('')

      // Capitalize the constructed word
      const finalWord =
        constructedWord.charAt(0).toUpperCase() + constructedWord.slice(1)

      return {
        word: finalWord,
        explanation: `Constructed from key letter roots: ${usedRoots
          .map(
            (root) =>
              `${root?.english_letter} (${root?.meaning.split(':')[0].trim()})`,
          )
          .join(', ')}`,
      }
    }

    return null
  }

  // Generate phonetic and symbol versions from translated text
  private generateAlternateFormats(
    translationText: string,
    constructionDetails: Record<string, any>,
    phraseMatches: Record<string, string>,
  ): { phoneticText: string; symbolText: string } {
    // Create a map of Enochian words to their original English words
    const enochianToOriginal = new Map<string, string>()

    // Add words from construction details
    Object.entries(constructionDetails).forEach(([originalWord, details]) => {
      if (!details.result.startsWith('[')) {
        // Skip untranslated words
        enochianToOriginal.set(details.result, details.original)
      }
    })

    // Add phrase matches to the enochianToOriginal map
    Object.entries(phraseMatches).forEach(([originalPhrase, enochianWord]) => {
      enochianToOriginal.set(enochianWord, originalPhrase)
    })

    // Start with the original translation text
    let phoneticText = translationText
    let symbolText = translationText

    // Replace Enochian words with their phonetic/symbol versions
    const enochianWords = Array.from(enochianToOriginal.keys()).sort(
      (a, b) => b.length - a.length,
    ) // Process longer words first to avoid partial replacements

    enochianWords.forEach((enochianWord) => {
      // Skip untranslated words (already have brackets)
      if (enochianWord.startsWith('[')) return

      // Check if this is a special case like "I" → "Gon"
      const originalWord = enochianToOriginal.get(enochianWord)
      const isSpecialCase = originalWord?.toLowerCase() === 'i'

      // Create regex to match the word with word boundaries
      const regex = new RegExp(`\\b${enochianWord}\\b`, 'g')

      // Handle phonetic conversion
      if (isSpecialCase) {
        // For special cases like "I" → "Gon", keep the Enochian word directly
        // (already correct in phoneticText)
      } else {
        // For all other words, including phrase matches, convert to phonetic
        const phoneticVersion = this.convertToPhonetic(enochianWord)
        phoneticText = phoneticText.replace(regex, phoneticVersion)
      }

      // Handle symbol conversion
      if (isSpecialCase) {
        // For special cases like "I" → "Gon", keep the Enochian word directly
        // (already correct in symbolText)
      } else {
        // For all other words, including phrase matches, convert to symbols
        const symbolVersion = this.convertToSymbols(enochianWord)
        symbolText = symbolText.replace(regex, symbolVersion)
      }
    })

    return { phoneticText, symbolText }
  }

  // Convert Enochian word to phonetic representation
  public convertToPhonetic(word: string): string {
    if (word.startsWith('[') && word.endsWith(']')) {
      return word // Keep bracketed untranslated words as-is
    }

    return Array.from(word.toLowerCase())
      .map((char) => {
        if (/[a-z]/i.test(char) && char in this.enochianLetterMap) {
          return this.enochianLetterMap[char].name
        }
        return char
      })
      .join('-')
  }

  // Convert Enochian word to symbolic representation
  public convertToSymbols(word: string): string {
    if (word.startsWith('[') && word.endsWith(']')) {
      return word // Keep bracketed untranslated words as-is
    }

    return Array.from(word.toLowerCase())
      .map((char) => {
        if (/[a-z]/i.test(char) && char in this.enochianLetterMap) {
          return this.enochianLetterMap[char].symbol
        }
        return char
      })
      .join('')
  }

  // Analyze a word for its root letters and meanings
  public analyzeRoots(
    word: string,
  ): Array<{ letter: string; root?: EnochianRoot }> {
    return Array.from(word.toLowerCase())
      .filter((char) => /[a-z]/i.test(char)) // Only analyze letters
      .map((letter) => ({
        letter,
        root: this.findRootForLetter(letter),
      }))
  }
}
