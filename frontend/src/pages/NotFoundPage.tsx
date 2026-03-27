import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="max-w-xl rounded-[32px] border border-rke-border bg-white p-10 text-center shadow-[0_24px_70px_rgba(24,46,75,0.08)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rke-teal">404</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-rke-navy">
          Page not found
        </h1>
        <p className="mt-4 text-sm leading-7 text-rke-copy">
          Woooops.
        </p>
        <Link
          className="mt-8 inline-flex items-center justify-center rounded-2xl bg-rke-blue px-5 py-3 font-semibold text-white"
          to="/"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
