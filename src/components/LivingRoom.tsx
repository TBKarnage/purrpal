import { useCallback, useEffect, useRef, useState } from 'react'
import { getCatMood, getPriorityNeed } from '../state/timeDecay'
import {
  RUG_STYLE_OPTIONS,
  type FoodItem,
  type GameState,
  type RoomMess,
} from '../types/game'
import { CatSprite, type CatAnimationMode } from './CatSprite'
import {
  BroomIcon,
  BrushIcon,
  FoodIcon,
  HeartIcon,
  MessSprite,
  SparklesIcon,
} from './Icons'

export type CleanToolMode = 'none' | 'sweep' | 'brush'

type RoomSpotId =
  | 'rug_center'
  | 'rug_left'
  | 'rug_right'
  | 'plant'
  | 'window_gaze'
  | 'cat_tree'
  | 'window_cushion'

type RoamActivity = 'idle' | 'sniffing' | 'playing' | 'napping' | 'gazing'

interface RoomSpot {
  id: RoomSpotId
  x: number // percentage across room
  bottomPx: number // distance from bottom edge of room
  activity: RoamActivity
  preferredFacing?: 'left' | 'right'
  caption?: string
}

const ROOM_SPOTS: Record<RoomSpotId, RoomSpot> = {
  rug_center: { id: 'rug_center', x: 50, bottomPx: 112, activity: 'idle' },
  rug_left: {
    id: 'rug_left',
    x: 34,
    bottomPx: 120,
    activity: 'idle',
    caption: 'Warm sunbeam!',
  },
  rug_right: { id: 'rug_right', x: 66, bottomPx: 120, activity: 'idle' },
  plant: {
    id: 'plant',
    x: 78,
    bottomPx: 132,
    activity: 'sniffing',
    preferredFacing: 'right',
    caption: 'Sniff sniff!',
  },
  window_gaze: {
    id: 'window_gaze',
    x: 50,
    bottomPx: 146,
    activity: 'gazing',
    caption: 'Pretty clouds!',
  },
  cat_tree: {
    id: 'cat_tree',
    x: 24,
    bottomPx: 140,
    activity: 'playing',
    preferredFacing: 'left',
    caption: 'Boop! Boop!',
  },
  window_cushion: {
    id: 'window_cushion',
    x: 50,
    bottomPx: 162,
    activity: 'napping',
    caption: 'Cozy nap...',
  },
}

interface FloatingParticle {
  id: number
  x: number
  y: number
  kind: 'heart' | 'sparkle' | 'crumb' | 'bubble' | 'reward'
  text?: string
}

interface LivingRoomProps {
  gameState: GameState
  eatingFood: FoodItem['id'] | null
  catnipZoomie?: boolean
  headShakeActive?: boolean
  headShakeKey?: number
  speechBubble?: string | null
  cleanTool: CleanToolMode
  showCleanTray: boolean
  showFeedTray?: boolean
  onPetKitty: () => void
  onCleanMess: (mess: RoomMess) => void
  onBrushKitty: () => void
  onSelectCleanTool: (tool: CleanToolMode) => void
  onCloseCleanTray: () => void
  onDismissTutorial: () => void
}

