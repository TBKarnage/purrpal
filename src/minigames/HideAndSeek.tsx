import { useCallback, useEffect, useRef, useState } from 'react'
import { CatSprite } from '../components/CatSprite'
import { FoodIcon, LockIcon, SparklesIcon, StarIcon } from '../components/Icons'
import {
  isHideSeekDifficultyUnlocked,
  nextHintDelayMs,
} from '../state/gameReducer'
import type {
  CatStyleConfig,
  CoatStyle,
  GrowthStage,
  HideSeekDifficulty,
  HideSeekRoomId,
} from '../types/game'
import { MiniGameResultCard } from './MiniGameResultCard'

interface HideAndSeekProps {
  catName: string
  coat: CoatStyle
  stage: GrowthStage
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  beatenDifficulties: readonly HideSeekDifficulty[]
  onCatchSound?: () => void
  onCrunchSound?: () => void
  onMeowSound?: () => void
  onButtonSound?: () => void
  onFinish: (score: number, difficulty: HideSeekDifficulty) => void
  onExit: () => void
}

interface HidingSpotDef {
  id: string
  label: string
  art: string
  x: number // percentage 14..86
  y: number // percentage 28..76
  sizeClass?: string
}

interface RoomDef {
  id: HideSeekRoomId
  name: string
  tagline: string
  wallTop: string
  wallBottom: string
  wainscot: string
  floorTop: string
  floorBottom: string
  accent: string
  spots: HidingSpotDef[] // 8 spots: Easy uses 4, Medium uses 6, Hard uses 8
}

