import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'bun:test'
import { EnochianTranslator } from '../src/lib/translator'

// Load test data from JSON files
const lexiconData = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'public/enochian_lexicon.json'),
    'utf8',
  ),
)
const rootData = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'public/enochian_root_table.json'),
    'utf8',
  ),
)

describe('Negation Handling Tests', () => {
  let translator: EnochianTranslator

  beforeAll(() => {
    translator = new EnochianTranslator(lexiconData, rootData)
  })

  describe('Common Negation Prefixes', () => {
    it('should handle "im-" prefix correctly', () => {
      const result = translator.translate('I am mortal')
      const negatedResult = translator.translate('I am immortal')

      console.log('Regular result:', result.translationText)
      console.log('Negated result:', negatedResult.translationText)

      // "mortal" should be directly translated
      expect(result.translationText).toContain('AGIOD')

      // "immortal" should be translated using the G- prefix with the root word
      expect(negatedResult.translationText).toContain('G-AGIOD')
      expect(negatedResult.translationText).not.toContain('AGIOD ')

      // Check the explanation
      const immortalDetails = Object.values(
        negatedResult.constructionDetails,
      ).find((detail: any) => detail.original === 'immortal')
      expect(immortalDetails).toBeDefined()
      if (immortalDetails) {
        expect(immortalDetails.explanation).toContain('Negation prefix')
      }
    })

    it('should handle "un-" prefix correctly', () => {
      const baseWord = 'happy'
      const negatedWord = 'unhappy'

      const baseResult = translator.translate(baseWord)
      const negatedResult = translator.translate(negatedWord)

      // The negated word should use the G- prefix, not match the root directly
      expect(negatedResult.translationText).not.toBe(baseResult.translationText)

      if (baseResult.translationText !== `[${baseWord}]`) {
        // If the base word has a translation, check that negated form uses G- prefix
        expect(negatedResult.translationText).toContain('G-')
      }
    })

    it('should handle "non-" prefix correctly', () => {
      const baseResult = translator.translate('human')
      const negatedResult = translator.translate('nonhuman')

      // If there's a direct translation for "human"
      if (!baseResult.translationText.includes('[human]')) {
        // The negated version should include the G- prefix
        expect(negatedResult.translationText).not.toBe(
          baseResult.translationText,
        )

        // Check that it's being processed as a negation
        const nonhumanDetails = Object.values(
          negatedResult.constructionDetails,
        ).find((detail: any) => detail.original === 'nonhuman')

        // If it matched via our negation handling, verify the explanation
        if (nonhumanDetails && nonhumanDetails.method === 'partial') {
          expect(nonhumanDetails.explanation).toContain('Negation prefix')
        }
      }
    })
  })

  describe('Preventing Incorrect Meaning Matches', () => {
    it('should not match "immortal" as containing "mortal"', () => {
      const mortalResult = translator.translate('mortal')
      const immortalResult = translator.translate('immortal')

      // immortal should not be translated the same as mortal
      expect(immortalResult.translationText).not.toEqual(
        mortalResult.translationText,
      )

      // Check that it's using the negation prefix approach
      expect(immortalResult.translationText).toContain('G-')
    })

    it('should not match "invisible" as containing "visible"', () => {
      const visibleResult = translator.translate('visible')
      const invisibleResult = translator.translate('invisible')

      // invisible should not be translated the same as visible
      expect(invisibleResult.translationText).not.toEqual(
        visibleResult.translationText,
      )
    })
  })

  describe('Compound Words with Negation', () => {
    it('should handle "anti-" prefix in compound words', () => {
      const result = translator.translate('antihero')

      // Check if it's handled as a negation
      const details = Object.values(result.constructionDetails).find(
        (detail: any) => detail.original === 'antihero',
      )

      if (details && details.method === 'partial') {
        expect(details.explanation).toContain('Negation prefix')
        expect(details.result).toContain('G-')
      }
    })

    it('should handle "dis-" prefix correctly', () => {
      const baseWord = 'honest'
      const negatedWord = 'dishonest'

      const baseResult = translator.translate(baseWord)
      const negatedResult = translator.translate(negatedWord)

      // If there's a translation for the base word
      if (!baseResult.translationText.includes(`[${baseWord}]`)) {
        // The negated version should be different
        expect(negatedResult.translationText).not.toBe(
          baseResult.translationText,
        )

        // If it matched as a negation pattern
        const details = Object.values(negatedResult.constructionDetails).find(
          (detail: any) => detail.original === negatedWord,
        )

        if (details && details.method === 'partial') {
          expect(details.explanation).toContain('Negation prefix')
        }
      }
    })
  })

  describe('Root Analysis for Negation', () => {
    it('should properly analyze roots for negated words', () => {
      // Translate a word with negation
      const result = translator.translate('immortal')

      // The result should contain a G- prefixed word
      expect(result.translationText).toContain('G-')

      // Extract the G-prefixed word
      const negatedWord = result.translationText

      // Check if word analysis exists for the negated word
      expect(result.wordAnalysis).toHaveProperty(negatedWord)

      // Get the actual analysis
      const analysis = result.wordAnalysis[negatedWord]

      // The first item should be the 'g' for negation
      expect(analysis[0].letter).toBe('g')
      expect(analysis[0].root).toBeDefined()

      // The second item should be the first letter of the base word (not the hyphen)
      expect(analysis[1].letter).not.toBe('-')

      // There should be more items after the G (the base word)
      expect(analysis.length).toBeGreaterThan(1)
    })
  })
})
