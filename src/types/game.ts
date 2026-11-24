export type CoatStyle = 'tabby' | 'tuxedo' | 'calico' | 'gray'

export type GrowthStage = 'kitten' | 'junior' | 'teen' | 'adult'

export type MessType = 'pawprints' | 'hairball' | 'toy'

export type CatMood = 'thriving' | 'normal' | 'needsCare' | 'sad'

export type StatKey = 'hunger' | 'cleanliness' | 'happiness'

export type MiniGameId = 'laser' | 'hide_seek' | 'sky_hop' | 'bubbles' | 'treats'

export type MiniGameDifficulty = 'easy' | 'medium' | 'hard'
export type HideSeekDifficulty = MiniGameDifficulty

export type HideSeekRoomId = 'living_room' | 'kitchen' | 'bedroom' | 'garden'

export interface FeedbackReport {
  id: string
  kind: 'bug' | 'request'
  createdAt: number
  catName: string
  catLevel: number
  activity?: string
  symptom?: string
  message: string
  usedVoice?: boolean
  sentToWebhook?: boolean
}

export type AccessorySlot = 'neck' | 'head' | 'eyes'

export type StyleCategoryId =
  | 'free_basics'
  | 'collars_bows'
  | 'room_decor'
  | 'shades_bandanas'
  | 'royal_hats'

export interface CatStyleConfig {
  eyeColor: string
  cheekStyle: string
  neck: string | null
  eyes: string | null
  head: string | null
}

export interface RoomMess {
  id: string
  x: number // percentage 16..84
  y: number // percentage 58..71 (always clear above bottom dock)
  type: MessType
}

export interface StatDecayCarry {
  hunger: number
  cleanliness: number
  happiness: number
  mess: number
}

export interface GameState {
  schemaVersion: 1
  createdAt: number
  lastSavedAt: number
  lastDecayAt?: number
  statCarry?: StatDecayCarry
  cat: {
    name: string
    coat: CoatStyle
    level: number
    xp: number
    stage: GrowthStage
    equippedAccessory: string | null
    style?: CatStyleConfig
  }
  stats: {
    hunger: number // 25..100
    cleanliness: number // 25..100
    happiness: number // 25..100
  }
  room: {
    messes: RoomMess[]
    unlockedDecor: string[]
    equippedDecor: string[]
    rugStyle?: string
  }
  inventory: {
    coins: number
    treats: Record<string, number>
    unlockedAccessories: string[]
  }
  settings: {
    soundEnabled: boolean
    unlockAllMiniGames: boolean
    parentWebhookUrl?: string
    parentEmail?: string
    parentPin?: string
  }
  tutorialStep?: number // 0: Feed, 1: Pet, 2: Play, 3: Complete
  feedsSinceMess?: number
  hideSeekBeaten?: HideSeekDifficulty[]
  miniGameBeaten?: Partial<Record<MiniGameId, MiniGameDifficulty[]>>
  feedbackReports?: FeedbackReport[]
}

export interface LevelUpEvent {
  previousLevel: number
  newLevel: number
  previousStage: GrowthStage
  newStage: GrowthStage
  evolved: boolean
  unlockedCategories: StyleCategoryId[]
  unlockedAccessories: string[]
  unlockedDecor: string[]
  unlockedFoods: string[]
  unlockedMiniGames: MiniGameId[]
  bonusCoins: number
}

export interface FoodItem {
  id: 'kibble' | 'milk' | 'treat' | 'salmon' | 'catnip'
  label: string
  cost: number
  hungerGain: number
  happinessGain: number
  xpGain: number
  unlockLevel: number
  unlimited?: boolean
}

export interface AccessoryItem {
  id: string
  label: string
  unlockLevel: number
  slot: AccessorySlot
  category: StyleCategoryId
}

export interface DecorItem {
  id: string
  label: string
  unlockLevel: number
  category: StyleCategoryId
}

export interface StyleCategoryInfo {
  id: StyleCategoryId
  label: string
  subtitle: string
  unlockLevel: number
  targetTab: 'customize' | 'room'
  badgeColor: string
}

export interface MiniGameInfo {
  id: MiniGameId
  label: string
  shortHint: string
  unlockLevel: number
  accent: string
}

