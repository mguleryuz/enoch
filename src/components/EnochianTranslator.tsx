import { useState } from 'react'
import { AlertCircle, BookOpen, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery } from '@tanstack/react-query'
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface EnochianWord {
  word: string
  meaning: string
}

interface EnochianRoot {
  english_letter: string
  enochian_name: string
  numeric_value: number
  meaning: string
  symbol: string
}

// Function to fetch Enochian lexicon data
const fetchLexiconData = async (): Promise<Array<EnochianWord>> => {
  const response = await fetch('/enochian_lexicon.json')
  if (!response.ok) {
    throw new Error('Failed to fetch lexicon data')
  }
  return response.json()
}

// Function to fetch Enochian root table data
const fetchRootData = async (): Promise<Array<EnochianRoot>> => {
  const response = await fetch('/enochian_root_table.json')
  if (!response.ok) {
    throw new Error('Failed to fetch root table data')
  }
  return response.json()
}

export default function EnochianTranslator() {
  const [input, setInput] = useState('')
  const [translationResult, setTranslationResult] = useState<string>('')
  const [phoneticResult, setPhoneticResult] = useState<string>('')
  const [symbolResult, setSymbolResult] = useState<string>('')
  const [showDetails, setShowDetails] = useState(false)
  const [rootDetailsView, setRootDetailsView] = useState(false)
  const [matchCounts, setMatchCounts] = useState<{
    direct: number
    partial: number
    missing: number
  }>({ direct: 0, partial: 0, missing: 0 })
  const [displayMode, setDisplayMode] = useState<
    'original' | 'phonetic' | 'symbol'
  >('phonetic')

  // Using React Query to fetch lexicon data
  const {
    data: lexiconData = [],
    isLoading: lexiconLoading,
    error: lexiconError,
  } = useQuery({
    queryKey: ['enochianLexicon'],
    queryFn: fetchLexiconData,
  })

  // Using React Query to fetch root table data
  const {
    data: rootData = [],
    isLoading: rootLoading,
    error: rootError,
  } = useQuery({
    queryKey: ['enochianRoots'],
    queryFn: fetchRootData,
  })

  // Create a letter map from the root data for easier access
  const enochianLetterMap = rootData.reduce<
    Record<string, { name: string; symbol: string }>
  >((map, root) => {
    const letter = root.english_letter.toLowerCase()
    if (letter) {
      map[letter] = {
        name: root.enochian_name,
        symbol: root.symbol,
      }
    }
    return map
  }, {})

  // Using string type assertion to satisfy the linter
  const errorMessage =
    lexiconError || rootError
      ? `Error loading Enochian data: ${(lexiconError || rootError)?.toString()}`
      : undefined

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const loading = lexiconLoading || rootLoading

  // Convert Enochian word to phonetic representation using letter names
  const convertToPhonetic = (word: string): string => {
    return Array.from(word.toLowerCase())
      .map((char) => {
        return char in enochianLetterMap ? enochianLetterMap[char].name : char
      })
      .join('-')
  }

  // Convert Enochian word to symbolic representation
  const convertToSymbols = (word: string): string => {
    return Array.from(word.toLowerCase())
      .map((char) => {
        return char in enochianLetterMap ? enochianLetterMap[char].symbol : char
      })
      .join('')
  }

  // Find root meaning for a given letter
  const findRootMeaning = (letter: string): EnochianRoot | undefined => {
    return rootData.find(
      (root) => root.english_letter.toLowerCase() === letter.toLowerCase(),
    )
  }

  // Function to analyze a word for its root letters and meanings
  const analyzeRoots = (
    word: string,
  ): Array<{ letter: string; root?: EnochianRoot }> => {
    return Array.from(word.toLowerCase())
      .filter((char) => /[a-z]/i.test(char)) // Only analyze letters
      .map((letter) => ({
        letter,
        root: findRootMeaning(letter),
      }))
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

  // Extract first word for root analysis
  const getFirstWordForAnalysis = (): string => {
    if (!translationResult) return ''
    const firstWord = translationResult.split(' ')[0]
    return firstWord && !firstWord.match(/^\[.*\]$/) ? firstWord : ''
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  return loading ? (
    <Card className="w-full">
      <CardContent className="flex flex-col justify-center items-center h-64 py-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted">Loading Enochian dictionary...</p>
      </CardContent>
    </Card>
  ) : errorMessage ? (
    <Card className="w-full border-destructive">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle size={20} />
          <p>{errorMessage}</p>
        </div>
      </CardContent>
    </Card>
  ) : (
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

      {translationResult.length > 0 && (
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
                  <TabsTrigger value="phonetic" className="px-3">
                    Phonetic
                  </TabsTrigger>
                  <TabsTrigger value="original" className="px-3">
                    Words
                  </TabsTrigger>
                  <TabsTrigger value="symbol" className="px-3">
                    Symbols
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <CardDescription>
              {displayMode === 'original'
                ? 'Enochian words translated from English'
                : displayMode === 'phonetic'
                  ? 'Phonetic pronunciation using Enochian letter names'
                  : 'Visual representation using Enochian symbols'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="relative">
              <div className="bg-accent/30 rounded-md p-4 border min-h-28 whitespace-pre-wrap text-lg">
                {displayMode === 'original' && translationResult}
                {displayMode === 'phonetic' && phoneticResult}
                {displayMode === 'symbol' && (
                  <span className="text-xl tracking-wide">{symbolResult}</span>
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
                <p className="text-xs text-muted mt-3">
                  Words in [brackets] have no direct Enochian equivalent and
                  remain in English
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-0">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setRootDetailsView(!rootDetailsView)}
            >
              <BookOpen className="h-4 w-4" />
              <span>
                {rootDetailsView ? 'Hide Root Analysis' : 'Show Root Analysis'}
              </span>
            </Button>

            {rootDetailsView && (
              <div className="w-full mt-3 border-t pt-3">
                <h4 className="text-sm font-medium mb-2">
                  Enochian Root Analysis:
                </h4>
                <div className="bg-accent/30 rounded-md p-4 border">
                  {getFirstWordForAnalysis() ? (
                    <div className="space-y-3">
                      <p className="text-sm mb-1">
                        Analysis of:{' '}
                        <span className="font-semibold">
                          {getFirstWordForAnalysis()}
                        </span>
                      </p>
                      <div className="grid gap-2">
                        {analyzeRoots(getFirstWordForAnalysis()).map(
                          (item, idx) => (
                            <div
                              key={idx}
                              className="border-b border-border/30 pb-2 last:border-0 last:pb-0"
                            >
                              <p className="font-medium">
                                {item.letter.toUpperCase()} •{' '}
                                {item.root?.enochian_name || 'Unknown'}
                                {item.root && ` (${item.root.numeric_value})`}
                              </p>
                              {item.root ? (
                                <p className="text-sm text-muted">
                                  {item.root.meaning}
                                </p>
                              ) : (
                                <p className="text-sm text-muted italic">
                                  No root information available
                                </p>
                              )}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted italic">
                      Translate a phrase first to see root analysis of the first
                      Enochian word
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
