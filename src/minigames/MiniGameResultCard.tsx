import { CatSprite } from '../components/CatSprite'
import { HeartIcon, PawCoinIcon, StarIcon } from '../components/Icons'
import { getMiniGameRewards } from '../state/gameReducer'
import type { CatStyleConfig, CoatStyle, GrowthStage } from '../types/game'

interface MiniGameResultCardProps {
  gameTitle: string
  score: number
  catName: string
  coat: CoatStyle
  stage: GrowthStage
  equippedAccessory: string | null
  catStyle?: CatStyleConfig
  onPlayAgain: () => void
  onBackHome: () => void
}

export function MiniGameResultCard({
  gameTitle,
  score,
  catName,
  coat,
  stage,
  equippedAccessory,
  catStyle,
  onPlayAgain,
  onBackHome,
}: MiniGameResultCardProps) {
  const rewards = getMiniGameRewards(score)
  const stars = score >= 12 ? 3 : score >= 5 ? 2 : 1

  return (
    <div
      id="minigame-result-card"
      role="dialog"
      aria-modal="true"
      aria-label={`${gameTitle} complete`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#5B3A29]/45 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-[2.25rem] bg-[#FFFDF8] border-4 border-[#FBBF24] shadow-[0_22px_50px_rgba(91,58,41,0.3)] p-6 flex flex-col items-center text-center gap-4">
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <StarIcon
              key={i}
              className={`w-10 h-10 ${i <= stars ? 'opacity-100 scale-105' : 'opacity-30'}`}
            />
          ))}
        </div>

        <div>
          <p className="text-sm font-black uppercase tracking-wider text-[#B45309]">
            {gameTitle}
          </p>
          <h2 className="text-3xl font-black text-[#5B3A29]">
            {score >= 10 ? 'Purr-fect!' : 'Great Job!'}
          </h2>
          <p id="minigame-final-score" className="text-lg font-extrabold text-[#8A6552] mt-0.5">
            Score: {score}
          </p>
        </div>

        <div className="w-36 h-36 rounded-full bg-gradient-to-b from-[#FFF6D6] to-[#FFE2B5] border-4 border-[#F6CA7A] flex items-center justify-center">
          <CatSprite
            coat={coat}
            stage={stage}
            mood="thriving"
            animation="petting"
            equippedAccessory={equippedAccessory}
            style={catStyle}
            showThoughtBubble={false}
            className="w-32 h-32"
          />
        </div>

        {/* Guaranteed Cozy Rewards */}
        <div className="w-full grid grid-cols-3 gap-2 rounded-2xl bg-[#FFF7E6] border-2 border-[#EDD0A3] p-3">
          <div className="flex flex-col items-center gap-0.5">
            <HeartIcon className="w-7 h-7" />
            <span className="text-base font-black text-[#9F1239]">
              +{rewards.happinessGain}
            </span>
            <span className="text-[11px] font-extrabold text-[#8A6552]">Happy</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <StarIcon className="w-7 h-7" />
            <span className="text-base font-black text-[#B45309]">
              +{rewards.xpGain}
            </span>
            <span className="text-[11px] font-extrabold text-[#8A6552]">XP</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <PawCoinIcon className="w-7 h-7" />
            <span className="text-base font-black text-[#92400E]">
              +{rewards.coinsGain}
            </span>
            <span className="text-[11px] font-extrabold text-[#8A6552]">Coins</span>
          </div>
        </div>

        <p className="text-sm font-bold text-[#8A6552]">
          {catName} had so much fun playing with you!
        </p>

        <div className="w-full grid grid-cols-2 gap-3">
          <button
            id="btn-minigame-again"
            type="button"
            onClick={onPlayAgain}
            className="cozy-btn min-h-[64px] rounded-2xl bg-[#FFF3D6] border-[3px] border-[#F59E0B] border-b-[5px] text-[#92400E] text-lg font-black"
          >
            Play Again
          </button>
          <button
            id="btn-minigame-home"
            type="button"
            onClick={onBackHome}
            className="cozy-btn min-h-[64px] rounded-2xl bg-gradient-to-b from-[#34D399] to-[#10B981] border-b-[5px] border-[#047857] text-white text-lg font-black"
          >
            Back Home
          </button>
        </div>
      </div>
    </div>
  )
}
