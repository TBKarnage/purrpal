import { APP_DEFAULT_SETTINGS } from '../config/appDefaults'
import type {
  CoatStyle,
  FeedbackReport,
  GameState,
  HideSeekDifficulty,
  MessType,
  MiniGameDifficulty,
  MiniGameId,
  RoomMess,
} from '../types/game'
import {
  getUnlockedAccessoriesForLevel,
  getUnlockedDecorForLevel,
  stageForLevel,
} from './gameReducer'
import { MAX_MESSES, clampStat } from './timeDecay'

export const DB_NAME = 'purrpal_db'
export const DB_VERSION = 1
export const STORE_NAME = 'game_state'
export const STATE_KEY = 'current'
export const LOCAL_STORAGE_KEY = 'purrpal_save_v1'

const VALID_COATS = new Set<CoatStyle>(['tabby', 'tuxedo', 'calico', 'gray'])
const VALID_MESS_TYPES = new Set<MessType>(['pawprints', 'hairball', 'toy'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateAndNormalizeGameState(raw: unknown): GameState | null {
  if (!isRecord(raw)) return null
  if (raw.schemaVersion !== 1) return null
  if (!isRecord(raw.cat) || !isRecord(raw.stats) || !isRecord(raw.room)) return null
  if (!isRecord(raw.inventory) || !isRecord(raw.settings)) return null

  const rawName = typeof raw.cat.name === 'string' ? raw.cat.name.trim() : ''
  if (!rawName) return null

  const coat = VALID_COATS.has(raw.cat.coat as CoatStyle)
    ? (raw.cat.coat as CoatStyle)
    : 'tabby'

  const level =
    typeof raw.cat.level === 'number' && Number.isFinite(raw.cat.level)
      ? Math.max(1, Math.floor(raw.cat.level))
      : 1

  const xp =
    typeof raw.cat.xp === 'number' && Number.isFinite(raw.cat.xp)
      ? Math.max(0, Math.floor(raw.cat.xp))
      : 0

  const stage = stageForLevel(level)

  const createdAt =
    typeof raw.createdAt === 'number' && Number.isFinite(raw.createdAt)
      ? raw.createdAt
      : Date.now()
  const lastSavedAt =
    typeof raw.lastSavedAt === 'number' && Number.isFinite(raw.lastSavedAt)
      ? raw.lastSavedAt
      : createdAt
  const lastDecayAt =
    typeof raw.lastDecayAt === 'number' && Number.isFinite(raw.lastDecayAt)
      ? raw.lastDecayAt
      : lastSavedAt

  const rawCarry = isRecord(raw.statCarry) ? raw.statCarry : null
  const clampCarry = (val: unknown) =>
    typeof val === 'number' && Number.isFinite(val) ? Math.max(0, Math.min(10, val)) : 0
  const statCarry = {
    hunger: clampCarry(rawCarry?.hunger),
    cleanliness: clampCarry(rawCarry?.cleanliness),
    happiness: clampCarry(rawCarry?.happiness),
    mess: clampCarry(rawCarry?.mess),
  }

  const rawMesses = Array.isArray(raw.room.messes) ? raw.room.messes : []
  const messes: RoomMess[] = []
  for (const m of rawMesses.slice(0, MAX_MESSES)) {
    if (!isRecord(m)) continue
    if (typeof m.id !== 'string') continue
    const x = typeof m.x === 'number' && Number.isFinite(m.x) ? Math.max(14, Math.min(86, m.x)) : 25
    const y = typeof m.y === 'number' && Number.isFinite(m.y) ? Math.max(58, Math.min(71, m.y)) : 65
    const type: MessType = VALID_MESS_TYPES.has(m.type as MessType)
      ? (m.type as MessType)
      : 'pawprints'
    messes.push({ id: m.id, x, y, type })
  }

  const unlockedAccessories = Array.from(
    new Set([
      ...(Array.isArray(raw.inventory.unlockedAccessories)
        ? raw.inventory.unlockedAccessories.filter((x): x is string => typeof x === 'string')
        : []),
      ...getUnlockedAccessoriesForLevel(level),
    ]),
  )

  const unlockedDecor = Array.from(
    new Set([
      ...(Array.isArray(raw.room.unlockedDecor)
        ? raw.room.unlockedDecor.filter((x): x is string => typeof x === 'string')
        : []),
      ...getUnlockedDecorForLevel(level),
    ]),
  )

  const equippedDecor = Array.isArray(raw.room.equippedDecor)
    ? raw.room.equippedDecor.filter(
        (id): id is string => typeof id === 'string' && unlockedDecor.includes(id),
      )
    : []

  const equippedAccessory =
    typeof raw.cat.equippedAccessory === 'string' &&
    unlockedAccessories.includes(raw.cat.equippedAccessory)
      ? raw.cat.equippedAccessory
      : null

  const rawStyle = isRecord(raw.cat.style) ? raw.cat.style : null
  const eyeColor =
    rawStyle && typeof rawStyle.eyeColor === 'string' ? rawStyle.eyeColor : 'cocoa'
  const cheekStyle =
    rawStyle && typeof rawStyle.cheekStyle === 'string' ? rawStyle.cheekStyle : 'rosy'
  const neck =
    rawStyle &&
    typeof rawStyle.neck === 'string' &&
    unlockedAccessories.includes(rawStyle.neck)
      ? rawStyle.neck
      : null
  const eyes =
    rawStyle &&
    typeof rawStyle.eyes === 'string' &&
    unlockedAccessories.includes(rawStyle.eyes)
      ? rawStyle.eyes
      : null
  const head =
    rawStyle &&
    typeof rawStyle.head === 'string' &&
    unlockedAccessories.includes(rawStyle.head)
      ? rawStyle.head
      : null

  const rugStyle =
    typeof raw.room.rugStyle === 'string' ? raw.room.rugStyle : 'cream'

  const treats: Record<string, number> = {}
  if (isRecord(raw.inventory.treats)) {
    for (const [key, val] of Object.entries(raw.inventory.treats)) {
      if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
        treats[key] = Math.floor(val)
      }
    }
  }

  const coins =
    typeof raw.inventory.coins === 'number' && Number.isFinite(raw.inventory.coins)
      ? Math.max(0, Math.floor(raw.inventory.coins))
      : 0

  const tutorialStep =
    typeof raw.tutorialStep === 'number' && Number.isFinite(raw.tutorialStep)
      ? Math.max(0, Math.min(3, Math.floor(raw.tutorialStep)))
      : 3

  const feedsSinceMess =
    typeof raw.feedsSinceMess === 'number' && Number.isFinite(raw.feedsSinceMess)
      ? Math.max(0, Math.floor(raw.feedsSinceMess))
      : 0

  const validDiffs = new Set<HideSeekDifficulty>(['easy', 'medium', 'hard'])
  const validGames = new Set<MiniGameId>(['laser', 'hide_seek', 'sky_hop', 'bubbles', 'treats'])

  const hideSeekBeaten = Array.isArray(raw.hideSeekBeaten)
    ? Array.from(
        new Set(
          raw.hideSeekBeaten.filter(
            (d): d is HideSeekDifficulty =>
              typeof d === 'string' && validDiffs.has(d as HideSeekDifficulty),
          ),
        ),
      )
    : []

  const miniGameBeaten: Partial<Record<MiniGameId, MiniGameDifficulty[]>> = {}
  if (isRecord(raw.miniGameBeaten)) {
    for (const [k, val] of Object.entries(raw.miniGameBeaten)) {
      if (validGames.has(k as MiniGameId) && Array.isArray(val)) {
        const cleaned = Array.from(
          new Set(
            val.filter(
              (d): d is MiniGameDifficulty =>
                typeof d === 'string' && validDiffs.has(d as MiniGameDifficulty),
            ),
          ),
        )
        if (cleaned.length > 0) {
          miniGameBeaten[k as MiniGameId] = cleaned
        }
      }
    }
  }
  if (hideSeekBeaten.length > 0 && !miniGameBeaten.hide_seek) {
    miniGameBeaten.hide_seek = hideSeekBeaten
  }

  const feedbackReports: FeedbackReport[] = Array.isArray(raw.feedbackReports)
    ? raw.feedbackReports
        .filter((r): r is Record<string, unknown> => isRecord(r))
        .slice(0, 50)
        .map((r, idx) => ({
          id: typeof r.id === 'string' ? r.id : `fb_${idx}`,
          kind: r.kind === 'request' ? 'request' : 'bug',
          createdAt:
            typeof r.createdAt === 'number' && Number.isFinite(r.createdAt)
              ? r.createdAt
              : Date.now(),
          catName: typeof r.catName === 'string' ? r.catName.slice(0, 16) : rawName.slice(0, 16),
          catLevel:
            typeof r.catLevel === 'number' && Number.isFinite(r.catLevel) ? r.catLevel : level,
          activity: typeof r.activity === 'string' ? r.activity : undefined,
          symptom: typeof r.symptom === 'string' ? r.symptom : undefined,
          message: typeof r.message === 'string' ? r.message.slice(0, 600) : '',
          usedVoice: typeof r.usedVoice === 'boolean' ? r.usedVoice : undefined,
          sentToWebhook: typeof r.sentToWebhook === 'boolean' ? r.sentToWebhook : undefined,
        }))
    : []

  return {
    schemaVersion: 1,
    createdAt,
    lastSavedAt,
    lastDecayAt,
    statCarry,
    cat: {
      name: rawName.slice(0, 16),
      coat,
      level,
      xp,
      stage,
      equippedAccessory,
      style: rawStyle
        ? { eyeColor, cheekStyle, neck, eyes, head }
        : undefined,
    },
    stats: {
      hunger: clampStat(Number(raw.stats.hunger)),
      cleanliness: clampStat(Number(raw.stats.cleanliness)),
      happiness: clampStat(Number(raw.stats.happiness)),
    },
    room: {
      messes,
      unlockedDecor,
      equippedDecor,
      rugStyle,
    },
    inventory: {
      coins,
      treats,
      unlockedAccessories,
    },
    settings: {
      soundEnabled:
        typeof raw.settings.soundEnabled === 'boolean' ? raw.settings.soundEnabled : true,
      unlockAllMiniGames:
        typeof raw.settings.unlockAllMiniGames === 'boolean'
          ? raw.settings.unlockAllMiniGames
          : APP_DEFAULT_SETTINGS.unlockAllMiniGames,
      parentWebhookUrl:
        typeof raw.settings.parentWebhookUrl === 'string' && raw.settings.parentWebhookUrl.trim()
          ? raw.settings.parentWebhookUrl.slice(0, 300)
          : APP_DEFAULT_SETTINGS.parentWebhookUrl || undefined,
      parentEmail:
        typeof raw.settings.parentEmail === 'string' && raw.settings.parentEmail.trim()
          ? raw.settings.parentEmail.slice(0, 120)
          : APP_DEFAULT_SETTINGS.parentEmail || undefined,
      parentPin:
        typeof raw.settings.parentPin === 'string' && raw.settings.parentPin.trim()
          ? raw.settings.parentPin.slice(0, 12)
          : APP_DEFAULT_SETTINGS.parentPin || '1234',
    },
    tutorialStep,
    feedsSinceMess,
    hideSeekBeaten,
    miniGameBeaten,
    feedbackReports,
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') {
        resolve(null)
        return
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

async function readFromIndexedDB(): Promise<GameState | null> {
  const db = await openDatabase()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.get(STATE_KEY)
      req.onsuccess = () => {
        resolve(validateAndNormalizeGameState(req.result))
      }
      req.onerror = () => resolve(null)
      tx.oncomplete = () => db.close()
      tx.onabort = () => db.close()
    } catch {
      db.close()
      resolve(null)
    }
  })
}