export const KITTY_NAME_POOL = [
  'Mochi',
  'Whiskers',
  'Luna',
  'Oliver',
  'Pumpkin',
  'Bella',
  'Biscuit',
  'Cleo',
  'Milo',
  'Peaches',
  'Nori',
  'Clover',
  'Waffle',
  'Ziggy',
  'Pippin',
  'Coco',
  'Sunny',
  'Maple',
  'Poppy',
  'Muffin',
  'Bean',
  'Daisy',
  'Ginger',
  'Pepper',
  'Mitten',
  'Willow',
  'Nugget',
  'Olive',
  'Cookie',
  'Sparkle',
  'Cinnamon',
  'Teddy',
  'Kiwi',
  'Pudding',
  'Pebble',
  'Berry',
  'Mango',
  'Noodle',
  'Pickles',
  'Hazel',
  'Penny',
  'Sprout',
  'Tofu',
  'Rosie',
  'Bandit',
  'Sushi',
  'Honey',
  'Marshmallow',
] as const

export const PRESET_CAT_NAMES = KITTY_NAME_POOL.slice(0, 6)

/**
 * Randomly picks `count` unique kitty names from KITTY_NAME_POOL,
 * avoiding names in `exclude` whenever possible so shuffling feels fresh.
 */
export function pickRandomCatNames(
  count = 6,
  exclude: readonly string[] = [],
  rng: () => number = Math.random,
): string[] {
  const excluded = new Set(exclude)
  const freshPool = KITTY_NAME_POOL.filter((name) => !excluded.has(name))
  const source = freshPool.length >= count ? [...freshPool] : [...KITTY_NAME_POOL]

  for (let i = source.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = source[i]
    source[i] = source[j]
    source[j] = tmp
  }
  return source.slice(0, count)
}

export const COAT_OPTIONS: Array<{
  id: CoatStyle
  label: string
  shortLabel: string
  primary: string
  secondary: string
  accent: string
}> = [
  {
    id: 'tabby',
    label: 'Orange Tabby',
    shortLabel: 'Tabby',
    primary: '#F5A256',
    secondary: '#FFF3E0',
    accent: '#C96824',
  },
  {
    id: 'tuxedo',
    label: 'Tuxedo',
    shortLabel: 'Tuxedo',
    primary: '#3D4150',
    secondary: '#FFFFFF',
    accent: '#232630',
  },
  {
    id: 'calico',
    label: 'Calico',
    shortLabel: 'Calico',
    primary: '#FFFBF3',
    secondary: '#F49A48',
    accent: '#4E4657',
  },
  {
    id: 'gray',
    label: 'Soft Gray',
    shortLabel: 'Gray',
    primary: '#A3B0C2',
    secondary: '#EEF3F9',
    accent: '#6F7E93',
  },
]

export const EYE_COLOR_OPTIONS = [
  { id: 'cocoa', label: 'Classic', fill: '#2D1D16', ring: '#5B3A29' },
  { id: 'sky', label: 'Ocean', fill: '#0369A1', ring: '#38BDF8' },
  { id: 'emerald', label: 'Emerald', fill: '#047857', ring: '#34D399' },
  { id: 'amber', label: 'Golden', fill: '#B45309', ring: '#FBBF24' },
  { id: 'berry', label: 'Berry', fill: '#6D28D9', ring: '#A78BFA' },
] as const

export const CHEEK_STYLE_OPTIONS = [
  { id: 'rosy', label: 'Rosy Blush' },
  { id: 'hearts', label: 'Heart Cheeks' },
  { id: 'stars', label: 'Star Freckles' },
  { id: 'none', label: 'Plain' },
] as const

export const RUG_STYLE_OPTIONS = [
  { id: 'cream', label: 'Cream Rug', outer: '#FFF5E4', inner: '#FFE8C8', stroke: '#E5C195' },
  { id: 'mint', label: 'Mint Rug', outer: '#D1FAE5', inner: '#A7F3D0', stroke: '#34D399' },
  { id: 'peach', label: 'Peach Rug', outer: '#FFE4E6', inner: '#FECDD3', stroke: '#FB7185' },
] as const

export const DEFAULT_CAT_STYLE: CatStyleConfig = {
  eyeColor: 'cocoa',
  cheekStyle: 'rosy',
  neck: null,
  eyes: null,
  head: null,
}

