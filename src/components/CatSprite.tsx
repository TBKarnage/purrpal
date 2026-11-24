import { useId } from 'react'
import {
  ACCESSORY_CATALOG,
  DEFAULT_CAT_STYLE,
  EYE_COLOR_OPTIONS,
  type CatMood,
  type CatStyleConfig,
  type CoatStyle,
  type GrowthStage,
  type StatKey,
} from '../types/game'
import { BroomIcon, FishBowlIcon, PlayYarnIcon } from './Icons'

export type CatAnimationMode =
  | 'idle'
  | 'eating'
  | 'petting'
  | 'brushing'
  | 'wiggle'
  | 'zoomie'
  | 'catnip'
  | 'headShake'
  | 'walking'
  | 'napping'
  | 'playing'

interface CatSpriteProps {
  coat: CoatStyle
  stage: GrowthStage
  mood: CatMood
  animation?: CatAnimationMode
  facing?: 'left' | 'right'
  headShakeKey?: number
  equippedAccessory?: string | null
  style?: CatStyleConfig
  priorityNeed?: StatKey | null
  className?: string
  showThoughtBubble?: boolean
}

interface CoatPalette {
  base: string
  baseDark: string
  belly: string
  muzzle: string
  earInner: string
  stripe: string
  paw: string
  outline: string
}

const COAT_PALETTES: Record<CoatStyle, CoatPalette> = {
  tabby: {
    base: '#F7A85C',
    baseDark: '#E58A3B',
    belly: '#FFF5E6',
    muzzle: '#FFF6E9',
    earInner: '#FFB7C3',
    stripe: '#C4621E',
    paw: '#FFF5E6',
    outline: '#5B3A29',
  },
  tuxedo: {
    base: '#3E4354',
    baseDark: '#2E3240',
    belly: '#FFFFFF',
    muzzle: '#FFFFFF',
    earInner: '#F9B8C4',
    stripe: '#232633',
    paw: '#FFFFFF',
    outline: '#272936',
  },
  calico: {
    base: '#FFFDF8',
    baseDark: '#F5EDE0',
    belly: '#FFFFFF',
    muzzle: '#FFFFFF',
    earInner: '#FFB9C5',
    stripe: '#F29A4B',
    paw: '#FFFFFF',
    outline: '#5B3A29',
  },
  gray: {
    base: '#A7B4C7',
    baseDark: '#8D9BB0',
    belly: '#EEF3F9',
    muzzle: '#F2F6FB',
    earInner: '#F8BCC8',
    stripe: '#6C7B91',
    paw: '#EEF3F9',
    outline: '#465063',
  },
}

interface StageGeometry {
  headCx: number
  headCy: number
  headRx: number
  headRy: number
  earHeight: number
  earSpread: number
  bodyTopY: number
  bodyBottomY: number
  bodyWidth: number
  eyeOffsetX: number
  eyeY: number
  eyeRx: number
  eyeRy: number
  neckY: number
  pawY: number
  pawOffsetX: number
  pawRx: number
  pawRy: number
  tailOriginX: number
  tailOriginY: number
  tailPath: string
  tailWidth: number
  hasChestRuff: boolean
  hasCheekTufts: boolean
}

const STAGE_GEOMETRY: Record<GrowthStage, StageGeometry> = {
  // Stage 1: Tiny Kitten — huge adorable head, big ears, tiny round body & bean paws
  kitten: {
    headCx: 150,
    headCy: 158,
    headRx: 58,
    headRy: 49,
    earHeight: 46,
    earSpread: 44,
    bodyTopY: 196,
    bodyBottomY: 254,
    bodyWidth: 40,
    eyeOffsetX: 23,
    eyeY: 156,
    eyeRx: 10.5,
    eyeRy: 12.2,
    neckY: 204,
    pawY: 251,
    pawOffsetX: 19,
    pawRx: 13,
    pawRy: 9.5,
    tailOriginX: 185,
    tailOriginY: 238,
    tailPath: 'M 185 238 Q 214 232 216 208',
    tailWidth: 14,
    hasChestRuff: false,
    hasCheekTufts: false,
  },
  // Stage 2: Playful Junior — taller agile body, longer curved swishing tail
  junior: {
    headCx: 150,
    headCy: 132,
    headRx: 54,
    headRy: 45,
    earHeight: 48,
    earSpread: 43,
    bodyTopY: 168,
    bodyBottomY: 256,
    bodyWidth: 46,
    eyeOffsetX: 22,
    eyeY: 131,
    eyeRx: 9.8,
    eyeRy: 11.2,
    neckY: 176,
    pawY: 252,
    pawOffsetX: 23,
    pawRx: 14,
    pawRy: 10,
    tailOriginX: 192,
    tailOriginY: 236,
    tailPath: 'M 192 236 C 234 232 246 186 226 164',
    tailWidth: 16,
    hasChestRuff: false,
    hasCheekTufts: false,
  },
  // Stage 3: Teen Cat — sleeker taller seated proportions, elegant curled tail
  teen: {
    headCx: 150,
    headCy: 112,
    headRx: 50,
    headRy: 42,
    earHeight: 46,
    earSpread: 41,
    bodyTopY: 148,
    bodyBottomY: 258,
    bodyWidth: 48,
    eyeOffsetX: 20,
    eyeY: 112,
    eyeRx: 9.2,
    eyeRy: 10.4,
    neckY: 154,
    pawY: 254,
    pawOffsetX: 22,
    pawRx: 14.5,
    pawRy: 10,
    tailOriginX: 194,
    tailOriginY: 236,
    tailPath: 'M 194 236 C 244 238 258 178 232 142 C 222 128 206 134 212 146',
    tailWidth: 17,
    hasChestRuff: false,
    hasCheekTufts: true,
  },
  // Stage 4: Full-Grown Adult — regal plush silhouette, fluffy chest ruff & grand plume tail
  adult: {
    headCx: 150,
    headCy: 98,
    headRx: 55,
    headRy: 45,
    earHeight: 46,
    earSpread: 44,
    bodyTopY: 134,
    bodyBottomY: 260,
    bodyWidth: 58,
    eyeOffsetX: 22,
    eyeY: 98,
    eyeRx: 9.5,
    eyeRy: 10.6,
    neckY: 143,
    pawY: 256,
    pawOffsetX: 26,
    pawRx: 16,
    pawRy: 11,
    tailOriginX: 202,
    tailOriginY: 234,
    tailPath: 'M 202 234 C 258 234 268 164 238 124 C 224 106 206 118 214 132',
    tailWidth: 23,
    hasChestRuff: true,
    hasCheekTufts: true,
  },
}

