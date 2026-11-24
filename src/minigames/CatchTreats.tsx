import { useCallback, useEffect, useRef, useState } from 'react'
import { CatSprite } from '../components/CatSprite'
import { FoodIcon, PlayYarnIcon, StarIcon } from '../components/Icons'
import type {
  CatStyleConfig,
  CoatStyle,
  GrowthStage,
  MiniGameDifficulty,
} from '../types/game'
import { MiniGameResultCard } from './MiniGameResultCard'
import { MiniGameSetupModal, type PlayAreaOption } from './MiniGameSetupModal'

const GAME_DURATION_SEC = 30

interface CatchTreatsProps {
  catName: string
  coat: CoatStyle
  stage: GrowthStage
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  beatenDifficulties: readonly MiniGameDifficulty[]
  onCatchSound?: () => void
  onGiggleSound?: () => void
  onButtonSound?: () => void
  onFinish: (score: number, difficulty: MiniGameDifficulty) => void
  onExit: () => void
}

interface FallingItem {
  id: number
  x: number // 12..88 %
  y: number // -6..100 %
  speed: number // % per second
  kind: 'treat' | 'salmon' | 'yarn'
}

interface CatchPop {
  id: number
  x: number
  y: number
  text: string
  isGiggle?: boolean
}

const TREAT_AREAS: PlayAreaOption[] = [
  {
    id: 'kitchen',
    name: 'Cozy Kitchen',
    tagline: 'Warm tiles & falling snacks',
    accent: '#F59E0B',
    skyTop: '#FFF7E6',
    skyBottom: '#FFECD0',
    groundColor: '#D9A773',
    icon: <FoodIcon foodId="treat" className="w-12 h-12" />,
  },
  {
    id: 'meadow',
    name: 'Picnic Meadow',
    tagline: 'Sunny breeze & tasty treats',
    accent: '#10B981',
    skyTop: '#BAE6FD',
    skyBottom: '#DCFCE7',
    groundColor: '#4ADE80',
    icon: <FoodIcon foodId="salmon" className="w-12 h-12" />,
  },
  {
    id: 'market',
    name: 'Fish Market',
    tagline: 'Fresh salmon & yarn surprises',
    accent: '#38BDF8',
    skyTop: '#E0F2FE',
    skyBottom: '#BAE6FD',
    groundColor: '#E6BE8A',
    icon: <PlayYarnIcon className="w-12 h-12" />,
  },
  {
    id: 'pier',
    name: 'Sunset Pier',
    tagline: 'Golden sky by the boardwalk',
    accent: '#FB7185',
    skyTop: '#FDE68A',
    skyBottom: '#FECDD3',
    groundColor: '#C78F57',
    icon: <StarIcon className="w-12 h-12" />,
  },
]

const TREAT_DIFFICULTIES: Array<{
  id: MiniGameDifficulty
  label: string
  hint: string
  accent: string
  badgeBg: string
  reqText: string
  speedMult: number
  spawnMs: number
  maxCount: number
}> = [
  {
    id: 'easy',
    label: 'Easy',
    hint: 'Gentle drop',
    accent: '#10B981',
    badgeBg: '#D1FAE5',
    reqText: 'Unlocked!',
    speedMult: 0.85,
    spawnMs: 950,
    maxCount: 5,
  },
  {
    id: 'medium',
    label: 'Medium',
    hint: 'Breezy drop',
    accent: '#F59E0B',
    badgeBg: '#FEF3C7',
    reqText: 'Beat Easy first!',
    speedMult: 1.15,
    spawnMs: 780,
    maxCount: 6,
  },
  {
    id: 'hard',
    label: 'Hard',
    hint: 'Treat shower!',
    accent: '#FB7185',
    badgeBg: '#FFE4E6',
    reqText: 'Beat Medium first!',
    speedMult: 1.45,
    spawnMs: 600,
    maxCount: 8,
  },
]

function createFallingItem(id: number, speedMult = 1): FallingItem {
  const roll = Math.random()
  const kind: FallingItem['kind'] =
    roll < 0.22 ? 'yarn' : roll < 0.52 ? 'salmon' : 'treat'
  return {
    id,
    x: 12 + Math.random() * 76,
    y: -6,
    speed: (24 + Math.random() * 11) * speedMult,
    kind,
  }
}