export const STYLE_CATEGORIES: StyleCategoryInfo[] = [
  {
    id: 'free_basics',
    label: 'Free Starter Basics',
    subtitle: 'Eye colors, cheek styles, starter ribbons & rug colors',
    unlockLevel: 1,
    targetTab: 'customize',
    badgeColor: '#A7F3D0',
  },
  {
    id: 'collars_bows',
    label: 'Collars & Bows',
    subtitle: 'Bell collars, cute ear bows, bowtie & cozy scarf',
    unlockLevel: 4,
    targetTab: 'customize',
    badgeColor: '#FDE68A',
  },
  {
    id: 'room_decor',
    label: 'Cozy Room Decor',
    subtitle: 'Cat tree, sunlit window cushion & warm fairy lights',
    unlockLevel: 8,
    targetTab: 'room',
    badgeColor: '#BAE6FD',
  },
  {
    id: 'shades_bandanas',
    label: 'Shades & Bandanas',
    subtitle: 'Cool shades, heart & star glasses, and starry bandanas',
    unlockLevel: 10,
    targetTab: 'customize',
    badgeColor: '#FBCFE8',
  },
  {
    id: 'royal_hats',
    label: 'Royal Hats & Crowns',
    subtitle: 'Gold crown, tiara, beret, daisy crown, party & magic hats + Starry Rug',
    unlockLevel: 13,
    targetTab: 'customize',
    badgeColor: '#DDD6FE',
  },
]

export const STAGE_META: Record<
  GrowthStage,
  { label: string; minLevel: number; badgeColor: string; tagline: string }
> = {
  kitten: {
    label: 'Tiny Kitten',
    minLevel: 1,
    badgeColor: '#FFB7B2',
    tagline: 'Little paws & big bright eyes!',
  },
  junior: {
    label: 'Playful Junior',
    minLevel: 4,
    badgeColor: '#FFD166',
    tagline: 'Bouncy pounces & new treats!',
  },
  teen: {
    label: 'Teen Cat',
    minLevel: 8,
    badgeColor: '#7CC6FE',
    tagline: 'Zoomie dashes & cozy decor!',
  },
  adult: {
    label: 'Full-Grown Adult',
    minLevel: 13,
    badgeColor: '#A78BFA',
    tagline: 'Fluffy, regal & full of purrs!',
  },
}

export const FOOD_CATALOG: FoodItem[] = [
  {
    id: 'kibble',
    label: 'Kibble',
    cost: 0,
    hungerGain: 20,
    happinessGain: 2,
    xpGain: 10,
    unlockLevel: 1,
    unlimited: true,
  },
  {
    id: 'milk',
    label: 'Warm Milk',
    cost: 10,
    hungerGain: 15,
    happinessGain: 5,
    xpGain: 10,
    unlockLevel: 1,
  },
  {
    id: 'treat',
    label: 'Cat Cookie',
    cost: 15,
    hungerGain: 25,
    happinessGain: 8,
    xpGain: 10,
    unlockLevel: 1,
  },
  {
    id: 'salmon',
    label: 'Salmon',
    cost: 20,
    hungerGain: 35,
    happinessGain: 12,
    xpGain: 12,
    unlockLevel: 4,
  },
  {
    id: 'catnip',
    label: 'Catnip',
    cost: 12,
    hungerGain: 5,
    happinessGain: 28,
    xpGain: 14,
    unlockLevel: 1,
  },
]

