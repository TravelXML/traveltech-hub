// Brand mark: "travelpin" wordmark with pictorial letters -
// t = lighthouse, v = flight path + plane, the p is a map pin,
// the i's dot is a luggage lock. LogoFull renders the actual designed
// artwork (src/assets/logo-full.png - background keyed to transparent from
// the original opaque-white export). LogoMark is a compact hand-drawn SVG
// icon-only version (lighthouse + pin) for places too narrow for the full
// wordmark, since no separate icon-only asset exists for that yet.

import logoFullSrc from '../assets/logo-full.png'

const BLUE = '#4285F4'
const RED = '#EA4335'
const YELLOW = '#FBBC05'
const GREEN = '#34A853'

function Lighthouse({ x = 0, color = BLUE }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {/* flag */}
      <line x1="34" y1="2" x2="34" y2="14" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M34 3 L49 8 L34 13 Z" fill={color} />
      {/* lantern room */}
      <rect x="21" y="14" width="26" height="11" rx="4" fill={color} />
      {/* tapered tower - curved shoulders and a gentle outward bow, not a
          straight trapezoid, so the silhouette reads as a lighthouse rather
          than a flat wedge */}
      <path
        d="M25 24C20.5 24 18.5 28 17.8 34C16.5 46 15 68 14 90L34 92L54 90C53 68 51.5 46 50.2 34C49.5 28 47.5 24 43 24Z"
        fill={color}
      />
      {/* gallery band */}
      <rect x="12" y="50" width="44" height="8" rx="4" fill={color} />
      {/* windows */}
      <rect x="28" y="31" width="12" height="12" rx="3" fill="#fff" />
      <rect x="26" y="68" width="16" height="12" rx="3" fill="#fff" />
      {/* base platform - a slightly domed footing instead of a flat bar */}
      <path d="M7 94C7 90 19 88 34 88C49 88 61 90 61 94C61 97 49 98 34 98C19 98 7 97 7 94Z" fill={color} />
    </g>
  )
}

function PinLetter({ x = 0, color = RED }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx="30" cy="94" rx="16" ry="4" fill="#000" opacity="0.12" />
      <path
        d="M30 8C13.4 8 0 21.4 0 38c0 24 30 56 30 56s30-32 30-56C60 21.4 46.6 8 30 8z"
        fill={color}
      />
      <circle cx="30" cy="38" r="13" fill="#fff" />
    </g>
  )
}

/** Full "travelpin" wordmark - used in the header and footer. */
export function LogoFull({ height = 36, className = '' }) {
  return <img src={logoFullSrc} alt="TravelPin" height={height} style={{ height }} className={className} />
}

/** Icon-only mark (lighthouse + pin) - used for the favicon and compact contexts. */
export function LogoMark({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 108 108"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="TravelPin"
    >
      <g transform="translate(0 4) scale(0.72)">
        <Lighthouse x={0} color={BLUE} />
      </g>
      <g transform="translate(46 6) scale(0.72)">
        <PinLetter x={0} color={RED} />
      </g>
    </svg>
  )
}

export const LOGO_COLORS = { blue: BLUE, red: RED, yellow: YELLOW, green: GREEN }
