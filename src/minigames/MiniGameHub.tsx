import { LockIcon, PlayYarnIcon } from '../components/Icons'
import { MINIGAME_CATALOG, type GameState, type MiniGameId } from '../types/game'

interface MiniGameHubProps {
  gameState: GameState
  onSelectGame: (gameId: MiniGameId) => void
  onClose: () => void
}

export function MiniGameHub({
  gameState,
  onSelectGame,
  onClose,
}: MiniGameHubProps) {
  const { cat, settings } = gameState

  return (
    <div
      id="minigame-hub"
      role="dialog"
      aria-modal="true"
      aria-label="Play Mini-Games"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[#5B3A29]/45 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-[2rem] sm:rounded-[2.25rem] bg-[#FFFDF8] border-4 border-[#FDA4AF] shadow-[0_22px_50px_rgba(91,58,41,0.28)] p-4 sm:p-7 flex flex-col gap-3.5 sm:gap-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <PlayYarnIcon className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-black text-[#5B3A29] leading-none">
                Play Time!
              </h2>
              <p className="text-xs sm:text-sm font-bold text-[#8A6552] mt-1">
                Win Paw Coins, XP &amp; Happy Hearts!
              </p>
            </div>
          </div>

          <button
            id="btn-close-hub"
            type="button"
            onClick={onClose}
            className="cozy-btn shrink-0 min-h-[46px] sm:min-h-[56px] px-4 sm:px-6 rounded-2xl bg-[#FFF2D6] border-[3px] border-[#E7C69C] text-[#5B3A29] text-base sm:text-lg font-black"
          >
            Back
          </button>
        </div>

        {/* 4 Chunky Game Cards (2x2 on desktop/tablet) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {MINIGAME_CATALOG.map((game) => {
            const unlocked =
              settings.unlockAllMiniGames || cat.level >= game.unlockLevel

            return (
              <button
                key={game.id}
                id={`game-card-${game.id}`}
                type="button"
                disabled={!unlocked}
                onClick={() => onSelectGame(game.id)}
                className={`cozy-btn relative min-h-[120px] sm:min-h-[220px] rounded-[1.5rem] sm:rounded-[1.8rem] border-4 p-3 sm:p-4 flex flex-row sm:flex-col items-center justify-between gap-3 text-left sm:text-center ${
                  unlocked
                    ? 'bg-gradient-to-b from-[#FFFDF8] to-[#FFF4E3] shadow-[0_6px_0_rgba(91,58,41,0.16)]'
                    : 'bg-[#F5EFE6] border-[#DAC8B2] opacity-70 cursor-not-allowed'
                }`}
                style={unlocked ? { borderColor: game.accent } : undefined}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl sm:rounded-3xl bg-[#FFF8EC] border-[3px] border-[#EFE0C9] flex items-center justify-center shadow-inner">
                  <GameArt id={game.id} />
                </div>

                <div className="flex-1 sm:flex-none min-w-0">
                  <h3 className="text-lg sm:text-xl font-black text-[#5B3A29]">
                    {game.label}
                  </h3>
                  <p className="text-xs sm:text-sm font-bold text-[#8A6552] mt-0.5">
                    {game.shortHint}
                  </p>
                </div>

                {unlocked ? (
                  <span
                    className="shrink-0 sm:w-full px-4 sm:px-0 py-2 rounded-xl text-white text-sm sm:text-base font-black shadow-sm"
                    style={{ backgroundColor: game.accent }}
                  >
                    Play!
                  </span>
                ) : (
                  <span className="shrink-0 inline-flex items-center justify-center gap-1.5 sm:w-full px-3 sm:px-0 py-2 rounded-xl bg-[#E7DAC8] text-[#7D563E] text-xs sm:text-sm font-black">
                    <LockIcon className="w-4 h-4" />
                    Lv {game.unlockLevel}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function GameArt({ id }: { id: MiniGameId }) {
  if (id === 'hide_seek') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" aria-hidden="true">
        {/* Cozy pastel backdrop */}
        <circle cx="32" cy="32" r="26" fill="#DCFCE7" />
        {/* Peeking kitty ears & eyes */}
        <polygon points="20,30 24,16 31,26" fill="#FDBA74" stroke="#9A3412" strokeWidth="2" strokeLinejoin="round" />
        <polygon points="44,30 40,16 33,26" fill="#FDBA74" stroke="#9A3412" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="32" cy="32" r="11" fill="#FDBA74" stroke="#9A3412" strokeWidth="2" />
        <circle cx="28" cy="30" r="2" fill="#431407" />
        <circle cx="36" cy="30" r="2" fill="#431407" />
        {/* Cozy bush / cushion in front */}
        <ellipse cx="32" cy="44" rx="20" ry="11" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
        <circle cx="21" cy="41" r="7" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
        <circle cx="43" cy="41" r="7" fill="#4ADE80" stroke="#166534" strokeWidth="2" />
        <ellipse cx="32" cy="45" rx="18" ry="9" fill="#4ADE80" />
        {/* Little paws holding onto the bush */}
        <ellipse cx="26" cy="37" rx="3.2" ry="2.4" fill="#FED7AA" stroke="#9A3412" strokeWidth="1.5" />
        <ellipse cx="38" cy="37" rx="3.2" ry="2.4" fill="#FED7AA" stroke="#9A3412" strokeWidth="1.5" />
      </svg>
    )
  }

  if (id === 'laser') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" aria-hidden="true">
        {/* Soft pink glow backdrop */}
        <circle cx="48" cy="17" r="11" fill="#FFE4E6" />
        {/* Laser beam shooting from pointer tip to glowing dot */}
        <line
          x1="34"
          y1="30"
          x2="48"
          y2="17"
          stroke="#FB7185"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.45"
        />
        <line
          x1="34"
          y1="30"
          x2="48"
          y2="17"
          stroke="#F43F5E"
          strokeWidth="2.4"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        {/* Glowing laser dot + tiny sparkle */}
        <circle cx="49" cy="16" r="5" fill="#F43F5E" />
        <circle cx="48" cy="15" r="1.8" fill="#FFFFFF" />
        {/* Angled laser pointer wand */}
        <g transform="rotate(-43 24 40)">
          <rect
            x="9"
            y="34"
            width="28"
            height="12"
            rx="6"
            fill="#E2E8F0"
            stroke="#5B3A29"
            strokeWidth="2.6"
          />
          <rect
            x="33"
            y="35"
            width="7"
            height="10"
            rx="3"
            fill="#94A3B8"
            stroke="#5B3A29"
            strokeWidth="2.4"
          />
          {/* Pointer power button */}
          <rect
            x="21"
            y="31.5"
            width="7"
            height="4"
            rx="2"
            fill="#F43F5E"
            stroke="#5B3A29"
            strokeWidth="1.8"
          />
          {/* Cozy pastel grip stripe */}
          <rect x="13" y="37" width="6" height="6" rx="2" fill="#FDA4AF" />
        </g>
      </svg>
    )
  }
  if (id === 'bubbles') {
    return (
      <svg viewBox="0 0 64 64" className="w-16 h-16" aria-hidden="true">
        <circle cx="24" cy="36" r="16" fill="#BAE6FD" stroke="#38BDF8" strokeWidth="3" />
        <ellipse cx="19" cy="30" rx="4.5" ry="2.5" transform="rotate(-30 19 30)" fill="#FFF" />
        <circle cx="44" cy="22" r="11" fill="#FDE68A" stroke="#F59E0B" strokeWidth="3" />
        <ellipse cx="41" cy="18" rx="3" ry="1.8" transform="rotate(-30 41 18)" fill="#FFF" />
        <circle cx="44" cy="44" r="7" fill="#FBCFE8" stroke="#F472B6" strokeWidth="2.5" />
        <ellipse cx="42" cy="41.5" rx="2" ry="1.2" transform="rotate(-30 42 41.5)" fill="#FFF" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 64 64" className="w-16 h-16" aria-hidden="true">
      <path d="M16 32 C22 18 42 18 52 32 C42 46 22 46 16 32 Z" fill="#FB923C" stroke="#5B3A29" strokeWidth="3" strokeLinejoin="round" />
      <path d="M16 32 L6 22 L8 42 Z" fill="#FB923C" stroke="#5B3A29" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="42" cy="29" r="2.8" fill="#5B3A29" />
      <path d="M28 24 C32 29 32 35 28 40" fill="none" stroke="#FFEDD5" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}
