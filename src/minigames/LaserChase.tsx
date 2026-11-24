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

interface LaserChaseProps {
  catName: string
  coat: CoatStyle
  stage: GrowthStage
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  beatenDifficulties: readonly MiniGameDifficulty[]
  onCatchSound?: () => void
  onButtonSound?: () => void
  onFinish: (score: number, difficulty: MiniGameDifficulty) => void
  onExit: () => void
}

interface Burst {
  id: number
  x: number
  y: number
}

const LASER_AREAS: PlayAreaOption[] = [
  {
    id: 'living_room',
    name: 'Cozy Rug',
    tagline: 'Warm playmat in the living room',
    accent: '#FB7185',
    skyTop: '#FFF3E0',
    skyBottom: '#FFE6CC',
    groundColor: '#F7D0AC',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <ellipse cx="32" cy="40" rx="22" ry="12" fill="#FFFDF8" stroke="#E7C49A" strokeWidth="3" />
        <circle cx="38" cy="24" r="6" fill="#F43F5E" />
      </svg>
    ),
  },
  {
    id: 'bedroom',
    name: 'Dreamy Carpet',
    tagline: 'Soft pastel floor & starry glow',
    accent: '#8B5CF6',
    skyTop: '#F5F3FF',
    skyBottom: '#EDE9FE',
    groundColor: '#DDD6FE',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <rect x="12" y="24" width="40" height="26" rx="10" fill="#FFFDF8" stroke="#C4B5FD" strokeWidth="3" />
        <circle cx="32" cy="37" r="6" fill="#F43F5E" />
      </svg>
    ),
  },
  {
    id: 'patio',
    name: 'Starry Patio',
    tagline: 'Bright red dot in the twilight',
    accent: '#6366F1',
    skyTop: '#312E81',
    skyBottom: '#4338CA',
    groundColor: '#3730A3',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <circle cx="44" cy="18" r="7" fill="#FDE047" />
        <circle cx="24" cy="40" r="7" fill="#FF2D55" />
      </svg>
    ),
  },
  {
    id: 'garden',
    name: 'Sunlit Lawn',
    tagline: 'Chase the dot across soft grass',
    accent: '#10B981',
    skyTop: '#DCFCE7',
    skyBottom: '#BBF7D0',
    groundColor: '#86EFAC',
    icon: (
      <svg viewBox="0 0 64 64" className="w-12 h-12" aria-hidden="true">
        <ellipse cx="32" cy="42" rx="22" ry="11" fill="#4ADE80" stroke="#16A34A" strokeWidth="2.5" />
        <circle cx="34" cy="28" r="6" fill="#F43F5E" />
      </svg>
    ),
  },
]

const LASER_DIFFICULTIES: Array<{
  id: MiniGameDifficulty
  label: string
  hint: string
  accent: string
  badgeBg: string
  reqText: string
  moveMs: number
  missMs: number
}> = [
  {
    id: 'easy',
    label: 'Easy',
    hint: 'Gentle speed',
    accent: '#10B981',
    badgeBg: '#D1FAE5',
    reqText: 'Unlocked!',
    moveMs: 2100,
    missMs: 2600,
  },
  {
    id: 'medium',
    label: 'Medium',
    hint: 'Quick zip',
    accent: '#F59E0B',
    badgeBg: '#FEF3C7',
    reqText: 'Beat Easy first!',
    moveMs: 1550,
    missMs: 2100,
  },
  {
    id: 'hard',
    label: 'Hard',
    hint: 'Super fast!',
    accent: '#FB7185',
    badgeBg: '#FFE4E6',
    reqText: 'Beat Medium first!',
    moveMs: 1100,
    missMs: 1600,
  },
]

function randomSpot(prevX: number, prevY: number): { x: number; y: number } {
  for (let i = 0; i < 6; i += 1) {
    const x = 16 + Math.random() * 68
    const y = 20 + Math.random() * 58
    if (Math.hypot(x - prevX, y - prevY) > 22) {
      return { x, y }
    }
  }
  return { x: 25 + Math.random() * 50, y: 25 + Math.random() * 50 }
}

