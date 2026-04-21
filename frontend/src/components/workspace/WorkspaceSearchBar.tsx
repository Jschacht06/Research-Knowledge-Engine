import { ChevronDown, LogOut, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { userDisplayName, userInitials } from '../../utils/users'

export function WorkspaceSearchBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { logout, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const initials = userInitials(user)
  const displayName = userDisplayName(user, 'Authenticated user')
  const query = searchParams.get('q') ?? ''

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

  function navigateWithQuery(nextQuery: string) {
    const normalizedQuery = nextQuery.trim()
    const nextParams = new URLSearchParams(searchParams)

    if (normalizedQuery) {
      nextParams.set('q', normalizedQuery)
    } else {
      nextParams.delete('q')
    }

    const targetPath =
      location.pathname.startsWith('/app/dashboard') ||
      location.pathname.startsWith('/app/documents') ||
      location.pathname.startsWith('/app/explore')
        ? location.pathname
        : '/app/explore'

    const nextSearch = nextParams.toString()
    navigate(
      {
        pathname: targetPath,
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: targetPath === location.pathname },
    )
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigateWithQuery(query)
  }

  function handleSearchChange(nextQuery: string) {
    navigateWithQuery(nextQuery)
  }

  function handleClearSearch() {
    navigateWithQuery('')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-rke-border/80 bg-white/85 backdrop-blur-xl">
      <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-8">
        <form
          className="flex w-full max-w-3xl items-center gap-3 rounded-2xl border border-rke-border bg-rke-surface/70 px-4 py-3 text-rke-copy"
          onSubmit={handleSearchSubmit}
        >
          <Search size={18} />
          <input
            className="w-full border-none bg-transparent text-sm text-rke-navy outline-none placeholder:text-slate-400"
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search documents, authors, topics..."
            type="text"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear search"
              className="grid size-8 place-items-center rounded-full text-rke-copy transition hover:bg-white hover:text-rke-navy"
              onClick={handleClearSearch}
              type="button"
            >
              <X size={16} />
            </button>
          )}
        </form>

        <div className="flex items-center gap-4">
        {/*
          Notifications are hidden for now because the feature is not wired yet.
          Restore this button when notification data is available.
          <button
            className="relative grid size-11 place-items-center rounded-2xl border border-rke-border bg-white text-rke-copy transition hover:border-rke-teal hover:text-rke-teal"
            type="button"
          >
            <Bell size={18} />
            <span className="absolute right-3 top-3 size-2 rounded-full bg-rose-500" />
          </button>
        */}

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
                    {displayName}
                  </p>
                  {user?.email && (
                    <p className="mt-1 truncate text-xs text-rke-copy">
                      {user.email}
                    </p>
                  )}
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
