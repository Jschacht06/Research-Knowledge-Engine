import {
  FileText,
  Grid2x2,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Upload,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { userDisplayName, userInitials } from '../../utils/users'
import { AppLogo } from '../ui/AppLogo'

const links = [
  { to: '/app/dashboard', label: 'Dashboard', icon: Grid2x2 },
  { to: '/app/chat', label: 'Chat', icon: MessageSquare },
  { to: '/app/documents', label: 'My Documents', icon: FileText },
  { to: '/app/explore', label: 'Explore', icon: Search },
  { to: '/app/upload', label: 'Upload', icon: Upload },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function WorkspaceSidebar() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const initials = userInitials(user)
  const username = userDisplayName(user)

  function handleLogout() {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <aside className="flex h-full flex-col border-b border-rke-border/80 bg-white px-4 py-5 lg:border-b-0 lg:border-r">
      <AppLogo compact to="/app/dashboard" />

      <div className="mt-8 flex items-center gap-3 rounded-[28px] border border-rke-border/70 bg-rke-surface/60 p-4">
        <div className="grid size-12 place-items-center rounded-2xl bg-rke-teal font-bold text-white">
          {initials}
        </div>
        <div>
          <p className="truncate font-bold text-rke-navy">{username}</p>
          <p className="text-sm text-rke-copy">Researcher</p>
        </div>
      </div>

      <nav className="mt-8 grid gap-2">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-rke-teal text-white shadow-lg shadow-rke-teal/20'
                  : 'text-rke-copy hover:bg-rke-surface hover:text-rke-navy'
              }`
            }
            to={to}
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        className="mt-auto inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rke-teal transition hover:bg-rke-teal-soft"
        onClick={handleLogout}
        type="button"
      >
        <LogOut size={18} />
        Log out
      </button>
    </aside>
  )
}
