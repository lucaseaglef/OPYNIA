"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  Users,
  Star,
  TrendingUp,
  BarChart3,
  RefreshCw,
  User,
  Activity,
  Eye,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Calendar,
  Clock,
  Target,
  Award,
  Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SurveyStorage } from "@/lib/survey-storage"
import { SurveyAnalytics } from "@/lib/survey-analytics"
import type { Survey, SurveyResponse, SurveyField } from "@/types/survey"
import Link from "next/link"
import { EnhancedCharts } from "@/components/enhanced-charts"
import { ExportManager } from "@/components/export-manager"
import { ResponseViewer } from "@/components/response-viewer"

// Helper function to parse currency values
const parseCurrency = (value: any): number => {
  if (typeof value === "number") return value
  if (typeof value !== "string" || value.trim() === "") return 0

  let cleaned = String(value).toUpperCase().replace("R$", "").trim()

  const hasComma = cleaned.includes(",")
  const hasDot = cleaned.includes(".")

  if (hasComma && (!hasDot || cleaned.lastIndexOf(",") > cleaned.lastIndexOf("."))) {
    cleaned = cleaned.replace(/\./g, "")
    cleaned = cleaned.replace(",", ".")
  } else if (hasDot && hasComma && cleaned.lastIndexOf(".") > cleaned.lastIndexOf(",")) {
    cleaned = cleaned.replace(/,/g, "")
  } else if (hasComma && !hasDot) {
    if ((cleaned.match(/,/g) || []).length === 1 && /,\d\d$/.test(cleaned)) {
      cleaned = cleaned.replace(",", ".")
    } else {
      cleaned = cleaned.replace(/,/g, "")
    }
  }
  cleaned = cleaned.replace(/[^\d.-]/g, "")

  const num = Number.parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}

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
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

        const npsSpecificFields = loadedSurvey.fields.filter((f) => f.type === "numeric" && f.min === 0 && f.max === 10)
        if (npsSpecificFields.length > 0) {
          const npsScoreData = SurveyAnalytics.calculateNPS(loadedResponses, npsSpecificFields)
          setNpsData(npsScoreData)
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const openResponseModal = (response: SurveyResponse) => {
    setSelectedResponse(response)
    setIsModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-slate-300 font-medium">Carregando resultados...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="glass rounded-2xl p-8 text-center border border-white/10 max-w-md">
          <h2 className="font-display text-2xl font-bold text-white mb-3">Pesquisa não encontrada</h2>
          <p className="text-slate-400">A pesquisa que você está procurando não existe.</p>
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
            <Zap className="w-8 h-8 text-orange-400 mr-3" />
            <h1 className="font-display text-5xl font-bold text-gradient">{survey.title}</h1>
          </div>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed mb-6">
            Análise completa dos resultados coletados
          </p>
          <div className="flex items-center justify-center space-x-6 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Criada em {new Date(survey.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge className={survey.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                {survey.isActive ? "Ativa" : "Inativa"}
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={loadData}
              disabled={refreshing}
              className="glass border-white/20 text-slate-300 hover:text-white hover:border-orange-500/50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <ExportManager survey={survey} responses={responses} />
            <Link href={`/survey/${survey.id}`}>
              <Button className="btn-modern bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl px-6 py-3 rounded-xl">
                <Eye className="w-4 h-4 mr-2" />
                Ver Pesquisa
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs Redesenhadas */}
        <div className="max-w-5xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="glass rounded-2xl p-2 border border-white/10 shadow-xl w-full justify-center">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:glass-orange data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 px-8 py-4 rounded-xl font-medium"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger
                value="insights"
                className="data-[state=active]:glass-orange data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 px-8 py-4 rounded-xl font-medium"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Insights
              </TabsTrigger>
              <TabsTrigger
                value="individual"
                className="data-[state=active]:glass-orange data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-400 hover:text-white transition-all duration-300 px-8 py-4 rounded-xl font-medium"
              >
                <User className="w-4 h-4 mr-2" />
                Respostas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Métricas principais movidas para cá */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <MetricCard
                  icon={<Users className="h-6 w-6" />}
                  title="Total de Respostas"
                  value={stats?.totalResponses || 0}
                  subtitle="Respostas coletadas"
                  color="blue"
                />
                <MetricCard
                  icon={<Activity className="h-6 w-6" />}
                  title="Taxa de Conclusão"
                  value={`${stats?.completionRate || 0}%`}
                  subtitle="Formulários completos"
                  color="green"
                />
                <MetricCard
                  icon={<Star className="h-6 w-6" />}
                  title="Avaliação Média"
                  value={stats?.averageRating ? `${stats.averageRating.toFixed(1)}/5` : "0/5"}
                  subtitle="Estrelas médias"
                  color="amber"
                />
                <MetricCard
                  icon={<TrendingUp className="h-6 w-6" />}
                  title="Score NPS"
                  value={npsData?.score || stats?.satisfactionScore || "N/A"}
                  subtitle="Net Promoter Score"
                  color="purple"
                />
              </div>

              {/* Overview Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Satisfaction Analysis */}
                {npsData && (
                  <div className="glass rounded-2xl p-8 border border-white/10 shadow-xl">
                    <h3 className="font-display text-xl font-bold text-white mb-6 flex items-center">
                      <TrendingUp className="w-6 h-6 text-orange-400 mr-3" />
                      Análise de Satisfação
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <SatisfactionCard
                        title="Promotores"
                        value={npsData.promoters || npsData.excellent || 0}
                        percentage={
                          npsData.total > 0
                            ? Math.round(((npsData.promoters || npsData.excellent || 0) / npsData.total) * 100)
                            : 0
                        }
                        color="green"
                        description="Muito satisfeitos"
                      />
                      <SatisfactionCard
                        title="Neutros"
                        value={npsData.passives || npsData.good || 0}
                        percentage={
                          npsData.total > 0
                            ? Math.round(((npsData.passives || npsData.good || 0) / npsData.total) * 100)
                            : 0
                        }
                        color="yellow"
                        description="Moderadamente satisfeitos"
                      />
                      <SatisfactionCard
                        title="Detratores"
                        value={npsData.detractors || npsData.poor || 0}
                        percentage={
                          npsData.total > 0
                            ? Math.round(((npsData.detractors || npsData.poor || 0) / npsData.total) * 100)
                            : 0
                        }
                        color="red"
                        description="Insatisfeitos"
                      />
                      <SatisfactionCard
                        title="Score Final"
                        value={npsData.score || stats?.satisfactionScore || "N/A"}
                        percentage={100}
                        color="blue"
                        description="NPS Geral"
                      />
                    </div>
                  </div>
                )}

                {/* Key Insights */}
                <div className="glass rounded-2xl p-8 border border-white/10 shadow-xl">
                  <h3 className="font-display text-xl font-bold text-white mb-6 flex items-center">
                    <Zap className="w-6 h-6 text-orange-400 mr-3" />
                    Insights Principais
                  </h3>
                  <div className="space-y-4">
                    <InsightItem
                      icon={<Target className="w-5 h-5 text-blue-400" />}
                      title="Taxa de Resposta"
                      description={`${stats?.completionRate || 0}% dos participantes completaram a pesquisa`}
                      trend={
                        stats?.completionRate > 80 ? "positive" : stats?.completionRate > 60 ? "neutral" : "negative"
                      }
                    />
                    <InsightItem
                      icon={<Award className="w-5 h-5 text-amber-400" />}
                      title="Qualidade das Respostas"
                      description={`Média de ${stats?.averageRating?.toFixed(1) || 0} estrelas nas avaliações`}
                      trend={stats?.averageRating > 4 ? "positive" : stats?.averageRating > 3 ? "neutral" : "negative"}
                    />
                    <InsightItem
                      icon={<Users className="w-5 h-5 text-green-400" />}
                      title="Engajamento"
                      description={`${responses.length} pessoas participaram da pesquisa`}
                      trend="positive"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {responses.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-6">
                  {/* Currency Fields */}
                  {survey.fields
                    .filter((field) => field.type === "currency")
                    .map((field) => {
                      const currencyAnswers = responses
                        .map((r) => r.answers[field.id])
                        .filter((val) => val !== undefined && val !== null && String(val).trim() !== "")

                      let totalSum = 0
                      let validEntriesCount = 0

                      currencyAnswers.forEach((ans) => {
                        const numValue = parseCurrency(ans)
                        totalSum += numValue
                        if (numValue !== 0 || (numValue === 0 && String(ans).replace(/[^\d]/g, "") === "0")) {
                          validEntriesCount++
                        }
                      })
                      const displayCurrency = field.validation?.currency || "BRL"

                      return (
                        <CurrencyInsightCard
                          key={`${field.id}-sum`}
                          title={field.label}
                          total={totalSum}
                          currency={displayCurrency}
                          responseCount={validEntriesCount}
                        />
                      )
                    })}

                  {/* Accordion Fields */}
                  {survey.fields
                    .filter((field) =>
                      ["radio", "checkbox", "dropdown", "stars", "numeric", "likert", "ranking"].includes(field.type),
                    )
                    .map((field) => {
                      const fieldResponses = responses.filter(
                        (r) =>
                          r.answers[field.id] !== undefined &&
                          r.answers[field.id] !== null &&
                          r.answers[field.id] !== "",
                      ).length

                      return (
                        <FieldInsightAccordion
                          key={field.id}
                          field={field}
                          responses={responses}
                          survey={survey}
                          responseCount={fieldResponses}
                          onResponseClick={openResponseModal}
                        />
                      )
                    })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="individual" className="space-y-6">
              <div className="glass rounded-2xl p-8 border border-white/10 shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl glass-orange flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-bold text-white">Respostas Individuais</h2>
                      <p className="text-slate-400">Navegue pelas respostas coletadas</p>
                    </div>
                  </div>
                  <Badge className="glass-orange px-4 py-2 text-orange-300 border-orange-500/30 font-medium">
                    {responses.length} respostas
                  </Badge>
                </div>
                <ResponseViewer survey={survey} responses={responses} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Modal de Resposta Completa */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto glass border-white/20">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-white flex items-center">
              <User className="w-5 h-5 text-orange-400 mr-2" />
              Resposta Completa
            </DialogTitle>
          </DialogHeader>
          {selectedResponse && <CompleteResponseView response={selectedResponse} survey={survey} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Componentes auxiliares
interface MetricCardProps {
  icon: React.ReactNode
  title: string
  value: number | string
  subtitle: string
  color: "blue" | "green" | "amber" | "purple"
}

function MetricCard({ icon, title, value, subtitle, color }: MetricCardProps) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
    green: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    amber: "from-amber-500/20 to-amber-600/20 border-amber-500/30 text-amber-400",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30 text-purple-400",
  }

  return (
    <div className={`glass rounded-xl p-6 border transition-all duration-300 hover:scale-105 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-r ${colorClasses[color]} flex items-center justify-center shadow-lg`}
        >
          {icon}
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
      </div>
    </div>
  )
}

interface SatisfactionCardProps {
  title: string
  value: number | string
  percentage: number
  color: "green" | "yellow" | "red" | "blue"
  description: string
}

function SatisfactionCard({ title, value, percentage, color, description }: SatisfactionCardProps) {
  const colorClasses = {
    green: "from-green-500/20 to-green-600/20 border-green-500/30 text-green-400",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30 text-yellow-400",
    red: "from-red-500/20 to-red-600/20 border-red-500/30 text-red-400",
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30 text-blue-400",
  }

  return (
    <div className={`glass rounded-xl p-4 border ${colorClasses[color]}`}>
      <div className="text-center">
        <div className={`text-2xl font-bold ${colorClasses[color]} mb-1`}>{value}</div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-slate-400 mt-1">{description}</div>
        <div className="text-xs text-slate-300 mt-2">{percentage}%</div>
      </div>
    </div>
  )
}

interface InsightItemProps {
  icon: React.ReactNode
  title: string
  description: string
  trend: "positive" | "negative" | "neutral"
}

function InsightItem({ icon, title, description, trend }: InsightItemProps) {
  const trendColors = {
    positive: "text-green-400",
    negative: "text-red-400",
    neutral: "text-yellow-400",
  }

  return (
    <div className="flex items-start space-x-4 p-4 glass rounded-xl border border-white/10">
      <div className="w-10 h-10 glass-orange rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
        {icon}
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-white mb-1">{title}</h4>
        <p className={`text-sm ${trendColors[trend]}`}>{description}</p>
      </div>
    </div>
  )
}

interface CurrencyInsightCardProps {
  title: string
  total: number
  currency: string
  responseCount: number
}

function CurrencyInsightCard({ title, total, currency, responseCount }: CurrencyInsightCardProps) {
  return (
    <div className="glass rounded-xl p-6 border border-emerald-500/30 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-slate-400">{responseCount} respostas válidas</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-400">
            {total.toLocaleString("pt-BR", {
              style: "currency",
              currency: currency,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className="text-sm text-slate-400">Soma Total</p>
        </div>
      </div>
    </div>
  )
}

interface FieldInsightAccordionProps {
  field: SurveyField
  responses: SurveyResponse[]
  survey: Survey
  responseCount: number
  onResponseClick: (response: SurveyResponse) => void
}

function FieldInsightAccordion({
  field,
  responses,
  survey,
  responseCount,
  onResponseClick,
}: FieldInsightAccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getFieldIcon = (type: string) => {
    switch (type) {
      case "stars":
        return <Star className="w-5 h-5 text-amber-400" />
      case "numeric":
        return <TrendingUp className="w-5 h-5 text-blue-400" />
      default:
        return <BarChart3 className="w-5 h-5 text-orange-400" />
    }
  }

  const analytics = SurveyAnalytics.getFieldAnalytics(field, responses)

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="glass rounded-xl p-6 border border-white/10 hover:border-orange-500/30 transition-all duration-300 cursor-pointer group shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl glass-orange flex items-center justify-center group-hover:shadow-lg transition-all duration-300">
                {getFieldIcon(field.type)}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                  {field.label}
                </h3>
                <div className="flex items-center space-x-4 mt-1">
                  <p className="text-sm text-slate-400">{responseCount} respostas</p>
                  {analytics && (
                    <>
                      {analytics.average && (
                        <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                          Média: {analytics.average.toFixed(1)}
                        </Badge>
                      )}
                      {analytics.mostCommon && (
                        <Badge className="bg-green-500/20 text-green-300 border border-green-500/30 text-xs">
                          Mais comum: {analytics.mostCommon}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="glass text-slate-300 text-xs px-3 py-1 border border-white/20">{field.type}</Badge>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-orange-400 transition-colors" />
              )}
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-4">
          <EnhancedCharts
            field={field}
            analytics={analytics}
            responses={responses}
            survey={survey}
            onResponseClick={onResponseClick}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl p-12 text-center border border-white/10 shadow-xl">
      <BarChart3 className="h-16 w-16 text-slate-500 mx-auto mb-6" />
      <h3 className="font-display text-2xl font-bold text-white mb-3">Nenhuma resposta ainda</h3>
      <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
        Compartilhe o link da pesquisa para começar a receber respostas e ver insights detalhados sobre os dados
        coletados.
      </p>
      <Button className="btn-modern bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-xl px-6 py-3 rounded-xl">
        Compartilhar Pesquisa
      </Button>
    </div>
  )
}

interface CompleteResponseViewProps {
  response: SurveyResponse
  survey: Survey
}

function CompleteResponseView({ response, survey }: CompleteResponseViewProps) {
  // Encontrar o nome do respondente
  let respondentName = "Respondente Anônimo"
  for (const fieldId in response.answers) {
    const field = survey.fields.find((f) => f.id === fieldId)
    if (field && field.label.toLowerCase().includes("nome") && response.answers[fieldId]) {
      respondentName = response.answers[fieldId]
      break
    }
  }

  const renderAnswer = (field: any, answer: any) => {
    if (!answer && answer !== 0) return <span className="text-slate-500 italic">Não respondido</span>

    switch (field.type) {
      case "stars":
        const rating = Number.parseInt(answer)
        return (
          <div className="flex items-center space-x-2">
            <div className="flex">
              {Array.from({ length: field.max || 5 }, (_, i) => (
                <Star key={i} className={`w-5 h-5 ${i < rating ? "text-amber-400 fill-current" : "text-slate-600"}`} />
              ))}
            </div>
            <span className="font-medium text-white">
              {rating} de {field.max || 5}
            </span>
          </div>
        )

      case "checkbox":
        if (Array.isArray(answer)) {
          return (
            <div className="flex flex-wrap gap-2">
              {answer.map((item, index) => (
                <Badge key={index} className="bg-green-500/20 text-green-300 border border-green-500/30">
                  {item}
                </Badge>
              ))}
            </div>
          )
        }
        return answer

      case "radio":
      case "dropdown":
        return <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-base">{answer}</Badge>

      case "text":
      case "textarea":
        return (
          <div className="p-4 glass rounded-xl border border-white/10">
            <p className="text-slate-200 leading-relaxed">{answer}</p>
          </div>
        )

      case "numeric":
        return (
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-blue-400">{answer}</div>
            <div className="text-sm text-slate-400">
              de {field.min || 0} a {field.max || 10}
            </div>
          </div>
        )

      case "currency":
        return (
          <div className="text-lg font-bold text-emerald-400">
            {Number(answer).toLocaleString("pt-BR", {
              style: "currency",
              currency: field.validation?.currency || "BRL",
            })}
          </div>
        )

      default:
        return <span className="text-white font-medium">{answer}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header da Resposta */}
      <div className="glass-orange rounded-xl p-6 border border-orange-500/30 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl font-bold text-white">{respondentName}</h3>
            <div className="flex items-center space-x-4 mt-2 text-slate-300">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(response.submittedAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(response.submittedAt).toLocaleTimeString("pt-BR")}</span>
              </div>
            </div>
          </div>
          <Badge className="glass text-slate-300 px-3 py-1 border border-white/20">ID: {response.id.slice(-8)}</Badge>
        </div>
      </div>

      {/* Respostas */}
      <div className="space-y-4">
        {survey.fields
          .filter((field) => field.type !== "divider")
          .map((field, index) => {
            const answer = response.answers[field.id]

            return (
              <div key={field.id} className="glass rounded-xl border border-white/10 overflow-hidden shadow-lg">
                <div className="glass-orange px-6 py-4 border-b border-orange-500/30">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1 shadow-lg">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-display font-bold text-white leading-tight">{field.label}</h4>
                      {field.description && (
                        <p className="text-sm text-slate-300 mt-1 leading-relaxed">{field.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-6 py-6">
                  <div className="ml-11">{renderAnswer(field, answer)}</div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
