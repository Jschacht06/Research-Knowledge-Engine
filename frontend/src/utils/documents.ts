import type { DocumentRecord, SortOrder, TopicName } from '../data/documents'

export function parseDateInput(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/)
  if (!match) {
    return null
  }

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3])
  const parsed = new Date(year, month - 1, day)

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null
  }

  return parsed
}

export function toTimestamp(dateISO: string): number {
  return new Date(dateISO).getTime()
}

export function authorInitial(authors: string[]): string {
  const primaryAuthor = authors[0] ?? 'Unknown'
  const parts = primaryAuthor.split(' ').filter(Boolean)
  const lastName = parts[parts.length - 1] ?? primaryAuthor
  return lastName.charAt(0).toUpperCase()
}

export function formatAuthorList(authors: string[]) {
  if (authors.length === 0) {
    return 'Unknown author'
  }

  if (authors.length === 1) {
    return authors[0]
  }

  return `${authors[0]} +${authors.length - 1} more`
}

export function formatDocumentDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

export function topicAccent(topic: string | null) {
  const accents: Record<TopicName, string> = {
    Robotics: 'bg-rke-violet/15 text-rke-violet ring-rke-violet/20',
    'AI / Machine Learning': 'bg-rke-teal-soft text-rke-teal ring-rke-teal/20',
    Mechatronics: 'bg-rke-amber-soft text-rke-amber ring-rke-amber/25',
    Sensors: 'bg-pink-100 text-pink-600 ring-pink-200',
    'Energy Systems': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
    'Control Systems': 'bg-sky-100 text-sky-700 ring-sky-200',
  }

  if (!topic || !(topic in accents)) {
    return 'bg-slate-100 text-slate-700 ring-slate-200'
  }

  return accents[topic as TopicName]
}

export function matchesSearchQuery(document: DocumentRecord, rawQuery: string) {
  const query = rawQuery.trim().toLowerCase()
  if (!query) {
    return true
  }

  return [
    document.title,
    document.filename,
    document.topic ?? '',
    document.abstract ?? '',
    ...document.authors,
    ...document.keywords,
    formatDocumentDate(document.createdAt),
  ].some((field) => field.toLowerCase().includes(query))
}

export function searchDocuments(source: DocumentRecord[], rawQuery: string) {
  return source.filter((document) => matchesSearchQuery(document, rawQuery))
}

type FilterOptions = {
  selectedTopics: TopicName[]
  fromDate: string
  toDate: string
  authorQuery: string
  sortOrder: SortOrder
}

export function filterDocuments(
  source: DocumentRecord[],
  { selectedTopics, fromDate, toDate, authorQuery, sortOrder }: FilterOptions,
) {
  const from = parseDateInput(fromDate)
  const to = parseDateInput(toDate)
  const query = authorQuery.trim().toLowerCase()

  return [...source]
    .filter((document) => {
      const matchesTopic =
        selectedTopics.length === 0 ||
        (document.topic !== null && selectedTopics.includes(document.topic as TopicName))
      const matchesAuthor =
        query.length === 0 ||
        document.authors.some((author) => author.toLowerCase().includes(query))

      const docDate = new Date(document.createdAt)
      const matchesFrom = !from || docDate >= from
      const matchesTo = !to || docDate <= to

      return matchesTopic && matchesAuthor && matchesFrom && matchesTo
    })
    .sort((left, right) => {
      const leftTime = toTimestamp(left.createdAt)
      const rightTime = toTimestamp(right.createdAt)

      return sortOrder === 'Newest' ? rightTime - leftTime : leftTime - rightTime
    })
}
