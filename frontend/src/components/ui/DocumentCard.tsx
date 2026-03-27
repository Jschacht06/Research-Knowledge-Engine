import type { DocumentRecord } from '../../data/documents'
import { authorInitial, topicAccent } from '../../utils/documents'

type DocumentCardProps = {
  document: DocumentRecord
  compact?: boolean
}

export function DocumentCard({ document, compact = false }: DocumentCardProps) {
  return (
    <article className="flex h-full flex-col rounded-[28px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
      <span
        className={`inline-flex w-fit items-center rounded-full px-4 py-2 text-xs font-bold ring-1 ${topicAccent(document.topic)}`}
      >
        {document.topic}
      </span>

      <h3
        className={`mt-5 font-bold tracking-tight text-rke-navy ${compact ? 'text-xl' : 'text-2xl'}`}
      >
        {document.title}
      </h3>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-rke-copy">
        <span className="grid size-8 place-items-center rounded-full bg-rke-teal text-xs font-bold text-white">
          {authorInitial(document.author)}
        </span>
        <span>{document.author}</span>
        <span className="text-slate-300">&bull;</span>
        <span>{document.date}</span>
      </div>

      <p
        className={`mt-4 text-sm leading-6 text-rke-copy ${compact ? 'line-clamp-3' : 'line-clamp-4'}`}
      >
        {document.summary}
      </p>

      <button
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-rke-teal px-4 py-3 font-semibold text-rke-teal transition hover:bg-rke-teal hover:text-white"
        type="button"
      >
        View document
      </button>
    </article>
  )
}
