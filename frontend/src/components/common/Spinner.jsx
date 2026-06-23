/**
 * Spinner — unified 8-ray sunburst loading indicator.
 *
 * Design source: Figma "loading big" (node 253:2320)
 *   8 rounded bars radiating from center at 45° intervals.
 *   The lead bar steps clockwise every 100 ms (1 of 8 positions active).
 */
const SIZE_CLASSES = {
    sm: "w-5 h-5",
    md: "w-16 h-16",
    lg: "w-[110px] h-[111px]",
  };
  
  const VARIANT_COLORS = {
    primary: { lead: "#FF4800", trail: "#FFE4D9" },
    onPrimary: { lead: "#FFFFFF", trail: "rgba(255,255,255,0.6)" },
  };
  
  const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
  
  export default function Spinner({
    size = "md",
    variant = "primary",
    label = "Loading...",
    showLabel = true,
    className = "",
  }) {
    const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
    const colors = VARIANT_COLORS[variant] || VARIANT_COLORS.primary;
  
    return (
      <div className={`flex flex-col items-center gap-8 ${className}`}>
        <div className={sizeClass}>
          <svg
            viewBox="0 0 130 131"
            className="w-full h-full"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {RAY_ANGLES.map((angle, i) => (
              <g key={angle} transform={`rotate(${angle} 65 65.5)`}>
                {/* trail bar — always visible */}
                <rect
                  x="60.5"
                  y="0"
                  width="9"
                  height="45"
                  rx="4"
                  fill={colors.trail}
                />
                {/* lead overlay — flashes on for 100 ms per cycle */}
                <rect
                  x="60.5"
                  y="0"
                  width="9"
                  height="45"
                  rx="4"
                  fill={colors.lead}
                  style={{
                    opacity: 0,
                    animation: `spinner-step 800ms step-end infinite`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              </g>
            ))}
          </svg>
        </div>
        {showLabel && (
          <span className="text-text-primary text-base font-normal font-sans">
            {label}
          </span>
        )}
      </div>
    );
  }