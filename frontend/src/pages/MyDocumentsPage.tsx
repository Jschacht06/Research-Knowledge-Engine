import { Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { EmptyState } from '../components/ui/EmptyState'
import { DocumentCard } from '../components/ui/DocumentCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { DocumentRecord } from '../data/documents'
import { useAuth } from '../hooks/useAuth'
import { useDocuments } from '../hooks/useDocuments'
import { deleteDocument } from '../lib/documents'
import { searchDocuments } from '../utils/documents'

export function MyDocumentsPage() {
  const { token } = useAuth()
  const { documents, errorMessage, isLoading, setDocuments } = useDocuments('mine')
  const [searchParams] = useSearchParams()
  const [deletingDocumentId, setDeletingDocumentId] = useState<number | null>(null)
  const [documentToDelete, setDocumentToDelete] = useState<DocumentRecord | null>(null)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null)
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const filteredDocuments = useMemo(
    () => searchDocuments(documents, searchQuery),
    [documents, searchQuery],
  )

  async function handleConfirmDeleteDocument() {
    if (!token || !documentToDelete || deletingDocumentId !== null) {
      return
    }

    setDeletingDocumentId(documentToDelete.id)
    setDeleteErrorMessage(null)

    try {
      await deleteDocument(token, documentToDelete.id)
      setDocuments((currentDocuments) =>
        currentDocuments.filter((document) => document.id !== documentToDelete.id),
      )
      setDocumentToDelete(null)
    } catch (error) {
      setDeleteErrorMessage(
        error instanceof Error ? error.message : 'Could not delete the document.',
      )
    } finally {
      setDeletingDocumentId(null)
    }
  }

  return (
    <section className="space-y-6">
      <ConfirmDialog
        confirmLabel="Delete document"
        description={
          documentToDelete
            ? `"${documentToDelete.title}" will be removed from the library and AI search. This action cannot be undone.`
            : ''
        }
        isOpen={documentToDelete !== null}
        isPending={deletingDocumentId !== null}
        onCancel={() => setDocumentToDelete(null)}
        onConfirm={() => void handleConfirmDeleteDocument()}
        title="Delete this document?"
      />

      <SectionHeading
        eyebrow="Library"
        description={
          searchQuery
            ? `Showing documents that match "${searchQuery}".`
            : undefined
        }
        title="My documents"
      />

      {deleteErrorMessage && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {deleteErrorMessage}
        </div>
      )}

      {errorMessage ? (
        <EmptyState
          description={errorMessage}
          title="Could not load your library"
        />
      ) : isLoading ? (
        <EmptyState
          description="Loading your uploaded documents..."
          title="Fetching documents"
        />
      ) : filteredDocuments.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDocuments.map((document) => (
            <div key={document.id} className="relative">
              <button
                className="absolute right-4 top-4 z-10 inline-flex size-10 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={deletingDocumentId !== null}
                onClick={() => setDocumentToDelete(document)}
                title="Delete document"
                type="button"
              >
                <Trash2 size={17} />
              </button>
              <DocumentCard compact document={document} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          description={
            searchQuery
              ? 'Try a different search term or clear the workspace search bar.'
              : 'Use the upload tab or the dashboard button to add your first document.'
          }
          title={searchQuery ? 'No documents match your search' : 'Your document library is empty'}
        />
      )}
    </section>
  )
}
