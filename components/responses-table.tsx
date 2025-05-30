"use client"

import { useState } from "react"
import { Calendar, Star, MessageSquare, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Survey, SurveyResponse } from "@/types/survey"

interface ResponsesTableProps {
  survey: Survey
  responses: SurveyResponse[]
}

export function ResponsesTable({ survey, responses }: ResponsesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("submittedAt")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  if (responses.length === 0) {
    return (
      <Card className="modern-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <MessageSquare className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhuma resposta ainda</h3>
          <p className="text-gray-600 text-center">
            Quando alguém responder sua pesquisa, as respostas aparecerão aqui em formato de tabela
          </p>
        </CardContent>
      </Card>
    )
  }

  // Filtrar respostas baseado na busca
  const filteredResponses = responses.filter((response) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return Object.values(response.answers).some((answer) => {
      if (typeof answer === "string") {
        return answer.toLowerCase().includes(searchLower)
      }
      if (Array.isArray(answer)) {
        return answer.some((item) => String(item).toLowerCase().includes(searchLower))
      }
      return String(answer).toLowerCase().includes(searchLower)
    })
  })

  // Ordenar respostas
  const sortedResponses = [...filteredResponses].sort((a, b) => {
    let aValue, bValue

    if (sortField === "submittedAt") {
      aValue = new Date(a.submittedAt).getTime()
      bValue = new Date(b.submittedAt).getTime()
    } else {
      aValue = a.answers[sortField] || ""
      bValue = b.answers[sortField] || ""
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const renderAnswer = (field: any, answer: any) => {
    if (!answer && answer !== 0) return <span className="text-gray-400 italic">-</span>

    switch (field.type) {
      case "stars":
        const rating = Number.parseInt(answer)
        return (
          <div className="flex items-center space-x-1">
            {Array.from({ length: field.max || 5 }, (_, i) => (
              <Star key={i} className={`w-4 h-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
            ))}
            <span className="text-sm text-gray-600 ml-2">{rating}</span>
          </div>
        )

      case "checkbox":
        if (Array.isArray(answer)) {
          return (
            <div className="flex flex-wrap gap-1">
              {answer.slice(0, 2).map((item, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {item}
                </Badge>
              ))}
              {answer.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{answer.length - 2}
                </Badge>
              )}
            </div>
          )
        }
        return answer

      case "text":
      case "textarea":
        const text = String(answer)
        return (
          <span className="text-sm" title={text}>
            {text.length > 50 ? `${text.substring(0, 50)}...` : text}
          </span>
        )

      default:
        return <span className="text-sm">{String(answer)}</span>
    }
  }

  // Campos principais para exibir na tabela
  const mainFields = survey.fields.filter((f) => f.type !== "divider").slice(0, 4)

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Respostas da Pesquisa</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar nas respostas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={sortField} onValueChange={setSortField}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submittedAt">Data de envio</SelectItem>
                {survey.fields
                  .filter((f) => f.type !== "divider")
                  .slice(0, 5)
                  .map((field) => (
                    <SelectItem key={field.id} value={field.id}>
                      {field.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Mostrando {filteredResponses.length} de {responses.length} respostas
          </div>
        </CardContent>
      </Card>

      {/* Visualização em Cards */}
      <div className="space-y-4">
        {sortedResponses.map((response, index) => (
          <Card key={response.id} className="modern-card hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Resposta #{index + 1}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(response.submittedAt).toLocaleString("pt-BR")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainFields.map((field) => {
                  const answer = response.answers[field.id]
                  if (!answer && answer !== 0) return null

                  return (
                    <div key={field.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs font-medium text-gray-600 mb-1">{field.label}</div>
                      <div>{renderAnswer(field, answer)}</div>
                    </div>
                  )
                })}
              </div>

              {/* Mostrar justificativas se existirem */}
              {survey.fields
                .filter((f) => f.type === "stars")
                .map((field) => {
                  const justification = response.answers[`${field.id}_justification`]
                  if (!justification) return null

                  return (
                    <div
                      key={`${field.id}_justification`}
                      className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-800">Justificativa para "{field.label}":</span>
                      </div>
                      <p className="text-sm text-red-700">{justification}</p>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
