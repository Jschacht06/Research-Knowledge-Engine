export type TopicName = string

export type DocumentStatus =
  | 'Goedgekeurd'
  | 'Afgekeurd'
  | 'Aangevraagd'
  | 'Done'

export type SortOrder = 'Newest' | 'Oldest'

export type DocumentRecord = {
  id: number
  ownerId: number
  title: string
  filename: string
  topic: string | null
  topics: TopicName[]
  status: DocumentStatus | null
  abstract: string | null
  authors: string[]
  keywords: string[]
  createdAt: string
}

export type UploadDocumentPayload = {
  file: File
  title: string
  topics: TopicName[]
  status: DocumentStatus
  abstract: string
  authors: string[]
  keywords: string[]
}

export type UpdateDocumentPayload = {
  file?: File | null
  title: string
  topics: TopicName[]
  status: DocumentStatus
  abstract: string
  authors: string[]
  keywords: string[]
}

export const documentStatusOptions: DocumentStatus[] = [
  'Goedgekeurd',
  'Afgekeurd',
  'Aangevraagd',
  'Done',
]