export function LaserChase({
  catName,
  coat,
  stage,
  equippedAccessory,
  catStyle,
  beatenDifficulties,
  onCatchSound,
  onButtonSound,
  onFinish,
  onExit,
}: LaserChaseProps) {
  const [phase, setPhase] = useState<'setup' | 'playing' | 'finished'>('setup')
  const [selectedDiff, setSelectedDiff] = useState<MiniGameDifficulty>('easy')
  const [selectedAreaId, setSelectedAreaId] = useState<string>('living_room')

  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC)
  const [score, setScore] = useState(0)
  const [dotPos, setDotPos] = useState({ x: 64, y: 42 })
  const [catPos, setCatPos] = useState({ x: 34, y: 66 })
  const [isLeaping, setIsLeaping] = useState(false)
  const [bursts, setBursts] = useState<Burst[]>([])

  const missesRef = useRef(0)
  const caughtThisRoundRef = useRef(false)
  const scoreRef = useRef(0)
  const finishedRef = useRef(false)
  const burstIdRef = useRef(1)
  const dotPosRef = useRef(dotPos)
  useEffect(() => {
    dotPosRef.current = dotPos
  }, [dotPos])

  const startRound = useCallback(
    (areaId: string, diff: MiniGameDifficulty) => {
      onButtonSound?.()
      missesRef.current = 0
      caughtThisRoundRef.current = false
      scoreRef.current = 0
      finishedRef.current = false
      setSelectedAreaId(areaId)
      setSelectedDiff(diff)
      setScore(0)
      setTimeLeft(GAME_DURATION_SEC)
      setDotPos({ x: 64, y: 42 })
      setCatPos({ x: 34, y: 66 })
      setBursts([])
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

  // Zip laser dot at difficulty-tuned cadence
  useEffect(() => {
    if (phase !== 'playing') return
    const diffMeta = LASER_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? LASER_DIFFICULTIES[0]
    let timeoutId: number

    const scheduleMove = () => {
      const delay = missesRef.current >= 2 ? diffMeta.missMs : diffMeta.moveMs
      timeoutId = window.setTimeout(() => {
        if (finishedRef.current) return
        if (!caughtThisRoundRef.current) {
          missesRef.current += 1
        }
        caughtThisRoundRef.current = false
        setDotPos(randomSpot(dotPosRef.current.x, dotPosRef.current.y))
        scheduleMove()
      }, delay)
    }

    scheduleMove()
    return () => window.clearTimeout(timeoutId)
  }, [phase, selectedDiff])

  const handleCatchDot = () => {
    if (finishedRef.current) return
    caughtThisRoundRef.current = true
    missesRef.current = 0

    const hitX = dotPosRef.current.x
    const hitY = dotPosRef.current.y

    scoreRef.current += 1
    setScore(scoreRef.current)
    onCatchSound?.()

    // Kitty leaps right to the dot!
    setCatPos({ x: hitX, y: Math.min(78, hitY + 6) })
    setIsLeaping(true)
    window.setTimeout(() => setIsLeaping(false), 420)

    const id = burstIdRef.current++
    setBursts((prev) => [...prev.slice(-6), { id, x: hitX, y: hitY }])
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id))
    }, 650)

    // Immediately zip dot to a new fun spot
    setDotPos(randomSpot(hitX, hitY))
  }

  const area = LASER_AREAS.find((a) => a.id === selectedAreaId) ?? LASER_AREAS[0]
  const diffMeta = LASER_DIFFICULTIES.find((d) => d.id === selectedDiff) ?? LASER_DIFFICULTIES[0]

  if (phase === 'setup') {
    return (
      <MiniGameSetupModal
        rootId="game-laser-chase"
        title="Laser Chase!"
        subtitle={`Pick a difficulty and play area for ${catName} to pounce!`}
        accentBorder="#FDA4AF"
        iconBg="#FFE4E6"
        iconBorder="#FB7185"
        icon={<SparklesIcon className="w-7 h-7" />}
        difficulties={LASER_DIFFICULTIES}
        selectedDiff={selectedDiff}
        beatenDifficulties={beatenDifficulties}
        onSelectDiff={setSelectedDiff}
        areas={LASER_AREAS}
        onStartArea={startRound}
        onExit={onExit}
        onButtonSound={onButtonSound}
      />
    )
  }

  return (
    <div
      id="game-laser-chase"
      className="fixed inset-0 z-40 app-shell"
      style={{
        background: `linear-gradient(180deg, ${area.skyTop} 0%, ${area.skyBottom} 55%, ${area.groundColor} 100%)`,
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

        {/* Chunky Countdown Bar */}
        <div className="flex-1 max-w-md flex items-center gap-2.5">
          <div className="flex-1 h-6 rounded-full bg-[#FFFDF8] border-[3px] border-[#E5B889] p-0.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#FB7185] to-[#F59E0B] transition-all duration-300"
              style={{ width: `${(timeLeft / GAME_DURATION_SEC) * 100}%` }}
            />
          </div>
          <span
            id="minigame-timer"
            className="min-w-[46px] text-center text-xl font-black text-[#5B3A29] bg-[#FFFDF8]/90 rounded-xl px-1.5 py-0.5 tabular-nums"
          >
            {timeLeft}s
          </span>
        </div>

        {/* Score Pill */}
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

      {/* Cozy Playmat Area */}
      <div
        className="relative flex-1 m-3 sm:m-5 mt-1 rounded-[2.25rem] border-4 border-[#E7C49A] shadow-inner overflow-hidden touch-none"
        style={{
          backgroundColor: area.id === 'patio' ? '#1E1B4B' : 'rgba(255,249,240,0.88)',
        }}
      >
        {/* Soft playmat woven oval pattern */}
        <div className="pointer-events-none absolute inset-6 rounded-[2rem] border-4 border-dashed border-[#F2D5B3]/60" />

        {/* Leaping Kitty */}
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ease-out z-10"
          style={{ left: `${catPos.x}%`, top: `${catPos.y}%` }}
        >
          <CatSprite
            coat={coat}
            stage={stage}
            mood="thriving"
            animation={isLeaping ? 'wiggle' : 'idle'}
            equippedAccessory={equippedAccessory}
            style={catStyle}
            showThoughtBubble={false}
            className="w-36 h-36 sm:w-44 sm:h-44"
          />
        </div>

        {/* Sparkle Bursts */}
        {bursts.map((b) => (
          <div
            key={b.id}
            style={{ left: `${b.x}%`, top: `${b.y}%` }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30 flex items-center justify-center"
          >
            <div className="w-16 h-16 rounded-full border-4 border-[#FB7185] animate-pop-burst" />
            <SparklesIcon className="w-10 h-10 absolute animate-float-up" />
          </div>
        ))}

        {/* Glowing Laser Dot (96x96 generous touch hitbox) */}
        {phase === 'playing' && (
          <button
            id="laser-dot"
            type="button"
            aria-label="Catch laser dot"
            onPointerDown={handleCatchDot}
            style={{ left: `${dotPos.x}%`, top: `${dotPos.y}%` }}
            className="absolute -translate-x-1/2 -translate-y-1/2 z-20 w-24 h-24 rounded-full flex items-center justify-center cursor-pointer touch-none active:scale-90 transition-all duration-150"
          >
            <span className="w-16 h-16 rounded-full bg-[#FB7185]/25 flex items-center justify-center">
              <span className="w-11 h-11 rounded-full bg-[#F43F5E]/55 flex items-center justify-center shadow-[0_0_24px_#F43F5E]">
                <span className="w-6 h-6 rounded-full bg-[#FF2D55] border-2 border-white shadow" />
              </span>
            </span>
          </button>
        )}
      </div>

      {phase === 'finished' && (
        <MiniGameResultCard
          gameTitle={`Laser Chase (${diffMeta.label})`}
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
