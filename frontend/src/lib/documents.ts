import type {
  DocumentRecord,
  DocumentStatus,
  UpdateDocumentPayload,
  UploadDocumentPayload,
} from '../data/documents'
import { apiRequest } from './api'

type DocumentApiResponse = {
  id: number
  title: string
  filename: string
  topic: string | null
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

function normalizeDocument(document: DocumentApiResponse): DocumentRecord {
  return {
    id: document.id,
    title: document.title,
    filename: document.filename,
    topic: document.topic,
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
  formData.append('topic', payload.topic)
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
  formData.append('topic', payload.topic)
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
