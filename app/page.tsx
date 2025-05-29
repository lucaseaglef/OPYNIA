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
  Clock,
  User,
  LinkIcon,
  CheckCircle,
  ArrowUp,
  TrendingUp,
  ArrowRight,
  Activity,
  Star,
  Calendar,
  Tag,
  Search,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SurveyStorage } from "@/lib/survey-storage"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { Survey } from "@/types/survey"
import Link from "next/link"
import { useSupabase } from "@/hooks/useSupabase"
import { FloatingMenu } from "@/components/floating-menu"
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
        setTimeout(typeWriter, 100)
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
      <div className="min-h-screen bg-[#121826] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-300 font-medium">Carregando dados...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121826] text-gray-100 flex flex-col">
      <FloatingMenu />

      <div className="flex-1 pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Saudação alinhada à esquerda */}
        <div className="text-left mb-6">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent mb-3">
            {displayText}
            <span className="animate-pulse">|</span>
          </h1>
          <div className="flex items-center mb-4">
            <DateTimeWidget />
          </div>
          <p className="text-sm text-gray-400">Aqui estão os dados atualizados das suas pesquisas de satisfação.</p>
        </div>

        {/* Layout seguindo a Productly */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Área principal - 3 colunas */}
          <div className="lg:col-span-3 space-y-6">
            {/* Stats Cards - melhorados */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<FileText className="h-6 w-6 text-orange-400" />}
                label="Pesquisas Criadas"
                value={stats.totalSurveys}
                trend="+12% este mês"
                trendType="positive"
              />

              <StatCard
                icon={<Activity className="h-6 w-6 text-orange-400" />}
                label="Pesquisas Ativas"
                value={stats.activeSurveys}
                trend="Coletando dados"
                trendType="positive"
              />

              <StatCard
                icon={<Users className="h-6 w-6 text-orange-400" />}
                label="Total de Respostas"
                value={stats.totalResponses}
                trend="+5 hoje"
                trendType="positive"
              />

              <StatCard
                icon={<Star className="h-6 w-6 text-orange-400" />}
                label="Nota Média Geral"
                value={stats.avgStars}
                trend="de 5.0"
                trendType="neutral"
              />
            </div>

            {/* Barra de pesquisa e filtros na mesma linha */}
            <div className="flex items-center gap-4">
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

            {/* Divisor sutil entre filtros e pesquisas */}
            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>

            {/* Lista de Formulários */}
            <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-700/50 min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-bold text-white">Suas Pesquisas</h2>
                  <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    {filteredSurveys.length} de {surveys.length} pesquisas
                  </Badge>
                </div>
                <Link href="/create">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Pesquisa
                  </Button>
                </Link>
              </div>

              {filteredSurveys.length === 0 ? (
                <div className="bg-[#1e293b] rounded-lg p-8 text-center border border-orange-500/20">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      />
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar direita - 1 coluna */}
          <div className="space-y-6">
            {/* Bloco Laranja integrado com título */}
            <div className="relative">
              {/* Título integrado ao card */}
              <div className="bg-[#1e293b] border-t border-orange-500 rounded-t-lg px-4 py-3 text-center">
                <h3 className="text-sm font-semibold text-white">Últimas Pesquisas</h3>
              </div>

              {/* Card laranja sem arredondamento superior */}
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-b-xl p-6 text-white shadow-lg">
                <div className="text-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <p className="text-2xl font-bold">{stats.avgStars}</p>
                  <p className="text-orange-100 text-sm font-semibold">MÉDIA GERAL</p>
                </div>

                <div className="space-y-3 mb-4">
                  {surveys.slice(0, 3).map((survey, index) => (
                    <Link key={index} href={`/results/${survey.id}`}>
                      <div className="flex items-center justify-between py-2 border-b border-white/20 last:border-b-0 hover:bg-white/10 rounded px-2 cursor-pointer transition-colors">
                        <span className="text-sm text-orange-100 truncate max-w-[140px]" title={survey.title}>
                          ⭐ {survey.title}
                        </span>
                        <span className="font-semibold text-white text-sm">
                          {surveyStats[survey.id]?.stars ? `${surveyStats[survey.id].stars}/5` : "0/5"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>

                <Link href="/surveys">
                  <Button
                    variant="ghost"
                    className="w-full bg-[#121826] hover:bg-[#1a2332] text-white border-0 rounded-lg text-sm py-2"
                  >
                    Ver Todas
                    <ArrowRight className="h-3 w-3 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Atividades Recentes - borda laranja na parte inferior */}
            <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-lg shadow-lg border-b-2 border-orange-500 flex flex-col h-[500px]">
              <div className="p-4 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-orange-400 mr-2" />
                  <h3 className="text-sm font-semibold text-white">Atividades Recentes</h3>
                </div>
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs">Ao vivo</Badge>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                {recentResponses.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Nenhuma resposta recente</p>
                ) : (
                  <div className="space-y-4">
                    {recentResponses.map((response, index) => (
                      <Link key={index} href={`/results/${response.surveyId}`} className="block">
                        <div className="flex items-start space-x-3 p-2 rounded hover:bg-gray-700/30 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-[#2a3548] flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-orange-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{response.respondentName}</p>
                            <p className="text-xs text-gray-400 truncate" title={response.surveyTitle}>
                              {response.surveyTitle}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(response.submittedAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="mt-12 py-6 border-t border-gray-700/50 bg-[#0f1419]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400">
            Desenvolvido por <span className="text-orange-400 font-semibold">EAGLE DIGITAL HOUSE</span>
            {" • "}
            TODOS OS DIREITOS RESERVADOS
          </p>
        </div>
      </footer>
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
    neutral: "text-gray-400",
  }

  return (
    <div className="bg-[#1e293b] rounded-lg p-6 border-t border-orange-500 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">{icon}</div>
        {trend && (
          <span className={`text-xs font-medium ${trendColors[trendType]} flex items-center`}>
            {trendType === "positive" && <ArrowUp className="h-3 w-3 mr-1" />}
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-2">
        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
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
}

function SurveyCard({ survey, stats, onDelete, onExport, onCopyLink, copiedId }: SurveyCardProps) {
  // Ícone padrão se não houver ícone definido
  const surveyIcon = survey.icon || "⭐"

  return (
    <Link href={`/results/${survey.id}`} className="block h-full">
      <div className="bg-[#1e293b] rounded-lg shadow-lg border-b border-orange-500/30 h-full flex flex-col hover:translate-y-[-4px] transition-all duration-300 cursor-pointer">
        <div className="bg-gradient-to-r from-[#2a3548] to-[#1e293b] p-4 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              {/* Ícone redondo da pesquisa */}
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
