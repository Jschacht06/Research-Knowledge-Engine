import type { FormEvent } from 'react'
import { Bot, CornerDownLeft, LoaderCircle, Sparkles, User2 } from 'lucide-react'
import { startTransition, useState } from 'react'
import { apiRequest, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

type ChatSource = {
  doc_id: number
  chunk_id: number
  chunk_index: number
}

type ChatResponse = {
  answer: string
  sources: ChatSource[]
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
}

const starterPrompts = [
  'Summarize the newest robotics research in my library.',
  'Which uploaded documents mention sensor fusion or real-time systems?',
  'Give me a quick overview of my AI / Machine Learning proposals.',
]

export function ChatPage() {
  const { token } = useAuth()
  const [draft, setDraft] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'assistant-welcome',
      role: 'assistant',
      content:
        'Ask me about the documents in your knowledge base and I will answer using the indexed research already uploaded to RKE.',
    },
  ])

  async function sendMessage(question: string) {
    const cleanedQuestion = question.trim()
    if (!cleanedQuestion || !token || isSubmitting) {
      return
    }

    const userMessage: ChatMessage = {
      id: `user-${crypto.randomUUID()}`,
      role: 'user',
      content: cleanedQuestion,
    }

    startTransition(() => {
      setMessages((current) => [...current, userMessage])
      setDraft('')
      setErrorMessage(null)
      setIsSubmitting(true)
    })

    try {
      const response = await apiRequest<ChatResponse>('/chat/ask', {
        method: 'POST',
        token,
        body: JSON.stringify({
          question: cleanedQuestion,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const assistantMessage: ChatMessage = {
        id: `assistant-${crypto.randomUUID()}`,
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
      }

      startTransition(() => {
        setMessages((current) => [...current, assistantMessage])
      })
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'The assistant could not answer right now.'

      startTransition(() => {
        setErrorMessage(message)
      })
    } finally {
      startTransition(() => {
        setIsSubmitting(false)
      })
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void sendMessage(draft)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-[calc(100svh-10rem)] rounded-[32px] border border-rke-border/80 bg-white shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <div className="border-b border-rke-border/70 px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-rke-teal-soft text-rke-teal">
              <Sparkles size={22} />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rke-teal">
                AI Assistant
              </p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-rke-navy">
                Chat with your research knowledge base
              </h1>
            </div>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-rke-copy">
            This page uses the existing backend RAG endpoint, so answers are generated from
            the documents already associated with your account.
          </p>
        </div>

        <div className="flex h-[calc(100%-8.5rem)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 md:px-8">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-2xl bg-rke-teal-soft text-rke-teal">
                    <Bot size={18} />
                  </div>
                )}

                <div
                  className={`max-w-3xl rounded-[26px] px-5 py-4 shadow-sm ${
                    message.role === 'user'
                      ? 'bg-rke-blue text-white'
                      : 'border border-rke-border/70 bg-rke-surface/60 text-rke-navy'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm leading-7">{message.content}</p>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-rke-border/70 bg-white px-4 py-3 text-xs text-rke-copy">
                      <p className="font-semibold uppercase tracking-[0.16em] text-rke-teal">
                        Sources
                      </p>
                      <div className="mt-2 space-y-2">
                        {message.sources.map((source) => (
                          <p key={source.chunk_id}>
                            Document #{source.doc_id} · chunk #{source.chunk_index + 1}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-2xl bg-rke-blue text-white">
                    <User2 size={18} />
                  </div>
                )}
              </article>
            ))}

            {isSubmitting && (
              <article className="flex gap-4">
                <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-2xl bg-rke-teal-soft text-rke-teal">
                  <Bot size={18} />
                </div>
                <div className="flex items-center gap-3 rounded-[26px] border border-rke-border/70 bg-rke-surface/60 px-5 py-4 text-sm text-rke-copy">
                  <LoaderCircle className="animate-spin" size={16} />
                  Thinking through your documents...
                </div>
              </article>
            )}
          </div>

          <div className="border-t border-rke-border/70 px-6 py-5 md:px-8">
            {errorMessage && (
              <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMessage}
              </p>
            )}

            <form className="space-y-3" onSubmit={handleSubmit}>
              <label className="block">
                <textarea
                  className="min-h-28 w-full resize-none rounded-[26px] border border-rke-border bg-rke-surface/50 px-5 py-4 text-sm leading-7 text-rke-navy outline-none transition focus:border-rke-teal"
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask something about your uploaded research..."
                  value={draft}
                />
              </label>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-rke-copy">
                  The assistant only knows what exists in your indexed documents.
                </p>
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-rke-amber px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(245,162,6,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting || !draft.trim()}
                  type="submit"
                >
                  Ask AI
                  <CornerDownLeft size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-[30px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rke-teal">
            Quick prompts
          </p>
          <div className="mt-4 grid gap-3">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                className="rounded-2xl border border-rke-border/70 bg-rke-surface/50 px-4 py-4 text-left text-sm leading-6 text-rke-copy transition hover:border-rke-teal/30 hover:bg-rke-teal-soft/40 hover:text-rke-navy"
                onClick={() => void sendMessage(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[30px] border border-rke-border/80 bg-white p-6 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rke-teal">
            How it works
          </p>
          <div className="mt-4 space-y-3 text-sm leading-7 text-rke-copy">
            <p>The backend embeds your question, retrieves relevant chunks and then asks the model to answer with that context.</p>
            <p>Use this page for summaries, comparisons and finding related proposals in your own uploaded knowledge base.</p>
          </div>
        </section>
      </aside>
    </div>
  )
}
