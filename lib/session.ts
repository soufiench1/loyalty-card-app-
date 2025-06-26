export interface SessionData {
  isAuthenticated: boolean
  timestamp: number
  expiresAt: number
  userType: "admin" | "scan" // Track session type
}

const SESSION_DURATION = 60 * 60 * 1000 // 30 minutes in milliseconds
const ADMIN_SESSION_KEY = "admin_session"
const SCAN_SESSION_KEY = "scan_session"

export function createAdminSession(): SessionData {
  const now = Date.now()
  const session: SessionData = {
    isAuthenticated: true,
    timestamp: now,
    expiresAt: now + SESSION_DURATION,
    userType: "admin",
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session))
    // Also create scan session when admin logs in
    localStorage.setItem(SCAN_SESSION_KEY, JSON.stringify({ ...session, userType: "scan" }))
  }

  return session
}

export function createScanSession(): SessionData {
  const now = Date.now()
  const session: SessionData = {
    isAuthenticated: true,
    timestamp: now,
    expiresAt: now + SESSION_DURATION,
    userType: "scan",
  }

  if (typeof window !== "undefined") {
    localStorage.setItem(SCAN_SESSION_KEY, JSON.stringify(session))
  }

  return session
}

export function getAdminSession(): SessionData | null {
  if (typeof window === "undefined") return null

  try {
    const sessionStr = localStorage.getItem(ADMIN_SESSION_KEY)
    if (!sessionStr) return null

    const session: SessionData = JSON.parse(sessionStr)

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearAdminSession()
      return null
    }

    return session
  } catch (error) {
    clearAdminSession()
    return null
  }
}

export function getScanSession(): SessionData | null {
  if (typeof window === "undefined") return null

  try {
    const sessionStr = localStorage.getItem(SCAN_SESSION_KEY)
    if (!sessionStr) return null

    const session: SessionData = JSON.parse(sessionStr)

    // Check if session is expired
    if (Date.now() > session.expiresAt) {
      clearScanSession()
      return null
    }

    return session
  } catch (error) {
    clearScanSession()
    return null
  }
}

export function clearAdminSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(ADMIN_SESSION_KEY)
  }
}

export function clearScanSession(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(SCAN_SESSION_KEY)
  }
}

export function clearAllSessions(): void {
  clearAdminSession()
  clearScanSession()
}

export function isAdminSessionValid(): boolean {
  const session = getAdminSession()
  return session !== null && session.isAuthenticated && Date.now() < session.expiresAt
}

export function isScanSessionValid(): boolean {
  const session = getScanSession()
  return session !== null && session.isAuthenticated && Date.now() < session.expiresAt
}

export function getRemainingTime(sessionType: "admin" | "scan" = "admin"): number {
  const session = sessionType === "admin" ? getAdminSession() : getScanSession()
  if (!session) return 0

  const remaining = session.expiresAt - Date.now()
  return Math.max(0, remaining)
}

export function formatRemainingTime(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60))
  const seconds = Math.floor((ms % (1000 * 60)) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function extendSession(sessionType: "admin" | "scan" = "admin"): void {
  const now = Date.now()
  const session = {
    isAuthenticated: true,
    timestamp: now,
    expiresAt: now + SESSION_DURATION,
    userType: sessionType,
  }

  if (typeof window !== "undefined") {
    const key = sessionType === "admin" ? ADMIN_SESSION_KEY : SCAN_SESSION_KEY
    localStorage.setItem(key, JSON.stringify(session))
  }
}
