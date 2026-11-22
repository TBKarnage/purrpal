import { useEffect, useRef, useState } from 'react'
import { xpRequiredForLevel } from '../state/gameReducer'
import { STAGE_META, type GameState } from '../types/game'
import {
  FishBowlIcon,
  GearIcon,
  HeartIcon,
  PawCoinIcon,
  SparklesIcon,
} from './Icons'

interface StatusHudProps {
  gameState: GameState
  onOpenParentCorner: () => void
}

const HOLD_DURATION_MS = 3000

export function StatusHud({ gameState, onOpenParentCorner }: StatusHudProps) {
  const { cat, stats, inventory } = gameState
  const stageMeta = STAGE_META[cat.stage]
  const xpNeeded = xpRequiredForLevel(cat.level)
  const xpPercent = Math.min(100, Math.round((cat.xp / xpNeeded) * 100))

  // 3-second continuous press-and-hold gear ring for Parent Corner
  const [holdProgress, setHoldProgress] = useState(0)
  const [showHoldHint, setShowHoldHint] = useState(false)
  const holdRafRef = useRef<number | null>(null)
  const holdStartRef = useRef<number | null>(null)
  const hintTimerRef = useRef<number | null>(null)

  const cancelHold = (showShortTapHint = false) => {
    if (holdRafRef.current !== null) {
      cancelAnimationFrame(holdRafRef.current)
      holdRafRef.current = null
    }
    const elapsed = holdStartRef.current ? performance.now() - holdStartRef.current : 0
    holdStartRef.current = null
    setHoldProgress(0)

    if (showShortTapHint && elapsed > 0 && elapsed < HOLD_DURATION_MS) {
      setShowHoldHint(true)
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current)
      hintTimerRef.current = window.setTimeout(() => setShowHoldHint(false), 1800)
    }
  }

  const startHold = () => {
    cancelHold(false)
    setShowHoldHint(false)
    holdStartRef.current = performance.now()

    const tick = (now: number) => {
      if (holdStartRef.current === null) return
      const elapsed = now - holdStartRef.current
      const pct = Math.min(1, elapsed / HOLD_DURATION_MS)
      setHoldProgress(pct)
      if (pct >= 1) {
        holdStartRef.current = null
        holdRafRef.current = null
        setHoldProgress(0)
        onOpenParentCorner()
        return
      }
      holdRafRef.current = requestAnimationFrame(tick)
    }
    holdRafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    return () => {
      if (holdRafRef.current !== null) cancelAnimationFrame(holdRafRef.current)
      if (hintTimerRef.current !== null) window.clearTimeout(hintTimerRef.current)
    }
  }, [])

  const ringRadius = 19
  const ringCircumference = 2 * Math.PI * ringRadius
  const ringOffset = ringCircumference * (1 - holdProgress)

  return (
    <header
      id="status-hud"
      className="relative z-30 w-full px-3 sm:px-5 pt-2.5 sm:pt-3 pb-1 shrink-0"
    >
      <div className="mx-auto max-w-5xl rounded-[1.75rem] bg-[#FFFDF8]/92 backdrop-blur-md border-[3px] border-[#E7C9A4] shadow-[0_8px_20px_rgba(91,58,41,0.1)] px-3 sm:px-4 py-2 flex flex-wrap md:flex-nowrap items-center justify-between gap-2 sm:gap-2.5">
        {/* Cat Name + Level & XP */}
        <div className="flex items-center gap-2 min-w-[138px] shrink-0">
          <div
            id="hud-level-badge"
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border-[3px] border-[#5B3A29] flex flex-col items-center justify-center leading-none shadow-sm shrink-0"
            style={{ backgroundColor: stageMeta.badgeColor }}
          >
            <span className="text-[10px] font-black uppercase text-[#5B3A29]/80">Lv</span>
            <span className="text-lg sm:text-xl font-black text-[#5B3A29]">{cat.level}</span>
          </div>
          <div className="flex flex-col min-w-[84px]">
            <div className="flex items-center gap-1.5">
              <h1
                id="hud-cat-name"
                className="text-base sm:text-lg font-extrabold text-[#5B3A29] leading-tight truncate max-w-[110px]"
              >
                {cat.name}
              </h1>
              <span
                id="hud-stage-label"
                className="hidden lg:inline-block text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#FFF2D6] text-[#8A5A36] border border-[#E6C596]"
              >
                {stageMeta.label}
              </span>
            </div>
            {/* XP Bar */}
            <div className="mt-1 flex items-center gap-1.5">
              <div className="w-20 lg:w-24 h-3 rounded-full bg-[#F2E2CC] border-2 border-[#D4B48B] overflow-hidden">
                <div
                  id="hud-xp-fill"
                  className="h-full rounded-full bg-gradient-to-r from-[#FBBF24] to-[#F59E0B] transition-all duration-300"
                  style={{ width: `${xpPercent}%` }}
                />
              </div>
              <span id="hud-xp-text" className="text-[11px] font-extrabold text-[#8A6552] whitespace-nowrap">
                {cat.xp}/{xpNeeded}
              </span>
            </div>
          </div>
        </div>

        {/* 3 Chunky Care Stat Meters */}
        <div className="flex items-center gap-2 lg:gap-3 flex-1 justify-center order-3 md:order-2 w-full md:w-auto min-w-0">
          <StatBar
            id="stat-hunger"
            label="Food"
            value={stats.hunger}
            barClass="from-[#FBBF24] to-[#F59E0B]"
            trackClass="bg-[#FEF3C7] border-[#EAB308]"
            icon={<FishBowlIcon className="w-6 h-6 lg:w-7 lg:h-7 shrink-0" />}
          />
          <StatBar
            id="stat-cleanliness"
            label="Clean"
            value={stats.cleanliness}
            barClass="from-[#7DD3FC] to-[#0EA5E9]"
            trackClass="bg-[#E0F2FE] border-[#38BDF8]"
            icon={<SparklesIcon className="w-6 h-6 lg:w-7 lg:h-7 shrink-0" />}
          />
          <StatBar
            id="stat-happiness"
            label="Happy"
            value={stats.happiness}
            barClass="from-[#FDA4AF] to-[#FB7185]"
            trackClass="bg-[#FFE4E6] border-[#FB7185]"
            icon={<HeartIcon className="w-6 h-6 lg:w-7 lg:h-7 shrink-0" />}
          />
        </div>

        {/* Paw Coins + Hold-to-Open Parent Corner Gear */}
        <div className="flex items-center gap-1.5 sm:gap-2 order-2 md:order-3 shrink-0">
          <div
            id="hud-coins"
            className="h-11 px-3 rounded-2xl bg-[#FFF4CC] border-[3px] border-[#E5B84B] flex items-center gap-1.5 shadow-sm"
            aria-label={`${inventory.coins} Paw Coins`}
          >
            <PawCoinIcon className="w-6 h-6 shrink-0" />
            <span className="text-lg font-black text-[#784418] tabular-nums">
              {inventory.coins}
            </span>
          </div>

          <div className="relative">
            <button
              id="btn-parent-corner"
              type="button"
              aria-label="Parent Corner — hold 3 seconds to open"
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture?.(e.pointerId)
                startHold()
              }}
              onPointerUp={() => cancelHold(true)}
              onPointerCancel={() => cancelHold(false)}
              onPointerLeave={() => cancelHold(false)}
              className="relative w-12 h-12 rounded-2xl bg-[#FFF6E5] border-2 border-[#DEC098] text-[#8A6552] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              <svg
                viewBox="0 0 44 44"
                className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                aria-hidden="true"
              >
                <circle
                  cx="22"
                  cy="22"
                  r={ringRadius}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  opacity={holdProgress > 0 ? 1 : 0}
                />
              </svg>
              <GearIcon className="w-6 h-6" />
            </button>

            {showHoldHint && (
              <div className="absolute right-0 top-14 z-50 whitespace-nowrap rounded-xl bg-[#5B3A29] text-[#FFFDF8] text-xs font-extrabold px-3 py-1.5 shadow-lg">
                Hold 3s for Parents
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

function StatBar({
  id,
  label,
  value,
  barClass,
  trackClass,
  icon,
}: {
  id: string
  label: string
  value: number
  barClass: string
  trackClass: string
  icon: React.ReactNode
}) {
  const isLow = value < 30
  return (
    <div
      id={id}
      data-value={value}
      className={`flex items-center gap-1.5 flex-1 min-w-[92px] max-w-[168px] ${
        isLow ? 'animate-gentle-pulse' : ''
      }`}
      aria-label={`${label} ${value}%`}
    >
      {icon}
      <div className="flex flex-col flex-1 min-w-0">
        <div className="flex items-center justify-between text-[11px] font-extrabold text-[#7D563E] leading-none mb-1 px-0.5">
          <span>{label}</span>
          <span className="tabular-nums">{value}%</span>
        </div>
        <div className={`h-4 rounded-full border-2 overflow-hidden p-0.5 ${trackClass}`}>
          <div
            className={`h-full rounded-full bg-gradient-to-r ${barClass} transition-all duration-300`}
            style={{ width: `${Math.max(12, value)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
