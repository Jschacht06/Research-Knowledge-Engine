import { AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

type ConfirmDialogProps = {
  cancelLabel?: string
  confirmLabel: string
  description: string
  isOpen: boolean
  isPending?: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmDialog({
  cancelLabel = 'Cancel',
  confirmLabel,
  description,
  isOpen,
  isPending = false,
  title,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isPending) {
        onCancel()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPending, onCancel])

  if (!isOpen) {
    return null
  }

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-rke-navy/35 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-[28px] border border-rke-border/80 bg-white p-6 shadow-[0_30px_90px_rgba(24,46,75,0.22)]">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-rke-navy">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-rke-copy">{description}</p>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="inline-flex items-center justify-center rounded-2xl border border-rke-border px-4 py-3 text-sm font-semibold text-rke-copy transition hover:border-rke-teal/40 hover:bg-rke-surface disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            className="inline-flex items-center justify-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-[0_14px_30px_rgba(220,38,38,0.24)] transition hover:-translate-y-0.5 hover:bg-red-700 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isPending}
            onClick={onConfirm}
            type="button"
          >
            {isPending ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
