export const GAMES_HUB_HOST = 'games.burks.pro'
export const GAMES_HUB_URL = 'https://games.burks.pro/'

export interface HubNavEnvironment {
  hostname: string
  referrer: string
  historyLength: number
  back: () => void
  assign: (url: string) => void
  startViewTransition?: (callback: () => void) => unknown
}

export function isFromHubReferrer(referrer: string): boolean {
  if (!referrer) return false
  try {
    const parsed = new URL(referrer)
    return parsed.hostname === GAMES_HUB_HOST && parsed.pathname === '/'
  } catch {
    return false
  }
}

export function navigateToGamesHub(env?: HubNavEnvironment): void {
  const target: HubNavEnvironment = env ?? {
    hostname: window.location.hostname,
    referrer: document.referrer,
    historyLength: window.history.length,
    back: () => window.history.back(),
    assign: (url: string) => window.location.assign(url),
    startViewTransition:
      typeof document.startViewTransition === 'function'
        ? (cb) => document.startViewTransition(cb)
        : undefined,
  }

  if (target.hostname === GAMES_HUB_HOST) {
    if (isFromHubReferrer(target.referrer) && target.historyLength > 1) {
      if (target.startViewTransition) {
        target.startViewTransition(() => {
          target.back()
        })
      } else {
        target.back()
      }
      return
    }
    target.assign('/')
    return
  }

  target.assign(GAMES_HUB_URL)
}
