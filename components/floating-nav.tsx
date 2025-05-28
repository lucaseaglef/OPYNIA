"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Home, Plus, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OpyniaLogo } from "@/components/opynia-logo"
import { useMobile } from "@/hooks/use-mobile"

export function FloatingNav() {
  const [scrolled, setScrolled] = useState(false)
  const isMobile = useMobile()

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY
      setScrolled(offset > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1e293b]/80 backdrop-blur-md border-t border-gray-800 py-2 px-4">
        <div className="flex items-center justify-around">
          <Link href="/">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-12 w-12 flex flex-col items-center justify-center"
            >
              <Home className="h-5 w-5 text-gray-300" />
              <span className="text-[10px] mt-1 text-gray-400">Dashboard</span>
            </Button>
          </Link>

          <Link href="/create">
            <Button className="rounded-full h-14 w-14 bg-orange-500 hover:bg-orange-600 flex flex-col items-center justify-center -mt-6 shadow-lg shadow-orange-500/20">
              <Plus className="h-6 w-6 text-white" />
              <span className="text-[10px] mt-0.5 text-white/90">Nova</span>
            </Button>
          </Link>

          <Link href="/profile">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-12 w-12 flex flex-col items-center justify-center"
            >
              <User className="h-5 w-5 text-gray-300" />
              <span className="text-[10px] mt-1 text-gray-400">Perfil</span>
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-3"}`}
    >
      <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-full shadow-xl border border-gray-700/30 px-4 flex items-center">
        <Link href="/">
          <Button variant="ghost" className="rounded-full text-gray-300 hover:text-white hover:bg-gray-700/30">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
        </Link>

        <div className="mx-4 h-8 flex items-center">
          <OpyniaLogo size="sm" />
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/create">
            <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Nova Pesquisa
            </Button>
          </Link>

          <Link href="/profile">
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-gray-700/30 hover:bg-gray-700/50">
              <User className="h-4 w-4 text-gray-300" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
