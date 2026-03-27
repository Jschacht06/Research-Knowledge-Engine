import { Bell, Search } from 'lucide-react'

export function WorkspaceSearchBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-rke-border/80 bg-white/85 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <label className="flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-rke-border bg-rke-surface/70 px-4 py-3 text-rke-copy">
          <Search size={18} />
          <input
            className="w-full border-none bg-transparent text-sm text-rke-navy outline-none placeholder:text-slate-400"
            placeholder="Search documents, authors, topics..."
            type="search"
          />
        </label>

        <div className="flex items-center gap-4">
          <button
            className="relative grid size-11 place-items-center rounded-2xl border border-rke-border bg-white text-rke-copy transition hover:border-rke-teal hover:text-rke-teal"
            type="button"
          >
            <Bell size={18} />
            <span className="absolute right-3 top-3 size-2 rounded-full bg-rose-500" />
          </button>
          <div className="grid size-11 place-items-center rounded-2xl bg-rke-teal font-bold text-white">
            JD
          </div>
        </div>
      </div>
    </header>
  )
}
