"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import {
  Home,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Clock,
  Menu,
  X,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSupabase } from "@/hooks/useSupabase"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const pathname = usePathname()
  const router = useRouter()
  const supabase = useSupabase()

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Erro ao fazer logout:", error)
        return
      }
      window.location.href = "/login"
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const menuItems = [
    {
      icon: Home,
      label: "Início",
      href: "/",
      active: pathname === "/",
    },
    {
      icon: BarChart3,
      label: "Pesquisas",
      href: "/surveys",
      active: pathname === "/surveys" || pathname === "/create" || pathname.startsWith("/edit"),
    },
    {
      icon: TrendingUp,
      label: "Resultados",
      href: "/results",
      active: pathname.startsWith("/results"),
    },
    {
      icon: Settings,
      label: "Configurações",
      href: "/settings",
      active: pathname === "/settings",
    },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5"></div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center p-8">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl animate-pulse-glow">
              <Zap className="w-7 h-7 text-white" />
            </div>
            {!isCollapsed && (
              <div className="ml-4 absolute left-full top-1/2 -translate-y-1/2 transition-all duration-300">
                <h1 className="font-display font-bold text-xl text-gradient">FEIND</h1>
                <p className="text-slate-400 text-xs font-medium tracking-wide">Survey Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-6 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "group relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer",
                    item.active ? "glass-orange shadow-lg shadow-orange-500/20" : "hover:glass hover:shadow-lg",
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-all duration-300",
                      item.active
                        ? "text-orange-400 drop-shadow-sm"
                        : "text-slate-400 group-hover:text-white group-hover:scale-110",
                    )}
                  />
                  {!isCollapsed && (
                    <span
                      className={cn(
                        "ml-4 font-medium transition-all duration-300",
                        item.active ? "text-white font-semibold" : "text-slate-300 group-hover:text-white",
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                  {item.active && (
                    <div className="absolute right-3 w-2 h-2 bg-orange-400 rounded-full shadow-lg shadow-orange-400/50"></div>
                  )}
                </div>
              </Link>
            )
          })}

          {/* Logout */}
          <div
            className="group relative flex items-center px-4 py-3.5 rounded-xl transition-all duration-300 cursor-pointer hover:bg-red-500/10 hover:shadow-lg hover:shadow-red-500/20 mt-6"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-300 group-hover:scale-110 transition-all duration-300" />
            {!isCollapsed && (
              <span className="ml-4 font-medium text-red-400 group-hover:text-red-300 transition-all duration-300">
                Sair
              </span>
            )}
          </div>
        </nav>

        {/* Clock Widget */}
        <div className="p-6">
          <div className="glass rounded-2xl p-5 border border-white/10 shadow-xl">
            <div className="flex items-center justify-center">
              <div className="relative">
                <Clock className="w-8 h-8 text-orange-400 drop-shadow-sm" />
                <div className="absolute inset-0 animate-pulse">
                  <Clock className="w-8 h-8 text-orange-400/30" />
                </div>
              </div>
            </div>
            {!isCollapsed && (
              <div className="mt-4 text-center">
                <div className="font-display font-bold text-xl text-white mb-1">
                  {currentTime.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div className="text-slate-400 text-sm font-medium">
                  {currentTime.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Collapse Button - Desktop Only */}
        <div className="hidden lg:block p-6 pt-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-center glass hover:glass-orange text-slate-400 hover:text-white transition-all duration-300"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden fixed top-6 left-6 z-50 glass hover:glass-orange border-0 shadow-xl"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
      </Button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-all duration-300"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden lg:flex flex-col fixed left-0 top-0 h-full border-r border-white/10 shadow-2xl transition-all duration-300 z-30",
          isCollapsed ? "w-24" : "w-72",
          className,
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "lg:hidden fixed left-0 top-0 h-full border-r border-white/10 shadow-2xl transition-transform duration-300 z-50 w-72",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}

// Hook para usar o estado da sidebar
export function useSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return {
    isCollapsed,
    setIsCollapsed,
  }
}