export function CatchTreats({
  catName,
  coat,
  stage,
  equippedAccessory,
  catStyle,
  beatenDifficulties,
  onCatchSound,
  onGiggleSound,
  onButtonSound,
  onFinish,
  onExit,
}: CatchTreatsProps) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup')
  const [selectedDiff, setSelectedDiff] = useState<MiniGameDifficulty>('easy')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('kitchen')

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC)
  const [score, setScore] = useState(0)
  const [catX, setCatX] = useState(50)
  const [items, setItems] = useState<FallingItem[]>([])
  const [giggling, setGiggling] = useState(false)
  const [pops, setPops] = useState<CatchPop[]>([])

  const catXRef = useRef(50)
  const scoreRef = useRef(0)
  const finishedRef = useRef(false)
  const nextIdRef = useRef(10)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const isDraggingRef = useRef(false)

  const updateCatX = (nextX: number) => {
    const clamped = Math.max(12, Math.min(88, nextX))
    catXRef.current = clamped
    setCatX(clamped)
  }

  const startRound = useCallback(
    (areaId: string, diff: MiniGameDifficulty) => {
      onButtonSound?.()
      const diffMeta = TREAT_DIFFICULTIES.find((d) => d.id === diff) ?? TREAT_DIFFICULTIES[0]
      scoreRef.current = 0
      finishedRef.current = false
      catXRef.current = 50
      setSelectedAreaId(areaId)
      setSelectedDiff(diff)
      setScore(0)
      setCatX(50)
      setTimeLeft(GAME_DURATION_SEC)
      setGiggling(false)
      setPops([])
      setItems([{ id: nextIdRef.current++, x: 50, y: 10, speed: 26 * diffMeta.speedMult, kind: 'salmon' }])
      setPhase('playing')
    },
    [onButtonSound],
  )

  // 30-second countdown timer
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          if (!finishedRef.current) {
            finishedRef.current = true
            setPhase('finished')
            onFinish(scoreRef.current, selectedDiff)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase, selectedDiff, onFinish])

  // Falling treats & generous catch detection loop
  useEffect(() => {
    if (phase !== 'playing') return
    const diffMeta = TREAT_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? TREAT_DIFFICULTIES[0]
    const stepMs = 45
    let spawnAcc = 0

    const loop = window.setInterval(() => {
      if (finishedRef.current) return
      const dt = stepMs / 1000
      spawnAcc += stepMs

      setItems((prev) => {
        const remaining: FallingItem[] = []

        for (const item of prev) {
          const nextY = item.y + item.speed * dt
          // Check generous catch band near the kitty
          const inCatchY = nextY >= 68 && nextY <= 88
          const inCatchX = Math.abs(item.x - catXRef.current) <= 15

          if (inCatchY && inCatchX) {
            const popId = nextIdRef.current++
            if (item.kind === 'yarn') {
              // Playful 1-second giggle wiggle — NEVER ends the game!
              setGiggling(true)
              onGiggleSound?.()
              window.setTimeout(() => setGiggling(false), 1000)
              setPops((p) => [
                ...p.slice(-6),
                { id: popId, x: catXRef.current, y: 66, text: 'Hehe!', isGiggle: true },
              ])
            } else {
              const pts = item.kind === 'salmon' ? 2 : 1
              scoreRef.current += pts
              setScore(scoreRef.current)
              onCatchSound?.()
              setPops((p) => [
                ...p.slice(-6),
                { id: popId, x: item.x, y: 68, text: `+${pts}` },
              ])
            }
            window.setTimeout(() => {
              setPops((p) => prevPopFilter(p, popId))
            }, 750)
            continue
          }

          if (nextY < 102) {
            remaining.push({ ...item, y: nextY })
          }
        }

        if (spawnAcc >= diffMeta.spawnMs && remaining.length < diffMeta.maxCount) {
          spawnAcc = 0
          remaining.push(createFallingItem(nextIdRef.current++, diffMeta.speedMult))
        }

        return remaining
      })
    }, stepMs)

    return () => window.clearInterval(loop)
  }, [phase, selectedDiff, onCatchSound, onGiggleSound])

  const moveFromClientX = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return
    const pct = ((clientX - rect.left) / rect.width) * 100
    updateCatX(pct)
  }

  const area = TREAT_AREAS.find((a) => a.id === selectedAreaId) ?? TREAT_AREAS[0]
  const diffMeta = TREAT_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? TREAT_DIFFICULTIES[0]

  if (phase === 'setup') {
    return (
      <MiniGameSetupModal
        rootId="game-catch-treats"
        title="Catch Treats!"
        subtitle={`Pick a difficulty and snack spot for ${catName}!`}
        accentBorder="#FBBF24"
        iconBg="#FEF3C7"
        iconBorder="#F59E0B"
        icon={<FoodIcon foodId="treat" className="w-7 h-7" />}
        difficulties={TREAT_DIFFICULTIES}
        selectedDiff={selectedDiff}
        beatenDifficulties={beatenDifficulties}
        onSelectDiff={setSelectedDiff}
        areas={TREAT_AREAS}
        onStartArea={startRound}
        onExit={onExit}
        onButtonSound={onButtonSound}
      />
    )
  }

  return (
    <div
      id="game-catch-treats"
      className="fixed inset-0 z-40 app-shell"
      style={{
        background: `linear-gradient(180deg, ${area.skyTop} 0%, ${area.skyBottom} 100%)`,
      }}
    >
      {/* Top Game HUD */}
      <header className="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between gap-3 shrink-0">
        <button
          id="btn-exit-minigame"
          type="button"
          onClick={onExit}
          className="cozy-btn min-h-[54px] px-5 rounded-2xl bg-[#FFFDF8] border-[3px] border-[#E5C49B] text-[#5B3A29] text-base font-black"
        >
          Back
        </button>

        <div className="flex-1 max-w-md flex items-center gap-2.5">
          <div className="flex-1 h-6 rounded-full bg-[#FFFDF8] border-[3px] border-[#F5C062] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#34D399] transition-all duration-300"
              style={{ width: `${(timeLeft / GAME_DURATION_SEC) * 100}%` }}
            />
          </div>
          <span
            id="minigame-timer"
            className="min-w-[46px] text-center text-xl font-black text-[#5B3A29] tabular-nums"
          >
            {timeLeft}s
          </span>
        </div>

        <div
          id="minigame-score"
          className="min-h-[54px] px-4 rounded-2xl bg-[#FFFDF8] border-[3px] border-[#FBBF24] flex items-center gap-1.5"
        >
          <StarIcon className="w-7 h-7" />
          <span className="text-2xl font-black text-[#92400E] tabular-nums">
            {score}
          </span>
        </div>
      </header>

      {/* Play Stage: Drag Anywhere OR Tap Left/Right Halves */}
      <div
        id="catch-play-stage"
        ref={stageRef}
        onPointerDown={(e) => {
          if (finishedRef.current) return
          isDraggingRef.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
          moveFromClientX(e.clientX)
        }}
        onPointerMove={(e) => {
          if (!isDraggingRef.current || finishedRef.current) return
          moveFromClientX(e.clientX)
        }}
        onPointerUp={() => {
          isDraggingRef.current = false
        }}
        onPointerCancel={() => {
          isDraggingRef.current = false
        }}
        className="relative flex-1 overflow-hidden touch-none select-none cursor-grab active:cursor-grabbing"
      >
        <p className="pointer-events-none absolute top-2 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full bg-[#FFFDF8]/85 border-2 border-[#E7C9A4] text-sm font-extrabold text-[#8A6552]">
          Slide or Tap Left &amp; Right!
        </p>

        {/* Falling Treats & Playful Yarn Balls */}
        {items.map((item) => (
          <div
            key={item.id}
            data-falling-item={item.kind}
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-20 drop-shadow"
          >
            {item.kind === 'yarn' ? (
              <PlayYarnIcon className="w-14 h-14" />
            ) : (
              <FoodIcon foodId={item.kind} className="w-16 h-16" />
            )}
          </div>
        ))}

        {/* Catch / Giggle Pop Feedback */}
        {pops.map((p) => (
          <div
            key={p.id}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 animate-float-up"
          >
            <span
              className={`px-3 py-1 rounded-full border-2 text-lg font-black shadow ${
                p.isGiggle
                  ? 'bg-[#FFE4E6] border-[#FB7185] text-[#9F1239]'
                  : 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
              }`}
            >
              {p.text}
            </span>
          </div>
        ))}

        {/* Floor */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-20 border-t-4 border-[#B9854E]"
          style={{ backgroundColor: area.groundColor }}
        />

        {/* Player-controlled Kitty */}
        <div
          id="catch-kitty"
          className="pointer-events-none absolute bottom-3 -translate-x-1/2 transition-[left] duration-75 ease-out z-20"
          style={{ left: `${catX}%` }}
        >
          <CatSprite
            coat={coat}
            stage={stage}
            mood="thriving"
            animation={giggling ? 'wiggle' : 'idle'}
            equippedAccessory={equippedAccessory}
            style={catStyle}
            showThoughtBubble={false}
            className="w-36 h-36 sm:w-44 sm:h-44"
          />
        </div>
      </div>

      {phase === 'finished' && (
        <MiniGameResultCard
          gameTitle={`Catch Treats (${diffMeta.label})`}
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

function prevPopFilter(list: CatchPop[], removeId: number): CatchPop[] {
  return list.filter((x) => x.id !== removeId)
}
