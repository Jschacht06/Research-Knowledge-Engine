import { useEffect, useState } from 'react'
import type { DocumentRecord } from '../data/documents'
import { useAuth } from './useAuth'
import { fetchDocuments } from '../lib/documents'

export function useDocuments() {
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
        const nextDocuments = await fetchDocuments(token)
        if (!cancelled) {
          setDocuments(nextDocuments)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load your documents.',
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
  }, [token])

  return {
    documents,
    isLoading,
    errorMessage,
    setDocuments,
  }
}
