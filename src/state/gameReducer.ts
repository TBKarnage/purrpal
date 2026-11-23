import {
  ACCESSORY_CATALOG,
  DECOR_CATALOG,
  DEFAULT_CAT_STYLE,
  FOOD_CATALOG,
  MINIGAME_CATALOG,
  STYLE_CATEGORIES,
  type AccessorySlot,
  type CatStyleConfig,
  type CoatStyle,
  type FoodItem,
  type GameState,
  type GrowthStage,
  type LevelUpEvent,
  type MiniGameId,
} from '../types/game'
import {
  CLEANLINESS_MESS_PENALTY,
  EMPTY_STAT_CARRY,
  MAX_MESSES,
  applyElapsedTime,
  clampStat,
  createRoomMess,
} from './timeDecay'

export function xpRequiredForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level))
  return 50 + (safeLevel - 1) * 30
}

export function stageForLevel(level: number): GrowthStage {
  if (level >= 13) return 'adult'
  if (level >= 8) return 'teen'
  if (level >= 4) return 'junior'
  return 'kitten'
}

export function getUnlockedAccessoriesForLevel(level: number): string[] {
  return ACCESSORY_CATALOG.filter((item) => item.unlockLevel <= level).map(
    (item) => item.id,
  )
}

export function getUnlockedDecorForLevel(level: number): string[] {
  return DECOR_CATALOG.filter((item) => item.unlockLevel <= level).map(
    (item) => item.id,
  )
}

export function resolveCatStyle(cat: GameState['cat']): CatStyleConfig {
  if (cat.style) {
    return {
      ...DEFAULT_CAT_STYLE,
      ...cat.style,
    }
  }
  const style: CatStyleConfig = { ...DEFAULT_CAT_STYLE }
  if (cat.equippedAccessory) {
    const found = ACCESSORY_CATALOG.find((a) => a.id === cat.equippedAccessory)
    if (found) {
      style[found.slot] = found.id
    }
  }
  return style
}

export function createInitialGameState(
  name: string,
  coat: CoatStyle,
  now: number = Date.now(),
): GameState {
  const cleanName = name.trim().slice(0, 16) || 'Mochi'
  return {
    schemaVersion: 1,
    createdAt: now,
    lastSavedAt: now,
    lastDecayAt: now,
    statCarry: { ...EMPTY_STAT_CARRY },
    cat: {
      name: cleanName,
      coat,
      level: 1,
      xp: 0,
      stage: 'kitten',
      equippedAccessory: null,
      style: { ...DEFAULT_CAT_STYLE },
    },
    stats: {
      hunger: 80,
      cleanliness: 88,
      happiness: 80,
    },
    room: {
      messes: [],
      unlockedDecor: [],
      equippedDecor: [],
      rugStyle: 'cream',
    },
    inventory: {
      coins: 25,
      treats: {
        milk: 1,
      },
      unlockedAccessories: getUnlockedAccessoriesForLevel(1),
    },
    settings: {
      soundEnabled: true,
      unlockAllMiniGames: false,
    },
    tutorialStep: 0,
    feedsSinceMess: 0,
  }
}

export interface TransitionResult {
  state: GameState
  levelUp: LevelUpEvent | null
}

