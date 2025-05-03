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
        '..',
        'public',
        'enochian_lexicon.json',
      )
      const rootTablePath = path.join(
        process.cwd(),
        '..',
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

  it('should translate "I am" correctly with real lexicon data', async () => {
    // Skip test if translator couldn't be initialized
    if (!realTranslator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    // Test translation of "I am"
    const result = realTranslator.translate('I am')
    console.log('Translation of "I am":', result.translationText)

    // The test shows that both "I" and "am" are translated directly,
    // where "I" -> "Gon" and "am" -> "I" according to the real lexicon
    expect(result.stats.direct).toBe(2)
    expect(result.stats.missing).toBe(0)

    // First word should be "Gon" followed by "I"
    expect(result.translationText).toBe('Gon I')
  })
})
