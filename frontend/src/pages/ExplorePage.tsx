import { Calendar, Grid2x2, List, ListFilter } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DocumentCard } from '../components/ui/DocumentCard'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/ui/SectionHeading'
import {
  documentStatusOptions,
  type DocumentStatus,
  type SortOrder,
  topicOptions,
  type TopicName,
} from '../data/documents'
import { useDocuments } from '../hooks/useDocuments'
import { filterDocuments, searchDocuments, statusAccent } from '../utils/documents'

export function ExplorePage() {
  const { documents, errorMessage, isLoading } = useDocuments()
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get('q')?.trim() ?? ''
  const [selectedTopics, setSelectedTopics] = useState<TopicName[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<DocumentStatus[]>([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [authorQuery, setAuthorQuery] = useState('')
  const [sortOrder, setSortOrder] = useState<SortOrder>('Newest')

  const filteredDocuments = useMemo(
    () => {
      const scopedDocuments = searchDocuments(documents, searchQuery)
      return filterDocuments(scopedDocuments, {
        selectedTopics,
        selectedStatuses,
        fromDate,
        toDate,
        authorQuery,
        sortOrder,
      })
    },
    [authorQuery, documents, fromDate, searchQuery, selectedStatuses, selectedTopics, sortOrder, toDate],
  )

  function toggleTopic(topic: TopicName) {
    setSelectedTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic],
    )
  }

  function toggleStatus(status: DocumentStatus) {
    setSelectedStatuses((current) =>
      current.includes(status)
        ? current.filter((item) => item !== status)
        : [...current, status],
    )
  }

  function resetFilters() {
    setSelectedTopics([])
    setSelectedStatuses([])
    setFromDate('')
    setToDate('')
    setAuthorQuery('')
    setSortOrder('Newest')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[30px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <div className="flex items-center gap-3 text-rke-navy">
          <div className="grid size-11 place-items-center rounded-2xl bg-rke-teal-soft text-rke-teal">
            <ListFilter size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Filters</h2>
            <p className="text-sm text-rke-copy">Refine the research dataset</p>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-rke-copy">
            Research Topic
          </h3>
          <div className="mt-4 grid gap-3">
            {topicOptions.map((topic) => (
              <label
                key={topic}
                className="flex items-center gap-3 rounded-2xl border border-rke-border/70 px-3 py-3 text-sm text-rke-copy transition hover:border-rke-teal/40 hover:bg-rke-surface"
              >
                <input
                  checked={selectedTopics.includes(topic)}
                  className="size-4 accent-rke-teal"
                  onChange={() => toggleTopic(topic)}
                  type="checkbox"
                />
                {topic}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-rke-copy">
            Document State
          </h3>
          <div className="mt-4 grid gap-3">
            {documentStatusOptions.map((status) => (
              <label
                key={status}
                className="flex items-center gap-3 rounded-2xl border border-rke-border/70 px-3 py-3 text-sm text-rke-copy transition hover:border-rke-teal/40 hover:bg-rke-surface"
              >
                <input
                  checked={selectedStatuses.includes(status)}
                  className="size-4 accent-rke-teal"
                  onChange={() => toggleStatus(status)}
                  type="checkbox"
                />
                <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${statusAccent(status)}`}>
                  {status}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-rke-copy">
            Date Range
          </h3>
          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 rounded-2xl border border-rke-border/70 px-4 py-3 text-rke-copy">
              <input
                className="w-full border-none bg-transparent text-sm text-rke-navy outline-none placeholder:text-slate-400"
                onChange={(event) => setFromDate(event.target.value)}
                placeholder="dd-mm-yyyy"
                type="text"
                value={fromDate}
              />
              <Calendar size={18} />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-rke-border/70 px-4 py-3 text-rke-copy">
              <input
                className="w-full border-none bg-transparent text-sm text-rke-navy outline-none placeholder:text-slate-400"
                onChange={(event) => setToDate(event.target.value)}
                placeholder="dd-mm-yyyy"
                type="text"
                value={toDate}
              />
              <Calendar size={18} />
            </label>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-rke-copy">Author</h3>
          <input
            className="mt-4 w-full rounded-2xl border border-rke-border/70 px-4 py-3 text-sm text-rke-navy outline-none transition focus:border-rke-teal"
            onChange={(event) => setAuthorQuery(event.target.value)}
            placeholder="Search author..."
            type="text"
            value={authorQuery}
          />
        </div>

        <button
          className="mt-8 inline-flex items-center justify-center rounded-2xl border border-rke-teal px-4 py-3 text-sm font-semibold text-rke-teal transition hover:bg-rke-teal hover:text-white"
          onClick={resetFilters}
          type="button"
        >
          Reset filters
        </button>
      </aside>

      <section className="space-y-6">
        <SectionHeading
          description={
            searchQuery
              ? `Showing results for "${searchQuery}" across titles, authors, topics, and keywords.`
              : undefined
          }
          eyebrow="Explore"
          title="Browse shared research"
        />

        <div className="flex flex-col gap-4 rounded-[28px] border border-rke-border/80 bg-white p-5 shadow-[0_24px_70px_rgba(24,46,75,0.08)] sm:flex-row sm:items-center">
          <select
            className="rounded-2xl border border-rke-border bg-rke-surface px-4 py-3 text-sm text-rke-navy outline-none"
            onChange={(event) => setSortOrder(event.target.value as SortOrder)}
            value={sortOrder}
          >
            <option>Newest</option>
            <option>Oldest</option>
          </select>

          <p className="text-sm text-rke-copy sm:ml-auto">
            {filteredDocuments.length} documents found
          </p>

          <div className="flex items-center gap-2">
            <button
              aria-label="Grid view"
              className="grid size-11 place-items-center rounded-2xl bg-rke-teal text-white"
              type="button"
            >
              <Grid2x2 size={18} />
            </button>
            <button
              aria-label="List view"
              className="grid size-11 place-items-center rounded-2xl border border-rke-border bg-rke-surface text-rke-copy"
              type="button"
            >
              <List size={18} />
            </button>
          </div>
        </div>

        {errorMessage ? (
          <EmptyState
            description={errorMessage}
            title="Could not load documents for exploration"
          />
        ) : isLoading ? (
          <EmptyState
            description="Loading documents from your library..."
            title="Fetching documents"
          />
        ) : filteredDocuments.length > 0 ? (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filteredDocuments.map((document) => (
              <DocumentCard
                key={document.id}
                compact
                document={document}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description={
              searchQuery
                ? 'Try a broader search or clear some filters to widen the results.'
                : 'Try clearing one or more filters, or upload more research proposals to expand the knowledge base.'
            }
            title="No documents match the selected filters"
          />
        )}
      </section>
    </div>
  )
}
