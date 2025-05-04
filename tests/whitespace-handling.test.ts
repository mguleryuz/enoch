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

describe('Whitespace Handling Tests', () => {
  let translator: EnochianTranslator

  beforeAll(() => {
    translator = new EnochianTranslator(lexiconData, rootData)
  })

  describe('Different whitespace inputs', () => {
    // Test cases with various whitespace issues
    const testCases = [
      { name: 'Normal text', text: 'I am immortal', expected: 'ZIRDO G-AGIOD' },
      {
        name: 'Extra spaces',
        text: 'I   am    immortal',
        expected: 'ZIRDO G-AGIOD',
      },
      {
        name: 'Leading/trailing spaces',
        text: '  I am immortal  ',
        expected: 'ZIRDO G-AGIOD',
      },
      {
        name: 'Line breaks',
        text: 'I am\nimmortal',
        expected: 'ZIRDO G-AGIOD',
      },
      {
        name: 'Line breaks with spaces',
        text: 'I am \n immortal',
        expected: 'ZIRDO G-AGIOD',
      },
      {
        name: 'Multiple line breaks',
        text: 'I\n\nam\n\nimmortal',
        expected: 'ZIRDO G-AGIOD',
      },
      {
        name: 'Trailing line break',
        text: 'I am immortal\n',
        expected: 'ZIRDO G-AGIOD',
      },
      {
        name: 'Multiple whitespace types',
        text: 'I \t am \n immortal \r\n',
        expected: 'ZIRDO G-AGIOD',
      },
      { name: 'Empty input', text: '', expected: '' },
      { name: 'Just whitespace', text: '   \n\t  ', expected: '' },
    ]

    testCases.forEach(({ name, text, expected }) => {
      it(`should handle ${name} correctly`, () => {
        const result = translator.translate(text)

        // Should produce the expected translation
        expect(result.translationText).toBe(expected)

        // Should not have extra spaces
        expect(result.translationText.includes('  ')).toBe(false)
        expect(result.translationText.startsWith(' ')).toBe(false)
        expect(result.translationText.endsWith(' ')).toBe(false)

        // Empty input checks
        if (!text.trim()) {
          expect(result.stats.total).toBe(0)
          expect(Object.keys(result.constructionDetails).length).toBe(0)
        }

        // Non-empty input checks
        if (text.trim()) {
          // Make sure all construction details have non-empty keys
          Object.keys(result.constructionDetails).forEach((key) => {
            expect(key.trim().length).toBeGreaterThan(0)
          })
        }
      })
    })
  })

  describe('Edge cases', () => {
    it('should handle text with only line breaks correctly', () => {
      const result = translator.translate('\n\n\n')
      expect(result.translationText).toBe('')
      expect(result.stats.total).toBe(0)
    })

    it('should handle text with mixed whitespace correctly', () => {
      const result = translator.translate(' \t \n \r ')
      expect(result.translationText).toBe('')
      expect(result.stats.total).toBe(0)
    })
  })
})
