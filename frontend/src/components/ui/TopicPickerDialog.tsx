import { Check, Plus, Search, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { TopicName } from '../../data/documents'

type TopicPickerDialogProps = {
  availableTopics: TopicName[]
  isOpen: boolean
  selectedTopics: TopicName[]
  onClose: () => void
  onChange: (topics: TopicName[]) => void
}

function cleanTopic(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function TopicPickerDialog({
  availableTopics,
  isOpen,
  selectedTopics,
  onClose,
  onChange,
}: TopicPickerDialogProps) {
  const [query, setQuery] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const normalizedQuery = cleanTopic(query)
  const allTopics = useMemo(
    () => Array.from(new Set([...availableTopics, ...selectedTopics].map(cleanTopic).filter(Boolean))).sort(),
    [availableTopics, selectedTopics],
  )
  const filteredTopics = allTopics.filter((topic) =>
    topic.toLowerCase().includes(normalizedQuery.toLowerCase()),
  )
  const canCreateTopic =
    normalizedQuery.length > 0 &&
    !allTopics.some((topic) => topic.toLowerCase() === normalizedQuery.toLowerCase())

  function toggleTopic(topic: TopicName) {
    setErrorMessage(null)
    if (selectedTopics.includes(topic)) {
      onChange(selectedTopics.filter((item) => item !== topic))
      return
    }

    if (selectedTopics.length >= 6) {
      setErrorMessage('Please select 6 research topics or fewer.')
      return
    }

    onChange([...selectedTopics, topic])
  }

  function createTopic() {
    setErrorMessage(null)

    if (!normalizedQuery) {
      return
    }

    if (normalizedQuery.length > 120) {
      setErrorMessage('Topic must be 120 characters or fewer.')
      return
    }

    if (/[<>]/.test(normalizedQuery)) {
      setErrorMessage('Topic cannot contain angle brackets.')
      return
    }

    if (selectedTopics.length >= 6) {
      setErrorMessage('Please select 6 research topics or fewer.')
      return
    }

    onChange([...selectedTopics, normalizedQuery])
    setQuery('')
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-rke-navy/35 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-xl rounded-[28px] border border-rke-border/80 bg-white p-6 shadow-[0_30px_90px_rgba(24,46,75,0.22)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-rke-navy">Research topics</h2>
            <p className="mt-2 text-sm leading-6 text-rke-copy">
              Search existing topics or create a new one for this document.
            </p>
          </div>
          <button
            aria-label="Close topic picker"
            className="grid size-10 shrink-0 place-items-center rounded-2xl text-rke-copy transition hover:bg-rke-surface hover:text-rke-navy"
            onClick={onClose}
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-rke-border bg-rke-surface/70 px-4 py-3 text-rke-copy">
          <Search size={18} />
          <input
            autoFocus
            className="w-full border-none bg-transparent text-sm text-rke-navy outline-none placeholder:text-slate-400"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && canCreateTopic) {
                event.preventDefault()
                createTopic()
              }
            }}
            placeholder="Search topics..."
            type="text"
            value={query}
          />
        </div>

        {errorMessage && (
          <p className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-5 max-h-72 space-y-2 overflow-y-auto pr-1">
          {filteredTopics.length > 0 ? (
            filteredTopics.map((topic) => {
              const isSelected = selectedTopics.includes(topic)

              return (
                <button
                  key={topic}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                    isSelected
                      ? 'border-rke-teal bg-rke-teal-soft text-rke-teal'
                      : 'border-rke-border text-rke-copy hover:border-rke-teal/40 hover:bg-rke-surface hover:text-rke-navy'
                  }`}
                  onClick={() => toggleTopic(topic)}
                  type="button"
                >
                  <span>{topic}</span>
                  {isSelected && <Check size={17} />}
                </button>
              )
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-rke-border px-4 py-5 text-center text-sm text-rke-copy">
              No topics found.
            </p>
          )}
        </div>

        {canCreateTopic && (
          <button
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-rke-teal px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
            onClick={createTopic}
            type="button"
          >
            <Plus size={17} />
            Create "{normalizedQuery}"
          </button>
        )}

        <div className="mt-6 flex justify-end">
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-rke-amber px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(245,162,6,0.28)] transition hover:-translate-y-0.5"
            onClick={onClose}
            type="button"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
