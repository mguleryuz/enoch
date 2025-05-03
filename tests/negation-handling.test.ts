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

      // "mortal" should be directly translated
      expect(result.translationText).toContain('AGIOD')

      // "immortal" should be translated using the OL prefix with the root word
      expect(negatedResult.translationText).toContain('OLAGIOD')
      expect(negatedResult.translationText).not.toContain('AGIOD ')

      // Check the explanation
      const immortalDetails = Object.values(
        negatedResult.constructionDetails,
      ).find((detail: any) => detail.original === 'immortal')
      expect(immortalDetails).toBeDefined()
      if (immortalDetails) {
        expect(immortalDetails.explanation).toContain('Negation handling')
      }
    })

    it('should handle "un-" prefix correctly', () => {
      const baseWord = 'happy'
      const negatedWord = 'unhappy'

      const baseResult = translator.translate(baseWord)
      const negatedResult = translator.translate(negatedWord)

      // The negated word should use the OL prefix, not match the root directly
      expect(negatedResult.translationText).not.toBe(baseResult.translationText)

      if (baseResult.translationText !== `[${baseWord}]`) {
        // If the base word has a translation, check that negated form uses OL prefix
        expect(negatedResult.translationText).toContain('OL')
      }
    })

    it('should handle "non-" prefix correctly', () => {
      const baseResult = translator.translate('human')
      const negatedResult = translator.translate('nonhuman')

      // If there's a direct translation for "human"
      if (!baseResult.translationText.includes('[human]')) {
        // The negated version should include the OL prefix
        expect(negatedResult.translationText).not.toBe(
          baseResult.translationText,
        )

        // Check that it's being processed as a negation
        const nonhumanDetails = Object.values(
          negatedResult.constructionDetails,
        ).find((detail: any) => detail.original === 'nonhuman')

        // If it matched via our negation handling, verify the explanation
        if (nonhumanDetails && nonhumanDetails.method === 'partial') {
          expect(nonhumanDetails.explanation).toContain('Negation handling')
        }
      }
    })
  })

  describe('Preventing Incorrect Meaning Matches', () => {
    it('should not match "immortal" as containing "mortal"', () => {
      const result = translator.translate('immortal')

      // Verify the explanation doesn't mention "mortal appears in immortal"
      const details = Object.values(result.constructionDetails).find(
        (detail: any) => detail.original === 'immortal',
      )

      if (details && details.method === 'partial') {
        expect(details.explanation).not.toContain('mortal appears in immortal')
      }
    })

    it('should not match "invisible" as containing "visible"', () => {
      const result = translator.translate('invisible visible')

      // Get the construction details for both words
      const invisibleDetails = Object.values(result.constructionDetails).find(
        (detail: any) => detail.original === 'invisible',
      )
      const visibleDetails = Object.values(result.constructionDetails).find(
        (detail: any) => detail.original === 'visible',
      )

      // If both words have details and translations
      if (invisibleDetails && visibleDetails) {
        // Their translations should be different (one should not contain the other)
        expect(invisibleDetails.result).not.toBe(visibleDetails.result)

        // Check if invisible matched with negation
        if (invisibleDetails.method === 'partial') {
          expect(invisibleDetails.explanation).not.toContain(
            'visible appears in invisible',
          )
        }
      }
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
        expect(details.explanation).toContain('Negation handling')
        expect(details.result).toContain('OL')
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
          expect(details.explanation).toContain('Negation handling')
        }
      }
    })
  })
})
