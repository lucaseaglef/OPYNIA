"use client"

interface OpyniaLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function OpyniaLogo({ size = "md", showText = true, className = "" }: OpyniaLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
    xl: "text-3xl",
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Modern Logo Icon */}
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md relative overflow-hidden`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_70%)]"></div>

        {/* Main icon - Modern chart/analytics symbol */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3 text-white relative z-10"
        >
          {/* Base chart bars */}
          <rect x="6" y="18" width="3" height="8" rx="1.5" fill="currentColor" opacity="0.9" />
          <rect x="12" y="14" width="3" height="12" rx="1.5" fill="currentColor" />
          <rect x="18" y="10" width="3" height="16" rx="1.5" fill="currentColor" />
          <rect x="24" y="6" width="3" height="20" rx="1.5" fill="currentColor" opacity="0.9" />

          {/* Modern connecting line */}
          <path
            d="M7.5 20L13.5 16L19.5 12L25.5 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.8"
          />

          {/* Accent dots */}
          <circle cx="7.5" cy="20" r="1.5" fill="white" />
          <circle cx="13.5" cy="16" r="1.5" fill="white" />
          <circle cx="19.5" cy="12" r="1.5" fill="white" />
          <circle cx="25.5" cy="8" r="1.5" fill="white" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold text-gray-900 leading-none tracking-tight`}>FEIND</h1>
          {size !== "sm" && <p className="text-xs text-orange-600 font-medium tracking-wide">Survey Platform</p>}
        </div>
      )}
    </div>
  )
}
