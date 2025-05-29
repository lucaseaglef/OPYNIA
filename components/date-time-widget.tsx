"use client"

import { useState, useEffect } from "react"
import { Clock, Calendar } from "lucide-react"

export function DateTimeWidget() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="inline-flex items-center space-x-4 px-3 py-2 bg-gray-800/30 backdrop-blur-sm rounded-lg border border-gray-700/30">
      <div className="flex items-center text-gray-300">
        <Calendar className="w-3.5 h-3.5 mr-2 text-orange-400/70" />
        <span className="text-xs font-medium">{formatDate(currentTime)}</span>
      </div>
      <div className="w-px h-3 bg-gray-600"></div>
      <div className="flex items-center text-gray-300">
        <Clock className="w-3.5 h-3.5 mr-2 text-orange-400/70" />
        <span className="text-xs font-medium">{formatTime(currentTime)}</span>
      </div>
    </div>
  )
}
