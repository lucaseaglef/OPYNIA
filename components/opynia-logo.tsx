"use client"

interface OpyniaLogoProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function OpyniaLogo({ size = "md", showText = true, className = "" }: OpyniaLogoProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
    xl: "text-4xl",
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Modern Logo Icon */}
      <div
        className={`${sizeClasses[size]} opynia-gradient rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>

        {/* Main icon - Modern chart/analytics symbol */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-2/3 h-2/3 text-white relative z-10"
        >
          {/* Base chart bars */}
          <rect x="4" y="20" width="4" height="8" rx="2" fill="currentColor" opacity="0.8" />
          <rect x="10" y="16" width="4" height="12" rx="2" fill="currentColor" />
          <rect x="16" y="12" width="4" height="16" rx="2" fill="currentColor" />
          <rect x="22" y="8" width="4" height="20" rx="2" fill="currentColor" opacity="0.9" />

          {/* Modern connecting line */}
          <path d="M6 22L12 18L18 14L24 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

          {/* Accent dots */}
          <circle cx="6" cy="22" r="2" fill="currentColor" />
          <circle cx="12" cy="18" r="2" fill="currentColor" />
          <circle cx="18" cy="14" r="2" fill="currentColor" />
          <circle cx="24" cy="10" r="2" fill="currentColor" />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`${textSizeClasses[size]} font-bold opynia-text-gradient leading-none tracking-tight`}>
            Opynia
          </h1>
          {size !== "sm" && (
            <p className="text-xs text-gray-600 font-medium tracking-wide uppercase">Survey Platform</p>
          )}
        </div>
      )}
    </div>
  )
}
