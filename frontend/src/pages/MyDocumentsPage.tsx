import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { DocumentCard } from '../components/ui/DocumentCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useDocuments } from '../hooks/useDocuments'
import { searchDocuments } from '../utils/documents'

export function MyDocumentsPage() {
  const { documents, errorMessage, isLoading } = useDocuments('mine')
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const filteredDocuments = useMemo(
    () => searchDocuments(documents, searchQuery),
    [documents, searchQuery],
  )

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Library"
        description={
          searchQuery
            ? `Showing documents that match "${searchQuery}".`
            : undefined
        }
        title="My documents"
      />

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
            <DocumentCard key={document.id} compact document={document} />
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
