"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchBarProps {
  onSearch?: (term: string) => void
  placeholder?: string
}

export function SearchBar({ onSearch, placeholder = "Buscar pesquisas..." }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    onSearch?.(value)
  }

  const clearSearch = () => {
    setSearchTerm("")
    onSearch?.("")
  }

  return (
    <div className="relative max-w-md mx-auto">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10 bg-[#1e293b] border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
