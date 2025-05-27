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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
}

export function EnhancedCharts({ field, analytics, responses }: EnhancedChartsProps) {
  const [viewMode, setViewMode] = useState<"chart" | "table" | "individual">("chart")

  const chartTitle = field.label
  const chartDescription = `${responses.filter((r) => r.answers[field.id]).length} respostas coletadas`

  const renderIndividualResponses = () => {
    const fieldResponses = responses
      .map((r, index) => ({
        responseId: r.id,
        responseIndex: index + 1,
        answer: r.answers[field.id],
        submittedAt: r.submittedAt,
      }))
      .filter((r) => r.answer !== undefined && r.answer !== null && r.answer !== "")

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {fieldResponses.map((response, index) => (
          <div
            key={response.responseId}
            className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                  {response.responseIndex}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Resposta #{response.responseIndex}</div>
                  <div className="text-xs text-gray-500">{new Date(response.submittedAt).toLocaleString("pt-BR")}</div>
                </div>
              </div>
            </div>

            <div className="ml-11">
              {field.type === "stars" && (
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: field.max || 5 }, (_, i) => (
                      <span key={i} className={`text-lg ${i < response.answer ? "text-amber-400" : "text-gray-300"}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {response.answer} de {field.max || 5} estrelas
                  </span>
                </div>
              )}

              {field.type === "numeric" && (
                <div className="flex items-center space-x-3">
                  <div className="text-2xl font-bold text-blue-600">{response.answer}</div>
                  <div className="text-sm text-gray-600">
                    de {field.min || 0} a {field.max || 10}
                  </div>
                </div>
              )}

              {["radio", "dropdown"].includes(field.type) && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                  {response.answer}
                </div>
              )}

              {field.type === "checkbox" && Array.isArray(response.answer) && (
                <div className="flex flex-wrap gap-2">
                  {response.answer.map((item, i) => (
                    <Badge key={i} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {item}
                    </Badge>
                  ))}
                </div>
              )}

              {["text", "textarea"].includes(field.type) && (
                <div className="text-gray-800 leading-relaxed bg-white p-3 rounded-lg border border-gray-200">
                  {response.answer}
                </div>
              )}

              {field.type === "likert" && (
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                  {response.answer}
                </div>
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
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Opção</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Respostas</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Percentual</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Barra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {analytics.map((item: any, index: number) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">{item.value}</td>
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
                  <div className="w-full bg-gray-200 rounded-full h-2">
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="bar">Barras</TabsTrigger>
              <TabsTrigger value="pie">Pizza</TabsTrigger>
              <TabsTrigger value="donut">Rosca</TabsTrigger>
              <TabsTrigger value="radar">Radar</TabsTrigger>
            </TabsList>

            <TabsContent value="bar" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
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
                  <Tooltip formatter={(value, name) => [`${value} respostas`, name]} />
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
                  <Tooltip formatter={(value, name) => [`${value} respostas`, name]} />
                </RechartsPieChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="radar" className="mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={analytics}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis tick={{ fontSize: 10 }} />
                  <Radar
                    name="Respostas"
                    dataKey="value"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        )

      case "stars":
        return (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-1">{analytics.average?.toFixed(1)}</div>
                <div className="text-sm text-blue-700 font-medium">Média</div>
                <div className="flex justify-center mt-2">
                  {Array.from({ length: Math.round(analytics.average || 0) }, (_, i) => (
                    <span key={i} className="text-amber-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-1">{analytics.min}</div>
                <div className="text-sm text-green-700 font-medium">Mínimo</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200">
                <div className="text-3xl font-bold text-orange-600 mb-1">{analytics.max}</div>
                <div className="text-sm text-orange-700 font-medium">Máximo</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-1">{analytics.median?.toFixed(1)}</div>
                <div className="text-sm text-purple-700 font-medium">Mediana</div>
              </div>
            </div>

            {/* Gráfico de distribuição */}
            {analytics.distribution && (
              <Tabs defaultValue="bar" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bar">Barras</TabsTrigger>
                  <TabsTrigger value="area">Área</TabsTrigger>
                  <TabsTrigger value="line">Linha</TabsTrigger>
                </TabsList>

                <TabsContent value="bar" className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => [`${value} respostas`, `${name} estrelas`]} />
                      <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="area" className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => [`${value} respostas`, `${name} estrelas`]} />
                      <Area type="monotone" dataKey="value" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </TabsContent>

                <TabsContent value="line" className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value, name) => [`${value} respostas`, `${name} estrelas`]} />
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
            )}
          </div>
        )

      case "numeric":
        return (
          <div className="space-y-6">
            {/* Métricas principais */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border border-blue-200">
                <div className="text-3xl font-bold text-blue-600 mb-1">{analytics.average?.toFixed(1)}</div>
                <div className="text-sm text-blue-700 font-medium">Média</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                <div className="text-3xl font-bold text-green-600 mb-1">{analytics.min}</div>
                <div className="text-sm text-green-700 font-medium">Mínimo</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl border border-orange-200">
                <div className="text-3xl font-bold text-orange-600 mb-1">{analytics.max}</div>
                <div className="text-sm text-orange-700 font-medium">Máximo</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl border border-purple-200">
                <div className="text-3xl font-bold text-purple-600 mb-1">{analytics.median?.toFixed(1)}</div>
                <div className="text-sm text-purple-700 font-medium">Mediana</div>
              </div>
            </div>

            {/* Gráfico de distribuição */}
            {analytics.distribution && (
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={analytics.distribution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value, name) => [`${value} respostas`, `Valor ${name}`]} />
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
    <Card className="modern-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="icon-wrapper icon-primary">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{chartTitle}</CardTitle>
              <div className="text-sm text-gray-600">{chartDescription}</div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === "chart" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("chart")}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Gráficos
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <Table className="w-4 h-4 mr-1" />
              Tabela
            </Button>
            <Button
              variant={viewMode === "individual" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("individual")}
            >
              <Eye className="w-4 h-4 mr-1" />
              Individual
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "chart" && renderCharts()}
        {viewMode === "table" && renderDataTable()}
        {viewMode === "individual" && renderIndividualResponses()}
      </CardContent>
    </Card>
  )
}