export const ACCESSORY_CATALOG: AccessoryItem[] = [
  // Free Starter Basics (Lv 1)
  { id: 'ribbon_coral', label: 'Coral Ribbon', unlockLevel: 1, slot: 'neck', category: 'free_basics' },
  { id: 'ribbon_mint', label: 'Mint Ribbon', unlockLevel: 1, slot: 'neck', category: 'free_basics' },
  { id: 'ribbon_sunny', label: 'Sunny Ribbon', unlockLevel: 1, slot: 'neck', category: 'free_basics' },
  { id: 'ribbon_sky', label: 'Sky Ribbon', unlockLevel: 1, slot: 'neck', category: 'free_basics' },

  // Collars & Bows Category (Lv 4)
  { id: 'collar', label: 'Coral Bell', unlockLevel: 4, slot: 'neck', category: 'collars_bows' },
  { id: 'collar_sky', label: 'Sky Bell', unlockLevel: 4, slot: 'neck', category: 'collars_bows' },
  { id: 'collar_gold', label: 'Gold Bell', unlockLevel: 4, slot: 'neck', category: 'collars_bows' },
  { id: 'bowtie', label: 'Red Bowtie', unlockLevel: 4, slot: 'neck', category: 'collars_bows' },
  { id: 'scarf', label: 'Cozy Scarf', unlockLevel: 4, slot: 'neck', category: 'collars_bows' },
  { id: 'bow', label: 'Mint Bow', unlockLevel: 4, slot: 'head', category: 'collars_bows' },
  { id: 'bow_pink', label: 'Berry Bow', unlockLevel: 4, slot: 'head', category: 'collars_bows' },
  { id: 'bow_sunny', label: 'Sunny Bow', unlockLevel: 4, slot: 'head', category: 'collars_bows' },

  // Shades & Bandanas Category (Lv 10)
  { id: 'sunglasses', label: 'Cool Shades', unlockLevel: 10, slot: 'eyes', category: 'shades_bandanas' },
  { id: 'heart_glasses', label: 'Heart Shades', unlockLevel: 10, slot: 'eyes', category: 'shades_bandanas' },
  { id: 'star_glasses', label: 'Star Shades', unlockLevel: 10, slot: 'eyes', category: 'shades_bandanas' },
  { id: 'round_specs', label: 'Smart Specs', unlockLevel: 10, slot: 'eyes', category: 'shades_bandanas' },
  { id: 'bandana', label: 'Sky Bandana', unlockLevel: 10, slot: 'neck', category: 'shades_bandanas' },
  { id: 'bandana_coral', label: 'Coral Bandana', unlockLevel: 10, slot: 'neck', category: 'shades_bandanas' },
  { id: 'bandana_mint', label: 'Mint Bandana', unlockLevel: 10, slot: 'neck', category: 'shades_bandanas' },

  // Royal Hats & Crowns Category (Lv 13+)
  { id: 'crown', label: 'Gold Crown', unlockLevel: 13, slot: 'head', category: 'royal_hats' },
  { id: 'tiara', label: 'Rose Tiara', unlockLevel: 13, slot: 'head', category: 'royal_hats' },
  { id: 'beret', label: 'Cozy Beret', unlockLevel: 13, slot: 'head', category: 'royal_hats' },
  { id: 'flower_crown', label: 'Daisy Crown', unlockLevel: 13, slot: 'head', category: 'royal_hats' },
  { id: 'party_hat', label: 'Party Hat', unlockLevel: 13, slot: 'head', category: 'royal_hats' },
  { id: 'wizard_hat', label: 'Star Hat', unlockLevel: 14, slot: 'head', category: 'royal_hats' },
]

export const DECOR_CATALOG: DecorItem[] = [
  { id: 'cat_tree', label: 'Cat Tree', unlockLevel: 8, category: 'room_decor' },
  { id: 'window_cushion', label: 'Sun Cushion', unlockLevel: 8, category: 'room_decor' },
  { id: 'fairy_lights', label: 'Fairy Lights', unlockLevel: 8, category: 'room_decor' },
  { id: 'starry_rug', label: 'Starry Rug', unlockLevel: 13, category: 'royal_hats' },
]

export const MINIGAME_CATALOG: MiniGameInfo[] = [
  {
    id: 'laser',
    label: 'Laser Chase',
    shortHint: 'Tap the glowing dot!',
    unlockLevel: 1,
    accent: '#FB7185',
  },
  {
    id: 'hide_seek',
    label: 'Hide & Seek',
    shortHint: 'Find kitty hiding in a room!',
    unlockLevel: 1,
    accent: '#10B981',
  },
  {
    id: 'sky_hop',
    label: 'Sky Hop',
    shortHint: 'Bounce up to the clouds!',
    unlockLevel: 1,
    accent: '#8B5CF6',
  },
  {
    id: 'bubbles',
    label: 'Bubble Pop',
    shortHint: 'Pop floating bubbles!',
    unlockLevel: 4,
    accent: '#38BDF8',
  },
  {
    id: 'treats',
    label: 'Catch Treats',
    shortHint: 'Slide to catch fish!',
    unlockLevel: 8,
    accent: '#F59E0B',
  },
]
