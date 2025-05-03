import { EnochianTranslator } from './translator'

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

interface ExtendedTranslationResult {
  // Original translation results
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

  // Enhanced results
  rootBasedTranslation: string
  combinedTranslation: string
  meaningAnalysis: Array<{
    english: string
    enochian: string
    source: 'lexicon' | 'root-analysis' | 'special-case'
    details?: string
  }>
}

export class EnhancedEnochianTranslator extends EnochianTranslator {
  constructor(lexiconData: Array<EnochianWord>, rootData: Array<EnochianRoot>) {
    super(lexiconData, rootData)
  }

  /**
   * Analyze a word that wasn't found in the lexicon to derive meaning from its root letters
   */
  private analyzeWordByRoots(word: string): string {
    const letterAnalysis = this.analyzeRoots(word)

    // If we have no root analysis, return empty string
    if (!letterAnalysis.length || !letterAnalysis.some((la) => la.root)) {
      return ''
    }

    // Extract the core meanings from each letter's root
    const rootMeanings = letterAnalysis
      .map((la) => {
        if (!la.root) return null

        // Extract the primary meaning from the root description
        const rootMeaning = la.root.meaning
        const primaryMeaning = rootMeaning.includes(':')
          ? rootMeaning.split(':')[1].trim().split(',')[0].trim()
          : rootMeaning

        return primaryMeaning
      })
      .filter(Boolean)

    // Combine the root meanings into a coherent phrase
    if (rootMeanings.length > 0) {
      return `[${rootMeanings.join('-')}]`
    }

    return ''
  }

  /**
   * Enhanced translation that combines lexicon matching with root-based analysis
   */
  public translateEnhanced(text: string): ExtendedTranslationResult {
    // Get the basic translation from the parent class
    const basicResult = this.translate(text)

    // Track meanings for each word
    const meaningAnalysis: Array<{
      english: string
      enochian: string
      source: 'lexicon' | 'root-analysis' | 'special-case'
      details?: string
    }> = []

    // Track root-based translations
    const rootBasedWords: Array<string> = []

    // Process each word in the input text
    const words = text.split(/\s+/)

    words.forEach((originalWord, index) => {
      // Skip punctuation-only words
      if (/^[.,;:!?'"()-]+$/.test(originalWord)) {
        rootBasedWords.push(originalWord)
        return
      }

      // Extract any surrounding punctuation
      const leadingPunct = originalWord.match(/^([.,;:!?'"()-]+)/)?.[1] || ''
      const trailingPunct = originalWord.match(/([.,;:!?'"()-]+)$/)?.[1] || ''

      // Get the actual word without punctuation
      const word = originalWord
        .slice(leadingPunct.length, originalWord.length - trailingPunct.length)
        .toLowerCase()

      // Check if this word was directly translated in the basic result
      const translated = !basicResult.translationText.includes(`[${word}]`)

      if (translated) {
        // Extract the Enochian translation from the basic result
        const resultWords = basicResult.translationText.split(/\s+/)
        const enochianWord = resultWords[index]

        if (enochianWord) {
          const cleanEnochianWord = enochianWord
            .replace(/^\[/, '')
            .replace(/\]$/, '')
            .replace(/^[.,;:!?'"()-]+/, '')
            .replace(/[.,;:!?'"()-]+$/, '')

          rootBasedWords.push(enochianWord)

          meaningAnalysis.push({
            english: word,
            enochian: cleanEnochianWord,
            source:
              word === 'i' && cleanEnochianWord === 'Gon'
                ? 'special-case'
                : 'lexicon',
            details:
              word === 'i' && cleanEnochianWord === 'Gon'
                ? 'Personal pronoun derived from Enochian letter name'
                : undefined,
          })
        }
      } else {
        // For untranslated words, try root analysis
        const rootAnalysis = this.analyzeWordByRoots(word)

        if (rootAnalysis) {
          // We have a root-based analysis
          rootBasedWords.push(leadingPunct + rootAnalysis + trailingPunct)

          meaningAnalysis.push({
            english: word,
            enochian: rootAnalysis,
            source: 'root-analysis',
            details: `Derived from letter roots: ${this.analyzeRoots(word)
              .filter((la) => la.root)
              .map((la) => `${la.letter.toUpperCase()} (${la.root?.meaning})`)
              .join(', ')}`,
          })
        } else {
          // No translation possible, keep original word in brackets
          rootBasedWords.push(leadingPunct + `[${word}]` + trailingPunct)

          meaningAnalysis.push({
            english: word,
            enochian: `[${word}]`,
            source: 'root-analysis',
            details: 'No translation available',
          })
        }
      }
    })

    const rootBasedTranslation = rootBasedWords.join(' ')

    // Create combined translation that uses the best translation for each word
    const combinedTranslation = rootBasedTranslation

    return {
      ...basicResult,
      rootBasedTranslation,
      combinedTranslation,
      meaningAnalysis,
    }
  }
}
