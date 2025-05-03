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
}

interface TranslationOptions {
  fuzzyMatching?: boolean
  pluralHandling?: boolean
  contextAware?: boolean
  rootConstruction?: boolean
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

export class Translator {
  private lexiconData: Array<EnochianWord> = []
  private rootData: Array<EnochianRoot> = []
  private enochianLetterMap: Record<string, { name: string; symbol: string }> =
    {}
  private meaningToWordMap = new Map<string, string>()
  private wordToMeaningMap = new Map<string, Array<string>>()
  private stemMap = new Map<string, Array<string>>()

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

  private normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/[.,;:!?'"()-]/g, '')
      .trim()
  }

  // Convert Enochian word to phonetic representation using letter names
  public convertToPhonetic(word: string): string {
    if (word.startsWith('[') && word.endsWith(']')) {
      return word // Keep the [word] format for untranslated words
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
      return word // Keep the [word] format for untranslated words
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

  // Find root meaning for a given letter
  public findRootMeaning(letter: string): EnochianRoot | undefined {
    return this.rootData.find(
      (root) => root.english_letter.toLowerCase() === letter.toLowerCase(),
    )
  }

  // Function to analyze a word for its root letters and meanings
  public analyzeRoots(
    word: string,
  ): Array<{ letter: string; root?: EnochianRoot }> {
    return Array.from(word.toLowerCase())
      .filter((char) => /[a-z]/i.test(char)) // Only analyze letters
      .map((letter) => ({
        letter,
        root: this.findRootMeaning(letter),
      }))
  }

  // New method to construct an Enochian word from English using root meanings
  private constructWordFromRoots(
    word: string,
  ): { word: string; explanation: string } | null {
    // First, check if there's a direct meaning match for common words
    // This is dynamic and uses the lexicon data
    const singleWordMatches = Array.from(this.meaningToWordMap.entries())
      .filter(([meaning, _]) => {
        // Look for meanings that are exactly this word or contain this word
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

    // For short words, we can try to map them directly using the first letters
    if (word.length <= 3) {
      const letters = Array.from(word.toLowerCase())
      const constructedWord = letters
        .map((l) => {
          const root = this.findRootMeaning(l)
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
            const root = this.findRootMeaning(l)
            return root ? `${l}→${root.enochian_name}` : l
          })
          .join(', ')})`,
      }
    }

    // For longer words, try to construct them from key roots
    const significantRoots = Array.from(word.toLowerCase())
      .filter((char) => /[a-z]/i.test(char))
      .map((letter) => this.findRootMeaning(letter))
      .filter(Boolean)

    if (significantRoots.length > 0) {
      // Take first 3 significant roots (or fewer if not available)
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

  // Function to translate and return complete result with all alternative displays
  public translateComplete(
    text: string,
    options: TranslationOptions = {},
  ): TranslationResult {
    return this.translate(text, options)
  }

  // Private utility function to properly handle single-letter words
  private handleSingleLetterWords(word: string): {
    result: string
    method: 'direct' | 'partial' | 'constructed'
    explanation: string
  } | null {
    // Special case for single-letter words
    if (word.length === 1 && /[a-z]/i.test(word)) {
      // Find all lexicon entries that might match this single letter
      const possibleMatches = Array.from(this.meaningToWordMap.entries())
        .filter(([meaning, _]) => {
          return (
            // Exact match for the letter
            meaning.toLowerCase() === word.toLowerCase() ||
            // Or the meaning is just the letter (like "a", "i")
            meaning === word
          )
        })
        .sort((a, b) => {
          // Prioritize exact matches
          if (a[0].toLowerCase() === word.toLowerCase()) return -1
          if (b[0].toLowerCase() === word.toLowerCase()) return 1
          return 0
        })

      // If we have matches, use the first one
      if (possibleMatches.length > 0) {
        const [meaning, enochianWord] = possibleMatches[0]
        return {
          result: enochianWord,
          method: 'direct',
          explanation: `Direct match found in lexicon: "${word}" → "${meaning}" → "${enochianWord}"`,
        }
      }

      // Fall back to using the Enochian letter name from the root table
      const root = this.findRootMeaning(word)
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

  // This function takes English text and attempts to translate to Enochian
  public translate(
    text: string,
    options: TranslationOptions = {},
  ): TranslationResult {
    const defaultOptions: Required<TranslationOptions> = {
      fuzzyMatching: true,
      pluralHandling: true,
      contextAware: true,
      rootConstruction: true,
    }

    const opts = { ...defaultOptions, ...options }

    if (!text.trim()) {
      return {
        translationText: '',
        phoneticText: '',
        symbolText: '',
        stats: { direct: 0, partial: 0, missing: 0, constructed: 0, total: 0 },
        wordAnalysis: {},
        constructionDetails: {},
      }
    }

    // Split the input into words and process
    const words = text.split(/\s+/)
    let result: Array<string> = []
    let directMatches = 0
    let partialMatches = 0
    let missingMatches = 0
    let constructedMatches = 0
    const wordAnalysis: Record<
      string,
      Array<{ letter: string; root?: EnochianRoot }>
    > = {}
    const constructionDetails: Record<
      string,
      {
        original: string
        result: string
        method: 'direct' | 'partial' | 'constructed' | 'missing'
        explanation: string
      }
    > = {}

    // First pass - direct matching
    words.forEach((originalWord, index) => {
      // Skip punctuation-only words
      if (/^[.,;:!?'"()-]+$/.test(originalWord)) {
        result.push(originalWord)
        return
      }

      // Extract any surrounding punctuation
      const leadingPunct = originalWord.match(/^([.,;:!?'"()-]+)/)?.[1] || ''
      const trailingPunct = originalWord.match(/([.,;:!?'"()-]+)$/)?.[1] || ''

      // Get the actual word without punctuation
      const word = originalWord
        .slice(leadingPunct.length, originalWord.length - trailingPunct.length)
        .toLowerCase()

      // Handle single-letter words specially (like "I", "a")
      const singleLetterMatch = this.handleSingleLetterWords(word)
      if (singleLetterMatch) {
        result.push(leadingPunct + singleLetterMatch.result + trailingPunct)
        directMatches++

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
        return
      }

      // Normal word processing
      let match = this.meaningToWordMap.get(word)

      if (match) {
        // Direct match found
        result.push(leadingPunct + match + trailingPunct)
        directMatches++

        // Add to word analysis
        wordAnalysis[match] = this.analyzeRoots(match)

        // Add construction details
        constructionDetails[originalWord] = {
          original: word,
          result: match,
          method: 'direct',
          explanation: `Direct match found in lexicon: "${word}" → "${match}"`,
        }
      } else if (
        opts.pluralHandling &&
        word.endsWith('s') &&
        !word.endsWith('ss')
      ) {
        // Try singular form for plurals
        const singular = word.slice(0, -1)
        match = this.meaningToWordMap.get(singular)

        if (match) {
          result.push(leadingPunct + match + trailingPunct)
          directMatches++

          // Add to word analysis
          wordAnalysis[match] = this.analyzeRoots(match)

          // Add construction details
          constructionDetails[originalWord] = {
            original: word,
            result: match,
            method: 'direct',
            explanation: `Matched by removing plural 's': "${word}" → "${singular}" → "${match}"`,
          }
        } else {
          // Will try partial matching in the next phase
          result.push(null as any)
        }
      } else {
        // Will try partial matching in the next phase
        result.push(null as any)
      }
    })

    // Second pass - partial and fuzzy matching for unmatched words
    result = result.map((translatedWord, index) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (translatedWord !== null) return translatedWord

      const originalWord = words[index]
      // Extract any surrounding punctuation
      const leadingPunct = originalWord.match(/^([.,;:!?'"()-]+)/)?.[1] || ''
      const trailingPunct = originalWord.match(/([.,;:!?'"()-]+)$/)?.[1] || ''

      // Get the actual word without punctuation
      const word = originalWord
        .slice(leadingPunct.length, originalWord.length - trailingPunct.length)
        .toLowerCase()

      // Try stemming for matches
      if (opts.fuzzyMatching) {
        const stemmed = this.stemWord(word)
        const stemMatches = this.stemMap.get(stemmed)

        if (stemMatches && stemMatches.length > 0) {
          // Choose the first match (could be improved to choose the most relevant)
          const match = stemMatches[0]
          partialMatches++

          // Add to word analysis
          wordAnalysis[match] = this.analyzeRoots(match)

          // Add construction details
          constructionDetails[originalWord] = {
            original: word,
            result: match,
            method: 'partial',
            explanation: `Partial match via stemming: "${word}" → "${stemmed}" → "${match}"`,
          }

          return leadingPunct + match + trailingPunct
        }
      }

      // Try partial matches if stemming didn't work
      if (opts.fuzzyMatching) {
        let bestMatch: string | null = null
        let bestMatchScore = 0
        let matchExplanation = ''

        // Look through all known meanings
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
          partialMatches++

          // Add to word analysis
          wordAnalysis[bestMatch] = this.analyzeRoots(bestMatch)

          // Add construction details
          constructionDetails[originalWord] = {
            original: word,
            result: bestMatch,
            method: 'partial',
            explanation: matchExplanation,
          }

          return leadingPunct + bestMatch + trailingPunct
        }
      }

      // Try root-based construction if enabled
      if (opts.rootConstruction) {
        const constructed = this.constructWordFromRoots(word)
        if (constructed) {
          constructedMatches++

          // Add to word analysis
          wordAnalysis[constructed.word] = this.analyzeRoots(constructed.word)

          // Add construction details
          constructionDetails[originalWord] = {
            original: word,
            result: constructed.word,
            method: 'constructed',
            explanation: constructed.explanation,
          }

          return leadingPunct + constructed.word + trailingPunct
        }
      }

      // If all matching failed, keep the original word but mark it
      missingMatches++

      // Add construction details for missing word
      constructionDetails[originalWord] = {
        original: word,
        result: `[${word}]`,
        method: 'missing',
        explanation: `No match found. Word remains untranslated.`,
      }

      return leadingPunct + `[${word}]` + trailingPunct
    })

    const translationText = result.join(' ')

    // Generate the phonetic and symbolic versions
    const phoneticText = result
      .map((word) => this.convertToPhonetic(word))
      .join(' ')

    const symbolText = result
      .map((word) => this.convertToSymbols(word))
      .join(' ')

    return {
      translationText,
      phoneticText,
      symbolText,
      stats: {
        direct: directMatches,
        partial: partialMatches,
        missing: missingMatches,
        constructed: constructedMatches,
        total: words.length,
      },
      wordAnalysis,
      constructionDetails,
    }
  }
}
