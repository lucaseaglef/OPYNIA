"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Users, Star, TrendingUp, BarChart3, Target, RefreshCw, User, Table, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SurveyStorage } from "@/lib/survey-storage"
import { SurveyAnalytics } from "@/lib/survey-analytics"
import type { Survey, SurveyResponse } from "@/types/survey"
import Link from "next/link"
import { EnhancedCharts } from "@/components/enhanced-charts"
import { ExportManager } from "@/components/export-manager"
import { SuccessConfigEditor } from "@/components/success-config-editor"
import { ResponseViewer } from "@/components/response-viewer"
import { ResponsesTable } from "@/components/responses-table"

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"]

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

  const generatePDF = async () => {
    if (!survey || responses.length === 0) return

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Configurações
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      let yPosition = margin

      // Cores
      const primaryColor = [2, 213, 80] // Verde FEIND
      const secondaryColor = [107, 114, 128] // Gray
      const accentColor = [59, 130, 246] // Blue

      // Função para adicionar cabeçalho
      const addHeader = () => {
        // Fundo do cabeçalho
        doc.setFillColor(...primaryColor)
        doc.rect(0, 0, pageWidth, 50, "F")

        // Título
        doc.setFontSize(20)
        doc.setTextColor(255, 255, 255)
        doc.setFont(undefined, "bold")
        doc.text("RESULTADOS FEIND 2025", margin, 25)

        doc.setFontSize(12)
        doc.setFont(undefined, "normal")
        doc.text(`${responses.length} respostas coletadas`, margin, 35)

        yPosition = 70
      }

      // Função para adicionar nova página se necessário
      const checkNewPage = (requiredSpace = 60) => {
        if (yPosition > pageHeight - requiredSpace) {
          doc.addPage()
          yPosition = margin
          return true
        }
        return false
      }

      // Função para renderizar resposta individual
      const renderResponse = (response: SurveyResponse, index: number) => {
        checkNewPage(80)

        // Cabeçalho da resposta
        doc.setFillColor(...accentColor)
        doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, "F")

        doc.setFontSize(14)
        doc.setTextColor(255, 255, 255)
        doc.setFont(undefined, "bold")
        doc.text(`Resposta #${index + 1}`, margin + 10, yPosition + 13)

        doc.setFontSize(10)
        doc.text(new Date(response.submittedAt).toLocaleString("pt-BR"), pageWidth - margin - 60, yPosition + 13)

        yPosition += 30

        // Campos da resposta
        survey.fields
          .filter((field) => field.type !== "divider")
          .forEach((field) => {
            const answer = response.answers[field.id]
            if (!answer && answer !== 0) return

            checkNewPage(40)

            // Pergunta
            doc.setFontSize(11)
            doc.setTextColor(...secondaryColor)
            doc.setFont(undefined, "bold")
            const questionLines = doc.splitTextToSize(field.label, pageWidth - 2 * margin - 20)
            doc.text(questionLines, margin + 10, yPosition)
            yPosition += questionLines.length * 5 + 3

            // Resposta
            doc.setFontSize(10)
            doc.setTextColor(0, 0, 0)
            doc.setFont(undefined, "normal")

            let answerText = ""
            if (field.type === "stars") {
              const rating = Number.parseInt(answer)
              const stars = "★".repeat(rating) + "☆".repeat((field.max || 5) - rating)
              answerText = `${rating} de ${field.max || 5} estrelas: ${stars}`

              // Verificar justificativa
              const justification = response.answers[`${field.id}_justification`]
              if (justification) {
                answerText += `\nJustificativa: ${justification}`
              }
            } else if (Array.isArray(answer)) {
              answerText = answer.join(", ")
            } else {
              answerText = String(answer)
            }

            const answerLines = doc.splitTextToSize(answerText, pageWidth - 2 * margin - 20)
            doc.text(answerLines, margin + 20, yPosition)
            yPosition += answerLines.length * 5 + 8

            // Linha separadora
            doc.setDrawColor(230, 230, 230)
            doc.line(margin + 10, yPosition, pageWidth - margin - 10, yPosition)
            yPosition += 10
          })

        yPosition += 10
      }

      // Gerar PDF
      addHeader()

      // Estatísticas gerais
      doc.setFontSize(16)
      doc.setTextColor(...primaryColor)
      doc.setFont(undefined, "bold")
      doc.text("Resumo Executivo", margin, yPosition)
      yPosition += 15

      doc.setFontSize(11)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "normal")

      const summaryText = [
        `• Total de respostas: ${responses.length}`,
        `• Taxa de conclusão: ${stats?.completionRate || 0}%`,
        stats?.averageRating ? `• Avaliação média: ${stats.averageRating.toFixed(1)} estrelas` : "",
        npsData ? `• NPS Score: ${npsData.score}` : "",
      ].filter(Boolean)

      summaryText.forEach((text) => {
        doc.text(text, margin + 10, yPosition)
        yPosition += 8
      })

      yPosition += 20

      // Respostas individuais
      doc.setFontSize(16)
      doc.setTextColor(...primaryColor)
      doc.setFont(undefined, "bold")
      doc.text("Respostas Detalhadas", margin, yPosition)
      yPosition += 20

      responses.forEach((response, index) => {
        renderResponse(response, index)
      })

      // Rodapé em todas as páginas
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(...secondaryColor)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 20, pageHeight - 10)
        doc.text("Relatório gerado pela Plataforma Opynia", margin, pageHeight - 10)
        doc.text(`Data: ${new Date().toLocaleString("pt-BR")}`, margin, pageHeight - 5)
      }

      // Download
      const fileName = `FEIND_2025_Resultados_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    }
  }

  const renderFieldChart = (field: any) => {
    const analytics = SurveyAnalytics.getFieldAnalytics(field, responses)
    if (!analytics) return null

    return <EnhancedCharts field={field} analytics={analytics} responses={responses} />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">Carregando resultados do banco Neon...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <Card className="w-full max-w-md modern-card">
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Pesquisa não encontrada</h2>
            <p className="text-gray-600">A pesquisa que você está procurando não existe.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-indigo-600/5"></div>
        <div className="relative border-b border-white/60 backdrop-blur-sm bg-white/80">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:border-blue-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Resultados FEIND
                  </h1>
                  <p className="text-gray-600 font-medium">{survey.title}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" onClick={loadData} className="hover:bg-blue-50 hover:border-blue-300">
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                  Atualizar
                </Button>
                <Button
                  variant="outline"
                  onClick={generatePDF}
                  className="hover:bg-green-50 hover:border-green-300"
                  disabled={responses.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF Completo
                </Button>
                <ExportManager survey={survey} responses={responses} />
                <SuccessConfigEditor survey={survey} onUpdate={(updatedSurvey) => setSurvey(updatedSurvey)} />
                <Link href={`/survey/${survey.id}`}>
                  <Button variant="outline" className="hover:bg-purple-50 hover:border-purple-300">
                    Ver Pesquisa Pública
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Visão Geral</span>
            </TabsTrigger>
            <TabsTrigger value="charts" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>Gráficos</span>
            </TabsTrigger>
            <TabsTrigger value="individual" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Individual</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center space-x-2">
              <Table className="w-4 h-4" />
              <span>Tabela</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="modern-card hover:-translate-y-1 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-600">Total de Respostas</CardTitle>
                  <div className="icon-wrapper icon-primary group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats?.totalResponses || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="text-green-600 font-medium">🟢 Banco Neon</span> conectado
                  </p>
                </CardContent>
              </Card>

              {stats?.averageRating && (
                <Card className="modern-card hover:-translate-y-1 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600">Avaliação Média</CardTitle>
                    <div className="icon-wrapper icon-warning group-hover:scale-110 transition-transform duration-300">
                      <Star className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)} ⭐</div>
                    <p className="text-xs text-gray-500 mt-1">Baseado em {responses.length} avaliações</p>
                  </CardContent>
                </Card>
              )}

              {npsData && (
                <Card className="modern-card hover:-translate-y-1 group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-600">NPS Score</CardTitle>
                    <div className="icon-wrapper icon-success group-hover:scale-110 transition-transform duration-300">
                      <TrendingUp className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{npsData.score}</div>
                    <Badge
                      variant={npsData.score > 50 ? "default" : npsData.score > 0 ? "secondary" : "destructive"}
                      className={npsData.score > 50 ? "bg-emerald-100 text-emerald-800 border-emerald-200" : ""}
                    >
                      {npsData.score > 50 ? "Excelente" : npsData.score > 0 ? "Bom" : "Precisa Melhorar"}
                    </Badge>
                  </CardContent>
                </Card>
              )}

              <Card className="modern-card hover:-translate-y-1 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-600">Taxa de Conclusão</CardTitle>
                  <div className="icon-wrapper icon-purple group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{stats?.completionRate || 0}%</div>
                  <p className="text-xs text-gray-500 mt-1">Respostas completas</p>
                </CardContent>
              </Card>
            </div>

            {/* NPS Breakdown */}
            {npsData && (
              <Card className="modern-card">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-3">
                    <div className="icon-wrapper icon-success">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span>Análise Detalhada do NPS</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{npsData.promoters}</div>
                      <div className="text-sm text-green-700 font-medium">Promotores (9-10)</div>
                      <div className="text-xs text-green-600">
                        {Math.round((npsData.promoters / npsData.total) * 100)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <div className="text-2xl font-bold text-yellow-600">{npsData.passives}</div>
                      <div className="text-sm text-yellow-700 font-medium">Neutros (7-8)</div>
                      <div className="text-xs text-yellow-600">
                        {Math.round((npsData.passives / npsData.total) * 100)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-xl border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{npsData.detractors}</div>
                      <div className="text-sm text-red-700 font-medium">Detratores (0-6)</div>
                      <div className="text-xs text-red-600">
                        {Math.round((npsData.detractors / npsData.total) * 100)}%
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{npsData.score}</div>
                      <div className="text-sm text-blue-700 font-medium">Score Final</div>
                      <div className="text-xs text-blue-600">NPS</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="charts" className="space-y-8">
            {responses.length === 0 ? (
              <Card className="modern-card">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6 animate-pulse-soft">
                    <BarChart3 className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhuma resposta ainda</h3>
                  <p className="text-gray-600 text-center mb-6 max-w-md">
                    Compartilhe o link da pesquisa para começar a receber respostas e ver gráficos incríveis
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
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
            <ResponseViewer survey={survey} responses={responses} />
          </TabsContent>

          <TabsContent value="table" className="space-y-6">
            <ResponsesTable survey={survey} responses={responses} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
