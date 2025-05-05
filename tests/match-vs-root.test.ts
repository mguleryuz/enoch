import { beforeAll, describe, expect, it } from 'bun:test'
import { getTranslator } from './helpers'
import type { EnochianTranslator } from '@/lib/translator'

describe('Match vs Root Translation Tests', () => {
  let translator: EnochianTranslator | null = null

  beforeAll(() => {
    try {
      translator = getTranslator()
    } catch (error) {
      console.error('Failed to load lexicon data:', error)
    }
  })

  it('should check if the output is a root or a match', () => {
    const result = translator?.translate('I am')

    // This is a match
    expect(result?.translationText).toBe('ZIRDO')

    // Phonetic should be
    expect(result?.phoneticText).toBe('Ceph-Gon-Don-Gal-Med')

    // Symbol should be
    expect(result?.symbolText).toBe('⟨Ζ⟩⟨I⟩⟨Я⟩⟨Б⟩⟨О⟩')
  })

  it('should check if the output is a root or a match', () => {
    const result = translator?.translate('a')

    // This is a root
    expect(result?.translationText).toBe('Un')

    // Phonetic should be
    expect(result?.phoneticText).toBe('Un')

    // Symbol should be
    expect(result?.symbolText).toBe('⟨∀⟩')
  })
})
