import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useEnochianDictionary } from '@/hooks/useEnochianDictionary'
import { useAlphabetStore } from '@/store/alphabetStore'

export default function EnochianAlphabet() {
  const { activeLetterIndex, setActiveLetterIndex } = useAlphabetStore()

  const { data, isLoading, error } = useEnochianDictionary()

  const enochianLetters =
    data?.rootData.filter((letter) => letter.english_letter.match(/^[A-Z]$/)) ??
    []

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex flex-col justify-center items-center h-64 py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted">Loading Enochian alphabet...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="pt-6">
          <div className="text-destructive">
            Error loading alphabet data: {error.toString()}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
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
                  {enochianLetters[activeLetterIndex].english_letter} -{' '}
                  {enochianLetters[activeLetterIndex].enochian_name}
                </h3>
                <p className="text-muted">
                  {enochianLetters[activeLetterIndex].meaning}
                </p>

                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Usage in Enochian:</h4>
                  <p className="text-sm">
                    The letter{' '}
                    {enochianLetters[activeLetterIndex].english_letter} (
                    {enochianLetters[activeLetterIndex].enochian_name})
                    represents the{' '}
                    {enochianLetters[activeLetterIndex].meaning
                      .toLowerCase()
                      .includes('root of')
                      ? enochianLetters[activeLetterIndex].meaning
                          .split(':')[0]
                          .toLowerCase()
                      : enochianLetters[
                          activeLetterIndex
                        ].meaning.toLowerCase()}{' '}
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
          <CardTitle>The 21 Enochian Letters</CardTitle>
          <CardDescription>
            Click on a letter to see its meaning and pronunciation
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-3">
            {enochianLetters.map((letter, index) => (
              <Button
                key={letter.english_letter}
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
                <div className="text-sm">{letter.english_letter}</div>
                <div className="text-xs mt-1">{letter.enochian_name}</div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

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
