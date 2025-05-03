import { useEffect, useState } from 'react'
import { AlertCircle, Check, Copy, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface EnochianWord {
  word: string
  meaning: string
}

interface EnochianRoot {
  'English Letter': string
  'Enochian Name': string
  'Numeric Value': number
  Meaning: string
}

// Map of English letters to their Enochian letter names
const enochianLetterMap: Record<string, { name: string; symbol: string }> = {
  a: { name: 'Un', symbol: '⟨∀⟩' },
  b: { name: 'Pe', symbol: '⟨б⟩' },
  c: { name: 'Veh', symbol: '⟨ↄ⟩' },
  d: { name: 'Gal', symbol: '⟨Б⟩' },
  e: { name: 'Graph', symbol: '⟨Э⟩' },
  f: { name: 'Orth', symbol: '⟨Φ⟩' },
  g: { name: 'Ged', symbol: '⟨Г⟩' },
  h: { name: 'Na-hath', symbol: '⟨Н⟩' },
  i: { name: 'Gon', symbol: '⟨I⟩' },
  j: { name: 'Gon', symbol: '⟨I⟩' }, // Using same as 'i'
  k: { name: 'Veh', symbol: '⟨ↄ⟩' }, // Using same as 'c'
  l: { name: 'Ur', symbol: '⟨Л⟩' },
  m: { name: 'Tal', symbol: '⟨М⟩' },
  n: { name: 'Drun', symbol: '⟨И⟩' },
  o: { name: 'Med', symbol: '⟨О⟩' },
  p: { name: 'Mals', symbol: '⟨Π⟩' },
  q: { name: 'Ger', symbol: '⟨Ψ⟩' },
  r: { name: 'Don', symbol: '⟨Я⟩' },
  s: { name: 'Fam', symbol: '⟨∑⟩' },
  t: { name: 'Gisa', symbol: '⟨Т⟩' },
  u: { name: 'Val', symbol: '⟨∪⟩' },
  v: { name: 'Val', symbol: '⟨∪⟩' },
  w: { name: 'Val', symbol: '⟨∪⟩' }, // Using same as 'v'
  x: { name: 'Pal', symbol: '⟨Ж⟩' },
  y: { name: 'Gon', symbol: '⟨I⟩' }, // Using same as 'i'
  z: { name: 'Ceph', symbol: '⟨Ζ⟩' },
  ' ': { name: ' ', symbol: ' ' },
  '.': { name: '.', symbol: '.' },
  ',': { name: ',', symbol: ',' },
  '!': { name: '!', symbol: '!' },
  '?': { name: '?', symbol: '?' },
  ';': { name: ';', symbol: ';' },
  ':': { name: ':', symbol: ':' },
  '-': { name: '-', symbol: '-' },
  '(': { name: '(', symbol: '(' },
  ')': { name: ')', symbol: ')' },
}

export default function EnochianTranslator() {
  const [input, setInput] = useState('')
  const [lexiconData, setLexiconData] = useState<Array<EnochianWord>>([])
  const [rootData, setRootData] = useState<Array<EnochianRoot>>([])
  const [translationResult, setTranslationResult] = useState<string>('')
  const [phoneticResult, setPhoneticResult] = useState<string>('')
  const [symbolResult, setSymbolResult] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [matchCounts, setMatchCounts] = useState<{
    direct: number
    partial: number
    missing: number
  }>({ direct: 0, partial: 0, missing: 0 })
  const [displayMode, setDisplayMode] = useState<
    'original' | 'phonetic' | 'symbol'
  >('original')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const lexiconResponse = await fetch('/enochian_lexicon.json')
        const rootResponse = await fetch('/enochian_root_table.json')

        if (!lexiconResponse.ok || !rootResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const lexicon = await lexiconResponse.json()
        const roots = await rootResponse.json()

        setLexiconData(lexicon)
        setRootData(roots)
        setLoading(false)
      } catch (err) {
        setError('Error loading Enochian data. Please try again later.')
        setLoading(false)
        console.error('Error fetching data:', err)
      }
    }

    fetchData()
  }, [])

  // Convert Enochian word to phonetic representation using letter names
  const convertToPhonetic = (word: string): string => {
    return Array.from(word.toLowerCase())
      .map((char) => {
        // Using hasOwnProperty to check if the character exists in our map
        return char in enochianLetterMap ? enochianLetterMap[char].name : char
      })
      .join('-')
  }

  // Convert Enochian word to symbolic representation
  const convertToSymbols = (word: string): string => {
    return Array.from(word.toLowerCase())
      .map((char) => {
        // Using hasOwnProperty to check if the character exists in our map
        return char in enochianLetterMap ? enochianLetterMap[char].symbol : char
      })
      .join('')
  }

  // This function takes English text and attempts to find Enochian words
  const translateText = (text: string) => {
    if (!text.trim()) {
      setTranslationResult('')
      setPhoneticResult('')
      setSymbolResult('')
      setMatchCounts({ direct: 0, partial: 0, missing: 0 })
      return
    }

    // Split the input into words
    const words = text.toLowerCase().split(/\s+/)
    let result = ''
    let directMatches = 0
    let partialMatches = 0
    let missingMatches = 0

    // Create a map for faster lookup (meaning -> word)
    const meaningToWord = new Map<string, string>()

    lexiconData.forEach((entry) => {
      // Clean up the meaning by removing dashes, parentheses, etc.
      const cleanedMeaning = entry.meaning
        .toLowerCase()
        .replace(/^-\s*/, '') // Remove leading dash
        .replace(/\(.*?\)/g, '') // Remove text in parentheses
        .trim()

      // If the meaning includes multiple words or phrases (separated by commas)
      cleanedMeaning.split(/,|;/).forEach((meaningPart) => {
        const trimmedMeaning = meaningPart.trim()
        if (trimmedMeaning) {
          meaningToWord.set(trimmedMeaning, entry.word)
        }
      })
    })

    // Try to match each word
    words.forEach((word, index) => {
      // Skip punctuation-only words
      if (/^[.,;:!?'"()-]+$/.test(word)) {
        result += word
        if (index < words.length - 1) {
          result += ' '
        }
        return
      }

      // Look for direct matches first
      if (meaningToWord.has(word)) {
        result += meaningToWord.get(word)
        directMatches++
      } else {
        // Look for partial matches
        let found = false
        for (const [meaning, enochianWord] of meaningToWord.entries()) {
          // Check if meaning contains word or word contains meaning
          if (meaning.includes(word) || word.includes(meaning)) {
            result += enochianWord
            found = true
            partialMatches++
            break
          }
        }

        // If no match found, keep the original word but mark it
        if (!found) {
          result += `[${word}]`
          missingMatches++
        }
      }

      // Add space between words
      if (index < words.length - 1) {
        result += ' '
      }
    })

    // Generate the phonetic and symbolic versions
    const phonetic = result
      .split(' ')
      .map((word) => {
        if (word.startsWith('[') && word.endsWith(']')) {
          return word // Keep the [word] format for untranslated words
        }
        return convertToPhonetic(word)
      })
      .join(' ')

    const symbols = result
      .split(' ')
      .map((word) => {
        if (word.startsWith('[') && word.endsWith(']')) {
          return word // Keep the [word] format for untranslated words
        }
        return convertToSymbols(word)
      })
      .join(' ')

    setTranslationResult(result)
    setPhoneticResult(phonetic)
    setSymbolResult(symbols)
    setMatchCounts({
      direct: directMatches,
      partial: partialMatches,
      missing: missingMatches,
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleTranslate = () => {
    translateText(input)
  }

  const handleCopy = (type: 'original' | 'phonetic' | 'symbol') => {
    let textToCopy = ''
    switch (type) {
      case 'original':
        textToCopy = translationResult
        break
      case 'phonetic':
        textToCopy = phoneticResult
        break
      case 'symbol':
        textToCopy = symbolResult
        break
    }

    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
      toast.success('Copied to clipboard', {
        description: 'The translation text has been copied to your clipboard',
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTranslate()
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex flex-col justify-center items-center h-64 py-6">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-muted-foreground">
            Loading Enochian dictionary...
          </p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-destructive">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <span>Enter Text to Translate</span>
          </CardTitle>
          <CardDescription>
            Type English words or phrases below and click "Translate" to convert
            to Enochian
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Textarea
              placeholder="Example: greetings from earth"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="min-h-28 text-base resize-none p-3 focus:ring-2"
            />
            <div className="flex items-center justify-between">
              <Button
                onClick={handleTranslate}
                disabled={!input.trim()}
                className="relative overflow-hidden group"
                size="lg"
              >
                Translate
                <span className="absolute inset-0 flex items-center justify-center bg-primary/0 group-hover:bg-primary/10 transition-all duration-300"></span>
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInput('')}
                  disabled={!input}
                >
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted italic">
              Pro tip: Press Ctrl+Enter to translate quickly
            </p>
          </div>
        </CardContent>
      </Card>

      {(translationResult || error) && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center flex-wrap gap-3">
              <CardTitle>Enochian Translation</CardTitle>
              <Tabs
                value={displayMode}
                onValueChange={(value) =>
                  setDisplayMode(value as 'original' | 'phonetic' | 'symbol')
                }
                className="w-auto"
              >
                <TabsList className="grid grid-cols-3 h-9">
                  <TabsTrigger value="original" className="px-3">
                    Words
                  </TabsTrigger>
                  <TabsTrigger value="phonetic" className="px-3">
                    Phonetic
                  </TabsTrigger>
                  <TabsTrigger value="symbol" className="px-3">
                    Symbols
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {!error && (
              <CardDescription>
                {displayMode === 'original'
                  ? 'Enochian words translated from English'
                  : displayMode === 'phonetic'
                    ? 'Phonetic pronunciation using Enochian letter names'
                    : 'Visual representation using Enochian symbols'}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent>
            {error ? (
              <div className="flex items-center text-destructive gap-2 p-4 bg-destructive/10 rounded-md">
                <AlertCircle size={20} />
                <span className="font-medium">{error}</span>
              </div>
            ) : (
              <>
                <div className="relative">
                  <div className="bg-muted/30 rounded-md p-4 border min-h-28 whitespace-pre-wrap text-lg">
                    {displayMode === 'original' && translationResult}
                    {displayMode === 'phonetic' && phoneticResult}
                    {displayMode === 'symbol' && (
                      <span className="text-xl tracking-wide">
                        {symbolResult}
                      </span>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => handleCopy(displayMode)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                {showDetails && (
                  <div className="mt-5 pt-4 border-t">
                    <div className="text-sm font-medium mb-3">
                      Translation Statistics:
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        <Check className="h-3.5 w-3.5 text-green-500" />
                        <span>
                          {matchCounts.direct} direct{' '}
                          {matchCounts.direct === 1 ? 'match' : 'matches'}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        <Check className="h-3.5 w-3.5 text-yellow-500" />
                        <span>
                          {matchCounts.partial} partial{' '}
                          {matchCounts.partial === 1 ? 'match' : 'matches'}
                        </span>
                      </Badge>
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 py-1 px-2"
                      >
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                        <span>
                          {matchCounts.missing} missing{' '}
                          {matchCounts.missing === 1 ? 'word' : 'words'}
                        </span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Words in [brackets] have no direct Enochian equivalent and
                      remain in English
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
