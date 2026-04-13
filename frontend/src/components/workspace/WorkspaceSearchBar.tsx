import { Bell, ChevronDown, LogOut, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function WorkspaceSearchBar() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const initials = (user?.email?.charAt(0) ?? 'U').toUpperCase()

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function handleLogout() {
    logout()
    setIsMenuOpen(false)
    navigate('/', { replace: true })
  }

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

          <div className="relative" ref={menuRef}>
            <button
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 rounded-2xl border border-rke-border bg-white px-2 py-2 text-rke-navy transition hover:border-rke-teal hover:text-rke-teal"
              onClick={() => setIsMenuOpen((current) => !current)}
              type="button"
            >
              <div className="grid size-9 place-items-center rounded-xl bg-rke-teal font-bold text-white">
                {initials}
              </div>
              <ChevronDown
                className={`transition ${isMenuOpen ? 'rotate-180' : ''}`}
                size={16}
              />
            </button>

            {isMenuOpen && (
              <div
                className="absolute right-0 top-14 z-30 w-64 rounded-[24px] border border-rke-border bg-white p-3 shadow-[0_24px_70px_rgba(24,46,75,0.14)]"
                role="menu"
              >
                <div className="rounded-2xl bg-rke-surface/80 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rke-copy">
                    Signed in as
                  </p>
                  <p className="mt-2 truncate text-sm font-bold text-rke-navy">
                    {user?.email ?? 'Authenticated user'}
                  </p>
                </div>

                <button
                  className="mt-3 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-rke-copy transition hover:bg-rke-teal-soft hover:text-rke-teal"
                  onClick={handleLogout}
                  role="menuitem"
                  type="button"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
