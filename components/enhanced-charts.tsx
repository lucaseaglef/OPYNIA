"use client"

import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Eye, TrendingUp, Users } from "lucide-react"
import type { SurveyResponse } from "@/types/survey"

const COLORS = [
  "#F59E0B", // Orange primary
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#84CC16", // Lime
  "#F97316", // Orange variant
  "#EC4899", // Pink
  "#6366F1", // Indigo
]

interface EnhancedChartsProps {
  field: any
  analytics: any
  responses: SurveyResponse[]
  survey: any
  onResponseClick?: (response: SurveyResponse) => void
}

export function EnhancedCharts({ field, analytics, responses, survey, onResponseClick }: EnhancedChartsProps) {
  const [viewMode, setViewMode] = useState<"insights" | "individual">("insights")

  const renderIndividualResponses = () => {
    const fieldResponses = responses
      .map((r, index) => {
        let respondentName = "Anônimo"
        for (const fieldId in r.answers) {
          const surveyField = survey.fields.find((f) => f.id === fieldId)
          if (surveyField && surveyField.label.toLowerCase().includes("nome") && r.answers[fieldId]) {
            respondentName = r.answers[fieldId]
            break
          }
        }

        return {
          response: r,
          responseIndex: index + 1,
          answer: r.answers[field.id],
          respondentName: respondentName,
        }
      })
      .filter((r) => r.answer !== undefined && r.answer !== null && r.answer !== "")

    return (
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {fieldResponses.map((item) => (
          <div
            key={item.response.id}
            onClick={() => onResponseClick?.(item.response)}
            className="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 hover:bg-slate-700/30 hover:border-orange-500/30 transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white flex items-center justify-center text-sm font-bold">
                  {item.responseIndex}
                </div>
                <div>
                  <div className="text-sm font-medium text-white group-hover:text-orange-400 transition-colors">
                    {item.respondentName}
                  </div>
                  <div className="text-xs text-slate-400">
                    {new Date(item.response.submittedAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {field.type === "stars" && (
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: field.max || 5 }, (_, i) => (
                      <span key={i} className={`text-sm ${i < item.answer ? "text-amber-400" : "text-slate-600"}`}>
                        ★
                      </span>
                    ))}
                  </div>
                )}

                {field.type === "numeric" && <div className="text-lg font-bold text-blue-400">{item.answer}</div>}

                {["radio", "dropdown"].includes(field.type) && (
                  <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs">
                    {item.answer}
                  </Badge>
                )}

                {field.type === "checkbox" && Array.isArray(item.answer) && (
                  <div className="text-xs text-slate-400">{item.answer.length} seleções</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderInsights = () => {
    if (!analytics) return null

    switch (field.type) {
      case "radio":
      case "dropdown":
        return (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Mais Popular</span>
                </div>
                <p className="text-lg font-bold text-white">{analytics[0]?.name || "N/A"}</p>
                <p className="text-xs text-slate-400">{analytics[0]?.percentage || 0}% das respostas</p>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-slate-300">Total de Opções</span>
                </div>
                <p className="text-lg font-bold text-white">{analytics.length}</p>
                <p className="text-xs text-slate-400">Opções selecionadas</p>
              </div>
            </div>

            {/* Gráficos */}
            <Tabs defaultValue="bar" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800/50 h-9">
                <TabsTrigger
                  value="bar"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs"
                >
                  Barras
                </TabsTrigger>
                <TabsTrigger
                  value="pie"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs"
                >
                  Pizza
                </TabsTrigger>
                <TabsTrigger
                  value="line"
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-xs"
                >
                  Tendência
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bar" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #475569",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#F1F5F9",
                      }}
                      formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respostas"]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {analytics.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="pie" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analytics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #475569",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#F1F5F9",
                      }}
                      formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, name]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="line" className="mt-4">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #475569",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#F1F5F9",
                      }}
                      formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respostas"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#F59E0B"
                      strokeWidth={3}
                      dot={{ fill: "#F59E0B", strokeWidth: 2, r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </div>
        )

      case "stars":
        return (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-lg p-4 border border-amber-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400 mb-1">{analytics.average?.toFixed(1)}</div>
                  <div className="text-xs text-amber-300 font-medium">Média</div>
                  <div className="flex justify-center mt-2">
                    {Array.from({ length: Math.round(analytics.average || 0) }, (_, i) => (
                      <span key={i} className="text-amber-400 text-sm">
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{analytics.min}</div>
                  <div className="text-xs text-green-300 font-medium">Mínimo</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg p-4 border border-orange-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">{analytics.max}</div>
                  <div className="text-xs text-orange-300 font-medium">Máximo</div>
                </div>
              </div>
            </div>

            {/* Distribuição */}
            {analytics.distribution && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-4">Distribuição das Avaliações</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analytics.distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} (${props.payload.percentage}%)`,
                        `${name} estrelas`,
                      ]}
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #475569",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#F1F5F9",
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )

      case "numeric":
        return (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-4 border border-blue-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{analytics.average?.toFixed(1)}</div>
                  <div className="text-xs text-blue-300 font-medium">Média</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 rounded-lg p-4 border border-green-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400 mb-1">{analytics.min}</div>
                  <div className="text-xs text-green-300 font-medium">Mínimo</div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-lg p-4 border border-orange-500/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400 mb-1">{analytics.max}</div>
                  <div className="text-xs text-orange-300 font-medium">Máximo</div>
                </div>
              </div>
            </div>

            {/* Distribuição */}
            {analytics.distribution && (
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-4">Distribuição dos Valores</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={analytics.distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <Tooltip
                      formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, `Valor ${name}`]}
                      contentStyle={{
                        backgroundColor: "#1E293B",
                        border: "1px solid #475569",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#F1F5F9",
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )

      default:
        return (
          <div className="text-center py-8">
            <p className="text-slate-400">Insights não disponíveis para este tipo de campo.</p>
          </div>
        )
    }
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/30 to-slate-900/30 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 bg-slate-700/20 border-b border-slate-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "insights" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("insights")}
              className={
                viewMode === "insights"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-8 px-4 text-xs"
                  : "bg-slate-700/50 hover:bg-slate-600 text-slate-300 border-slate-600 h-8 px-4 text-xs"
              }
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Insights
            </Button>
            <Button
              variant={viewMode === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("individual")}
              className={
                viewMode === "individual"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-8 px-4 text-xs"
                  : "bg-slate-700/50 hover:bg-slate-600 text-slate-300 border-slate-600 h-8 px-4 text-xs"
              }
            >
              <Eye className="w-3 h-3 mr-1" />
              Respostas
            </Button>
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        {viewMode === "insights" && renderInsights()}
        {viewMode === "individual" && renderIndividualResponses()}
      </CardContent>
    </div>
  )
}
