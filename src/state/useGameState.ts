import { useCallback, useEffect, useRef, useState } from 'react'
import type { CoatStyle, GameState, LevelUpEvent } from '../types/game'
import {
  createInitialGameState,
  reduceGameState,
  type GameAction,
} from './gameReducer'
import {
  attachLifecycleFlushListeners,
  clearGameState,
  loadGameState,
  requestPersistentStorage,
  saveGameState,
  saveGameStateSync,
} from './storage'
import { applyElapsedTime } from './timeDecay'

export interface UseGameStateReturn {
  gameState: GameState | null
  isLoading: boolean
  pendingLevelUp: LevelUpEvent | null
  dismissLevelUp: () => void
  dispatch: (action: GameAction, immediateSave?: boolean) => void
  createKitty: (name: string, coat: CoatStyle) => void
  importState: (state: GameState) => Promise<void>
  resetKitty: () => Promise<void>
}

export function useGameState(): UseGameStateReturn {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelUpEvent | null>(null)

  const stateRef = useRef<GameState | null>(null)
  const saveTimerRef = useRef<number | null>(null)

  useEffect(() => {
    stateRef.current = gameState
  }, [gameState])

  // Load saved state once on mount and run cozy offline catch-up
  useEffect(() => {
    let active = true
    void requestPersistentStorage()

    loadGameState()
      .then((loaded) => {
        if (!active) return
        if (loaded) {
          const caughtUp = applyElapsedTime(loaded, Date.now())
          stateRef.current = caughtUp
          setGameState(caughtUp)
          if (caughtUp !== loaded) {
            void saveGameState(caughtUp)
          }
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  // Attach iPadOS lifecycle flush listeners (`visibilitychange` & `pagehide`)
  // and catch up elapsed time when returning to the app
  useEffect(() => {
    const detachFlush = attachLifecycleFlushListeners(() => stateRef.current)

    const syncElapsed = () => {
      if (!stateRef.current) return
      const caughtUp = applyElapsedTime(stateRef.current, Date.now())
      if (caughtUp !== stateRef.current) {
        stateRef.current = caughtUp
        setGameState(caughtUp)
        void saveGameState(caughtUp)
      }
    }

    const onReturnVisible = () => {
      if (document.visibilityState === 'visible') {
        syncElapsed()
      }
    }

    document.addEventListener('visibilitychange', onReturnVisible)
    window.addEventListener('focus', syncElapsed)

    // Tick every 15s while open so real-time stat updates reflect smoothly without refresh
    const tickInterval = window.setInterval(syncElapsed, 15_000)

    return () => {
      detachFlush()
      document.removeEventListener('visibilitychange', onReturnVisible)
      window.removeEventListener('focus', syncElapsed)
      window.clearInterval(tickInterval)
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [])

  const scheduleSave = useCallback((next: GameState, immediate: boolean) => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    if (immediate) {
      saveGameStateSync(next)
    } else {
      saveTimerRef.current = window.setTimeout(() => {
        void saveGameState(next)
        saveTimerRef.current = null
      }, 250)
    }
  }, [])

  const dispatch = useCallback(
    (action: GameAction, immediateSave = false) => {
      const current = stateRef.current
      if (!current) return

      const { state: next, levelUp } = reduceGameState(current, action)
      if (next === current && !levelUp) return

      stateRef.current = next
      setGameState(next)
      if (levelUp) {
        setPendingLevelUp(levelUp)
      }
      scheduleSave(next, immediateSave || Boolean(levelUp))
    },
    [scheduleSave],
  )

  const createKitty = useCallback(
    (name: string, coat: CoatStyle) => {
      const fresh = createInitialGameState(name, coat, Date.now())
      stateRef.current = fresh
      setGameState(fresh)
      setPendingLevelUp(null)
      scheduleSave(fresh, true)
    },
    [scheduleSave],
  )

  const importState = useCallback(async (restored: GameState) => {
    const now = Date.now()
    const normalized: GameState = {
      ...restored,
      lastSavedAt: now,
      lastDecayAt: now,
    }
    stateRef.current = normalized
    setGameState(normalized)
    setPendingLevelUp(null)
    await saveGameState(normalized)
  }, [])

  const resetKitty = useCallback(async () => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    stateRef.current = null
    setGameState(null)
    setPendingLevelUp(null)
    await clearGameState()
  }, [])

  const dismissLevelUp = useCallback(() => {
    setPendingLevelUp(null)
  }, [])

  return {
    gameState,
    isLoading,
    pendingLevelUp,
    dismissLevelUp,
    dispatch,
    createKitty,
    importState,
    resetKitty,
  }
}
