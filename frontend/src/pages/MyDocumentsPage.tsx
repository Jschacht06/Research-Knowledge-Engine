import { EmptyState } from '../components/ui/EmptyState'
import { DocumentCard } from '../components/ui/DocumentCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { useDocuments } from '../hooks/useDocuments'

export function MyDocumentsPage() {
  const { documents, errorMessage, isLoading } = useDocuments()

  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Library"
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
      ) : documents.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard key={document.id} compact document={document} />
          ))}
        </div>
      ) : (
        <EmptyState
          description="Use the upload tab or the dashboard button to add your first document."
          title="Your document library is empty"
        />
      )}
    </section>
  )
}
