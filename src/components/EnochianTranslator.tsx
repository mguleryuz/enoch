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
import { EnhancedEnochianTranslator } from '@/lib/enhanced-translator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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
  const [enhancedResult, setEnhancedResult] = useState<string>('')
  const [showDetails, setShowDetails] = useState(false)
  const [rootDetailsView, setRootDetailsView] = useState(false)
  const [matchCounts, setMatchCounts] = useState<{
    direct: number
    partial: number
    missing: number
    total: number
  }>({ direct: 0, partial: 0, missing: 0, total: 0 })
  const [displayMode, setDisplayMode] = useState<
    'original' | 'phonetic' | 'symbol' | 'enhanced'
  >('enhanced')
  const [wordToAnalyze, setWordToAnalyze] = useState('')
  const [wordAnalysis, setWordAnalysis] = useState<
    Record<string, Array<{ letter: string; root?: any }>>
  >({})
  const [currentAnalysis, setCurrentAnalysis] = useState<
    Array<{ letter: string; root?: any }>
  >([])
  const [meaningAnalysis, setMeaningAnalysis] = useState<
    Array<{
      english: string
      enochian: string
      source: 'lexicon' | 'root-analysis' | 'special-case'
      details?: string
    }>
  >([])

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
      return new EnhancedEnochianTranslator(lexiconData, rootData)
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

    // Use the enhanced translator
    const result = translator.translateEnhanced(input)

    setTranslationResult(result.translationText)
    setPhoneticResult(result.phoneticText)
    setSymbolResult(result.symbolText)
    setEnhancedResult(result.rootBasedTranslation)
    setMatchCounts(result.stats)
    setWordAnalysis(result.wordAnalysis)
    setMeaningAnalysis(result.meaningAnalysis)

    // Get first word for analysis if available
    const firstEnochianWord = getFirstWordForAnalysis(result.translationText)
    setWordToAnalyze(firstEnochianWord)
  }

  const handleCopy = (
    type: 'original' | 'phonetic' | 'symbol' | 'enhanced',
  ) => {
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
      case 'enhanced':
        textToCopy = enhancedResult
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

  // Render word-by-word meaning analysis
  const renderMeaningAnalysis = () => {
    if (meaningAnalysis.length === 0) {
      return (
        <p className="text-sm text-muted italic">
          Translate a phrase first to see word-by-word analysis
        </p>
      )
    }

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium mb-2">Word-by-Word Analysis:</h4>
        <div className="grid gap-2">
          {meaningAnalysis.map((analysis, idx) => (
            <div
              key={idx}
              className="border-b border-border/30 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-center gap-2">
                <p className="font-medium">
                  <span className="text-muted">{analysis.english}</span> →{' '}
                  <span className="font-bold">{analysis.enochian}</span>
                </p>
                <Badge variant="outline" className="ml-1">
                  {analysis.source === 'lexicon'
                    ? 'Dictionary'
                    : analysis.source === 'special-case'
                      ? 'Special Case'
                      : 'Root Analysis'}
                </Badge>
              </div>
              {analysis.details && (
                <p className="text-xs text-muted mt-1">{analysis.details}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    )
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
                  setDisplayMode(
                    value as 'original' | 'phonetic' | 'symbol' | 'enhanced',
                  )
                }
                className="w-auto"
              >
                <TabsList className="grid grid-cols-4 h-9">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <TabsTrigger value="enhanced" className="px-3">
                          Enhanced
                        </TabsTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Enhanced translation uses both dictionary matches and
                          letter-by-letter root analysis for words not found in
                          the lexicon
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
                  : displayMode === 'symbol'
                    ? 'Visual representation using Enochian symbols'
                    : 'Enhanced translation using both dictionary and root analysis'}
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
                {displayMode === 'enhanced' && enhancedResult}
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
                <p className="text-xs text-muted mt-3">
                  Words in [brackets] have no direct Enochian equivalent. In
                  enhanced mode, these show root-based translations.
                </p>
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
                <span>
                  {showDetails ? 'Hide Word Analysis' : 'Show Word Analysis'}
                </span>
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

            {showDetails && (
              <div className="w-full mt-3 border-t pt-3">
                <div className="bg-accent/30 rounded-md p-4 border">
                  {renderMeaningAnalysis()}
                </div>
              </div>
            )}
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
