import { CalendarDays, Download, FileText, User2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeading } from '../components/ui/SectionHeading'
import type { DocumentRecord } from '../data/documents'
import { useAuth } from '../hooks/useAuth'
import { useDocuments } from '../hooks/useDocuments'
import { fetchDocument, fetchDocumentFile } from '../lib/documents'
import {
  formatDocumentDate,
  statusAccent,
  topicAccent,
} from '../utils/documents'

export function DocumentDetailPage() {
  const { documentId } = useParams()
  const { token } = useAuth()
  const { documents } = useDocuments()
  const [document, setDocument] = useState<DocumentRecord | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewContentType, setPreviewContentType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const numericDocumentId = Number(documentId)

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    async function loadDocument() {
      if (!token || Number.isNaN(numericDocumentId)) {
        if (!cancelled) {
          setErrorMessage('Invalid document id.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextDocument = await fetchDocument(token, numericDocumentId)
        const fileResponse = await fetchDocumentFile(token, numericDocumentId)
        objectUrl = URL.createObjectURL(fileResponse.blob)

        if (!cancelled) {
          setDocument(nextDocument)
          setPreviewUrl(objectUrl)
          setPreviewContentType(fileResponse.contentType)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load the document.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDocument()

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [numericDocumentId, token])

  const relatedDocuments = useMemo(() => {
    if (!document?.topic) {
      return []
    }

    return documents
      .filter((item) => item.id !== document.id && item.topic === document.topic)
      .slice(0, 3)
  }, [document, documents])

  if (errorMessage) {
    return (
      <EmptyState
        description={errorMessage}
        title="Could not load this document"
      />
    )
  }

  if (isLoading || !document) {
    return (
      <EmptyState
        description="Loading the document details and preview..."
        title="Fetching document"
      />
    )
  }

  const isPdf = previewContentType?.includes('pdf') ?? false

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-rke-copy">
        <Link className="transition hover:text-rke-navy" to="/app/dashboard">Home</Link>
        <span>&gt;</span>
        <Link className="transition hover:text-rke-navy" to="/app/explore">Explore</Link>
        <span>&gt;</span>
        <span className="text-rke-navy">Document</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[32px] border border-rke-border/80 bg-white p-8 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
          <div className="mb-5 flex justify-end">
            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-rke-teal px-4 py-3 text-sm font-semibold text-rke-teal transition hover:bg-rke-teal hover:text-white"
              to={`/app/documents/${document.id}/edit`}
            >
              Edit document
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ring-1 ${topicAccent(document.topic)}`}>
              {document.topic ?? 'Uncategorized'}
            </span>
            <span className={`inline-flex rounded-full px-4 py-2 text-xs font-bold ring-1 ${statusAccent(document.status)}`}>
              {document.status ?? 'No status'}
            </span>
          </div>

          <h1 className="mt-5 max-w-5xl text-4xl font-extrabold tracking-tight text-rke-navy md:text-5xl">
            {document.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-rke-copy">
            <div className="inline-flex items-center gap-2">
              <User2 size={16} />
              {document.authors[0] ?? 'Unknown author'}
            </div>
            <div className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {formatDocumentDate(document.createdAt)}
            </div>
          </div>

          {document.keywords.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {document.keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-rke-surface px-3 py-1.5 text-xs text-rke-copy"
                >
                  {keyword}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-3xl font-bold tracking-tight text-rke-navy">Abstract</h2>
            <div className="mt-4 space-y-4 text-sm leading-8 text-rke-copy">
              {(document.abstract ?? 'No abstract was provided for this document yet.')
                .split(/\n{2,}/)
                .map((paragraph, index) => (
                  <p key={`${document.id}-${index}`}>{paragraph}</p>
                ))}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[32px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
            <SectionHeading title="Author" />
            <div className="mt-5 flex items-start gap-4">
              <div className="grid size-14 place-items-center rounded-full bg-rke-violet text-lg font-bold text-white">
                {(document.authors[0] ?? 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-rke-navy">{document.authors[0] ?? 'Unknown author'}</p>
                <p className="text-sm text-rke-copy">Senior Researcher</p>
                <p className="mt-3 text-sm leading-7 text-rke-copy">
                  Uploaded through the Research Knowledge Engine.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
            <SectionHeading title="Related Documents" />
            <div className="mt-5 space-y-4">
              {relatedDocuments.length > 0 ? (
                relatedDocuments.map((item) => (
                  <Link
                    key={item.id}
                    className="block rounded-2xl border border-rke-border/70 px-4 py-4 transition hover:border-rke-teal/30 hover:bg-rke-surface/40"
                    to={`/app/documents/${item.id}`}
                  >
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold ring-1 ${topicAccent(item.topic)}`}>
                      {item.topic ?? 'Uncategorized'}
                    </span>
                    <p className="mt-3 font-semibold text-rke-navy">{item.title}</p>
                    <p className="mt-2 text-xs text-rke-copy">
                      {item.authors[0] ?? 'Unknown author'} {' - '} {formatDocumentDate(item.createdAt)}
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-rke-copy">
                  No related documents found in the same topic yet.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-[32px] border border-rke-border/80 bg-white p-8 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-3xl font-bold tracking-tight text-rke-navy">Document Preview</h2>
          {previewUrl && (
            <a
              className="inline-flex items-center gap-2 rounded-2xl bg-rke-amber px-4 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(245,162,6,0.28)] transition hover:-translate-y-0.5"
              download={document.filename}
              href={previewUrl}
            >
              <Download size={16} />
              Download {document.filename.toLowerCase().endsWith('.pdf') ? 'PDF' : 'File'}
            </a>
          )}
        </div>

        <div className="mt-6 rounded-[28px] border border-dashed border-rke-border bg-rke-surface/30 p-5">
          {isPdf && previewUrl ? (
            <iframe
              className="min-h-[820px] w-full rounded-[20px] border border-rke-border bg-white"
              src={previewUrl}
              title={document.title}
            />
          ) : previewUrl ? (
            <div className="grid min-h-72 place-items-center rounded-[22px] bg-white text-center">
              <div>
                <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-rke-surface text-rke-copy">
                  <FileText size={32} />
                </div>
                <p className="mt-5 text-sm text-rke-copy">
                  Browser preview is currently available for PDF files.
                </p>
                <p className="mt-2 text-sm text-rke-copy">
                  You can still download <strong>{document.filename}</strong> from the button above.
                </p>
              </div>
            </div>
          ) : (
            <EmptyState
              description="No file preview is available for this document."
              title="Preview unavailable"
            />
          )}
        </div>
      </section>
    </div>
  )
}
