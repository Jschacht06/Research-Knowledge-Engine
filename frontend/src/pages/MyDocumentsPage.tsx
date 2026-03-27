import { DocumentCard } from '../components/ui/DocumentCard'
import { SectionHeading } from '../components/ui/SectionHeading'
import { documents } from '../data/documents'

export function MyDocumentsPage() {
  return (
    <section className="space-y-6">
      <SectionHeading
        eyebrow="Library"
        title="My documents"
      />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {documents.slice(0, 6).map((document) => (
          <DocumentCard key={`${document.title}-${document.dateISO}`} compact document={document} />
        ))}
      </div>
    </section>
  )
}
