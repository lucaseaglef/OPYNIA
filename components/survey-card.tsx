"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, Edit, Trash2, Users, Target } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from "next/link"

interface SurveyCardProps {
  id: string
  title: string
  status: "active" | "inactive"
  responses: number
  nps: number
  onDelete: (id: string) => void
}

export function SurveyCard({ id, title, status, responses, nps, onDelete }: SurveyCardProps) {
  return (
    <TooltipProvider>
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl shadow-md border-b border-orange-500/30 hover:shadow-lg transition-all duration-200 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Badge
              className={
                status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
              }
            >
              {status === "active" ? "Ativa" : "Inativa"}
            </Badge>

            <div className="flex space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/survey/${id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-700">
                      <Eye className="h-4 w-4 text-gray-400" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Visualizar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/edit/${id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-700">
                      <Edit className="h-4 w-4 text-gray-400" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-slate-700"
                    onClick={() => onDelete(id)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-4 line-clamp-2">{title}</h3>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-400">
                <Users className="h-4 w-4 mr-1" />
                <span>{responses}</span>
              </div>
              <div className="flex items-center text-gray-400">
                <Target className="h-4 w-4 mr-1" />
                <span>{nps}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
