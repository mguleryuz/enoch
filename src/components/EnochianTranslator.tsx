import { useEffect, useState } from 'react'
import { AlertCircle, BookOpen, Check, Copy, Info } from 'lucide-react'
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
import { Translator, fetchLexiconData, fetchRootData } from '@/lib/translator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
    constructed: number
    total: number
  }>({ direct: 0, partial: 0, missing: 0, constructed: 0, total: 0 })
  const [displayMode, setDisplayMode] = useState<
    'original' | 'phonetic' | 'symbol'
  >('phonetic')
  const [wordToAnalyze, setWordToAnalyze] = useState('')
  const [wordAnalysis, setWordAnalysis] = useState<
    Record<string, Array<{ letter: string; root?: any }>>
  >({})
  const [currentAnalysis, setCurrentAnalysis] = useState<
    Array<{ letter: string; root?: any }>
  >([])
  const [constructionDetails, setConstructionDetails] = useState<
    Record<
      string,
      {
        original: string
        result: string
        method: 'direct' | 'partial' | 'constructed' | 'missing'
        explanation: string
      }
    >
  >({})
  const [selectedWord, setSelectedWord] = useState<string | null>(null)

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

  // Using React Query to load the translator service
  const {
    data: translator,
    isLoading: translatorLoading,
    error: translatorError,
  } = useQuery({
    queryKey: ['enochianTranslator'],
    queryFn: async () => {
      return new Translator(lexiconData, rootData)
    },
    enabled: !!lexiconData.length && !!rootData.length,
  })

  // Update current analysis whenever wordToAnalyze or wordAnalysis changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const analysis = wordToAnalyze ? wordAnalysis[wordToAnalyze] || [] : []

    setCurrentAnalysis(analysis)
  }, [wordToAnalyze, wordAnalysis])

  // Error message handling
  const errorMessage = translatorError
    ? `Error loading Enochian data: ${translatorError.toString()}`
    : undefined

  const loading = translatorLoading || lexiconLoading || rootLoading

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  const handleTranslate = () => {
    if (!translator || !input.trim()) return

    // Use the base translator
    const result = translator.translateComplete(input)

    setTranslationResult(result.translationText)
    setPhoneticResult(result.phoneticText)
    setSymbolResult(result.symbolText)
    setMatchCounts(result.stats)
    setWordAnalysis(result.wordAnalysis)
    setConstructionDetails(result.constructionDetails)

    // Get first word for analysis if available
    const firstEnochianWord = getFirstWordForAnalysis(result.translationText)
    setWordToAnalyze(firstEnochianWord)
    setSelectedWord(null)
  }

  const handleCopy = (type: 'original' | 'phonetic' | 'symbol') => {
    let textToCopy = ''
    switch (type) {
      case 'phonetic':
        textToCopy = phoneticResult
        break
      case 'original':
        textToCopy = translationResult
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
  const getFirstWordForAnalysis = (text: string): string => {
    if (!text) return ''
    const firstWord = text.split(' ')[0]
    // Only return the word if it's a valid Enochian word (not marked with brackets)
    const isValidWord = firstWord && !firstWord.match(/^\[.*\]$/)
    return isValidWord ? firstWord : ''
  }

  const handleWordClick = (word: string) => {
    setSelectedWord(word)
    // Find the translated result for this word
    const details = constructionDetails[word]
    if (details && !details.result.startsWith('[')) {
      // Strip any punctuation from the result
      const cleanResult = details.result.replace(/[.,;:!?'"()-]/g, '')
      setWordToAnalyze(cleanResult)
    }
  }

  // Get badge color based on translation method
  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case 'direct':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'constructed':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'missing':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  // Replace the root analysis rendering section
  const renderRootAnalysis = () => {
    if (currentAnalysis.length === 0) {
      return (
        <p className="text-sm text-muted italic">
          Translate a phrase first to see root analysis of the first Enochian
          word
        </p>
      )
    }

    return (
      <div className="space-y-3">
        <p className="text-sm mb-1">
          Analysis of: <span className="font-semibold">{wordToAnalyze}</span>
        </p>
        <div className="grid gap-2">
          {currentAnalysis.map((item, idx) => (
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
                <p className="text-sm text-muted">{item.root.meaning}</p>
              ) : (
                <p className="text-sm text-muted italic">
                  No root information available
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Render the annotated translation output
  const renderAnnotatedTranslation = () => {
    const words = input.split(/\s+/)

    return words.map((word, index) => {
      const details = constructionDetails[word]
      // Use an empty string with a space as the default for words without details
      if (typeof details === 'undefined') {
        return <span key={index}>{word} </span>
      }

      // Create a class based on the translation method
      const methodClass = getMethodBadgeColor(details.method)

      return (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`cursor-pointer rounded px-1 mx-0.5 border ${
                  selectedWord === word ? 'ring-2 ring-primary' : ''
                } ${details.method === 'missing' ? '' : methodClass}`}
                onClick={() => handleWordClick(word)}
              >
                {details.result}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm">
              <div className="space-y-1 p-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{word}</span>
                  <Badge variant="outline" className={methodClass}>
                    {details.method}
                  </Badge>
                </div>
                <p className="text-xs">{details.explanation}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    })
  }

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
              {displayMode === 'original' ? (
                <div className="bg-accent/30 rounded-md p-4 border min-h-28 whitespace-pre-wrap text-lg">
                  {renderAnnotatedTranslation()}
                </div>
              ) : (
                <div className="bg-accent/30 rounded-md p-4 border min-h-28 whitespace-pre-wrap text-lg">
                  {displayMode === 'phonetic' && phoneticResult}
                  {displayMode === 'symbol' && (
                    <span className="text-xl tracking-wide">
                      {symbolResult}
                    </span>
                  )}
                </div>
              )}

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
                    className="flex items-center gap-1 py-1 px-2 bg-blue-100 text-blue-800 border-blue-300"
                  >
                    <Check className="h-3.5 w-3.5 text-blue-500" />
                    <span>
                      {matchCounts.constructed} constructed{' '}
                      {matchCounts.constructed === 1 ? 'word' : 'words'}
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
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 py-1 px-2"
                  >
                    <span>
                      {matchCounts.total} total{' '}
                      {matchCounts.total === 1 ? 'word' : 'words'}
                    </span>
                  </Badge>
                </div>
                <div className="mt-3 text-xs text-muted space-y-1">
                  <p>Words in [brackets] have no direct Enochian equivalent.</p>
                  <p>
                    Click on any translated word to see details on how it was
                    translated.
                  </p>
                  <p>
                    Color indicates translation method:{' '}
                    <span className="text-green-700">direct</span>,{' '}
                    <span className="text-yellow-700">partial</span>,{' '}
                    <span className="text-blue-700">constructed</span>, or{' '}
                    <span className="text-red-700">missing</span>.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col items-start pt-0">
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setRootDetailsView(!rootDetailsView)}
              >
                <BookOpen className="h-4 w-4" />
                <span>
                  {rootDetailsView
                    ? 'Hide Root Analysis'
                    : 'Show Root Analysis'}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setShowDetails(!showDetails)}
              >
                <Info className="h-4 w-4" />
                <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
              </Button>
            </div>

            {rootDetailsView && (
              <div className="w-full mt-3 border-t pt-3">
                <h4 className="text-sm font-medium mb-2">
                  Enochian Root Analysis:
                </h4>
                <div className="bg-accent/30 rounded-md p-4 border">
                  {renderRootAnalysis()}
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