export function CatSprite({
  coat,
  stage,
  mood,
  animation = 'idle',
  facing = 'right',
  headShakeKey = 0,
  equippedAccessory = null,
  style,
  priorityNeed = null,
  className = 'w-56 h-56',
  showThoughtBubble = true,
}: CatSpriteProps) {
  const rawUid = useId()
  const furGradId = `fur-${coat}-${stage}-${rawUid.replace(/[^a-zA-Z0-9_-]/g, '')}`
  const p = COAT_PALETTES[coat]
  const g = STAGE_GEOMETRY[stage]

  const effectiveStyle: CatStyleConfig = style
    ? { ...DEFAULT_CAT_STYLE, ...style }
    : (() => {
        const next: CatStyleConfig = { ...DEFAULT_CAT_STYLE }
        if (equippedAccessory) {
          const item = ACCESSORY_CATALOG.find((a) => a.id === equippedAccessory)
          if (item) next[item.slot] = item.id
        }
        return next
      })()

  const eyeFill =
    EYE_COLOR_OPTIONS.find((e) => e.id === effectiveStyle.eyeColor)?.fill ?? '#2D1D16'
  const cheekStyle = effectiveStyle.cheekStyle || 'rosy'
  const neckAcc = effectiveStyle.neck
  const eyeAcc = effectiveStyle.eyes
  const headAcc = effectiveStyle.head

  const isZooming = animation === 'zoomie' || animation === 'catnip'
  const isSad = mood === 'sad' && !isZooming
  const isNeedsCare = mood === 'needsCare' && !isZooming
  const isDown = isSad || isNeedsCare
  const isNapping = animation === 'napping'
  const isBlissful =
    animation === 'petting' ||
    animation === 'brushing' ||
    animation === 'eating' ||
    animation === 'headShake'
  const isExcitedTail =
    isZooming ||
    animation === 'petting' ||
    animation === 'brushing' ||
    animation === 'eating' ||
    animation === 'playing' ||
    mood === 'thriving'

  const tailAnimClass = isExcitedTail
    ? 'animate-tail-excited'
    : isDown && !isBlissful
      ? 'animate-tail-droop'
      : 'animate-tail-sway'

  const bodyAnimClass =
    animation === 'eating'
      ? 'animate-cat-munch'
      : animation === 'wiggle' ||
          animation === 'petting' ||
          animation === 'brushing' ||
          animation === 'playing'
        ? 'animate-cat-wiggle'
        : animation === 'walking'
          ? 'animate-cat-walk'
          : animation === 'napping'
            ? 'animate-cat-nap'
            : animation === 'catnip'
              ? 'animate-cat-catnip'
              : animation === 'zoomie'
                ? 'animate-cat-zoomie'
                : animation === 'headShake'
                  ? ''
                  : isSad
                    ? 'animate-cat-sad'
                    : mood === 'thriving'
                      ? 'animate-cat-happy'
                      : 'animate-cat-breathe'

  const leftEarBaseX = g.headCx - g.earSpread
  const rightEarBaseX = g.headCx + g.earSpread
  const earTopY = g.headCy - g.headRy - g.earHeight + 16
  const earBaseY = g.headCy - g.headRy * 0.32

  const bodyPath = `
    M ${g.headCx - g.bodyWidth * 0.72} ${g.bodyTopY}
    C ${g.headCx - g.bodyWidth * 1.15} ${g.bodyTopY + (g.bodyBottomY - g.bodyTopY) * 0.45},
      ${g.headCx - g.bodyWidth * 1.05} ${g.bodyBottomY},
      ${g.headCx - g.bodyWidth * 0.65} ${g.bodyBottomY}
    L ${g.headCx + g.bodyWidth * 0.65} ${g.bodyBottomY}
    C ${g.headCx + g.bodyWidth * 1.05} ${g.bodyBottomY},
      ${g.headCx + g.bodyWidth * 1.15} ${g.bodyTopY + (g.bodyBottomY - g.bodyTopY) * 0.45},
      ${g.headCx + g.bodyWidth * 0.72} ${g.bodyTopY}
    Z
  `

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      data-cat-stage={stage}
      data-cat-coat={coat}
      data-cat-mood={mood}
      data-cat-accessory={equippedAccessory ?? 'none'}
    >
      {/* Cute Thought Bubble when Needs Care or Sad */}
      {showThoughtBubble && isDown && priorityNeed && !isNapping && (
        <div
          className="absolute -top-4 right-0 sm:right-2 z-20 animate-thought-bob pointer-events-none"
          aria-label={`Kitty needs ${priorityNeed}`}
        >
          <div className="relative bg-[#FFFDF8] border-[3px] border-[#5B3A29] rounded-full w-16 h-14 flex items-center justify-center shadow-md">
            {priorityNeed === 'hunger' && <FishBowlIcon className="w-9 h-9" />}
            {priorityNeed === 'cleanliness' && <BroomIcon className="w-9 h-9" />}
            {priorityNeed === 'happiness' && <PlayYarnIcon className="w-9 h-9" />}
            <span className="absolute -bottom-2.5 left-3 w-3.5 h-3.5 rounded-full bg-[#FFFDF8] border-[2.5px] border-[#5B3A29]" />
            <span className="absolute -bottom-5 left-1 w-2 h-2 rounded-full bg-[#FFFDF8] border-[2px] border-[#5B3A29]" />
          </div>
        </div>
      )}

      {/* Cozy Napping zZz Pill */}
      {showThoughtBubble && isNapping && (
        <div className="absolute -top-2 right-1 z-20 animate-thought-bob pointer-events-none">
          <div className="rounded-full bg-[#FFFDF8]/95 border-[2.5px] border-[#A78BFA] px-2.5 py-0.5 text-sm font-black text-[#6D28D9] shadow-sm">
            zZz
          </div>
        </div>
      )}

      <svg
        viewBox="0 0 300 285"
        className={`w-full h-full overflow-visible drop-shadow-[0_10px_14px_rgba(91,58,41,0.16)] transition-transform duration-300 ${
          facing === 'left' ? '-scale-x-100' : ''
        }`}
        role="img"
        aria-label={`${coat} ${stage} cat`}
      >
        <defs>
          <linearGradient id={furGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={p.base} />
            <stop offset="100%" stopColor={p.baseDark} />
          </linearGradient>
        </defs>

        {/* Ground shadow */}
        <ellipse
          cx={g.headCx}
          cy={262}
          rx={g.bodyWidth * 1.12}
          ry={13}
          fill="#C5996D"
          opacity="0.32"
        />

        {/* Animated kitty container */}
        <g className={bodyAnimClass} style={{ transformOrigin: '150px 255px' }}>
          {/* Tail */}
          <g
            className={tailAnimClass}
            style={{ transformOrigin: `${g.tailOriginX}px ${g.tailOriginY}px` }}
          >
            {/* Tail outline */}
            <path
              d={g.tailPath}
              fill="none"
              stroke={p.outline}
              strokeWidth={g.tailWidth + 10}
              strokeLinecap="round"
            />
            {/* Tail fill */}
            <path
              d={g.tailPath}
              fill="none"
              stroke={coat === 'calico' ? '#4E4657' : p.base}
              strokeWidth={g.tailWidth}
              strokeLinecap="round"
            />
            {/* Tail markings */}
            {coat === 'tabby' && (
              <path
                d={g.tailPath}
                fill="none"
                stroke={p.stripe}
                strokeWidth={g.tailWidth * 0.72}
                strokeDasharray="6 11"
                strokeLinecap="round"
              />
            )}
            {coat === 'tuxedo' && (
              <path
                d={g.tailPath}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={g.tailWidth * 0.85}
                strokeDasharray="0 85 24 100"
                strokeLinecap="round"
              />
            )}
            {coat === 'calico' && (
              <path
                d={g.tailPath}
                fill="none"
                stroke="#F29A4B"
                strokeWidth={g.tailWidth * 0.85}
                strokeDasharray="0 28 24 100"
                strokeLinecap="round"
              />
            )}
          </g>

          {/* Body */}
          <path
            d={bodyPath}
            fill={`url(#${furGradId})`}
            stroke={p.outline}
            strokeWidth="5.5"
            strokeLinejoin="round"
          />

          {/* Calico body patches */}
          {coat === 'calico' && (
            <>
              <ellipse
                cx={g.headCx - g.bodyWidth * 0.56}
                cy={g.bodyBottomY - 26}
                rx={g.bodyWidth * 0.34}
                ry={22}
                fill="#F29A4B"
              />
              <ellipse
                cx={g.headCx + g.bodyWidth * 0.54}
                cy={g.bodyTopY + 34}
                rx={g.bodyWidth * 0.32}
                ry={20}
                fill="#4E4657"
              />
            </>
          )}

          {/* Soft Belly Patch */}
          <ellipse
            cx={g.headCx}
            cy={g.bodyBottomY - (g.bodyBottomY - g.bodyTopY) * 0.36}
            rx={g.bodyWidth * 0.52}
            ry={(g.bodyBottomY - g.bodyTopY) * 0.38}
            fill={p.belly}
          />

          {/* Adult Fluffy Chest Ruff */}
          {g.hasChestRuff && (
            <path
              d={`M ${g.headCx - 30} ${g.neckY - 2} Q ${g.headCx - 16} ${g.neckY + 26} ${g.headCx} ${g.neckY + 18} Q ${g.headCx + 16} ${g.neckY + 26} ${g.headCx + 30} ${g.neckY - 2} Z`}
              fill={p.belly}
              stroke={p.outline}
              strokeWidth="4"
              strokeLinejoin="round"
            />
          )}

          {/* Neck Accessories: Starter Ribbons / Bell Collars / Bowtie / Scarf / Bandanas */}
          {(neckAcc === 'ribbon_coral' ||
            neckAcc === 'ribbon_mint' ||
            neckAcc === 'ribbon_sunny' ||
            neckAcc === 'ribbon_sky') && (
            <g>
              {(() => {
                const col =
                  neckAcc === 'ribbon_mint'
                    ? '#34D399'
                    : neckAcc === 'ribbon_sunny'
                      ? '#FBBF24'
                      : neckAcc === 'ribbon_sky'
                        ? '#38BDF8'
                        : '#FB7185'
                return (
                  <>
                    <path
                      d={`M ${g.headCx - g.bodyWidth * 0.72} ${g.neckY - 4} Q ${g.headCx} ${g.neckY + 14} ${g.headCx + g.bodyWidth * 0.72} ${g.neckY - 4}`}
                      fill="none"
                      stroke={col}
                      strokeWidth="9.5"
                      strokeLinecap="round"
                    />
                    <path
                      d={`M ${g.headCx - 3} ${g.neckY + 11} L ${g.headCx - 11} ${g.neckY + 25} M ${g.headCx + 3} ${g.neckY + 11} L ${g.headCx + 11} ${g.neckY + 25}`}
                      stroke={col}
                      strokeWidth="6.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={g.headCx}
                      cy={g.neckY + 9}
                      r="6"
                      fill={col}
                      stroke={p.outline}
                      strokeWidth="3"
                    />
                  </>
                )
              })()}
            </g>
          )}

          {(neckAcc === 'collar' || neckAcc === 'collar_sky' || neckAcc === 'collar_gold') && (
            <g>
              <path
                d={`M ${g.headCx - g.bodyWidth * 0.72} ${g.neckY - 4} Q ${g.headCx} ${g.neckY + 16} ${g.headCx + g.bodyWidth * 0.72} ${g.neckY - 4}`}
                fill="none"
                stroke={
                  neckAcc === 'collar_sky'
                    ? '#38BDF8'
                    : neckAcc === 'collar_gold'
                      ? '#F59E0B'
                      : '#FB7185'
                }
                strokeWidth="11"
                strokeLinecap="round"
              />
              <circle
                cx={g.headCx}
                cy={g.neckY + 12}
                r="9.5"
                fill="#FBBF24"
                stroke={p.outline}
                strokeWidth="3.5"
              />
              <circle cx={g.headCx} cy={g.neckY + 14} r="2.2" fill={p.outline} />
            </g>
          )}

          {neckAcc === 'bowtie' && (
            <g transform={`translate(${g.headCx}, ${g.neckY + 8})`}>
              <path
                d="M 0 0 L -20 -11 L -20 11 Z M 0 0 L 20 -11 L 20 11 Z"
                fill="#EF4444"
                stroke={p.outline}
                strokeWidth="3.6"
                strokeLinejoin="round"
              />
              <rect
                x="-6"
                y="-6.5"
                width="12"
                height="13"
                rx="4"
                fill="#FCA5A5"
                stroke={p.outline}
                strokeWidth="3.2"
              />
            </g>
          )}

          {neckAcc === 'scarf' && (
            <g>
              <path
                d={`M ${g.headCx - g.bodyWidth * 0.8} ${g.neckY - 2} Q ${g.headCx} ${g.neckY + 16} ${g.headCx + g.bodyWidth * 0.8} ${g.neckY - 2}`}
                fill="none"
                stroke="#FB923C"
                strokeWidth="16"
                strokeLinecap="round"
              />
              <path
                d={`M ${g.headCx - g.bodyWidth * 0.65} ${g.neckY + 1} Q ${g.headCx} ${g.neckY + 16} ${g.headCx + g.bodyWidth * 0.65} ${g.neckY + 1}`}
                fill="none"
                stroke="#FFEDD5"
                strokeWidth="4"
                strokeDasharray="6 6"
                strokeLinecap="round"
              />
              <rect
                x={g.headCx + 10}
                y={g.neckY + 6}
                width="15"
                height="26"
                rx="6"
                fill="#F97316"
                stroke={p.outline}
                strokeWidth="3.4"
              />
            </g>
          )}

          {(neckAcc === 'bandana' ||
            neckAcc === 'bandana_coral' ||
            neckAcc === 'bandana_mint') && (
            <g>
              <path
                d={`M ${g.headCx - g.bodyWidth * 0.76} ${g.neckY - 6} Q ${g.headCx} ${g.neckY + 8} ${g.headCx + g.bodyWidth * 0.76} ${g.neckY - 6} L ${g.headCx} ${g.neckY + 34} Z`}
                fill={
                  neckAcc === 'bandana_coral'
                    ? '#FB7185'
                    : neckAcc === 'bandana_mint'
                      ? '#34D399'
                      : '#38BDF8'
                }
                stroke={p.outline}
                strokeWidth="4.2"
                strokeLinejoin="round"
              />
              <path
                d={`M ${g.headCx} ${g.neckY + 6} L ${g.headCx + 3} ${g.neckY + 13} L ${g.headCx + 10} ${g.neckY + 14} L ${g.headCx + 4.5} ${g.neckY + 18} L ${g.headCx + 6} ${g.neckY + 25} L ${g.headCx} ${g.neckY + 21} L ${g.headCx - 6} ${g.neckY + 25} L ${g.headCx - 4.5} ${g.neckY + 18} L ${g.headCx - 10} ${g.neckY + 14} L ${g.headCx - 3} ${g.neckY + 13} Z`}
                fill="#FEF08A"
              />
            </g>
          )}

          {/* Front Paws */}
          <ellipse
            cx={g.headCx - g.pawOffsetX}
            cy={g.pawY}
            rx={g.pawRx}
            ry={g.pawRy}
            fill={p.paw}
            stroke={p.outline}
            strokeWidth="4.5"
          />
          <ellipse
            cx={g.headCx + g.pawOffsetX}
            cy={g.pawY}
            rx={g.pawRx}
            ry={g.pawRy}
            fill={p.paw}
            stroke={p.outline}
            strokeWidth="4.5"
          />
          {/* Cute paw toe lines */}
          <path
            d={`M ${g.headCx - g.pawOffsetX - 4} ${g.pawY + 2} L ${g.headCx - g.pawOffsetX - 4} ${g.pawY + 8} M ${g.headCx - g.pawOffsetX + 4} ${g.pawY + 2} L ${g.headCx - g.pawOffsetX + 4} ${g.pawY + 8}`}
            stroke={p.outline}
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d={`M ${g.headCx + g.pawOffsetX - 4} ${g.pawY + 2} L ${g.headCx + g.pawOffsetX - 4} ${g.pawY + 8} M ${g.headCx + g.pawOffsetX + 4} ${g.pawY + 2} L ${g.headCx + g.pawOffsetX + 4} ${g.pawY + 8}`}
            stroke={p.outline}
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Head + Ears + Face + Head Accessories (pivots at neck for head-shake 'no') */}
          <g
            key={animation === 'headShake' ? `shake-${headShakeKey}` : 'head-still'}
            className={animation === 'headShake' ? 'animate-cat-head-shake' : undefined}
            style={{ transformOrigin: `${g.headCx}px ${g.neckY}px` }}
          >
          {/* Left Ear (droops outward when sad or needing care) */}
          <g
            transform={
              isSad && !isBlissful
                ? `rotate(-25 ${leftEarBaseX} ${earBaseY})`
                : isNeedsCare && !isBlissful
                  ? `rotate(-14 ${leftEarBaseX} ${earBaseY})`
                  : undefined
            }
          >
            <g
              className={!isDown && !isNapping ? 'animate-ear-twitch' : undefined}
              style={{ transformOrigin: `${leftEarBaseX}px ${earBaseY}px` }}
            >
              <path
                d={`M ${leftEarBaseX - 10} ${earBaseY + 14} L ${leftEarBaseX - 14} ${earTopY} Q ${leftEarBaseX - 10} ${earTopY - 8} ${leftEarBaseX + 2} ${earTopY - 2} L ${leftEarBaseX + 28} ${earBaseY - 12} Z`}
                fill={coat === 'calico' ? '#F29A4B' : coat === 'gray' ? '#8291A7' : p.base}
                stroke={p.outline}
                strokeWidth="5.2"
                strokeLinejoin="round"
              />
              <path
                d={`M ${leftEarBaseX - 3} ${earBaseY + 4} L ${leftEarBaseX - 5} ${earTopY + 11} L ${leftEarBaseX + 18} ${earBaseY - 6} Z`}
                fill={p.earInner}
              />
            </g>
          </g>

          {/* Right Ear (droops outward when sad or needing care) */}
          <g
            transform={
              isSad && !isBlissful
                ? `rotate(25 ${rightEarBaseX} ${earBaseY})`
                : isNeedsCare && !isBlissful
                  ? `rotate(14 ${rightEarBaseX} ${earBaseY})`
                  : undefined
            }
          >
            <path
              d={`M ${rightEarBaseX + 10} ${earBaseY + 14} L ${rightEarBaseX + 14} ${earTopY} Q ${rightEarBaseX + 10} ${earTopY - 8} ${rightEarBaseX - 2} ${earTopY - 2} L ${rightEarBaseX - 28} ${earBaseY - 12} Z`}
              fill={coat === 'calico' ? '#4E4657' : coat === 'gray' ? '#8291A7' : p.base}
              stroke={p.outline}
              strokeWidth="5.2"
              strokeLinejoin="round"
            />
            <path
              d={`M ${rightEarBaseX + 3} ${earBaseY + 4} L ${rightEarBaseX + 5} ${earTopY + 11} L ${rightEarBaseX - 18} ${earBaseY - 6} Z`}
              fill={p.earInner}
            />
          </g>

          {/* Head */}
          <ellipse
            cx={g.headCx}
            cy={g.headCy}
            rx={g.headRx}
            ry={g.headRy}
            fill={`url(#${furGradId})`}
            stroke={p.outline}
            strokeWidth="5.5"
          />

          {/* Fluffy cheek tufts for Teen & Adult */}
          {g.hasCheekTufts && (
            <>
              <path
                d={`M ${g.headCx - g.headRx + 4} ${g.headCy + 8} L ${g.headCx - g.headRx - 9} ${g.headCy + 14} L ${g.headCx - g.headRx + 6} ${g.headCy + 20}`}
                fill={p.base}
                stroke={p.outline}
                strokeWidth="4.2"
                strokeLinejoin="round"
              />
              <path
                d={`M ${g.headCx + g.headRx - 4} ${g.headCy + 8} L ${g.headCx + g.headRx + 9} ${g.headCy + 14} L ${g.headCx + g.headRx - 6} ${g.headCy + 20}`}
                fill={p.base}
                stroke={p.outline}
                strokeWidth="4.2"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Coat-specific face markings */}
          {coat === 'tabby' && (
            <g stroke={p.stripe} strokeLinecap="round">
              <line x1={g.headCx} y1={g.headCy - g.headRy + 4} x2={g.headCx} y2={g.headCy - g.headRy + 21} strokeWidth="6" />
              <line x1={g.headCx - 13} y1={g.headCy - g.headRy + 7} x2={g.headCx - 9} y2={g.headCy - g.headRy + 20} strokeWidth="5" />
              <line x1={g.headCx + 13} y1={g.headCy - g.headRy + 7} x2={g.headCx + 9} y2={g.headCy - g.headRy + 20} strokeWidth="5" />
              <line x1={g.headCx - g.headRx + 6} y1={g.headCy + 4} x2={g.headCx - g.headRx + 18} y2={g.headCy + 7} strokeWidth="4" />
              <line x1={g.headCx - g.headRx + 8} y1={g.headCy + 14} x2={g.headCx - g.headRx + 19} y2={g.headCy + 14} strokeWidth="4" />
              <line x1={g.headCx + g.headRx - 6} y1={g.headCy + 4} x2={g.headCx + g.headRx - 18} y2={g.headCy + 7} strokeWidth="4" />
              <line x1={g.headCx + g.headRx - 8} y1={g.headCy + 14} x2={g.headCx + g.headRx - 19} y2={g.headCy + 14} strokeWidth="4" />
            </g>
          )}

          {coat === 'calico' && (
            <>
              <path
                d={`M ${g.headCx - g.headRx + 6} ${g.headCy - 16} C ${g.headCx - 24} ${g.headCy - g.headRy + 2}, ${g.headCx - 12} ${g.headCy - 6}, ${g.headCx - 38} ${g.headCy + 4} Z`}
                fill="#F29A4B"
                opacity="0.92"
              />
              <path
                d={`M ${g.headCx + g.headRx - 6} ${g.headCy - 18} C ${g.headCx + 24} ${g.headCy - g.headRy + 2}, ${g.headCx + 18} ${g.headCy - 12}, ${g.headCx + 42} ${g.headCy - 2} Z`}
                fill="#4E4657"
                opacity="0.9"
              />
            </>
          )}

          {coat === 'gray' && (
            <g stroke={p.stripe} strokeLinecap="round" opacity="0.55">
              <line x1={g.headCx} y1={g.headCy - g.headRy + 5} x2={g.headCx} y2={g.headCy - g.headRy + 17} strokeWidth="5" />
              <line x1={g.headCx - 11} y1={g.headCy - g.headRy + 8} x2={g.headCx - 8} y2={g.headCy - g.headRy + 17} strokeWidth="4" />
              <line x1={g.headCx + 11} y1={g.headCy - g.headRy + 8} x2={g.headCx + 8} y2={g.headCy - g.headRy + 17} strokeWidth="4" />
            </g>
          )}

          {/* Soft Muzzle */}
          <ellipse
            cx={g.headCx}
            cy={g.headCy + 17}
            rx={27}
            ry={18}
            fill={p.muzzle}
          />

          {/* Eyes */}
          {isNapping ? (
            <g fill="none" stroke={p.outline} strokeWidth="4.4" strokeLinecap="round">
              <path d={`M ${g.headCx - g.eyeOffsetX - 10} ${g.eyeY} Q ${g.headCx - g.eyeOffsetX} ${g.eyeY + 8} ${g.headCx - g.eyeOffsetX + 10} ${g.eyeY}`} />
              <path d={`M ${g.headCx + g.eyeOffsetX - 10} ${g.eyeY} Q ${g.headCx + g.eyeOffsetX} ${g.eyeY + 8} ${g.headCx + g.eyeOffsetX + 10} ${g.eyeY}`} />
            </g>
          ) : isBlissful ? (
            <g fill="none" stroke={p.outline} strokeWidth="4.6" strokeLinecap="round">
              <path d={`M ${g.headCx - g.eyeOffsetX - 10} ${g.eyeY + 3} Q ${g.headCx - g.eyeOffsetX} ${g.eyeY - 9} ${g.headCx - g.eyeOffsetX + 10} ${g.eyeY + 3}`} />
              <path d={`M ${g.headCx + g.eyeOffsetX - 10} ${g.eyeY + 3} Q ${g.headCx + g.eyeOffsetX} ${g.eyeY - 9} ${g.headCx + g.eyeOffsetX + 10} ${g.eyeY + 3}`} />
            </g>
          ) : (
            <g className="animate-eye-blink" style={{ transformOrigin: `${g.headCx}px ${g.eyeY}px` }}>
              <ellipse
                cx={g.headCx - g.eyeOffsetX}
                cy={g.eyeY}
                rx={animation === 'catnip' ? g.eyeRx * 1.18 : g.eyeRx}
                ry={animation === 'catnip' ? g.eyeRy * 1.14 : g.eyeRy}
                fill={eyeFill}
              />
              <circle cx={g.headCx - g.eyeOffsetX - 3.4} cy={g.eyeY - 4} r={animation === 'catnip' ? 4.6 : isSad ? 4.4 : 3.8} fill="#FFFFFF" />
              <circle cx={g.headCx - g.eyeOffsetX + 3.4} cy={g.eyeY + 4} r={animation === 'catnip' ? 2.6 : isSad ? 2.4 : 1.8} fill="#FFFFFF" />

              <ellipse
                cx={g.headCx + g.eyeOffsetX}
                cy={g.eyeY}
                rx={animation === 'catnip' ? g.eyeRx * 1.18 : g.eyeRx}
                ry={animation === 'catnip' ? g.eyeRy * 1.14 : g.eyeRy}
                fill={eyeFill}
              />
              <circle cx={g.headCx + g.eyeOffsetX - 3.4} cy={g.eyeY - 4} r={animation === 'catnip' ? 4.6 : isSad ? 4.4 : 3.8} fill="#FFFFFF" />
              <circle cx={g.headCx + g.eyeOffsetX + 3.4} cy={g.eyeY + 4} r={animation === 'catnip' ? 2.6 : isSad ? 2.4 : 1.8} fill="#FFFFFF" />

              {/* Soft worried / sad tilted eyelids & brows when Needs Care or Sad */}
              {isDown && (
                <>
                  <path
                    d={`M ${g.headCx - g.eyeOffsetX - g.eyeRx - 2} ${g.eyeY - (isSad ? 1 : 3)} L ${g.headCx - g.eyeOffsetX + g.eyeRx + 2} ${g.eyeY - (isSad ? 9 : 7)} L ${g.headCx - g.eyeOffsetX + g.eyeRx + 2} ${g.eyeY - g.eyeRy - 5} L ${g.headCx - g.eyeOffsetX - g.eyeRx - 2} ${g.eyeY - g.eyeRy - 5} Z`}
                    fill={p.base}
                  />
                  <path
                    d={`M ${g.headCx + g.eyeOffsetX - g.eyeRx - 2} ${g.eyeY - (isSad ? 9 : 7)} L ${g.headCx + g.eyeOffsetX + g.eyeRx + 2} ${g.eyeY - (isSad ? 1 : 3)} L ${g.headCx + g.eyeOffsetX + g.eyeRx + 2} ${g.eyeY - g.eyeRy - 5} L ${g.headCx + g.eyeOffsetX - g.eyeRx - 2} ${g.eyeY - g.eyeRy - 5} Z`}
                    fill={p.base}
                  />
                  <line
                    x1={g.headCx - g.eyeOffsetX - g.eyeRx - 2}
                    y1={g.eyeY - (isSad ? 1 : 3)}
                    x2={g.headCx - g.eyeOffsetX + g.eyeRx + 2}
                    y2={g.eyeY - (isSad ? 9 : 7)}
                    stroke={p.outline}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={g.headCx + g.eyeOffsetX - g.eyeRx - 2}
                    y1={g.eyeY - (isSad ? 9 : 7)}
                    x2={g.headCx + g.eyeOffsetX + g.eyeRx + 2}
                    y2={g.eyeY - (isSad ? 1 : 3)}
                    stroke={p.outline}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                  />
                </>
              )}

              {/* Watery eye gleam + tiny glistening tear when Sad */}
              {isSad && (
                <>
                  <ellipse
                    cx={g.headCx - g.eyeOffsetX}
                    cy={g.eyeY + g.eyeRy - 3}
                    rx={g.eyeRx * 0.65}
                    ry={2.8}
                    fill="#BAE6FD"
                    opacity="0.82"
                  />
                  <ellipse
                    cx={g.headCx + g.eyeOffsetX}
                    cy={g.eyeY + g.eyeRy - 3}
                    rx={g.eyeRx * 0.65}
                    ry={2.8}
                    fill="#BAE6FD"
                    opacity="0.82"
                  />
                  <path
                    className="animate-tear-shimmer"
                    d={`M ${g.headCx - g.eyeOffsetX - g.eyeRx - 1} ${g.eyeY + 7} Q ${g.headCx - g.eyeOffsetX - g.eyeRx - 5} ${g.eyeY + 14} ${g.headCx - g.eyeOffsetX - g.eyeRx - 1} ${g.eyeY + 17} Q ${g.headCx - g.eyeOffsetX - g.eyeRx + 3} ${g.eyeY + 14} ${g.headCx - g.eyeOffsetX - g.eyeRx - 1} ${g.eyeY + 7} Z`}
                    fill="#7DD3FC"
                    stroke="#38BDF8"
                    strokeWidth="1.2"
                  />
                </>
              )}
            </g>
          )}

          {/* Cheek Flair (Free Starter Basics: rosy / hearts / stars / none) */}
          {cheekStyle === 'rosy' && (
            <>
              <ellipse
                cx={g.headCx - g.eyeOffsetX - 15}
                cy={g.headCy + 12}
                rx={9.5}
                ry={5.5}
                fill="#FF8FA3"
                opacity={isBlissful ? '0.82' : isSad ? '0.28' : '0.52'}
              />
              <ellipse
                cx={g.headCx + g.eyeOffsetX + 15}
                cy={g.headCy + 12}
                rx={9.5}
                ry={5.5}
                fill="#FF8FA3"
                opacity={isBlissful ? '0.82' : isSad ? '0.28' : '0.52'}
              />
            </>
          )}

          {cheekStyle === 'hearts' && (
            <g fill="#FB7185" opacity={isSad ? '0.52' : '0.88'}>
              <path
                d={`M ${g.headCx - g.eyeOffsetX - 15} ${g.headCy + 17} C ${g.headCx - g.eyeOffsetX - 22} ${g.headCy + 12}, ${g.headCx - g.eyeOffsetX - 21} ${g.headCy + 6}, ${g.headCx - g.eyeOffsetX - 15} ${g.headCy + 10} C ${g.headCx - g.eyeOffsetX - 9} ${g.headCy + 6}, ${g.headCx - g.eyeOffsetX - 8} ${g.headCy + 12}, ${g.headCx - g.eyeOffsetX - 15} ${g.headCy + 17} Z`}
              />
              <path
                d={`M ${g.headCx + g.eyeOffsetX + 15} ${g.headCy + 17} C ${g.headCx + g.eyeOffsetX + 8} ${g.headCy + 12}, ${g.headCx + g.eyeOffsetX + 9} ${g.headCy + 6}, ${g.headCx + g.eyeOffsetX + 15} ${g.headCy + 10} C ${g.headCx + g.eyeOffsetX + 21} ${g.headCy + 6}, ${g.headCx + g.eyeOffsetX + 22} ${g.headCy + 12}, ${g.headCx + g.eyeOffsetX + 15} ${g.headCy + 17} Z`}
              />
            </g>
          )}

          {cheekStyle === 'stars' && (
            <g fill="#FBBF24" stroke="#B45309" strokeWidth="1.2" opacity={isSad ? '0.55' : '1'}>
              <path
                transform={`translate(${g.headCx - g.eyeOffsetX - 15}, ${g.headCy + 12})`}
                d="M 0 -7 L 2 -2 L 7 -1.5 L 3 2 L 4 7 L 0 4.2 L -4 7 L -3 2 L -7 -1.5 L -2 -2 Z"
              />
              <path
                transform={`translate(${g.headCx + g.eyeOffsetX + 15}, ${g.headCy + 12})`}
                d="M 0 -7 L 2 -2 L 7 -1.5 L 3 2 L 4 7 L 0 4.2 L -4 7 L -3 2 L -7 -1.5 L -2 -2 Z"
              />
            </g>
          )}

          {/* Pink Nose */}
          <path
            d={`M ${g.headCx - 5.5} ${g.headCy + 10} Q ${g.headCx} ${g.headCy + 7} ${g.headCx + 5.5} ${g.headCy + 10} L ${g.headCx} ${g.headCy + 16} Z`}
            fill="#FF7E96"
            stroke={p.outline}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Mouth */}
          {animation === 'eating' ? (
            <ellipse
              cx={g.headCx}
              cy={g.headCy + 23}
              rx={8}
              ry={6.5}
              fill="#FF7E96"
              stroke={p.outline}
              strokeWidth="3"
            />
          ) : animation === 'catnip' ? (
            <path
              d={`M ${g.headCx - 9} ${g.headCy + 19} Q ${g.headCx} ${g.headCy + 32} ${g.headCx + 9} ${g.headCy + 19} Z`}
              fill="#FF7E96"
              stroke={p.outline}
              strokeWidth="3"
              strokeLinejoin="round"
            />
          ) : isNapping ? (
            <path
              d={`M ${g.headCx - 6} ${g.headCy + 21} Q ${g.headCx} ${g.headCy + 25} ${g.headCx + 6} ${g.headCy + 21}`}
              fill="none"
              stroke={p.outline}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          ) : isSad && !isBlissful ? (
            <path
              d={`M ${g.headCx - 10} ${g.headCy + 26} Q ${g.headCx} ${g.headCy + 16} ${g.headCx + 10} ${g.headCy + 26}`}
              fill="none"
              stroke={p.outline}
              strokeWidth="3.6"
              strokeLinecap="round"
            />
          ) : isNeedsCare && !isBlissful ? (
            <path
              d={`M ${g.headCx - 7} ${g.headCy + 24} Q ${g.headCx} ${g.headCy + 19} ${g.headCx + 7} ${g.headCy + 24}`}
              fill="none"
              stroke={p.outline}
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          ) : (
            <path
              d={`M ${g.headCx} ${g.headCy + 16} Q ${g.headCx - 6} ${g.headCy + 25} ${g.headCx - 13} ${g.headCy + 20} M ${g.headCx} ${g.headCy + 16} Q ${g.headCx + 6} ${g.headCy + 25} ${g.headCx + 13} ${g.headCy + 20}`}
              fill="none"
              stroke={p.outline}
              strokeWidth="3.4"
              strokeLinecap="round"
            />
          )}

          {/* Cute Whiskers */}
          <g stroke={p.outline} strokeWidth="2.4" strokeLinecap="round" opacity="0.65">
            <line x1={g.headCx - g.headRx - 8} y1={g.headCy + 8} x2={g.headCx - g.headRx + 10} y2={g.headCy + 11} />
            <line x1={g.headCx - g.headRx - 9} y1={g.headCy + 18} x2={g.headCx - g.headRx + 10} y2={g.headCy + 18} />
            <line x1={g.headCx + g.headRx + 8} y1={g.headCy + 8} x2={g.headCx + g.headRx - 10} y2={g.headCy + 11} />
            <line x1={g.headCx + g.headRx + 9} y1={g.headCy + 18} x2={g.headCx + g.headRx - 10} y2={g.headCy + 18} />
          </g>

          {/* Eye Accessories: Sunglasses / Heart Shades / Star Shades / Round Specs */}
          {eyeAcc === 'sunglasses' && (
            <g>
              <rect
                x={g.headCx - g.eyeOffsetX - 18}
                y={g.eyeY - 12}
                width={32}
                height={22}
                rx={8}
                fill="#1E293B"
                stroke="#FBBF24"
                strokeWidth="3.5"
              />
              <rect
                x={g.headCx + g.eyeOffsetX - 14}
                y={g.eyeY - 12}
                width={32}
                height={22}
                rx={8}
                fill="#1E293B"
                stroke="#FBBF24"
                strokeWidth="3.5"
              />
              <line
                x1={g.headCx - g.eyeOffsetX + 14}
                y1={g.eyeY - 2}
                x2={g.headCx + g.eyeOffsetX - 14}
                y2={g.eyeY - 2}
                stroke="#FBBF24"
                strokeWidth="4"
              />
              <line
                x1={g.headCx - g.eyeOffsetX - 11}
                y1={g.eyeY - 5}
                x2={g.headCx - g.eyeOffsetX - 2}
                y2={g.eyeY - 5}
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.8"
              />
              <line
                x1={g.headCx + g.eyeOffsetX - 7}
                y1={g.eyeY - 5}
                x2={g.headCx + g.eyeOffsetX + 2}
                y2={g.eyeY - 5}
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                opacity="0.8"
              />
            </g>
          )}

          {eyeAcc === 'heart_glasses' && (
            <g>
              <path
                transform={`translate(${g.headCx - g.eyeOffsetX - 2}, ${g.eyeY})`}
                d="M 0 13 C -12 5, -18 -2, -16 -9 C -14 -15, -6 -16, 0 -9 C 6 -16, 14 -15, 16 -9 C 18 -2, 12 5, 0 13 Z"
                fill="#FB7185"
                fillOpacity="0.88"
                stroke={p.outline}
                strokeWidth="3.2"
              />
              <path
                transform={`translate(${g.headCx + g.eyeOffsetX + 2}, ${g.eyeY})`}
                d="M 0 13 C -12 5, -18 -2, -16 -9 C -14 -15, -6 -16, 0 -9 C 6 -16, 14 -15, 16 -9 C 18 -2, 12 5, 0 13 Z"
                fill="#FB7185"
                fillOpacity="0.88"
                stroke={p.outline}
                strokeWidth="3.2"
              />
              <line
                x1={g.headCx - g.eyeOffsetX + 12}
                y1={g.eyeY - 5}
                x2={g.headCx + g.eyeOffsetX - 12}
                y2={g.eyeY - 5}
                stroke={p.outline}
                strokeWidth="3.5"
              />
            </g>
          )}

          {eyeAcc === 'star_glasses' && (
            <g>
              <path
                transform={`translate(${g.headCx - g.eyeOffsetX - 1}, ${g.eyeY})`}
                d="M 0 -17 L 5 -6 L 17 -4.5 L 8 3.5 L 10.5 15 L 0 9.5 L -10.5 15 L -8 3.5 L -17 -4.5 L -5 -6 Z"
                fill="#FBBF24"
                fillOpacity="0.9"
                stroke={p.outline}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                transform={`translate(${g.headCx + g.eyeOffsetX + 1}, ${g.eyeY})`}
                d="M 0 -17 L 5 -6 L 17 -4.5 L 8 3.5 L 10.5 15 L 0 9.5 L -10.5 15 L -8 3.5 L -17 -4.5 L -5 -6 Z"
                fill="#FBBF24"
                fillOpacity="0.9"
                stroke={p.outline}
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <line
                x1={g.headCx - g.eyeOffsetX + 10}
                y1={g.eyeY - 2}
                x2={g.headCx + g.eyeOffsetX - 10}
                y2={g.eyeY - 2}
                stroke={p.outline}
                strokeWidth="3.5"
              />
            </g>
          )}

          {eyeAcc === 'round_specs' && (
            <g>
              <circle
                cx={g.headCx - g.eyeOffsetX}
                cy={g.eyeY}
                r="15"
                fill="#E0F2FE"
                fillOpacity="0.38"
                stroke={p.outline}
                strokeWidth="3.6"
              />
              <circle
                cx={g.headCx + g.eyeOffsetX}
                cy={g.eyeY}
                r="15"
                fill="#E0F2FE"
                fillOpacity="0.38"
                stroke={p.outline}
                strokeWidth="3.6"
              />
              <line
                x1={g.headCx - g.eyeOffsetX + 15}
                y1={g.eyeY}
                x2={g.headCx + g.eyeOffsetX - 15}
                y2={g.eyeY}
                stroke={p.outline}
                strokeWidth="3.5"
              />
            </g>
          )}

          {/* Head Accessories: Bows / Crown / Tiara / Beret / Flower Crown / Party Hat / Wizard Hat */}
          {(headAcc === 'bow' || headAcc === 'bow_pink' || headAcc === 'bow_sunny') && (
            <g transform={`translate(${rightEarBaseX - 8}, ${earBaseY - 14}) rotate(18)`}>
              {(() => {
                const [main, mid] =
                  headAcc === 'bow_pink'
                    ? ['#F472B6', '#FBCFE8']
                    : headAcc === 'bow_sunny'
                      ? ['#FBBF24', '#FDE68A']
                      : ['#34D399', '#6EE7B7']
                return (
                  <>
                    <path d="M 0 0 L -18 -11 L -15 10 Z" fill={main} stroke={p.outline} strokeWidth="3.4" strokeLinejoin="round" />
                    <path d="M 0 0 L 18 -11 L 15 10 Z" fill={main} stroke={p.outline} strokeWidth="3.4" strokeLinejoin="round" />
                    <circle cx="0" cy="0" r="6.5" fill={mid} stroke={p.outline} strokeWidth="3.4" />
                  </>
                )
              })()}
            </g>
          )}

          {headAcc === 'crown' && (
            <g transform={`translate(${g.headCx}, ${g.headCy - g.headRy - 2})`}>
              <path
                d="M -22 6 L -18 -18 L -7 -6 L 0 -22 L 7 -6 L 18 -18 L 22 6 Z"
                fill="#FBBF24"
                stroke={p.outline}
                strokeWidth="3.8"
                strokeLinejoin="round"
              />
              <rect x="-22" y="3" width="44" height="7" rx="3" fill="#F59E0B" stroke={p.outline} strokeWidth="3.2" />
              <circle cx="0" cy="-4" r="3.5" fill="#FB7185" />
              <circle cx="-11" cy="-2" r="2.6" fill="#38BDF8" />
              <circle cx="11" cy="-2" r="2.6" fill="#34D399" />
            </g>
          )}

          {headAcc === 'tiara' && (
            <g transform={`translate(${g.headCx}, ${g.headCy - g.headRy + 1})`}>
              <path
                d="M -24 6 Q 0 -3 24 6 L 20 -12 L 10 -4 L 0 -22 L -10 -4 L -20 -12 Z"
                fill="#F9A8D4"
                stroke={p.outline}
                strokeWidth="3.4"
                strokeLinejoin="round"
              />
              <circle cx="0" cy="-9" r="4" fill="#FFFDF8" />
              <circle cx="-12" cy="-3" r="2.5" fill="#FDE047" />
              <circle cx="12" cy="-3" r="2.5" fill="#FDE047" />
            </g>
          )}

          {headAcc === 'beret' && (
            <g transform={`translate(${g.headCx + 4}, ${g.headCy - g.headRy + 2}) rotate(8)`}>
              <path
                d="M -30 4 C -30 -16, -6 -22, 16 -18 C 30 -15, 36 -4, 28 6 C 14 11, -14 11, -30 4 Z"
                fill="#F43F5E"
                stroke={p.outline}
                strokeWidth="3.8"
              />
              <path d="M 2 -19 L 6 -27" stroke={p.outline} strokeWidth="4" strokeLinecap="round" />
            </g>
          )}

          {headAcc === 'wizard_hat' && (
            <g transform={`translate(${g.headCx}, ${g.headCy - g.headRy + 2})`}>
              <ellipse cx="0" cy="2" rx="38" ry="9" fill="#6366F1" stroke={p.outline} strokeWidth="3.8" />
              <path d="M -22 1 L 2 -48 L 24 1 Z" fill="#818CF8" stroke={p.outline} strokeWidth="3.8" strokeLinejoin="round" />
              <circle cx="2" cy="-20" r="4.5" fill="#FDE047" />
              <circle cx="-8" cy="-8" r="3" fill="#FDE047" />
            </g>
          )}

          {headAcc === 'flower_crown' && (
            <g transform={`translate(${g.headCx}, ${g.headCy - g.headRy + 4})`}>
              <path d="M -32 2 Q 0 -10 32 2" fill="none" stroke="#34D399" strokeWidth="7" strokeLinecap="round" />
              <circle cx="-20" cy="-1" r="8" fill="#FFFFFF" stroke={p.outline} strokeWidth="2.5" />
              <circle cx="-20" cy="-1" r="3.5" fill="#FBBF24" />
              <circle cx="0" cy="-6" r="9.5" fill="#FDA4AF" stroke={p.outline} strokeWidth="2.5" />
              <circle cx="0" cy="-6" r="4" fill="#FDE047" />
              <circle cx="20" cy="-1" r="8" fill="#FFFFFF" stroke={p.outline} strokeWidth="2.5" />
              <circle cx="20" cy="-1" r="3.5" fill="#FBBF24" />
            </g>
          )}

          {headAcc === 'party_hat' && (
            <g transform={`translate(${g.headCx}, ${g.headCy - g.headRy + 2})`}>
              <path d="M -20 4 L 0 -42 L 20 4 Z" fill="#FB7185" stroke={p.outline} strokeWidth="3.8" strokeLinejoin="round" />
              <circle cx="0" cy="-42" r="7" fill="#FDE047" stroke={p.outline} strokeWidth="3" />
              <circle cx="-6" cy="-14" r="3.5" fill="#7DD3FC" />
              <circle cx="7" cy="-6" r="3.5" fill="#FEF08A" />
            </g>
          )}
          </g>
        </g>
      </svg>
    </div>
  )
}
