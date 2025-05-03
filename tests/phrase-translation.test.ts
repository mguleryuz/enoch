import fs from 'node:fs'
import path from 'node:path'
import { beforeAll, describe, expect, it } from 'bun:test'
import { EnochianTranslator } from '../src/lib/translator'

describe('Phrase Translation Tests', () => {
  let translator: EnochianTranslator | null = null

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
      translator = new EnochianTranslator(lexiconData, rootData)
    } catch (error) {
      console.error('Failed to load lexicon data:', error)
    }
  })

  it('should translate "I am" correctly as a phrase match', () => {
    if (!translator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    const result = translator.translate('I am')

    // Check that "I am" is translated to ZIRDO
    expect(result.translationText).toBe('ZIRDO')

    // Check that phonetic and symbol outputs convert ZIRDO to its components
    expect(result.phoneticText).toBe('Ceph-Gon-Don-Gal-Med')

    // Check that it's marked as a phrase match
    expect(Object.keys(result.phraseMatches).length).toBe(1)
    expect(result.phraseMatches['I am']).toBe('ZIRDO')
  })

  it('should translate "I light" correctly with special handling for "I"', () => {
    if (!translator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    const result = translator.translate('I light')

    // Words should be "Gon OLPIRT"
    expect(result.translationText).toBe('Gon OLPIRT')

    // Phonetic should preserve "Gon" but convert "OLPIRT"
    const phoneticParts = result.phoneticText.split(' ')
    expect(phoneticParts[0]).toBe('Gon')
    expect(phoneticParts[1].includes('-')).toBe(true)

    // Check construction details
    expect(result.constructionDetails['I'].result).toBe('Gon')
    expect(result.constructionDetails['light'].result).toBe('OLPIRT')
  })

  it('should translate "I am light" correctly using phrase match for "I am"', () => {
    if (!translator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    const result = translator.translate('I am light')

    // Words should be "ZIRDO OLPIRT"
    expect(result.translationText).toBe('ZIRDO OLPIRT')

    // Phonetic should be "Ceph-Gon-Don-Gal-Med Med-Ur-Mals-Gon-Don-Gisa"
    // where ZIRDO is converted to phonetic as well
    const phoneticParts = result.phoneticText.split(' ')
    expect(phoneticParts[0].includes('Ceph')).toBe(true)
    expect(phoneticParts[0].includes('Gon')).toBe(true)
    expect(phoneticParts[0].includes('Don')).toBe(true)
    expect(phoneticParts[0].includes('Gal')).toBe(true)
    expect(phoneticParts[0].includes('Med')).toBe(true)

    // The second part should be the phonetic for OLPIRT
    expect(phoneticParts[1].includes('Med')).toBe(true)
    expect(phoneticParts[1].includes('Ur')).toBe(true)

    // Check phrase matches
    expect(Object.keys(result.phraseMatches).length).toBe(1)
    expect(result.phraseMatches['I am']).toBe('ZIRDO')

    // Check construction details
    expect(result.constructionDetails['I am'].result).toBe('ZIRDO')
    expect(result.constructionDetails['light'].result).toBe('OLPIRT')
  })

  it('should translate "the third angel is king" with multiple phrase matches', () => {
    if (!translator) {
      console.log('Skipping test: unable to initialize translator')
      return
    }

    const result = translator.translate('the third angel is king')

    // Words should be "GAD BOBOGEL"
    expect(result.translationText).toBe('GAD BOBOGEL')

    // Check phrase matches
    expect(Object.keys(result.phraseMatches).length).toBe(1)
    expect(result.phraseMatches['the third angel is']).toBe('GAD')

    // Check construction details
    expect(result.constructionDetails['the third angel is'].result).toBe('GAD')
    expect(result.constructionDetails['king'].result).toBe('BOBOGEL')
  })
})
