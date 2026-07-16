// Brand mark: "travelpin" wordmark with pictorial letters -
// t = lighthouse, v = flight path + plane, the p is a map pin,
// the i's dot is a luggage lock. Four-color palette, one hand-drawn
// SVG so every piece stays pixel-aligned to the same baseline grid.

const BLUE = '#4285F4'
const RED = '#EA4335'
const YELLOW = '#FBBC05'
const GREEN = '#34A853'

const FONT = "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', sans-serif"

function Lighthouse({ x = 0, color = BLUE }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {/* flag */}
      <line x1="34" y1="2" x2="34" y2="14" stroke={color} strokeWidth="4" strokeLinecap="round" />
      <path d="M34 3 L49 8 L34 13 Z" fill={color} />
      {/* lantern room */}
      <rect x="21" y="14" width="26" height="11" rx="2" fill={color} />
      {/* tapered tower */}
      <path d="M25 24 L16 90 L52 90 L43 24 Z" fill={color} />
      {/* gallery band */}
      <rect x="13" y="50" width="42" height="7" rx="3.5" fill={color} />
      {/* windows */}
      <rect x="29" y="32" width="10" height="10" rx="2" fill="#fff" />
      <rect x="27" y="68" width="14" height="10" rx="2" fill="#fff" />
      {/* base platform */}
      <rect x="9" y="88" width="50" height="6" rx="3" fill={color} />
    </g>
  )
}

function FlightPath({ x = 0, color = GREEN }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path d="M6 10 L32 90" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path d="M32 90 L60 12" stroke={color} strokeWidth="14" strokeLinecap="round" fill="none" />
      <path
        d="M33 84 L58 16"
        stroke="#fff"
        strokeWidth="2.5"
        strokeDasharray="0.5 7"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M64 0 L46 10 L58 20 Z" fill={color} />
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

function IWithLock({ x = 0, color = GREEN, accent = GREEN }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="10" y="38" width="14" height="52" rx="7" fill={color} />
      {/* luggage-lock dot */}
      <path
        d="M11 20 a6 6 0 0 1 12 0 v4 h-12 z"
        fill="none"
        stroke={accent}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <rect x="7" y="22" width="20" height="14" rx="3" fill={accent} />
    </g>
  )
}

/** Full "travelpin" wordmark - used in the header. */
export function LogoFull({ height = 36, className = '' }) {
  return (
    <svg
      viewBox="0 0 640 108"
      height={height}
      className={className}
      role="img"
      aria-label="TravelPin"
    >
      <Lighthouse x={0} color={BLUE} />
      <text x={72} y="90" fontFamily={FONT} fontWeight="700" fontSize="90" fill={RED}>
        r
      </text>
      <text x={122} y="90" fontFamily={FONT} fontWeight="700" fontSize="90" fill={YELLOW}>
        a
      </text>
      <FlightPath x={196} color={GREEN} />
      <text x={278} y="90" fontFamily={FONT} fontWeight="700" fontSize="90" fill={BLUE}>
        e
      </text>
      <text x={336} y="90" fontFamily={FONT} fontWeight="700" fontSize="90" fill={YELLOW}>
        l
      </text>
      <PinLetter x={365} color={RED} />
      <IWithLock x={428} color={GREEN} accent={GREEN} />
      <text x={462} y="90" fontFamily={FONT} fontWeight="700" fontSize="90" fill={BLUE}>
        n
      </text>
    </svg>
  )
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
