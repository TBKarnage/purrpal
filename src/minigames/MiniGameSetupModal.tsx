import { LockIcon } from '../components/Icons'
import { isMiniGameDifficultyUnlocked } from '../state/gameReducer'
import type { MiniGameDifficulty } from '../types/game'

export interface PlayAreaOption {
  id: string
  name: string
  tagline: string
  accent: string
  skyTop: string
  skyBottom: string
  groundColor: string
  icon: React.ReactNode
}

interface MiniGameSetupModalProps {
  rootId: string
  title: string
  subtitle: string
  accentBorder: string
  iconBg: string
  iconBorder: string
  icon: React.ReactNode
  difficulties: ReadonlyArray<{
    id: MiniGameDifficulty
    label: string
    hint: string
    accent: string
    badgeBg: string
    reqText: string
  }>
  selectedDiff: MiniGameDifficulty
  beatenDifficulties: readonly MiniGameDifficulty[]
  onSelectDiff: (diff: MiniGameDifficulty) => void
  areas: readonly PlayAreaOption[]
  onStartArea: (areaId: string, diff: MiniGameDifficulty) => void
  onExit: () => void
  onButtonSound?: () => void
}

export function MiniGameSetupModal({
  rootId,
  title,
  subtitle,
  accentBorder,
  iconBg,
  iconBorder,
  icon,
  difficulties,
  selectedDiff,
  beatenDifficulties,
  onSelectDiff,
  areas,
  onStartArea,
  onExit,
  onButtonSound,
}: MiniGameSetupModalProps) {
  return (
    <div
      id={rootId}
      className="fixed inset-0 z-40 app-shell bg-gradient-to-b from-[#FFF9EC] via-[#FFF8EC] to-[#FFE8CC] items-center justify-center p-3 sm:p-6"
    >
      <div
        className="w-full max-w-4xl max-h-[94dvh] overflow-y-auto rounded-[2rem] sm:rounded-[2.25rem] bg-[#FFFDF8]/96 border-4 shadow-[0_22px_50px_rgba(91,58,41,0.2)] p-4 sm:p-6 flex flex-col gap-4"
        style={{ borderColor: accentBorder }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-11 h-11 rounded-2xl border-2 flex items-center justify-center shrink-0"
              style={{ backgroundColor: iconBg, borderColor: iconBorder }}
            >
              {icon}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-black text-[#5B3A29] leading-tight">
                {title}
              </h2>
              <p className="text-xs sm:text-sm font-bold text-[#8A6552]">
                {subtitle}
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

        {/* 1. Difficulty Picker (Easy -> Medium -> Hard sequential unlock) */}
        <div>
          <p className="text-sm sm:text-base font-black text-[#7D563E] mb-2">
            1. Difficulty
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {difficulties.map((diff) => {
              const unlocked = isMiniGameDifficultyUnlocked(beatenDifficulties, diff.id)
              const beaten = beatenDifficulties.includes(diff.id)
              const selected = selectedDiff === diff.id

              return (
                <button
                  key={diff.id}
                  id={`diff-${diff.id}`}
                  type="button"
                  disabled={!unlocked}
                  onClick={() => {
                    onButtonSound?.()
                    onSelectDiff(diff.id)
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
                      {diff.hint}
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

        {/* 2. Play Area Picker */}
        <div>
          <p className="text-sm sm:text-base font-black text-[#7D563E] mb-2">
            2. Pick Where to Play
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3.5">
            {areas.map((area) => (
              <button
                key={area.id}
                id={`area-choice-${area.id}`}
                type="button"
                onClick={() => onStartArea(area.id, selectedDiff)}
                className="cozy-btn rounded-[1.5rem] border-[3px] p-3 sm:p-4 bg-[#FFFDF8] flex items-center gap-3 text-left shadow-[0_4px_0_rgba(91,58,41,0.14)]"
                style={{ borderColor: area.accent }}
              >
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-[#E7CFAF] flex items-center justify-center shrink-0 overflow-hidden"
                  style={{
                    background: `linear-gradient(180deg, ${area.skyTop} 0%, ${area.groundColor} 100%)`,
                  }}
                >
                  {area.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-base sm:text-lg font-black text-[#5B3A29]">
                    {area.name}
                  </div>
                  <p className="text-xs font-bold text-[#8A6552]">{area.tagline}</p>
                  <span
                    className="inline-block mt-1.5 text-[11px] font-black px-2.5 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: area.accent }}
                  >
                    Play Here!
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
