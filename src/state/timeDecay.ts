import type { CatMood, GameState, MessType, RoomMess, StatKey } from '../types/game'

export const STAT_FLOOR = 15
export const STAT_MAX = 100
export const MAX_MESSES = 3

export const HUNGER_DECAY_PER_HOUR = 4
export const CLEANLINESS_DECAY_PER_HOUR = 3
export const CLEANLINESS_MESS_PENALTY = 8
export const HAPPINESS_DECAY_PER_HOUR = 4
export const HOURS_PER_MESS = 4

const MESS_TYPES: MessType[] = ['pawprints', 'hairball', 'toy']

const MESS_SLOTS: Array<{ x: number; y: number }> = [
  { x: 22, y: 74 },
  { x: 77, y: 75 },
  { x: 34, y: 82 },
  { x: 66, y: 81 },
  { x: 18, y: 82 },
  { x: 82, y: 69 },
]

export function clampStat(value: number): number {
  if (!Number.isFinite(value)) return STAT_FLOOR
  return Math.max(STAT_FLOOR, Math.min(STAT_MAX, Math.round(value)))
}

export function createRoomMess(
  existingMesses: RoomMess[],
  seed: number = Date.now(),
): RoomMess {
  const usedSlots = existingMesses.map((m) => ({ x: m.x, y: m.y }))
  const available = MESS_SLOTS.filter(
    (slot) =>
      !usedSlots.some(
        (u) => Math.abs(u.x - slot.x) < 10 && Math.abs(u.y - slot.y) < 7,
      ),
  )
  const chosenSlot =
    available.length > 0
      ? available[Math.abs(seed) % available.length]
      : MESS_SLOTS[existingMesses.length % MESS_SLOTS.length]

  const existingTypes = new Set(existingMesses.map((m) => m.type))
  const preferredType =
    MESS_TYPES.find((t) => !existingTypes.has(t)) ??
    MESS_TYPES[Math.abs(seed) % MESS_TYPES.length]

  return {
    id: `mess_${seed}_${existingMesses.length}`,
    x: chosenSlot.x,
    y: chosenSlot.y,
    type: preferredType,
  }
}

/**
 * Applies cozy offline elapsed-time decay.
 * - Never drops any stat below STAT_FLOOR (15%).
 * - Spawns at most MAX_MESSES (3) messes in the room.
 * - Zero permadeath, zero harsh penalties.
 */
export function applyElapsedTime(state: GameState, now: number): GameState {
  const elapsedMs = Math.max(0, now - state.lastSavedAt)
  // Ignore tiny sub-minute deltas during active ticking unless >= 60s
  if (elapsedMs < 60_000) {
    return state
  }

  const elapsedHours = elapsedMs / 3_600_000

  const currentMesses = state.room.messes.slice(0, MAX_MESSES)
  const messesToAdd = Math.min(
    MAX_MESSES - currentMesses.length,
    Math.floor(elapsedHours / HOURS_PER_MESS),
  )

  const updatedMesses = [...currentMesses]
  for (let i = 0; i < messesToAdd; i += 1) {
    updatedMesses.push(createRoomMess(updatedMesses, now + i * 17))
  }

  // Active messes gently increase cleanliness decay (-8 per active mess, scaled over time or immediately on spawn)
  const activeMessCount = updatedMesses.length
  const hungerDecay = HUNGER_DECAY_PER_HOUR * elapsedHours
  const happinessDecay = HAPPINESS_DECAY_PER_HOUR * elapsedHours
  const cleanlinessDecay =
    CLEANLINESS_DECAY_PER_HOUR * elapsedHours +
    CLEANLINESS_MESS_PENALTY * activeMessCount * Math.min(1, elapsedHours)

  const nextHunger = clampStat(state.stats.hunger - hungerDecay)
  const nextHappiness = clampStat(state.stats.happiness - happinessDecay)
  const nextCleanliness = clampStat(state.stats.cleanliness - cleanlinessDecay)

  // Only advance lastSavedAt if at least 1 full stat point or mess changed, or >= 15 minutes passed
  const changed =
    nextHunger !== state.stats.hunger ||
    nextHappiness !== state.stats.happiness ||
    nextCleanliness !== state.stats.cleanliness ||
    updatedMesses.length !== state.room.messes.length

  if (!changed && elapsedMs < 15 * 60_000) {
    return state
  }

  return {
    ...state,
    lastSavedAt: now,
    stats: {
      hunger: nextHunger,
      cleanliness: nextCleanliness,
      happiness: nextHappiness,
    },
    room: {
      ...state.room,
      messes: updatedMesses,
    },
  }
}

export function getCatMood(stats: GameState['stats']): CatMood {
  if (stats.hunger < 30 || stats.cleanliness < 30 || stats.happiness < 30) {
    return 'needsCare'
  }
  if (stats.hunger >= 60 && stats.cleanliness >= 60 && stats.happiness >= 60) {
    return 'thriving'
  }
  return 'normal'
}

export function getPriorityNeed(stats: GameState['stats']): StatKey | null {
  const entries: Array<[StatKey, number]> = [
    ['hunger', stats.hunger],
    ['cleanliness', stats.cleanliness],
    ['happiness', stats.happiness],
  ]
  const low = entries.filter(([, val]) => val < 30).sort((a, b) => a[1] - b[1])
  return low.length > 0 ? low[0][0] : null
}
