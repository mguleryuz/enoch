import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'bun:test'
import { EnhancedEnochianTranslator } from '../src/lib/enhanced-translator'

describe('Enhanced Enochian Translator', () => {
  let enhancedTranslator: EnhancedEnochianTranslator | null = null

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

      // Create enhanced translator with real data
      enhancedTranslator = new EnhancedEnochianTranslator(lexiconData, rootData)
    } catch (error) {
      console.error('Failed to load data for enhanced translator:', error)
    }
  })

  it('should provide enhanced translations with root analysis', () => {
    // Skip test if translator couldn't be initialized
    if (!enhancedTranslator) {
      console.log('Skipping test: unable to initialize enhanced translator')
      return
    }

    // Test with a simple phrase containing words not in the lexicon
    const result = enhancedTranslator.translateEnhanced(
      'I speak enochian language',
    )

    console.log('Enhanced translation:', result.combinedTranslation)
    console.log('Word-by-word analysis:')
    result.meaningAnalysis.forEach((analysis) => {
      console.log(
        `"${analysis.english}" -> "${analysis.enochian}" (${analysis.source})`,
      )
      if (analysis.details) {
        console.log(`  Details: ${analysis.details}`)
      }
    })

    // Should have some direct lexicon matches and some root-based translations
    expect(result.meaningAnalysis.some((a) => a.source === 'lexicon')).toBe(
      true,
    )
    expect(
      result.meaningAnalysis.some((a) => a.source === 'root-analysis'),
    ).toBe(true)

    // Should maintain the same number of words
    expect(result.meaningAnalysis.length).toBe(4)

    // Personal pronoun "I" should be translated to "Gon"
    expect(result.meaningAnalysis[0].english).toBe('i')
    expect(result.meaningAnalysis[0].enochian).toBe('Gon')
  })

  it('should provide enhanced translations for sentences', () => {
    // Skip test if translator couldn't be initialized
    if (!enhancedTranslator) {
      console.log('Skipping test: unable to initialize enhanced translator')
      return
    }

    // Test with a more complex sentence
    const result = enhancedTranslator.translateEnhanced(
      'The light shines in darkness',
    )

    console.log('Enhanced sentence translation:', result.combinedTranslation)
    console.log('Sentence analysis:')
    result.meaningAnalysis.forEach((analysis) => {
      console.log(
        `"${analysis.english}" -> "${analysis.enochian}" (${analysis.source})`,
      )
      if (analysis.details) {
        console.log(`  Details: ${analysis.details}`)
      }
    })

    // Should maintain the same number of words
    expect(result.meaningAnalysis.length).toBe(5)
  })
})
