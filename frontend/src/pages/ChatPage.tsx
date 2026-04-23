import type { FormEvent, KeyboardEvent } from 'react'
import {
  Bot,
  Check,
  CornerDownLeft,
  LoaderCircle,
  MessageSquarePlus,
  MoreVertical,
  Pencil,
  Sparkles,
  Trash2,
  User2,
  X,
} from 'lucide-react'
import { startTransition, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { apiRequest, ApiError } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

type ChatSource = {
  doc_id: number
  title: string
  filename: string
}

type ChatConversation = {
  id: number
  title: string
  created_at: string
  updated_at: string
}

type ChatMessage = {
  id: number | string
  role: 'user' | 'assistant'
  content: string
  sources: ChatSource[]
  created_at?: string
}

export function ChatPage() {
  const { token } = useAuth()
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null)
  const [hasSelectedInitialConversation, setHasSelectedInitialConversation] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [conversationPendingDelete, setConversationPendingDelete] =
    useState<ChatConversation | null>(null)
  const [renamingConversationId, setRenamingConversationId] = useState<number | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [isMutatingConversation, setIsMutatingConversation] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadConversations() {
      if (!token) {
        setConversations([])
        setIsLoadingConversations(false)
        return
      }

      setIsLoadingConversations(true)
      setErrorMessage(null)

      try {
        const nextConversations = await apiRequest<ChatConversation[]>('/chat/conversations', {
          token,
        })

        if (!cancelled) {
          setConversations(nextConversations)
          if (!hasSelectedInitialConversation) {
            setActiveConversationId(nextConversations[0]?.id ?? null)
            setHasSelectedInitialConversation(true)
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError ? error.message : 'Could not load conversations.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingConversations(false)
        }
      }
    }

    void loadConversations()

    return () => {
      cancelled = true
    }
  }, [hasSelectedInitialConversation, token])

  useEffect(() => {
    let cancelled = false

    async function loadMessages() {
      if (isSubmitting) {
        return
      }

      if (!token || !activeConversationId) {
        setMessages([])
        return
      }

      setIsLoadingMessages(true)
      setErrorMessage(null)

      try {
        const nextMessages = await apiRequest<ChatMessage[]>(
          `/chat/conversations/${activeConversationId}/messages`,
          { token },
        )

        if (!cancelled) {
          setMessages(nextMessages)
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof ApiError ? error.message : 'Could not load this conversation.',
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMessages(false)
        }
      }
    }

    void loadMessages()

    return () => {
      cancelled = true
    }
  }, [activeConversationId, isSubmitting, token])

  async function refreshConversations() {
    if (!token) {
      return
    }

    const nextConversations = await apiRequest<ChatConversation[]>('/chat/conversations', {
      token,
    })
    startTransition(() => {
      setConversations(nextConversations)
    })
  }

  async function createConversation() {
    if (!token) {
      return null
    }

    const conversation = await apiRequest<ChatConversation>('/chat/conversations', {
      method: 'POST',
      token,
    })

    startTransition(() => {
      setConversations((current) => [conversation, ...current])
      setActiveConversationId(conversation.id)
      setDraft('')
      setErrorMessage(null)
    })

    return conversation
  }

  function startNewChat() {
    startTransition(() => {
      setActiveConversationId(null)
      setMessages([])
      setDraft('')
      setErrorMessage(null)
      setOpenMenuId(null)
      setRenamingConversationId(null)
    })
  }

  function startRenamingConversation(conversation: ChatConversation) {
    setOpenMenuId(null)
    setRenamingConversationId(conversation.id)
    setRenameDraft(conversation.title)
  }

  async function renameConversation(conversationId: number) {
    const nextTitle = renameDraft.trim()
    if (!token || !nextTitle || isMutatingConversation) {
      return
    }

    setIsMutatingConversation(true)
    setErrorMessage(null)

    try {
      const updatedConversation = await apiRequest<ChatConversation>(
        `/chat/conversations/${conversationId}`,
        {
          method: 'PUT',
          token,
          body: JSON.stringify({ title: nextTitle }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      startTransition(() => {
        setConversations((current) =>
          current.map((conversation) =>
            conversation.id === conversationId ? updatedConversation : conversation,
          ),
        )
        setRenamingConversationId(null)
        setRenameDraft('')
      })
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not rename this conversation.',
      )
    } finally {
      setIsMutatingConversation(false)
    }
  }

  async function deleteConversation(conversationId: number) {
    if (!token || isMutatingConversation) {
      return
    }

    setIsMutatingConversation(true)
    setErrorMessage(null)

    try {
      await apiRequest<{ ok: boolean }>(`/chat/conversations/${conversationId}`, {
        method: 'DELETE',
        token,
      })

      startTransition(() => {
        const remainingConversations = conversations.filter(
          (conversation) => conversation.id !== conversationId,
        )
        setConversations(remainingConversations)
        setOpenMenuId(null)
        setConversationPendingDelete(null)
        setRenamingConversationId(null)

        if (activeConversationId === conversationId) {
          setActiveConversationId(remainingConversations[0]?.id ?? null)
          setMessages([])
        }
      })
    } catch (error) {
      setConversationPendingDelete(null)
      setErrorMessage(
        error instanceof ApiError ? error.message : 'Could not delete this conversation.',
      )
    } finally {
      setIsMutatingConversation(false)
    }
  }

  async function sendMessage(question: string) {
    const cleanedQuestion = question.trim()
    if (!cleanedQuestion || !token || isSubmitting) {
      return
    }

    const userMessage: ChatMessage = {
      id: `pending-user-${crypto.randomUUID()}`,
      role: 'user',
      content: cleanedQuestion,
      sources: [],
    }

    startTransition(() => {
      setMessages((current) => [...current, userMessage])
      setDraft('')
      setErrorMessage(null)
      setIsSubmitting(true)
    })

    try {
      const conversationId = activeConversationId ?? (await createConversation())?.id
      if (!conversationId) {
        throw new Error('Could not start a conversation.')
      }

      const assistantMessage = await apiRequest<ChatMessage>(
        `/chat/conversations/${conversationId}/messages`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({
            question: cleanedQuestion,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      startTransition(() => {
        setActiveConversationId(conversationId)
        setMessages((current) => [...current, assistantMessage])
      })
      await refreshConversations()
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

  function handleDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void sendMessage(draft)
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
      <ConfirmDialog
        confirmLabel="Delete chat"
        description={`"${conversationPendingDelete?.title ?? 'This chat'}" and its messages will be permanently removed. This action cannot be undone.`}
        isOpen={conversationPendingDelete !== null}
        isPending={isMutatingConversation}
        onCancel={() => setConversationPendingDelete(null)}
        onConfirm={() => {
          if (conversationPendingDelete) {
            void deleteConversation(conversationPendingDelete.id)
          }
        }}
        title="Delete this chat?"
      />

      <aside className="h-fit rounded-[30px] border border-rke-border/80 bg-white p-5 shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rke-teal px-4 py-3 text-sm font-bold text-white transition hover:brightness-105"
          onClick={startNewChat}
          type="button"
        >
          <MessageSquarePlus size={18} />
          New chat
        </button>

        <div className="mt-5 space-y-2">
          {isLoadingConversations ? (
            <p className="rounded-2xl bg-rke-surface px-4 py-3 text-sm text-rke-copy">
              Loading conversations...
            </p>
          ) : conversations.length > 0 ? (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`relative rounded-2xl transition ${
                  activeConversationId === conversation.id
                    ? 'bg-rke-teal-soft text-rke-teal'
                    : 'text-rke-copy hover:bg-rke-surface hover:text-rke-navy'
                }`}
              >
                {renamingConversationId === conversation.id ? (
                  <div className="flex items-center gap-2 px-3 py-2">
                    <input
                      autoFocus
                      className="min-w-0 flex-1 rounded-xl border border-rke-border bg-white px-3 py-2 text-sm text-rke-navy outline-none focus:border-rke-teal"
                      onChange={(event) => setRenameDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void renameConversation(conversation.id)
                        }

                        if (event.key === 'Escape') {
                          setRenamingConversationId(null)
                          setRenameDraft('')
                        }
                      }}
                      value={renameDraft}
                    />
                    <button
                      aria-label="Save conversation name"
                      className="grid size-8 place-items-center rounded-xl text-rke-teal transition hover:bg-white"
                      disabled={isMutatingConversation}
                      onClick={() => void renameConversation(conversation.id)}
                      type="button"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      aria-label="Cancel rename"
                      className="grid size-8 place-items-center rounded-xl text-rke-copy transition hover:bg-white hover:text-rke-navy"
                      onClick={() => {
                        setRenamingConversationId(null)
                        setRenameDraft('')
                      }}
                      type="button"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      className={`min-w-0 flex-1 rounded-2xl px-4 py-3 text-left text-sm transition ${
                        activeConversationId === conversation.id ? 'font-bold' : ''
                      }`}
                      onClick={() => {
                        setActiveConversationId(conversation.id)
                        setOpenMenuId(null)
                      }}
                      type="button"
                    >
                      <span className="line-clamp-2">{conversation.title}</span>
                    </button>
                    <button
                      aria-label="Conversation actions"
                      className="mr-2 grid size-9 shrink-0 place-items-center rounded-xl transition hover:bg-white"
                      onClick={() =>
                        setOpenMenuId((current) =>
                          current === conversation.id ? null : conversation.id,
                        )
                      }
                      type="button"
                    >
                      <MoreVertical size={16} />
                    </button>
                  </div>
                )}

                {openMenuId === conversation.id && (
                  <div className="absolute right-2 top-12 z-20 w-40 rounded-2xl border border-rke-border bg-white p-2 text-sm shadow-[0_18px_45px_rgba(24,46,75,0.16)]">
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rke-copy transition hover:bg-rke-surface hover:text-rke-navy"
                      onClick={() => startRenamingConversation(conversation)}
                      type="button"
                    >
                      <Pencil size={14} />
                      Rename
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-rose-600 transition hover:bg-rose-50"
                      onClick={() => {
                        setOpenMenuId(null)
                        setConversationPendingDelete(conversation)
                      }}
                      type="button"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="rounded-2xl bg-rke-surface px-4 py-3 text-sm text-rke-copy">
              No conversations yet.
            </p>
          )}
        </div>
      </aside>

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
                Chat with the research knowledge base
              </h1>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100%-8.5rem)] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6 md:px-8">
            {!activeConversationId && messages.length === 0 && (
              <div className="grid min-h-80 place-items-center text-center">
                <div>
                  <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-rke-teal-soft text-rke-teal">
                    <Bot size={28} />
                  </div>
                  <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-rke-navy">
                    Start a new research chat
                  </h2>
                  <p className="mt-3 max-w-xl text-sm leading-7 text-rke-copy">
                    Ask about uploaded documents, then keep asking follow-up questions in the same conversation.
                  </p>
                </div>
              </div>
            )}

            {isLoadingMessages ? (
              <div className="flex items-center gap-3 rounded-[26px] border border-rke-border/70 bg-rke-surface/60 px-5 py-4 text-sm text-rke-copy">
                <LoaderCircle className="animate-spin" size={16} />
                Loading conversation...
              </div>
            ) : (
              messages.map((message) => (
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

                    {message.sources.length > 0 && (
                      <div className="mt-4 rounded-2xl border border-rke-border/70 bg-white px-4 py-3 text-xs text-rke-copy">
                        <p className="font-semibold uppercase tracking-[0.16em] text-rke-teal">
                          Sources
                        </p>
                        <div className="mt-2 space-y-2">
                          {message.sources.map((source) => (
                            <Link
                              key={source.doc_id}
                              className="block rounded-xl border border-rke-border/60 px-3 py-2 transition hover:border-rke-teal/50 hover:bg-rke-teal-soft/40 hover:text-rke-teal"
                              rel="noreferrer"
                              target="_blank"
                              to={`/app/documents/${source.doc_id}`}
                            >
                              <span className="block font-semibold text-rke-navy">
                                {source.title}
                              </span>
                              <span className="mt-1 block text-[11px] text-rke-copy">
                                {source.filename}
                              </span>
                            </Link>
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
              ))
            )}

            {isSubmitting && (
              <article className="flex gap-4">
                <div className="mt-1 grid size-10 shrink-0 place-items-center rounded-2xl bg-rke-teal-soft text-rke-teal">
                  <Bot size={18} />
                </div>
                <div className="flex items-center gap-3 rounded-[26px] border border-rke-border/70 bg-rke-surface/60 px-5 py-4 text-sm text-rke-copy">
                  <LoaderCircle className="animate-spin" size={16} />
                  Thinking through the shared documents and this conversation...
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
                  onKeyDown={handleDraftKeyDown}
                  placeholder="Ask a question or continue the conversation..."
                  value={draft}
                />
              </label>

              <div className="flex justify-end">
                <button
                  className="inline-flex items-center gap-2 rounded-2xl bg-rke-amber px-5 py-3 text-sm font-bold text-white shadow-[0_12px_28px_rgba(245,162,6,0.28)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={isSubmitting || !draft.trim()}
                  type="submit"
                >
                  Send
                  <CornerDownLeft size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  )
}
