import type React from "react"
import { Badge } from "@/components/ui/badge"

interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
}

export function MetricCard({ icon, title, value, change, changeType = "neutral" }: MetricCardProps) {
  const changeColors = {
    positive: "bg-green-500/20 text-green-400 border-green-500/30",
    negative: "bg-red-500/20 text-red-400 border-red-500/30",
    neutral: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border-b border-orange-500/30 shadow-md hover:shadow-lg transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">{icon}</div>
        {change && <Badge className={changeColors[changeType]}>{change}</Badge>}
      </div>

      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{title}</p>
      </div>
    </div>
  )
}
