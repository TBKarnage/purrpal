import { useCallback, useEffect, useRef, useState } from 'react'
import { CatSprite } from '../components/CatSprite'
import { FoodIcon, PlayYarnIcon, SparklesIcon, StarIcon } from '../components/Icons'
import type {
  CatStyleConfig,
  CoatStyle,
  GrowthStage,
  MiniGameDifficulty,
} from '../types/game'
import { MiniGameResultCard } from './MiniGameResultCard'
import { MiniGameSetupModal, type PlayAreaOption } from './MiniGameSetupModal'

interface SkyHopProps {
  catName: string
  coat: CoatStyle
  stage: GrowthStage
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  beatenDifficulties: readonly MiniGameDifficulty[]
  onCatchSound?: () => void
  onPopSound?: (comboIndex: number) => void
  onButtonSound?: () => void
  onFinish: (score: number, difficulty: MiniGameDifficulty) => void
  onExit: () => void
}

interface Platform {
  id: number
  x: number // 14..86 %
  y: number // world units (upward)
  width: number // % width
  kind: 'normal' | 'bouncy' | 'moving' | 'breakable'
  vx: number
  broken?: boolean
}

interface SkyItem {
  id: number
  x: number
  y: number
  kind: 'star' | 'treat' | 'yarn' | 'rocket'
  collected: boolean
}

const SKY_AREAS: PlayAreaOption[] = [
  {
    id: 'clouds',
    name: 'Fluffy Clouds',
    tagline: 'Sunny sky & pillowy clouds',
    accent: '#38BDF8',
    skyTop: '#BAE6FD',
    skyBottom: '#F0F9FF',
    groundColor: '#E0F2FE',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <circle cx="48" cy="18" r="9" fill="#FDE047" />
        <ellipse cx="30" cy="40" rx="18" ry="10" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="2.5" />
        <circle cx="22" cy="35" r="8" fill="#FFFFFF" />
        <circle cx="35" cy="34" r="9" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    id: 'treehouse',
    name: 'Treehouse Canopy',
    tagline: 'Leafy branches & sunlit breeze',
    accent: '#10B981',
    skyTop: '#A7F3D0',
    skyBottom: '#ECFDF5',
    groundColor: '#BBF7D0',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <rect x="27" y="34" width="10" height="20" rx="3" fill="#B97B48" stroke="#5B3A29" strokeWidth="2.2" />
        <circle cx="32" cy="26" r="15" fill="#34D399" stroke="#166534" strokeWidth="2.5" />
        <circle cx="22" cy="31" r="9" fill="#4ADE80" stroke="#166534" strokeWidth="2.2" />
        <circle cx="42" cy="31" r="9" fill="#4ADE80" stroke="#166534" strokeWidth="2.2" />
      </svg>
    ),
  },
  {
    id: 'starry',
    name: 'Starry Night',
    tagline: 'Glowing moon & twinkling stars',
    accent: '#8B5CF6',
    skyTop: '#312E81',
    skyBottom: '#4C1D95',
    groundColor: '#6D28D9',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <circle cx="36" cy="26" r="12" fill="#FDE68A" />
        <circle cx="41" cy="23" r="10" fill="#4C1D95" />
        <circle cx="18" cy="20" r="2.5" fill="#FEF08A" />
        <circle cx="22" cy="44" r="2" fill="#FEF08A" />
        <circle cx="48" cy="42" r="2.5" fill="#FEF08A" />
      </svg>
    ),
  },
  {
    id: 'rainbow',
    name: 'Rainbow Meadow',
    tagline: 'Pastel arches & bouncy puffs',
    accent: '#F472B6',
    skyTop: '#FDE68A',
    skyBottom: '#FCE7F3',
    groundColor: '#FBCFE8',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <path d="M12 44 A20 20 0 0 1 52 44" fill="none" stroke="#FB7185" strokeWidth="5" strokeLinecap="round" />
        <path d="M18 44 A14 14 0 0 1 46 44" fill="none" stroke="#FBBF24" strokeWidth="5" strokeLinecap="round" />
        <path d="M24 44 A8 8 0 0 1 40 44" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" />
      </svg>
    ),
  },
]

