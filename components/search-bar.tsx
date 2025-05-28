"use client"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  return (
    <div className="flex justify-center mb-8">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Buscar pesquisas..."
          className="pl-10 bg-slate-800/60 backdrop-blur-sm border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-orange-500"
        />
      </div>
    </div>
  )
}
