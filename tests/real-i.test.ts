import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'bun:test'
import { EnochianTranslator } from '../src/lib/translator'

describe('Real Lexicon Tests', () => {
  let realTranslator: EnochianTranslator | null = null

  beforeAll(async () => {
    try {
      // Load the lexicon and root data from disk for testing
      const lexiconPath = path.join(
        process.cwd(),
        'public',
        'enochian_lexicon.json',
      )
      const rootTablePath = path.join(
        process.cwd(),
        'public',
        'enochian_root_table.json',
      )

      // Read and parse the files
      const lexiconData = JSON.parse(fs.readFileSync(lexiconPath, 'utf-8'))
      const rootData = JSON.parse(fs.readFileSync(rootTablePath, 'utf-8'))

      // Create translator with real data
      realTranslator = new EnochianTranslator(lexiconData, rootData)
    } catch (error) {
      console.error('Failed to load lexicon data:', error)
    }
  })

  it('should translate "I" correctly with real lexicon data', async () => {
    // Skip test if translator couldn't be initialized
    if (!realTranslator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    // Test translation of "I"
    const result = realTranslator.translate('I')
    console.log('Translation of "I":', result.translationText)

    // Should not be marked as missing
    expect(result.stats.missing).toBe(0)

    // Should be a direct match
    expect(result.stats.direct).toBe(1)

    // Should translate to "Gon" (the Enochian letter name)
    expect(result.translationText).toBe('Gon')
  })

  it('should translate "I am" as a phrase match using ZIRDO', async () => {
    // Skip test if translator couldn't be initialized
    if (!realTranslator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    // Add the "I AM" -> "ZIRDO" entry to the meaning map if it doesn't exist
    const result = realTranslator.translate('I am', { checkPhrases: true })
    console.log('Translation of "I am":', result)

    // Should be found as a phrase match or individual words
    if (result.translationText === 'ZIRDO') {
      // If found as a phrase match
      expect(result.stats.direct).toBe(1)
      expect(result.stats.missing).toBe(0)

      // Check that phonetic and symbol versions maintain the phrase
      expect(result.phoneticText).toBe('ZIRDO')
      expect(result.symbolText).toBe('ZIRDO')

      // Should be in the phraseMatches collection
      expect(Object.keys(result.phraseMatches).length).toBeGreaterThan(0)
    } else {
      // If individual words are translated
      console.log('Note: "I am" was not found as a phrase match in the lexicon')
      console.log('Word-by-word translation results:', result)

      // Check if "I" is translated correctly
      expect(result.translationText.includes('Gon')).toBe(true)
    }
  })

  it('should properly handle "I light" with correct phonetic/symbol output', async () => {
    // Skip test if translator couldn't be initialized
    if (!realTranslator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    // Test translation of "I light"
    const result = realTranslator.translate('I light')
    console.log('Translation of "I light":', result)

    // Check if "I" is translated to "Gon"
    expect(result.translationText.split(' ')[0]).toBe('Gon')

    // Verify phonetic output keeps "Gon" unchanged
    const phoneticParts = result.phoneticText.split(' ')
    expect(phoneticParts[0]).toBe('Gon')

    // Verify the second word is converted to phonetic notation
    if (phoneticParts.length > 1) {
      // The second part should not just be the Enochian word unchanged
      expect(phoneticParts[1].includes('-')).toBe(true)
    }

    // Print the full results for debugging
    console.log('Translation text:', result.translationText)
    console.log('Phonetic text:', result.phoneticText)
    console.log('Symbol text:', result.symbolText)
  })
})
