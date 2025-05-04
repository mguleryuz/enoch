import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DialogInfo {
  title: string
  content: string
  isOpen: boolean
}

interface IndexState {
  showInfo: boolean
  dialogInfo: DialogInfo
  setShowInfo: (show: boolean) => void
  setDialogInfo: (info: DialogInfo) => void
}

export const useIndexStore = create<IndexState>()(
  persist(
    (set) => ({
      showInfo: true,
      dialogInfo: {
        title: '',
        content: '',
        isOpen: false,
      },
      setShowInfo: (showInfo) => set({ showInfo }),
      setDialogInfo: (dialogInfo) => set({ dialogInfo }),
    }),
    {
      name: 'enochian-index-storage', // unique name for localStorage key
    },
  ),
)
