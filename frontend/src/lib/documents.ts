import type {
  DocumentRecord,
  DocumentStatus,
  TopicName,
  UpdateDocumentPayload,
  UploadDocumentPayload,
} from '../data/documents'
import { apiRequest } from './api'

type DocumentApiResponse = {
  id: number
  owner_id: number
  title: string
  filename: string
  topic: string | null
  topics?: string[]
  status: string | null
  abstract: string | null
  authors: string[]
  keywords: string[]
  created_at: string
}

function normalizeStatus(status: string | null): DocumentStatus | null {
  const allowedStatuses: DocumentStatus[] = ['Goedgekeurd', 'Afgekeurd', 'Aangevraagd', 'Done']
  return status && allowedStatuses.includes(status as DocumentStatus)
    ? (status as DocumentStatus)
    : null
}

function normalizeTopics(topic: string | null, topics: string[] | undefined): TopicName[] {
  const allowedTopics: TopicName[] = [
    'Robotics',
    'AI / Machine Learning',
    'Mechatronics',
    'Sensors',
    'Energy Systems',
    'Control Systems',
  ]
  const rawTopics = topics && topics.length > 0 ? topics : topic ? [topic] : []

  return rawTopics.filter((item): item is TopicName =>
    allowedTopics.includes(item as TopicName),
  )
}

function normalizeDocument(document: DocumentApiResponse): DocumentRecord {
  const normalizedTopics = normalizeTopics(document.topic, document.topics)

  return {
    id: document.id,
    ownerId: document.owner_id,
    title: document.title,
    filename: document.filename,
    topic: normalizedTopics[0] ?? document.topic,
    topics: normalizedTopics,
    status: normalizeStatus(document.status),
    abstract: document.abstract,
    authors: document.authors,
    keywords: document.keywords,
    createdAt: document.created_at,
  }
}

export async function fetchDocuments(token: string) {
  const response = await apiRequest<DocumentApiResponse[]>('/documents', {
    token,
  })

  return response.map(normalizeDocument)
}

export async function fetchMyDocuments(token: string) {
  const response = await apiRequest<DocumentApiResponse[]>('/documents/mine', {
    token,
  })

  return response.map(normalizeDocument)
}

export async function fetchDocument(token: string, documentId: number) {
  const response = await apiRequest<DocumentApiResponse>(`/documents/${documentId}`, {
    token,
  })

  return normalizeDocument(response)
}

export async function uploadDocument(token: string, payload: UploadDocumentPayload) {
  const formData = new FormData()
  formData.append('file', payload.file)
  formData.append('title', payload.title)
  formData.append('topic', payload.topics[0] ?? '')
  formData.append('topics', JSON.stringify(payload.topics))
  formData.append('status', payload.status)
  formData.append('abstract', payload.abstract)
  formData.append('authors', JSON.stringify(payload.authors))
  formData.append('keywords', JSON.stringify(payload.keywords))

  const response = await apiRequest<DocumentApiResponse>('/documents/upload', {
    method: 'POST',
    token,
    body: formData,
  })

  return normalizeDocument(response)
}

export async function updateDocument(
  token: string,
  documentId: number,
  payload: UpdateDocumentPayload,
) {
  const formData = new FormData()
  if (payload.file) {
    formData.append('file', payload.file)
  }
  formData.append('title', payload.title)
  formData.append('topic', payload.topics[0] ?? '')
  formData.append('topics', JSON.stringify(payload.topics))
  formData.append('status', payload.status)
  formData.append('abstract', payload.abstract)
  formData.append('authors', JSON.stringify(payload.authors))
  formData.append('keywords', JSON.stringify(payload.keywords))

  const response = await apiRequest<DocumentApiResponse>(`/documents/${documentId}`, {
    method: 'PUT',
    token,
    body: formData,
  })

  return normalizeDocument(response)
}

export async function fetchDocumentFile(token: string, documentId: number) {
  const response = await fetch(
    `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/documents/${documentId}/file`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  )

  if (!response.ok) {
    throw new Error('Could not load the document file.')
  }

  return {
    blob: await response.blob(),
    contentType: response.headers.get('content-type') ?? 'application/octet-stream',
  }
}
