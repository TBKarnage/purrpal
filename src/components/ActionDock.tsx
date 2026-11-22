import {
  BroomIcon,
  FishBowlIcon,
  PlayYarnIcon,
  StyleCrownIcon,
} from './Icons'

export type ActiveDockPanel = 'none' | 'feed' | 'clean'

interface ActionDockProps {
  activePanel: ActiveDockPanel
  messCount: number
  tutorialHighlight?: 'feed' | 'play' | null
  onToggleFeed: () => void
  onToggleClean: () => void
  onOpenPlay: () => void
  onOpenStyle: () => void
}

export function ActionDock({
  activePanel,
  messCount,
  tutorialHighlight = null,
  onToggleFeed,
  onToggleClean,
  onOpenPlay,
  onOpenStyle,
}: ActionDockProps) {
  return (
    <nav
      id="action-dock"
      aria-label="Kitty actions"
      className="relative z-30 w-full px-3 sm:px-5 pb-3 pt-1 shrink-0"
    >
      <div className="mx-auto max-w-2xl rounded-[2rem] bg-[#FFFDF8]/95 backdrop-blur-md border-[3px] border-[#E7C9A4] shadow-[0_12px_28px_rgba(91,58,41,0.16)] p-2 sm:p-2.5 grid grid-cols-4 gap-2 sm:gap-3">
        <DockButton
          id="dock-feed"
          label="Feed"
          active={activePanel === 'feed'}
          highlight={tutorialHighlight === 'feed'}
          colorClass="bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]"
          activeClass="bg-[#FDE68A] border-[#D97706] ring-4 ring-[#FBBF24]/50"
          icon={<FishBowlIcon className="w-9 h-9 sm:w-10 sm:h-10" />}
          onClick={onToggleFeed}
        />

        <DockButton
          id="dock-clean"
          label="Clean"
          active={activePanel === 'clean'}
          badgeCount={messCount > 0 ? messCount : undefined}
          colorClass="bg-[#E0F2FE] border-[#38BDF8] text-[#075985]"
          activeClass="bg-[#BAE6FD] border-[#0284C7] ring-4 ring-[#38BDF8]/50"
          icon={<BroomIcon className="w-9 h-9 sm:w-10 sm:h-10" />}
          onClick={onToggleClean}
        />

        <DockButton
          id="dock-play"
          label="Play"
          active={false}
          highlight={tutorialHighlight === 'play'}
          colorClass="bg-[#FFE4E6] border-[#FB7185] text-[#9F1239]"
          activeClass="bg-[#FECDD3] border-[#E11D48]"
          icon={<PlayYarnIcon className="w-9 h-9 sm:w-10 sm:h-10" />}
          onClick={onOpenPlay}
        />

        <DockButton
          id="dock-style"
          label="Style"
          active={false}
          colorClass="bg-[#EDE9FE] border-[#A78BFA] text-[#5B21B6]"
          activeClass="bg-[#DDD6FE] border-[#7C3AED]"
          icon={<StyleCrownIcon className="w-9 h-9 sm:w-10 sm:h-10" />}
          onClick={onOpenStyle}
        />
      </div>
    </nav>
  )
}

function DockButton({
  id,
  label,
  icon,
  active,
  highlight = false,
  badgeCount,
  colorClass,
  activeClass,
  onClick,
}: {
  id: string
  label: string
  icon: React.ReactNode
  active: boolean
  highlight?: boolean
  badgeCount?: number
  colorClass: string
  activeClass: string
  onClick: () => void
}) {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`cozy-btn relative min-h-[72px] sm:min-h-[80px] rounded-[1.4rem] border-[3px] border-b-[5px] flex flex-col items-center justify-center gap-0.5 px-2 py-1.5 ${
        active ? activeClass : colorClass
      } ${highlight ? 'ring-4 ring-[#FB7185] animate-glow-ring' : ''}`}
    >
      {badgeCount !== undefined && (
        <span
          id={`${id}-badge`}
          className="absolute -top-2 -right-1.5 min-w-[26px] h-[26px] px-1.5 rounded-full bg-[#FB7185] border-2 border-[#FFFDF8] text-white text-xs font-black flex items-center justify-center shadow"
        >
          {badgeCount}
        </span>
      )}
      {icon}
      <span className="text-sm sm:text-base font-black tracking-tight leading-none">
        {label}
      </span>
    </button>
  )
}