export function applyXpGain(
  state: GameState,
  xpGain: number,
  now: number = Date.now(),
): TransitionResult {
  if (xpGain <= 0) {
    return { state, levelUp: null }
  }

  const previousLevel = state.cat.level
  const previousStage = state.cat.stage

  let level = previousLevel
  let xp = state.cat.xp + Math.round(xpGain)
  let bonusCoins = 0

  while (xp >= xpRequiredForLevel(level)) {
    xp -= xpRequiredForLevel(level)
    level += 1
    if (level >= 14) {
      bonusCoins += 25
    }
  }

  const newStage = stageForLevel(level)

  const unlockedAccessories = Array.from(
    new Set([
      ...state.inventory.unlockedAccessories,
      ...getUnlockedAccessoriesForLevel(level),
    ]),
  )
  const unlockedDecor = Array.from(
    new Set([...state.room.unlockedDecor, ...getUnlockedDecorForLevel(level)]),
  )

  const nextState: GameState = {
    ...state,
    lastSavedAt: now,
    cat: {
      ...state.cat,
      level,
      xp,
      stage: newStage,
    },
    room: {
      ...state.room,
      unlockedDecor,
    },
    inventory: {
      ...state.inventory,
      coins: state.inventory.coins + bonusCoins,
      unlockedAccessories,
    },
  }

  if (level === previousLevel) {
    return { state: nextState, levelUp: null }
  }

  const newlyUnlockedCategories = STYLE_CATEGORIES.filter(
    (c) => c.unlockLevel > previousLevel && c.unlockLevel <= level,
  ).map((c) => c.id)

  const newlyUnlockedAccessories = ACCESSORY_CATALOG.filter(
    (a) => a.unlockLevel > previousLevel && a.unlockLevel <= level,
  ).map((a) => a.id)

  const newlyUnlockedDecor = DECOR_CATALOG.filter(
    (d) => d.unlockLevel > previousLevel && d.unlockLevel <= level,
  ).map((d) => d.id)

  const newlyUnlockedFoods = FOOD_CATALOG.filter(
    (f) => f.unlockLevel > previousLevel && f.unlockLevel <= level,
  ).map((f) => f.id)

  const newlyUnlockedMiniGames = MINIGAME_CATALOG.filter(
    (g) => g.unlockLevel > previousLevel && g.unlockLevel <= level,
  ).map((g) => g.id)

  return {
    state: nextState,
    levelUp: {
      previousLevel,
      newLevel: level,
      previousStage,
      newStage,
      evolved: newStage !== previousStage,
      unlockedCategories: newlyUnlockedCategories,
      unlockedAccessories: newlyUnlockedAccessories,
      unlockedDecor: newlyUnlockedDecor,
      unlockedFoods: newlyUnlockedFoods,
      unlockedMiniGames: newlyUnlockedMiniGames,
      bonusCoins,
    },
  }
}

export type GameAction =
  | { type: 'FEED'; foodId: FoodItem['id']; now?: number }
  | { type: 'CLEAN_MESS'; messId: string; now?: number }
  | { type: 'BRUSH_CAT'; now?: number }
  | { type: 'PET_CAT'; awardRewards: boolean; now?: number }
  | { type: 'COMPLETE_MINIGAME'; gameId: MiniGameId; score: number; now?: number }
  | { type: 'EQUIP_ACCESSORY'; accessoryId: string | null; slot?: AccessorySlot; now?: number }
  | { type: 'SET_EYE_COLOR'; eyeColor: string; now?: number }
  | { type: 'SET_CHEEK_STYLE'; cheekStyle: string; now?: number }
  | { type: 'SET_RUG_STYLE'; rugStyle: string; now?: number }
  | { type: 'TOGGLE_DECOR'; decorId: string; now?: number }
  | { type: 'TICK_TIME'; now?: number }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<GameState['settings']>; now?: number }
  | { type: 'SET_TUTORIAL_STEP'; step: number; now?: number }
  | { type: 'SPAWN_MESS'; now?: number }
  | { type: 'GRANT_XP'; amount: number; now?: number }
  | { type: 'REPLACE_STATE'; state: GameState }

