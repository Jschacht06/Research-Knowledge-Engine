import { Link } from 'react-router-dom'
import type { DocumentRecord } from '../../data/documents'
import {
  authorInitial,
  documentTopics,
  formatAuthorList,
  formatDocumentDate,
  statusAccent,
  topicAccent,
} from '../../utils/documents'

type DocumentCardProps = {
  document: DocumentRecord
  compact?: boolean
}

export function DocumentCard({ document, compact = false }: DocumentCardProps) {
  const topics = documentTopics(document)

  return (
    <Link
      className="group block h-full"
      to={`/app/documents/${document.id}`}
    >
      <article className="flex h-full flex-col rounded-[28px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)] transition duration-200 group-hover:-translate-y-1 group-hover:border-rke-teal/30 group-hover:shadow-[0_30px_80px_rgba(24,46,75,0.12)]">
        <div className="flex flex-wrap gap-2">
          {topics.length > 0 ? (
            topics.map((topic) => (
              <span
                key={topic}
                className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-bold ring-1 ${topicAccent(topic)}`}
              >
                {topic}
              </span>
            ))
          ) : (
            <span
              className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-bold ring-1 ${topicAccent(null)}`}
            >
              Uncategorized
            </span>
          )}
          <span
            className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-bold ring-1 ${statusAccent(document.status)}`}
          >
            {document.status ?? 'No status'}
          </span>
        </div>

        <h3
          className={`mt-5 font-bold tracking-tight text-rke-navy ${compact ? 'text-xl' : 'text-2xl'}`}
        >
          {document.title}
        </h3>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-rke-copy">
          <span className="grid size-8 place-items-center rounded-full bg-rke-teal text-xs font-bold text-white">
            {authorInitial(document.authors)}
          </span>
          <span>{formatAuthorList(document.authors)}</span>
          <span className="text-slate-300">&bull;</span>
          <span>{formatDocumentDate(document.createdAt)}</span>
        </div>

        <p
          className={`mt-4 text-sm leading-6 text-rke-copy ${compact ? 'line-clamp-3' : 'line-clamp-4'}`}
        >
          {document.abstract || 'No abstract was provided for this document yet.'}
        </p>
      </article>
    </Link>
  )
}