async function writeToIndexedDB(state: GameState): Promise<void> {
  const db = await openDatabase()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      store.put(state, STATE_KEY)
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        resolve()
      }
      tx.onabort = () => {
        db.close()
        resolve()
      }
    } catch {
      db.close()
      resolve()
    }
  })
}

async function clearIndexedDB(): Promise<void> {
  const db = await openDatabase()
  if (!db) return
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(STATE_KEY)
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        resolve()
      }
    } catch {
      db.close()
      resolve()
    }
  })
}

function readFromLocalStorage(): GameState | null {
  try {
    if (typeof localStorage === 'undefined') return null
    const serialized = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!serialized) return null
    const parsed: unknown = JSON.parse(serialized)
    return validateAndNormalizeGameState(parsed)
  } catch {
    return null
  }
}

function writeToLocalStorage(state: GameState): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Ignore quota/private-mode/sandbox errors
  }
}

export async function saveGameState(state: GameState): Promise<void> {
  writeToLocalStorage(state)
  await writeToIndexedDB(state)
}

export function saveGameStateSync(state: GameState): void {
  writeToLocalStorage(state)
  void writeToIndexedDB(state)
}

export async function loadGameState(): Promise<GameState | null> {
  const [idbState, lsState] = await Promise.all([
    readFromIndexedDB(),
    Promise.resolve(readFromLocalStorage()),
  ])

  if (idbState && lsState) {
    // Pick whichever snapshot was written most recently (protects against iOS pagehide sync flush)
    return lsState.lastSavedAt > idbState.lastSavedAt ? lsState : idbState
  }

  const chosen = idbState ?? lsState
  if (chosen) {
    // Self-heal mirror layer if one storage layer was cleared
    writeToLocalStorage(chosen)
    if (!idbState) {
      void writeToIndexedDB(chosen)
    }
  }
  return chosen
}

export async function clearGameState(): Promise<void> {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LOCAL_STORAGE_KEY)
    }
  } catch {
    // Ignore storage access errors
  }
  await clearIndexedDB()
}

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.storage?.persist) {
    return false
  }
  try {
    return await navigator.storage.persist()
  } catch {
    return false
  }
}

export function encodeSaveCode(state: GameState): string {
  const json = JSON.stringify(state)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

export function decodeSaveCode(code: string): GameState | null {
  try {
    const trimmed = code.trim()
    if (!trimmed) return null
    const binary = atob(trimmed)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    const json = new TextDecoder().decode(bytes)
    const parsed: unknown = JSON.parse(json)
    return validateAndNormalizeGameState(parsed)
  } catch {
    return null
  }
}

/**
 * Hooks into iPadOS-safe lifecycle events (`visibilitychange` and `pagehide`)
 * so state always flushes when switching apps or locking the iPad.
 */
export function attachLifecycleFlushListeners(getLatestState: () => GameState | null): () => void {
  const flush = () => {
    const latest = getLatestState()
    if (latest) {
      saveGameStateSync(latest)
    }
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      flush()
    }
  }

  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', flush)

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', flush)
  }
}
