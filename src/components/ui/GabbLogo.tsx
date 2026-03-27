/**
 * Gabb Global Globe "G" logo — SVG component matching the brand asset.
 * Sky blue globe ring (#4CC8E8) with green continental shapes (#4A9660),
 * shaped as the letter G with the opening in the upper-right.
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
        {/* Light sky-blue background */}
        <rect width="100" height="100" rx="22" fill="#DCF0F9" />

        {/* Globe ring shaped as G — using mask to cut the donut + G notch */}
        <defs>
          <mask id="g-globe-mask">
            {/* Start with full white (visible) */}
            <rect width="100" height="100" fill="white" />
            {/* Cut the inner hole of the ring */}
            <circle cx="50" cy="50" r="26" fill="black" />
            {/* Cut the G notch — upper-right wedge from ~12 o'clock to ~2 o'clock */}
            <polygon points="50,50 62,6 96,6 96,52" fill="black" />
          </mask>
        </defs>

        {/* Sky-blue ring body */}
        <circle cx="50" cy="50" r="46" fill="#4CC8E8" mask="url(#g-globe-mask)" />

        {/* G crossbar — horizontal bar extending right at mid-height */}
        <rect x="56" y="43" width="38" height="14" rx="5" fill="#4CC8E8" />

        {/* Continental shapes in forest green */}
        {/* Upper-left continent (North America-ish) */}
        <path
          d="M 34 12 C 46 8 60 12 62 20 C 64 26 56 28 48 26 C 42 24 34 20 34 16 Z"
          fill="#4A9660"
        />
        {/* Right mid continent */}
        <path d="M 74 36 L 86 42 L 84 54 L 72 50 Z" fill="#4A9660" />
        {/* Lower-right continent (South America-ish) */}
        <path
          d="M 70 60 C 78 60 84 66 82 74 C 80 80 70 82 64 76 C 60 72 62 64 68 62 Z"
          fill="#4A9660"
        />
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
