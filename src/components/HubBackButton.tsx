import { soundEngine } from '../audio/soundEngine'
import { navigateToGamesHub } from '../utils/hubNavigation'

interface HubBackButtonProps {
  className?: string
}

export function HubBackButton({ className = '' }: HubBackButtonProps) {
  const handleClick = () => {
    soundEngine.playButton()
    navigateToGamesHub()
  }

  return (
    <button
      id="btn-back-to-hub"
      type="button"
      onClick={handleClick}
      aria-label="Back to Games Hub"
      title="Back to Games Hub"
      className={`cozy-btn h-10 sm:h-11 px-2.5 sm:px-3 rounded-2xl bg-[#FFF6E5] border-2 border-[#DEC098] text-[#5B3A29] font-extrabold text-xs sm:text-sm inline-flex items-center gap-1 shadow-sm shrink-0 whitespace-nowrap ${className}`}
    >
      <span aria-hidden="true" className="text-sm sm:text-base leading-none">
        ←
      </span>
      <span>Hub</span>
    </button>
  )
}
