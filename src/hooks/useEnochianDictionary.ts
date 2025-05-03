import { useQuery } from '@tanstack/react-query'
import { Translator, fetchLexiconData, fetchRootData } from '@/lib/translator'

export function useEnochianDictionary() {
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

  // Error message handling
  const error = translatorError
    ? `Error loading Enochian data: ${translatorError.toString()}`
    : lexiconError
      ? `Error loading Enochian lexicon: ${lexiconError.toString()}`
      : rootError
        ? `Error loading Enochian roots: ${rootError.toString()}`
        : undefined

  const loading = translatorLoading || lexiconLoading || rootLoading

  return {
    lexiconData,
    rootData,
    translator,
    loading,
    error,
  }
}
