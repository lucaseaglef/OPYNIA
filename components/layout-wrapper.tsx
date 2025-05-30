"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()

  // Páginas que não devem ter sidebar
  const noSidebarPages = ["/login", "/auth/login"]
  const isSurveyPage = pathname.startsWith("/survey/")
  const shouldShowSidebar = !noSidebarPages.includes(pathname) && !isSurveyPage

  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <main className="flex-1 lg:ml-64 transition-all duration-300">
        <div className="lg:hidden h-16" /> {/* Spacer for mobile menu button */}
        {children}
      </main>
    </div>
  )
}
