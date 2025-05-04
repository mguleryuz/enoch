import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AlphabetState {
  activeLetterIndex: number | null
  setActiveLetterIndex: (index: number | null) => void
}

export const useAlphabetStore = create<AlphabetState>()(
  persist(
    (set) => ({
      activeLetterIndex: null,
      setActiveLetterIndex: (activeLetterIndex) => set({ activeLetterIndex }),
    }),
    {
      name: 'enochian-alphabet-storage', // unique name for localStorage key
    },
  ),
)
