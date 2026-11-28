import { describe, expect, it, vi } from 'vitest'
import {
  GAMES_HUB_URL,
  isFromHubReferrer,
  navigateToGamesHub,
} from '../hubNavigation'

describe('hubNavigation', () => {
  it('detects games.burks.pro root referrer', () => {
    expect(isFromHubReferrer('https://games.burks.pro/')).toBe(true)
    expect(isFromHubReferrer('https://games.burks.pro/?ref=card')).toBe(true)
    expect(isFromHubReferrer('https://games.burks.pro/purrpal/')).toBe(false)
    expect(isFromHubReferrer('https://example.com/')).toBe(false)
    expect(isFromHubReferrer('')).toBe(false)
    expect(isFromHubReferrer('not-a-url')).toBe(false)
  })

  it('uses history.back() wrapped in startViewTransition when hosted on games.burks.pro and arriving from /', () => {
    const back = vi.fn()
    const assign = vi.fn()
    const startViewTransition = vi.fn((cb: () => void) => cb())

    navigateToGamesHub({
      hostname: 'games.burks.pro',
      referrer: 'https://games.burks.pro/',
      historyLength: 2,
      back,
      assign,
      startViewTransition,
    })

    expect(startViewTransition).toHaveBeenCalledTimes(1)
    expect(back).toHaveBeenCalledTimes(1)
    expect(assign).not.toHaveBeenCalled()
  })

  it('uses history.back() directly when startViewTransition is unavailable', () => {
    const back = vi.fn()
    const assign = vi.fn()

    navigateToGamesHub({
      hostname: 'games.burks.pro',
      referrer: 'https://games.burks.pro/',
      historyLength: 2,
      back,
      assign,
    })

    expect(back).toHaveBeenCalledTimes(1)
    expect(assign).not.toHaveBeenCalled()
  })

  it('navigates in-place to / when opened directly on games.burks.pro (PWA shortcut)', () => {
    const back = vi.fn()
    const assign = vi.fn()

    navigateToGamesHub({
      hostname: 'games.burks.pro',
      referrer: '',
      historyLength: 1,
      back,
      assign,
    })

    expect(assign).toHaveBeenCalledWith('/')
    expect(back).not.toHaveBeenCalled()
  })

  it('navigates in-place to https://games.burks.pro/ when running elsewhere', () => {
    const back = vi.fn()
    const assign = vi.fn()

    navigateToGamesHub({
      hostname: 'localhost',
      referrer: '',
      historyLength: 1,
      back,
      assign,
    })

    expect(assign).toHaveBeenCalledWith(GAMES_HUB_URL)
    expect(back).not.toHaveBeenCalled()
  })
})
