"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock } from "lucide-react"

export function DateTimeDisplay() {
  const [dateTime, setDateTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
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
    <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-lg border-b border-orange-500/30 p-4 flex flex-col">
      <div className="flex items-center text-gray-300 mb-1">
        <Calendar className="h-4 w-4 mr-2 text-orange-400" />
        <span className="text-sm">{formatDate(dateTime)}</span>
      </div>
      <div className="flex items-center text-white">
        <Clock className="h-4 w-4 mr-2 text-orange-400" />
        <span className="text-xl font-medium">{formatTime(dateTime)}</span>
      </div>
    </div>
  )
}
