"use client"
import { Home, BarChart3, Search, LogOut, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSupabase } from "@/hooks/useSupabase"
import { useRouter } from "next/navigation"

export function FloatingMenu() {
  const supabase = useSupabase()
  const router = useRouter()

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

  return (
    <>
      {/* Desktop Floating Menu */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 hidden md:block">
        <div className="bg-white/5 backdrop-blur-md rounded-full px-6 py-2 shadow-lg border border-white/10">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:scale-105 transition-all"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>

            <Link href="/create">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:scale-105 transition-all"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Pesquisas
              </Button>
            </Link>

            {/* Logo Central */}
            <div className="px-4">
              <span className="text-xl font-bold text-orange-500">FEIND</span>
            </div>

            <Link href="/results">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-300 hover:text-white hover:scale-105 transition-all"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Resultados
              </Button>
            </Link>

            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:scale-105 transition-all">
              <Settings className="w-4 h-4 mr-2" />
              Config
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-300 hover:text-white hover:scale-105 transition-all"
            >
              <LogOut className="w-4 h-4 mr-2 text-orange-400" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Top Menu */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden bg-slate-900/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold text-orange-500">FEIND</span>
          <div className="flex items-center space-x-2">
            <Link href="/create">
              <Button variant="ghost" size="icon" className="text-gray-300">
                <BarChart3 className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="text-gray-300">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-gray-300">
              <LogOut className="w-4 h-4 text-orange-400" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
