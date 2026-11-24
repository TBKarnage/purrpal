import { useCallback, useEffect, useRef, useState } from 'react'
import { CatSprite } from '../components/CatSprite'
import { SparklesIcon, StarIcon } from '../components/Icons'
import type {
  CatStyleConfig,
  CoatStyle,
  GrowthStage,
  MiniGameDifficulty,
} from '../types/game'
import { MiniGameResultCard } from './MiniGameResultCard'
import { MiniGameSetupModal, type PlayAreaOption } from './MiniGameSetupModal'

const GAME_DURATION_SEC = 30

interface BubblePopProps {
  catName: string
  coat: CoatStyle
  stage: GrowthStage
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  beatenDifficulties: readonly MiniGameDifficulty[]
  onPopSound?: (comboIndex: number) => void
  onButtonSound?: () => void
  onFinish: (score: number, difficulty: MiniGameDifficulty) => void
  onExit: () => void
}

interface BubbleEntity {
  id: number
  x: number // 10..90 %
  y: number // 105..-10 %
  size: number // px
  speed: number // % per second
  golden: boolean
  tint: string
}

interface PopRing {
  id: number
  x: number
  y: number
  points: number
}

const BUBBLE_AREAS: PlayAreaOption[] = [
  {
    id: 'bath',
    name: 'Bubble Bath',
    tagline: 'Splashy suds & pastel bubbles',
    accent: '#38BDF8',
    skyTop: '#E0F7FF',
    skyBottom: '#F0F9FF',
    groundColor: '#E6BE8A',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <circle cx="24" cy="36" r="14" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="2.5" />
        <circle cx="42" cy="24" r="10" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'garden',
    name: 'Sunlit Garden',
    tagline: 'Floating bubbles over green grass',
    accent: '#10B981',
    skyTop: '#BAE6FD',
    skyBottom: '#DCFCE7',
    groundColor: '#86EFAC',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <rect x="8" y="42" width="48" height="14" rx="5" fill="#4ADE80" />
        <circle cx="32" cy="28" r="12" fill="#FBCFE8" stroke="#F472B6" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'sky',
    name: 'Cloudy Sky',
    tagline: 'Drift high among fluffy clouds',
    accent: '#8B5CF6',
    skyTop: '#DDD6FE',
    skyBottom: '#F5F3FF',
    groundColor: '#C4B5FD',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <ellipse cx="32" cy="44" rx="20" ry="9" fill="#FFFFFF" />
        <circle cx="32" cy="24" r="11" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: 'night',
    name: 'Starry Night',
    tagline: 'Glowing moonlit bubbles',
    accent: '#6366F1',
    skyTop: '#312E81',
    skyBottom: '#4C1D95',
    groundColor: '#6D28D9',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <circle cx="42" cy="20" r="8" fill="#FEF08A" />
        <circle cx="24" cy="36" r="11" fill="#A7F3D0" stroke="#34D399" strokeWidth="2.5" />
      </svg>
    ),
  },
]

const BUBBLE_DIFFICULTIES: Array<{
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
    hint: 'Slow float',
    accent: '#10B981',
    badgeBg: '#D1FAE5',
    reqText: 'Unlocked!',
    speedMult: 0.85,
    spawnMs: 850,
    maxCount: 7,
  },
  {
    id: 'medium',
    label: 'Medium',
    hint: 'Breezy float',
    accent: '#F59E0B',
    badgeBg: '#FEF3C7',
    reqText: 'Beat Easy first!',
    speedMult: 1.15,
    spawnMs: 680,
    maxCount: 9,
  },
  {
    id: 'hard',
    label: 'Hard',
    hint: 'Fast bubbles!',
    accent: '#FB7185',
    badgeBg: '#FFE4E6',
    reqText: 'Beat Medium first!',
    speedMult: 1.5,
    spawnMs: 520,
    maxCount: 11,
  },
]

const BUBBLE_TINTS = [
  'bg-[#BAE6FD]/75 border-[#38BDF8]',
  'bg-[#FBCFE8]/75 border-[#F472B6]',
  'bg-[#DDD6FE]/75 border-[#A78BFA]',
  'bg-[#A7F3D0]/75 border-[#34D399]',
]

