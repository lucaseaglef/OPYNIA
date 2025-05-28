import { Button } from "@/components/ui/button"
import { TrendingUp, ArrowRight } from "lucide-react"

interface SurveySummary {
  name: string
  score: number
}

interface OrangeSummaryCardProps {
  averageScore: number
  recentSurveys: SurveySummary[]
}

export function OrangeSummaryCard({ averageScore, recentSurveys }: OrangeSummaryCardProps) {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold">{averageScore}%</p>
          <p className="text-orange-100 text-sm">Média Geral</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <h3 className="font-semibold text-orange-100">Últimas Pesquisas</h3>
        {recentSurveys.map((survey, index) => (
          <div key={index} className="flex items-center justify-between py-2 border-b border-white/20 last:border-b-0">
            <span className="text-sm text-orange-100 truncate">{survey.name}</span>
            <span className="font-semibold">{survey.score}%</span>
          </div>
        ))}
      </div>

      <Button variant="ghost" className="w-full bg-white/20 hover:bg-white/30 text-white border-0 rounded-lg">
        Ver Todas
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  )
}