const SKY_DIFFICULTIES: Array<{
  id: MiniGameDifficulty
  label: string
  hint: string
  accent: string
  badgeBg: string
  reqText: string
  platformWidth: number
  gapMin: number
  gapMax: number
  movingChance: number
}> = [
  {
    id: 'easy',
    label: 'Easy',
    hint: 'Wide clouds',
    accent: '#10B981',
    badgeBg: '#D1FAE5',
    reqText: 'Unlocked!',
    platformWidth: 24,
    gapMin: 11,
    gapMax: 15,
    movingChance: 0.12,
  },
  {
    id: 'medium',
    label: 'Medium',
    hint: 'Moving clouds',
    accent: '#F59E0B',
    badgeBg: '#FEF3C7',
    reqText: 'Beat Easy first!',
    platformWidth: 20,
    gapMin: 13,
    gapMax: 17,
    movingChance: 0.28,
  },
  {
    id: 'hard',
    label: 'Hard',
    hint: 'High sky pro',
    accent: '#8B5CF6',
    badgeBg: '#EDE9FE',
    reqText: 'Beat Medium first!',
    platformWidth: 16,
    gapMin: 15,
    gapMax: 20,
    movingChance: 0.44,
  },
]

export function SkyHop({
  catName,
  coat,
  stage,
  equippedAccessory,
  catStyle,
  beatenDifficulties,
  onCatchSound,
  onPopSound,
  onButtonSound,
  onFinish,
  onExit,
}: SkyHopProps) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'soft_landing' | 'finished'>('setup')
  const [selectedDiff, setSelectedDiff] = useState<MiniGameDifficulty>('easy')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('clouds')

  const [catX, setCatX] = useState(50)
  const [catY, setCatY] = useState(14)
  const [catFacing, setCatFacing] = useState<'left' | 'right'>('right')
  const [cameraY, setCameraY] = useState(0)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [items, setItems] = useState<SkyItem[]>([])
  const [score, setScore] = useState(0)
  const [bouncing, setBouncing] = useState(false)
  const [hasRocket, setHasRocket] = useState(false)

  const stateRef = useRef({
    x: 50,
    y: 14,
    vx: 0,
    vy: 96,
    cameraY: 0,
    maxY: 14,
    bonus: 0,
    score: 0,
    topGeneratedY: 100,
    nextId: 100,
    rocketTimeLeft: 0,
    platforms: [] as Platform[],
    items: [] as SkyItem[],
    moveDir: 0 as -1 | 0 | 1,
    targetX: null as number | null,
    finished: false,
  })
  const stageRef = useRef<HTMLDivElement | null>(null)
  const landingTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (landingTimerRef.current !== null) window.clearTimeout(landingTimerRef.current)
    }
  }, [])

  const startRound = useCallback(
    (areaId: string, diff: MiniGameDifficulty) => {
      if (landingTimerRef.current !== null) window.clearTimeout(landingTimerRef.current)
      onButtonSound?.()
      const diffMeta = SKY_DIFFICULTIES.find((d) => d.id === diff) ?? SKY_DIFFICULTIES[0]

      const initialPlatforms: Platform[] = [
        { id: 1, x: 50, y: 8, width: 40, kind: 'normal', vx: 0 },
      ]
      const initialItems: SkyItem[] = []
      let yCursor = 22
      let pid = 2
      while (yCursor < 125) {
        const roll = Math.random()
        const kind: Platform['kind'] =
          roll < 0.16
            ? 'bouncy'
            : roll < 0.16 + diffMeta.movingChance
              ? 'moving'
              : roll < 0.32 + diffMeta.movingChance
                ? 'breakable'
                : 'normal'
        const px = 16 + Math.random() * 68
        initialPlatforms.push({
          id: pid++,
          x: px,
          y: yCursor,
          width: diffMeta.platformWidth,
          kind,
          vx: kind === 'moving' ? (Math.random() < 0.5 ? 16 : -16) : 0,
        })
        if (kind === 'breakable') {
          // Ensure a safe solid platform nearby so player is never trapped
          const safeX = px < 50 ? Math.min(82, px + 34) : Math.max(18, px - 34)
          initialPlatforms.push({
            id: pid++,
            x: safeX,
            y: yCursor + 2,
            width: diffMeta.platformWidth,
            kind: 'normal',
            vx: 0,
          })
        } else if (Math.random() < 0.45) {
          const itemRoll = Math.random()
          initialItems.push({
            id: pid++,
            x: px,
            y: yCursor + 7,
            kind:
              itemRoll < 0.11
                ? 'rocket'
                : itemRoll < 0.3
                  ? 'yarn'
                  : itemRoll < 0.6
                    ? 'treat'
                    : 'star',
            collected: false,
          })
        }
        yCursor +=
          diffMeta.gapMin + Math.random() * (diffMeta.gapMax - diffMeta.gapMin)
      }

      stateRef.current = {
        x: 50,
        y: 14,
        vx: 0,
        vy: 96,
        cameraY: 0,
        maxY: 14,
        bonus: 0,
        score: 0,
        topGeneratedY: yCursor,
        nextId: pid + 10,
        rocketTimeLeft: 0,
        platforms: initialPlatforms,
        items: initialItems,
        moveDir: 0,
        targetX: null,
        finished: false,
      }

      setSelectedAreaId(areaId)
      setSelectedDiff(diff)
      setCatX(50)
      setCatY(14)
      setCameraY(0)
      setPlatforms(initialPlatforms)
      setItems(initialItems)
      setScore(0)
      setBouncing(false)
      setHasRocket(false)
      setPhase('playing')
    },
    [onButtonSound],
  )

  // Keyboard arrow / A-D controls
  useEffect(() => {
    if (phase !== 'playing') return
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current.moveDir = -1
        stateRef.current.targetX = null
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current.moveDir = 1
        stateRef.current.targetX = null
      }
    }
    const up = (e: KeyboardEvent) => {
      if (
        e.key === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'A' ||
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'D'
      ) {
        stateRef.current.moveDir = 0
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [phase])

  // Main physics loop
  useEffect(() => {
    if (phase !== 'playing') return
    const diffMeta = SKY_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? SKY_DIFFICULTIES[0]
    const stepMs = 30
    const dt = stepMs / 1000
    const gravity = -185

    const timer = window.setInterval(() => {
      const s = stateRef.current
      if (s.finished) return

      // Horizontal movement: glued directly to finger/pointer drag when touching, or smooth arrow/button velocity
      if (s.targetX !== null) {
        const dx = s.targetX - s.x
        if (dx < -0.5) setCatFacing('left')
        else if (dx > 0.5) setCatFacing('right')
        s.x = s.targetX
        s.vx = 0
      } else {
        s.vx = s.moveDir * 58
        if (s.vx < -3) setCatFacing('left')
        else if (s.vx > 3) setCatFacing('right')
        s.x += s.vx * dt
      }

      // Wrap gently around edges like classic Doodle Jump
      if (s.x < 6) s.x = 94
      else if (s.x > 94) s.x = 6

      const prevY = s.y
      if (s.rocketTimeLeft > 0) {
        s.rocketTimeLeft = Math.max(0, s.rocketTimeLeft - dt)
        s.vy = 148
        if (s.rocketTimeLeft <= 0) {
          setHasRocket(false)
        }
      } else {
        s.vy += gravity * dt
      }
      s.y += s.vy * dt

      // Move moving platforms & drop broken platforms
      s.platforms.forEach((p) => {
        if (p.broken) {
          p.y -= 55 * dt
        } else if (p.kind === 'moving') {
          p.x += p.vx * dt
          if (p.x < 16) {
            p.x = 16
            p.vx = Math.abs(p.vx)
          } else if (p.x > 84) {
            p.x = 84
            p.vx = -Math.abs(p.vx)
          }
        }
      })

      // Paw-anchored swept platform collision (tightened to prevent side bleed)
      if (s.vy < 0 && s.rocketTimeLeft <= 0) {
        for (const p of s.platforms) {
          if (p.broken) continue
          const halfW = p.width * 0.5 + 1.5
          if (
            prevY >= p.y - 2 &&
            s.y <= p.y + 3.5 &&
            Math.abs(s.x - p.x) <= halfW
          ) {
            if (p.kind === 'breakable') {
              p.broken = true
              onPopSound?.(1)
              continue
            }
            s.y = p.y + 1
            s.vy = p.kind === 'bouncy' ? 132 : 95
            setBouncing(true)
            window.setTimeout(() => setBouncing(false), 180)
            if (p.kind === 'bouncy') {
              onPopSound?.(2)
            } else {
              onPopSound?.(0)
            }
            break
          }
        }
      }

      // Collectibles check (generous radius around kitty body above paws)
      s.items.forEach((item) => {
        if (item.collected) return
        if (Math.hypot(s.x - item.x, (s.y + 6) - item.y) < 12) {
          item.collected = true
          if (item.kind === 'rocket') {
            s.rocketTimeLeft = 2.6
            s.vy = 148
            s.bonus += 4
            setHasRocket(true)
            onPopSound?.(4)
          } else {
            s.bonus += item.kind === 'yarn' ? 3 : item.kind === 'treat' ? 2 : 1
            onCatchSound?.()
          }
        }
      })

      // Advance camera smoothly upward
      if (s.y > s.maxY) s.maxY = s.y
      if (s.y > s.cameraY + 40) {
        s.cameraY = s.y - 40
      }

      // Generate new platforms above camera
      while (s.topGeneratedY < s.cameraY + 130) {
        const roll = Math.random()
        const kind: Platform['kind'] =
          roll < 0.16
            ? 'bouncy'
            : roll < 0.16 + diffMeta.movingChance
              ? 'moving'
              : roll < 0.34 + diffMeta.movingChance
                ? 'breakable'
                : 'normal'
        const px = 16 + Math.random() * 68
        s.platforms.push({
          id: s.nextId++,
          x: px,
          y: s.topGeneratedY,
          width: diffMeta.platformWidth,
          kind,
          vx: kind === 'moving' ? (Math.random() < 0.5 ? 18 : -18) : 0,
        })
        if (kind === 'breakable') {
          const safeX = px < 50 ? Math.min(82, px + 34) : Math.max(18, px - 34)
          s.platforms.push({
            id: s.nextId++,
            x: safeX,
            y: s.topGeneratedY + 2,
            width: diffMeta.platformWidth,
            kind: 'normal',
            vx: 0,
          })
        } else if (Math.random() < 0.45) {
          const itemRoll = Math.random()
          s.items.push({
            id: s.nextId++,
            x: px,
            y: s.topGeneratedY + 7,
            kind:
              itemRoll < 0.11
                ? 'rocket'
                : itemRoll < 0.3
                  ? 'yarn'
                  : itemRoll < 0.6
                    ? 'treat'
                    : 'star',
            collected: false,
          })
        }
        s.topGeneratedY +=
          diffMeta.gapMin + Math.random() * (diffMeta.gapMax - diffMeta.gapMin)
      }

      // Prune platforms & items far below camera
      s.platforms = s.platforms.filter((p) => p.y >= s.cameraY - 15)
      s.items = s.items.filter((it) => !it.collected && it.y >= s.cameraY - 10)

      const heightScore = Math.floor((s.maxY - 14) / 16)
      s.score = Math.max(0, heightScore + s.bonus)

      // Soft playful landing when falling below bottom of screen
      if (s.y < s.cameraY - 8) {
        s.finished = true
        const finalScore = Math.max(3, s.score)
        s.score = finalScore
        setScore(finalScore)
        setPhase('soft_landing')
        landingTimerRef.current = window.setTimeout(() => {
          setPhase('finished')
          onFinish(finalScore, selectedDiff)
        }, 850)
        return
      }

      setCatX(s.x)
      setCatY(s.y)
      setCameraY(s.cameraY)
      setPlatforms([...s.platforms])
      setItems([...s.items])
      setScore(s.score)
    }, stepMs)

    return () => window.clearInterval(timer)
  }, [phase, selectedDiff, onCatchSound, onPopSound, onFinish])

  const updatePointerTarget = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const pct = Math.max(6, Math.min(94, ((clientX - rect.left) / rect.width) * 100))
    const prevX = stateRef.current.x
    if (pct < prevX - 0.5) setCatFacing('left')
    else if (pct > prevX + 0.5) setCatFacing('right')
    stateRef.current.targetX = pct
    stateRef.current.x = pct
    setCatX(pct)
  }

  const area = SKY_AREAS.find((a) => a.id === selectedAreaId) ?? SKY_AREAS[0]
  const diffMeta = SKY_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? SKY_DIFFICULTIES[0]
  const isNight = area.id === 'starry'

  if (phase === 'setup') {
    return (
      <MiniGameSetupModal
        rootId="game-sky-hop"
        title="Sky Hop!"
        subtitle={`Pick a difficulty and sky world for ${catName} to bounce through!`}
        accentBorder="#A78BFA"
        iconBg="#EDE9FE"
        iconBorder="#8B5CF6"
        icon={<SparklesIcon className="w-7 h-7" />}
        difficulties={SKY_DIFFICULTIES}
        selectedDiff={selectedDiff}
        beatenDifficulties={beatenDifficulties}
        onSelectDiff={setSelectedDiff}
        areas={SKY_AREAS}
        onStartArea={startRound}
        onExit={onExit}
        onButtonSound={onButtonSound}
      />
    )
  }

  const screenY = (worldY: number) => 92 - (worldY - cameraY)

  return (
    <div
      id="game-sky-hop"
      className="fixed inset-0 z-40 app-shell"
      style={{
        background: `linear-gradient(180deg, ${area.skyTop} 0%, ${area.skyBottom} 100%)`,
      }}
    >
      {/* Top Bar */}
      <header className="relative z-20 px-3 sm:px-5 pt-3 pb-2 flex items-center justify-between gap-2 shrink-0">
        <button
          id="btn-exit-minigame"
          type="button"
          onClick={onExit}
          className="cozy-btn min-h-[48px] sm:min-h-[54px] px-4 sm:px-5 rounded-2xl bg-[#FFFDF8] border-[3px] border-[#E7C69C] text-[#5B3A29] text-sm sm:text-base font-black"
        >
          Back
        </button>

        <div className="rounded-2xl bg-[#FFFDF8]/95 border-[3px] border-[#A78BFA] px-3 sm:px-4 py-1.5 flex items-center gap-2 shadow-sm">
          <span className="text-xs sm:text-sm font-black text-[#5B3A29]">
            {area.name}
          </span>
          <span
            className="text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full text-[#5B3A29]"
            style={{ backgroundColor: diffMeta.badgeBg }}
          >
            {diffMeta.label}
          </span>
        </div>

        <div
          id="minigame-score"
          className="min-h-[48px] sm:min-h-[54px] px-3 sm:px-4 rounded-2xl bg-[#FFFDF8] border-[3px] border-[#FBBF24] flex items-center gap-1.5 shrink-0"
        >
          <StarIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          <span className="text-xl sm:text-2xl font-black text-[#92400E] tabular-nums">
            {score}
          </span>
        </div>
      </header>

      {/* Sky Playfield */}
      <div
        ref={stageRef}
        id="sky-hop-stage"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture?.(e.pointerId)
          updatePointerTarget(e.clientX)
        }}
        onPointerMove={(e) => {
          if (stateRef.current.targetX !== null || e.buttons > 0) {
            updatePointerTarget(e.clientX)
          }
        }}
        onPointerUp={() => {
          stateRef.current.targetX = null
        }}
        onPointerCancel={() => {
          stateRef.current.targetX = null
        }}
        className="relative flex-1 m-2 sm:m-4 mt-0 rounded-[2rem] border-4 border-[#FFFDF8]/80 overflow-hidden touch-none select-none shadow-inner"
      >
        {/* Area Atmosphere */}
        {isNight ? (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute right-[10%] top-[8%] w-16 h-16 rounded-full bg-[#FEF08A] shadow-[0_0_28px_rgba(254,240,138,0.65)]" />
            <div className="absolute left-[15%] top-[16%] w-2 h-2 rounded-full bg-white/80" />
            <div className="absolute left-[42%] top-[10%] w-2.5 h-2.5 rounded-full bg-[#FEF08A]/80" />
            <div className="absolute left-[72%] top-[24%] w-2 h-2 rounded-full bg-white/75" />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0" aria-hidden="true">
            <div className="absolute right-[8%] top-[6%] w-16 h-16 rounded-full bg-[#FDE047] opacity-85" />
            <div className="absolute left-[14%] top-[14%] w-28 h-10 rounded-full bg-white/55" />
            <div className="absolute left-[58%] top-[20%] w-24 h-8 rounded-full bg-white/45" />
          </div>
        )}

        {/* Platforms */}
        {platforms.map((p) => {
          const topPct = screenY(p.y)
          if (topPct < -8 || topPct > 106) return null
          return (
            <div
              key={p.id}
              data-platform-kind={p.kind}
              style={{
                left: `${p.x}%`,
                top: `${topPct}%`,
                width: `${p.width}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 h-5 sm:h-6 rounded-full border-[3px] shadow-md flex items-center justify-center transition-opacity duration-200 ${
                p.broken ? 'opacity-35 rotate-6' : 'opacity-100'
              } ${
                p.kind === 'bouncy'
                  ? 'bg-gradient-to-r from-[#FDA4AF] via-[#FDE047] to-[#6EE7B7] border-[#F43F5E]'
                  : p.kind === 'moving'
                    ? 'bg-[#BAE6FD] border-[#0284C7]'
                    : p.kind === 'breakable'
                      ? 'bg-[#FDE68A] border-dashed border-[#B45309]'
                      : area.id === 'treehouse'
                        ? 'bg-[#86EFAC] border-[#166534]'
                        : 'bg-[#FFFDF8] border-[#93C5FD]'
              }`}
            >
              {p.kind === 'bouncy' && (
                <span className="text-[10px] font-black text-[#881337] uppercase tracking-wide">
                  Boing!
                </span>
              )}
              {p.kind === 'breakable' && (
                <svg viewBox="0 0 80 20" className="w-full h-full px-2" aria-hidden="true">
                  <path
                    d="M16 3 L24 10 L18 17 M40 2 L46 9 L38 14 L44 18 M62 3 L57 11 L64 17"
                    fill="none"
                    stroke="#92400E"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          )
        })}

        {/* Floating Collectibles */}
        {items.map((item) => {
          const topPct = screenY(item.y)
          if (topPct < -8 || topPct > 106) return null
          return (
            <div
              key={item.id}
              style={{ left: `${item.x}%`, top: `${topPct}%` }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 animate-cat-breathe"
            >
              {item.kind === 'star' && <StarIcon className="w-8 h-8 drop-shadow" />}
              {item.kind === 'treat' && <FoodIcon foodId="treat" className="w-9 h-9 drop-shadow" />}
              {item.kind === 'yarn' && <PlayYarnIcon className="w-8 h-8 drop-shadow" />}
              {item.kind === 'rocket' && (
                <svg viewBox="0 0 48 48" className="w-10 h-10 drop-shadow-md" aria-hidden="true">
                  <path d="M24 5 C31 12 33 22 31 32 L17 32 C15 22 17 12 24 5 Z" fill="#FB7185" stroke="#5B3A29" strokeWidth="2.6" strokeLinejoin="round" />
                  <circle cx="24" cy="18" r="4.5" fill="#E0F2FE" stroke="#5B3A29" strokeWidth="2" />
                  <path d="M17 26 L10 33 L17 32 Z" fill="#F59E0B" stroke="#5B3A29" strokeWidth="2" />
                  <path d="M31 26 L38 33 L31 32 Z" fill="#F59E0B" stroke="#5B3A29" strokeWidth="2" />
                  <path d="M19 32 L24 44 L29 32 Z" fill="#FACC15" stroke="#EA580C" strokeWidth="2" />
                </svg>
              )}
            </div>
          )
        })}

        {/* Bouncing Kitty (anchored at bottom paws so platform contact is pixel-accurate) */}
        {phase === 'playing' && (
          <div
            style={{
              left: `${catX}%`,
              top: `${Math.max(8, Math.min(98, screenY(catY)))}%`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[86%] z-10 flex flex-col items-center"
          >
            <CatSprite
              coat={coat}
              stage={stage}
              mood="thriving"
              animation={bouncing || hasRocket ? 'wiggle' : 'idle'}
              facing={catFacing}
              equippedAccessory={equippedAccessory}
              style={catStyle}
              showThoughtBubble={false}
              className="w-20 h-20 sm:w-28 sm:h-28"
            />
            {hasRocket && (
              <div className="-mt-3 flex flex-col items-center animate-pulse">
                <svg viewBox="0 0 40 32" className="w-10 h-8" aria-hidden="true">
                  <path d="M12 2 L20 28 L28 2 Z" fill="#FACC15" stroke="#EA580C" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M16 2 L20 18 L24 2 Z" fill="#FB7185" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* Playful Soft Landing Cushion */}
        {phase === 'soft_landing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 z-20 pointer-events-none">
            <span className="mb-2 px-4 py-1.5 rounded-full bg-[#FFFDF8] border-[3px] border-[#A78BFA] text-base font-black text-[#5B21B6] shadow-lg">
              Wheee! Soft cloud landing!
            </span>
            <CatSprite
              coat={coat}
              stage={stage}
              mood="thriving"
              animation="wiggle"
              equippedAccessory={equippedAccessory}
              style={catStyle}
              showThoughtBubble={false}
              className="w-28 h-28 sm:w-32 sm:h-32"
            />
            <div className="w-44 h-10 -mt-3 rounded-full bg-[#FFFDF8] border-4 border-[#DDD6FE] shadow-md" />
          </div>
        )}

        {/* Kid-friendly Left / Right Tap Buttons for iPad & Phone */}
        {phase === 'playing' && (
          <div className="absolute inset-x-3 bottom-3 flex items-center justify-between pointer-events-none z-20">
            <button
              id="btn-skyhop-left"
              type="button"
              aria-label="Move kitty left"
              onPointerDown={(e) => {
                e.stopPropagation()
                stateRef.current.moveDir = -1
                stateRef.current.targetX = null
              }}
              onPointerUp={(e) => {
                e.stopPropagation()
                if (stateRef.current.moveDir === -1) stateRef.current.moveDir = 0
              }}
              onPointerLeave={() => {
                if (stateRef.current.moveDir === -1) stateRef.current.moveDir = 0
              }}
              className="pointer-events-auto cozy-btn w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFFDF8]/85 border-[3px] border-[#A78BFA] text-2xl font-black text-[#5B21B6] shadow-lg flex items-center justify-center"
            >
              ◀
            </button>
            <button
              id="btn-skyhop-right"
              type="button"
              aria-label="Move kitty right"
              onPointerDown={(e) => {
                e.stopPropagation()
                stateRef.current.moveDir = 1
                stateRef.current.targetX = null
              }}
              onPointerUp={(e) => {
                e.stopPropagation()
                if (stateRef.current.moveDir === 1) stateRef.current.moveDir = 0
              }}
              onPointerLeave={() => {
                if (stateRef.current.moveDir === 1) stateRef.current.moveDir = 0
              }}
              className="pointer-events-auto cozy-btn w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#FFFDF8]/85 border-[3px] border-[#A78BFA] text-2xl font-black text-[#5B21B6] shadow-lg flex items-center justify-center"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {phase === 'finished' && (
        <MiniGameResultCard
          gameTitle={`Sky Hop (${diffMeta.label})`}
          score={score}
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
