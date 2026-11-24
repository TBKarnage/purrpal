import { describe, expect, it } from 'vitest'
import { KITTY_NAME_POOL, pickRandomCatNames } from '../../types/game'
import {
  applyXpGain,
  createInitialGameState,
  isHideSeekDifficultyUnlocked,
  nextHintDelayMs,
  reduceGameState,
  stageForLevel,
  xpRequiredForLevel,
} from '../gameReducer'
import {
  decodeSaveCode,
  encodeSaveCode,
  validateAndNormalizeGameState,
} from '../storage'
import {
  MAX_MESSES,
  STAT_FLOOR,
  applyElapsedTime,
  getCatMood,
  getHungerDecayPerHour,
  getPriorityNeed,
} from '../timeDecay'

describe('PurrPal Save State Engine & Cozy Offline Catch-Up', () => {
  it('calculates gentle XP curve for a 7-year-old', () => {
    expect(xpRequiredForLevel(1)).toBe(50)
    expect(xpRequiredForLevel(2)).toBe(80)
    expect(xpRequiredForLevel(3)).toBe(110)
    expect(xpRequiredForLevel(4)).toBe(140)
  })

  it('maps growth stages cleanly at exact level thresholds (1-3, 4-7, 8-12, 13+)', () => {
    expect(stageForLevel(1)).toBe('kitten')
    expect(stageForLevel(3)).toBe('kitten')
    expect(stageForLevel(4)).toBe('junior')
    expect(stageForLevel(7)).toBe('junior')
    expect(stageForLevel(8)).toBe('teen')
    expect(stageForLevel(12)).toBe('teen')
    expect(stageForLevel(13)).toBe('adult')
    expect(stageForLevel(20)).toBe('adult')
  })

  it('evolves across all 4 growth stages and awards expected unlocks', () => {
    const start = createInitialGameState('Mochi', 'tabby', 1_000_000)
    expect(start.cat.stage).toBe('kitten')

    // Level 1 -> 4 requires 50 + 80 + 110 = 240 XP
    const toJunior = applyXpGain(start, 240, 1_001_000)
    expect(toJunior.state.cat.level).toBe(4)
    expect(toJunior.state.cat.stage).toBe('junior')
    expect(toJunior.levelUp?.evolved).toBe(true)
    expect(toJunior.state.inventory.unlockedAccessories).toContain('collar')
    expect(toJunior.state.inventory.unlockedAccessories).toContain('bow')
    expect(toJunior.levelUp?.unlockedMiniGames).toContain('bubbles')
    expect(toJunior.levelUp?.unlockedFoods).toContain('salmon')

    // Level 4 -> 8 requires 140 + 170 + 200 + 230 = 740 XP
    const toTeen = applyXpGain(toJunior.state, 740, 1_002_000)
    expect(toTeen.state.cat.level).toBe(8)
    expect(toTeen.state.cat.stage).toBe('teen')
    expect(toTeen.levelUp?.evolved).toBe(true)
    expect(toTeen.state.room.unlockedDecor).toContain('cat_tree')
    expect(toTeen.state.room.unlockedDecor).toContain('window_cushion')
    expect(toTeen.levelUp?.unlockedMiniGames).toContain('treats')

    // Level 8 -> 13 requires 260 + 290 + 320 + 350 + 380 = 1600 XP
    const toAdult = applyXpGain(toTeen.state, 1600, 1_003_000)
    expect(toAdult.state.cat.level).toBe(13)
    expect(toAdult.state.cat.stage).toBe('adult')
    expect(toAdult.levelUp?.evolved).toBe(true)
    expect(toAdult.state.inventory.unlockedAccessories).toContain('crown')
    expect(toAdult.state.inventory.unlockedAccessories).toContain('sunglasses')
    expect(toAdult.state.inventory.unlockedAccessories).toContain('bandana')
    expect(toAdult.state.room.unlockedDecor).toContain('starry_rug')

    // Level 13 -> 14 awards endless bonus coins + Star Hat
    const toLv14 = applyXpGain(toAdult.state, xpRequiredForLevel(13), 1_004_000)
    expect(toLv14.state.cat.level).toBe(14)
    expect(toLv14.levelUp?.bonusCoins).toBe(25)
    expect(toLv14.state.inventory.unlockedAccessories).toContain('wizard_hat')
  })

  it('clamps all stats to 25% safe floor, marks kitty sad, and caps messes at 3 after 72 hours elapsed', () => {
    const startTime = 1_700_000_000_000
    const state = createInitialGameState('Luna', 'tuxedo', startTime)
    const after72h = applyElapsedTime(state, startTime + 72 * 3_600_000)

    expect(STAT_FLOOR).toBe(25)
    expect(after72h.stats.hunger).toBe(25)
    expect(after72h.stats.cleanliness).toBe(25)
    expect(after72h.stats.happiness).toBe(25)
    expect(after72h.room.messes.length).toBe(MAX_MESSES)
    expect(getCatMood(after72h.stats)).toBe('sad')
    expect(getPriorityNeed(after72h.stats)).not.toBeNull()
    for (const mess of after72h.room.messes) {
      expect(mess.y).toBeGreaterThanOrEqual(58)
      expect(mess.y).toBeLessThanOrEqual(71)
    }
  })

  it('syncs real-time decay smoothly across short ticks and user actions without losing elapsed time', () => {
    const t0 = 1_700_000_000_000
    let stepped = createInitialGameState('Milo', 'tabby', t0)
    // Simulate 15 minutes passing in 1-minute increments while user occasionally changes style
    for (let m = 1; m <= 15; m += 1) {
      const now = t0 + m * 60_000
      if (m === 5) {
        stepped = reduceGameState(stepped, { type: 'SET_EYE_COLOR', eyeColor: 'sky', now }).state
      }
      stepped = applyElapsedTime(stepped, now)
    }

    // Compare against a single 15-minute background jump
    const jumped = applyElapsedTime(createInitialGameState('Milo', 'tabby', t0), t0 + 15 * 60_000)

    expect(stepped.stats.hunger).toBe(jumped.stats.hunger)
    expect(stepped.stats.cleanliness).toBe(jumped.stats.cleanliness)
    expect(stepped.stats.happiness).toBe(jumped.stats.happiness)
    // 15 minutes at 30/hr kitten hunger = -7.5 points (80 -> 73)
    expect(jumped.stats.hunger).toBe(73)
    // 15 minutes at 12/hr clean = -3 points (88 -> 85)
    expect(jumped.stats.cleanliness).toBe(85)
  })

  it('reflects thriving, normal, needsCare, and sad moods accurately and normalizes legacy mess positions', () => {
    expect(getCatMood({ hunger: 80, cleanliness: 80, happiness: 80 })).toBe('thriving')
    expect(getCatMood({ hunger: 60, cleanliness: 60, happiness: 60 })).toBe('normal')
    expect(getCatMood({ hunger: 45, cleanliness: 70, happiness: 60 })).toBe('needsCare')
    expect(getCatMood({ hunger: 70, cleanliness: 70, happiness: 34 })).toBe('sad')

    const legacy = createInitialGameState('Mochi', 'gray', 10_000)
    const withLowMess = {
      ...legacy,
      room: {
        ...legacy.room,
        messes: [{ id: 'old_1', x: 34, y: 84, type: 'pawprints' as const }],
      },
    }
    const normalized = validateAndNormalizeGameState(withLowMess)
    expect(normalized?.room.messes[0].y).toBeLessThanOrEqual(71)
  })

  it('spawns a mess after 3 hungry feedings and never exceeds 3 messes', () => {
    let state = createInitialGameState('Pumpkin', 'calico', 10_000)
    for (let i = 0; i < 12; i += 1) {
      // Simulate kitty getting hungry between meals
      state = { ...state, stats: { ...state.stats, hunger: 70 } }
      state = reduceGameState(state, { type: 'FEED', foodId: 'kibble', now: 10_000 + i * 1000 }).state
    }
    expect(state.room.messes.length).toBe(MAX_MESSES)

    // Cleaning a mess gives +15 cleanliness, +10 XP, +5 coins
    const messId = state.room.messes[0].id
    const coinsBefore = state.inventory.coins
    const afterClean = reduceGameState(state, { type: 'CLEAN_MESS', messId, now: 30_000 }).state
    expect(afterClean.room.messes.length).toBe(MAX_MESSES - 1)
    expect(afterClean.inventory.coins).toBe(coinsBefore + 5)
  })

  it('stops regular food at 100% hunger while treats still work with coin cost and tiny XP', () => {
    const base = createInitialGameState('Mochi', 'tabby', 10_000)
    const fullState = {
      ...base,
      stats: { hunger: 100, cleanliness: 100, happiness: 100 },
    }

    // Regular food (kibble) stops at 100% hunger and awards 0 XP
    const afterKibble = reduceGameState(fullState, { type: 'FEED', foodId: 'kibble', now: 11_000 })
    expect(afterKibble.state).toBe(fullState)
    expect(afterKibble.state.cat.xp).toBe(0)

    // Paid treats still work at 100% hunger, consume treat/coins, and award 2 tiny XP
    const afterMilk = reduceGameState(fullState, { type: 'FEED', foodId: 'milk', now: 12_000 })
    expect(afterMilk.state.inventory.treats.milk).toBe(0)
    expect(afterMilk.state.cat.xp).toBe(2)

    const afterCatnip = reduceGameState(afterMilk.state, { type: 'FEED', foodId: 'catnip', now: 12_500 })
    expect(afterCatnip.state.inventory.coins).toBe(base.inventory.coins - 12)
    expect(afterCatnip.state.cat.xp).toBe(4)

    // Brushing at 100% cleanliness awards 0 XP
    const afterBrush = reduceGameState(fullState, { type: 'BRUSH_CAT', now: 13_000 })
    expect(afterBrush.state).toBe(fullState)
    expect(afterBrush.state.cat.xp).toBe(0)

    // Petting at 100% happiness awards 0 XP (even when awardRewards is true)
    const afterPet = reduceGameState(
      { ...fullState, tutorialStep: 3 },
      { type: 'PET_CAT', awardRewards: true, now: 14_000 },
    )
    expect(afterPet.state.cat.xp).toBe(0)
  })

  it('drains hunger faster as the kitty grows older', () => {
    expect(getHungerDecayPerHour('kitten')).toBeLessThan(getHungerDecayPerHour('junior'))
    expect(getHungerDecayPerHour('junior')).toBeLessThan(getHungerDecayPerHour('teen'))
    expect(getHungerDecayPerHour('teen')).toBeLessThan(getHungerDecayPerHour('adult'))

    const kitten = createInitialGameState('Mochi', 'tabby', 0)
    const adult = { ...kitten, cat: { ...kitten.cat, stage: 'adult' as const, level: 13 } }
    const oneHour = 3_600_000

    const kittenAfter = applyElapsedTime(kitten, oneHour)
    const adultAfter = applyElapsedTime(adult, oneHour)
    expect(adultAfter.stats.hunger).toBeLessThan(kittenAfter.stats.hunger)
  })

  it('always rewards mini-games positively even with score 0', () => {
    const start = createInitialGameState('Oliver', 'gray', 50_000)
    const lowHappy = { ...start, stats: { ...start.stats, happiness: 20 } }
    const result = reduceGameState(lowHappy, {
      type: 'COMPLETE_MINIGAME',
      gameId: 'laser',
      score: 0,
      now: 60_000,
    })
    expect(result.state.stats.happiness).toBeGreaterThanOrEqual(35)
    expect(result.state.cat.xp).toBeGreaterThanOrEqual(15)
    expect(result.state.inventory.coins).toBe(start.inventory.coins + 10)
  })

  it('round-trips Base64 save code and rejects corrupted payloads safely', () => {
    const original = createInitialGameState('Bella', 'calico', 99_000)
    const evolved = applyXpGain(original, 260, 100_000).state
    const code = encodeSaveCode(evolved)
    const restored = decodeSaveCode(code)

    expect(restored).not.toBeNull()
    expect(restored?.cat.name).toBe('Bella')
    expect(restored?.cat.coat).toBe('calico')
    expect(restored?.cat.level).toBe(evolved.cat.level)
    expect(restored?.cat.stage).toBe('junior')

    // Corruption guards
    expect(decodeSaveCode('!!!not-base64!!!')).toBeNull()
    expect(validateAndNormalizeGameState({ schemaVersion: 2 })).toBeNull()
    expect(validateAndNormalizeGameState(null)).toBeNull()
  })

  it('picks unique random kitty names and avoids repeating previous names on shuffle', () => {
    expect(KITTY_NAME_POOL.length).toBeGreaterThanOrEqual(40)
    const first = pickRandomCatNames(6)
    expect(first.length).toBe(6)
    expect(new Set(first).size).toBe(6)

    const second = pickRandomCatNames(6, first)
    expect(second.length).toBe(6)
    expect(second.every((n) => !first.includes(n))).toBe(true)
  })

  it('includes free Lv 1 starter accessories and supports layered multi-slot styles', () => {
    let state = createInitialGameState('Biscuit', 'gray', 20_000)
    expect(state.inventory.unlockedAccessories).toContain('ribbon_coral')
    expect(state.inventory.unlockedAccessories).toContain('ribbon_mint')

    // Free starter styles work immediately at Lv 1
    state = reduceGameState(state, { type: 'SET_EYE_COLOR', eyeColor: 'sky', now: 21_000 }).state
    state = reduceGameState(state, { type: 'SET_CHEEK_STYLE', cheekStyle: 'hearts', now: 21_500 }).state
    state = reduceGameState(state, { type: 'SET_RUG_STYLE', rugStyle: 'mint', now: 22_000 }).state
    state = reduceGameState(state, { type: 'EQUIP_ACCESSORY', accessoryId: 'ribbon_coral', now: 22_500 }).state

    expect(state.cat.style?.eyeColor).toBe('sky')
    expect(state.cat.style?.cheekStyle).toBe('hearts')
    expect(state.cat.style?.neck).toBe('ribbon_coral')
    expect(state.room.rugStyle).toBe('mint')

    // Reaching Lv 13 unlocks all categories and allows layering neck + eyes + head simultaneously
    const adult = applyXpGain(state, 2600, 23_000).state
    let styled = reduceGameState(adult, { type: 'EQUIP_ACCESSORY', accessoryId: 'scarf', now: 24_000 }).state
    styled = reduceGameState(styled, { type: 'EQUIP_ACCESSORY', accessoryId: 'heart_glasses', now: 24_500 }).state
    styled = reduceGameState(styled, { type: 'EQUIP_ACCESSORY', accessoryId: 'crown', now: 25_000 }).state

    expect(styled.cat.style?.neck).toBe('scarf')
    expect(styled.cat.style?.eyes).toBe('heart_glasses')
    expect(styled.cat.style?.head).toBe('crown')

    // Round-trip save code preserves layered style & rugStyle
    const restored = decodeSaveCode(encodeSaveCode(styled))
    expect(restored?.cat.style?.eyeColor).toBe('sky')
    expect(restored?.cat.style?.neck).toBe('scarf')
    expect(restored?.cat.style?.eyes).toBe('heart_glasses')
    expect(restored?.cat.style?.head).toBe('crown')
    expect(restored?.room.rugStyle).toBe('mint')
  })

  it('tracks Hide & Seek difficulty progression, persistence, and 50-60s hint timing', () => {
    const start = createInitialGameState('Mochi', 'gray', 30_000)
    expect(start.hideSeekBeaten ?? []).toEqual([])
    expect(isHideSeekDifficultyUnlocked(start.hideSeekBeaten, 'easy')).toBe(true)
    expect(isHideSeekDifficultyUnlocked(start.hideSeekBeaten, 'medium')).toBe(true)
    expect(isHideSeekDifficultyUnlocked(start.hideSeekBeaten, 'hard')).toBe(true)

    // Beating Easy records beaten difficulty
    const afterEasy = reduceGameState(start, {
      type: 'COMPLETE_MINIGAME',
      gameId: 'hide_seek',
      score: 10,
      hideSeekDifficulty: 'easy',
      now: 35_000,
    }).state
    expect(afterEasy.hideSeekBeaten).toEqual(['easy'])

    // Re-beating Easy does not duplicate entries
    const afterEasyAgain = reduceGameState(afterEasy, {
      type: 'COMPLETE_MINIGAME',
      gameId: 'hide_seek',
      score: 9,
      hideSeekDifficulty: 'easy',
      now: 36_000,
    }).state
    expect(afterEasyAgain.hideSeekBeaten).toEqual(['easy'])

    // Beating Medium records medium
    const afterMedium = reduceGameState(afterEasyAgain, {
      type: 'COMPLETE_MINIGAME',
      gameId: 'hide_seek',
      score: 14,
      hideSeekDifficulty: 'medium',
      now: 40_000,
    }).state
    expect(afterMedium.hideSeekBeaten).toEqual(['easy', 'medium'])

    // Beating Hard records all three
    const afterHard = reduceGameState(afterMedium, {
      type: 'COMPLETE_MINIGAME',
      gameId: 'hide_seek',
      score: 18,
      hideSeekDifficulty: 'hard',
      now: 45_000,
    }).state
    expect(afterHard.hideSeekBeaten).toEqual(['easy', 'medium', 'hard'])

    // Round-trip save code & validation preserve hideSeekBeaten
    const restored = decodeSaveCode(encodeSaveCode(afterMedium))
    expect(restored?.hideSeekBeaten).toEqual(['easy', 'medium'])

    // Hint shake delay always falls strictly between 50s and 60s
    for (let i = 0; i < 50; i += 1) {
      const delay = nextHintDelayMs()
      expect(delay).toBeGreaterThanOrEqual(50_000)
      expect(delay).toBeLessThanOrEqual(60_000)
    }
  })

  it('tracks per-game difficulty unlocks and persists bug/request feedback reports', () => {
    let state = createInitialGameState('Luna', 'tuxedo', 50_000)
    state = reduceGameState(state, {
      type: 'COMPLETE_MINIGAME',
      gameId: 'sky_hop',
      score: 12,
      difficulty: 'easy',
      now: 51_000,
    }).state
    state = reduceGameState(state, {
      type: 'COMPLETE_MINIGAME',
      gameId: 'laser',
      score: 8,
      difficulty: 'easy',
      now: 52_000,
    }).state

    expect(state.miniGameBeaten?.sky_hop).toEqual(['easy'])
    expect(state.miniGameBeaten?.laser).toEqual(['easy'])
    expect(isHideSeekDifficultyUnlocked(state.miniGameBeaten?.sky_hop, 'medium')).toBe(true)
    expect(isHideSeekDifficultyUnlocked(state.miniGameBeaten?.sky_hop, 'hard')).toBe(true)

    state = reduceGameState(state, {
      type: 'ADD_FEEDBACK_REPORT',
      report: {
        id: 'fb_test_1',
        kind: 'bug',
        createdAt: 53_000,
        catName: 'Luna',
        catLevel: state.cat.level,
        activity: 'feeding',
        symptom: 'wrong_color',
        message: 'Face looked dark after eating',
      },
      now: 53_000,
    }).state

    const restored = decodeSaveCode(encodeSaveCode(state))
    expect(restored?.miniGameBeaten?.sky_hop).toEqual(['easy'])
    expect(restored?.feedbackReports?.length).toBe(1)
    expect(restored?.feedbackReports?.[0].symptom).toBe('wrong_color')

    const cleared = reduceGameState(state, { type: 'CLEAR_FEEDBACK_REPORTS', now: 54_000 }).state
    expect(cleared.feedbackReports).toEqual([])
  })
})


