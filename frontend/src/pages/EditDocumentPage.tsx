import { ArrowLeft, FileUp, Plus, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { DocumentRecord, DocumentStatus, TopicName } from '../data/documents'
import { documentStatusOptions } from '../data/documents'
import { TopicPickerDialog } from '../components/ui/TopicPickerDialog'
import { useAuth } from '../hooks/useAuth'
import { useDocuments } from '../hooks/useDocuments'
import { fetchDocument, updateDocument } from '../lib/documents'
import { ApiError } from '../lib/api'
import { EmptyState } from '../components/ui/EmptyState'

const acceptedFileExtensions = ['pdf', 'docx', 'pptx']
const maxFileSizeInBytes = 25 * 1024 * 1024

export function EditDocumentPage() {
  const navigate = useNavigate()
  const { documentId } = useParams()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { token, user } = useAuth()
  const { documents } = useDocuments()
  const [document, setDocument] = useState<DocumentRecord | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [authorInput, setAuthorInput] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [topics, setTopics] = useState<TopicName[]>([])
  const [isTopicPickerOpen, setIsTopicPickerOpen] = useState(false)
  const [status, setStatus] = useState<DocumentStatus | ''>('')
  const [abstract, setAbstract] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const availableTopics = useMemo(
    () => Array.from(new Set([...documents.flatMap((item) => item.topics), ...topics])).sort(),
    [documents, topics],
  )

  const numericDocumentId = Number(documentId)

  useEffect(() => {
    if (!token || Number.isNaN(numericDocumentId)) {
      setErrorMessage('Invalid document id.')
      setIsLoading(false)
      return
    }

    const activeToken = token
    let cancelled = false

    async function loadDocument() {
      setIsLoading(true)
      setErrorMessage(null)

      try {
        const nextDocument = await fetchDocument(activeToken, numericDocumentId)
        if (!cancelled) {
          if (nextDocument.ownerId !== user?.id) {
            setErrorMessage('You can only edit documents that you uploaded.')
            setIsLoading(false)
            return
          }

          setDocument(nextDocument)
          setTitle(nextDocument.title)
          setAuthors(nextDocument.authors)
          setTopics(nextDocument.topics)
          setStatus(nextDocument.status ?? '')
          setAbstract(nextDocument.abstract ?? '')
          setKeywords(nextDocument.keywords)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error ? error.message : 'Could not load the document for editing.',
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
    }
  }, [numericDocumentId, token, user?.id])

  const fileLabel = useMemo(() => {
    if (selectedFile) {
      return selectedFile.name
    }

    return document ? `Current file: ${document.filename}` : 'Choose a replacement file'
  }, [document, selectedFile])

  function addUniqueValue(nextValue: string, current: string[]) {
    const cleaned = nextValue.trim()
    if (!cleaned || current.includes(cleaned)) {
      return current
    }

    return [...current, cleaned]
  }

  function handleAuthorAdd() {
    setAuthors((current) => addUniqueValue(authorInput, current))
    setAuthorInput('')
  }

  function handleKeywordAdd() {
    setKeywords((current) => addUniqueValue(keywordInput, current))
    setKeywordInput('')
  }

  function removeAuthor(author: string) {
    setAuthors((current) => current.filter((item) => item !== author))
  }

  function removeKeyword(keyword: string) {
    setKeywords((current) => current.filter((item) => item !== keyword))
  }

  function toggleTopic(topic: TopicName) {
    setTopics((current) =>
      current.includes(topic)
        ? current.filter((item) => item !== topic)
        : [...current, topic],
    )
  }

  function handleFileSelection(file: File | null) {
    if (!file) {
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    if (!acceptedFileExtensions.includes(extension)) {
      setErrorMessage('Please upload a PDF, DOCX, or PPTX file.')
      return
    }

    if (file.size > maxFileSizeInBytes) {
      setErrorMessage('Please upload a file smaller than 25 MB.')
      return
    }

    setSelectedFile(file)
    setErrorMessage(null)
  }

  async function handleSave() {
    if (!token || !document) {
      setErrorMessage('You must be logged in to edit a document.')
      return
    }

    if (!title.trim()) {
      setErrorMessage('Please provide a document title.')
      return
    }

    if (authors.length === 0) {
      setErrorMessage('Please add at least one author.')
      return
    }

    if (topics.length === 0) {
      setErrorMessage('Please select at least one research topic.')
      return
    }

    if (!status) {
      setErrorMessage('Please select the document status.')
      return
    }

    setErrorMessage(null)
    setSuccessMessage(null)
    setIsSubmitting(true)

    try {
      const updatedDocument = await updateDocument(token, document.id, {
        file: selectedFile,
        title: title.trim(),
        topics,
        status,
        abstract: abstract.trim(),
        authors,
        keywords,
      })

      setDocument(updatedDocument)
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setSuccessMessage('Document updated successfully.')

      setTimeout(() => {
        navigate(`/app/documents/${updatedDocument.id}`)
      }, 900)
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'The update failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (errorMessage && !document && !isLoading) {
    return <EmptyState description={errorMessage} title="Could not load this document" />
  }

  if (isLoading || !document) {
    return <EmptyState description="Loading the editor..." title="Fetching document" />
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <TopicPickerDialog
        availableTopics={availableTopics}
        isOpen={isTopicPickerOpen}
        onChange={setTopics}
        onClose={() => setIsTopicPickerOpen(false)}
        selectedTopics={topics}
      />

      <Link
        className="inline-flex items-center gap-2 text-sm font-semibold text-rke-teal transition hover:text-rke-navy"
        to={`/app/documents/${document.id}`}
      >
        <ArrowLeft size={16} />
        Back to Document
      </Link>

      <div>
        <h1 className="text-5xl font-extrabold tracking-tight text-rke-navy">
          Edit Research Proposal
        </h1>
        <p className="mt-4 text-lg text-rke-copy">
          Update the document metadata or replace the uploaded file.
        </p>
      </div>

      <div className="space-y-6 rounded-[32px] border border-rke-border/80 bg-white p-8 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-rke-navy">
            Document File
          </p>
          <button
            className="mt-3 flex min-h-44 w-full flex-col items-center justify-center rounded-[28px] border border-dashed border-rke-border bg-rke-surface/30 px-6 py-8 text-center transition hover:border-rke-teal/40 hover:bg-rke-teal-soft/20"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <div className="grid size-16 place-items-center rounded-3xl bg-rke-teal-soft text-rke-teal">
              <FileUp size={30} />
            </div>
            <p className="mt-5 text-lg font-semibold text-rke-navy">{fileLabel}</p>
            <p className="mt-2 text-sm text-rke-copy">
              Leave this untouched to keep the current file. Accepted formats: PDF, DOCX, PPTX
            </p>
          </button>
          <input
            ref={fileInputRef}
            accept=".pdf,.docx,.pptx"
            className="hidden"
            onChange={(event) => handleFileSelection(event.target.files?.[0] ?? null)}
            type="file"
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.08em] text-rke-navy" htmlFor="title">
            Document Title
          </label>
          <input
            className="mt-3 h-12 w-full rounded-2xl border border-rke-border px-4 text-sm text-rke-navy outline-none transition focus:border-rke-teal"
            id="title"
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Enter document title"
            type="text"
            value={title}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.08em] text-rke-navy" htmlFor="authors">
            Author(s)
          </label>
          <div className="mt-3 flex gap-3">
            <input
              className="h-12 flex-1 rounded-2xl border border-rke-border px-4 text-sm text-rke-navy outline-none transition focus:border-rke-teal"
              id="authors"
              onChange={(event) => setAuthorInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleAuthorAdd()
                }
              }}
              placeholder="Enter author name and press Enter"
              type="text"
              value={authorInput}
            />
            <button
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-rke-teal px-5 font-semibold text-white transition hover:brightness-105"
              onClick={handleAuthorAdd}
              type="button"
            >
              Add
            </button>
          </div>
          {authors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {authors.map((author) => (
                <span
                  key={author}
                  className="inline-flex items-center gap-2 rounded-full bg-rke-teal-soft px-3 py-2 text-sm text-rke-navy"
                >
                  {author}
                  <button
                    className="text-rke-copy transition hover:text-rke-navy"
                    onClick={() => removeAuthor(author)}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-rke-navy">
            Research Focus / Topics
          </p>
          <button
            className="mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-rke-teal px-5 text-sm font-semibold text-white transition hover:brightness-105"
            onClick={() => setIsTopicPickerOpen(true)}
            type="button"
          >
            <Plus size={17} />
            Add topics
          </button>
          {topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {topics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-2 rounded-full bg-rke-teal-soft px-3 py-2 text-sm text-rke-navy"
                >
                  {topic}
                  <button
                    className="text-rke-copy transition hover:text-rke-navy"
                    onClick={() => toggleTopic(topic)}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-rke-navy">
            Document State
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {documentStatusOptions.map((option) => (
              <button
                key={option}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                  status === option
                    ? 'border-rke-amber bg-rke-amber text-white'
                    : 'border-rke-border text-rke-copy hover:border-rke-amber/40 hover:text-rke-navy'
                }`}
                onClick={() => setStatus(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.08em] text-rke-navy" htmlFor="abstract">
            Description / Abstract
          </label>
          <textarea
            className="mt-3 min-h-48 w-full rounded-[28px] border border-rke-border px-4 py-4 text-sm leading-7 text-rke-navy outline-none transition focus:border-rke-teal"
            id="abstract"
            onChange={(event) => setAbstract(event.target.value)}
            placeholder="Provide a brief abstract or description of the research"
            value={abstract}
          />
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-[0.08em] text-rke-navy" htmlFor="keywords">
            Keywords
          </label>
          <div className="mt-3 flex gap-3">
            <input
              className="h-12 flex-1 rounded-2xl border border-rke-border px-4 text-sm text-rke-navy outline-none transition focus:border-rke-teal"
              id="keywords"
              onChange={(event) => setKeywordInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  handleKeywordAdd()
                }
              }}
              placeholder="Enter keyword and press Enter"
              type="text"
              value={keywordInput}
            />
            <button
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-rke-teal px-5 font-semibold text-white transition hover:brightness-105"
              onClick={handleKeywordAdd}
              type="button"
            >
              Add
            </button>
          </div>
          {keywords.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <span
                  key={keyword}
                  className="inline-flex items-center gap-2 rounded-full bg-rke-surface px-3 py-2 text-sm text-rke-navy"
                >
                  {keyword}
                  <button
                    className="text-rke-copy transition hover:text-rke-navy"
                    onClick={() => removeKeyword(keyword)}
                    type="button"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {errorMessage && (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        )}

        <button
          className="inline-flex h-14 w-full items-center justify-center rounded-2xl bg-rke-amber text-base font-bold text-white shadow-[0_16px_35px_rgba(245,162,6,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          onClick={handleSave}
          type="button"
        >
          {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>
    </section>
  )
}
