"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, User, Calendar, Star, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Survey, SurveyResponse } from "@/types/survey"

interface ResponseViewerProps {
  survey: Survey
  responses: SurveyResponse[]
}

export function ResponseViewer({ survey, responses }: ResponseViewerProps) {
  const [currentResponseIndex, setCurrentResponseIndex] = useState(0)

  if (responses.length === 0) {
    return (
      <Card className="modern-card">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
            <User className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Nenhuma resposta ainda</h3>
          <p className="text-gray-600 text-center">
            Quando alguém responder sua pesquisa, as respostas aparecerão aqui
          </p>
        </CardContent>
      </Card>
    )
  }

  const currentResponse = responses[currentResponseIndex]
  const canGoPrev = currentResponseIndex > 0
  const canGoNext = currentResponseIndex < responses.length - 1

  const nextResponse = () => {
    if (canGoNext) {
      setCurrentResponseIndex(currentResponseIndex + 1)
    }
  }

  const prevResponse = () => {
    if (canGoPrev) {
      setCurrentResponseIndex(currentResponseIndex - 1)
    }
  }

  const renderAnswer = (field: any, answer: any) => {
    if (!answer && answer !== 0) return <span className="text-gray-400 italic">Não respondido</span>

    switch (field.type) {
      case "stars":
        const rating = Number.parseInt(answer)
        const justification = currentResponse.answers[`${field.id}_justification`]
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="flex">
                {Array.from({ length: field.max || 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="font-medium text-gray-900">
                {rating} de {field.max || 5}
              </span>
            </div>
            {justification && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Justificativa da nota baixa:</span>
                </div>
                <p className="text-sm text-red-700">{justification}</p>
              </div>
            )}
          </div>
        )

      case "checkbox":
        if (Array.isArray(answer)) {
          return (
            <div className="space-y-1">
              {answer.map((item, index) => (
                <Badge key={index} variant="secondary" className="mr-2 mb-1">
                  {item}
                </Badge>
              ))}
            </div>
          )
        }
        return answer

      case "ranking":
        if (Array.isArray(answer)) {
          return (
            <div className="space-y-2">
              {answer.map((item, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )
        }
        return answer

      case "file":
        return (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-600">📎 {answer}</span>
          </div>
        )

      default:
        return <span className="text-gray-900">{answer}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Resposta Individual</CardTitle>
                <p className="text-gray-600">
                  Visualizando {currentResponseIndex + 1} de {responses.length} respostas
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevResponse}
                disabled={!canGoPrev}
                className="disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <div className="px-4 py-2 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-800">
                  {currentResponseIndex + 1} / {responses.length}
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={nextResponse}
                disabled={!canGoNext}
                className="disabled:opacity-50"
              >
                Próxima
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Response Details */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Detalhes da Resposta</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>{new Date(currentResponse.submittedAt).toLocaleString("pt-BR")}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {survey.fields
              .filter((field) => field.type !== "divider")
              .map((field) => {
                const answer = currentResponse.answers[field.id]

                return (
                  <div key={field.id} className="border-b border-gray-100 pb-4 last:border-b-0">
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-900 mb-1">{field.label}</h4>
                      {field.description && <p className="text-sm text-gray-600">{field.description}</p>}
                    </div>
                    <div className="pl-4">{renderAnswer(field, answer)}</div>
                  </div>
                )
              })}
          </div>
        </CardContent>
      </Card>

      {/* Response Metadata */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="text-lg">Informações Técnicas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">ID da Resposta:</span>
              <p className="text-gray-600 font-mono">{currentResponse.id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Data de Envio:</span>
              <p className="text-gray-600">{new Date(currentResponse.submittedAt).toLocaleString("pt-BR")}</p>
            </div>
            {currentResponse.userAgent && (
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Navegador:</span>
                <p className="text-gray-600 text-xs">{currentResponse.userAgent}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