function makeBubble(id: number, startY = 104, speedMult = 1): BubbleEntity {
  const golden = Math.random() < 0.2
  return {
    id,
    x: 12 + Math.random() * 76,
    y: startY,
    size: golden ? 86 : 78 + Math.floor(Math.random() * 18),
    speed: (golden ? 18 : 13 + Math.random() * 9) * speedMult,
    golden,
    tint: BUBBLE_TINTS[id % BUBBLE_TINTS.length],
  }
}

export function BubblePop({
  catName,
  coat,
  stage,
  equippedAccessory,
  catStyle,
  beatenDifficulties,
  onPopSound,
  onButtonSound,
  onFinish,
  onExit,
}: BubblePopProps) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup')
  const [selectedDiff, setSelectedDiff] = useState<MiniGameDifficulty>('easy')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('bath')

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC)
  const [score, setScore] = useState(0)
  const [bubbles, setBubbles] = useState<BubbleEntity[]>([])
  const [pops, setPops] = useState<PopRing[]>([])
  const [catX, setCatX] = useState(50)
  const [batting, setBatting] = useState(false)

  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const nextIdRef = useRef(10)
  const finishedRef = useRef(false)

  const startRound = useCallback(
    (areaId: string, diff: MiniGameDifficulty) => {
      onButtonSound?.()
      const diffMeta = BUBBLE_DIFFICULTIES.find((d) => d.id === diff) ?? BUBBLE_DIFFICULTIES[0]
      scoreRef.current = 0
      comboRef.current = 0
      finishedRef.current = false
      setSelectedAreaId(areaId)
      setSelectedDiff(diff)
      setScore(0)
      setTimeLeft(GAME_DURATION_SEC)
      setPops([])
      setBubbles([
        makeBubble(nextIdRef.current++, 68, diffMeta.speedMult),
        makeBubble(nextIdRef.current++, 85, diffMeta.speedMult),
      ])
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

  // Gentle bubble physics + spawning loop
  useEffect(() => {
    if (phase !== 'playing') return
    const diffMeta = BUBBLE_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? BUBBLE_DIFFICULTIES[0]
    const stepMs = 50
    let spawnAcc = 0

    const loop = window.setInterval(() => {
      if (finishedRef.current) return
      const dt = stepMs / 1000
      spawnAcc += stepMs

      setBubbles((prev) => {
        const moved = prev
          .map((b) => ({ ...b, y: b.y - b.speed * dt }))
          .filter((b) => b.y > -12)

        if (spawnAcc >= diffMeta.spawnMs && moved.length < diffMeta.maxCount) {
          spawnAcc = 0
          moved.push(makeBubble(nextIdRef.current++, 104, diffMeta.speedMult))
        }
        return moved
      })
    }, stepMs)

    return () => window.clearInterval(loop)
  }, [phase, selectedDiff])

  const popBubble = (bubble: BubbleEntity) => {
    if (finishedRef.current) return
    const pts = bubble.golden ? 3 : 1
    scoreRef.current += pts
    setScore(scoreRef.current)
    onPopSound?.(comboRef.current++)

    setCatX(Math.max(16, Math.min(84, bubble.x)))
    setBatting(true)
    window.setTimeout(() => setBatting(false), 360)

    setBubbles((prev) => prev.filter((b) => b.id !== bubble.id))
    const popId = nextIdRef.current++
    setPops((prev) => [...prev.slice(-8), { id: popId, x: bubble.x, y: bubble.y, points: pts }])
    window.setTimeout(() => {
      setPops((prev) => prev.filter((p) => p.id !== popId))
    }, 550)
  }

  const area = BUBBLE_AREAS.find((a) => a.id === selectedAreaId) ?? BUBBLE_AREAS[0]
  const diffMeta = BUBBLE_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? BUBBLE_DIFFICULTIES[0]

  if (phase === 'setup') {
    return (
      <MiniGameSetupModal
        rootId="game-bubble-pop"
        title="Bubble Pop!"
        subtitle={`Pick a difficulty and bubbly spot for ${catName}!`}
        accentBorder="#7DD3FC"
        iconBg="#E0F2FE"
        iconBorder="#38BDF8"
        icon={<SparklesIcon className="w-7 h-7" />}
        difficulties={BUBBLE_DIFFICULTIES}
        selectedDiff={selectedDiff}
        beatenDifficulties={beatenDifficulties}
        onSelectDiff={setSelectedDiff}
        areas={BUBBLE_AREAS}
        onStartArea={startRound}
        onExit={onExit}
        onButtonSound={onButtonSound}
      />
    )
  }

  return (
    <div
      id="game-bubble-pop"
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
          className="cozy-btn min-h-[54px] px-5 rounded-2xl bg-[#FFFDF8] border-[3px] border-[#93C5FD] text-[#075985] text-base font-black"
        >
          Back
        </button>

        <div className="flex-1 max-w-md flex items-center gap-2.5">
          <div className="flex-1 h-6 rounded-full bg-[#FFFDF8] border-[3px] border-[#7DD3FC] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#38BDF8] to-[#818CF8] transition-all duration-300"
              style={{ width: `${(timeLeft / GAME_DURATION_SEC) * 100}%` }}
            />
          </div>
          <span
            id="minigame-timer"
            className="min-w-[46px] text-center text-xl font-black text-[#075985] tabular-nums"
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

      {/* Bubble Play Stage */}
      <div className="relative flex-1 overflow-hidden touch-none">
        {/* Floating Bubbles */}
        {phase === 'playing' &&
          bubbles.map((b) => (
            <button
              key={b.id}
              type="button"
              data-bubble="true"
              data-golden={b.golden ? 'true' : 'false'}
              aria-label={b.golden ? 'Pop golden fish bubble' : 'Pop bubble'}
              onPointerDown={() => popBubble(b)}
              style={{
                left: `${b.x}%`,
                top: `${b.y}%`,
                width: `${b.size}px`,
                height: `${b.size}px`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 rounded-full border-[3.5px] shadow-md flex items-center justify-center cursor-pointer active:scale-90 ${
                b.golden
                  ? 'bg-[#FEF08A]/85 border-[#F59E0B] shadow-[0_0_20px_rgba(251,191,36,0.6)]'
                  : b.tint
              }`}
            >
              {/* Glossy highlight */}
              <span className="absolute top-3 left-4 w-5 h-3 rounded-full bg-white/80 -rotate-25 pointer-events-none" />
              {b.golden && (
                <svg viewBox="0 0 40 40" className="w-11 h-11 pointer-events-none" aria-hidden="true">
                  <path d="M12 20 C16 12 27 12 34 20 C27 28 16 28 12 20 Z" fill="#F97316" stroke="#78350F" strokeWidth="2.4" />
                  <path d="M12 20 L5 14 L6 26 Z" fill="#F97316" stroke="#78350F" strokeWidth="2.2" />
                  <circle cx="28" cy="18.5" r="1.8" fill="#78350F" />
                </svg>
              )}
            </button>
          ))}

        {/* Pop Effects */}
        {pops.map((p) => (
          <div
            key={p.id}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full border-4 border-[#38BDF8] animate-pop-burst" />
            <span className="absolute text-xl font-black text-[#0369A1] animate-float-up">
              +{p.points}
            </span>
          </div>
        ))}

        {/* Playful Kitty Batting Along Floor */}
        <div
          className="pointer-events-none absolute bottom-0 inset-x-0 h-20 border-t-4 border-[#C89B67]"
          style={{ backgroundColor: area.groundColor }}
        />
        <div
          className="pointer-events-none absolute bottom-3 -translate-x-1/2 transition-all duration-200 ease-out z-10"
          style={{ left: `${catX}%` }}
        >
          <CatSprite
            coat={coat}
            stage={stage}
            mood="thriving"
            animation={batting ? 'wiggle' : 'idle'}
            equippedAccessory={equippedAccessory}
            style={catStyle}
            showThoughtBubble={false}
            className="w-36 h-36 sm:w-44 sm:h-44"
          />
        </div>
      </div>

      {phase === 'finished' && (
        <MiniGameResultCard
          gameTitle={`Bubble Pop (${diffMeta.label})`}
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
