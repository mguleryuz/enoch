import { useQuery } from '@tanstack/react-query'
import { Translator, fetchLexiconData, fetchRootData } from '@/lib/translator'

export function useEnochianDictionary() {
  // Using React Query to load the translator service
  const query = useQuery({
    queryKey: ['enochianDictionary'],
    queryFn: async () => {
      const lexiconData = await fetchLexiconData()
      const rootData = await fetchRootData()
      return new Translator(lexiconData, rootData)
    },
  })

  return query
}
