import type { FoodItem, MessType } from '../types/game'

interface IconProps {
  className?: string
}

export function FishBowlIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {/* Bowl */}
      <path
        d="M6 21 C6 30 12 34 20 34 C28 34 34 30 34 21 Z"
        fill="#F59E0B"
        stroke="#5B3A29"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <ellipse cx="20" cy="21" rx="14" ry="4.5" fill="#FDE68A" stroke="#5B3A29" strokeWidth="2.4" />
      {/* Little fish peeking out */}
      <path
        d="M15 16 C18 11 25 11 28 16 C25 19 18 19 15 16 Z"
        fill="#FB7185"
        stroke="#5B3A29"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M15 16 L10 12.5 L11 19.5 Z" fill="#FB7185" stroke="#5B3A29" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="24" cy="15.2" r="1.4" fill="#5B3A29" />
    </svg>
  )
}

export function SparklesIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M19 5 L22.5 14.5 L32 18 L22.5 21.5 L19 31 L15.5 21.5 L6 18 L15.5 14.5 Z"
        fill="#38BDF8"
        stroke="#5B3A29"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M31 24 L32.8 28.2 L37 30 L32.8 31.8 L31 36 L29.2 31.8 L25 30 L29.2 28.2 Z"
        fill="#BAE6FD"
        stroke="#5B3A29"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="30" r="2.6" fill="#7DD3FC" stroke="#5B3A29" strokeWidth="1.8" />
    </svg>
  )
}

export function HeartIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 34 C11 27 5 21 5 14.5 C5 9.8 8.8 6.5 13.2 6.5 C16.2 6.5 18.6 8.1 20 10.6 C21.4 8.1 23.8 6.5 26.8 6.5 C31.2 6.5 35 9.8 35 14.5 C35 21 29 27 20 34 Z"
        fill="#FB7185"
        stroke="#5B3A29"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <ellipse cx="13.5" cy="13" rx="3" ry="1.8" transform="rotate(-25 13.5 13)" fill="#FFE4E6" />
    </svg>
  )
}

export function PawCoinIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="16" fill="#FBBF24" stroke="#784418" strokeWidth="2.8" />
      <circle cx="20" cy="20" r="12" fill="#FDE68A" />
      {/* Mini paw print inside coin */}
      <ellipse cx="20" cy="23" rx="5.2" ry="4.2" fill="#D97706" />
      <circle cx="14.5" cy="16.8" r="2.2" fill="#D97706" />
      <circle cx="18.2" cy="14.2" r="2.2" fill="#D97706" />
      <circle cx="22.4" cy="14.2" r="2.2" fill="#D97706" />
      <circle cx="25.8" cy="16.8" r="2.2" fill="#D97706" />
    </svg>
  )
}

export function BroomIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <line x1="28" y1="6" x2="17" y2="23" stroke="#A16207" strokeWidth="4.5" strokeLinecap="round" />
      <line x1="28" y1="6" x2="17" y2="23" stroke="#5B3A29" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M12 20 L22 26 L16 35 C12 34 8 32 5 28 Z"
        fill="#38BDF8"
        stroke="#5B3A29"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M12 20 L22 26" stroke="#FBBF24" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="31" cy="27" r="2.5" fill="#7DD3FC" stroke="#5B3A29" strokeWidth="1.5" />
    </svg>
  )
}

export function BrushIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <ellipse cx="16" cy="16" rx="10" ry="7.5" transform="rotate(-35 16 16)" fill="#F472B6" stroke="#5B3A29" strokeWidth="2.5" />
      <rect x="21" y="21" width="13" height="6" rx="3" transform="rotate(42 21 21)" fill="#FBCFE8" stroke="#5B3A29" strokeWidth="2.4" />
      <circle cx="13" cy="14" r="1.4" fill="#FFF" />
      <circle cx="17" cy="13" r="1.4" fill="#FFF" />
      <circle cx="15" cy="18" r="1.4" fill="#FFF" />
      <path d="M30 8 L31.5 11.5 L35 13 L31.5 14.5 L30 18 L28.5 14.5 L25 13 L28.5 11.5 Z" fill="#FBBF24" />
    </svg>
  )
}

export function PlayYarnIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="19" cy="19" r="13" fill="#FB7185" stroke="#5B3A29" strokeWidth="2.6" />
      <path d="M10 13 C17 11 24 14 29 21" fill="none" stroke="#FFE4E6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 20 C16 18 23 22 27 29" fill="none" stroke="#FFE4E6" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M16 7 C14 14 16 23 22 30" fill="none" stroke="#BE123C" strokeWidth="2" strokeLinecap="round" />
      <path d="M29 27 C33 29 36 33 34 36" fill="none" stroke="#FB7185" strokeWidth="3.2" strokeLinecap="round" />
    </svg>
  )
}