export function LivingRoom({
  gameState,
  eatingFood,
  catnipZoomie = false,
  headShakeActive = false,
  headShakeKey = 0,
  speechBubble = null,
  cleanTool,
  showCleanTray,
  showFeedTray = false,
  onPetKitty,
  onCleanMess,
  onBrushKitty,
  onSelectCleanTool,
  onCloseCleanTray,
  onDismissTutorial,
}: LivingRoomProps) {
  const { cat, stats, room, tutorialStep = 3 } = gameState
  const mood = getCatMood(stats)
  const priorityNeed = getPriorityNeed(stats)

  const hasCatTree = room.equippedDecor.includes('cat_tree')
  const hasWindowCushion = room.equippedDecor.includes('window_cushion')
  const hasFairyLights = room.equippedDecor.includes('fairy_lights')
  const hasStarryRug = room.equippedDecor.includes('starry_rug')
  const rugPalette =
    RUG_STYLE_OPTIONS.find((r) => r.id === (room.rugStyle ?? 'cream')) ??
    RUG_STYLE_OPTIONS[0]

  const [particles, setParticles] = useState<FloatingParticle[]>([])
  const [pettingActive, setPettingActive] = useState(false)
  const [brushingActive, setBrushingActive] = useState(false)
  const [zoomieActive, setZoomieActive] = useState(false)
  const [catnipSpot, setCatnipSpot] = useState<{ x: number; bottomPx: number } | null>(null)

  // Autonomous room roaming & prop interaction state
  const [spotId, setSpotId] = useState<RoomSpotId>('rug_center')
  const [facing, setFacing] = useState<'left' | 'right'>('right')
  const [isWalking, setIsWalking] = useState(false)
  const [roamActivity, setRoamActivity] = useState<RoamActivity>('idle')
  const [roamCaption, setRoamCaption] = useState<string | null>(null)
  const [isSweepingDrag, setIsSweepingDrag] = useState(false)

  const particleIdRef = useRef(1)
  const lastBrushTickRef = useRef(0)
  const petTimerRef = useRef<number | null>(null)
  const brushTimerRef = useRef<number | null>(null)
  const walkTimerRef = useRef<number | null>(null)
  const captionTimerRef = useRef<number | null>(null)
  const roamAnimTimerRef = useRef<number | null>(null)
  const sweptIdsRef = useRef<Set<string>>(new Set())
  const spotIdRef = useRef<RoomSpotId>('rug_center')
  const roomRef = useRef<HTMLDivElement | null>(null)
  const kittyZoneRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    spotIdRef.current = spotId
  }, [spotId])

  const spawnParticle = useCallback(
    (x: number, y: number, kind: FloatingParticle['kind'], text?: string) => {
      const id = particleIdRef.current++
      setParticles((prev) => [...prev.slice(-18), { id, x, y, kind, text }])
      window.setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== id))
      }, 1150)
    },
    [],
  )

  /**
   * Computes exact percentage coordinates inside `roomRef` anchored directly
   * to the kitty's real DOM bounding box — calibrated identically across desktop
   * monitors, ultrawides, and iPads, and automatically following roaming movement.
   */
  const getKittyAnchorPercent = useCallback((xFrac = 0.5, yFrac = 0.22) => {
    const roomRect = roomRef.current?.getBoundingClientRect()
    const kittyRect = kittyZoneRef.current?.getBoundingClientRect()
    if (
      !roomRect ||
      !kittyRect ||
      roomRect.width === 0 ||
      roomRect.height === 0
    ) {
      return { x: 50, y: 68 }
    }
    const px = kittyRect.left + kittyRect.width * xFrac
    const py = kittyRect.top + kittyRect.height * yFrac
    return {
      x: ((px - roomRect.left) / roomRect.width) * 100,
      y: ((py - roomRect.top) / roomRect.height) * 100,
    }
  }, [])

  const getRelativePercent = useCallback((clientX: number, clientY: number) => {
    const rect = roomRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0 || rect.height === 0) {
      return { x: 50, y: 68 }
    }
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    }
  }, [])

  const moveToSpot = useCallback(
    (nextId: RoomSpotId, announce = true) => {
      const current = ROOM_SPOTS[spotIdRef.current]
      const target = ROOM_SPOTS[nextId]
      if (!target) return

      if (walkTimerRef.current !== null) window.clearTimeout(walkTimerRef.current)
      if (captionTimerRef.current !== null) window.clearTimeout(captionTimerRef.current)
      if (roamAnimTimerRef.current !== null) window.clearTimeout(roamAnimTimerRef.current)

      const dx = target.x - current.x
      if (dx < -1) setFacing('left')
      else if (dx > 1) setFacing('right')
      else if (target.preferredFacing) setFacing(target.preferredFacing)

      spotIdRef.current = nextId
      setSpotId(nextId)
      setRoamActivity('idle')
      setRoamCaption(null)

      const triggerArrivalActivity = () => {
        setRoamActivity(target.activity)
        if (target.activity === 'playing' || target.activity === 'sniffing') {
          roamAnimTimerRef.current = window.setTimeout(() => {
            setRoamActivity('idle')
          }, 2400)
        }
        if (announce && target.caption) {
          setRoamCaption(target.caption)
          captionTimerRef.current = window.setTimeout(() => setRoamCaption(null), 2400)
        }
      }

      const needsWalk = Math.abs(dx) > 1 || Math.abs(target.bottomPx - current.bottomPx) > 4
      if (needsWalk) {
        setIsWalking(true)
        walkTimerRef.current = window.setTimeout(() => {
          setIsWalking(false)
          if (target.preferredFacing) setFacing(target.preferredFacing)
          triggerArrivalActivity()
          if (target.activity === 'playing' || target.activity === 'sniffing') {
            const anchor = getKittyAnchorPercent(0.5, 0.25)
            spawnParticle(anchor.x, anchor.y, 'sparkle')
          }
        }, 1550)
      } else {
        setIsWalking(false)
        triggerArrivalActivity()
      }
    },
    [getKittyAnchorPercent, spawnParticle],
  )

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (petTimerRef.current !== null) window.clearTimeout(petTimerRef.current)
      if (brushTimerRef.current !== null) window.clearTimeout(brushTimerRef.current)
      if (walkTimerRef.current !== null) window.clearTimeout(walkTimerRef.current)
      if (captionTimerRef.current !== null) window.clearTimeout(captionTimerRef.current)
      if (roamAnimTimerRef.current !== null) window.clearTimeout(roamAnimTimerRef.current)
    }
  }, [])

  // Energetic room-wide catnip zoomies: kitty sprints all around the room!
  useEffect(() => {
    if (!catnipZoomie) return

    if (walkTimerRef.current !== null) window.clearTimeout(walkTimerRef.current)

    const waypoints: Array<{ x: number; bottomPx: number }> = [
      { x: 78, bottomPx: 128 },
      { x: 22, bottomPx: 152 },
      { x: 76, bottomPx: 184 },
      { x: 24, bottomPx: 116 },
      { x: 80, bottomPx: 158 },
      { x: 20, bottomPx: 176 },
      { x: 75, bottomPx: 118 },
      { x: 25, bottomPx: 144 },
      { x: 78, bottomPx: 168 },
      { x: 22, bottomPx: 124 },
      { x: 76, bottomPx: 136 },
      { x: 26, bottomPx: 162 },
      { x: 72, bottomPx: 120 },
      { x: 50, bottomPx: 112 },
    ]

    let step = 0
    let prevX = ROOM_SPOTS[spotIdRef.current]?.x ?? 50

    const advanceDash = () => {
      if (step === 0) {
        setIsWalking(false)
        setRoamActivity('idle')
        setRoamCaption(null)
      }
      const next = waypoints[step % waypoints.length]
      setFacing(next.x < prevX ? 'left' : 'right')
      prevX = next.x
      setCatnipSpot(next)

      const anchor = getKittyAnchorPercent(0.5, 0.45)
      spawnParticle(
        anchor.x + (Math.random() * 8 - 4),
        anchor.y + (Math.random() * 6 - 3),
        step % 2 === 0 ? 'sparkle' : 'heart',
      )
      step += 1
    }

    const kickoff = window.setTimeout(advanceDash, 16)
    const timer = window.setInterval(advanceDash, 520)

    return () => {
      window.clearTimeout(kickoff)
      window.clearInterval(timer)
      spotIdRef.current = 'rug_center'
      window.setTimeout(() => {
        setCatnipSpot(null)
        setSpotId('rug_center')
      }, 0)
    }
  }, [catnipZoomie, getKittyAnchorPercent, spawnParticle])

  // Autonomous room roaming & prop interactions
  useEffect(() => {
    if (showFeedTray || showCleanTray || eatingFood || headShakeActive || catnipZoomie) return

    const interval = window.setInterval(() => {
      if (pettingActive || brushingActive || zoomieActive || catnipZoomie) return

      // Sad kitties roam slowly and stay close to the cozy rug
      if (mood === 'sad') {
        if (Math.random() > 0.45) return
        const sadSpots: RoomSpotId[] = ['rug_center', 'rug_left', 'rug_right']
        const candidates = sadSpots.filter((id) => id !== spotIdRef.current)
        const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? 'rug_center'
        moveToSpot(pick, false)
        return
      }

      const pool: RoomSpotId[] = [
        'rug_center',
        'rug_left',
        'rug_right',
        'plant',
        'window_gaze',
      ]
      if (hasCatTree) pool.push('cat_tree', 'cat_tree')
      if (hasWindowCushion) pool.push('window_cushion', 'window_cushion')

      const candidates = pool.filter((id) => id !== spotIdRef.current)
      const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? 'rug_center'
      moveToSpot(pick, true)
    }, 7800)

    return () => window.clearInterval(interval)
  }, [
    showFeedTray,
    showCleanTray,
    eatingFood,
    headShakeActive,
    catnipZoomie,
    pettingActive,
    brushingActive,
    zoomieActive,
    mood,
    hasCatTree,
    hasWindowCushion,
    moveToSpot,
  ])

  // Spawn eating crumbs calibrated right at the kitty's mouth / food bowl
  useEffect(() => {
    if (!eatingFood) return
    const timer = window.setInterval(() => {
      const anchor = getKittyAnchorPercent(
        0.4 + Math.random() * 0.2,
        0.72 + Math.random() * 0.12,
      )
      spawnParticle(anchor.x, anchor.y, 'crumb')
    }, 240)
    return () => window.clearInterval(timer)
  }, [eatingFood, getKittyAnchorPercent, spawnParticle])

  // Periodic playful zoomies for Teen & Adult cats when thriving
  useEffect(() => {
    if (cat.stage !== 'teen' && cat.stage !== 'adult') return
    const interval = window.setInterval(() => {
      if (
        mood === 'thriving' &&
        !eatingFood &&
        !headShakeActive &&
        !showFeedTray &&
        !showCleanTray &&
        cleanTool === 'none'
      ) {
        setZoomieActive(true)
        window.setTimeout(() => setZoomieActive(false), 2300)
      }
    }, 22_000)
    return () => window.clearInterval(interval)
  }, [cat.stage, mood, eatingFood, headShakeActive, showFeedTray, showCleanTray, cleanTool])

  // Periodic floating hearts anchored right above the kitty's actual head
  useEffect(() => {
    if (mood !== 'thriving') return
    const interval = window.setInterval(() => {
      const anchor = getKittyAnchorPercent(
        0.36 + Math.random() * 0.28,
        0.16 + Math.random() * 0.12,
      )
      spawnParticle(anchor.x, anchor.y, 'heart')
    }, 5500)
    return () => window.clearInterval(interval)
  }, [mood, getKittyAnchorPercent, spawnParticle])

  const triggerKittyAnimation = (kind: 'petting' | 'brushing') => {
    setRoamActivity('idle')
    setRoamCaption(null)
    if (kind === 'petting') {
      if (petTimerRef.current !== null) window.clearTimeout(petTimerRef.current)
      setPettingActive(true)
      petTimerRef.current = window.setTimeout(() => setPettingActive(false), 750)
    } else {
      if (brushTimerRef.current !== null) window.clearTimeout(brushTimerRef.current)
      setBrushingActive(true)
      brushTimerRef.current = window.setTimeout(() => setBrushingActive(false), 850)
    }
  }

  const handleKittyPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const pos = getRelativePercent(e.clientX, e.clientY)
    if (cleanTool === 'brush') {
      triggerKittyAnimation('brushing')
      spawnParticle(pos.x, pos.y, 'sparkle')
      spawnParticle(
        pos.x + 4,
        pos.y - 3,
        'reward',
        stats.cleanliness >= 100 ? 'All shiny!' : '+Clean!',
      )
      onBrushKitty()
      lastBrushTickRef.current = Date.now()
    } else {
      triggerKittyAnimation('petting')
      spawnParticle(pos.x, pos.y, 'heart')
      spawnParticle(pos.x - 3, pos.y - 4, 'heart')
      onPetKitty()
    }
  }

  const handleKittyPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cleanTool !== 'brush' || e.buttons === 0) return
    const now = Date.now()
    if (now - lastBrushTickRef.current < 450) return
    lastBrushTickRef.current = now
    const pos = getRelativePercent(e.clientX, e.clientY)
    triggerKittyAnimation('brushing')
    spawnParticle(pos.x, pos.y, 'sparkle')
    onBrushKitty()
  }

  const sweepMess = useCallback(
    (mess: RoomMess) => {
      if (sweptIdsRef.current.has(mess.id)) return
      sweptIdsRef.current.add(mess.id)
      window.setTimeout(() => sweptIdsRef.current.delete(mess.id), 600)
      spawnParticle(mess.x, mess.y - 3, 'bubble')
      spawnParticle(mess.x + 3, mess.y - 6, 'sparkle')
      spawnParticle(mess.x, mess.y - 8, 'reward', '+5 Coins')
      onCleanMess(mess)
    },
    [onCleanMess, spawnParticle],
  )

  const checkSwipeSweepAt = useCallback(
    (clientX: number, clientY: number) => {
      if (cleanTool !== 'sweep' || room.messes.length === 0) return
      const pos = getRelativePercent(clientX, clientY)
      for (const mess of room.messes) {
        const dx = pos.x - mess.x
        const dy = pos.y - mess.y
        if (dx * dx + dy * dy <= 36) {
          sweepMess(mess)
        }
      }
    },
    [cleanTool, room.messes, getRelativePercent, sweepMess],
  )

  // Resolve spot safely if decor was unequipped
  const resolvedSpotId: RoomSpotId =
    (spotId === 'cat_tree' && !hasCatTree) ||
    (spotId === 'window_cushion' && !hasWindowCushion)
      ? 'rug_center'
      : spotId
  const activeSpot = ROOM_SPOTS[resolvedSpotId]

  // Lift & center kitty smoothly whenever Feed or Clean panel is open so nothing ever overlaps!
  const drawerActive = showFeedTray || showCleanTray
  const activeCatnipSpot = catnipZoomie ? catnipSpot : null
  const effectiveX = drawerActive ? 50 : activeCatnipSpot ? activeCatnipSpot.x : activeSpot.x
  const effectiveBottomPx = showFeedTray
    ? 282
    : showCleanTray
      ? cleanTool === 'sweep'
        ? 172
        : 152
      : activeCatnipSpot
        ? activeCatnipSpot.bottomPx
        : activeSpot.bottomPx

  const activeAnim: CatAnimationMode = headShakeActive
    ? 'headShake'
    : eatingFood
      ? 'eating'
      : catnipZoomie
        ? 'catnip'
        : zoomieActive
          ? 'zoomie'
          : brushingActive
            ? 'brushing'
            : pettingActive
              ? 'petting'
              : isWalking && !drawerActive
                ? 'walking'
                : !drawerActive && roamActivity === 'napping'
                  ? 'napping'
                  : !drawerActive && (roamActivity === 'playing' || roamActivity === 'sniffing')
                    ? 'playing'
                    : 'idle'

  const effectiveSpeech = speechBubble ?? (!drawerActive && !isWalking ? roamCaption : null)
  const plantRustling = !drawerActive && !isWalking && resolvedSpotId === 'plant'
  const catTreePlaying = !drawerActive && !isWalking && resolvedSpotId === 'cat_tree'

  const tutorialMessages: Record<number, { title: string; icon: 'feed' | 'pet' | 'play' }> = {
    0: { title: 'Tap Feed below!', icon: 'feed' },
    1: { title: `Tap ${cat.name} to Pet!`, icon: 'pet' },
    2: { title: 'Tap Play for Games!', icon: 'play' },
  }
  const activeTutorial =
    !showCleanTray && tutorialStep < 3 ? tutorialMessages[tutorialStep] : null

  return (
    <section
      id="living-room"
      ref={roomRef}
      onPointerDown={(e) => {
        if (cleanTool === 'sweep') {
          setIsSweepingDrag(true)
          checkSwipeSweepAt(e.clientX, e.clientY)
        }
      }}
      onPointerMove={(e) => {
        if (cleanTool === 'sweep' && (isSweepingDrag || e.buttons > 0)) {
          checkSwipeSweepAt(e.clientX, e.clientY)
        }
      }}
      onPointerUp={() => setIsSweepingDrag(false)}
      onPointerCancel={() => setIsSweepingDrag(false)}
      className={`relative flex-1 w-full overflow-hidden flex flex-col justify-end ${
        cleanTool === 'sweep' ? 'touch-none cursor-crosshair' : ''
      }`}
    >
      {/* Cozy Illustrated Living Room SVG Backdrop */}
      <svg
        viewBox="0 0 1000 640"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF9EC" />
            <stop offset="100%" stopColor="#FBEBD0" />
          </linearGradient>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#A5E3FF" />
            <stop offset="100%" stopColor="#E0F7FF" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E6BE8A" />
            <stop offset="100%" stopColor="#D4A36A" />
          </linearGradient>
          <linearGradient id="sunbeamGrad" x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0%" stopColor="#FFFDF2" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#FFFDF2" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Cream Wall */}
        <rect x="0" y="0" width="1000" height="410" fill="url(#wallGrad)" />

        {/* Subtle warm wainscoting panels */}
        <rect x="0" y="295" width="1000" height="115" fill="#F8E2C2" />
        <line x1="0" y1="295" x2="1000" y2="295" stroke="#E4C49B" strokeWidth="6" />
        <line x1="0" y1="406" x2="1000" y2="406" stroke="#C89B67" strokeWidth="8" />

        {/* Sunlit Arched Window */}
        <g transform="translate(360, 42)">
          <path
            d="M 20 235 L 20 110 A 120 110 0 0 1 260 110 L 260 235 Z"
            fill="url(#skyGrad)"
            stroke="#C78F57"
            strokeWidth="12"
            strokeLinejoin="round"
          />
          {/* Drifting clouds */}
          <g className="animate-cloud-drift" opacity="0.92">
            <ellipse cx="98" cy="115" rx="34" ry="18" fill="#FFFFFF" />
            <ellipse cx="122" cy="108" rx="26" ry="16" fill="#FFFFFF" />
            <ellipse cx="186" cy="158" rx="30" ry="15" fill="#FFFFFF" />
            <ellipse cx="208" cy="152" rx="22" ry="13" fill="#FFFFFF" />
          </g>
          {/* Warm Sun */}
          <circle cx="212" cy="82" r="24" fill="#FDE047" />
          {/* Window panes */}
          <line x1="140" y1="2" x2="140" y2="235" stroke="#C78F57" strokeWidth="8" />
          <line x1="20" y1="138" x2="260" y2="138" stroke="#C78F57" strokeWidth="8" />
          {/* Window sill */}
          <rect x="4" y="232" width="272" height="22" rx="10" fill="#D49A60" stroke="#9E6A3A" strokeWidth="4" />

          {/* Unlockable Decor: Cozy Window Cushion (Lv 8) */}
          {hasWindowCushion && (
            <g data-decor="window_cushion">
              <rect
                x="44"
                y="206"
                width="192"
                height="32"
                rx="16"
                fill="#FDA4AF"
                stroke="#5B3A29"
                strokeWidth="4.5"
              />
              <path
                d="M 64 218 Q 140 230 216 218"
                fill="none"
                stroke="#FFE4E6"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              <circle cx="58" cy="222" r="5" fill="#FDE047" />
              <circle cx="222" cy="222" r="5" fill="#FDE047" />
            </g>
          )}
        </g>

        {/* Unlockable Decor: Warm Fairy Lights (Lv 8) */}
        {hasFairyLights && (
          <g data-decor="fairy_lights" className="animate-twinkle-soft">
            <path
              d="M 290 74 Q 500 132 710 74"
              fill="none"
              stroke="#7D563E"
              strokeWidth="4"
              strokeLinecap="round"
            />
            {[
              [345, 92, '#FDE047'],
              [412, 106, '#FDA4AF'],
              [480, 112, '#7DD3FC'],
              [548, 110, '#FDE047'],
              [616, 102, '#A7F3D0'],
              [672, 86, '#FBCFE8'],
            ].map(([lx, ly, col], idx) => (
              <g key={idx}>
                <circle cx={Number(lx)} cy={Number(ly)} r="15" fill={String(col)} opacity="0.28" />
                <circle cx={Number(lx)} cy={Number(ly)} r="7.5" fill={String(col)} stroke="#5B3A29" strokeWidth="2.4" />
              </g>
            ))}
          </g>
        )}

        {/* Soft Sunbeams onto the floor */}
        <polygon points="380,295 620,295 750,640 240,640" fill="url(#sunbeamGrad)" />

        {/* Cozy Framed Picture on right wall */}
        <g transform="translate(760, 108)">
          <rect x="0" y="0" width="110" height="86" rx="14" fill="#FFFDF8" stroke="#C78F57" strokeWidth="7" />
          <circle cx="55" cy="46" r="18" fill="#FECDD3" />
          <circle cx="42" cy="34" r="7" fill="#FB7185" />
          <circle cx="55" cy="28" r="7" fill="#FB7185" />
          <circle cx="68" cy="34" r="7" fill="#FB7185" />
        </g>

        {/* Cozy Potted Plant on far right (rustles when kitty sniffs it!) */}
        <g transform="translate(835, 290)">
          <g
            className={plantRustling ? 'animate-plant-wiggle' : undefined}
            style={{ transformOrigin: '45px 76px' }}
          >
            <path d="M 38 78 C 12 45 14 14 38 4 C 48 28 46 56 44 78 Z" fill="#52B788" stroke="#366E54" strokeWidth="4" />
            <path d="M 46 78 C 68 42 78 24 94 28 C 82 52 64 68 54 78 Z" fill="#74C69D" stroke="#366E54" strokeWidth="4" />
            <path d="M 40 76 C 18 68 2 48 8 36 C 24 44 36 60 42 76 Z" fill="#40916C" stroke="#366E54" strokeWidth="4" />
          </g>
          <path d="M 18 76 L 76 76 L 68 134 C 66 140 28 140 26 134 Z" fill="#E07A5F" stroke="#5B3A29" strokeWidth="4.5" strokeLinejoin="round" />
          <rect x="12" y="68" width="70" height="16" rx="6" fill="#F29E86" stroke="#5B3A29" strokeWidth="4.5" />
        </g>

        {/* Warm Oak Floorboards */}
        <rect x="0" y="408" width="1000" height="232" fill="url(#floorGrad)" />
        <g stroke="#C69156" strokeWidth="2.5" opacity="0.55">
          <line x1="0" y1="454" x2="1000" y2="454" />
          <line x1="0" y1="506" x2="1000" y2="506" />
          <line x1="0" y1="564" x2="1000" y2="564" />
          <line x1="180" y1="408" x2="150" y2="454" />
          <line x1="690" y1="408" x2="720" y2="454" />
          <line x1="360" y1="454" x2="340" y2="506" />
          <line x1="820" y1="506" x2="860" y2="564" />
        </g>

        {/* Unlockable Decor: Cozy Cat Tree (Lv 8) — hanging toy swings when kitty bats it! */}
        {hasCatTree && (
          <g transform="translate(88, 178)" data-decor="cat_tree">
            <rect x="16" y="246" width="166" height="24" rx="11" fill="#E6C39A" stroke="#5B3A29" strokeWidth="5" />
            <rect x="44" y="138" width="28" height="112" fill="#D9A773" stroke="#5B3A29" strokeWidth="5" />
            <rect x="124" y="72" width="28" height="178" fill="#D9A773" stroke="#5B3A29" strokeWidth="5" />
            <g stroke="#B68049" strokeWidth="3">
              <line x1="46" y1="164" x2="70" y2="164" />
              <line x1="46" y1="188" x2="70" y2="188" />
              <line x1="46" y1="212" x2="70" y2="212" />
              <line x1="126" y1="106" x2="150" y2="106" />
              <line x1="126" y1="132" x2="150" y2="132" />
              <line x1="126" y1="158" x2="150" y2="158" />
              <line x1="126" y1="184" x2="150" y2="184" />
            </g>
            <rect x="10" y="122" width="102" height="24" rx="12" fill="#FFF3D6" stroke="#5B3A29" strokeWidth="5" />
            <rect x="82" y="52" width="114" height="26" rx="13" fill="#FFF3D6" stroke="#5B3A29" strokeWidth="5" />
            <g
              className={catTreePlaying ? 'animate-toy-swing' : undefined}
              style={{ transformOrigin: '176px 78px' }}
            >
              <line x1="176" y1="78" x2="176" y2="118" stroke="#5B3A29" strokeWidth="3" />
              <circle cx="176" cy="124" r="11" fill="#FB7185" stroke="#5B3A29" strokeWidth="3.5" />
            </g>
          </g>
        )}

        {/* Center Cozy Rug (Free Cream/Mint/Peach starter rugs OR Starry Rug at Lv 13!) */}
        {hasStarryRug ? (
          <g data-decor="starry_rug">
            <ellipse cx="500" cy="522" rx="255" ry="76" fill="#6366F1" stroke="#4338CA" strokeWidth="7" />
            <ellipse cx="500" cy="522" rx="224" ry="60" fill="#818CF8" stroke="#C7D2FE" strokeWidth="4" strokeDasharray="12 10" />
            <circle cx="348" cy="512" r="6" fill="#FEF08A" />
            <circle cx="406" cy="548" r="5" fill="#FDE047" />
            <circle cx="640" cy="514" r="6" fill="#FEF08A" />
            <circle cx="598" cy="552" r="5" fill="#FDE047" />
            <circle cx="496" cy="482" r="5" fill="#FEF08A" />
          </g>
        ) : (
          <g data-rug-style={rugPalette.id}>
            <ellipse cx="500" cy="522" rx="242" ry="70" fill={rugPalette.outer} stroke={rugPalette.stroke} strokeWidth="7" />
            <ellipse cx="500" cy="522" rx="208" ry="54" fill={rugPalette.inner} stroke={rugPalette.stroke} strokeWidth="4" strokeDasharray="10 8" />
          </g>
        )}
      </svg>

      {/* Interactive Room Prop Hotspots (tap to call your kitty over!) */}
      {!drawerActive && (
        <>
          <button
            id="prop-plant"
            type="button"
            aria-label="Send kitty to sniff the plant"
            onClick={() => moveToSpot('plant', true)}
            className="absolute right-[4%] top-[44%] z-[8] w-24 h-28 rounded-full cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#34D399]/60"
          />
          {hasCatTree && (
            <button
              id="prop-cat-tree"
              type="button"
              aria-label="Send kitty to play at the cat tree"
              onClick={() => moveToSpot('cat_tree', true)}
              className="absolute left-[6%] top-[34%] z-[8] w-36 h-44 rounded-3xl cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FBBF24]/60"
            />
          )}
          {hasWindowCushion && (
            <button
              id="prop-window-cushion"
              type="button"
              aria-label="Send kitty to nap near the window cushion"
              onClick={() => moveToSpot('window_cushion', true)}
              className="absolute left-1/2 -translate-x-1/2 top-[34%] z-[8] w-44 h-20 rounded-full cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FDA4AF]/60"
            />
          )}
        </>
      )}

      {/* Non-blocking 3-Step Visual Tutorial Pill */}
      {activeTutorial && (
        <div
          id="tutorial-pill"
          className="absolute top-[134px] md:top-[84px] left-1/2 -translate-x-1/2 z-20 max-w-[calc(100%-1.5rem)] flex items-center gap-2 rounded-full bg-[#FFFDF8]/95 border-[3px] border-[#FB7185] shadow-lg px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap"
        >
          <span className="w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-[#FB7185] text-white text-xs sm:text-sm font-black flex items-center justify-center">
            {tutorialStep + 1}
          </span>
          <span className="text-sm sm:text-base font-extrabold text-[#5B3A29]">
            {activeTutorial.title}
          </span>
          <button
            id="btn-skip-tutorial"
            type="button"
            onClick={onDismissTutorial}
            className="ml-0.5 shrink-0 text-xs font-extrabold text-[#9A745E] px-2.5 py-0.5 rounded-full bg-[#F5E6D3]"
          >
            Got it
          </button>
        </div>
      )}

      {/* Reworked Top Clean Toolbar — sits cleanly below Status HUD so it NEVER blocks floor messes! */}
      {showCleanTray && (
        <div
          id="clean-drawer"
          className="absolute top-[132px] md:top-[84px] left-1/2 -translate-x-1/2 z-30 w-full max-w-md px-2.5 sm:px-5 flex flex-col items-center gap-1.5"
        >
          <div className="w-full rounded-[1.5rem] bg-[#FFFDF8]/96 border-[3px] border-[#38BDF8] shadow-[0_10px_24px_rgba(91,58,41,0.16)] p-2 flex items-center gap-2">
            <button
              id="btn-clean-sweep"
              type="button"
              onClick={() =>
                onSelectCleanTool(cleanTool === 'sweep' ? 'none' : 'sweep')
              }
              className={`cozy-btn flex-1 min-h-[54px] rounded-2xl border-[3px] flex items-center justify-center gap-2 font-black text-sm sm:text-base ${
                cleanTool === 'sweep'
                  ? 'bg-[#BAE6FD] border-[#0284C7] text-[#0C4A6E]'
                  : 'bg-[#F0F9FF] border-[#7DD3FC] text-[#075985]'
              }`}
            >
              <BroomIcon className="w-7 h-7" />
              <span>Sweep ({room.messes.length})</span>
            </button>

            <button
              id="btn-clean-brush"
              type="button"
              onClick={() =>
                onSelectCleanTool(cleanTool === 'brush' ? 'none' : 'brush')
              }
              className={`cozy-btn flex-1 min-h-[54px] rounded-2xl border-[3px] flex items-center justify-center gap-2 font-black text-sm sm:text-base ${
                cleanTool === 'brush'
                  ? 'bg-[#FBCFE8] border-[#DB2777] text-[#831843]'
                  : 'bg-[#FDF2F8] border-[#F9A8D4] text-[#9D174D]'
              }`}
            >
              <BrushIcon className="w-7 h-7" />
              <span>Brush</span>
            </button>

            <button
              id="btn-close-clean"
              type="button"
              onClick={onCloseCleanTray}
              className="cozy-btn min-h-[54px] px-3.5 rounded-2xl bg-[#FFF4E0] border-[3px] border-[#E7C9A4] text-sm font-black text-[#5B3A29]"
            >
              Done
            </button>
          </div>

          {cleanTool !== 'none' && (
            <div
              id="clean-mode-banner"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#E0F2FE]/95 border-2 border-[#38BDF8] shadow-sm px-3.5 py-1 text-xs sm:text-sm font-extrabold text-[#075985]"
            >
              {cleanTool === 'brush'
                ? `Rub or tap ${cat.name} to brush!`
                : room.messes.length > 0
                  ? 'Tap or swipe across dirty spots to sweep!'
                  : 'Sparkling clean!'}
            </div>
          )}
        </div>
      )}

      {/* Tappable & Swipeable Floor Messes (always clear above bottom dock & ABOVE kitty in sweep mode!) */}
      {room.messes.map((mess) => (
        <button
          key={mess.id}
          id={`mess-${mess.id}`}
          type="button"
          data-mess-item="true"
          onClick={(e) => {
            e.stopPropagation()
            sweepMess(mess)
          }}
          onPointerEnter={(e) => {
            if (cleanTool === 'sweep' && (isSweepingDrag || e.buttons > 0)) {
              sweepMess(mess)
            }
          }}
          aria-label={`Clean ${mess.type}`}
          style={{ left: `${mess.x}%`, top: `${mess.y}%` }}
          className={`cozy-btn absolute -translate-x-1/2 -translate-y-1/2 w-[72px] h-[72px] rounded-full flex items-center justify-center ${
            cleanTool === 'sweep'
              ? 'z-25 bg-[#E0F2FE]/85 ring-4 ring-[#38BDF8] animate-glow-ring'
              : 'z-20 bg-transparent hover:bg-[#FFFDF8]/45'
          }`}
        >
          <MessSprite type={mess.type} className="w-14 h-14 drop-shadow" />
        </button>
      ))}

      {/* Main Interactive Roaming Kitty Stage */}
      <div
        data-kitty-spot={resolvedSpotId}
        style={{
          left: `${effectiveX}%`,
          bottom: `${effectiveBottomPx}px`,
        }}
        className={`absolute -translate-x-1/2 transition-[left,bottom] ease-in-out ${
          catnipZoomie ? 'duration-[470ms]' : drawerActive ? 'duration-300' : 'duration-[1500ms]'
        } ${cleanTool === 'sweep' ? 'z-10 pointer-events-none' : 'z-15'}`}
      >
        <div
          id="kitty-drop-zone"
          ref={kittyZoneRef}
          role="button"
          tabIndex={cleanTool === 'sweep' ? -1 : 0}
          aria-label={cleanTool === 'brush' ? `Brush ${cat.name}` : `Pet ${cat.name}`}
          onPointerDown={handleKittyPointerDown}
          onPointerMove={handleKittyPointerMove}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              const anchor = getKittyAnchorPercent(0.5, 0.25)
              if (cleanTool === 'brush') {
                triggerKittyAnimation('brushing')
                spawnParticle(anchor.x, anchor.y, 'sparkle')
                onBrushKitty()
              } else {
                triggerKittyAnimation('petting')
                spawnParticle(anchor.x, anchor.y, 'heart')
                onPetKitty()
              }
            }
          }}
          className={`relative cursor-pointer touch-none flex items-center justify-center rounded-full p-2 ${
            cleanTool === 'brush' ? 'ring-4 ring-[#7DD3FC]/80 bg-[#E0F2FE]/25' : ''
          } ${tutorialStep === 1 ? 'ring-4 ring-[#FB7185]/70 animate-glow-ring' : ''}`}
        >
          {effectiveSpeech && (
            <div
              id="kitty-speech-bubble"
              className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 z-30 whitespace-nowrap rounded-full bg-[#FFFDF8] border-[3px] border-[#F59E0B] shadow-lg px-4 py-1.5 text-base font-black text-[#92400E]"
            >
              {effectiveSpeech}
            </div>
          )}

          <CatSprite
            coat={cat.coat}
            stage={cat.stage}
            mood={mood}
            animation={activeAnim}
            facing={facing}
            headShakeKey={headShakeKey}
            equippedAccessory={cat.equippedAccessory}
            style={cat.style}
            priorityNeed={priorityNeed}
            className="w-44 h-44 sm:w-64 sm:h-64 md:w-72 md:h-72"
          />

          {/* Food Bowl Appears During 1.5s Eating Animation */}
          {eatingFood && (
            <div
              id="eating-food-bowl"
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20 animate-gentle-pulse pointer-events-none"
            >
              <FoodIcon foodId={eatingFood} className="w-16 h-16 drop-shadow-md" />
            </div>
          )}
        </div>
      </div>

      {/* Floating Hearts / Sparkles / Crumbs / Reward Particles */}
      <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden">
        {particles.map((pt) => (
          <div
            key={pt.id}
            data-particle-kind={pt.kind}
            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-float-up"
          >
            {pt.kind === 'heart' && <HeartIcon className="w-8 h-8" />}
            {pt.kind === 'sparkle' && <SparklesIcon className="w-8 h-8" />}
            {pt.kind === 'bubble' && (
              <div className="w-9 h-9 rounded-full bg-[#BAE6FD]/80 border-[2.5px] border-[#38BDF8] shadow-inner" />
            )}
            {pt.kind === 'crumb' && (
              <div className="w-3.5 h-3.5 rounded-full bg-[#D97706] border border-[#5B3A29]" />
            )}
            {pt.kind === 'reward' && (
              <span className="px-2.5 py-1 rounded-full bg-[#FFFDF8] border-2 border-[#F59E0B] text-xs font-black text-[#92400E] shadow">
                {pt.text}
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