const ROOMS: RoomDef[] = [
  {
    id: 'living_room',
    name: 'Living Room',
    tagline: 'Sofa, curtains & cozy shelves',
    wallTop: '#FFF9EC',
    wallBottom: '#FBEBD0',
    wainscot: '#F6DFC0',
    floorTop: '#E6BE8A',
    floorBottom: '#D4A36A',
    accent: '#F59E0B',
    spots: [
      { id: 'curtains', label: 'Curtains', art: 'curtains', x: 20, y: 31, sizeClass: 'w-24 h-24 sm:w-36 sm:h-32 md:w-44 md:h-36' },
      { id: 'lamp', label: 'Floor Lamp', art: 'lamp', x: 43, y: 42, sizeClass: 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32' },
      { id: 'clock', label: 'Tall Clock', art: 'clock', x: 63, y: 40, sizeClass: 'w-20 h-24 sm:w-28 sm:h-32 md:w-32 md:h-36' },
      { id: 'bookshelf', label: 'Bookshelf', art: 'bookshelf', x: 82, y: 41, sizeClass: 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36' },
      { id: 'sofa', label: 'Cozy Sofa', art: 'sofa', x: 23, y: 69, sizeClass: 'w-28 h-24 sm:w-40 sm:h-32 md:w-48 md:h-36' },
      { id: 'toybox', label: 'Toy Chest', art: 'toybox', x: 46, y: 74, sizeClass: 'w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-28' },
      { id: 'armchair', label: 'Armchair', art: 'armchair', x: 67, y: 69, sizeClass: 'w-24 h-22 sm:w-32 sm:h-28 md:w-36 md:h-32' },
      { id: 'plant', label: 'Potted Plant', art: 'plant', x: 86, y: 73, sizeClass: 'w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-32' },
    ],
  },
  {
    id: 'kitchen',
    name: 'Cozy Kitchen',
    tagline: 'Cupboards, fridge & cookie jars',
    wallTop: '#F0FDF4',
    wallBottom: '#DCFCE7',
    wainscot: '#FCE7C8',
    floorTop: '#F3D2A6',
    floorBottom: '#E0B57D',
    accent: '#10B981',
    spots: [
      { id: 'fridge', label: 'Big Fridge', art: 'fridge', x: 17, y: 41, sizeClass: 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36' },
      { id: 'cupboard', label: 'Pantry', art: 'cupboard', x: 39, y: 36, sizeClass: 'w-22 h-22 sm:w-32 sm:h-28 md:w-36 md:h-32' },
      { id: 'broom_closet', label: 'Broom Closet', art: 'broom_closet', x: 61, y: 41, sizeClass: 'w-22 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36' },
      { id: 'cookie_jar', label: 'Cookie Counter', art: 'cookie_jar', x: 83, y: 42, sizeClass: 'w-24 h-22 sm:w-32 sm:h-28 md:w-36 md:h-32' },
      { id: 'oven', label: 'Warm Oven', art: 'oven', x: 19, y: 70, sizeClass: 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36' },
      { id: 'picnic_basket', label: 'Picnic Basket', art: 'picnic_basket', x: 43, y: 74, sizeClass: 'w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-28' },
      { id: 'stool', label: 'Treats Crate', art: 'crate', x: 64, y: 74, sizeClass: 'w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-28' },
      { id: 'trash_bin', label: 'Recycle Bin', art: 'bin', x: 85, y: 72, sizeClass: 'w-20 h-22 sm:w-28 sm:h-28 md:w-32 md:h-32' },
    ],
  },
  {
    id: 'bedroom',
    name: 'Dreamy Bedroom',
    tagline: 'Fluffy bed, tent & plushies',
    wallTop: '#F5F3FF',
    wallBottom: '#EDE9FE',
    wainscot: '#FDE8D7',
    floorTop: '#E9C598',
    floorBottom: '#D6AA72',
    accent: '#8B5CF6',
    spots: [
      { id: 'window_curtain', label: 'Starry Drapes', art: 'curtains', x: 20, y: 31, sizeClass: 'w-24 h-24 sm:w-36 sm:h-32 md:w-44 md:h-36' },
      { id: 'desk', label: 'Study Desk', art: 'desk', x: 43, y: 43, sizeClass: 'w-24 h-22 sm:w-32 sm:h-28 md:w-36 md:h-32' },
      { id: 'plush_shelf', label: 'Plushie Shelf', art: 'plush_shelf', x: 64, y: 32, sizeClass: 'w-22 h-20 sm:w-32 sm:h-24 md:w-36 md:h-28' },
      { id: 'wardrobe', label: 'Wardrobe', art: 'wardrobe', x: 84, y: 41, sizeClass: 'w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36' },
      { id: 'bed', label: 'Fluffy Bed', art: 'bed', x: 22, y: 70, sizeClass: 'w-28 h-24 sm:w-40 sm:h-32 md:w-48 md:h-36' },
      { id: 'beanbag', label: 'Beanbag', art: 'beanbag', x: 46, y: 75, sizeClass: 'w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-28' },
      { id: 'hamper', label: 'Pillow Basket', art: 'basket', x: 65, y: 74, sizeClass: 'w-20 h-20 sm:w-28 sm:h-24 md:w-32 md:h-28' },
      { id: 'tent', label: 'Play Tent', art: 'tent', x: 83, y: 68, sizeClass: 'w-24 h-24 sm:w-36 sm:h-32 md:w-40 md:h-36' },
    ],
  },
  {
    id: 'garden',
    name: 'Sunlit Garden',
    tagline: 'Flower pots, bushes & treehouse',
    wallTop: '#BAE6FD',
    wallBottom: '#E0F7FF',
    wainscot: '#D1FAE5',
    floorTop: '#86EFAC',
    floorBottom: '#4ADE80',
    accent: '#0EA5E9',
    spots: [
      { id: 'tree_trunk', label: 'Oak Tree', art: 'tree_trunk', x: 18, y: 39, sizeClass: 'w-28 h-28 sm:w-40 sm:h-36 md:w-48 md:h-44' },
      { id: 'birdhouse', label: 'Garden Shed', art: 'shed', x: 42, y: 41, sizeClass: 'w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-36' },
      { id: 'sunflower_pot', label: 'Sunflowers', art: 'sunflower', x: 64, y: 44, sizeClass: 'w-20 h-22 sm:w-28 sm:h-28 md:w-32 md:h-32' },
      { id: 'hedge', label: 'Berry Hedge', art: 'bush', x: 83, y: 45, sizeClass: 'w-24 h-22 sm:w-36 sm:h-28 md:w-40 md:h-32' },
      { id: 'bench', label: 'Garden Bench', art: 'bench', x: 21, y: 71, sizeClass: 'w-28 h-22 sm:w-36 sm:h-28 md:w-44 md:h-32' },
      { id: 'wheelbarrow', label: 'Wheelbarrow', art: 'wheelbarrow', x: 45, y: 74, sizeClass: 'w-24 h-20 sm:w-32 sm:h-28 md:w-36 md:h-28' },
      { id: 'watering_can', label: 'Watering Can', art: 'watering_can', x: 66, y: 75, sizeClass: 'w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28' },
      { id: 'flowerpot', label: 'Big Flower Pot', art: 'flowerpot', x: 85, y: 72, sizeClass: 'w-22 h-22 sm:w-28 sm:h-28 md:w-32 md:h-32' },
    ],
  },
]

const DIFFICULTIES: Array<{
  id: HideSeekDifficulty
  label: string
  spotCount: number
  baseScore: number
  accent: string
  badgeBg: string
  reqText: string
}> = [
  {
    id: 'easy',
    label: 'Easy',
    spotCount: 4,
    baseScore: 7,
    accent: '#10B981',
    badgeBg: '#D1FAE5',
    reqText: '4 Hiding Spots',
  },
  {
    id: 'medium',
    label: 'Medium',
    spotCount: 6,
    baseScore: 11,
    accent: '#F59E0B',
    badgeBg: '#FEF3C7',
    reqText: 'Beat Easy first!',
  },
  {
    id: 'hard',
    label: 'Hard',
    spotCount: 8,
    baseScore: 15,
    accent: '#FB7185',
    badgeBg: '#FFE4E6',
    reqText: 'Beat Medium first!',
  },
]

type GamePhase = 'setup' | 'seeking' | 'found' | 'giving_up' | 'finished'

export function HideAndSeek({
  catName,
  coat,
  stage,
  equippedAccessory,
  catStyle,
  beatenDifficulties,
  onCatchSound,
  onCrunchSound,
  onMeowSound,
  onButtonSound,
  onFinish,
  onExit,
}: HideAndSeekProps) {
  const [phase, setPhase] = useState<GamePhase>('setup')
  const [selectedDiff, setSelectedDiff] = useState<HideSeekDifficulty>('easy')
  const [selectedRoomId, setSelectedRoomId] = useState<HideSeekRoomId>('living_room')
  const [activeSpots, setActiveSpots] = useState<HidingSpotDef[]>([])
  const [hidingSpotId, setHidingSpotId] = useState<string>('')
  const [checkedIds, setCheckedIds] = useState<string[]>([])
  const [wrongPopId, setWrongPopId] = useState<string | null>(null)
  const [wrongPopTick, setWrongPopTick] = useState(0)
  const [hintShaking, setHintShaking] = useState(false)
  const [finalScore, setFinalScore] = useState(0)

  // Give-up treat-toss animation state
  const [kittyAtTreat, setKittyAtTreat] = useState(false)
  const [kittyRunFacing, setKittyRunFacing] = useState<'left' | 'right'>('right')

  const hintTimerRef = useRef<number | null>(null)
  const hintAnimTimerRef = useRef<number | null>(null)
  const wrongPopTimerRef = useRef<number | null>(null)
  const phaseTimersRef = useRef<number[]>([])

  const clearAllTimers = useCallback(() => {
    if (hintTimerRef.current !== null) {
      window.clearTimeout(hintTimerRef.current)
      hintTimerRef.current = null
    }
    if (hintAnimTimerRef.current !== null) {
      window.clearTimeout(hintAnimTimerRef.current)
      hintAnimTimerRef.current = null
    }
    if (wrongPopTimerRef.current !== null) {
      window.clearTimeout(wrongPopTimerRef.current)
      wrongPopTimerRef.current = null
    }
    phaseTimersRef.current.forEach((id) => window.clearTimeout(id))
    phaseTimersRef.current = []
  }, [])

  useEffect(() => clearAllTimers, [clearAllTimers])

  // Schedule recurring 50-60s tiny wiggle hint on ONLY the hidden kitty's object
  useEffect(() => {
    if (phase !== 'seeking') return

    let active = true
    const scheduleHint = () => {
      hintTimerRef.current = window.setTimeout(() => {
        if (!active) return
        setHintShaking(true)
        hintAnimTimerRef.current = window.setTimeout(() => {
          if (!active) return
          setHintShaking(false)
          scheduleHint()
        }, 700)
      }, nextHintDelayMs())
    }

    scheduleHint()
    return () => {
      active = false
      if (hintTimerRef.current !== null) {
        window.clearTimeout(hintTimerRef.current)
        hintTimerRef.current = null
      }
      if (hintAnimTimerRef.current !== null) {
        window.clearTimeout(hintAnimTimerRef.current)
        hintAnimTimerRef.current = null
      }
    }
  }, [phase])

  const startRound = (roomId: HideSeekRoomId, diff: HideSeekDifficulty) => {
    clearAllTimers()
    const room = ROOMS.find((r) => r.id === roomId) ?? ROOMS[0]

    // Pick spots evenly spaced across the room for Easy (4), Medium (6), Hard (8)
    const chosenSpots =
      diff === 'easy'
        ? [room.spots[0], room.spots[3], room.spots[4], room.spots[7]]
        : diff === 'medium'
          ? [room.spots[0], room.spots[1], room.spots[3], room.spots[4], room.spots[6], room.spots[7]]
          : room.spots

    const hiddenSpot = chosenSpots[Math.floor(Math.random() * chosenSpots.length)]

    onButtonSound?.()
    setSelectedRoomId(room.id)
    setSelectedDiff(diff)
    setActiveSpots(chosenSpots)
    setHidingSpotId(hiddenSpot.id)
    setCheckedIds([])
    setWrongPopId(null)
    setWrongPopTick(0)
    setHintShaking(false)
    setKittyAtTreat(false)
    setPhase('seeking')
  }

  const handleInspectSpot = (spot: HidingSpotDef) => {
    if (phase !== 'seeking') return

    if (spot.id === hidingSpotId) {
      clearAllTimers()
      onCatchSound?.()
      onMeowSound?.()
      const diffMeta = DIFFICULTIES.find((d) => d.id === selectedDiff) ?? DIFFICULTIES[0]
      const wrongTries = checkedIds.length
      const score = Math.max(3, diffMeta.baseScore - wrongTries)
      setFinalScore(score)
      setWrongPopId(null)
      setHintShaking(false)
      setPhase('found')

      const t = window.setTimeout(() => {
        setPhase('finished')
        onFinish(score, selectedDiff)
      }, 1350)
      phaseTimersRef.current.push(t)
      return
    }

    onButtonSound?.()
    if (!checkedIds.includes(spot.id)) {
      setCheckedIds((prev) => [...prev, spot.id])
    }
    setWrongPopId(spot.id)
    setWrongPopTick((t) => t + 1)
    if (wrongPopTimerRef.current !== null) {
      window.clearTimeout(wrongPopTimerRef.current)
    }
    wrongPopTimerRef.current = window.setTimeout(() => {
      setWrongPopId((cur) => (cur === spot.id ? null : cur))
    }, 1050)
  }

  // Give Up / Quit: tosses a treat out onto the floor; kitty runs out from hiding before exiting!
  const handleGiveUpQuit = () => {
    if (phase !== 'seeking') return
    clearAllTimers()

    const hiddenSpot = activeSpots.find((s) => s.id === hidingSpotId)
    const startX = hiddenSpot?.x ?? 20
    setKittyRunFacing(startX > 50 ? 'left' : 'right')
    setKittyAtTreat(false)
    setPhase('giving_up')
    onButtonSound?.()

    // Moment after treat lands, kitty hops out from hiding and runs to the center treat!
    const tRun = window.setTimeout(() => {
      onMeowSound?.()
      setKittyAtTreat(true)
    }, 480)

    const tMunch = window.setTimeout(() => {
      onCrunchSound?.()
    }, 1280)

    const tExit = window.setTimeout(() => {
      onExit()
    }, 2350)

    phaseTimersRef.current.push(tRun, tMunch, tExit)
  }

  const currentRoom = ROOMS.find((r) => r.id === selectedRoomId) ?? ROOMS[0]
  const currentDiffMeta = DIFFICULTIES.find((d) => d.id === selectedDiff) ?? DIFFICULTIES[0]
  const hiddenSpot = activeSpots.find((s) => s.id === hidingSpotId) ?? activeSpots[0]

  // --- SETUP SCREEN: Pick Difficulty (with lock gating) & Pick Room ---
  if (phase === 'setup') {
    return (
      <div
        id="game-hide-seek"
        className="fixed inset-0 z-40 app-shell bg-gradient-to-b from-[#ECFDF5] via-[#FFF8EC] to-[#FFE8CC] items-center justify-center p-3 sm:p-6"
      >
        <div className="w-full max-w-4xl max-h-[94dvh] overflow-y-auto rounded-[2rem] sm:rounded-[2.25rem] bg-[#FFFDF8]/96 border-4 border-[#6EE7B7] shadow-[0_22px_50px_rgba(91,58,41,0.2)] p-4 sm:p-6 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#D1FAE5] border-2 border-[#10B981] flex items-center justify-center shrink-0">
                <SparklesIcon className="w-7 h-7" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-3xl font-black text-[#5B3A29] leading-tight">
                  Hide &amp; Seek!
                </h2>
                <p className="text-xs sm:text-sm font-bold text-[#8A6552]">
                  Pick a difficulty and choose a room to search for {catName}!
                </p>
              </div>
            </div>

            <button
              id="btn-exit-minigame"
              type="button"
              onClick={onExit}
              className="cozy-btn shrink-0 min-h-[46px] px-4 sm:px-5 rounded-2xl bg-[#FFF2D6] border-[3px] border-[#E7C69C] text-[#5B3A29] text-sm sm:text-base font-black"
            >
              Back
            </button>
          </div>

          {/* 1. Difficulty Picker (Easy -> Medium -> Hard progression) */}
          <div>
            <p className="text-sm sm:text-base font-black text-[#7D563E] mb-2">
              1. Difficulty
            </p>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {DIFFICULTIES.map((diff) => {
                const unlocked = isHideSeekDifficultyUnlocked(beatenDifficulties, diff.id)
                const beaten = beatenDifficulties.includes(diff.id)
                const selected = selectedDiff === diff.id
                const spotHint = `${diff.spotCount} Spots`

                return (
                  <button
                    key={diff.id}
                    id={`diff-${diff.id}`}
                    type="button"
                    disabled={!unlocked}
                    onClick={() => {
                      onButtonSound?.()
                      setSelectedDiff(diff.id)
                    }}
                    aria-pressed={selected}
                    className={`cozy-btn min-h-[78px] rounded-2xl border-[3px] p-2 sm:p-3 flex flex-col items-center justify-center gap-1 text-center ${
                      !unlocked
                        ? 'bg-[#F5EFE6] border-[#DAC8B2] opacity-70 cursor-not-allowed'
                        : selected
                          ? 'bg-[#FFFDF8] shadow-[0_4px_0_rgba(91,58,41,0.18)] ring-4'
                          : 'bg-[#FFFDF8] border-[#E7CFAF]'
                    }`}
                    style={
                      unlocked && selected
                        ? { borderColor: diff.accent, boxShadow: `0 4px 0 ${diff.accent}` }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-sm sm:text-lg font-black text-[#5B3A29]">
                        {diff.label}
                      </span>
                      {beaten && (
                        <span className="text-xs font-black px-1.5 py-0.5 rounded-full bg-[#10B981] text-white">
                          ✓
                        </span>
                      )}
                    </div>

                    {unlocked ? (
                      <span
                        className="text-[11px] sm:text-xs font-extrabold px-2 py-0.5 rounded-full text-[#5B3A29]"
                        style={{ backgroundColor: diff.badgeBg }}
                      >
                        {spotHint}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-black text-[#8A6552]">
                        <LockIcon className="w-3.5 h-3.5 shrink-0" />
                        {diff.reqText}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. House Room Picker */}
          <div>
            <p className="text-sm sm:text-base font-black text-[#7D563E] mb-2">
              2. Pick a Room in the House
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
              {ROOMS.map((room) => (
                <button
                  key={room.id}
                  id={`room-choice-${room.id}`}
                  type="button"
                  onClick={() => startRound(room.id, selectedDiff)}
                  className="cozy-btn rounded-[1.5rem] border-[3px] p-3 sm:p-4 bg-[#FFFDF8] flex items-center gap-3 text-left shadow-[0_4px_0_rgba(91,58,41,0.14)]"
                  style={{ borderColor: room.accent }}
                >
                  <div
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#E7CFAF] flex items-center justify-center shrink-0 overflow-hidden"
                    style={{
                      background: `linear-gradient(180deg, ${room.wallTop} 0%, ${room.floorTop} 100%)`,
                    }}
                  >
                    <HidingPropSvg art={room.spots[4].art} className="w-14 h-14" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-base sm:text-lg font-black text-[#5B3A29]">
                      {room.name}
                    </div>
                    <p className="text-xs font-bold text-[#8A6552]">
                      {room.tagline}
                    </p>
                    <span
                      className="inline-block mt-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: room.accent }}
                    >
                      Search Here!
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- ACTIVE ROOM SEEKING / FOUND / TREAT-TOSS QUIT VIEW ---
  return (
    <div
      id="game-hide-seek"
      className="fixed inset-0 z-40 app-shell"
      style={{ backgroundColor: currentRoom.wallTop }}
    >
      {/* Top Bar */}
      <header className="relative z-30 px-2.5 sm:px-5 pt-2.5 pb-2 flex items-center justify-between gap-2 shrink-0">
        <button
          id="btn-hideseek-quit"
          type="button"
          disabled={phase !== 'seeking'}
          onClick={handleGiveUpQuit}
          className="cozy-btn min-h-[48px] sm:min-h-[54px] px-3 sm:px-4 rounded-2xl bg-[#FFFDF8] border-[3px] border-[#F59E0B] text-[#92400E] text-xs sm:text-base font-black flex items-center gap-1.5 disabled:opacity-60"
        >
          <FoodIcon foodId="treat" className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" />
          <span>Give Up</span>
        </button>

        <div className="flex-1 max-w-md rounded-2xl bg-[#FFFDF8]/95 border-[3px] border-[#E7C9A4] px-3 py-1.5 text-center shadow-sm min-w-0">
          <div className="flex items-center justify-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-base font-black text-[#5B3A29] truncate">
              {currentRoom.name}
            </span>
            <span
              className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full text-[#5B3A29]"
              style={{ backgroundColor: currentDiffMeta.badgeBg }}
            >
              {currentDiffMeta.label}
            </span>
          </div>
          <p className="text-[10px] sm:text-xs font-bold text-[#8A6552] truncate">
            {phase === 'giving_up'
              ? `Tossing a treat for ${catName}...`
              : phase === 'found'
                ? `You found ${catName}!`
                : `Tap objects around the room to find ${catName}!`}
          </p>
        </div>

        <div
          id="minigame-score"
          className="min-h-[48px] sm:min-h-[54px] px-3 sm:px-4 rounded-2xl bg-[#FFFDF8] border-[3px] border-[#FBBF24] flex items-center gap-1 shrink-0"
        >
          <StarIcon className="w-5 h-5 sm:w-7 sm:h-7" />
          <span className="text-sm sm:text-lg font-black text-[#92400E] tabular-nums">
            {checkedIds.length} tries
          </span>
        </div>
      </header>

      {/* Illustrated Room Stage */}
      <div
        id="hideseek-room-stage"
        className="relative flex-1 m-2 sm:m-4 mt-0 rounded-[2rem] border-4 border-[#E7C49A] shadow-inner overflow-hidden"
      >
        {/* Cohesive Full-Room Scenery Layer (non-hiding architecture & atmosphere) */}
        <div
          className="absolute inset-0 pointer-events-none select-none"
          aria-hidden="true"
        >
          {/* Upper Wall / Sky */}
          <div
            className="absolute inset-x-0 top-0 h-[56%]"
            style={{
              background: `linear-gradient(180deg, ${currentRoom.wallTop} 0%, ${currentRoom.wallBottom} 100%)`,
            }}
          />

          {/* Subtle Wall Wallpaper / Sky Atmosphere */}
          {currentRoom.id === 'living_room' && (
            <>
              <div
                className="absolute inset-x-0 top-0 h-[40%] opacity-35"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, rgba(229,184,132,0.22) 0px, rgba(229,184,132,0.22) 18px, transparent 18px, transparent 54px)',
                }}
              />
              {/* Cozy framed wall picture */}
              <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-[9%] w-24 h-20 rounded-xl bg-[#FFFDF8] border-[5px] border-[#C78F57] shadow-sm items-center justify-center">
                <svg viewBox="0 0 60 50" className="w-14 h-12">
                  <rect width="60" height="50" rx="4" fill="#FEF3C7" />
                  <circle cx="30" cy="28" r="11" fill="#FB7185" opacity="0.55" />
                  <polygon points="21,23 24,13 29,20" fill="#FB7185" opacity="0.55" />
                  <polygon points="39,23 36,13 31,20" fill="#FB7185" opacity="0.55" />
                </svg>
              </div>
            </>
          )}

          {currentRoom.id === 'kitchen' && (
            <>
              {/* Soft kitchen tile backsplash */}
              <div
                className="absolute inset-x-0 top-[26%] h-[30%] opacity-55 border-t-4 border-[#A7F3D0]"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, rgba(16,185,129,0.12) 1px, transparent 1px), linear-gradient(rgba(16,185,129,0.12) 1px, transparent 1px)',
                  backgroundSize: '28px 24px',
                  backgroundColor: '#ECFDF5',
                }}
              />
              {/* High decorative kitchen clock / plate rail */}
              <div className="hidden sm:flex absolute left-1/2 -translate-x-1/2 top-[7%] w-16 h-16 rounded-full bg-[#FFFDF8] border-[4px] border-[#10B981] shadow-sm items-center justify-center">
                <div className="w-1 h-4 bg-[#5B3A29] rounded-full -translate-y-1.5" />
                <div className="w-3 h-1 bg-[#5B3A29] rounded-full translate-x-1" />
              </div>
            </>
          )}

          {currentRoom.id === 'bedroom' && (
            <>
              {/* Subtle starry bedroom wallpaper & garland */}
              <svg
                viewBox="0 0 1000 180"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-0 w-full h-[26%] opacity-80"
              >
                <path
                  d="M0 18 Q250 72 500 24 Q750 72 1000 18"
                  fill="none"
                  stroke="#C4B5FD"
                  strokeWidth="4"
                />
                {[90, 210, 340, 500, 660, 790, 910].map((cx, i) => (
                  <polygon
                    key={cx}
                    points={`${cx},26 ${cx - 12},54 ${cx + 12},54`}
                    fill={i % 2 === 0 ? '#FDE68A' : '#F9A8D4'}
                  />
                ))}
              </svg>
            </>
          )}

          {currentRoom.id === 'garden' ? (
            <>
              {/* Sun & Fluffy Clouds */}
              <div className="absolute right-[7%] top-[6%] w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-[#FDE047] shadow-[0_0_32px_rgba(253,224,71,0.75)]" />
              <div className="absolute left-[24%] top-[8%] w-24 sm:w-36 h-8 sm:h-11 rounded-full bg-white/85" />
              <div className="absolute left-[29%] top-[5%] w-16 sm:w-24 h-8 sm:h-11 rounded-full bg-white/85" />
              <div className="hidden sm:block absolute left-[60%] top-[11%] w-28 h-9 rounded-full bg-white/75" />

              {/* Distant Rolling Hills */}
              <svg
                viewBox="0 0 1000 120"
                preserveAspectRatio="none"
                className="absolute inset-x-0 top-[42%] w-full h-[15%]"
              >
                <path
                  d="M0 90 Q240 15 490 70 Q760 15 1000 65 L1000 120 L0 120 Z"
                  fill="#86EFAC"
                  opacity="0.7"
                />
              </svg>

              {/* Wooden Garden Picket Fence along the lawn edge */}
              <div
                className="absolute inset-x-0 top-[46%] h-[10%] border-t-4 border-b-4 border-[#B97B48]"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(90deg, #F6DFC0 0px, #F6DFC0 22px, transparent 22px, transparent 34px)',
                  backgroundColor: 'rgba(134,239,172,0.35)',
                }}
              />
            </>
          ) : (
            <>
              {/* Wainscoting & Wood Baseboard along wall/floor seam */}
              <div
                className="absolute inset-x-0 top-[39%] h-[17%] border-t-[4px] border-b-[5px] border-[#DEC098]"
                style={{ backgroundColor: currentRoom.wainscot }}
              />
            </>
          )}

          {/* Floor / Lawn */}
          <div
            className="absolute inset-x-0 bottom-0 h-[44%]"
            style={{
              background: `linear-gradient(180deg, ${currentRoom.floorTop} 0%, ${currentRoom.floorBottom} 100%)`,
            }}
          />

          {/* Floor Texture & Center Cozy Rug / Stepping Stones */}
          {currentRoom.id === 'garden' ? (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-[11%] w-[48%] sm:w-[34%] h-[22%] rounded-full bg-[#DCFCE7]/45 border-2 border-[#4ADE80]/30" />
          ) : (
            <>
              <div
                className="absolute inset-x-0 bottom-0 h-[44%] opacity-20"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(180deg, transparent 0px, transparent 30px, rgba(91,58,41,0.3) 30px, rgba(91,58,41,0.3) 32px)',
                }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[58%] sm:w-[40%] h-[22%] rounded-full border-4 border-[#E7C9A4]/60 shadow-inner"
                style={{
                  backgroundColor:
                    currentRoom.id === 'bedroom'
                      ? 'rgba(243,232,255,0.68)'
                      : currentRoom.id === 'kitchen'
                        ? 'rgba(236,253,245,0.68)'
                        : 'rgba(255,253,248,0.65)',
                }}
              />
            </>
          )}
        </div>

        {/* Seamless Interactive Hiding Objects Integrated in the Room */}
        {activeSpots.map((spot) => {
          const isTarget = spot.id === hidingSpotId
          const isChecked = checkedIds.includes(spot.id)
          const isWrongPop = wrongPopId === spot.id
          const isFoundReveal = phase === 'found' && isTarget
          const shouldTinyShake = phase === 'seeking' && isTarget && hintShaking
          const isHighWallProp = spot.y < 35

          return (
            <button
              key={spot.id}
              id={`hiding-spot-${spot.id}`}
              data-hiding-target={isTarget ? 'true' : 'false'}
              data-hint-shaking={shouldTinyShake ? 'true' : 'false'}
              data-checked={isChecked ? 'true' : 'false'}
              type="button"
              disabled={phase !== 'seeking'}
              onClick={() => handleInspectSpot(spot)}
              aria-label={`Look behind ${spot.label}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center justify-center bg-transparent border-0 p-0 rounded-2xl cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F59E0B]/70 active:scale-95 transition-transform opacity-100"
            >
              {/* Soft grounding floor shadow for standing furniture/plants */}
              {!isHighWallProp && (
                <div
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-[78%] h-3 sm:h-4 rounded-full bg-[#5B3A29]/15 blur-[1px] pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {/* Subtle wiggle on ONLY the real hiding spot every 50-60s, or gentle peek shake when tapped */}
              <div
                className={
                  shouldTinyShake || isWrongPop
                    ? 'animate-tiny-hint-shake'
                    : undefined
                }
              >
                <HidingPropSvg
                  art={spot.art}
                  className={`${spot.sizeClass ?? 'w-22 h-22 sm:w-28 sm:h-28 md:w-32 md:h-32'} drop-shadow-[0_3px_4px_rgba(91,58,41,0.18)]`}
                />
              </div>

              {isWrongPop && (
                <span
                  key={wrongPopTick}
                  className={`pointer-events-none absolute left-1/2 -translate-x-1/2 ${
                    isHighWallProp ? '-bottom-3' : '-top-3'
                  } whitespace-nowrap px-2.5 py-0.5 rounded-full bg-[#FFFDF8] border-2 border-[#FB7185] text-[11px] sm:text-xs font-black text-[#BE123C] shadow-md animate-float-up z-30`}
                >
                  Not here!
                </span>
              )}

              {/* Found Reveal! Kitty pops out happily from this spot */}
              {isFoundReveal && (
                <div
                  id="hideseek-found-kitty"
                  className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                >
                  <div className="relative -translate-y-3">
                    <span className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1 rounded-full bg-[#FFFDF8] border-[3px] border-[#10B981] text-xs sm:text-sm font-black text-[#065F46] shadow-lg">
                      Meow! Found me!
                    </span>
                    <CatSprite
                      coat={coat}
                      stage={stage}
                      mood="thriving"
                      animation="wiggle"
                      equippedAccessory={equippedAccessory}
                      style={catStyle}
                      showThoughtBubble={false}
                      className="w-24 h-24 sm:w-36 sm:h-36"
                    />
                  </div>
                </div>
              )}
            </button>
          )
        })}

        {/* Give-Up Treat Toss + Kitty Running Out From Hiding Sequence */}
        {phase === 'giving_up' && hiddenSpot && (
          <>
            {/* Tossed Fish Treat arcing onto the floor */}
            <div
              id="hideseek-tossed-treat"
              style={{ left: '50%', top: '79%' }}
              className="pointer-events-none absolute -translate-y-1/2 z-30 animate-treat-toss"
            >
              <FoodIcon foodId="treat" className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl" />
            </div>

            {/* Kitty emerges from its hiding spot and runs straight over to the tossed treat */}
            <div
              id="hideseek-runout-kitty"
              style={{
                left: kittyAtTreat ? '50%' : `${hiddenSpot.x}%`,
                top: kittyAtTreat ? '66%' : `${hiddenSpot.y}%`,
              }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-35 transition-all duration-[850ms] ease-out"
            >
              <div className="relative flex flex-col items-center">
                <span className="mb-1 whitespace-nowrap px-3 py-1 rounded-full bg-[#FFFDF8] border-[3px] border-[#F59E0B] text-xs sm:text-sm font-black text-[#92400E] shadow-lg">
                  {kittyAtTreat ? 'Yum, a treat!' : 'Ooh, a treat!'}
                </span>
                <CatSprite
                  coat={coat}
                  stage={stage}
                  mood="thriving"
                  animation={kittyAtTreat ? 'eating' : 'walking'}
                  facing={kittyRunFacing}
                  equippedAccessory={equippedAccessory}
                  style={catStyle}
                  showThoughtBubble={false}
                  className="w-28 h-28 sm:w-36 sm:h-36"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Round Result Card (unlocks next difficulty cleanly!) */}
      {phase === 'finished' && (
        <MiniGameResultCard
          gameTitle={`Hide & Seek (${currentDiffMeta.label})`}
          score={finalScore}
          catName={catName}
          coat={coat}
          stage={stage}
          equippedAccessory={equippedAccessory}
          catStyle={catStyle}
          onPlayAgain={() => setPhase('setup')}
          onBackHome={onExit}
        />
      )}
    </div>
  )
}

function HidingPropSvg({ art, className = 'w-24 h-24' }: { art: string; className?: string }) {
  switch (art) {
    case 'sofa':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="12" y="24" width="76" height="36" rx="14" fill="#FB7185" stroke="#5B3A29" strokeWidth="3.8" />
          <rect x="6" y="38" width="16" height="32" rx="7" fill="#F43F5E" stroke="#5B3A29" strokeWidth="3.6" />
          <rect x="78" y="38" width="16" height="32" rx="7" fill="#F43F5E" stroke="#5B3A29" strokeWidth="3.6" />
          <rect x="16" y="48" width="68" height="22" rx="6" fill="#FDA4AF" stroke="#5B3A29" strokeWidth="3.6" />
          <rect x="20" y="70" width="8" height="9" rx="2" fill="#8A5A36" />
          <rect x="72" y="70" width="8" height="9" rx="2" fill="#8A5A36" />
        </svg>
      )
    case 'curtains':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="14" y="14" width="72" height="62" rx="6" fill="#E0F7FF" stroke="#C78F57" strokeWidth="3.5" />
          <path d="M12 12 L46 12 Q38 45 44 78 L12 78 Z" fill="#A78BFA" stroke="#5B3A29" strokeWidth="3.5" strokeLinejoin="round" />
          <path d="M88 12 L54 12 Q62 45 56 78 L88 78 Z" fill="#A78BFA" stroke="#5B3A29" strokeWidth="3.5" strokeLinejoin="round" />
          <line x1="6" y1="12" x2="94" y2="12" stroke="#5B3A29" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      )
    case 'bookshelf':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="14" y="10" width="72" height="70" rx="8" fill="#D9A066" stroke="#5B3A29" strokeWidth="3.8" />
          <rect x="20" y="16" width="60" height="24" fill="#FFF3D6" stroke="#5B3A29" strokeWidth="2.5" />
          <rect x="20" y="46" width="60" height="26" fill="#FFF3D6" stroke="#5B3A29" strokeWidth="2.5" />
          <rect x="24" y="21" width="9" height="19" fill="#FB7185" stroke="#5B3A29" strokeWidth="2" />
          <rect x="34" y="19" width="10" height="21" fill="#38BDF8" stroke="#5B3A29" strokeWidth="2" />
          <rect x="46" y="23" width="9" height="17" fill="#34D399" stroke="#5B3A29" strokeWidth="2" />
          <rect x="26" y="51" width="11" height="21" fill="#FBBF24" stroke="#5B3A29" strokeWidth="2" />
          <rect x="40" y="54" width="10" height="18" fill="#A78BFA" stroke="#5B3A29" strokeWidth="2" />
        </svg>
      )
    case 'clock':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="30" y="10" width="40" height="72" rx="10" fill="#B97B48" stroke="#5B3A29" strokeWidth="3.8" />
          <circle cx="50" cy="30" r="13" fill="#FFFDF8" stroke="#5B3A29" strokeWidth="3" />
          <line x1="50" y1="30" x2="50" y2="22" stroke="#5B3A29" strokeWidth="2.6" strokeLinecap="round" />
          <line x1="50" y1="30" x2="57" y2="32" stroke="#5B3A29" strokeWidth="2.6" strokeLinecap="round" />
          <rect x="38" y="48" width="24" height="26" rx="4" fill="#8C5830" stroke="#5B3A29" strokeWidth="2.4" />
          <circle cx="50" cy="64" r="5" fill="#FBBF24" />
        </svg>
      )
    case 'lamp':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M30 40 L40 12 L60 12 L70 40 Z" fill="#FDE68A" stroke="#5B3A29" strokeWidth="3.6" strokeLinejoin="round" />
          <line x1="50" y1="40" x2="50" y2="75" stroke="#5B3A29" strokeWidth="5" />
          <ellipse cx="50" cy="78" rx="18" ry="5" fill="#D9A066" stroke="#5B3A29" strokeWidth="3" />
        </svg>
      )
    case 'toybox':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="14" y="34" width="72" height="42" rx="8" fill="#38BDF8" stroke="#5B3A29" strokeWidth="3.8" />
          <rect x="10" y="24" width="80" height="14" rx="6" fill="#7DD3FC" stroke="#5B3A29" strokeWidth="3.8" />
          <circle cx="50" cy="54" r="10" fill="#FEF08A" stroke="#5B3A29" strokeWidth="2.6" />
        </svg>
      )
    case 'armchair':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="20" y="18" width="60" height="40" rx="16" fill="#34D399" stroke="#5B3A29" strokeWidth="3.8" />
          <rect x="12" y="38" width="16" height="32" rx="7" fill="#10B981" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="72" y="38" width="16" height="32" rx="7" fill="#10B981" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="22" y="50" width="56" height="20" rx="6" fill="#6EE7B7" stroke="#5B3A29" strokeWidth="3.5" />
        </svg>
      )
    case 'plant':
    case 'flowerpot':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M46 48 C22 24 26 8 46 6 C54 22 52 38 50 48 Z" fill="#52B788" stroke="#366E54" strokeWidth="3.2" />
          <path d="M52 48 C72 22 82 14 86 24 C74 36 62 44 54 48 Z" fill="#74C69D" stroke="#366E54" strokeWidth="3.2" />
          <path d="M26 48 L74 48 L67 80 L33 80 Z" fill="#E07A5F" stroke="#5B3A29" strokeWidth="3.8" strokeLinejoin="round" />
          <rect x="22" y="43" width="56" height="11" rx="5" fill="#F29E86" stroke="#5B3A29" strokeWidth="3.4" />
        </svg>
      )
    case 'fridge':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="24" y="8" width="52" height="74" rx="10" fill="#E0F2FE" stroke="#5B3A29" strokeWidth="3.8" />
          <line x1="24" y1="34" x2="76" y2="34" stroke="#5B3A29" strokeWidth="3.5" />
          <line x1="65" y1="18" x2="65" y2="28" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
          <line x1="65" y1="42" x2="65" y2="58" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )
    case 'cupboard':
    case 'wardrobe':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="18" y="10" width="64" height="70" rx="8" fill="#E6BE8A" stroke="#5B3A29" strokeWidth="3.8" />
          <line x1="50" y1="10" x2="50" y2="80" stroke="#5B3A29" strokeWidth="3.2" />
          <circle cx="43" cy="45" r="3.5" fill="#5B3A29" />
          <circle cx="57" cy="45" r="3.5" fill="#5B3A29" />
        </svg>
      )
    case 'cookie_jar':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="14" y="54" width="72" height="26" rx="6" fill="#FDE68A" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="33" y="20" width="34" height="36" rx="10" fill="#BAE6FD" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="37" y="13" width="26" height="9" rx="4" fill="#FB7185" stroke="#5B3A29" strokeWidth="3" />
          <circle cx="50" cy="38" r="7" fill="#D97706" />
        </svg>
      )
    case 'broom_closet':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="24" y="10" width="52" height="70" rx="8" fill="#D4A36A" stroke="#5B3A29" strokeWidth="3.8" />
          <rect x="31" y="18" width="38" height="24" rx="4" fill="#FFF3D6" stroke="#5B3A29" strokeWidth="2.5" />
          <circle cx="66" cy="50" r="3.8" fill="#FBBF24" stroke="#5B3A29" strokeWidth="2" />
        </svg>
      )
    case 'oven':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="18" y="16" width="64" height="64" rx="8" fill="#FFFDF8" stroke="#5B3A29" strokeWidth="3.8" />
          <rect x="26" y="34" width="48" height="34" rx="6" fill="#1E293B" stroke="#5B3A29" strokeWidth="3" />
          <circle cx="32" cy="24" r="3.2" fill="#FB7185" />
          <circle cx="44" cy="24" r="3.2" fill="#FBBF24" />
          <circle cx="56" cy="24" r="3.2" fill="#34D399" />
          <circle cx="68" cy="24" r="3.2" fill="#38BDF8" />
        </svg>
      )
    case 'picnic_basket':
    case 'basket':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M30 42 Q50 12 70 42" fill="none" stroke="#8A5A36" strokeWidth="5" strokeLinecap="round" />
          <rect x="18" y="42" width="64" height="34" rx="9" fill="#E6BE8A" stroke="#5B3A29" strokeWidth="3.8" />
          <line x1="18" y1="54" x2="82" y2="54" stroke="#C69156" strokeWidth="3" />
          <line x1="18" y1="65" x2="82" y2="65" stroke="#C69156" strokeWidth="3" />
        </svg>
      )
    case 'crate':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="18" y="28" width="64" height="48" rx="6" fill="#D9A066" stroke="#5B3A29" strokeWidth="3.8" />
          <line x1="18" y1="44" x2="82" y2="44" stroke="#5B3A29" strokeWidth="3" />
          <line x1="18" y1="60" x2="82" y2="60" stroke="#5B3A29" strokeWidth="3" />
        </svg>
      )
    case 'bin':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M26 28 L74 28 L68 78 L32 78 Z" fill="#34D399" stroke="#5B3A29" strokeWidth="3.8" strokeLinejoin="round" />
          <rect x="22" y="20" width="56" height="10" rx="5" fill="#6EE7B7" stroke="#5B3A29" strokeWidth="3.5" />
        </svg>
      )
    case 'bed':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="10" y="24" width="12" height="52" rx="4" fill="#C78F57" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="14" y="44" width="76" height="24" rx="8" fill="#F9A8D4" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="22" y="34" width="22" height="14" rx="6" fill="#FFFDF8" stroke="#5B3A29" strokeWidth="3" />
          <rect x="80" y="40" width="10" height="36" rx="4" fill="#C78F57" stroke="#5B3A29" strokeWidth="3.5" />
        </svg>
      )
    case 'tent':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M12 76 L50 14 L88 76 Z" fill="#F472B6" stroke="#5B3A29" strokeWidth="3.8" strokeLinejoin="round" />
          <path d="M38 76 L50 42 L62 76 Z" fill="#4C1D95" stroke="#5B3A29" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="50" cy="14" r="5" fill="#FDE047" stroke="#5B3A29" strokeWidth="2.5" />
        </svg>
      )
    case 'beanbag':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M16 64 C16 34 32 22 50 22 C68 22 84 34 84 64 C84 74 70 78 50 78 C30 78 16 74 16 64 Z" fill="#38BDF8" stroke="#5B3A29" strokeWidth="3.8" />
        </svg>
      )
    case 'desk':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="12" y="36" width="76" height="12" rx="4" fill="#D9A066" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="16" y="48" width="10" height="30" fill="#B97B48" stroke="#5B3A29" strokeWidth="3.2" />
          <rect x="74" y="48" width="10" height="30" fill="#B97B48" stroke="#5B3A29" strokeWidth="3.2" />
          <rect x="34" y="18" width="32" height="18" rx="4" fill="#BAE6FD" stroke="#5B3A29" strokeWidth="3" />
        </svg>
      )
    case 'plush_shelf':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="12" y="54" width="76" height="12" rx="5" fill="#D9A066" stroke="#5B3A29" strokeWidth="3.5" />
          <circle cx="34" cy="40" r="14" fill="#FBBF24" stroke="#5B3A29" strokeWidth="3" />
          <circle cx="64" cy="40" r="14" fill="#FDA4AF" stroke="#5B3A29" strokeWidth="3" />
        </svg>
      )
    case 'tree_trunk':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="36" y="40" width="28" height="42" rx="6" fill="#A16207" stroke="#5B3A29" strokeWidth="3.8" />
          <circle cx="50" cy="28" r="24" fill="#22C55E" stroke="#166534" strokeWidth="3.8" />
          <circle cx="32" cy="34" r="15" fill="#4ADE80" stroke="#166534" strokeWidth="3.2" />
          <circle cx="68" cy="34" r="15" fill="#4ADE80" stroke="#166E34" strokeWidth="3.2" />
        </svg>
      )
    case 'shed':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M16 38 L50 12 L84 38 L80 78 L20 78 Z" fill="#FDE68A" stroke="#5B3A29" strokeWidth="3.8" strokeLinejoin="round" />
          <rect x="38" y="46" width="24" height="32" rx="4" fill="#D97706" stroke="#5B3A29" strokeWidth="3.2" />
        </svg>
      )
    case 'bush':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <circle cx="32" cy="52" r="20" fill="#22C55E" stroke="#166534" strokeWidth="3.5" />
          <circle cx="68" cy="52" r="20" fill="#22C55E" stroke="#166534" strokeWidth="3.5" />
          <circle cx="50" cy="40" r="24" fill="#4ADE80" stroke="#166534" strokeWidth="3.5" />
          <circle cx="38" cy="48" r="4" fill="#FB7185" />
          <circle cx="62" cy="44" r="4" fill="#FB7185" />
        </svg>
      )
    case 'sunflower':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <line x1="50" y1="30" x2="50" y2="54" stroke="#16A34A" strokeWidth="5" />
          <circle cx="50" cy="24" r="15" fill="#FACC15" stroke="#5B3A29" strokeWidth="3" />
          <circle cx="50" cy="24" r="7" fill="#78350F" />
          <path d="M28 52 L72 52 L66 80 L34 80 Z" fill="#E07A5F" stroke="#5B3A29" strokeWidth="3.5" />
        </svg>
      )
    case 'bench':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="14" y="28" width="72" height="18" rx="5" fill="#D9A066" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="10" y="50" width="80" height="12" rx="4" fill="#E6BE8A" stroke="#5B3A29" strokeWidth="3.5" />
          <rect x="20" y="62" width="10" height="16" fill="#8A5A36" stroke="#5B3A29" strokeWidth="2.8" />
          <rect x="70" y="62" width="10" height="16" fill="#8A5A36" stroke="#5B3A29" strokeWidth="2.8" />
        </svg>
      )
    case 'wheelbarrow':
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <path d="M18 36 L76 36 L66 62 L28 62 Z" fill="#FB7185" stroke="#5B3A29" strokeWidth="3.8" strokeLinejoin="round" />
          <circle cx="72" cy="68" r="10" fill="#475569" stroke="#5B3A29" strokeWidth="3" />
          <line x1="8" y1="36" x2="26" y2="42" stroke="#5B3A29" strokeWidth="4" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 100 90" className={className} aria-hidden="true">
          <rect x="26" y="34" width="44" height="40" rx="8" fill="#38BDF8" stroke="#5B3A29" strokeWidth="3.8" />
          <path d="M26 52 L10 38 L16 32 L26 42" fill="#38BDF8" stroke="#5B3A29" strokeWidth="3.2" />
          <path d="M70 42 C82 42 82 64 70 64" fill="none" stroke="#5B3A29" strokeWidth="4" />
        </svg>
      )
  }
}