export function StyleCrownIcon({ className = 'w-7 h-7' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M6 29 L9 12 L16 19 L20 9 L24 19 L31 12 L34 29 Z"
        fill="#FBBF24"
        stroke="#5B3A29"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <rect x="7" y="28" width="26" height="5" rx="2.5" fill="#F59E0B" stroke="#5B3A29" strokeWidth="2.4" />
      <circle cx="20" cy="22" r="2.6" fill="#FB7185" />
      <circle cx="13" cy="24" r="2" fill="#38BDF8" />
      <circle cx="27" cy="24" r="2" fill="#34D399" />
    </svg>
  )
}

export function GearIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}

export function StarIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path
        d="M20 4 L24.8 14.1 L36 15.6 L27.8 23.4 L29.9 34.5 L20 29.1 L10.1 34.5 L12.2 23.4 L4 15.6 L15.2 14.1 Z"
        fill="#FBBF24"
        stroke="#784418"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function LockIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

export function FoodIcon({ foodId, className = 'w-12 h-12' }: { foodId: FoodItem['id']; className?: string }) {
  switch (foodId) {
    case 'kibble':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M8 31 C8 43 16 48 28 48 C40 48 48 43 48 31 Z" fill="#F59E0B" stroke="#5B3A29" strokeWidth="3" strokeLinejoin="round" />
          <ellipse cx="28" cy="31" rx="20" ry="6" fill="#FDE68A" stroke="#5B3A29" strokeWidth="2.8" />
          <circle cx="21" cy="27" r="4.5" fill="#92400E" stroke="#5B3A29" strokeWidth="2" />
          <circle cx="29" cy="24.5" r="4.8" fill="#B45309" stroke="#5B3A29" strokeWidth="2" />
          <circle cx="36" cy="27.5" r="4.3" fill="#92400E" stroke="#5B3A29" strokeWidth="2" />
          <circle cx="26" cy="30" r="4.2" fill="#78350F" stroke="#5B3A29" strokeWidth="2" />
        </svg>
      )
    case 'milk':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M18 14 L38 14 L41 24 L41 44 C41 46.5 39 48 36 48 L20 48 C17 48 15 46.5 15 44 L15 24 Z" fill="#FFFFFF" stroke="#5B3A29" strokeWidth="3" strokeLinejoin="round" />
          <rect x="19" y="8" width="18" height="6" rx="2.5" fill="#7DD3FC" stroke="#5B3A29" strokeWidth="2.8" />
          <rect x="15.5" y="27" width="25" height="12" fill="#BAE6FD" />
          <circle cx="28" cy="33" r="3.5" fill="#38BDF8" />
        </svg>
      )
    case 'treat':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          {/* Fish-shaped cookie */}
          <path
            d="M16 28 C21 15 38 14 46 28 C38 42 21 41 16 28 Z"
            fill="#F6AD55"
            stroke="#5B3A29"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M16 28 L7 19 L9 37 Z" fill="#F6AD55" stroke="#5B3A29" strokeWidth="3" strokeLinejoin="round" />
          <circle cx="37" cy="26" r="2.6" fill="#5B3A29" />
          <circle cx="27" cy="25" r="2.2" fill="#9C4221" />
          <circle cx="31" cy="32" r="2.2" fill="#9C4221" />
          <circle cx="23" cy="31" r="1.8" fill="#9C4221" />
        </svg>
      )
    case 'salmon':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path
            d="M10 34 C10 20 24 14 44 16 C48 22 48 34 42 40 C30 44 14 42 10 34 Z"
            fill="#FB7185"
            stroke="#5B3A29"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M18 22 C23 27 24 33 21 39" fill="none" stroke="#FFE4E6" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M27 18 C32 24 33 32 30 39" fill="none" stroke="#FFE4E6" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M36 17 C40 23 41 30 38 37" fill="none" stroke="#FFE4E6" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      )
    case 'catnip':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          {/* Cute green catnip leaves & sparkle */}
          <path
            d="M28 46 C28 32 16 20 14 14 C22 14 30 22 30 34 Z"
            fill="#4ADE80"
            stroke="#166534"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M28 46 C28 32 40 20 42 14 C34 14 26 22 26 34 Z"
            fill="#34D399"
            stroke="#166534"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          <path
            d="M28 46 C28 30 28 16 28 9 C34 15 35 28 28 46 Z"
            fill="#86EFAC"
            stroke="#166534"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="30" r="2.5" fill="#FBBF24" />
          <circle cx="43" cy="28" r="2.2" fill="#FBBF24" />
        </svg>
      )
  }
}

