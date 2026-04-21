import { useEffect, useState } from 'react'
import type { DocumentRecord } from '../data/documents'
import { useAuth } from './useAuth'
import { fetchDocuments, fetchMyDocuments } from '../lib/documents'

type DocumentScope = 'all' | 'mine'

export function useDocuments(scope: DocumentScope = 'all') {
  const { token } = useAuth()
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadDocuments() {
      if (!token) {
        setDocuments([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextDocuments =
          scope === 'mine'
            ? await fetchMyDocuments(token)
            : await fetchDocuments(token)
        if (!cancelled) {
          setDocuments(nextDocuments)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load documents.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDocuments()

    return () => {
      cancelled = true
    }
  }, [scope, token])

  return {
    documents,
    isLoading,
    errorMessage,
    setDocuments,
  }
}
