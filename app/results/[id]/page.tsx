"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Users, Star, TrendingUp, BarChart3, RefreshCw, User, Table, Activity, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SurveyStorage } from "@/lib/survey-storage"
import { SurveyAnalytics } from "@/lib/survey-analytics"
import type { Survey, SurveyResponse } from "@/types/survey"
import Link from "next/link"
import { EnhancedCharts } from "@/components/enhanced-charts"
import { ExportManager } from "@/components/export-manager"
import { ResponseViewer } from "@/components/response-viewer"
import { ResponsesTable } from "@/components/responses-table"

export default function ResultsPage() {
  const params = useParams()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [stats, setStats] = useState<any>(null)
  const [npsData, setNpsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [surveyId])

  const loadData = async () => {
    try {
      setLoading(true)
      setRefreshing(true)

      const loadedSurvey = await SurveyStorage.getSurveyById(surveyId)
      const loadedResponses = await SurveyStorage.getSurveyResponses(surveyId)

      setSurvey(loadedSurvey)
      setResponses(loadedResponses)

      if (loadedSurvey) {
        const analytics = SurveyAnalytics.calculateStats(loadedSurvey, loadedResponses)
        setStats(analytics)

        // Calculate detailed NPS
        const npsFields = loadedSurvey.fields.filter((f) => f.type === "numeric" && f.min === 0 && f.max === 10)
        if (npsFields.length > 0) {
          const npsAnalysis = SurveyAnalytics.calculateNPS(loadedResponses, npsFields)
          setNpsData(npsAnalysis)
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const renderFieldChart = (field: any) => {
    const analytics = SurveyAnalytics.getFieldAnalytics(field, responses)
    if (!analytics) return null

    return <EnhancedCharts field={field} analytics={analytics} responses={responses} survey={survey} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-300 font-medium">Carregando resultados do banco Neon...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-[#121826] flex items-center justify-center">
        <div className="bg-[#1a2332] rounded-xl p-8 text-center border border-gray-700/50 max-w-md">
          <h2 className="text-2xl font-bold text-white mb-3">Pesquisa não encontrada</h2>
          <p className="text-gray-400">A pesquisa que você está procurando não existe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121826] text-gray-100">
      {/* Header seguindo o padrão da página inicial */}
      <div className="bg-[#121826] border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" className="bg-[#1e293b] border-gray-600 text-gray-300 hover:bg-gray-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                  Resultados da Pesquisa
                </h1>
                <p className="text-gray-400 text-lg mt-1">{survey.title}</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={loadData}
                className="bg-[#1e293b] border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <ExportManager survey={survey} responses={responses} />
              <Link href={`/survey/${survey.id}`}>
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Pesquisa
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards seguindo o padrão da página inicial */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Users className="h-5 w-5 text-orange-400" />}
            label="Total de Respostas"
            value={stats?.totalResponses || 0}
            trend="Banco Neon conectado"
            trendType="positive"
          />

          <StatCard
            icon={<Activity className="h-5 w-5 text-orange-400" />}
            label="Taxa de Conclusão"
            value={`${stats?.completionRate || 0}%`}
            trend="Respostas completas"
            trendType="positive"
          />

          <StatCard
            icon={<Star className="h-5 w-5 text-orange-400" />}
            label="Média de Estrelas"
            value={stats?.averageRating ? `${stats.averageRating.toFixed(1)}/5` : "0/5"}
            trend={stats?.averageRating > 4 ? "Excelente" : stats?.averageRating > 3 ? "Bom" : "Regular"}
            trendType={stats?.averageRating > 4 ? "positive" : stats?.averageRating > 3 ? "neutral" : "negative"}
          />

          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-orange-400" />}
            label="NPS Score"
            value={npsData?.score || "N/A"}
            trend={npsData?.score > 50 ? "Excelente" : npsData?.score > 0 ? "Bom" : "Precisa Melhorar"}
            trendType={npsData?.score > 50 ? "positive" : npsData?.score > 0 ? "neutral" : "negative"}
          />
        </div>

        {/* Tabs seguindo o padrão da página inicial */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-[#1a2332] rounded-xl p-2 border border-gray-700/50 inline-flex">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Gráficos
            </TabsTrigger>
            <TabsTrigger
              value="individual"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
            >
              <User className="w-4 h-4 mr-2" />
              Individual
            </TabsTrigger>
            <TabsTrigger
              value="table"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
            >
              <Table className="w-4 h-4 mr-2" />
              Tabela
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* NPS Breakdown seguindo o padrão */}
            {npsData && (
              <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-700/50">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Análise Detalhada do NPS</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400 mb-1">{npsData.promoters}</div>
                    <div className="text-sm text-green-300 font-medium">Promotores (9-10)</div>
                    <div className="text-xs text-green-400">
                      {Math.round((npsData.promoters / npsData.total) * 100)}%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <div className="text-2xl font-bold text-yellow-400 mb-1">{npsData.passives}</div>
                    <div className="text-sm text-yellow-300 font-medium">Neutros (7-8)</div>
                    <div className="text-xs text-yellow-400">
                      {Math.round((npsData.passives / npsData.total) * 100)}%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="text-2xl font-bold text-red-400 mb-1">{npsData.detractors}</div>
                    <div className="text-sm text-red-300 font-medium">Detratores (0-6)</div>
                    <div className="text-xs text-red-400">
                      {Math.round((npsData.detractors / npsData.total) * 100)}%
                    </div>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400 mb-1">{npsData.score}</div>
                    <div className="text-sm text-blue-300 font-medium">Score Final</div>
                    <div className="text-xs text-blue-400">NPS</div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {responses.length === 0 ? (
              <div className="bg-[#1a2332] rounded-xl p-8 text-center border border-gray-700/50">
                <BarChart3 className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">Nenhuma resposta ainda</h3>
                <p className="text-gray-400 mb-6">
                  Compartilhe o link da pesquisa para começar a receber respostas e ver gráficos incríveis
                </p>
                <Link href={`/survey/${survey.id}`}>
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white">Ver Pesquisa Pública</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {survey.fields
                  .filter((field) =>
                    ["radio", "checkbox", "dropdown", "stars", "numeric", "likert", "ranking"].includes(field.type),
                  )
                  .map((field) => (
                    <div key={field.id}>{renderFieldChart(field)}</div>
                  ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="individual" className="space-y-6">
            <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Respostas Individuais</h2>
                <Badge className="bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {responses.length} respostas
                </Badge>
              </div>
              <ResponseViewer survey={survey} responses={responses} />
            </div>
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <div className="bg-[#1a2332] rounded-xl p-6 border border-gray-700/50">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <Table className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Tabela de Respostas</h2>
              </div>
              <ResponsesTable survey={survey} responses={responses} />
            </div>
          </TabsContent>
        </Tabs>
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
    neutral: "text-gray-400",
  }

  return (
    <div className="bg-[#1e293b] rounded-lg p-4 border-b border-orange-500/30 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">{icon}</div>
        {trend && <span className={`text-xs font-medium ${trendColors[trendType]} flex items-center`}>{trend}</span>}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}