export function MessSprite({ type, className = 'w-14 h-14' }: { type: MessType; className?: string }) {
  switch (type) {
    case 'pawprints':
      return (
        <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
          <g fill="#B08968" stroke="#5B3A29" strokeWidth="2.2">
            <ellipse cx="22" cy="36" rx="8" ry="6.5" />
            <circle cx="14" cy="27" r="3.4" />
            <circle cx="21" cy="23.5" r="3.4" />
            <circle cx="28" cy="26.5" r="3.4" />
            <g transform="translate(18, -10) scale(0.75)">
              <ellipse cx="28" cy="36" rx="8" ry="6.5" />
              <circle cx="20" cy="27" r="3.4" />
              <circle cx="27" cy="23.5" r="3.4" />
              <circle cx="34" cy="26.5" r="3.4" />
            </g>
          </g>
        </svg>
      )
    case 'hairball':
      return (
        <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
          <path
            d="M17 37 C12 31 15 21 23 20 C27 14 38 15 41 22 C48 24 49 34 42 39 C38 45 22 45 17 37 Z"
            fill="#D6B99E"
            stroke="#5B3A29"
            strokeWidth="2.6"
            strokeLinejoin="round"
          />
          <path d="M23 28 C27 25 33 26 36 30" fill="none" stroke="#8A6552" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M24 35 C29 33 34 34 38 36" fill="none" stroke="#8A6552" strokeWidth="2.2" strokeLinecap="round" />
          <path d="M16 25 L12 21 M44 21 L48 17" stroke="#8A6552" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      )
    case 'toy':
      return (
        <svg viewBox="0 0 60 60" className={className} aria-hidden="true">
          {/* Tumbled mouse toy */}
          <ellipse cx="32" cy="34" rx="14" ry="10" transform="rotate(-14 32 34)" fill="#94A3B8" stroke="#5B3A29" strokeWidth="2.6" />
          <circle cx="23" cy="24" r="6" fill="#CBD5E1" stroke="#5B3A29" strokeWidth="2.4" />
          <circle cx="23" cy="24" r="3" fill="#FDA4AF" />
          <circle cx="19" cy="36" r="2.2" fill="#FB7185" />
          <path d="M45 31 C52 29 54 37 49 41" fill="none" stroke="#FB7185" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
  }
}

export function ShuffleDiceIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" fill="#FFFDF8" />
      <circle cx="8.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="15.5" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function AccessoryPreviewIcon({ id, className = 'w-12 h-12' }: { id: string; className?: string }) {
  const ribbonColors: Record<string, string> = {
    ribbon_coral: '#FB7185',
    ribbon_mint: '#34D399',
    ribbon_sunny: '#FBBF24',
    ribbon_sky: '#38BDF8',
  }
  if (id in ribbonColors) {
    const col = ribbonColors[id]
    return (
      <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
        <path d="M10 26 Q28 36 46 26" fill="none" stroke={col} strokeWidth="8.5" strokeLinecap="round" />
        <circle cx="28" cy="31" r="5" fill={col} stroke="#5B3A29" strokeWidth="2.4" />
        <path d="M26 35 L20 44 M30 35 L36 44" stroke={col} strokeWidth="5" strokeLinecap="round" />
      </svg>
    )
  }

  const bellColors: Record<string, string> = {
    collar: '#FB7185',
    collar_sky: '#38BDF8',
    collar_gold: '#F59E0B',
  }
  if (id in bellColors) {
    return (
      <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
        <path d="M10 24 Q28 36 46 24" fill="none" stroke={bellColors[id]} strokeWidth="9" strokeLinecap="round" />
        <circle cx="28" cy="34" r="8" fill="#FBBF24" stroke="#5B3A29" strokeWidth="2.6" />
        <circle cx="28" cy="36" r="2" fill="#5B3A29" />
      </svg>
    )
  }

  const bowColors: Record<string, [string, string]> = {
    bow: ['#34D399', '#6EE7B7'],
    bow_pink: ['#F472B6', '#FBCFE8'],
    bow_sunny: ['#FBBF24', '#FDE68A'],
  }
  if (id in bowColors) {
    const [main, mid] = bowColors[id]
    return (
      <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
        <path d="M28 28 L10 18 L12 38 Z" fill={main} stroke="#5B3A29" strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M28 28 L46 18 L44 38 Z" fill={main} stroke="#5B3A29" strokeWidth="2.8" strokeLinejoin="round" />
        <circle cx="28" cy="28" r="6.5" fill={mid} stroke="#5B3A29" strokeWidth="2.8" />
      </svg>
    )
  }

  const bandanaColors: Record<string, string> = {
    bandana: '#38BDF8',
    bandana_coral: '#FB7185',
    bandana_mint: '#34D399',
  }
  if (id in bandanaColors) {
    return (
      <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
        <path d="M8 18 L48 18 L28 44 Z" fill={bandanaColors[id]} stroke="#5B3A29" strokeWidth="2.8" strokeLinejoin="round" />
        <path d="M28 23 L30 28 L35 28.5 L31 31.8 L32.2 37 L28 34 L23.8 37 L25 31.8 L21 28.5 L26 28 Z" fill="#FEF08A" />
      </svg>
    )
  }

  switch (id) {
    case 'bowtie':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M28 28 L10 19 L10 37 Z M28 28 L46 19 L46 37 Z" fill="#EF4444" stroke="#5B3A29" strokeWidth="2.8" strokeLinejoin="round" />
          <rect x="23" y="22" width="10" height="12" rx="4" fill="#FCA5A5" stroke="#5B3A29" strokeWidth="2.6" />
        </svg>
      )
    case 'scarf':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <rect x="10" y="18" width="36" height="14" rx="7" fill="#FB923C" stroke="#5B3A29" strokeWidth="2.8" />
          <rect x="30" y="26" width="12" height="20" rx="5" fill="#F97316" stroke="#5B3A29" strokeWidth="2.8" />
          <line x1="16" y1="25" x2="36" y2="25" stroke="#FFEDD5" strokeWidth="3" strokeDasharray="4 4" />
        </svg>
      )
    case 'sunglasses':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <rect x="6" y="20" width="19" height="14" rx="5" fill="#1E293B" stroke="#FBBF24" strokeWidth="3" />
          <rect x="31" y="20" width="19" height="14" rx="5" fill="#1E293B" stroke="#FBBF24" strokeWidth="3" />
          <line x1="25" y1="26" x2="31" y2="26" stroke="#FBBF24" strokeWidth="3.2" />
          <line x1="10" y1="24" x2="15" y2="24" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" />
          <line x1="35" y1="24" x2="40" y2="24" stroke="#FFF" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'heart_glasses':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M16 35 C10 30 6 26 6 22 C6 18.5 9 17 11.5 17 C13.5 17 15 18 16 19.5 C17 18 18.5 17 20.5 17 C23 17 26 18.5 26 22 C26 26 22 30 16 35 Z" fill="#FB7185" stroke="#5B3A29" strokeWidth="2.5" />
          <path d="M40 35 C34 30 30 26 30 22 C30 18.5 33 17 35.5 17 C37.5 17 39 18 40 19.5 C41 18 42.5 17 44.5 17 C47 17 50 18.5 50 22 C50 26 46 30 40 35 Z" fill="#FB7185" stroke="#5B3A29" strokeWidth="2.5" />
          <line x1="25" y1="22" x2="31" y2="22" stroke="#5B3A29" strokeWidth="2.8" />
        </svg>
      )
    case 'star_glasses':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M16 16 L18.5 22 L25 22.8 L20 27 L21.4 33.5 L16 30.2 L10.6 33.5 L12 27 L7 22.8 L13.5 22 Z" fill="#FBBF24" stroke="#5B3A29" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M40 16 L42.5 22 L49 22.8 L44 27 L45.4 33.5 L40 30.2 L34.6 33.5 L36 27 L31 22.8 L37.5 22 Z" fill="#FBBF24" stroke="#5B3A29" strokeWidth="2.4" strokeLinejoin="round" />
          <line x1="23" y1="24" x2="33" y2="24" stroke="#5B3A29" strokeWidth="2.8" />
        </svg>
      )
    case 'round_specs':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <circle cx="16" cy="28" r="9.5" fill="#E0F2FE" fillOpacity="0.6" stroke="#5B3A29" strokeWidth="3" />
          <circle cx="40" cy="28" r="9.5" fill="#E0F2FE" fillOpacity="0.6" stroke="#5B3A29" strokeWidth="3" />
          <line x1="25.5" y1="28" x2="30.5" y2="28" stroke="#5B3A29" strokeWidth="3" />
        </svg>
      )
    case 'crown':
      return <StyleCrownIcon className={className} />
    case 'tiara':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M10 35 Q28 27 46 35 L42 22 L34 28 L28 15 L22 28 L14 22 Z" fill="#F9A8D4" stroke="#5B3A29" strokeWidth="2.6" strokeLinejoin="round" />
          <circle cx="28" cy="24" r="3.4" fill="#FFFDF8" />
        </svg>
      )
    case 'beret':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M9 34 C9 20 22 15 36 18 C45 20 49 28 45 35 C37 39 18 39 9 34 Z" fill="#F43F5E" stroke="#5B3A29" strokeWidth="2.8" />
          <path d="M27 16 L30 11" stroke="#5B3A29" strokeWidth="3.2" strokeLinecap="round" />
        </svg>
      )
    case 'wizard_hat':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <ellipse cx="28" cy="41" rx="22" ry="6.5" fill="#6366F1" stroke="#5B3A29" strokeWidth="2.8" />
          <path d="M13 40 L27 9 L43 40 Z" fill="#818CF8" stroke="#5B3A29" strokeWidth="2.8" strokeLinejoin="round" />
          <circle cx="28" cy="27" r="3.2" fill="#FDE047" />
          <circle cx="22" cy="34" r="2.2" fill="#FDE047" />
        </svg>
      )
    case 'flower_crown':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M8 32 Q28 22 48 32" fill="none" stroke="#34D399" strokeWidth="6" strokeLinecap="round" />
          <circle cx="15" cy="29" r="6" fill="#FFF" stroke="#5B3A29" strokeWidth="2" />
          <circle cx="15" cy="29" r="2.6" fill="#FBBF24" />
          <circle cx="28" cy="25" r="7" fill="#FDA4AF" stroke="#5B3A29" strokeWidth="2" />
          <circle cx="28" cy="25" r="3" fill="#FDE047" />
          <circle cx="41" cy="29" r="6" fill="#FFF" stroke="#5B3A29" strokeWidth="2" />
          <circle cx="41" cy="29" r="2.6" fill="#FBBF24" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M14 44 L28 10 L42 44 Z" fill="#FB7185" stroke="#5B3A29" strokeWidth="2.8" strokeLinejoin="round" />
          <circle cx="28" cy="10" r="5" fill="#FDE047" stroke="#5B3A29" strokeWidth="2.4" />
          <circle cx="24" cy="29" r="3" fill="#7DD3FC" />
          <circle cx="33" cy="36" r="3" fill="#FEF08A" />
        </svg>
      )
  }
}

