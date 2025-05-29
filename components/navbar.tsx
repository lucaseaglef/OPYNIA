"use client"

import { useState, useEffect } from "react"
import { LogOut, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useSupabase } from "@/hooks/useSupabase"

export function Navbar() {
  const [user, setUser] = useState<any>(null)
  const supabase = useSupabase()

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    } catch (error) {
      console.error("Erro ao carregar usuário:", error)
    }
  }

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

  const getUserName = () => {
    if (user?.user_metadata?.name) return user.user_metadata.name
    if (user?.email) {
      const emailName = user.email.split("@")[0]
      return emailName.charAt(0).toUpperCase() + emailName.slice(1)
    }
    return "Usuário"
  }

  const getUserInitials = () => {
    const name = getUserName()
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#121826]/95 backdrop-blur-md border-b border-gray-800/50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo à esquerda */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
                FEIND
              </span>
            </Link>
          </div>

          {/* Menu central - apenas desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700/30">
                Dashboard
              </Button>
            </Link>
            <Link href="/surveys">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-700/30">
                Pesquisas
              </Button>
            </Link>
            <Link href="/create">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2">Nova Pesquisa</Button>
            </Link>
          </div>

          {/* Usuário à direita */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-3 hover:bg-gray-700/30 px-3 py-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-medium text-white">{getUserName()}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.user_metadata?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-orange-500 text-white text-sm">{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1a2332] border-gray-700">
                <div className="px-3 py-2 sm:hidden">
                  <p className="text-sm font-medium text-white">{getUserName()}</p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-gray-700 sm:hidden" />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="flex items-center text-gray-300 hover:text-white">
                    <User className="mr-2 h-4 w-4" />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:text-red-300">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
