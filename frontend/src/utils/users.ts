import type { AuthUser } from '../context/auth-context'

export function userDisplayName(user: AuthUser | null, fallback = 'User') {
  if (user?.full_name?.trim()) {
    return user.full_name.trim()
  }

  return (
    user?.email
      ?.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (character) => character.toUpperCase()) ?? fallback
  )
}

export function userInitials(user: AuthUser | null) {
  const name = userDisplayName(user)
  const parts = name.split(/\s+/).filter(Boolean)
  const firstInitial = parts[0]?.charAt(0) ?? 'U'
  const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : ''

  return `${firstInitial}${lastInitial}`.toUpperCase()
}
