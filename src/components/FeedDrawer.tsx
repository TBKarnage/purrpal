import { useRef, useState } from 'react'
import { FOOD_CATALOG, type FoodItem, type GameState } from '../types/game'
import { FoodIcon, LockIcon, PawCoinIcon } from './Icons'

interface FeedDrawerProps {
  gameState: GameState
  onFeed: (foodId: FoodItem['id']) => void
  onClose: () => void
}

interface DragGhost {
  foodId: FoodItem['id']
  x: number
  y: number
}

export function FeedDrawer({ gameState, onFeed, onClose }: FeedDrawerProps) {
  const { cat, inventory } = gameState
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null)
  const dragOriginRef = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const canUseFood = (food: FoodItem) => {
    if (food.unlockLevel > cat.level) return false
    if (food.unlimited) return true
    const owned = inventory.treats[food.id] ?? 0
    return owned > 0 || inventory.coins >= food.cost
  }

  const handlePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    food: FoodItem,
  ) => {
    if (!canUseFood(food)) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    dragOriginRef.current = { x: e.clientX, y: e.clientY, moved: false }
  }

  const handlePointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
    food: FoodItem,
  ) => {
    const origin = dragOriginRef.current
    if (!origin) return
    const dist = Math.hypot(e.clientX - origin.x, e.clientY - origin.y)
    if (dist > 14) {
      origin.moved = true
      setDragGhost({ foodId: food.id, x: e.clientX, y: e.clientY })
    }
  }

  const handlePointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
    food: FoodItem,
  ) => {
    const origin = dragOriginRef.current
    dragOriginRef.current = null
    setDragGhost(null)
    if (!origin || !canUseFood(food)) return

    if (!origin.moved) {
      // Friendly single tap feeds immediately
      onFeed(food.id)
      return
    }

    // Drag-to-kitty check: forgiving bounding box around the cat sprite
    const catEl = document.getElementById('kitty-drop-zone')
    if (catEl) {
      const rect = catEl.getBoundingClientRect()
      const pad = 44
      const inside =
        e.clientX >= rect.left - pad &&
        e.clientX <= rect.right + pad &&
        e.clientY >= rect.top - pad &&
        e.clientY <= rect.bottom + pad
      if (inside) {
        onFeed(food.id)
      }
    }
  }

  return (
    <>
      {/* Floating dragged food icon */}
      {dragGhost && (
        <div
          className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 scale-125 drop-shadow-xl"
          style={{ left: dragGhost.x, top: dragGhost.y }}
        >
          <FoodIcon foodId={dragGhost.foodId} className="w-16 h-16" />
        </div>
      )}

      <div
        id="feed-drawer"
        className="relative z-30 mx-auto w-full max-w-2xl px-3 sm:px-5 pb-1.5 shrink-0"
      >
        <div className="rounded-[1.75rem] bg-[#FFFDF8]/96 border-[3px] border-[#F59E0B] shadow-[0_12px_28px_rgba(91,58,41,0.18)] p-3">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-sm font-extrabold text-[#92400E]">
              {gameState.stats.hunger >= 100
                ? `${cat.name}'s tummy is full!`
                : `Tap or Drag Food to ${cat.name}!`}
            </span>
            <button
              id="btn-close-feed"
              type="button"
              onClick={onClose}
              className="cozy-btn px-3 py-1 rounded-xl bg-[#FEF3C7] border-2 border-[#EAB308] text-xs font-black text-[#92400E]"
            >
              Done
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {FOOD_CATALOG.map((food) => {
              const locked = food.unlockLevel > cat.level
              const owned = inventory.treats[food.id] ?? 0
              const affordable = canUseFood(food)

              return (
                <button
                  key={food.id}
                  id={`food-${food.id}`}
                  type="button"
                  disabled={!affordable}
                  onPointerDown={(e) => handlePointerDown(e, food)}
                  onPointerMove={(e) => handlePointerMove(e, food)}
                  onPointerUp={(e) => handlePointerUp(e, food)}
                  onPointerCancel={() => {
                    dragOriginRef.current = null
                    setDragGhost(null)
                  }}
                  className={`cozy-btn relative min-h-[92px] rounded-2xl border-[3px] p-2 flex flex-col items-center justify-center gap-1 touch-none ${
                    locked
                      ? 'bg-[#F5EFE6] border-[#D8C5AF] opacity-70 cursor-not-allowed'
                      : affordable
                        ? 'bg-[#FFF9EB] border-[#F5C062] shadow-[0_3px_0_#D89C3C]'
                        : 'bg-[#F8F3EC] border-[#DFCDB8] opacity-60 cursor-not-allowed'
                  }`}
                >
                  <FoodIcon foodId={food.id} className="w-11 h-11 sm:w-12 sm:h-12" />
                  <span className="text-xs sm:text-sm font-extrabold text-[#5B3A29] leading-none">
                    {food.label}
                  </span>

                  {locked ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#8A6552]">
                      <LockIcon className="w-3.5 h-3.5" /> Lv {food.unlockLevel}
                    </span>
                  ) : food.unlimited ? (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                      Free
                    </span>
                  ) : owned > 0 ? (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E40AF]">
                      x{owned}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-[#92400E]">
                      <PawCoinIcon className="w-3.5 h-3.5" /> {food.cost}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