export function reduceGameState(
  state: GameState,
  action: GameAction,
): TransitionResult {
  const now = 'now' in action && action.now !== undefined ? action.now : Date.now()

  switch (action.type) {
    case 'FEED': {
      // Kitty is already full — do not consume food/coins or grant free XP
      if (state.stats.hunger >= 100) return { state, levelUp: null }

      const food = FOOD_CATALOG.find((f) => f.id === action.foodId)
      if (!food) return { state, levelUp: null }
      if (food.unlockLevel > state.cat.level) return { state, levelUp: null }

      let coins = state.inventory.coins
      const treats = { ...state.inventory.treats }

      if (!food.unlimited) {
        const owned = treats[food.id] ?? 0
        if (owned > 0) {
          treats[food.id] = owned - 1
        } else if (coins >= food.cost) {
          coins -= food.cost
        } else {
          return { state, levelUp: null }
        }
      }

      const feedsSinceMess = (state.feedsSinceMess ?? 0) + 1
      let messes = state.room.messes
      let cleanliness = state.stats.cleanliness
      let nextFeedsSinceMess = feedsSinceMess

      if (feedsSinceMess >= 3) {
        nextFeedsSinceMess = 0
        if (messes.length < MAX_MESSES) {
          messes = [...messes, createRoomMess(messes, now)]
          cleanliness = clampStat(cleanliness - CLEANLINESS_MESS_PENALTY)
        }
      }

      const updated: GameState = {
        ...state,
        lastSavedAt: now,
        stats: {
          hunger: clampStat(state.stats.hunger + food.hungerGain),
          cleanliness,
          happiness: clampStat(state.stats.happiness + food.happinessGain),
        },
        room: {
          ...state.room,
          messes,
        },
        inventory: {
          ...state.inventory,
          coins,
          treats,
        },
        tutorialStep: state.tutorialStep === 0 ? 1 : state.tutorialStep,
        feedsSinceMess: nextFeedsSinceMess,
      }

      return applyXpGain(updated, food.xpGain, now)
    }

    case 'CLEAN_MESS': {
      const exists = state.room.messes.some((m) => m.id === action.messId)
      if (!exists) return { state, levelUp: null }

      const updated: GameState = {
        ...state,
        lastSavedAt: now,
        stats: {
          ...state.stats,
          cleanliness: clampStat(state.stats.cleanliness + 15),
        },
        room: {
          ...state.room,
          messes: state.room.messes.filter((m) => m.id !== action.messId),
        },
        inventory: {
          ...state.inventory,
          coins: state.inventory.coins + 5,
        },
      }
      return applyXpGain(updated, 10, now)
    }

    case 'BRUSH_CAT': {
      // Already sparkling clean — no free XP farming at 100%
      if (state.stats.cleanliness >= 100) {
        return { state, levelUp: null }
      }
      const updated: GameState = {
        ...state,
        lastSavedAt: now,
        stats: {
          ...state.stats,
          cleanliness: clampStat(state.stats.cleanliness + 25),
          happiness: clampStat(state.stats.happiness + 5),
        },
      }
      return applyXpGain(updated, 8, now)
    }

    case 'PET_CAT': {
      const nextTutorialStep = state.tutorialStep === 1 ? 2 : state.tutorialStep
      // Already 100% happy — still advance tutorial if needed, but award 0 XP
      if (!action.awardRewards || state.stats.happiness >= 100) {
        if (nextTutorialStep === state.tutorialStep) {
          return { state, levelUp: null }
        }
        return {
          state: { ...state, tutorialStep: nextTutorialStep, lastSavedAt: now },
          levelUp: null,
        }
      }
      const updated: GameState = {
        ...state,
        lastSavedAt: now,
        stats: {
          ...state.stats,
          happiness: clampStat(state.stats.happiness + 10),
        },
        tutorialStep: nextTutorialStep,
      }
      return applyXpGain(updated, 3, now)
    }

    case 'COMPLETE_MINIGAME': {
      const safeScore = Math.max(0, Math.floor(action.score))
      // Always cozy & rewarding even at score 0: at least +15 Happiness, +15 XP, +10 Coins
      const happinessGain = Math.min(40, 15 + safeScore * 2)
      const xpGain = Math.min(35, 15 + safeScore * 2)
      const coinsGain = 10 + safeScore * 2

      const updated: GameState = {
        ...state,
        lastSavedAt: now,
        stats: {
          ...state.stats,
          happiness: clampStat(state.stats.happiness + happinessGain),
        },
        inventory: {
          ...state.inventory,
          coins: state.inventory.coins + coinsGain,
        },
        tutorialStep: state.tutorialStep === 2 ? 3 : state.tutorialStep,
      }
      return applyXpGain(updated, xpGain, now)
    }

    case 'EQUIP_ACCESSORY': {
      const currentStyle = resolveCatStyle(state.cat)

      if (action.accessoryId === null) {
        const nextStyle: CatStyleConfig = action.slot
          ? { ...currentStyle, [action.slot]: null }
          : { ...currentStyle, neck: null, eyes: null, head: null }
        const primary = nextStyle.head ?? nextStyle.eyes ?? nextStyle.neck
        return {
          state: {
            ...state,
            lastSavedAt: now,
            cat: {
              ...state.cat,
              equippedAccessory: primary,
              style: nextStyle,
            },
          },
          levelUp: null,
        }
      }

      if (!state.inventory.unlockedAccessories.includes(action.accessoryId)) {
        return { state, levelUp: null }
      }
      const item = ACCESSORY_CATALOG.find((a) => a.id === action.accessoryId)
      if (!item) return { state, levelUp: null }

      const nextStyle: CatStyleConfig = {
        ...currentStyle,
        [item.slot]: currentStyle[item.slot] === item.id ? null : item.id,
      }
      const primary = nextStyle.head ?? nextStyle.eyes ?? nextStyle.neck
      return {
        state: {
          ...state,
          lastSavedAt: now,
          cat: {
            ...state.cat,
            equippedAccessory: primary,
            style: nextStyle,
          },
        },
        levelUp: null,
      }
    }

    case 'SET_EYE_COLOR': {
      const currentStyle = resolveCatStyle(state.cat)
      return {
        state: {
          ...state,
          lastSavedAt: now,
          cat: {
            ...state.cat,
            style: {
              ...currentStyle,
              eyeColor: action.eyeColor,
            },
          },
        },
        levelUp: null,
      }
    }

    case 'SET_CHEEK_STYLE': {
      const currentStyle = resolveCatStyle(state.cat)
      return {
        state: {
          ...state,
          lastSavedAt: now,
          cat: {
            ...state.cat,
            style: {
              ...currentStyle,
              cheekStyle: action.cheekStyle,
            },
          },
        },
        levelUp: null,
      }
    }

    case 'SET_RUG_STYLE': {
      return {
        state: {
          ...state,
          lastSavedAt: now,
          room: {
            ...state.room,
            rugStyle: action.rugStyle,
          },
        },
        levelUp: null,
      }
    }

    case 'TOGGLE_DECOR': {
      if (!state.room.unlockedDecor.includes(action.decorId)) {
        return { state, levelUp: null }
      }
      const equipped = state.room.equippedDecor.includes(action.decorId)
        ? state.room.equippedDecor.filter((id) => id !== action.decorId)
        : [...state.room.equippedDecor, action.decorId]

      return {
        state: {
          ...state,
          lastSavedAt: now,
          room: {
            ...state.room,
            equippedDecor: equipped,
          },
        },
        levelUp: null,
      }
    }

    case 'TICK_TIME': {
      return {
        state: applyElapsedTime(state, now),
        levelUp: null,
      }
    }

    case 'UPDATE_SETTINGS': {
      return {
        state: {
          ...state,
          lastSavedAt: now,
          settings: {
            ...state.settings,
            ...action.settings,
          },
        },
        levelUp: null,
      }
    }

    case 'SET_TUTORIAL_STEP': {
      return {
        state: {
          ...state,
          lastSavedAt: now,
          tutorialStep: action.step,
        },
        levelUp: null,
      }
    }

    case 'SPAWN_MESS': {
      if (state.room.messes.length >= MAX_MESSES) {
        return { state, levelUp: null }
      }
      return {
        state: {
          ...state,
          lastSavedAt: now,
          stats: {
            ...state.stats,
            cleanliness: clampStat(state.stats.cleanliness - CLEANLINESS_MESS_PENALTY),
          },
          room: {
            ...state.room,
            messes: [...state.room.messes, createRoomMess(state.room.messes, now)],
          },
        },
        levelUp: null,
      }
    }

    case 'GRANT_XP': {
      return applyXpGain(state, action.amount, now)
    }

    case 'REPLACE_STATE': {
      return {
        state: action.state,
        levelUp: null,
      }
    }
  }
}

export function getMiniGameRewards(score: number): {
  happinessGain: number
  xpGain: number
  coinsGain: number
} {
  const safeScore = Math.max(0, Math.floor(score))
  return {
    happinessGain: Math.min(40, 15 + safeScore * 2),
    xpGain: Math.min(35, 15 + safeScore * 2),
    coinsGain: 10 + safeScore * 2,
  }
}
