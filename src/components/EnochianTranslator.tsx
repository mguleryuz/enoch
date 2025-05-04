import { useCallback, useEffect } from 'react'
import { AlertCircle, Check, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Separator } from './ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useEnochianDictionary } from '@/hooks/useEnochianDictionary'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'
import { useTranslatorStore } from '@/store/translatorStore'
import { useDebounce } from '@/hooks/useDebounce'

export default function EnochianTranslator() {
  // Use Zustand store instead of useState hooks
  const {
    input,
    translationResult,
    phoneticResult,
    symbolResult,
    matchCounts,
    wordToAnalyze,
    wordAnalysis,
    currentAnalysis,
    constructionDetails,
    selectedWord,
    phraseMatches,
    dialogOpen,
    dialogContent,
    hoverSelectEnabled,
    setInput,
    setTranslationResult,
    setPhoneticResult,
    setSymbolResult,
    setMatchCounts,
    setWordToAnalyze,
    setWordAnalysis,
    setCurrentAnalysis,
    setConstructionDetails,
    setSelectedWord,
    setPhraseMatches,
    setDialogOpen,
    setDialogContent,
    setHoverSelectEnabled,
    resetState,
  } = useTranslatorStore()

  // Media query hook to detect mobile
  const isMobile = useMediaQuery('(max-width: 768px)')

  // Use the custom dictionary hook
  const { data: translator, isLoading, error } = useEnochianDictionary()

  // Debounce the input value to avoid excessive translations
  const debouncedInput = useDebounce(input, 500)

  // Update current analysis whenever wordToAnalyze or wordAnalysis changes
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const analysis = wordToAnalyze ? wordAnalysis[wordToAnalyze] || [] : []

    setCurrentAnalysis(analysis)
  }, [wordToAnalyze, wordAnalysis, setCurrentAnalysis])

  // Auto-translate effect using debounced input
  useEffect(() => {
    if (!translator) return

    if (!debouncedInput.trim()) {
      // Reset results if input is empty
      resetState()
      return
    }

    // Translate the input
    const result = translator.translate(debouncedInput)

    setTranslationResult(result.translationText)
    setPhoneticResult(result.phoneticText)
    setSymbolResult(result.symbolText)
    setMatchCounts(result.stats)
    setWordAnalysis(result.wordAnalysis)
    setConstructionDetails(result.constructionDetails)
    setPhraseMatches(result.phraseMatches)

    // Get first word for analysis if available
    const firstEnochianWord = getFirstWordForAnalysis(result.translationText)
    setWordToAnalyze(firstEnochianWord)

    // Set the first word as selected by default
    const firstInputWord = debouncedInput.trim().split(/\s+/)[0]
    setSelectedWord(firstInputWord)
  }, [
    debouncedInput,
    translator,
    setTranslationResult,
    setPhoneticResult,
    setSymbolResult,
    setMatchCounts,
    setWordAnalysis,
    setConstructionDetails,
    setPhraseMatches,
    setWordToAnalyze,
    setSelectedWord,
    resetState,
  ])

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }

  // Manual translation function (kept for backward compatibility)
  const handleTranslate = useCallback(() => {
    if (!translator || !input.trim()) return

    // Use the base translator
    const result = translator.translate(input)

    setTranslationResult(result.translationText)
    setPhoneticResult(result.phoneticText)
    setSymbolResult(result.symbolText)
    setMatchCounts(result.stats)
    setWordAnalysis(result.wordAnalysis)
    setConstructionDetails(result.constructionDetails)
    setPhraseMatches(result.phraseMatches)

    // Get first word for analysis if available
    const firstEnochianWord = getFirstWordForAnalysis(result.translationText)
    setWordToAnalyze(firstEnochianWord)

    // Set the first word as selected by default
    const firstInputWord = input.trim().split(/\s+/)[0]
    setSelectedWord(firstInputWord)
  }, [
    input,
    translator,
    setTranslationResult,
    setPhoneticResult,
    setSymbolResult,
    setMatchCounts,
    setWordAnalysis,
    setConstructionDetails,
    setPhraseMatches,
    setWordToAnalyze,
    setSelectedWord,
  ])

  const handleCopy = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text)
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

    // If it's a valid word, check if it's a negated word (G-prefixed)
    if (isValidWord && firstWord.startsWith('G-')) {
      // Return the negated word with the hyphen preserved
      return firstWord
    }

    return isValidWord ? firstWord : ''
  }

  const handleWordClick = (word: string) => {
    setSelectedWord(word)

    if (Object.prototype.hasOwnProperty.call(constructionDetails, word)) {
      const details = constructionDetails[word]

      // For mobile, open dialog with word details
      if (isMobile) {
        setDialogContent({
          word,
          result: details.result,
          method: details.method,
          explanation: details.explanation,
        })
        setDialogOpen(true)
      }

      // Special handling for negated words (G-something)
      if (details.result.startsWith('G-')) {
        // For negated words, only remove punctuation except for the hyphen
        setWordToAnalyze(details.result)
      } else {
        // Strip any punctuation from the result
        const cleanResult = details.result.replace(/[.,;:!?'"()-]/g, '')
        setWordToAnalyze(cleanResult)
      }
    }
  }

  // Handle phrase click (for mobile)
  const handlePhraseClick = (phrase: string, enochianWord: string) => {
    setSelectedWord(phrase)
    setWordToAnalyze(enochianWord)

    // For mobile, show phrase details in dialog
    if (
      isMobile &&
      Object.prototype.hasOwnProperty.call(constructionDetails, phrase)
    ) {
      const details = constructionDetails[phrase]
      setDialogContent({
        word: phrase,
        result: enochianWord,
        method: 'phrase match',
        explanation:
          details.explanation ||
          `Phrase match: "${phrase}" → "${enochianWord}"`,
      })
      setDialogOpen(true)
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

  // Modify renderAnnotatedTranslation to handle mobile differently
  const renderAnnotatedTranslation = () => {
    const words = input.split(/\s+/)
    const result: Array<React.ReactElement> = []

    // Track which words have been processed (for phrase matches)
    const processedIndices = new Set<number>()

    // First, try to identify all phrase matches
    for (let i = 0; i < words.length; i++) {
      // Skip already processed words
      if (processedIndices.has(i)) continue

      // Try multi-word phrases of decreasing length
      for (let len = Math.min(5, words.length - i); len > 1; len--) {
        const phraseWords = words.slice(i, i + len)
        const phrase = phraseWords.join(' ')

        // Check if this is a matching phrase
        if (Object.prototype.hasOwnProperty.call(phraseMatches, phrase)) {
          // This is a phrase match!
          const enochianWord = phraseMatches[phrase]

          if (isMobile) {
            // Mobile version (no tooltip)
            result.push(
              <span
                key={`phrase-${i}`}
                className={`cursor-pointer rounded px-2 py-1 mx-1 my-1 inline-block border bg-purple-100 text-purple-800 border-purple-300 font-medium ${
                  selectedWord === phrase
                    ? 'ring-2 ring-primary bg-purple-200'
                    : ''
                }`}
                onClick={() => handlePhraseClick(phrase, enochianWord)}
                onMouseEnter={() =>
                  hoverSelectEnabled && handlePhraseClick(phrase, enochianWord)
                }
              >
                {enochianWord}
                <div className="text-xs text-black mt-1">({phrase})</div>
              </span>,
            )
          } else {
            // Desktop version (with tooltip)
            result.push(
              <TooltipProvider key={`phrase-${i}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`cursor-pointer rounded px-2 py-1 mx-1 my-1 inline-block border bg-purple-100 text-purple-800 border-purple-300 font-medium ${
                        selectedWord === phrase
                          ? 'ring-2 ring-primary bg-purple-200'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedWord(phrase)
                        setWordToAnalyze(enochianWord)
                      }}
                      onMouseEnter={() => {
                        if (hoverSelectEnabled) {
                          setSelectedWord(phrase)
                          setWordToAnalyze(enochianWord)
                        }
                      }}
                    >
                      {enochianWord}
                      <div className="text-xs text-black mt-1">({phrase})</div>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="space-y-1 p-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">{phrase}</span>
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800 border-purple-300"
                        >
                          phrase match
                        </Badge>
                      </div>
                      <p className="text-xs">
                        {Object.prototype.hasOwnProperty.call(
                          constructionDetails,
                          phrase,
                        )
                          ? constructionDetails[phrase].explanation
                          : `Phrase match: "${phrase}" → "${enochianWord}"`}
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>,
            )
          }

          // Add a space after each phrase
          result.push(<span key={`space-after-phrase-${i}`}> </span>)

          // Mark all these words as processed
          for (let j = i; j < i + len; j++) {
            processedIndices.add(j)
          }

          // Skip ahead
          i += len - 1
          break
        }
      }

      // If no phrase match was found, process as a single word
      if (!processedIndices.has(i)) {
        const word = words[i]

        // Check if we have construction details for this word
        if (!Object.prototype.hasOwnProperty.call(constructionDetails, word)) {
          result.push(<span key={`word-${i}`}>{word} </span>)
        } else {
          const details = constructionDetails[word]
          const methodClass = getMethodBadgeColor(details.method)

          if (isMobile) {
            // Mobile version (no tooltip)
            result.push(
              <span
                key={`word-${i}`}
                className={`cursor-pointer rounded px-2 py-1 mx-1 my-1 inline-block border ${
                  selectedWord === word
                    ? 'ring-2 ring-primary bg-opacity-70'
                    : ''
                } ${details.method === 'missing' ? '' : methodClass}`}
                onClick={() => handleWordClick(word)}
                onMouseEnter={() => handleWordHover(word)}
              >
                {details.result}
                <div className="text-xs text-black mt-1">({word})</div>
              </span>,
            )
          } else {
            // Desktop version (with tooltip)
            result.push(
              <TooltipProvider key={`word-${i}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={`cursor-pointer rounded px-2 py-1 mx-1 my-1 inline-block border ${
                        selectedWord === word
                          ? 'ring-2 ring-primary bg-opacity-70'
                          : ''
                      } ${details.method === 'missing' ? '' : methodClass}`}
                      onClick={() => handleWordClick(word)}
                      onMouseEnter={() => handleWordHover(word)}
                    >
                      {details.result}
                      <div className="text-xs text-black mt-1">({word})</div>
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
              </TooltipProvider>,
            )
          }

          // Add a space after each word
          result.push(<span key={`space-after-word-${i}`}> </span>)
        }

        processedIndices.add(i)
      }
    }

    return result
  }

  // Handle phonetic word click
  const handlePhoneticClick = (phoneticWord: string, index: number) => {
    // Find the corresponding English word
    const originalWords = input.split(/\s+/)
    // If we have a valid index and it's within range
    if (index >= 0 && index < originalWords.length) {
      const englishWord = originalWords[index]
      setSelectedWord(englishWord)

      // Handle word analysis (same logic as handleWordClick)
      if (
        Object.prototype.hasOwnProperty.call(constructionDetails, englishWord)
      ) {
        const details = constructionDetails[englishWord]

        // For mobile, open dialog with word details
        if (isMobile) {
          setDialogContent({
            word: englishWord,
            result: details.result,
            method: details.method,
            explanation: details.explanation,
          })
          setDialogOpen(true)
        }

        // Handle word analysis
        if (details.result.startsWith('G-')) {
          setWordToAnalyze(details.result)
        } else {
          const cleanResult = details.result.replace(/[.,;:!?'"()-]/g, '')
          setWordToAnalyze(cleanResult)
        }
      }
    }
  }

  // Handle word hover for hover selection mode
  const handleWordHover = (word: string) => {
    if (hoverSelectEnabled) {
      handleWordClick(word)
    }
  }

  // Handle phonetic word hover for hover selection mode
  const handlePhoneticHover = (phoneticWord: string, index: number) => {
    if (hoverSelectEnabled) {
      handlePhoneticClick(phoneticWord, index)
    }
  }

  return isLoading ? (
    <Card className="w-full">
      <CardContent className="flex flex-col justify-center items-center h-64 py-6">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted">Loading Enochian dictionary...</p>
      </CardContent>
    </Card>
  ) : error ? (
    <Card className="w-full border-destructive">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 text-destructive">
          <AlertCircle size={20} />
          <p>{error.toString()}</p>
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
            Type English words or phrases below to auto-translate to Enochian
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
                  onClick={() => setInput('')}
                  disabled={!input}
                >
                  Clear
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted italic">
              Results are automatically updated as you type. Press Ctrl+Enter to
              translate manually.
            </p>
          </div>
        </CardContent>
      </Card>

      {translationResult.length > 0 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle>Enochian Translation</CardTitle>
            <CardDescription>
              View translation in all display modes: words, phonetic, and
              symbols
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Translation Details */}
              <div>
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
                  {Object.keys(phraseMatches).length > 0 && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1 py-1 px-2 bg-purple-100 text-purple-800 border-purple-300"
                    >
                      <Check className="h-3.5 w-3.5 text-purple-500" />
                      <span>
                        {Object.keys(phraseMatches).length} phrase{' '}
                        {Object.keys(phraseMatches).length === 1
                          ? 'match'
                          : 'matches'}
                      </span>
                    </Badge>
                  )}
                </div>
                <div className="flex items-center mt-4 space-x-2">
                  <Switch
                    id="hover-select"
                    checked={hoverSelectEnabled}
                    onCheckedChange={setHoverSelectEnabled}
                  />
                  <label
                    htmlFor="hover-select"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Enable hover selection
                  </label>
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
                    <span className="text-blue-700">constructed</span>,{' '}
                    <span className="text-red-700">missing</span>, or{' '}
                    <span className="text-purple-700">phrase match</span>.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Words Display */}
              <div>
                <h3 className="text-sm font-medium mb-2">Words:</h3>
                <div className="relative">
                  <div className="bg-accent/30 rounded-md p-4 pr-10 pt-8 border min-h-28 whitespace-pre-wrap text-lg break-words overflow-auto">
                    {renderAnnotatedTranslation()}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => handleCopy(translationResult)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Phonetic Display */}
              <div>
                <h3 className="text-sm font-medium mb-2">Phonetic:</h3>
                <div className="relative">
                  <div className="bg-accent/30 rounded-md p-4 pr-10 pt-8 border min-h-28 whitespace-pre-wrap text-lg break-words overflow-auto">
                    {phoneticResult.split(' ').map((word, index) => {
                      // Find corresponding original word to check if it's selected
                      const originalWords = input.split(/\s+/)
                      const isSelected = selectedWord === originalWords[index]

                      return (
                        <span
                          key={`phonetic-word-${index}`}
                          className={`inline-block rounded px-1.5 py-0.5 m-0.5 border cursor-pointer ${
                            isSelected
                              ? 'bg-primary/20 border-primary ring-1 ring-primary'
                              : 'bg-secondary border-border/30'
                          }`}
                          onClick={() => handlePhoneticClick(word, index)}
                          onMouseEnter={() => handlePhoneticHover(word, index)}
                        >
                          {word}
                        </span>
                      )
                    })}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => handleCopy(phoneticResult)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Root Analysis */}
              <div className="w-full">
                <h4 className="text-sm font-medium mb-2">
                  Enochian Root Analysis:
                </h4>
                <div className="bg-accent/30 rounded-md p-4 border break-words overflow-auto">
                  {renderRootAnalysis()}
                </div>
              </div>

              {/* Symbol Display */}
              <div>
                <h3 className="text-sm font-medium mb-2">Symbols:</h3>
                <div className="relative">
                  <div className="bg-accent/30 rounded-md p-4 pr-10 pt-8 border min-h-28 whitespace-pre-wrap text-lg break-words overflow-auto">
                    <span className="text-xl tracking-wide">
                      {symbolResult}
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="absolute top-3 right-3 h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => handleCopy(symbolResult)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile Word Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{dialogContent.word}</span>
              <Badge
                variant="outline"
                className={cn(
                  'mr-4',
                  getMethodBadgeColor(dialogContent.method),
                )}
              >
                {dialogContent.method}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-3">
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">Translated to:</span>
              <span className="text-base">{dialogContent.result}</span>
            </div>
            <div>
              <span className="text-sm font-medium">Explanation:</span>
              <p className="text-sm mt-1">{dialogContent.explanation}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
