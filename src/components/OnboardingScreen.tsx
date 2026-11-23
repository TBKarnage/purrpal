import { useState } from 'react'
import { COAT_OPTIONS, pickRandomCatNames, type CoatStyle } from '../types/game'
import { CatSprite } from './CatSprite'
import { HeartIcon, ShuffleDiceIcon, SparklesIcon } from './Icons'

interface OnboardingScreenProps {
  onComplete: (name: string, coat: CoatStyle) => void
  onInteract?: () => void
}

export function OnboardingScreen({ onComplete, onInteract }: OnboardingScreenProps) {
  const [selectedCoat, setSelectedCoat] = useState<CoatStyle>('tabby')
  const [suggestedNames, setSuggestedNames] = useState<string[]>(() =>
    pickRandomCatNames(6),
  )
  const [selectedName, setSelectedName] = useState<string>(
    () => suggestedNames[0] ?? 'Mochi',
  )
  const [customName, setCustomName] = useState<string>('')
  const [bounceKey, setBounceKey] = useState<number>(0)

  const activeName = customName.trim() || selectedName

  const handleCoatSelect = (coat: CoatStyle) => {
    onInteract?.()
    setSelectedCoat(coat)
    setBounceKey((k) => k + 1)
  }

  const handleNameSelect = (name: string) => {
    onInteract?.()
    setSelectedName(name)
    setCustomName('')
    setBounceKey((k) => k + 1)
  }

  const handleShuffleNames = () => {
    onInteract?.()
    const fresh = pickRandomCatNames(6, suggestedNames)
    setSuggestedNames(fresh)
    if (!customName.trim()) {
      setSelectedName(fresh[0])
    }
    setBounceKey((k) => k + 1)
  }

  const handleSubmit = () => {
    onInteract?.()
    onComplete(activeName, selectedCoat)
  }

  return (
    <main
      id="onboarding-screen"
      className="app-shell bg-gradient-to-b from-[#FFF6E5] via-[#FFECD0] to-[#F7D7B2] items-center justify-center p-4 sm:p-6"
    >
      {/* Decorative soft sunlight glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 20%, rgba(255,253,245,0.95) 0%, rgba(255,246,229,0) 60%)',
        }}
      />

      <div className="relative z-10 w-full max-w-4xl max-h-full rounded-[2rem] sm:rounded-[2.25rem] bg-[#FFFDF8]/95 border-4 border-[#E7C69C] shadow-[0_18px_40px_rgba(91,58,41,0.14)] p-4 sm:p-7 flex flex-col lg:flex-row items-center gap-3.5 sm:gap-5 lg:gap-8 overflow-y-auto lg:overflow-hidden">
        {/* Left: Live Kitten Preview */}
        <section className="flex flex-col items-center justify-center lg:w-5/12 shrink-0">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#FFF2D6] border-2 border-[#EBD0A7] mb-1.5 sm:mb-2">
            <SparklesIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-extrabold tracking-wide text-[#8A5A36] uppercase">
              PurrPal
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#5B3A29] tracking-tight text-center">
            Pick Your Kitty!
          </h1>

          <div
            key={bounceKey}
            className="relative mt-2 flex items-center justify-center w-32 h-32 sm:w-44 sm:h-44 lg:w-56 lg:h-56 rounded-full bg-gradient-to-b from-[#FFF7E6] to-[#FFE7C4] border-4 border-[#F2D5AC] shadow-inner"
          >
            <CatSprite
              coat={selectedCoat}
              stage="kitten"
              mood="thriving"
              animation="idle"
              showThoughtBubble={false}
              className="w-28 h-28 sm:w-40 sm:h-40 lg:w-52 lg:h-52"
            />
          </div>

          <div className="mt-2 sm:mt-3 px-4 sm:px-5 py-1 sm:py-1.5 rounded-2xl bg-[#FFF4E0] border-2 border-[#ECCEA3] text-xl sm:text-2xl font-extrabold text-[#5B3A29]">
            {activeName}
          </div>
        </section>

        {/* Right: Coat & Random/Custom Name Picker */}
        <section className="flex flex-col gap-4 w-full lg:w-7/12">
          {/* Coat Picker */}
          <div>
            <p className="text-base font-extrabold text-[#7D563E] mb-2">
              1. Fur Color
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COAT_OPTIONS.map((coat) => {
                const isSelected = selectedCoat === coat.id
                return (
                  <button
                    key={coat.id}
                    id={`coat-${coat.id}`}
                    type="button"
                    onClick={() => handleCoatSelect(coat.id)}
                    aria-pressed={isSelected}
                    className={`cozy-btn min-h-[72px] rounded-2xl p-2.5 flex flex-col items-center justify-center gap-1.5 border-[3px] ${
                      isSelected
                        ? 'bg-[#FFF3D6] border-[#F59E0B] shadow-[0_4px_0_#D97706]'
                        : 'bg-[#FFFDF8] border-[#E7CFAF] shadow-[0_4px_0_#D8BA94]'
                    }`}
                  >
                    <span className="flex items-center -space-x-1.5">
                      <span
                        className="w-6 h-6 rounded-full border-2 border-[#5B3A29]"
                        style={{ backgroundColor: coat.primary }}
                      />
                      <span
                        className="w-5 h-5 rounded-full border-2 border-[#5B3A29]"
                        style={{ backgroundColor: coat.secondary }}
                      />
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-[#5B3A29] leading-tight">
                      {coat.shortLabel}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Random Suggested Names + Shuffle Button + Custom Input */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <p className="text-base font-extrabold text-[#7D563E]">
                2. Kitty Name
              </p>
              <button
                id="btn-shuffle-names"
                type="button"
                onClick={handleShuffleNames}
                className="cozy-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FFF3D6] border-2 border-[#F59E0B] text-sm font-black text-[#92400E] shadow-[0_2px_0_#D97706]"
              >
                <ShuffleDiceIcon className="w-4 h-4" />
                <span>New Names</span>
              </button>
            </div>
            <div id="suggested-names-grid" className="grid grid-cols-3 gap-2.5">
              {suggestedNames.map((preset, idx) => {
                const isSelected = !customName.trim() && selectedName === preset
                return (
                  <button
                    key={`${preset}-${idx}`}
                    id={`name-option-${idx}`}
                    data-name-choice={preset}
                    type="button"
                    onClick={() => handleNameSelect(preset)}
                    aria-pressed={isSelected}
                    className={`cozy-btn min-h-[58px] sm:min-h-[64px] rounded-2xl px-2 font-extrabold text-base sm:text-lg border-[3px] truncate ${
                      isSelected
                        ? 'bg-[#FFE4E8] border-[#FB7185] text-[#9F1239] shadow-[0_4px_0_#E11D48]'
                        : 'bg-[#FFFDF8] border-[#E7CFAF] text-[#5B3A29] shadow-[0_4px_0_#D8BA94]'
                    }`}
                  >
                    {preset}
                  </button>
                )
              })}
            </div>

            <input
              id="input-custom-name"
              type="text"
              maxLength={16}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Or type your own name..."
              aria-label="Custom kitty name"
              className="mt-2.5 w-full min-h-[54px] rounded-2xl bg-[#FFF9EE] border-[3px] border-[#E5C9A3] px-4 text-lg font-bold text-[#5B3A29] placeholder:text-[#B59277] focus:outline-none focus:border-[#F59E0B]"
            />
          </div>

          {/* Start CTA */}
          <button
            id="btn-start-purrpal"
            type="button"
            onClick={handleSubmit}
            className="cozy-btn mt-1 w-full min-h-[68px] rounded-2xl bg-gradient-to-b from-[#FF8B7B] to-[#FB7185] border-b-[5px] border-[#D1425B] text-white text-2xl font-extrabold flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(251,113,133,0.35)]"
          >
            <HeartIcon className="w-8 h-8" />
            <span>Adopt {activeName}!</span>
          </button>
        </section>
      </div>
    </main>
  )
}
