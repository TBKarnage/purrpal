import { useCallback, useEffect, useRef, useState } from 'react'
import { CatSprite } from '../components/CatSprite'
import { StarIcon } from '../components/Icons'
import type { CatStyleConfig, CoatStyle, GrowthStage } from '../types/game'
import { MiniGameResultCard } from './MiniGameResultCard'

const GAME_DURATION_SEC = 30

interface BubblePopProps {
  catName: string
  coat: CoatStyle
  stage: GrowthStage
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  onPopSound?: (comboIndex: number) => void
  onFinish: (score: number) => void
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

const BUBBLE_TINTS = [
  'bg-[#BAE6FD]/75 border-[#38BDF8]',
  'bg-[#FBCFE8]/75 border-[#F472B6]',
  'bg-[#DDD6FE]/75 border-[#A78BFA]',
  'bg-[#A7F3D0]/75 border-[#34D399]',
]

function makeBubble(id: number, startY = 104): BubbleEntity {
  const golden = Math.random() < 0.2
  return {
    id,
    x: 12 + Math.random() * 76,
    y: startY,
    size: golden ? 86 : 78 + Math.floor(Math.random() * 18),
    speed: golden ? 18 : 13 + Math.random() * 9,
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
  onPopSound,
  onFinish,
  onExit,
}: BubblePopProps) {
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_SEC)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [bubbles, setBubbles] = useState<BubbleEntity[]>(() => [
    makeBubble(1, 68),
    makeBubble(2, 82),
    makeBubble(3, 96),
  ])
  const [pops, setPops] = useState<PopRing[]>([])
  const [catX, setCatX] = useState(50)
  const [batting, setBatting] = useState(false)

  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const nextIdRef = useRef(10)
  const finishedRef = useRef(false)

  const restart = useCallback(() => {
    scoreRef.current = 0
    comboRef.current = 0
    finishedRef.current = false
    setScore(0)
    setTimeLeft(GAME_DURATION_SEC)
    setFinished(false)
    setPops([])
    setBubbles([makeBubble(nextIdRef.current++, 68), makeBubble(nextIdRef.current++, 85)])
  }, [])

  // 30-second countdown timer
  useEffect(() => {
    if (finished) return
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          if (!finishedRef.current) {
            finishedRef.current = true
            setFinished(true)
            onFinish(scoreRef.current)
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [finished, onFinish])

  // Gentle bubble physics + spawning loop
  useEffect(() => {
    if (finished) return
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

        if (spawnAcc >= 750 && moved.length < 8) {
          spawnAcc = 0
          moved.push(makeBubble(nextIdRef.current++))
        }
        return moved
      })
    }, stepMs)

    return () => window.clearInterval(loop)
  }, [finished])

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

  return (
    <div
      id="game-bubble-pop"
      className="fixed inset-0 z-40 app-shell bg-gradient-to-b from-[#E0F7FF] via-[#F0F9FF] to-[#FFF6E5]"
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
        {!finished &&
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
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-20 bg-[#E6BE8A] border-t-4 border-[#C89B67]" />
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

      {finished && (
        <MiniGameResultCard
          gameTitle="Bubble Pop"
          score={score}
          catName={catName}
          coat={coat}
          stage={stage}
          equippedAccessory={equippedAccessory}
          catStyle={catStyle}
          onPlayAgain={restart}
          onBackHome={onExit}
        />
      )}
    </div>
  )
}
