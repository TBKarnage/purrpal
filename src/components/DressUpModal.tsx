import { useState } from 'react'
import { resolveCatStyle } from '../state/gameReducer'
import {
  ACCESSORY_CATALOG,
  CHEEK_STYLE_OPTIONS,
  DECOR_CATALOG,
  EYE_COLOR_OPTIONS,
  RUG_STYLE_OPTIONS,
  STAGE_META,
  STYLE_CATEGORIES,
  type AccessorySlot,
  type GameState,
} from '../types/game'
import { CatSprite } from './CatSprite'
import {
  AccessoryPreviewIcon,
  DecorPreviewIcon,
  LockIcon,
  SparklesIcon,
  StarIcon,
  StyleCrownIcon,
} from './Icons'

interface DressUpModalProps {
  gameState: GameState
  onEquipAccessory: (accessoryId: string | null, slot?: AccessorySlot) => void
  onSetEyeColor: (eyeColor: string) => void
  onSetCheekStyle: (cheekStyle: string) => void
  onSetRugStyle: (rugStyle: string) => void
  onToggleDecor: (decorId: string) => void
  onClose: () => void
}

type BoutiqueTab = 'customize' | 'room' | 'unlocks'

export function DressUpModal({
  gameState,
  onEquipAccessory,
  onSetEyeColor,
  onSetCheekStyle,
  onSetRugStyle,
  onToggleDecor,
  onClose,
}: DressUpModalProps) {
  const { cat, room, inventory } = gameState
  const [activeTab, setActiveTab] = useState<BoutiqueTab>('customize')
  const [previewAccId, setPreviewAccId] = useState<string | null>(null)
  const style = resolveCatStyle(cat)

  const previewItem = previewAccId
    ? ACCESSORY_CATALOG.find((a) => a.id === previewAccId) ?? null
    : null
  const displayStyle = previewItem
    ? { ...style, [previewItem.slot]: previewItem.id }
    : style

  const unlockedNeck = ACCESSORY_CATALOG.filter(
    (a) => a.slot === 'neck' && inventory.unlockedAccessories.includes(a.id),
  )
  const unlockedEyes = ACCESSORY_CATALOG.filter(
    (a) => a.slot === 'eyes' && inventory.unlockedAccessories.includes(a.id),
  )
  const unlockedHead = ACCESSORY_CATALOG.filter(
    (a) => a.slot === 'head' && inventory.unlockedAccessories.includes(a.id),
  )

  return (
    <div
      id="dressup-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Kitty Style Boutique"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#5B3A29]/45 backdrop-blur-sm p-3 sm:p-6"
    >
      <div className="w-full max-w-4xl max-h-[92dvh] rounded-[2rem] sm:rounded-[2.25rem] bg-[#FFFDF8] border-4 border-[#C4B5FD] shadow-[0_22px_50px_rgba(91,58,41,0.28)] p-3.5 sm:p-6 flex flex-col gap-3 sm:gap-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <StyleCrownIcon className="w-7 h-7 sm:w-9 sm:h-9 shrink-0" />
            <h2 className="text-xl sm:text-3xl font-black text-[#5B3A29] truncate">
              {cat.name}&apos;s Style
            </h2>
          </div>

          <button
            id="btn-close-dressup"
            type="button"
            onClick={onClose}
            className="cozy-btn shrink-0 min-h-[46px] sm:min-h-[54px] px-5 sm:px-6 rounded-2xl bg-[#34D399] border-b-4 border-[#059669] text-white text-base sm:text-lg font-black"
          >
            Done
          </button>
        </div>

        {/* Main Content: Live Preview + 3 Boutique Tabs */}
        <div className="flex flex-col md:flex-row gap-3 sm:gap-5 items-stretch flex-1 min-h-0">
          {/* Live Layered Preview */}
          <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-3 rounded-2xl sm:rounded-3xl bg-gradient-to-b from-[#FFF6E5] to-[#FFE7C4] border-[3px] border-[#EED0A7] px-3 py-2 sm:p-4 w-full md:w-4/12 shrink-0">
            <CatSprite
              coat={cat.coat}
              stage={cat.stage}
              mood="thriving"
              animation="idle"
              equippedAccessory={cat.equippedAccessory}
              style={displayStyle}
              showThoughtBubble={false}
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-48 md:h-48 shrink-0"
            />
            <div className="flex flex-col items-end md:items-center gap-1.5">
              <span className="px-3 py-1 rounded-full bg-[#FFFDF8] border-2 border-[#E6C79C] text-xs sm:text-sm font-extrabold text-[#7D563E] text-center">
                Lv {cat.level} · {STAGE_META[cat.stage].label}
              </span>

              {previewItem ? (
                <div className="flex flex-col items-end md:items-center gap-1">
                  <span
                    id="style-preview-badge"
                    className="px-2.5 py-0.5 rounded-full bg-[#FEF3C7] border border-[#F59E0B] text-[11px] font-black text-[#92400E] text-center"
                  >
                    Preview: {previewItem.label} (Lv {previewItem.unlockLevel})
                  </span>
                  <button
                    id="btn-clear-preview"
                    type="button"
                    onClick={() => setPreviewAccId(null)}
                    className="cozy-btn px-3 py-1 rounded-xl bg-[#FFFDF8] border-2 border-[#F59E0B] text-xs font-black text-[#92400E]"
                  >
                    Stop Preview
                  </button>
                </div>
              ) : (
                (style.neck || style.eyes || style.head) && (
                  <button
                    id="btn-clear-accessories"
                    type="button"
                    onClick={() => onEquipAccessory(null)}
                    className="cozy-btn px-3 py-1 rounded-xl bg-[#FFFDF8] border-2 border-[#E5C9A3] text-xs font-black text-[#8A6552]"
                  >
                    Take Off All
                  </button>
                )
              )}
            </div>
          </div>

          {/* Right Panel: 3 Clear Tabs (Customize / Room / Unlocks) */}
          <div className="flex flex-col gap-2.5 sm:gap-3 w-full md:w-8/12 flex-1 min-h-0">
            <div className="grid grid-cols-3 gap-2 shrink-0">
              <button
                id="tab-customize"
                type="button"
                onClick={() => setActiveTab('customize')}
                aria-pressed={activeTab === 'customize'}
                className={`cozy-btn min-h-[54px] rounded-2xl border-[3px] font-black text-sm sm:text-base ${
                  activeTab === 'customize'
                    ? 'bg-[#EDE9FE] border-[#8B5CF6] text-[#5B21B6]'
                    : 'bg-[#FFF9EE] border-[#E7CFAF] text-[#7D563E]'
                }`}
              >
                Customize
              </button>
              <button
                id="tab-room"
                type="button"
                onClick={() => setActiveTab('room')}
                aria-pressed={activeTab === 'room'}
                className={`cozy-btn min-h-[54px] rounded-2xl border-[3px] font-black text-sm sm:text-base ${
                  activeTab === 'room'
                    ? 'bg-[#E0F2FE] border-[#0EA5E9] text-[#075985]'
                    : 'bg-[#FFF9EE] border-[#E7CFAF] text-[#7D563E]'
                }`}
              >
                Room
              </button>
              <button
                id="tab-unlocks"
                type="button"
                onClick={() => setActiveTab('unlocks')}
                aria-pressed={activeTab === 'unlocks'}
                className={`cozy-btn min-h-[54px] rounded-2xl border-[3px] font-black text-sm sm:text-base flex items-center justify-center gap-1 ${
                  activeTab === 'unlocks'
                    ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E]'
                    : 'bg-[#FFF9EE] border-[#E7CFAF] text-[#7D563E]'
                }`}
              >
                <StarIcon className="w-5 h-5 shrink-0" />
                <span>Unlocks</span>
              </button>
            </div>

            {/* TAB 1: CUSTOMIZE — Free Basics + Every Unlocked Category's Options */}
            {activeTab === 'customize' && (
              <div id="panel-customize" className="flex flex-col gap-4 overflow-y-auto pr-1 pb-2 flex-1 min-h-0">
                {/* Free Eye Colors */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-black text-[#5B3A29]">Eye Color</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                      Free
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {EYE_COLOR_OPTIONS.map((eye) => {
                      const active = style.eyeColor === eye.id
                      return (
                        <button
                          key={eye.id}
                          id={`eye-${eye.id}`}
                          type="button"
                          onClick={() => onSetEyeColor(eye.id)}
                          aria-pressed={active}
                          className={`cozy-btn min-h-[64px] rounded-2xl border-[3px] p-1.5 flex flex-col items-center justify-center gap-1 ${
                            active
                              ? 'bg-[#EDE9FE] border-[#8B5CF6] shadow-[0_3px_0_#7C3AED]'
                              : 'bg-[#FFFDF8] border-[#E7CFAF]'
                          }`}
                        >
                          <span
                            className="w-6 h-6 rounded-full border-2 border-[#5B3A29] relative inline-block"
                            style={{ backgroundColor: eye.fill }}
                          >
                            <span className="absolute top-0.5 left-1 w-2 h-2 rounded-full bg-white" />
                          </span>
                          <span className="text-[11px] font-extrabold text-[#5B3A29] leading-none">
                            {eye.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Free Cheek Styles */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-black text-[#5B3A29]">Cheek Flair</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                      Free
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {CHEEK_STYLE_OPTIONS.map((ch) => {
                      const active = style.cheekStyle === ch.id
                      return (
                        <button
                          key={ch.id}
                          id={`cheek-${ch.id}`}
                          type="button"
                          onClick={() => onSetCheekStyle(ch.id)}
                          aria-pressed={active}
                          className={`cozy-btn min-h-[54px] rounded-2xl border-[3px] px-2 py-1.5 text-xs font-extrabold ${
                            active
                              ? 'bg-[#FFE4E6] border-[#FB7185] text-[#9F1239]'
                              : 'bg-[#FFFDF8] border-[#E7CFAF] text-[#5B3A29]'
                          }`}
                        >
                          {ch.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Neckwear Slot (Free Ribbons + Unlocked Collars/Bowtie/Scarf/Bandanas) */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-black text-[#5B3A29]">
                      Ribbons, Collars &amp; Neckwear
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">
                      {unlockedNeck.length} Unlocked
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    <button
                      id="slot-neck-none"
                      type="button"
                      onClick={() => onEquipAccessory(null, 'neck')}
                      className={`cozy-btn min-h-[82px] rounded-2xl border-[3px] p-1.5 flex flex-col items-center justify-center gap-1 ${
                        style.neck === null
                          ? 'bg-[#EDE9FE] border-[#8B5CF6]'
                          : 'bg-[#FFFDF8] border-[#E7CFAF]'
                      }`}
                    >
                      <span className="text-lg font-black text-[#8A6552]">—</span>
                      <span className="text-[11px] font-extrabold text-[#5B3A29]">None</span>
                    </button>
                    {unlockedNeck.map((acc) => {
                      const on = style.neck === acc.id
                      return (
                        <button
                          key={acc.id}
                          id={`acc-${acc.id}`}
                          type="button"
                          onClick={() => onEquipAccessory(acc.id)}
                          aria-pressed={on}
                          className={`cozy-btn min-h-[82px] rounded-2xl border-[3px] p-1.5 flex flex-col items-center justify-center gap-1 ${
                            on
                              ? 'bg-[#EDE9FE] border-[#8B5CF6] shadow-[0_3px_0_#7C3AED]'
                              : 'bg-[#FFFDF8] border-[#E7CFAF]'
                          }`}
                        >
                          <AccessoryPreviewIcon id={acc.id} className="w-10 h-10" />
                          <span className="text-[11px] font-extrabold text-[#5B3A29] leading-tight text-center">
                            {acc.label}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Headwear Slot (Bows, Crowns, Hats — appears once Lv 4+ unlocked!) */}
                {unlockedHead.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-black text-[#5B3A29]">Hats &amp; Bows</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#5B21B6]">
                        {unlockedHead.length} Unlocked
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <button
                        id="slot-head-none"
                        type="button"
                        onClick={() => onEquipAccessory(null, 'head')}
                        className={`cozy-btn min-h-[82px] rounded-2xl border-[3px] p-1.5 flex flex-col items-center justify-center gap-1 ${
                          style.head === null
                            ? 'bg-[#EDE9FE] border-[#8B5CF6]'
                            : 'bg-[#FFFDF8] border-[#E7CFAF]'
                        }`}
                      >
                        <span className="text-lg font-black text-[#8A6552]">—</span>
                        <span className="text-[11px] font-extrabold text-[#5B3A29]">None</span>
                      </button>
                      {unlockedHead.map((acc) => {
                        const on = style.head === acc.id
                        return (
                          <button
                            key={acc.id}
                            id={`acc-${acc.id}`}
                            type="button"
                            onClick={() => onEquipAccessory(acc.id)}
                            aria-pressed={on}
                            className={`cozy-btn min-h-[82px] rounded-2xl border-[3px] p-1.5 flex flex-col items-center justify-center gap-1 ${
                              on
                                ? 'bg-[#EDE9FE] border-[#8B5CF6] shadow-[0_3px_0_#7C3AED]'
                                : 'bg-[#FFFDF8] border-[#E7CFAF]'
                            }`}
                          >
                            <AccessoryPreviewIcon id={acc.id} className="w-10 h-10" />
                            <span className="text-[11px] font-extrabold text-[#5B3A29] leading-tight text-center">
                              {acc.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Eyewear Slot (Shades & Glasses — appears once Lv 10+ unlocked!) */}
                {unlockedEyes.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm font-black text-[#5B3A29]">Shades &amp; Glasses</span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#FCE7F3] text-[#9D174D]">
                        {unlockedEyes.length} Unlocked
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <button
                        id="slot-eyes-none"
                        type="button"
                        onClick={() => onEquipAccessory(null, 'eyes')}
                        className={`cozy-btn min-h-[82px] rounded-2xl border-[3px] p-1.5 flex flex-col items-center justify-center gap-1 ${
                          style.eyes === null
                            ? 'bg-[#EDE9FE] border-[#8B5CF6]'
                            : 'bg-[#FFFDF8] border-[#E7CFAF]'
                        }`}
                      >
                        <span className="text-lg font-black text-[#8A6552]">—</span>
                        <span className="text-[11px] font-extrabold text-[#5B3A29]">None</span>
                      </button>
                      {unlockedEyes.map((acc) => {
                        const on = style.eyes === acc.id
                        return (
                          <button
                            key={acc.id}
                            id={`acc-${acc.id}`}
                            type="button"
                            onClick={() => onEquipAccessory(acc.id)}
                            aria-pressed={on}
                            className={`cozy-btn min-h-[82px] rounded-2xl border-[3px] p-1.5 flex flex-col items-center justify-center gap-1 ${
                              on
                                ? 'bg-[#EDE9FE] border-[#8B5CF6] shadow-[0_3px_0_#7C3AED]'
                                : 'bg-[#FFFDF8] border-[#E7CFAF]'
                            }`}
                          >
                            <AccessoryPreviewIcon id={acc.id} className="w-10 h-10" />
                            <span className="text-[11px] font-extrabold text-[#5B3A29] leading-tight text-center">
                              {acc.label}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {cat.level < 13 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('unlocks')}
                    className="cozy-btn rounded-2xl bg-[#FFF7E6] border-2 border-dashed border-[#EAB308] p-2.5 flex items-center justify-center gap-2 text-xs font-extrabold text-[#92400E]"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>See what new style categories unlock as you level up!</span>
                  </button>
                )}
              </div>
            )}

            {/* TAB 2: ROOM — Free Rug Colors + Unlockable Room Decor */}
            {activeTab === 'room' && (
              <div id="panel-room" className="flex flex-col gap-4 overflow-y-auto pr-1 pb-2 flex-1 min-h-0">
                {/* Free Rug Colors */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-black text-[#5B3A29]">Starter Rug Color</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#DCFCE7] text-[#166534]">
                      Free
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {RUG_STYLE_OPTIONS.map((rug) => {
                      const active = (room.rugStyle ?? 'cream') === rug.id
                      return (
                        <button
                          key={rug.id}
                          id={`rug-${rug.id}`}
                          type="button"
                          onClick={() => onSetRugStyle(rug.id)}
                          aria-pressed={active}
                          className={`cozy-btn min-h-[78px] rounded-2xl border-[3px] p-2 flex flex-col items-center justify-center gap-1.5 ${
                            active
                              ? 'bg-[#E0F2FE] border-[#0EA5E9] shadow-[0_3px_0_#0284C7]'
                              : 'bg-[#FFFDF8] border-[#E7CFAF]'
                          }`}
                        >
                          <span
                            className="w-12 h-6 rounded-full border-[3px]"
                            style={{ backgroundColor: rug.inner, borderColor: rug.stroke }}
                          />
                          <span className="text-xs font-extrabold text-[#5B3A29]">{rug.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Unlockable Room Decor */}
                <div>
                  <span className="text-sm font-black text-[#5B3A29] block mb-1.5">
                    Special Room Decor
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {DECOR_CATALOG.map((decor) => {
                      const unlocked = room.unlockedDecor.includes(decor.id)
                      const equipped = room.equippedDecor.includes(decor.id)
                      return (
                        <button
                          key={decor.id}
                          id={`decor-${decor.id}`}
                          type="button"
                          disabled={!unlocked}
                          onClick={() => onToggleDecor(decor.id)}
                          aria-pressed={equipped}
                          className={`cozy-btn min-h-[108px] rounded-2xl border-[3px] p-2 flex flex-col items-center justify-center gap-1 ${
                            !unlocked
                              ? 'bg-[#F5EFE6] border-[#DAC8B2] opacity-65 cursor-not-allowed'
                              : equipped
                                ? 'bg-[#E0F2FE] border-[#0EA5E9] shadow-[0_3px_0_#0284C7]'
                                : 'bg-[#FFFDF8] border-[#E7CFAF]'
                          }`}
                        >
                          <DecorPreviewIcon id={decor.id} className="w-11 h-11" />
                          <span className="text-xs font-extrabold text-[#5B3A29] text-center">
                            {decor.label}
                          </span>
                          {!unlocked ? (
                            <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-[#8A6552]">
                              <LockIcon className="w-3 h-3" /> Lv {decor.unlockLevel}
                            </span>
                          ) : (
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                equipped ? 'bg-[#0EA5E9] text-white' : 'bg-[#F2E5D3] text-[#7D563E]'
                              }`}
                            >
                              {equipped ? 'In Room' : 'Place'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: UNLOCKS — Category Roadmap showing what leveling up unlocks */}
            {activeTab === 'unlocks' && (
              <div id="panel-unlocks" className="flex flex-col gap-2.5 overflow-y-auto pr-1 pb-2 flex-1 min-h-0">
                {STYLE_CATEGORIES.map((category) => {
                  const unlocked = cat.level >= category.unlockLevel
                  const accPreviews = ACCESSORY_CATALOG.filter((a) => a.category === category.id)
                  const decPreviews = DECOR_CATALOG.filter((d) => d.category === category.id)

                  return (
                    <div
                      key={category.id}
                      id={`unlock-cat-${category.id}`}
                      className={`rounded-2xl border-[3px] p-3 flex flex-col gap-2 ${
                        unlocked
                          ? 'bg-[#FFFDF8] border-[#86EFAC]'
                          : 'bg-[#F7F1E8] border-[#DFCCB5]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="px-2.5 py-1 rounded-xl border-2 border-[#5B3A29] text-xs font-black text-[#5B3A29] shrink-0"
                            style={{ backgroundColor: category.badgeColor }}
                          >
                            {category.unlockLevel === 1 ? 'FREE' : `Lv ${category.unlockLevel}`}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm sm:text-base font-black text-[#5B3A29] leading-tight">
                              {category.label}
                            </p>
                            <p className="text-xs font-bold text-[#8A6552] leading-snug">
                              {category.subtitle}
                            </p>
                          </div>
                        </div>

                        {unlocked ? (
                          <button
                            type="button"
                            onClick={() => setActiveTab(category.targetTab)}
                            className="cozy-btn shrink-0 px-3 py-1.5 rounded-xl bg-[#10B981] text-white text-xs font-black"
                          >
                            Unlocked ✓
                          </button>
                        ) : (
                          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#E7DAC8] text-[#7D563E] text-xs font-black">
                            <LockIcon className="w-3.5 h-3.5" />
                            Lv {category.unlockLevel}
                          </span>
                        )}
                      </div>

                      {/* Clickable preview strip — tap any item to try it on! */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {category.id === 'free_basics' && (
                          <span className="px-2.5 py-1 rounded-xl bg-[#FFF6E5] border border-[#E6C79C] text-[11px] font-extrabold text-[#7D563E]">
                            5 Eye Colors · 4 Cheeks · 3 Rugs
                          </span>
                        )}
                        {accPreviews.map((a) => {
                          const isPreviewing = previewAccId === a.id
                          return (
                            <button
                              key={a.id}
                              id={`preview-acc-${a.id}`}
                              type="button"
                              onClick={() =>
                                setPreviewAccId((cur) => (cur === a.id ? null : a.id))
                              }
                              aria-pressed={isPreviewing}
                              className={`cozy-btn inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border-2 text-[11px] font-extrabold ${
                                isPreviewing
                                  ? 'bg-[#EDE9FE] border-[#8B5CF6] text-[#5B21B6] shadow-sm'
                                  : 'bg-[#FFF9F0] border-[#E7CFAF] text-[#5B3A29]'
                              }`}
                            >
                              <AccessoryPreviewIcon id={a.id} className="w-5 h-5" />
                              <span>{a.label}</span>
                            </button>
                          )
                        })}
                        {decPreviews.map((d) => (
                          <span
                            key={d.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl bg-[#F0F9FF] border border-[#BAE6FD] text-[11px] font-extrabold text-[#075985]"
                          >
                            <DecorPreviewIcon id={d.id} className="w-5 h-5" />
                            <span>{d.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
