/**
 * App-wide default parent preferences.
 *
 * Set these via `.env` / Docker build args (VITE_PARENT_WEBHOOK_URL,
 * VITE_PARENT_EMAIL, VITE_PARENT_PIN, VITE_UNLOCK_ALL_MINIGAMES) or edit
 * these constants directly before building so every kid's device/browser
 * automatically loads with your preferences pre-filled.
 */
export const APP_DEFAULT_SETTINGS = {
  parentWebhookUrl:
    (import.meta.env.VITE_PARENT_WEBHOOK_URL as string | undefined)?.trim() || '',
  parentEmail:
    (import.meta.env.VITE_PARENT_EMAIL as string | undefined)?.trim() || '',
  parentPin:
    (import.meta.env.VITE_PARENT_PIN as string | undefined)?.trim() || '1234',
  unlockAllMiniGames:
    (import.meta.env.VITE_UNLOCK_ALL_MINIGAMES as string | undefined)?.trim() === 'true',
} as const

export const APP_VERSION = '1.2.1'
