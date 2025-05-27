"use client"

import { useState, useEffect } from "react"
import {
  Plus,
  BarChart3,
  Users,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Activity,
  Target,
  TrendingUp,
  RefreshCw,
  AlertCircle,
  LogOut,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { SurveyStorage } from "@/lib/survey-storage"
import { SurveyAnalytics } from "@/lib/survey-analytics"
import { OpyniaLogo } from "@/components/opynia-logo"
import type { Survey } from "@/types/survey"
import Link from "next/link"
import { useSupabase } from "@/hooks/useSupabase"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalResponses: 0,
    activeSurveys: 0,
    avgNPS: 0,
  })
  const [surveyStats, setSurveyStats] = useState<Record<string, { responses: number; nps: number | null }>>({})
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const supabase = useSupabase()

  useEffect(() => {
    setMounted(true)
    loadSurveys()
  }, [])

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error("Erro ao fazer logout:", error)
        return
      }

      // Limpar dados locais
      setSurveys([])
      setStats({
        totalSurveys: 0,
        totalResponses: 0,
        activeSurveys: 0,
        avgNPS: 0,
      })

      // Redirecionar para login
      window.location.href = "/login"
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const loadSurveys = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log("🔄 Carregando pesquisas via API...")
      const loadedSurveys = await SurveyStorage.getSurveys()
      console.log("✅ Pesquisas carregadas:", loadedSurveys.length, "encontradas")

      setSurveys(loadedSurveys)

      let totalResponses = 0
      let totalNPS = 0
      let npsCount = 0
      const individualStats: Record<string, { responses: number; nps: number | null }> = {}

      // Calcular estatísticas para cada pesquisa
      for (const survey of loadedSurveys) {
        const responses = await SurveyStorage.getSurveyResponses(survey.id)
        totalResponses += responses.length

        // Calcular NPS para esta pesquisa específica usando campos de estrelas
        const starFields = survey.fields.filter((f) => f.type === "stars")
        let surveySatisfaction = null

        if (starFields.length > 0 && responses.length > 0) {
          const satisfactionData = SurveyAnalytics.calculateSatisfactionAverage(responses, starFields)
          if (satisfactionData) {
            surveySatisfaction = satisfactionData.percentage
            totalNPS += surveySatisfaction
            npsCount++
          }
        }

        individualStats[survey.id] = {
          responses: responses.length,
          nps: surveySatisfaction,
        }
      }

      setSurveyStats(individualStats)

      setStats({
        totalSurveys: loadedSurveys.length,
        totalResponses,
        activeSurveys: loadedSurveys.filter((s) => s.isActive).length,
        avgNPS: npsCount > 0 ? Math.round(totalNPS / npsCount) : 0,
      })
    } catch (error) {
      console.error("Error loading surveys:", error)
      setError("Erro ao carregar pesquisas do banco de dados. Verifique a conexão.")
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    setRefreshing(true)
    await loadSurveys()
    setRefreshing(false)
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

  // Não renderizar até estar montado
  if (!mounted) {
    return (
      <div className="min-h-screen opynia-gradient-subtle flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen opynia-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-blue-700 font-medium">Carregando dados do banco Neon...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen opynia-gradient-subtle">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-cyan-600/5 to-emerald-600/5"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fillRule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%230ea5e9%22%20fillOpacity%3D%220.03%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>

        <div className="relative border-b border-white/60 backdrop-blur-sm bg-white/80">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <OpyniaLogo size="lg" />
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold opynia-text-gradient">Dashboard FEIND</h1>
                    <p className="text-base sm:text-lg text-gray-600 font-medium">
                      Gerencie suas pesquisas profissionais
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  onClick={refreshData}
                  disabled={refreshing}
                  variant="outline"
                  className="hover:bg-blue-50 hover:border-blue-300"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  {refreshing ? "Atualizando..." : "🔄 Recarregar"}
                </Button>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair
                </Button>
                <Link href="/create">
                  <Button size="lg" className="opynia-button px-4 sm:px-6 py-2 sm:py-3 w-full sm:w-auto">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Nova Pesquisa
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {/* Enhanced Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="modern-card hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Total de Pesquisas</CardTitle>
              <div className="icon-wrapper icon-primary">
                <FileText className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalSurveys}</div>
              <p className="text-xs text-gray-500 mt-1">🟢 Banco Neon conectado</p>
            </CardContent>
          </Card>

          <Card className="modern-card hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Pesquisas Ativas</CardTitle>
              <div className="icon-wrapper icon-success">
                <Activity className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.activeSurveys}</div>
              <p className="text-xs text-gray-500 mt-1">Coletando respostas</p>
            </CardContent>
          </Card>

          <Card className="modern-card hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Total de Respostas</CardTitle>
              <div className="icon-wrapper icon-purple">
                <Users className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.totalResponses}</div>
              <p className="text-xs text-gray-500 mt-1">Salvas no banco Neon</p>
            </CardContent>
          </Card>

          <Card className="modern-card hover:-translate-y-1 group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-gray-600">Média de Satisfação</CardTitle>
              <div className="icon-wrapper icon-warning">
                <Target className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.avgNPS}%</div>
              <Badge
                variant={stats.avgNPS > 80 ? "default" : stats.avgNPS > 60 ? "secondary" : "destructive"}
                className={`mt-1 ${stats.avgNPS > 80 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}`}
              >
                {stats.avgNPS > 80 ? "Excelente" : stats.avgNPS > 60 ? "Bom" : "Melhorar"}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Surveys List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-2xl font-bold text-gray-900">Suas Pesquisas</h2>
              <TrendingUp className="w-6 h-6 text-blue-500 animate-pulse-soft" />
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-sm border-blue-200 text-blue-700 bg-blue-50">
                {surveys.length} pesquisas
              </Badge>
            </div>
          </div>

          {surveys.length === 0 ? (
            <Card className="modern-card">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-20 h-20 rounded-full opynia-gradient flex items-center justify-center mb-6 animate-pulse-soft">
                  <FileText className="h-10 w-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhuma pesquisa encontrada!</h3>
                <p className="text-gray-600 text-center mb-6 max-w-md">
                  Clique no botão "🚀 Criar FEIND 2025" acima para criar a pesquisa oficial da FEIND no banco de dados.
                </p>
                <div className="flex space-x-3">
                  <Link href="/create">
                    <Button className="opynia-button">
                      <Plus className="w-5 h-5 mr-2" />
                      Criar Nova Pesquisa
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {surveys.map((survey) => {
                return (
                  <Card key={survey.id} className="modern-card hover:-translate-y-1 group overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 opynia-gradient"></div>

                    <CardHeader className="pb-2 sm:pb-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                        <div className="space-y-2 sm:space-y-3 flex-1">
                          <div className="flex items-center space-x-3">
                            {/* Logo da pesquisa */}
                            {survey.logo ? (
                              <div className="w-12 h-12 sm:w-16 sm:h-16 p-2 bg-white rounded-xl shadow-sm border border-gray-200 flex-shrink-0">
                                <img
                                  src={survey.logo || "/placeholder.svg"}
                                  alt={`Logo da ${survey.title}`}
                                  className="w-full h-full object-contain rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl opynia-gradient flex items-center justify-center flex-shrink-0 shadow-sm">
                                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center flex-wrap gap-2 mb-1 sm:mb-2">
                                <CardTitle className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors truncate">
                                  {survey.title}
                                </CardTitle>
                                <Badge
                                  variant={survey.isActive ? "default" : "secondary"}
                                  className={
                                    survey.isActive
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                      : "bg-gray-100 text-gray-600 border-gray-200"
                                  }
                                >
                                  {survey.isActive ? "Ativa" : "Inativa"}
                                </Badge>
                              </div>
                              <CardDescription className="text-gray-600 text-sm sm:text-base leading-relaxed line-clamp-2">
                                {survey.description}
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span className="font-medium">{surveyStats[survey.id]?.responses || 0} respostas</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                              <span>{survey.fields.length} campos</span>
                            </div>
                            {surveyStats[survey.id]?.nps !== null && (
                              <div className="flex items-center space-x-1">
                                <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="font-medium">NPS: {surveyStats[survey.id]?.nps}</span>
                              </div>
                            )}
                            <span className="hidden sm:inline">
                              Criada em {new Date(survey.createdAt).toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 sm:ml-4 w-full sm:w-auto">
                          <Link href={`/survey/${survey.id}`} className="w-1/2 sm:w-auto">
                            <Button variant="outline" size="sm" className="opynia-button-outline w-full">
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Visualizar
                            </Button>
                          </Link>
                          <Link href={`/results/${survey.id}`} className="w-1/2 sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors w-full"
                            >
                              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Resultados
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportCSV(survey.id)}
                            className="hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors w-1/3 sm:w-auto"
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            CSV
                          </Button>
                          <Link href={`/edit/${survey.id}`} className="w-1/3 sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              className="hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 transition-colors w-full"
                            >
                              <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteSurvey(survey.id)}
                            className="hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-colors w-1/3 sm:w-auto"
                          >
                            <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 opynia-gradient-subtle rounded-xl border border-blue-100">
                        <div className="text-center">
                          <div className="text-xs sm:text-sm font-mono text-blue-700 mb-1 bg-white px-2 py-1 rounded truncate">
                            /survey/{survey.id}
                          </div>
                          <span className="text-xs text-blue-600">Link Público</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-500" />
                            <span className="text-xs sm:text-sm font-bold text-gray-900">
                              {surveyStats[survey.id]?.responses || 0}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">Respostas</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center space-x-1 mb-1">
                            <Target className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                            <span className="text-xs sm:text-sm font-bold text-gray-900">
                              {surveyStats[survey.id]?.nps !== null ? surveyStats[survey.id]?.nps : "--"}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">NPS Score</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
