import {
  ACCESSORY_CATALOG,
  DECOR_CATALOG,
  FOOD_CATALOG,
  MINIGAME_CATALOG,
  STAGE_META,
  STYLE_CATEGORIES,
  type CatStyleConfig,
  type CoatStyle,
  type LevelUpEvent,
} from '../types/game'
import { CatSprite } from './CatSprite'
import {
  AccessoryPreviewIcon,
  DecorPreviewIcon,
  FoodIcon,
  PawCoinIcon,
  PlayYarnIcon,
  StarIcon,
  StyleCrownIcon,
} from './Icons'

interface LevelUpModalProps {
  catName: string
  coat: CoatStyle
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  event: LevelUpEvent
  onDismiss: () => void
}

const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: `${(i * 3.7 + (i % 3) * 2) % 98}%`,
  delay: `${(i % 7) * 0.22}s`,
  duration: `${2.2 + (i % 5) * 0.35}s`,
  color: ['#FB7185', '#FBBF24', '#38BDF8', '#34D399', '#A78BFA', '#F97316'][i % 6],
  size: 10 + (i % 4) * 3,
}))

export function LevelUpModal({
  catName,
  coat,
  equippedAccessory,
  catStyle,
  event,
  onDismiss,
}: LevelUpModalProps) {
  const stageMeta = STAGE_META[event.newStage]

  const hasUnlocks =
    event.unlockedCategories.length > 0 ||
    event.unlockedAccessories.length > 0 ||
    event.unlockedDecor.length > 0 ||
    event.unlockedFoods.length > 0 ||
    event.unlockedMiniGames.length > 0 ||
    event.bonusCoins > 0

  return (
    <div
      id="level-up-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Level Up Celebration"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#5B3A29]/45 backdrop-blur-sm p-4 overflow-hidden"
    >
      {/* Full-screen Confetti Burst */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {CONFETTI_PIECES.map((c) => (
          <span
            key={c.id}
            className="absolute -top-6 rounded-sm animate-confetti"
            style={{
              left: c.left,
              width: `${c.size}px`,
              height: `${c.size * 0.65}px`,
              backgroundColor: c.color,
              animationDelay: c.delay,
              animationDuration: c.duration,
            }}
          />
        ))}
      </div>

      {/* Celebration Card */}
      <div className="relative z-10 w-full max-w-lg rounded-[2.25rem] bg-[#FFFDF8] border-4 border-[#FBBF24] shadow-[0_22px_50px_rgba(91,58,41,0.3)] p-6 sm:p-7 flex flex-col items-center text-center gap-4">
        {/* Top Ribbon */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FEF3C7] border-2 border-[#F59E0B]">
          <StarIcon className="w-6 h-6" />
          <span className="text-base font-black text-[#92400E] tracking-wide uppercase">
            {event.evolved ? `${catName} Grew Up!` : 'Level Up!'}
          </span>
          <StarIcon className="w-6 h-6" />
        </div>

        {/* Big Level Badge */}
        <h2 className="text-3xl sm:text-4xl font-black text-[#5B3A29] leading-none">
          Level {event.newLevel}!
        </h2>

        {/* Kitty Showcase */}
        <div className="relative flex flex-col items-center">
          <div className="w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-b from-[#FFF6D6] to-[#FFE2B5] border-4 border-[#F6CA7A] flex items-center justify-center shadow-inner">
            <CatSprite
              coat={coat}
              stage={event.newStage}
              mood="thriving"
              animation="idle"
              equippedAccessory={equippedAccessory}
              style={catStyle}
              showThoughtBubble={false}
              className="w-40 h-40 sm:w-44 sm:h-44"
            />
          </div>
          {event.evolved && (
            <div
              id="evolution-stage-pill"
              className="mt-2 px-4 py-1 rounded-full border-2 border-[#5B3A29] font-black text-base text-[#5B3A29] shadow-sm"
              style={{ backgroundColor: stageMeta.badgeColor }}
            >
              {stageMeta.label} — {stageMeta.tagline}
            </div>
          )}
        </div>

        {/* Newly Unlocked Categories & Gifts */}
        {hasUnlocks && (
          <div className="w-full rounded-2xl bg-[#FFF7E6] border-2 border-[#EDD0A3] p-3">
            <p className="text-xs font-black uppercase tracking-wider text-[#9A6B42] mb-2">
              New Unlocks!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {event.unlockedCategories.map((catId) => {
                const category = STYLE_CATEGORIES.find((c) => c.id === catId)
                if (!category) return null
                return (
                  <div
                    key={`cat-${catId}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EDE9FE] border-2 border-[#A78BFA] text-sm font-black text-[#5B21B6]"
                  >
                    <StyleCrownIcon className="w-6 h-6" />
                    <span>{category.label}</span>
                  </div>
                )
              })}

              {event.unlockedAccessories.slice(0, 4).map((id) => {
                const item = ACCESSORY_CATALOG.find((a) => a.id === id)
                return (
                  <div
                    key={`acc-${id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF8] border-2 border-[#DDD6FE] text-sm font-extrabold text-[#5B21B6]"
                  >
                    <AccessoryPreviewIcon id={id} className="w-7 h-7" />
                    <span>{item?.label ?? id}</span>
                  </div>
                )
              })}

              {event.unlockedDecor.map((id) => {
                const item = DECOR_CATALOG.find((d) => d.id === id)
                return (
                  <div
                    key={`dec-${id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF8] border-2 border-[#BAE6FD] text-sm font-extrabold text-[#075985]"
                  >
                    <DecorPreviewIcon id={id} className="w-7 h-7" />
                    <span>{item?.label ?? id}</span>
                  </div>
                )
              })}

              {event.unlockedFoods.map((id) => {
                const item = FOOD_CATALOG.find((f) => f.id === id)
                if (!item) return null
                return (
                  <div
                    key={`food-${id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF8] border-2 border-[#FDE68A] text-sm font-extrabold text-[#92400E]"
                  >
                    <FoodIcon foodId={item.id} className="w-7 h-7" />
                    <span>{item.label}</span>
                  </div>
                )
              })}

              {event.unlockedMiniGames.map((id) => {
                const game = MINIGAME_CATALOG.find((g) => g.id === id)
                return (
                  <div
                    key={`game-${id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF8] border-2 border-[#FECDD3] text-sm font-extrabold text-[#9F1239]"
                  >
                    <PlayYarnIcon className="w-7 h-7" />
                    <span>{game?.label ?? id}</span>
                  </div>
                )
              })}

              {event.bonusCoins > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFDF8] border-2 border-[#FDE047] text-sm font-extrabold text-[#854D0E]">
                  <PawCoinIcon className="w-6 h-6" />
                  <span>+{event.bonusCoins} Coins</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Big Yay! Dismiss Button */}
        <button
          id="btn-levelup-yay"
          type="button"
          onClick={onDismiss}
          className="cozy-btn w-full min-h-[68px] rounded-2xl bg-gradient-to-b from-[#34D399] to-[#10B981] border-b-[5px] border-[#047857] text-white text-2xl font-black shadow-[0_8px_20px_rgba(16,185,129,0.35)]"
        >
          Yay!
        </button>
      </div>
    </div>
  )
}
