import { beforeAll, describe, expect, it } from 'bun:test'
import {
  EnochianTranslator,
  fetchLexiconData,
  fetchRootData,
} from '../src/lib/translator'

describe('JSON Processing Efficiency', () => {
  let lexiconData: Array<any> = []
  let rootData: Array<any> = []
  let translator: EnochianTranslator | null = null

  beforeAll(async () => {
    try {
      // Load the real data for testing
      lexiconData = await fetchLexiconData()
      rootData = await fetchRootData()
    } catch (error) {
      // If we can't load the data, we'll use empty arrays for tests
      console.log('Could not load JSON data, using empty arrays for tests')
      lexiconData = []
      rootData = []
    }
  })

  it('should initialize translation maps efficiently', () => {
    if (lexiconData.length === 0 || rootData.length === 0) {
      console.log('Skipping test due to missing data')
      return
    }

    const startTime = performance.now()
    translator = new EnochianTranslator(lexiconData, rootData)
    const endTime = performance.now()

    const initTime = endTime - startTime

    // Test should pass if initialization takes less than 100ms
    // Adjust threshold as needed for your environment
    expect(initTime).toBeLessThan(100)
    expect(translator).toBeDefined()
  })

  it('should perform lookups efficiently', () => {
    if (translator === null) {
      console.log('Skipping test due to missing translator')
      return
    }

    // Create a test phrase with a mix of common words
    const testPhrase =
      'with all truth brightness covenant man hand number prepare'

    const startTime = performance.now()
    const result = translator.translate(testPhrase)
    const endTime = performance.now()

    const translateTime = endTime - startTime

    // Test should pass if translation takes less than 50ms
    // Adjust threshold as needed for your environment
    expect(translateTime).toBeLessThan(50)
    expect(result.translationText).toBeDefined()
  })

  it('should handle large batches of translations efficiently', () => {
    if (translator === null) {
      console.log('Skipping test due to missing translator')
      return
    }

    // Create an array of 100 phrases to translate
    const phrases = Array(100)
      .fill(0)
      .map(
        (_, i) =>
          `phrase ${i}: with all truth brightness covenant man hand number prepare`,
      )

    const startTime = performance.now()

    // Translate all phrases
    const results = phrases.map((phrase) => translator!.translate(phrase))

    const endTime = performance.now()
    const batchTime = endTime - startTime

    // Calculate average time per translation
    const avgTime = batchTime / phrases.length

    // Test should pass if average translation time is less than 1ms per phrase
    // Adjust threshold as needed for your environment
    expect(avgTime).toBeLessThan(1)
    expect(results.length).toBe(phrases.length)
  })

  it('should efficiently handle stem word matching', () => {
    if (translator === null) {
      console.log('Skipping test due to missing translator')
      return
    }

    // Create a test phrase with plural forms and other variants that require stemming
    const testPhrase =
      'hands numbers truths brightness covenants mankind preparing'

    const startTime = performance.now()
    const result = translator.translate(testPhrase, { fuzzyMatching: true })
    const endTime = performance.now()

    const stemTime = endTime - startTime

    // Test should pass if translation with stemming takes less than 50ms
    // Adjust threshold as needed for your environment
    expect(stemTime).toBeLessThan(50)

    // We expect some words to be handled by fuzzy matching
    expect(result.stats.partial).toBeGreaterThan(0)
  })

  it('should have similar performance with and without fuzzy matching for direct matches', () => {
    if (translator === null) {
      console.log('Skipping test due to missing translator')
      return
    }

    // Use a phrase with words that should have direct matches
    const testPhrase =
      'with all truth brightness covenant man hand number prepare'

    // First without fuzzy matching
    const startNoFuzzy = performance.now()
    const resultNoFuzzy = translator.translate(testPhrase, {
      fuzzyMatching: false,
    })
    const endNoFuzzy = performance.now()
    const timeNoFuzzy = endNoFuzzy - startNoFuzzy

    // Then with fuzzy matching
    const startFuzzy = performance.now()
    const resultFuzzy = translator.translate(testPhrase, {
      fuzzyMatching: true,
    })
    const endFuzzy = performance.now()
    const timeFuzzy = endFuzzy - startFuzzy

    // The results should be the same for direct matches
    expect(resultNoFuzzy.translationText).toBe(resultFuzzy.translationText)

    // And the performance difference should be small
    // Let's say fuzzy matching should be at most 2x slower for direct matches
    expect(timeFuzzy / timeNoFuzzy).toBeLessThan(2)
  })

  it('should maintain good performance even with missing words', () => {
    if (translator === null) {
      console.log('Skipping test due to missing translator')
      return
    }

    // Create a phrase with many words that won't be found
    const testPhrase =
      'computer internet smartphone television airplane railway electricity blockchain'

    const startTime = performance.now()
    const result = translator.translate(testPhrase)
    const endTime = performance.now()

    const missingWordsTime = endTime - startTime

    // Test should pass if translation still completes quickly
    expect(missingWordsTime).toBeLessThan(50)

    // Most or all words should be missing
    expect(result.stats.missing).toBeGreaterThan(5)
  })

  it('should efficiently generate phonetic and symbol representations', () => {
    if (translator === null) {
      console.log('Skipping test due to missing translator')
      return
    }

    const testPhrase = 'with all truth brightness covenant'

    const startTime = performance.now()
    const result = translator.translate(testPhrase)
    const endTime = performance.now()

    // Check if phoneticText and symbolText were generated
    expect(result.phoneticText).toBeDefined()
    expect(result.phoneticText.length).toBeGreaterThan(0)
    expect(result.symbolText).toBeDefined()
    expect(result.symbolText.length).toBeGreaterThan(0)

    // The total time should still be fast even with generating these representations
    expect(endTime - startTime).toBeLessThan(50)
  })
})
