import type {
  DocumentRecord,
  DocumentProcessingStatus,
  DocumentStatus,
  TopicName,
  UpdateDocumentPayload,
  UploadDocumentPayload,
} from '../data/documents'
import { apiRequest, getApiBaseUrl } from './api'

type DocumentApiResponse = {
  id: number
  owner_id: number
  title: string
  filename: string
  topic: string | null
  topics?: string[]
  status: string | null
  processing_status?: string | null
  processing_error?: string | null
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

function normalizeProcessingStatus(status: string | null | undefined): DocumentProcessingStatus {
  return status === 'processing' || status === 'failed' ? status : 'ready'
}

function normalizeTopics(topic: string | null, topics: string[] | undefined): TopicName[] {
  const rawTopics = topics && topics.length > 0 ? topics : topic ? [topic] : []

  return rawTopics
    .map((item) => item.trim())
    .filter((item): item is TopicName => item.length > 0)
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
    processingStatus: normalizeProcessingStatus(document.processing_status),
    processingError: document.processing_error ?? null,
    abstract: document.abstract,
    authors: document.authors,
    keywords: document.keywords,
    createdAt: document.created_at,
  }
}

export async function fetchDocuments() {
  const response = await apiRequest<DocumentApiResponse[]>('/documents')

  return response.map(normalizeDocument)
}

export async function fetchMyDocuments() {
  const response = await apiRequest<DocumentApiResponse[]>('/documents/mine')

  return response.map(normalizeDocument)
}

export async function fetchDocument(documentId: number) {
  const response = await apiRequest<DocumentApiResponse>(`/documents/${documentId}`)

  return normalizeDocument(response)
}

export async function uploadDocument(payload: UploadDocumentPayload) {
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
    body: formData,
  })

  return normalizeDocument(response)
}

export async function updateDocument(documentId: number, payload: UpdateDocumentPayload) {
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
    body: formData,
  })

  return normalizeDocument(response)
}

export async function deleteDocument(documentId: number) {
  await apiRequest<{ ok: boolean }>(`/documents/${documentId}`, {
    method: 'DELETE',
  })
}

export async function fetchDocumentFile(documentId: number) {
  const response = await fetch(
    `${getApiBaseUrl()}/documents/${documentId}/file`,
    {
      credentials: 'include',
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
