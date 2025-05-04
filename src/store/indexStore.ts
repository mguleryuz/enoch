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
  activeTab: string
  setShowInfo: (show: boolean) => void
  setDialogInfo: (info: DialogInfo) => void
  setActiveTab: (tab: string) => void
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
      activeTab: 'translator',
      setShowInfo: (showInfo) => set({ showInfo }),
      setDialogInfo: (dialogInfo) => set({ dialogInfo }),
      setActiveTab: (activeTab) => set({ activeTab }),
    }),
    {
      name: 'enochian-index-storage', // unique name for localStorage key
    },
  ),
)
