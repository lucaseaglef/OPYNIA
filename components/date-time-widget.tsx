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
      month: "long",
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
    <div className="bg-white/5 backdrop-blur-md rounded-lg px-4 py-3 border border-orange-500/20">
      <div className="flex items-center space-x-3">
        <div className="flex items-center text-orange-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">{formatDate(currentTime)}</span>
        </div>
        <div className="w-px h-4 bg-orange-500/30"></div>
        <div className="flex items-center text-orange-400">
          <Clock className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">{formatTime(currentTime)}</span>
        </div>
      </div>
    </div>
  )
}
