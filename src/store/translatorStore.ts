import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Type definitions for the state
type MatchCounts = {
  direct: number
  partial: number
  missing: number
  constructed: number
  total: number
}

type ConstructionDetails = Record<
  string,
  {
    original: string
    result: string
    method: 'direct' | 'partial' | 'constructed' | 'missing'
    explanation: string
  }
>

type WordAnalysis = Record<string, Array<{ letter: string; root?: any }>>

type DialogContent = {
  word: string
  result: string
  method: string
  explanation: string
}

interface TranslatorState {
  // Input and translation results
  input: string
  translationResult: string
  phoneticResult: string
  symbolResult: string

  // Analysis data
  matchCounts: MatchCounts
  wordToAnalyze: string
  wordAnalysis: WordAnalysis
  currentAnalysis: Array<{ letter: string; root?: any }>
  constructionDetails: ConstructionDetails
  selectedWord: string | null
  phraseMatches: Record<string, string>
  hoverSelectEnabled: boolean

  // Mobile dialog
  dialogOpen: boolean
  dialogContent: DialogContent

  // Actions
  setInput: (input: string) => void
  setTranslationResult: (result: string) => void
  setPhoneticResult: (result: string) => void
  setSymbolResult: (result: string) => void
  setMatchCounts: (counts: MatchCounts) => void
  setWordToAnalyze: (word: string) => void
  setWordAnalysis: (analysis: WordAnalysis) => void
  setCurrentAnalysis: (analysis: Array<{ letter: string; root?: any }>) => void
  setConstructionDetails: (details: ConstructionDetails) => void
  setSelectedWord: (word: string | null) => void
  setPhraseMatches: (matches: Record<string, string>) => void
  setDialogOpen: (open: boolean) => void
  setDialogContent: (content: DialogContent) => void
  setHoverSelectEnabled: (enabled: boolean) => void
  resetState: () => void
}

// Initial state values
const initialState = {
  input: '',
  translationResult: '',
  phoneticResult: '',
  symbolResult: '',
  matchCounts: { direct: 0, partial: 0, missing: 0, constructed: 0, total: 0 },
  wordToAnalyze: '',
  wordAnalysis: {},
  currentAnalysis: [],
  constructionDetails: {},
  selectedWord: null,
  phraseMatches: {},
  dialogOpen: false,
  dialogContent: { word: '', result: '', method: '', explanation: '' },
  hoverSelectEnabled: false,
}

export const useTranslatorStore = create<TranslatorState>()(
  persist(
    (set) => ({
      ...initialState,

      // Set actions
      setInput: (input) => set({ input }),
      setTranslationResult: (translationResult) => set({ translationResult }),
      setPhoneticResult: (phoneticResult) => set({ phoneticResult }),
      setSymbolResult: (symbolResult) => set({ symbolResult }),
      setMatchCounts: (matchCounts) => set({ matchCounts }),
      setWordToAnalyze: (wordToAnalyze) => set({ wordToAnalyze }),
      setWordAnalysis: (wordAnalysis) => set({ wordAnalysis }),
      setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),
      setConstructionDetails: (constructionDetails) =>
        set({ constructionDetails }),
      setSelectedWord: (selectedWord) => set({ selectedWord }),
      setPhraseMatches: (phraseMatches) => set({ phraseMatches }),
      setDialogOpen: (dialogOpen) => set({ dialogOpen }),
      setDialogContent: (dialogContent) => set({ dialogContent }),
      setHoverSelectEnabled: (hoverSelectEnabled) =>
        set({ hoverSelectEnabled }),

      // Reset all state
      resetState: () => set(initialState),
    }),
    {
      name: 'enochian-translator-storage', // unique name for localStorage key
      // Optional: select which parts of the state to persist
      partialize: (state) => ({
        input: state.input,
        translationResult: state.translationResult,
        phoneticResult: state.phoneticResult,
        symbolResult: state.symbolResult,
        matchCounts: state.matchCounts,
        wordToAnalyze: state.wordToAnalyze,
        selectedWord: state.selectedWord,
        hoverSelectEnabled: state.hoverSelectEnabled,
        // We don't need to persist these as they can be reconstructed:
        // wordAnalysis, currentAnalysis, constructionDetails, phraseMatches
      }),
    },
  ),
)
