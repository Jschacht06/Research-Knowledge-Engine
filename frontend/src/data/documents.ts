export type TopicName =
  | 'Robotics'
  | 'AI / Machine Learning'
  | 'Mechatronics'
  | 'Sensors'
  | 'Energy Systems'
  | 'Control Systems'

export type DocumentStatus =
  | 'Goedgekeurd'
  | 'Afgekeurd'
  | 'Aangevraagd'
  | 'Done'

export type SortOrder = 'Newest' | 'Oldest'

export type DocumentRecord = {
  id: number
  title: string
  filename: string
  topic: string | null
  status: DocumentStatus | null
  abstract: string | null
  authors: string[]
  keywords: string[]
  createdAt: string
}

export type UploadDocumentPayload = {
  file: File
  title: string
  topic: string
  status: DocumentStatus
  abstract: string
  authors: string[]
  keywords: string[]
}

export const topicOptions: TopicName[] = [
  'Robotics',
  'AI / Machine Learning',
  'Mechatronics',
  'Sensors',
  'Energy Systems',
  'Control Systems',
]

export const documentStatusOptions: DocumentStatus[] = [
  'Goedgekeurd',
  'Afgekeurd',
  'Aangevraagd',
  'Done',
]
