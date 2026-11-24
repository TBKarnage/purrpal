import type {
  CatMood,
  GameState,
  GrowthStage,
  MessType,
  RoomMess,
  StatDecayCarry,
  StatKey,
} from '../types/game'

export const STAT_FLOOR = 25
export const STAT_MAX = 100
export const MAX_MESSES = 3

// Real-time synced cozy decay rates (noticeable while active & backgrounded, floored gently at 25%)
export const HUNGER_DECAY_PER_HOUR = 30 // base kitten rate (~1% every 2 minutes)
export const HUNGER_DECAY_BY_STAGE: Record<GrowthStage, number> = {
  kitten: 30, // ~1% every 2m
  junior: 38, // ~1% every 1m 35s
  teen: 46, // ~1% every 1m 18s
  adult: 55, // ~1% every 1m 5s
}

export function getHungerDecayPerHour(stage: GrowthStage): number {
  return HUNGER_DECAY_BY_STAGE[stage] ?? HUNGER_DECAY_PER_HOUR
}

export const CLEANLINESS_DECAY_PER_HOUR = 12 // ~1% every 5 minutes
export const CLEANLINESS_MESS_PENALTY = 8 // immediate cleanliness dip on mess spawn
export const CLEANLINESS_MESS_DECAY_PER_HOUR = 12 // extra per active mess per hour
export const HAPPINESS_DECAY_PER_HOUR = 18 // ~1% every 3m 20s
export const HOURS_PER_MESS = 1.5

export const EMPTY_STAT_CARRY: StatDecayCarry = {
  hunger: 0,
  cleanliness: 0,
  happiness: 0,
  mess: 0,
}

const MESS_TYPES: MessType[] = ['pawprints', 'hairball', 'toy']

// Calibrated strictly within the clear oak floor / rug band (y: 59..70) above the bottom dock
const MESS_SLOTS: Array<{ x: number; y: number }> = [
  { x: 22, y: 65 },
  { x: 78, y: 66 },
  { x: 34, y: 70 },
  { x: 66, y: 69 },
  { x: 18, y: 60 },
  { x: 82, y: 61 },
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
        (u) => Math.abs(u.x - slot.x) < 10 && Math.abs(u.y - slot.y) < 6,
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
 * Applies real-time synced cozy elapsed-time decay (works identically whether
 * the tab is open, backgrounded, or completely closed).
 * - Uses dedicated `lastDecayAt` + fractional `statCarry` so user interactions
 *   never reset or lose elapsed wall-clock drain time.
 * - Never drops any stat below STAT_FLOOR (25%).
 * - Spawns at most MAX_MESSES (3) messes in the room.
 */
export function applyElapsedTime(state: GameState, now: number): GameState {
  const baseline = state.lastDecayAt ?? state.lastSavedAt
  const elapsedMs = Math.max(0, now - baseline)
  if (elapsedMs < 5_000) {
    return state
  }

  const elapsedHours = elapsedMs / 3_600_000
  const carry: StatDecayCarry = state.statCarry ?? EMPTY_STAT_CARRY

  // Mess spawning synced with real elapsed time
  const currentMesses = state.room.messes.slice(0, MAX_MESSES)
  const rawMessProgress =
    currentMesses.length < MAX_MESSES
      ? carry.mess + elapsedHours / HOURS_PER_MESS
      : 0
  const messesToAdd = Math.min(
    MAX_MESSES - currentMesses.length,
    Math.floor(rawMessProgress),
  )
  const nextMessCarry =
    currentMesses.length + messesToAdd >= MAX_MESSES
      ? 0
      : rawMessProgress - messesToAdd

  const updatedMesses = [...currentMesses]
  for (let i = 0; i < messesToAdd; i += 1) {
    updatedMesses.push(createRoomMess(updatedMesses, now + i * 17))
  }

  // Exact continuous stat decay with fractional carry
  const activeMessCount = updatedMesses.length
  const hungerDecayRate = getHungerDecayPerHour(state.cat.stage)
  const rawHungerLoss = carry.hunger + hungerDecayRate * elapsedHours
  const rawHappinessLoss = carry.happiness + HAPPINESS_DECAY_PER_HOUR * elapsedHours
  const rawCleanLoss =
    carry.cleanliness +
    (CLEANLINESS_DECAY_PER_HOUR + CLEANLINESS_MESS_DECAY_PER_HOUR * activeMessCount) *
      elapsedHours

  const wholeHungerLoss = Math.floor(rawHungerLoss)
  const wholeHappinessLoss = Math.floor(rawHappinessLoss)
  const wholeCleanLoss = Math.floor(rawCleanLoss)

  const nextHunger = clampStat(state.stats.hunger - wholeHungerLoss)
  const nextHappiness = clampStat(state.stats.happiness - wholeHappinessLoss)
  const nextCleanliness = clampStat(state.stats.cleanliness - wholeCleanLoss)

  const nextCarry: StatDecayCarry = {
    hunger: nextHunger <= STAT_FLOOR ? 0 : rawHungerLoss - wholeHungerLoss,
    happiness: nextHappiness <= STAT_FLOOR ? 0 : rawHappinessLoss - wholeHappinessLoss,
    cleanliness: nextCleanliness <= STAT_FLOOR ? 0 : rawCleanLoss - wholeCleanLoss,
    mess: nextMessCarry,
  }

  const statsOrMessChanged =
    nextHunger !== state.stats.hunger ||
    nextHappiness !== state.stats.happiness ||
    nextCleanliness !== state.stats.cleanliness ||
    updatedMesses.length !== state.room.messes.length

  // Avoid unnecessary React renders if neither stats nor messes changed yet,
  // unless at least 30s elapsed (so carry persists across sudden tab closes).
  if (!statsOrMessChanged && elapsedMs < 30_000) {
    return state
  }

  return {
    ...state,
    lastSavedAt: statsOrMessChanged ? now : state.lastSavedAt,
    lastDecayAt: now,
    statCarry: nextCarry,
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
  const avg = (stats.hunger + stats.cleanliness + stats.happiness) / 3
  if (
    stats.happiness <= 35 ||
    stats.hunger <= 30 ||
    stats.cleanliness <= 30 ||
    avg <= 38
  ) {
    return 'sad'
  }
  if (stats.hunger < 50 || stats.cleanliness < 50 || stats.happiness < 50) {
    return 'needsCare'
  }
  if (stats.hunger >= 65 && stats.cleanliness >= 65 && stats.happiness >= 70) {
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
  const low = entries.filter(([, val]) => val < 50).sort((a, b) => a[1] - b[1])
  return low.length > 0 ? low[0][0] : null
}
