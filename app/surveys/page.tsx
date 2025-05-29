"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  Users,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  LinkIcon,
  CheckCircle,
  Star,
  Search,
  X,
  Calendar,
  Tag,
  ArrowLeft,
  Grid,
  List,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SurveyStorage } from "@/lib/survey-storage"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Survey } from "@/types/survey"
import Link from "next/link"
import { FloatingMenu } from "@/components/floating-menu"
import { Input } from "@/components/ui/input"

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [surveyStats, setSurveyStats] = useState<Record<string, { responses: number; stars: number | null }>>({})
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeFilters, setActiveFilters] = useState({
    date: "all",
    status: "all",
    rating: "all",
  })

  useEffect(() => {
    loadSurveys()
  }, [])

  // Filtrar pesquisas
  useEffect(() => {
    let filtered = surveys

    // Filtro por termo de busca
    if (searchTerm) {
      filtered = filtered.filter(
        (survey) =>
          survey.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          survey.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Filtro por data
    if (activeFilters.date !== "all") {
      const now = new Date()
      const filterDate = new Date()

      switch (activeFilters.date) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
      }

      filtered = filtered.filter((survey) => new Date(survey.createdAt) >= filterDate)
    }

    // Filtro por categoria (status)
    if (activeFilters.status !== "all") {
      filtered = filtered.filter((survey) => {
        if (activeFilters.status === "active") return survey.isActive
        if (activeFilters.status === "inactive") return !survey.isActive
        return true
      })
    }

    // Filtro por avaliação
    if (activeFilters.rating !== "all") {
      filtered = filtered.filter((survey) => {
        const stats = surveyStats[survey.id]
        if (!stats?.stars) return activeFilters.rating === "no-rating"

        switch (activeFilters.rating) {
          case "excellent":
            return stats.stars >= 4.5
          case "good":
            return stats.stars >= 3.5 && stats.stars < 4.5
          case "average":
            return stats.stars >= 2.5 && stats.stars < 3.5
          case "poor":
            return stats.stars < 2.5
          default:
            return true
        }
      })
    }

    setFilteredSurveys(filtered)
  }, [surveys, searchTerm, activeFilters, surveyStats])

  const loadSurveys = async () => {
    try {
      setLoading(true)
      const loadedSurveys = await SurveyStorage.getSurveys()
      setSurveys(loadedSurveys)

      const individualStats: Record<string, { responses: number; stars: number | null }> = {}

      for (const survey of loadedSurveys) {
        const responses = await SurveyStorage.getSurveyResponses(survey.id)

        // Calcular média de estrelas
        const starFields = survey.fields.filter((f) => f.type === "stars")
        let surveyStarsAvg = null

        if (starFields.length > 0 && responses.length > 0) {
          let totalStarsForSurvey = 0
          let validResponses = 0

          responses.forEach((response) => {
            starFields.forEach((field) => {
              const value = response.answers[field.id]
              if (value && !isNaN(Number(value))) {
                totalStarsForSurvey += Number(value)
                validResponses++
              }
            })
          })

          if (validResponses > 0) {
            surveyStarsAvg = Number((totalStarsForSurvey / validResponses).toFixed(2))
          }
        }

        individualStats[survey.id] = {
          responses: responses.length,
          stars: surveyStarsAvg,
        }
      }

      setSurveyStats(individualStats)
    } catch (error) {
      console.error("Error loading surveys:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterClick = (filterType: string, value: string) => {
    setActiveFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType as keyof typeof prev] === value ? "all" : value,
    }))
  }

  const clearAllFilters = () => {
    setSearchTerm("")
    setActiveFilters({
      date: "all",
      status: "all",
      rating: "all",
    })
  }

  const deleteSurvey = async (surveyId: string) => {
    if (confirm("Tem certeza que deseja excluir esta pesquisa? Esta ação não pode ser desfeita.")) {
      try {
        await SurveyStorage.deleteSurvey(surveyId)
        await loadSurveys()
      } catch (error) {
        console.error("Error deleting survey:", error)
        alert("Erro ao excluir pesquisa. Tente novamente.")
      }
    }
  }

  const exportCSV = async (surveyId: string) => {
    try {
      const csv = await SurveyStorage.exportToCSV(surveyId)
      const survey = surveys.find((s) => s.id === surveyId)

      if (csv && survey) {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${survey.title.replace(/[^a-z0-9]/gi, "_")}_respostas_${new Date().toISOString().split("T")[0]}.csv`
        link.click()
      } else {
        alert("Nenhuma resposta encontrada para exportar.")
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Erro ao exportar CSV. Tente novamente.")
    }
  }

  const copyLink = (surveyId: string) => {
    const link = `${window.location.origin}/survey/${surveyId}`
    navigator.clipboard.writeText(link)
    setCopiedId(surveyId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-300 font-medium">Carregando pesquisas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121826] text-gray-100">
      <FloatingMenu />

      <div className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                Todas as Pesquisas
              </h1>
              <p className="text-sm text-gray-400 mt-1">Gerencie todas as suas pesquisas de satisfação</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Toggle de visualização */}
            <div className="flex items-center bg-[#1e293b] rounded-lg p-1 border border-gray-600">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={`h-8 w-8 ${viewMode === "grid" ? "bg-orange-500 text-white" : "text-gray-400"}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode("list")}
                className={`h-8 w-8 ${viewMode === "list" ? "bg-orange-500 text-white" : "text-gray-400"}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            <Link href="/create">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nova Pesquisa
              </Button>
            </Link>
          </div>
        </div>

        {/* Barra de pesquisa e filtros */}
        <div className="flex items-center gap-4 mb-6">
          {/* Barra de pesquisa */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar pesquisas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 bg-[#1e293b] border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Filtros como ícones */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {/* Filtro de Data */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFilterClick("date", "week")}
                    className={`h-10 w-10 rounded-lg ${
                      activeFilters.date !== "all"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filtrar por data</TooltipContent>
              </Tooltip>

              {/* Filtro de Status */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFilterClick("status", "active")}
                    className={`h-10 w-10 rounded-lg ${
                      activeFilters.status !== "all"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filtrar por status</TooltipContent>
              </Tooltip>

              {/* Filtro de Avaliação */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleFilterClick("rating", "excellent")}
                    className={`h-10 w-10 rounded-lg ${
                      activeFilters.rating !== "all"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                        : "text-gray-400 hover:text-white hover:bg-gray-700/50"
                    }`}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Filtrar por avaliação</TooltipContent>
              </Tooltip>

              {/* Limpar filtros */}
              {(searchTerm ||
                activeFilters.date !== "all" ||
                activeFilters.status !== "all" ||
                activeFilters.rating !== "all") && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={clearAllFilters}
                      className="h-10 w-10 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Limpar filtros</TooltipContent>
                </Tooltip>
              )}
            </TooltipProvider>
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1e293b] rounded-lg p-4 border-t border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{surveys.length}</p>
                <p className="text-sm text-gray-400">Total</p>
              </div>
              <FileText className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-lg p-4 border-t border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{surveys.filter((s) => s.isActive).length}</p>
                <p className="text-sm text-gray-400">Ativas</p>
              </div>
              <Star className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-lg p-4 border-t border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  {Object.values(surveyStats).reduce((acc, stat) => acc + stat.responses, 0)}
                </p>
                <p className="text-sm text-gray-400">Respostas</p>
              </div>
              <Users className="h-8 w-8 text-orange-400" />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-lg p-4 border-t border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">{filteredSurveys.length}</p>
                <p className="text-sm text-gray-400">Filtradas</p>
              </div>
              <Search className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Lista de pesquisas */}
        {filteredSurveys.length === 0 ? (
          <div className="bg-[#1a2332] rounded-xl p-8 text-center border border-gray-700/50">
            <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">
              {surveys.length === 0 ? "Nenhuma pesquisa encontrada" : "Nenhuma pesquisa corresponde aos filtros"}
            </h3>
            <p className="text-gray-400 mb-6">
              {surveys.length === 0
                ? "Crie sua primeira pesquisa para começar a coletar respostas."
                : "Tente ajustar os filtros ou criar uma nova pesquisa."}
            </p>
            <Link href="/create">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Criar Nova Pesquisa
              </Button>
            </Link>
          </div>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            <TooltipProvider>
              {filteredSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  stats={surveyStats[survey.id]}
                  onDelete={deleteSurvey}
                  onExport={exportCSV}
                  onCopyLink={copyLink}
                  copiedId={copiedId}
                  viewMode={viewMode}
                />
              ))}
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  )
}

interface SurveyCardProps {
  survey: Survey
  stats?: { responses: number; stars: number | null }
  onDelete: (id: string) => void
  onExport: (id: string) => void
  onCopyLink: (id: string) => void
  copiedId: string | null
  viewMode: "grid" | "list"
}

function SurveyCard({ survey, stats, onDelete, onExport, onCopyLink, copiedId, viewMode }: SurveyCardProps) {
  const surveyIcon = survey.icon || "⭐"

  if (viewMode === "list") {
    return (
      <div className="bg-[#1e293b] rounded-lg p-4 border border-gray-700/50 hover:border-orange-500/30 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">
              {surveyIcon}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/results/${survey.id}`} className="block">
                <h3 className="text-lg font-bold text-white hover:text-orange-400 transition-colors">{survey.title}</h3>
                <p className="text-sm text-gray-400 truncate">{survey.description}</p>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Badge
              className={
                survey.isActive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
              }
            >
              {survey.isActive ? "Ativa" : "Inativa"}
            </Badge>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-orange-400 mr-1" />
                <span className="text-white font-medium">{stats?.responses || 0}</span>
              </div>
              <div className="flex items-center">
                <Star className="w-4 h-4 text-orange-400 mr-1" />
                <span className="text-white font-medium">{stats?.stars !== null ? `${stats.stars}/5` : "0/5"}</span>
              </div>
            </div>

            <div className="flex space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-gray-700/50"
                    onClick={() => window.open(`/survey/${survey.id}`, "_blank")}
                  >
                    <Eye className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-gray-700/50"
                    onClick={() => (window.location.href = `/edit/${survey.id}`)}
                  >
                    <Edit className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-gray-700/50"
                    onClick={() => onCopyLink(survey.id)}
                  >
                    {copiedId === survey.id ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar Link</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-gray-700/50"
                    onClick={() => onExport(survey.id)}
                  >
                    <Download className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-gray-700/50 text-red-400 hover:text-red-300"
                    onClick={() => onDelete(survey.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (card format)
  return (
    <Link href={`/results/${survey.id}`} className="block h-full">
      <div className="bg-[#1e293b] rounded-lg shadow-lg border-b border-orange-500/30 h-full flex flex-col hover:translate-y-[-4px] transition-all duration-300 cursor-pointer">
        <div className="bg-gradient-to-r from-[#2a3548] to-[#1e293b] p-4 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-lg">
                {surveyIcon}
              </div>
              <Badge
                className={
                  survey.isActive
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                }
              >
                {survey.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>

            <div className="flex space-x-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-gray-700/50"
                    onClick={(e) => {
                      e.preventDefault()
                      window.open(`/survey/${survey.id}`, "_blank")
                    }}
                  >
                    <Eye className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Visualizar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-gray-700/50"
                    onClick={(e) => {
                      e.preventDefault()
                      window.location.href = `/edit/${survey.id}`
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-gray-700/50"
                    onClick={(e) => {
                      e.preventDefault()
                      onDelete(survey.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Excluir</TooltipContent>
              </Tooltip>
            </div>
          </div>

          <h3 className="text-lg font-bold text-white mt-3">{survey.title}</h3>
        </div>

        <div className="p-4 flex-1">
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">{survey.description}</p>

          <div className="flex items-center justify-between text-sm border-t border-gray-700/50 pt-4 mt-auto">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Users className="w-4 h-4 text-orange-400 mr-1" />
                <span className="text-white font-medium">{stats?.responses || 0}</span>
              </div>

              <div className="flex items-center">
                <Star className="w-4 h-4 text-orange-400 mr-1" />
                <span className="text-white font-medium">
                  {stats?.stars !== null ? `${stats.stars}/5.00` : "0/5.00"}
                </span>
              </div>
            </div>

            <div className="flex space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-gray-700/50"
                    onClick={(e) => {
                      e.preventDefault()
                      onCopyLink(survey.id)
                    }}
                  >
                    {copiedId === survey.id ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <LinkIcon className="h-3.5 w-3.5 text-gray-400" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Copiar Link</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full hover:bg-gray-700/50"
                    onClick={(e) => {
                      e.preventDefault()
                      onExport(survey.id)
                    }}
                  >
                    <Download className="h-3.5 w-3.5 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Exportar CSV</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