export function DecorPreviewIcon({ id, className = 'w-12 h-12' }: { id: string; className?: string }) {
  switch (id) {
    case 'cat_tree':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <rect x="10" y="44" width="36" height="6" rx="3" fill="#D9A066" stroke="#5B3A29" strokeWidth="2.4" />
          <rect x="24" y="20" width="8" height="25" fill="#E8C08D" stroke="#5B3A29" strokeWidth="2.4" />
          <rect x="14" y="14" width="28" height="8" rx="4" fill="#FDE68A" stroke="#5B3A29" strokeWidth="2.4" />
          <rect x="28" y="30" width="18" height="6" rx="3" fill="#FDE68A" stroke="#5B3A29" strokeWidth="2.2" />
        </svg>
      )
    case 'window_cushion':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <rect x="8" y="22" width="40" height="18" rx="9" fill="#FDA4AF" stroke="#5B3A29" strokeWidth="2.8" />
          <path d="M14 27 Q28 32 42 27" fill="none" stroke="#FFE4E6" strokeWidth="3" strokeLinecap="round" />
        </svg>
      )
    case 'fairy_lights':
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <path d="M6 20 Q28 34 50 20" fill="none" stroke="#5B3A29" strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="14" cy="25" r="4.5" fill="#FDE047" stroke="#5B3A29" strokeWidth="1.8" />
          <circle cx="28" cy="29" r="4.8" fill="#FDA4AF" stroke="#5B3A29" strokeWidth="1.8" />
          <circle cx="42" cy="25" r="4.5" fill="#7DD3FC" stroke="#5B3A29" strokeWidth="1.8" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 56 56" className={className} aria-hidden="true">
          <ellipse cx="28" cy="30" rx="22" ry="12" fill="#818CF8" stroke="#5B3A29" strokeWidth="2.8" />
          <ellipse cx="28" cy="30" rx="16" ry="8" fill="#A5B4FC" />
          <circle cx="20" cy="29" r="2.2" fill="#FEF08A" />
          <circle cx="28" cy="27" r="2.6" fill="#FEF08A" />
          <circle cx="36" cy="31" r="2.2" fill="#FEF08A" />
        </svg>
      )
  }
}
