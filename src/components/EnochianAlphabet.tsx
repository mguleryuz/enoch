import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// These are approximate representations - real Enochian letters are more complex
const enochianLetters = [
  { english: 'A', enochian: 'Un', description: 'Root of Time', symbol: '⟨∀⟩' },
  {
    english: 'B',
    enochian: 'Pe',
    description: 'Root of Choice',
    symbol: '⟨б⟩',
  },
  { english: 'C', enochian: 'Veh', description: 'Conjunction', symbol: '⟨ↄ⟩' },
  {
    english: 'D',
    enochian: 'Gal',
    description: 'Root of Possibility',
    symbol: '⟨Б⟩',
  },
  {
    english: 'E',
    enochian: 'Graph',
    description: 'Root of Will',
    symbol: '⟨Э⟩',
  },
  {
    english: 'F',
    enochian: 'Orth',
    description: 'Root of Manifestation',
    symbol: '⟨Φ⟩',
  },
  {
    english: 'G',
    enochian: 'Ged',
    description: 'Root of Negation',
    symbol: '⟨Г⟩',
  },
  {
    english: 'H',
    enochian: 'Na-hath',
    description: 'Root of Increase',
    symbol: '⟨Н⟩',
  },
  {
    english: 'I',
    enochian: 'Gon',
    description: 'Root of Energy',
    symbol: '⟨I⟩',
  },
  {
    english: 'L',
    enochian: 'Ur',
    description: 'Root of Breath',
    symbol: '⟨Л⟩',
  },
  {
    english: 'M',
    enochian: 'Tal',
    description: 'Root of Knowledge',
    symbol: '⟨М⟩',
  },
  {
    english: 'N',
    enochian: 'Drun',
    description: 'Root of Desire',
    symbol: '⟨И⟩',
  },
  {
    english: 'O',
    enochian: 'Med',
    description: 'Root of Limitation',
    symbol: '⟨О⟩',
  },
  {
    english: 'P',
    enochian: 'Mals',
    description: 'Root of Primacy',
    symbol: '⟨Π⟩',
  },
  {
    english: 'Q',
    enochian: 'Ger',
    description: 'Root of Establishment',
    symbol: '⟨Ψ⟩',
  },
  {
    english: 'R',
    enochian: 'Don',
    description: 'Root of Being',
    symbol: '⟨Я⟩',
  },
  {
    english: 'S',
    enochian: 'Fam',
    description: 'Root of Possession',
    symbol: '⟨∑⟩',
  },
  {
    english: 'T',
    enochian: 'Gisa',
    description: 'Root of Balance',
    symbol: '⟨Т⟩',
  },
  {
    english: 'U/V',
    enochian: 'Val',
    description: 'Root of Division',
    symbol: '⟨∪⟩',
  },
  {
    english: 'X',
    enochian: 'Pal',
    description: 'Root of Interiority',
    symbol: '⟨Ж⟩',
  },
  {
    english: 'Z',
    enochian: 'Ceph',
    description: 'Root of Movement',
    symbol: '⟨Ζ⟩',
  },
]

export default function EnochianAlphabet() {
  const [activeLetterIndex, setActiveLetterIndex] = useState<number | null>(
    null,
  )

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>The 21 Enochian Letters</CardTitle>
          <CardDescription>
            Click on a letter to see its meaning and pronunciation
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {enochianLetters.map((letter, index) => (
              <Button
                key={letter.english}
                variant={activeLetterIndex === index ? 'default' : 'outline'}
                className={`h-auto py-4 px-2 flex flex-col items-center transition-all ${
                  activeLetterIndex === index
                    ? 'ring-2 ring-primary/50 shadow-md'
                    : 'hover:bg-primary/5'
                }`}
                onClick={() =>
                  setActiveLetterIndex(
                    activeLetterIndex === index ? null : index,
                  )
                }
              >
                <div className="text-2xl font-bold mb-1">{letter.symbol}</div>
                <div className="text-sm">{letter.english}</div>
                <div className="text-xs mt-1">{letter.enochian}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {activeLetterIndex !== null && (
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="flex-shrink-0 flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-primary/5 rounded-full">
                <span className="text-5xl md:text-6xl font-bold">
                  {enochianLetters[activeLetterIndex].symbol}
                </span>
              </div>

              <div className="flex-grow text-center md:text-left">
                <h3 className="text-xl font-bold mb-2">
                  {enochianLetters[activeLetterIndex].english} -{' '}
                  {enochianLetters[activeLetterIndex].enochian}
                </h3>
                <p className="text-muted">
                  {enochianLetters[activeLetterIndex].description}
                </p>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Usage in Enochian:</h4>
                  <p className="text-sm">
                    The letter {enochianLetters[activeLetterIndex].english} (
                    {enochianLetters[activeLetterIndex].enochian}) represents
                    the{' '}
                    {enochianLetters[
                      activeLetterIndex
                    ].description.toLowerCase()}
                    in Enochian language. Each letter has metaphysical
                    significance beyond its phonetic value.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">About the Alphabet</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <p>
            The Enochian alphabet consists of 21 letters, each with its own name
            and mystical meaning. The script flows from right to left and has
            unique calligraphic forms.
          </p>
          <p>
            John Dee and Edward Kelley recorded these characters through their
            angelic communications, claiming they were revealed by the angel
            Uriel. The letters form the basis of the Enochian magical system
            used in various occult practices.
          </p>
          <p className="text-xs text-muted mt-4">
            Note: The symbols shown here are modern approximations using Unicode
            characters. The actual Enochian script has more complex, specific
            calligraphic forms.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
