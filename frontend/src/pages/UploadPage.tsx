import { ArrowLeft, FileUp, X } from 'lucide-react'
import { startTransition, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { DocumentStatus, TopicName } from '../data/documents'
import { documentStatusOptions, topicOptions } from '../data/documents'
import { useAuth } from '../hooks/useAuth'
import { uploadDocument } from '../lib/documents'
import { ApiError } from '../lib/api'

const acceptedFileExtensions = ['pdf', 'docx', 'pptx']
const maxFileSizeInBytes = 10 * 1024 * 1024

export function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { token } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [authorInput, setAuthorInput] = useState('')
  const [authors, setAuthors] = useState<string[]>([])
  const [topics, setTopics] = useState<TopicName[]>([])
  const [status, setStatus] = useState<DocumentStatus | ''>('')
  const [abstract, setAbstract] = useState('')
  const [keywordInput, setKeywordInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      setErrorMessage('Please upload a file smaller than 10 MB.')
      return
    }

    setSelectedFile(file)
    if (!title.trim()) {
      const inferredTitle = file.name.replace(/\.[^/.]+$/, '')
      setTitle(inferredTitle)
    }
    setErrorMessage(null)
  }

  async function handleUpload() {
    if (!token) {
      setErrorMessage('You must be logged in to upload a document.')
      return
    }

    if (!selectedFile) {
      setErrorMessage('Please select a document file.')
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
      await uploadDocument(token, {
        file: selectedFile,
        title: title.trim(),
        topics,
        status,
        abstract: abstract.trim(),
        authors,
        keywords,
      })

      startTransition(() => {
        setSuccessMessage('Document uploaded successfully. It is now available in your library and AI search.')
        setSelectedFile(null)
        setTitle('')
        setAuthorInput('')
        setAuthors([])
        setTopics([])
        setStatus('')
        setAbstract('')
        setKeywordInput('')
        setKeywords([])
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      setTimeout(() => {
        navigate('/app/documents')
      }, 900)
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'The upload failed. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <Link className="inline-flex items-center gap-2 text-sm font-semibold text-rke-teal transition hover:text-rke-navy" to="/app/dashboard">
        <ArrowLeft size={16} />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-5xl font-extrabold tracking-tight text-rke-navy">
          Upload Research Proposal
        </h1>
        <p className="mt-4 text-lg text-rke-copy">
          Share your research with the VIVES Mechatronics community.
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
            <p className="mt-5 text-lg font-semibold text-rke-navy">
              {selectedFile ? selectedFile.name : 'Drag & drop your file here or click to browse'}
            </p>
            <p className="mt-2 text-sm text-rke-copy">
              Accepted formats: PDF, DOCX, PPTX
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
                <span key={author} className="inline-flex items-center gap-2 rounded-full bg-rke-teal-soft px-3 py-2 text-sm text-rke-navy">
                  {author}
                  <button className="text-rke-copy transition hover:text-rke-navy" onClick={() => removeAuthor(author)} type="button">
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
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {topicOptions.map((option) => (
              <button
                key={option}
                className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                  topics.includes(option)
                    ? 'border-rke-teal bg-rke-teal text-white'
                    : 'border-rke-border text-rke-copy hover:border-rke-teal/40 hover:text-rke-navy'
                }`}
                onClick={() => toggleTopic(option)}
                type="button"
              >
                {option}
              </button>
            ))}
          </div>
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
                <span key={keyword} className="inline-flex items-center gap-2 rounded-full bg-rke-surface px-3 py-2 text-sm text-rke-navy">
                  {keyword}
                  <button className="text-rke-copy transition hover:text-rke-navy" onClick={() => removeKeyword(keyword)} type="button">
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
          onClick={handleUpload}
          type="button"
        >
          {isSubmitting ? 'Uploading Document...' : 'Upload Document'}
        </button>
      </div>
    </section>
  )
}
