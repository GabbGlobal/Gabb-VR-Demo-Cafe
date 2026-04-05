/**
 * Netlify Identity wrapper.
 *
 * Bridges Netlify Identity (real email auth) with the Zustand userStore.
 * The CDN widget is loaded in index.html.
 *
 * Subscription tiers stored in Netlify Identity user app_metadata:
 *   { subscription: 'free' | 'language' | 'allaccess', stripe_customer: 'cus_xxx' }
 *
 * This is written by the stripe-webhook function when payment completes.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NetlifyIdentityUser {
  id: string
  email: string
  confirmed_at?: string
  user_metadata: {
    full_name?: string
    avatar_url?: string
  }
  app_metadata: {
    roles?: string[]
    subscription?: 'free' | 'language' | 'allaccess'
    stripe_customer?: string
    stripe_subscription?: string
  }
  token?: {
    access_token: string
    expires_at: string
  }
}

type IdentityEvent = 'init' | 'login' | 'logout' | 'error' | 'open' | 'close'

interface NetlifyIdentityWidget {
  open: (tab?: 'login' | 'signup') => void
  close: () => void
  currentUser: () => NetlifyIdentityUser | null
  on: (event: IdentityEvent, cb: (user?: NetlifyIdentityUser) => void) => void
  off: (event: IdentityEvent, cb: (user?: NetlifyIdentityUser) => void) => void
  logout: () => Promise<void>
  refresh: (force?: boolean) => Promise<string>
  store: { user: NetlifyIdentityUser | null }
}

declare global {
  interface Window {
    netlifyIdentity?: NetlifyIdentityWidget
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function ni(): NetlifyIdentityWidget | undefined {
  return window.netlifyIdentity
}

export function currentUser(): NetlifyIdentityUser | null {
  return window.netlifyIdentity?.currentUser() ?? null
}

export function openLogin() {
  window.netlifyIdentity?.open('login')
}

export function openSignup() {
  window.netlifyIdentity?.open('signup')
}

export async function logout() {
  await window.netlifyIdentity?.logout()
}

export function isLoggedIn(): boolean {
  return window.netlifyIdentity?.currentUser() !== null
}

export function getEmail(): string | null {
  return window.netlifyIdentity?.currentUser()?.email ?? null
}

export function getSubscription(): 'free' | 'language' | 'allaccess' | null {
  const user = currentUser()
  return user?.app_metadata?.subscription ?? null
}

export function hasPaidAccess(): boolean {
  const sub = getSubscription()
  return sub === 'language' || sub === 'allaccess'
}

// ─── Store sync ───────────────────────────────────────────────────────────────
// Call this once from main.tsx — syncs Netlify Identity events to Zustand store.

interface MinimalStore {
  signIn:  () => void
  signOut: () => void
  isLoggedIn: boolean
}

export function initIdentity(store: MinimalStore) {
  if (typeof window === 'undefined') return

  // Wait for widget to load
  const setup = () => {
    const identity = window.netlifyIdentity
    if (!identity) return

    // Sync current session on load
    if (identity.currentUser()) {
      if (!store.isLoggedIn) store.signIn()
    }

    identity.on('login', () => {
      store.signIn()
      // Close modal after login
      identity.close()
    })

    identity.on('logout', () => {
      store.signOut()
    })
  }

  // Widget may not be ready immediately
  if (window.netlifyIdentity) {
    setup()
  } else {
    // Retry after a tick
    setTimeout(setup, 100)
  }
}
