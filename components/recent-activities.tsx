import { User, Edit, Eye, Plus } from "lucide-react"
import Link from "next/link"

interface Activity {
  id: string
  type: "response" | "edit" | "view" | "create"
  description: string
  timeAgo: string
  surveyId?: string
  respondentName?: string
  submittedAt?: string
  surveyTitle?: string
}

interface RecentActivitiesProps {
  activities: Activity[]
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const getIcon = (type: Activity["type"]) => {
    switch (type) {
      case "response":
        return <User className="h-4 w-4 text-green-400" />
      case "edit":
        return <Edit className="h-4 w-4 text-blue-400" />
      case "view":
        return <Eye className="h-4 w-4 text-gray-400" />
      case "create":
        return <Plus className="h-4 w-4 text-orange-400" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return "Data desconhecida"
    }
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border-b border-orange-500/30 shadow-md">
      <h3 className="text-lg font-semibold text-white mb-4">Atividades Recentes</h3>

      <div className="space-y-4">
        {activities.map((activity) => (
          <Link key={activity.id} href={activity.surveyId ? `/results/${activity.surveyId}` : "#"} className="block">
            <div className="flex items-start space-x-3 p-2 rounded hover:bg-slate-700/30 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                {getIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                {activity.respondentName && <p className="text-sm font-medium text-white">{activity.respondentName}</p>}
                <p className="text-sm text-gray-300">{activity.description}</p>
                {activity.surveyTitle && <p className="text-xs text-gray-400 mt-1">{activity.surveyTitle}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {activity.submittedAt ? formatDateTime(activity.submittedAt) : activity.timeAgo}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
