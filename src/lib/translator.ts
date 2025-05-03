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
    total: number
  }
  wordAnalysis: Record<string, Array<{ letter: string; root?: EnochianRoot }>>
}

interface TranslationOptions {
  fuzzyMatching?: boolean
  pluralHandling?: boolean
  contextAware?: boolean
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

export class EnochianTranslator {
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

  // Function to translate and return complete result with all alternative displays
  public translateComplete(
    text: string,
    options: TranslationOptions = {},
  ): TranslationResult {
    return this.translate(text, options)
  }

  // Private utility function to properly handle single-letter words
  private handleSingleLetterWords(word: string): string | null {
    // Special case for single-letter words
    if (word.length === 1 && /[a-z]/i.test(word)) {
      console.log(`Handling single letter word: "${word}"`)

      // Special case for "I" (personal pronoun)
      if (word.toLowerCase() === 'i') {
        console.log(`Special case: Using "Gon" for the personal pronoun "I"`)
        return 'Gon'
      }

      // Check for direct match of single letters in the dictionary
      for (const [meaning, enochianWord] of this.meaningToWordMap.entries()) {
        console.log(`Checking meaning: "${meaning}" -> "${enochianWord}"`)
        if (meaning.toLowerCase() === word.toLowerCase()) {
          console.log(`Found match: "${word}" -> "${enochianWord}"`)
          return enochianWord
        }
      }

      // If we got here, no match was found
      console.log(`No match found for "${word}"`)
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
    }

    const opts = { ...defaultOptions, ...options }

    if (!text.trim()) {
      return {
        translationText: '',
        phoneticText: '',
        symbolText: '',
        stats: { direct: 0, partial: 0, missing: 0, total: 0 },
        wordAnalysis: {},
      }
    }

    // Split the input into words and process
    const words = text.split(/\s+/)
    let result: Array<string> = []
    let directMatches = 0
    let partialMatches = 0
    let missingMatches = 0
    const wordAnalysis: Record<
      string,
      Array<{ letter: string; root?: EnochianRoot }>
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
        result.push(leadingPunct + singleLetterMatch + trailingPunct)
        directMatches++

        // Add to word analysis
        wordAnalysis[singleLetterMatch] = this.analyzeRoots(singleLetterMatch)
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

          return leadingPunct + match + trailingPunct
        }
      }

      // Try partial matches if stemming didn't work
      if (opts.fuzzyMatching) {
        let bestMatch: string | null = null
        let bestMatchScore = 0

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
            }
          }
        }

        if (bestMatch && bestMatchScore > 0.5) {
          partialMatches++

          // Add to word analysis
          wordAnalysis[bestMatch] = this.analyzeRoots(bestMatch)

          return leadingPunct + bestMatch + trailingPunct
        }
      }

      // If all matching failed, keep the original word but mark it
      missingMatches++
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
        total: words.length,
      },
      wordAnalysis,
    }
  }
}
