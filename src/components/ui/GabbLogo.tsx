/**
 * Gabb Global logo — clean SVG globe-G.
 * A circular ring shaped as the letter G (gap + crossbar on the right),
 * with green continental shapes, on a light sky-blue rounded-square background.
 *
 * Geometry:
 *   Center (50,50), outer radius 44, inner radius 28.
 *   Gap spans ±50° from the 3-o'clock position (right side).
 *   Crossbar fills the gap horizontally at mid-height.
 */
interface GabbLogoProps {
  size?: number
  className?: string
  /** Show full "Gabb Global" text wordmark next to the globe */
  showWordmark?: boolean
}

export default function GabbLogo({ size = 36, className = '', showWordmark = false }: GabbLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Gabb Global logo"
      >
        {/* Rounded-square background */}
        <rect width="100" height="100" rx="22" fill="#DCF0F9" />

        {/*
          G-ring: outer C-arc (CCW, large) from upper-right notch to lower-right notch,
          connected via inner C-arc (CW, large) back up — forming a donut-C shape.

          Outer circle R=44, notch at ±50° from horizontal right:
            Upper: (78.3, 16.3)   Lower: (78.3, 83.7)
          Inner circle r=28, same angles:
            Upper: (68.0, 28.6)   Lower: (68.0, 71.4)
        */}
        <path
          d="M 78.3 16.3 A 44 44 0 1 0 78.3 83.7 L 68 71.4 A 28 28 0 1 1 68 28.6 Z"
          fill="#4CC8E8"
        />

        {/* G crossbar — fills the right-side gap, mid-height */}
        <rect x="64" y="41" width="30" height="18" rx="3.5" fill="#4CC8E8" />

        {/* Continental shapes — clipped to ring region visually */}
        {/* Upper-left (North America) */}
        <ellipse cx="31" cy="33" rx="13" ry="8"  fill="#4A9660" transform="rotate(-22 31 33)" />
        {/* Upper-center (Europe) */}
        <ellipse cx="52" cy="22" rx="7"  ry="4.5" fill="#4A9660" transform="rotate(8 52 22)" />
        {/* Left-middle (Africa top) */}
        <ellipse cx="22" cy="55" rx="8"  ry="5.5" fill="#4A9660" transform="rotate(5 22 55)" />
        {/* Lower-left (South America) */}
        <ellipse cx="33" cy="72" rx="9"  ry="5.5" fill="#4A9660" transform="rotate(12 33 72)" />
      </svg>

      {showWordmark && (
        <span
          className="font-display font-extrabold tracking-tight text-white"
          style={{ fontSize: size * 0.44 }}
        >
          Gabb<span style={{ color: '#4CC8E8' }}> Global</span>
        </span>
      )}
    </div>
  )
}
