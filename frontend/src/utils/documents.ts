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
  return new Date(`${dateISO}T00:00:00`).getTime()
}

export function authorInitial(author: string): string {
  const parts = author.split(' ').filter(Boolean)
  const lastName = parts[parts.length - 1] ?? author
  return lastName.charAt(0).toUpperCase()
}

export function topicAccent(topic: TopicName) {
  const accents: Record<TopicName, string> = {
    Robotics: 'bg-rke-violet/15 text-rke-violet ring-rke-violet/20',
    'AI / Machine Learning': 'bg-rke-teal-soft text-rke-teal ring-rke-teal/20',
    Mechatronics: 'bg-rke-amber-soft text-rke-amber ring-rke-amber/25',
    Sensors: 'bg-pink-100 text-pink-600 ring-pink-200',
    'Energy Systems': 'bg-emerald-100 text-emerald-600 ring-emerald-200',
    'Control Systems': 'bg-sky-100 text-sky-700 ring-sky-200',
  }

  return accents[topic]
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
        selectedTopics.length === 0 || selectedTopics.includes(document.topic)
      const matchesAuthor =
        query.length === 0 || document.author.toLowerCase().includes(query)

      const docDate = new Date(`${document.dateISO}T00:00:00`)
      const matchesFrom = !from || docDate >= from
      const matchesTo = !to || docDate <= to

      return matchesTopic && matchesAuthor && matchesFrom && matchesTo
    })
    .sort((left, right) => {
      const leftTime = toTimestamp(left.dateISO)
      const rightTime = toTimestamp(right.dateISO)

      return sortOrder === 'Newest' ? rightTime - leftTime : leftTime - rightTime
    })
}
