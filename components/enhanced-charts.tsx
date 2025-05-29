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
  Area,
  AreaChart,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Eye, Table } from "lucide-react"

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EC4899",
  "#6366F1",
]

interface EnhancedChartsProps {
  field: any
  analytics: any
  responses: any[]
  survey: any
}

export function EnhancedCharts({ field, analytics, responses, survey }: EnhancedChartsProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table" | "individual">("chart")

  const chartTitle = field.label
  const chartDescription = `${responses.filter((r) => r.answers[field.id]).length} respostas coletadas`

  const renderIndividualResponses = () => {
    const fieldResponses = responses
      .map((r, index) => {
        // Encontrar o nome do respondente
        let respondentName = "Anônimo"
        for (const fieldId in r.answers) {
          const surveyField = survey.fields.find((f) => f.id === fieldId)
          if (surveyField && surveyField.label.toLowerCase().includes("nome") && r.answers[fieldId]) {
            respondentName = r.answers[fieldId]
            break
          }
        }

        return {
          responseId: r.id,
          responseIndex: index + 1,
          answer: r.answers[field.id],
          submittedAt: r.submittedAt,
          respondentName: respondentName,
        }
      })
      .filter((r) => r.answer !== undefined && r.answer !== null && r.answer !== "")

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {fieldResponses.map((response, index) => (
          <div
            key={response.responseId}
            className="p-4 bg-[#1e293b] rounded-lg border border-gray-700/50 hover:bg-[#2a3548] transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">
                  {response.responseIndex}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{response.respondentName}</div>
                  <div className="text-xs text-gray-400">{new Date(response.submittedAt).toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>

            <div className="ml-11">
              {field.type === "stars" && (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: field.max || 5 }, (_, i) => (
                      <span key={i} className={`text-lg ${i < response.answer ? "text-amber-400" : "text-gray-600"}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {response.answer} de {field.max || 5} estrelas
                  </span>
                </div>
              )}

              {field.type === "numeric" && (
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold text-blue-400">{response.answer}</div>
                  <div className="text-sm text-gray-400">
                    de {field.min || 0} a {field.max || 10}
                  </div>
                </div>
              )}

              {["radio", "dropdown"].includes(field.type) && (
                <Badge className="bg-blue-500/20 text-blue-300 border border-blue-500/30">{response.answer}</Badge>
              )}

              {field.type === "checkbox" && Array.isArray(response.answer) && (
                <div className="flex flex-wrap gap-2">
                  {response.answer.map((item, i) => (
                    <Badge key={i} className="bg-green-500/20 text-green-300 border border-green-500/30">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              {["text", "textarea"].includes(field.type) && (
                <div className="text-gray-300 leading-relaxed bg-gray-700/30 p-3 rounded-lg border border-gray-600">
                  {response.answer}
                </div>
              )}

              {field.type === "likert" && (
                <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {response.answer}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderDataTable = () => {
    if (!analytics || !Array.isArray(analytics)) return null

    return (
      <div className="overflow-hidden rounded-lg border border-gray-700">
        <table className="w-full">
          <thead className="bg-gray-700/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-200">Opção</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-200">Respostas</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-200">Percentual</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-200">Barra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {analytics.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-700/30">
                <td className="px-4 py-3 text-sm text-gray-200 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-center text-sm font-bold text-white">{item.value}</td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length] + "20",
                      color: COLORS[index % COLORS.length],
                      borderColor: COLORS[index % COLORS.length] + "40",
                    }}
                  >
                    {item.percentage}%
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const renderCharts = () => {
    if (!analytics) return null

    switch (field.type) {
      case "radio":
      case "dropdown":
        return (
          <Tabs defaultValue="bar" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-700/50">
              <TabsTrigger value="bar" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Barras
              </TabsTrigger>
              <TabsTrigger value="pie" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Pizza
              </TabsTrigger>
              <TabsTrigger value="donut" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Rosca
              </TabsTrigger>
              <TabsTrigger value="radar" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                Radar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bar" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#9CA3AF" }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      color: "#F9FAFB",
                    }}
                    formatter={(value, name) => [
                      `${value} respostas (${analytics.find((d) => d.value === value)?.percentage}%)`,
                      "Quantidade",
                    ]}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {analytics.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="pie" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={analytics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#F9FAFB",
                    }}
                    formatter={(value, name) => [`${value} respostas`, name]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="donut" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                  <Pie
                    data={analytics}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${percentage}%`}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#F9FAFB",
                    }}
                    formatter={(value, name) => [`${value} respostas`, name]}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="radar" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analytics}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <PolarRadiusAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} />
                  <Radar
                    name="Respostas"
                    dataKey="value"
                    stroke="#F59E0B"
                    fill="#F59E0B"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#F9FAFB",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )

      case "stars":
        return (
          <div className="space-y-8">
            {/* Métricas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-500/10 rounded-2xl border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-500">
                <div className="text-4xl font-bold text-blue-400 mb-2">{analytics.average?.toFixed(1)}</div>
                <div className="text-sm text-blue-300 font-semibold mb-3">Média</div>
                <div className="flex justify-center mt-3">
                  {Array.from({ length: Math.round(analytics.average || 0) }, (_, i) => (
                    <span key={i} className="text-amber-400 text-xl">
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center p-6 bg-green-500/10 rounded-2xl border border-green-500/20 hover:bg-green-500/20 transition-all duration-500">
                <div className="text-4xl font-bold text-green-400 mb-2">{analytics.min}</div>
                <div className="text-sm text-green-300 font-semibold">Mínimo</div>
              </div>
              <div className="text-center p-6 bg-orange-500/10 rounded-2xl border border-orange-500/20 hover:bg-orange-500/20 transition-all duration-500">
                <div className="text-4xl font-bold text-orange-400 mb-2">{analytics.max}</div>
                <div className="text-sm text-orange-300 font-semibold">Máximo</div>
              </div>
              <div className="text-center p-6 bg-purple-500/10 rounded-2xl border border-purple-500/20 hover:bg-purple-500/20 transition-all duration-500">
                <div className="text-4xl font-bold text-purple-400 mb-2">{analytics.median?.toFixed(1)}</div>
                <div className="text-sm text-purple-300 font-semibold">Mediana</div>
              </div>
            </div>

            {/* Gráfico de distribuição */}
            {analytics.distribution && (
              <div className="bg-[#1e293b] rounded-xl p-6 border border-gray-700/50">
                <h3 className="text-xl text-white font-bold mb-6">Distribuição das Avaliações</h3>
                <Tabs defaultValue="bar" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-gray-700/50">
                    <TabsTrigger
                      value="bar"
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                      Barras
                    </TabsTrigger>
                    <TabsTrigger
                      value="area"
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                      Área
                    </TabsTrigger>
                    <TabsTrigger
                      value="line"
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                      Linha
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="bar" className="mt-8">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={analytics.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <Tooltip
                          formatter={(value, name) => [`${value} respostas`, `${name} estrelas`]}
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "12px",
                            color: "#F9FAFB",
                          }}
                        />
                        <Bar dataKey="value" fill="#F59E0B" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="area" className="mt-8">
                    <ResponsiveContainer width="100%" height={350}>
                      <AreaChart data={analytics.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <Tooltip
                          formatter={(value, name) => [`${value} respostas`, `${name} estrelas`]}
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "12px",
                            color: "#F9FAFB",
                          }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="line" className="mt-8">
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={analytics.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                        <Tooltip
                          formatter={(value, name) => [`${value} respostas`, `${name} estrelas`]}
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "1px solid #374151",
                            borderRadius: "12px",
                            color: "#F9FAFB",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#F59E0B"
                          strokeWidth={4}
                          dot={{ fill: "#F59E0B", strokeWidth: 2, r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        )

      case "numeric":
        return (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="text-3xl font-bold text-blue-400 mb-1">{analytics.average?.toFixed(1)}</div>
                <div className="text-sm text-blue-300 font-medium">Média</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                <div className="text-3xl font-bold text-green-400 mb-1">{analytics.min}</div>
                <div className="text-sm text-green-300 font-medium">Mínimo</div>
              </div>
              <div className="text-center p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                <div className="text-3xl font-bold text-orange-400 mb-1">{analytics.max}</div>
                <div className="text-sm text-orange-300 font-medium">Máximo</div>
              </div>
              <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <div className="text-3xl font-bold text-purple-400 mb-1">{analytics.median?.toFixed(1)}</div>
                <div className="text-sm text-purple-300 font-medium">Mediana</div>
              </div>
            </div>

            {/* Gráfico de distribuição */}
            {analytics.distribution && (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analytics.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#9CA3AF" }} />
                  <Tooltip
                    formatter={(value, name) => [`${value} respostas`, `Valor ${name}`]}
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      border: "1px solid #374151",
                      borderRadius: "12px",
                      color: "#F9FAFB",
                    }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="bg-[#1a2332] rounded-xl border border-gray-700/50 overflow-hidden">
      <CardHeader className="bg-gray-700/30 border-b border-gray-600/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">{chartTitle}</CardTitle>
              <div className="text-sm text-gray-400">{chartDescription}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
              className={
                viewMode === "chart"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
              }
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Gráficos
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className={
                viewMode === "table"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
              }
            >
              <Table className="w-4 h-4 mr-1" />
              Tabela
            </Button>
            <Button
              variant={viewMode === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("individual")}
              className={
                viewMode === "individual"
                  ? "bg-orange-500 hover:bg-orange-600 text-white"
                  : "bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
              }
            >
              <Eye className="w-4 h-4 mr-1" />
              Individual
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 bg-[#1a2332]">
        {viewMode === "chart" && renderCharts()}
        {viewMode === "table" && renderDataTable()}
        {viewMode === "individual" && renderIndividualResponses()}
      </CardContent>
    </div>
  )
}
