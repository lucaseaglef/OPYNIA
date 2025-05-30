"use client"

import type React from "react"

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
  Grid,
  List,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SurveyStorage } from "@/lib/survey-storage"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Survey } from "@/types/survey"
import Link from "next/link"
import { useSupabase } from "@/hooks/useSupabase"
import { DateTimeWidget } from "@/components/date-time-widget"
import { Input } from "@/components/ui/input"

export default function Dashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [filteredSurveys, setFilteredSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0,
    avgStars: 0,
  })
  const [surveyStats, setSurveyStats] = useState<Record<string, { responses: number; stars: number | null }>>({})
  const [mounted, setMounted] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [recentResponses, setRecentResponses] = useState<any[]>([])
  const [userName, setUserName] = useState("Admin")
  const [displayText, setDisplayText] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeFilters, setActiveFilters] = useState({
    date: "all",
    status: "all",
    rating: "all",
  })

  const supabase = useSupabase()

  useEffect(() => {
    setMounted(true)
    loadSurveys()
    loadUserProfile()
  }, [])

  // Animação de digitação
  useEffect(() => {
    const greeting = getGreeting()
    const fullText = `${greeting}, ${userName}!`
    let currentIndex = 0

    const typeWriter = () => {
      if (currentIndex < fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex + 1))
        currentIndex++
        setTimeout(typeWriter, 80)
      }
    }

    typeWriter()
  }, [userName])

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

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user?.user_metadata?.name) {
        setUserName(user.user_metadata.name)
      } else if (user?.email) {
        const emailName = user.email.split("@")[0]
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
      }
    } catch (error) {
      console.error("Erro ao carregar perfil do usuário:", error)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return "Bom dia"
    if (hour >= 12 && hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  const loadSurveys = async () => {
    try {
      setLoading(true)
      setError(null)

      const loadedSurveys = await SurveyStorage.getSurveys()
      setSurveys(loadedSurveys)

      let totalResponses = 0
      let totalStars = 0
      let starsCount = 0
      const individualStats: Record<string, { responses: number; stars: number | null }> = {}
      const allRecentResponses: any[] = []

      for (const survey of loadedSurveys) {
        const responses = await SurveyStorage.getSurveyResponses(survey.id)
        totalResponses += responses.length

        // Coletar respostas recentes com mais detalhes
        responses.slice(-5).forEach((response) => {
          // Procurar campo de nome na resposta
          let respondentName = "Anônimo"

          // Procurar por campos que possam conter o nome do respondente
          for (const fieldId in response.answers) {
            const field = survey.fields.find((f) => f.id === fieldId)
            if (field) {
              // Verificar se o campo tem "nome" no label (case insensitive)
              if (field.label.toLowerCase().includes("nome") && response.answers[fieldId]) {
                respondentName = response.answers[fieldId]
                break
              }
            }
          }

          allRecentResponses.push({
            id: response.id,
            surveyTitle: survey.title,
            surveyId: survey.id,
            respondentName: respondentName,
            submittedAt: response.submittedAt,
            type: "response",
            description: `Respondeu "${survey.title}"`,
          })
        })

        // Calcular média de estrelas (0-5.00)
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
            totalStars += surveyStarsAvg
            starsCount++
          }
        }

        individualStats[survey.id] = {
          responses: responses.length,
          stars: surveyStarsAvg,
        }
      }

      // Ordenar respostas recentes por data e pegar apenas as 4 últimas
      allRecentResponses.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      setRecentResponses(allRecentResponses.slice(0, 4))

      setSurveyStats(individualStats)

      setStats({
        totalSurveys: loadedSurveys.length,
        totalResponses,
        activeSurveys: loadedSurveys.filter((s) => s.isActive).length,
        avgStars: starsCount > 0 ? Number((totalStars / starsCount).toFixed(1)) : 0,
      })
    } catch (error) {
      console.error("Error loading surveys:", error)
      setError("Erro ao carregar pesquisas do banco de dados. Verifique a conexão.")
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

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-300 font-medium">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header centralizado */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-orange-400 mr-3" />
            <h1 className="font-display text-5xl font-bold text-gradient">
              {displayText}
              <span className="animate-pulse">|</span>
            </h1>
          </div>
          <div className="flex items-center justify-center mb-4">
            <DateTimeWidget />
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Gerencie suas pesquisas de satisfação com facilidade e obtenha insights valiosos dos seus dados.
          </p>
        </div>

        {/* Stats Cards - centralizados e menores */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12 max-w-4xl mx-auto">
          <StatCard
            icon={<FileText className="h-5 w-5 text-orange-400" />}
            label="Pesquisas"
            value={stats.totalSurveys}
            trend="+12%"
            trendType="positive"
          />
          <StatCard
            icon={<Activity className="h-5 w-5 text-orange-400" />}
            label="Ativas"
            value={stats.activeSurveys}
            trend="Ativo"
            trendType="positive"
          />
          <StatCard
            icon={<Users className="h-5 w-5 text-orange-400" />}
            label="Respostas"
            value={stats.totalResponses}
            trend="+5"
            trendType="positive"
          />
          <StatCard
            icon={<Star className="h-5 w-5 text-orange-400" />}
            label="Média"
            value={stats.avgStars}
            trend="/5.0"
            trendType="neutral"
          />
        </div>

        {/* Controles centralizados */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Barra de pesquisa */}
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar pesquisas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-12 h-12 glass border-white/10 text-white placeholder-slate-400 focus:border-orange-500/50 focus:ring-orange-500/20 rounded-xl"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-slate-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Filtros e controles */}
            <div className="flex items-center gap-3">
              <TooltipProvider>
                {/* Filtros */}
                <div className="flex items-center gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFilterClick("date", "week")}
                        className={`h-10 w-10 rounded-xl transition-all duration-300 ${
                          activeFilters.date !== "all"
                            ? "glass-orange shadow-lg shadow-orange-500/20"
                            : "glass hover:glass-orange"
                        }`}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Filtrar por data</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFilterClick("status", "active")}
                        className={`h-10 w-10 rounded-xl transition-all duration-300 ${
                          activeFilters.status !== "all"
                            ? "glass-orange shadow-lg shadow-orange-500/20"
                            : "glass hover:glass-orange"
                        }`}
                      >
                        <Tag className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Filtrar por status</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleFilterClick("rating", "excellent")}
                        className={`h-10 w-10 rounded-xl transition-all duration-300 ${
                          activeFilters.rating !== "all"
                            ? "glass-orange shadow-lg shadow-orange-500/20"
                            : "glass hover:glass-orange"
                        }`}
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Filtrar por avaliação</TooltipContent>
                  </Tooltip>
                </div>

                {/* Toggle de visualização */}
                <div className="flex items-center glass rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className={`h-8 w-8 rounded-lg transition-all duration-300 ${
                      viewMode === "grid" ? "bg-orange-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className={`h-8 w-8 rounded-lg transition-all duration-300 ${
                      viewMode === "list" ? "bg-orange-500 text-white shadow-lg" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>

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
                        className="h-10 w-10 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
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
        </div>

        {/* Lista de Pesquisas centralizada */}
        <div className="max-w-6xl mx-auto">
          <div className="glass rounded-2xl p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <h2 className="font-display text-2xl font-bold text-white">Suas Pesquisas</h2>
                <Badge className="glass-orange px-3 py-1 text-orange-300 border-orange-500/30 font-medium">
                  {filteredSurveys.length} de {surveys.length}
                </Badge>
              </div>
              <Link href="/create">
                <Button className="btn-modern bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl px-6 py-3 rounded-xl font-medium">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Pesquisa
                </Button>
              </Link>
            </div>

            {filteredSurveys.length === 0 ? (
              <div className="glass rounded-2xl p-12 text-center border border-orange-500/20">
                <FileText className="h-16 w-16 text-slate-500 mx-auto mb-6" />
                <h3 className="font-display text-2xl font-semibold text-white mb-3">
                  {surveys.length === 0 ? "Nenhuma pesquisa encontrada" : "Nenhuma pesquisa corresponde aos filtros"}
                </h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
                  {surveys.length === 0
                    ? "Crie sua primeira pesquisa para começar a coletar respostas valiosas."
                    : "Tente ajustar os filtros ou criar uma nova pesquisa."}
                </p>
                <Link href="/create">
                  <Button className="btn-modern bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl px-6 py-3 rounded-xl font-medium">
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Nova Pesquisa
                  </Button>
                </Link>
              </div>
            ) : (
              <div
                className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}
              >
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
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  trend?: string
  trendType?: "positive" | "negative" | "neutral"
}

function StatCard({ icon, label, value, trend, trendType = "neutral" }: StatCardProps) {
  const trendColors = {
    positive: "text-green-400",
    negative: "text-red-400",
    neutral: "text-slate-400",
  }

  return (
    <div className="glass rounded-xl p-4 border border-white/10 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl glass-orange flex items-center justify-center shadow-lg">{icon}</div>
        {trend && (
          <span className={`text-xs font-medium ${trendColors[trendType]} flex items-center`}>
            {trendType === "positive" && <TrendingUp className="h-3 w-3 mr-1" />}
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
        <p className="text-sm text-slate-400 font-medium">{label}</p>
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
      <div className="glass rounded-xl p-4 border border-white/10 hover:border-orange-500/30 transition-all duration-300 hover:shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="w-12 h-12 rounded-xl glass-orange flex items-center justify-center text-lg shadow-lg">
              {surveyIcon}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/results/${survey.id}`} className="block">
                <h3 className="font-display text-lg font-semibold text-white hover:text-orange-400 transition-colors">
                  {survey.title}
                </h3>
                <p className="text-sm text-slate-400 truncate">{survey.description}</p>
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <Badge
              className={
                survey.isActive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-red-500/20 text-red-400 border border-red-500/30"
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
              <ActionButton
                icon={Eye}
                onClick={() => window.open(`/survey/${survey.id}`, "_blank")}
                tooltip="Visualizar"
              />
              <ActionButton
                icon={Edit}
                onClick={() => (window.location.href = `/edit/${survey.id}`)}
                tooltip="Editar"
              />
              <ActionButton
                icon={copiedId === survey.id ? CheckCircle : LinkIcon}
                onClick={() => onCopyLink(survey.id)}
                tooltip="Copiar Link"
                variant={copiedId === survey.id ? "success" : "default"}
              />
              <ActionButton icon={Download} onClick={() => onExport(survey.id)} tooltip="Exportar CSV" />
              <ActionButton icon={Trash2} onClick={() => onDelete(survey.id)} tooltip="Excluir" variant="danger" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Grid view (card format) - mais compacto
  return (
    <Link href={`/results/${survey.id}`} className="block h-full">
      <div className="modern-card h-full flex flex-col hover:translate-y-[-2px] transition-all duration-300 cursor-pointer group">
        <div className="glass-orange p-4 rounded-t-xl">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-lg shadow-lg">
                {surveyIcon}
              </div>
              <Badge
                className={
                  survey.isActive
                    ? "bg-green-500/30 text-green-300 border border-green-400/30"
                    : "bg-red-500/30 text-red-300 border border-red-400/30"
                }
              >
                {survey.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>

            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ActionButton
                icon={Eye}
                onClick={(e) => {
                  e.preventDefault()
                  window.open(`/survey/${survey.id}`, "_blank")
                }}
                tooltip="Visualizar"
                size="sm"
              />
              <ActionButton
                icon={Edit}
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = `/edit/${survey.id}`
                }}
                tooltip="Editar"
                size="sm"
              />
              <ActionButton
                icon={Trash2}
                onClick={(e) => {
                  e.preventDefault()
                  onDelete(survey.id)
                }}
                tooltip="Excluir"
                variant="danger"
                size="sm"
              />
            </div>
          </div>

          <h3 className="font-display text-lg font-semibold text-white group-hover:text-orange-200 transition-colors">
            {survey.title}
          </h3>
        </div>

        <div className="p-4 flex-1 flex flex-col">
          <p className="text-sm text-slate-400 line-clamp-2 mb-4 flex-1">{survey.description}</p>

          <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4">
            <div className="flex items-center space-x-4">
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
              <ActionButton
                icon={copiedId === survey.id ? CheckCircle : LinkIcon}
                onClick={(e) => {
                  e.preventDefault()
                  onCopyLink(survey.id)
                }}
                tooltip="Copiar Link"
                variant={copiedId === survey.id ? "success" : "default"}
                size="sm"
              />
              <ActionButton
                icon={Download}
                onClick={(e) => {
                  e.preventDefault()
                  onExport(survey.id)
                }}
                tooltip="Exportar CSV"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

interface ActionButtonProps {
  icon: React.ComponentType<{ className?: string }>
  onClick: (e?: React.MouseEvent) => void
  tooltip: string
  variant?: "default" | "success" | "danger"
  size?: "default" | "sm"
}

function ActionButton({ icon: Icon, onClick, tooltip, variant = "default", size = "default" }: ActionButtonProps) {
  const variants = {
    default: "text-slate-400 hover:text-white hover:bg-white/10",
    success: "text-green-400 hover:text-green-300 hover:bg-green-500/10",
    danger: "text-red-400 hover:text-red-300 hover:bg-red-500/10",
  }

  const sizes = {
    default: "h-8 w-8",
    sm: "h-7 w-7",
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${sizes[size]} rounded-lg transition-all duration-300 ${variants[variant]}`}
          onClick={onClick}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
}
