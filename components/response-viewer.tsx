"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, User, Calendar, Star, MessageSquare, Clock, Hash } from "lucide-react"
import { Button } from "@/components/ui/button"
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
      <div className="bg-[#1e293b] rounded-lg p-8 text-center border border-gray-700/50">
        <User className="h-12 w-12 text-gray-500 mx-auto mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">Nenhuma resposta ainda</h3>
        <p className="text-gray-400">Quando alguém responder sua pesquisa, as respostas aparecerão aqui</p>
      </div>
    )
  }

  const currentResponse = responses[currentResponseIndex]
  const canGoPrev = currentResponseIndex > 0
  const canGoNext = currentResponseIndex < responses.length - 1

  // Encontrar o nome do respondente
  let respondentName = "Anônimo"
  for (const fieldId in currentResponse.answers) {
    const field = survey.fields.find((f) => f.id === fieldId)
    if (field && field.label.toLowerCase().includes("nome") && currentResponse.answers[fieldId]) {
      respondentName = currentResponse.answers[fieldId]
      break
    }
  }

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
    if (!answer && answer !== 0) return <span className="text-gray-500 italic">Não respondido</span>

    switch (field.type) {
      case "stars":
        const rating = Number.parseInt(answer)
        const justification = currentResponse.answers[`${field.id}_justification`]
        return (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex">
                {Array.from({ length: field.max || 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-600"}`}
                  />
                ))}
              </div>
              <span className="font-bold text-white text-lg">
                {rating} de {field.max || 5}
              </span>
            </div>
            {justification && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-red-400" />
                  <span className="text-sm font-semibold text-red-300">Justificativa da nota baixa:</span>
                </div>
                <p className="text-sm text-red-200 leading-relaxed">{justification}</p>
              </div>
            )}
          </div>
        )

      case "checkbox":
        if (Array.isArray(answer)) {
          return (
            <div className="flex flex-wrap gap-2">
              {answer.map((item, index) => (
                <Badge key={index} className="bg-green-500/20 text-green-300 border border-green-500/30 px-3 py-1">
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
            <div className="space-y-3">
              {answer.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20"
                >
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-white">{item}</span>
                </div>
              ))}
            </div>
          )
        }
        return answer

      case "radio":
      case "dropdown":
        return (
          <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 text-base">
            {answer}
          </Badge>
        )

      case "text":
      case "textarea":
        return (
          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
            <p className="text-gray-200 leading-relaxed">{answer}</p>
          </div>
        )

      case "numeric":
        return (
          <div className="flex items-center space-x-3">
            <div className="text-2xl font-bold text-blue-400">{answer}</div>
            <div className="text-sm text-gray-400">
              de {field.min || 0} a {field.max || 10}
            </div>
          </div>
        )

      default:
        return <span className="text-white font-medium">{answer}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header de Navegação */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{respondentName}</h2>
              <p className="text-orange-100 text-lg">
                Resposta {currentResponseIndex + 1} de {responses.length}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-orange-200">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{new Date(currentResponse.submittedAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{new Date(currentResponse.submittedAt).toLocaleTimeString("pt-BR")}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="lg"
              onClick={prevResponse}
              disabled={!canGoPrev}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Anterior
            </Button>

            <div className="px-6 py-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <span className="text-lg font-bold text-white">
                {currentResponseIndex + 1} / {responses.length}
              </span>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={nextResponse}
              disabled={!canGoNext}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 disabled:opacity-50"
            >
              Próxima
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Respostas com melhor diferenciação */}
      <div className="space-y-6">
        {survey.fields
          .filter((field) => field.type !== "divider")
          .map((field, index) => {
            const answer = currentResponse.answers[field.id]

            return (
              <div key={field.id} className="bg-[#1e293b] rounded-lg border border-gray-700/50 overflow-hidden">
                {/* Pergunta - Header destacado */}
                <div className="bg-gray-700/30 px-6 py-4 border-b border-gray-600/50">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-1">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg leading-tight">{field.label}</h3>
                      {field.description && (
                        <p className="text-sm text-gray-400 mt-1 leading-relaxed">{field.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resposta - Área destacada */}
                <div className="px-6 py-6 bg-[#1a2332]">
                  <div className="ml-11">{renderAnswer(field, answer)}</div>
                </div>
              </div>
            )
          })}
      </div>

      {/* Informações Técnicas */}
      <div className="bg-[#1e293b] rounded-lg p-6 border border-gray-700/50">
        <div className="flex items-center space-x-3 mb-4">
          <Hash className="w-6 h-6 text-gray-400" />
          <h3 className="text-lg font-bold text-white">Informações Técnicas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <div className="flex items-center space-x-3 mb-2">
              <Hash className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-gray-300">ID da Resposta:</span>
            </div>
            <p className="text-gray-400 font-mono text-sm bg-gray-800/50 p-2 rounded">{currentResponse.id}</p>
          </div>
          <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-5 h-5 text-green-400" />
              <span className="font-semibold text-gray-300">Data de Envio:</span>
            </div>
            <p className="text-gray-400 font-medium">{new Date(currentResponse.submittedAt).toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
