"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import {
  Star,
  Upload,
  CheckCircle,
  ArrowLeft,
  Download,
  FileText,
  Folder,
  BarChart3,
  MessageSquare,
  Check,
  Target,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { SurveyStorage } from "@/lib/survey-storage"
import { FieldValidation } from "@/components/field-validation"
import type { Survey, SurveyField, SurveyResponse } from "@/types/survey"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

// Função para gerar UUID válido
const generateUUID = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c == "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export default function SurveyPage() {
  const params = useParams()
  const surveyId = params.id as string

  const [survey, setSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [submittedResponse, setSubmittedResponse] = useState<SurveyResponse | null>(null)
  const [hoveredStep, setHoveredStep] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const stepsContainerRef = useRef<HTMLDivElement>(null)
  const [progressLineWidth, setProgressLineWidth] = useState(0)
  const [progressLineLeft, setProgressLineLeft] = useState(0)
  const [scrollY, setScrollY] = useState(0)

  // Dividir campos em seções baseado nos divisores
  const [sections, setSections] = useState<
    {
      title: string
      fields: SurveyField[]
      icon: any
      color: string
      description: string
      bgColor: string
      iconBg: string
      borderColor: string
      lightColor: string
    }[]
  >([])

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  // Scroll listener for logo scaling
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Calculate progress line dimensions when sections or window size changes
  useEffect(() => {
    if (sections.length > 1 && stepsContainerRef.current) {
      calculateProgressLineDimensions()
      window.addEventListener("resize", calculateProgressLineDimensions)
      return () => window.removeEventListener("resize", calculateProgressLineDimensions)
    }
  }, [sections])

  const calculateProgressLineDimensions = () => {
    if (!stepsContainerRef.current || sections.length <= 1) return

    const stepsContainer = stepsContainerRef.current
    const stepElements = stepsContainer.querySelectorAll(".step-icon")

    if (stepElements.length >= 2) {
      const firstStep = stepElements[0]
      const lastStep = stepElements[stepElements.length - 1]

      const firstStepRect = firstStep.getBoundingClientRect()
      const lastStepRect = lastStep.getBoundingClientRect()
      const containerRect = stepsContainer.getBoundingClientRect()

      const firstStepCenter = firstStepRect.left + firstStepRect.width / 2 - containerRect.left
      const lastStepCenter = lastStepRect.left + lastStepRect.width / 2 - containerRect.left

      setProgressLineWidth(lastStepCenter - firstStepCenter)
      setProgressLineLeft(firstStepCenter)
    }
  }

  const loadSurvey = async () => {
    try {
      setLoading(true)
      const loadedSurvey = await SurveyStorage.getSurveyById(surveyId)
      setSurvey(loadedSurvey)

      if (loadedSurvey) {
        // Criar seções baseadas nos divisores
        const surveySection: {
          title: string
          fields: SurveyField[]
          icon: any
          color: string
          description: string
          bgColor: string
          iconBg: string
          borderColor: string
          lightColor: string
        }[] = []
        let currentSection = {
          title: "Informações Gerais",
          fields: [] as SurveyField[],
          icon: FileText,
          color: "from-blue-500 to-blue-600",
          description: "Dados básicos do participante",
          bgColor: "bg-blue-50",
          iconBg: "bg-blue-500",
          borderColor: "border-blue-500",
          lightColor: "text-blue-600",
        }

        const sectionData = [
          {
            icon: FileText,
            color: "from-blue-500 to-blue-600",
            description: "Dados básicos do participante",
            bgColor: "bg-blue-50",
            iconBg: "bg-blue-500",
            borderColor: "border-blue-500",
            lightColor: "text-blue-600",
          },
          {
            icon: Folder,
            color: "from-orange-500 to-red-500",
            description: "Experiência pré-evento",
            bgColor: "bg-orange-50",
            iconBg: "bg-orange-500",
            borderColor: "border-orange-500",
            lightColor: "text-orange-600",
          },
          {
            icon: Star,
            color: "from-yellow-500 to-orange-500",
            description: "Avaliação da infraestrutura",
            bgColor: "bg-yellow-50",
            iconBg: "bg-yellow-500",
            borderColor: "border-yellow-500",
            lightColor: "text-yellow-600",
          },
          {
            icon: BarChart3,
            color: "from-green-500 to-emerald-500",
            description: "Resultados comerciais",
            bgColor: "bg-green-50",
            iconBg: "bg-green-500",
            borderColor: "border-green-500",
            lightColor: "text-green-600",
          },
          {
            icon: MessageSquare,
            color: "from-purple-500 to-pink-500",
            description: "Comentários e sugestões",
            bgColor: "bg-purple-50",
            iconBg: "bg-purple-500",
            borderColor: "border-purple-500",
            lightColor: "text-purple-600",
          },
        ]
        let sectionIndex = 0

        loadedSurvey.fields.forEach((field) => {
          if (field.type === "divider") {
            if (currentSection.fields.length > 0) {
              surveySection.push(currentSection)
              sectionIndex++
            }
            const sectionInfo = sectionData[sectionIndex] || sectionData[0]
            currentSection = {
              title: field.label
                .replace(/🧾|🗂️|⭐|📊|💬/g, "")
                .replace(/Seção \d+:\s*/, "")
                .trim(),
              fields: [],
              icon: sectionInfo.icon,
              color: sectionInfo.color,
              description: sectionInfo.description,
              bgColor: sectionInfo.bgColor,
              iconBg: sectionInfo.iconBg,
              borderColor: sectionInfo.borderColor,
              lightColor: sectionInfo.lightColor,
            }
          } else {
            currentSection.fields.push(field)
          }
        })

        if (currentSection.fields.length > 0) {
          surveySection.push(currentSection)
        }

        setSections(surveySection)
      }
    } catch (error) {
      console.error("Error loading survey:", error)
    } finally {
      setLoading(false)
    }
  }

  const validateField = (field: SurveyField, value: any): string | null => {
    if (field.required && (!value || (typeof value === "string" && value.trim() === ""))) {
      return "Este campo é obrigatório"
    }

    if (!value || value === "") return null

    // Validação específica por tipo
    switch (field.type) {
      case "email":
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        if (!emailPattern.test(value)) {
          return "Por favor, insira um e-mail válido"
        }
        break

      case "phone":
        const phonePattern = /^$$[0-9]{2}$$\s[0-9]{4,5}-[0-9]{4}$/
        if (!phonePattern.test(value)) {
          return "Formato: (11) 99999-9999"
        }
        break

      case "currency":
        const currencyPattern = /^R\$\s?[0-9]{1,3}(\.[0-9]{3})*(,[0-9]{2})?$/
        if (!currencyPattern.test(value)) {
          return "Formato: R$ 1.234,56"
        }
        break

      case "cep":
        const cepPattern = /^[0-9]{5}-[0-9]{3}$/
        if (!cepPattern.test(value)) {
          return "Formato: 12345-678"
        }
        break
    }

    // Validações de comprimento
    if (field.validation) {
      if (field.validation.minLength && value.length < field.validation.minLength) {
        return `Mínimo de ${field.validation.minLength} caracteres`
      }
      if (field.validation.maxLength && value.length > field.validation.maxLength) {
        return `Máximo de ${field.validation.maxLength} caracteres`
      }
    }

    return null
  }

  const updateAnswer = (fieldId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }))

    // Limpar erro de validação quando o usuário digita
    if (validationErrors[fieldId]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateCurrentSection = (): boolean => {
    const currentSection = sections[currentStep]
    if (!currentSection) return true

    const errors: Record<string, string> = {}
    let hasErrors = false

    currentSection.fields.forEach((field) => {
      const error = validateField(field, answers[field.id])
      if (error) {
        errors[field.id] = error
        hasErrors = true
      }
    })

    setValidationErrors(errors)
    return !hasErrors
  }

  const submitSurvey = async () => {
    if (!survey) return

    try {
      // Validar todos os campos obrigatórios
      const allErrors: Record<string, string> = {}
      let hasErrors = false

      survey.fields.forEach((field) => {
        if (field.type !== "divider") {
          const error = validateField(field, answers[field.id])
          if (error) {
            allErrors[field.id] = error
            hasErrors = true
          }
        }
      })

      if (hasErrors) {
        setValidationErrors(allErrors)
        alert("Por favor, corrija os erros nos campos destacados.")
        return
      }

      const response: SurveyResponse = {
        id: generateUUID(), // Usar UUID válido em vez de "response_${Date.now()}"
        surveyId: survey.id,
        answers,
        submittedAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
      }

      // Salvar no banco Neon
      const success = await SurveyStorage.saveResponse(response)

      if (success) {
        setSubmittedResponse(response)
        setSubmitted(true)
      } else {
        alert("Erro ao enviar resposta. Tente novamente.")
      }
    } catch (error) {
      console.error("Error submitting survey:", error)
      alert("Erro ao enviar resposta. Tente novamente.")
    }
  }

  const downloadResponsePDF = async () => {
    if (!survey || !submittedResponse) return

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()

      // Configurações
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      let yPosition = margin

      // Cores FEIND
      const primaryColor = [7, 32, 62] // #07203e
      const accentColor = [2, 213, 80] // #02d550
      const textColor = [55, 65, 81] // Gray-700
      const lightGray = [243, 244, 246] // Gray-100

      // Função para adicionar nova página se necessário
      const checkNewPage = (requiredSpace = 40) => {
        if (yPosition > pageHeight - requiredSpace) {
          doc.addPage()
          yPosition = margin
          return true
        }
        return false
      }

      // Cabeçalho moderno
      doc.setFillColor(...primaryColor)
      doc.rect(0, 0, pageWidth, 70, "F")

      // Logo se existir
      if (survey.logo) {
        try {
          doc.addImage(survey.logo, "JPEG", margin, 15, 40, 40)
        } catch (e) {
          // Se falhar, adicionar ícone de texto
          doc.setFontSize(24)
          doc.setTextColor(255, 255, 255)
          doc.text("📋", margin + 15, 40)
        }
      } else {
        doc.setFontSize(24)
        doc.setTextColor(255, 255, 255)
        doc.text("📋", margin + 15, 40)
      }

      // Título principal
      doc.setFontSize(20)
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, "bold")
      doc.text("SUAS RESPOSTAS", margin + 50, 30)

      // Subtítulo
      doc.setFontSize(14)
      doc.setFont(undefined, "normal")
      const titleLines = doc.splitTextToSize(survey.title, pageWidth - margin - 70)
      doc.text(titleLines, margin + 50, 45)

      yPosition = 90

      // Informações da resposta
      doc.setFillColor(...lightGray)
      doc.rect(margin, yPosition, pageWidth - 2 * margin, 25, "F")

      doc.setFontSize(10)
      doc.setTextColor(...textColor)
      doc.setFont(undefined, "bold")
      doc.text("INFORMAÇÕES DA RESPOSTA", margin + 5, yPosition + 8)

      doc.setFont(undefined, "normal")
      doc.text(`ID: ${submittedResponse.id}`, margin + 5, yPosition + 16)
      doc.text(`Data: ${new Date(submittedResponse.submittedAt).toLocaleString("pt-BR")}`, margin + 5, yPosition + 22)

      yPosition += 40

      // Processar respostas por seção
      let currentSectionTitle = ""

      survey.fields.forEach((field) => {
        if (field.type === "divider") {
          // Nova seção
          currentSectionTitle = field.label
            .replace(/🧾|🗂️|⭐|📊|💬/g, "")
            .replace(/Seção \d+:\s*/, "")
            .trim()

          checkNewPage(35)

          // Cabeçalho da seção
          doc.setFillColor(...accentColor)
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 20, "F")

          doc.setFontSize(14)
          doc.setTextColor(255, 255, 255)
          doc.setFont(undefined, "bold")
          doc.text(currentSectionTitle, margin + 8, yPosition + 13)

          yPosition += 30
        } else if (submittedResponse.answers[field.id] !== undefined && submittedResponse.answers[field.id] !== "") {
          // Resposta individual
          checkNewPage(50)

          // Container da pergunta
          doc.setFillColor(250, 250, 250)
          doc.rect(margin, yPosition, pageWidth - 2 * margin, 15, "F")

          // Pergunta
          doc.setFontSize(11)
          doc.setTextColor(...textColor)
          doc.setFont(undefined, "bold")
          const questionLines = doc.splitTextToSize(field.label, pageWidth - 2 * margin - 10)
          doc.text(questionLines, margin + 5, yPosition + 10)

          yPosition += 20

          // Resposta
          doc.setFontSize(10)
          doc.setTextColor(0, 0, 0)
          doc.setFont(undefined, "normal")

          let answer = submittedResponse.answers[field.id]

          if (field.type === "stars") {
            const rating = Number(answer)
            const stars = "★".repeat(rating) + "☆".repeat((field.max || 5) - rating)
            doc.text(`${rating} de ${field.max || 5} estrelas: ${stars}`, margin + 10, yPosition + 5)
            yPosition += 10

            // Verificar justificativa
            const justification = submittedResponse.answers[`${field.id}_justification`]
            if (justification) {
              doc.setFontSize(9)
              doc.setTextColor(220, 38, 38) // Red
              doc.setFont(undefined, "italic")
              doc.text("Justificativa:", margin + 10, yPosition + 5)
              yPosition += 8

              doc.setTextColor(0, 0, 0)
              doc.setFont(undefined, "normal")
              const justificationLines = doc.splitTextToSize(justification, pageWidth - 2 * margin - 20)
              doc.text(justificationLines, margin + 10, yPosition + 5)
              yPosition += justificationLines.length * 5
            }
          } else {
            if (Array.isArray(answer)) {
              answer = answer.join(", ")
            }

            const answerLines = doc.splitTextToSize(String(answer), pageWidth - 2 * margin - 20)
            doc.text(answerLines, margin + 10, yPosition + 5)
            yPosition += answerLines.length * 5
          }

          // Linha separadora
          doc.setDrawColor(230, 230, 230)
          doc.line(margin + 5, yPosition + 5, pageWidth - margin - 5, yPosition + 5)
          yPosition += 15
        }
      })

      // Rodapé em todas as páginas
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)

        // Linha do rodapé
        doc.setDrawColor(...lightGray)
        doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25)

        doc.setFontSize(8)
        doc.setTextColor(...textColor)
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 15)
        doc.text("Gerado pela Plataforma FEIND", margin, pageHeight - 15)

        // Logo pequeno no rodapé
        doc.setTextColor(...accentColor)
        doc.text("🌟", pageWidth - margin - 40, pageHeight - 15)
      }

      // Download
      const fileName = `FEIND_Respostas_${new Date().toISOString().split("T")[0]}.pdf`
      doc.save(fileName)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Erro ao gerar PDF. Tente novamente.")
    }
  }

  const getProgress = () => {
    if (!survey) return 0
    const totalFields = survey.fields.filter((f) => f.type !== "divider").length
    const answeredFields = Object.keys(answers).length
    return Math.round((answeredFields / totalFields) * 100)
  }

  const nextStep = () => {
    if (currentStep < sections.length - 1) {
      if (validateCurrentSection()) {
        setIsTransitioning(true)
        setTimeout(() => {
          setCurrentStep(currentStep + 1)
          setIsTransitioning(false)
        }, 150)
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep - 1)
        setIsTransitioning(false)
      }, 150)
    }
  }

  // Função para verificar se deve mostrar campo de justificativa
  const shouldShowJustification = (field: SurveyField) => {
    if (field.type !== "stars") return false
    const rating = answers[field.id]
    return rating && rating < 3
  }

  // Calculate logo size based on scroll
  const getLogoSize = () => {
    const baseSize = window.innerWidth < 640 ? 50 : 120
    const scrollFactor = Math.min(scrollY / 200, 0.3)
    return Math.max(baseSize * (1 - scrollFactor), baseSize * 0.7)
  }

  const renderField = (field: SurveyField) => {
    const value = answers[field.id]
    const error = validationErrors[field.id]

    // Para campos com validação especial, usar o componente FieldValidation
    if (["text", "email", "phone", "currency", "cep", "textarea"].includes(field.type)) {
      return (
        <div className="space-y-2">
          <FieldValidation
            field={field}
            value={value}
            onChange={(newValue) => updateAnswer(field.id, newValue)}
            className={error ? "border-red-400 focus:border-red-400 focus:ring-red-100" : ""}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      )
    }

    switch (field.type) {
      case "checkbox":
        return (
          <div className="space-y-2 sm:space-y-2">
            {field.options?.map((option, index) => (
              <div
                key={index}
                className={`p-3 sm:p-2.5 bg-white rounded-lg sm:rounded-xl border transition-all duration-200 ${
                  error ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Checkbox
                    id={`${field.id}_${index}`}
                    checked={(value || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValues = value || []
                      if (checked) {
                        updateAnswer(field.id, [...currentValues, option])
                      } else {
                        updateAnswer(
                          field.id,
                          currentValues.filter((v: string) => v !== option),
                        )
                      }
                    }}
                    className="w-5 h-5 sm:w-5 sm:h-5"
                  />
                  <Label
                    htmlFor={`${field.id}_${index}`}
                    className="text-sm font-medium cursor-pointer flex-1 leading-relaxed"
                  >
                    {option}
                  </Label>
                </div>
              </div>
            ))}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      case "radio":
        return (
          <div className="space-y-2">
            <RadioGroup value={value || ""} onValueChange={(val) => updateAnswer(field.id, val)}>
              <div className="space-y-2 sm:space-y-2">
                {field.options?.map((option, index) => (
                  <div
                    key={index}
                    className={`p-3 sm:p-2.5 bg-white rounded-lg sm:rounded-xl border transition-all duration-200 ${
                      error ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                    }`}
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <RadioGroupItem value={option} id={`${field.id}_${index}`} className="w-5 h-5 sm:w-5 sm:h-5" />
                      <Label
                        htmlFor={`${field.id}_${index}`}
                        className="text-sm font-medium cursor-pointer flex-1 leading-relaxed"
                      >
                        {option}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      case "dropdown":
        return (
          <div className="space-y-2">
            <Select value={value || ""} onValueChange={(val) => updateAnswer(field.id, val)}>
              <SelectTrigger
                className={`h-11 sm:h-10 text-sm transition-all duration-200 ${
                  error
                    ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                    : "border-gray-200 focus:border-blue-400"
                }`}
              >
                <SelectValue placeholder="Selecione uma opção..." />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option} className="text-sm py-2">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      case "stars":
        return (
          <div className="space-y-4">
            {/* Container de estrelas */}
            <div
              className={`flex flex-col items-center bg-white rounded-lg border py-4 px-2 max-h-[120px] ${
                error ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            >
              <div className="flex justify-center space-x-2 sm:space-x-3">
                {Array.from({ length: field.max || 5 }, (_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => updateAnswer(field.id, index + 1)}
                    className="focus:outline-none transition-all duration-200 hover:scale-110 p-1 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 sm:w-8 sm:h-8 transition-colors duration-200 ${
                        index < (value || 0) ? "fill-current drop-shadow-md" : "text-gray-300 hover:text-green-200"
                      }`}
                      style={{
                        color: index < (value || 0) ? "#02d550" : undefined,
                      }}
                    />
                  </button>
                ))}
              </div>

              {/* Rótulos de apoio */}
              <div className="flex justify-between w-full mt-2 px-1">
                <span className="text-xs text-gray-500">Péssimo</span>
                <span className="text-xs text-gray-500">Excelente</span>
              </div>

              {/* Feedback visual da seleção */}
              {value && (
                <div className="mt-2 text-center">
                  <span className="text-sm font-medium" style={{ color: "#02d550" }}>
                    {value} de {field.max || 5} estrelas
                  </span>
                </div>
              )}
            </div>

            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}

            {/* Campo de justificativa condicional */}
            {shouldShowJustification(field) && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <Label className="text-sm font-medium text-red-800">Por que você deu uma nota baixa?</Label>
                </div>
                <Textarea
                  value={answers[`${field.id}_justification`] || ""}
                  onChange={(e) => updateAnswer(`${field.id}_justification`, e.target.value)}
                  placeholder="Conte-nos o que podemos melhorar..."
                  rows={2}
                  className="text-sm resize-none border-red-200 focus:border-red-400 focus:ring-red-100 transition-all duration-200"
                />
              </div>
            )}
          </div>
        )

      case "likert":
        return (
          <div className="space-y-2">
            <RadioGroup value={value || ""} onValueChange={(val) => updateAnswer(field.id, val)}>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2 sm:gap-3">
                {field.options?.map((option, index) => (
                  <div
                    key={index}
                    className={`flex flex-col items-center space-y-2 sm:space-y-3 p-3 sm:p-4 border-2 rounded-lg sm:rounded-xl transition-all duration-200 cursor-pointer hover:shadow-md ${
                      error ? "border-red-300 bg-red-50" : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                    }`}
                  >
                    <RadioGroupItem value={option} id={`${field.id}_${index}`} className="w-5 h-5 sm:w-5 sm:h-5" />
                    <Label
                      htmlFor={`${field.id}_${index}`}
                      className="text-center text-xs sm:text-sm font-medium cursor-pointer leading-relaxed"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      case "numeric":
        return (
          <div className="space-y-6 sm:space-y-6">
            <div
              className={`p-6 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl sm:rounded-2xl border ${
                error ? "border-red-300" : "border-blue-100"
              }`}
            >
              <Slider
                value={[value || field.min || 0]}
                onValueChange={(vals) => updateAnswer(field.id, vals[0])}
                min={field.min || 0}
                max={field.max || 10}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between items-center text-sm sm:text-base">
              <span className="font-medium text-gray-600 px-3 py-1.5 sm:px-3 sm:py-1.5 bg-gray-100 rounded-full">
                {field.min || 0}
              </span>
              <div
                className={`text-center p-4 sm:p-4 rounded-lg sm:rounded-xl border ${
                  error ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className={`text-2xl sm:text-3xl font-bold ${error ? "text-red-700" : "text-blue-700"}`}>
                  {value || field.min || 0}
                </div>
                <div className={`text-xs sm:text-sm font-medium mt-1 ${error ? "text-red-600" : "text-blue-600"}`}>
                  Sua avaliação
                </div>
              </div>
              <span className="font-medium text-gray-600 px-3 py-1.5 sm:px-3 sm:py-1.5 bg-gray-100 rounded-full">
                {field.max || 10}
              </span>
            </div>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      case "ranking":
        return (
          <div className="space-y-2">
            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) return
                const items = Array.from(value || field.options || [])
                const [reorderedItem] = items.splice(result.source.index, 1)
                items.splice(result.destination.index, 0, reorderedItem)
                updateAnswer(field.id, items)
              }}
            >
              <Droppable droppableId={field.id}>
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 sm:space-y-2">
                    {(value || field.options || []).map((option: string, index: number) => (
                      <Draggable key={option} draggableId={option} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-4 sm:p-3 border-2 rounded-lg sm:rounded-xl bg-white shadow-sm cursor-move transition-all duration-200 ${
                              error
                                ? "border-red-300 hover:border-red-400"
                                : "border-gray-200 hover:shadow-lg hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <div
                                className="w-10 h-10 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                                style={{ backgroundColor: "#02d550" }}
                              >
                                {index + 1}
                              </div>
                              <span className="text-sm sm:text-sm font-medium">{option}</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      case "datetime":
        return (
          <div className="space-y-2">
            <Input
              type="datetime-local"
              value={value || ""}
              onChange={(e) => updateAnswer(field.id, e.target.value)}
              className={`h-11 sm:h-10 text-sm transition-all duration-200 ${
                error
                  ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
              }`}
            />
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      case "file":
        return (
          <div
            className={`border-2 border-dashed rounded-lg sm:rounded-xl p-8 sm:p-6 text-center transition-colors ${
              error
                ? "border-red-300 bg-red-50/30 hover:border-red-400"
                : "border-blue-300 bg-blue-50/30 hover:border-blue-400"
            }`}
          >
            <Upload
              className={`mx-auto h-12 w-12 sm:h-12 sm:w-12 mb-4 sm:mb-4 ${error ? "text-red-400" : "text-blue-400"}`}
            />
            <div className="space-y-2 sm:space-y-2">
              <Label htmlFor={field.id} className="cursor-pointer">
                <span className="text-base sm:text-base font-semibold text-gray-900 block">
                  Clique para fazer upload
                </span>
                <span className="text-sm sm:text-sm text-gray-600 block mt-1 sm:mt-1">ou arraste o arquivo aqui</span>
              </Label>
              <Input
                id={field.id}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    updateAnswer(field.id, file.name)
                  }
                }}
              />
            </div>
            {value && (
              <div className="mt-4 sm:mt-4 p-3 sm:p-3 bg-green-100 rounded-lg border border-green-200">
                <span className="text-green-800 font-medium text-sm">Arquivo selecionado: {value}</span>
              </div>
            )}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">Carregando pesquisa FEIND...</p>
        </div>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="modern-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pesquisa não encontrada</h2>
          <p className="text-gray-600">A pesquisa que você está procurando não existe ou foi removida.</p>
        </div>
      </div>
    )
  }

  if (!survey.isActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 flex items-center justify-center">
        <div className="modern-card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⏸️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Pesquisa Inativa</h2>
          <p className="text-gray-600">Esta pesquisa não está mais aceitando respostas.</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    const successConfig = survey.successConfig || {
      title: "Obrigado!",
      message: "Sua resposta foi enviada com sucesso para a FEIND.",
      showDownloadPdf: true,
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/30 to-teal-50/30 flex items-center justify-center">
        <div className="modern-card p-12 text-center max-w-lg">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-soft">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">{successConfig.title}</h2>
          <p className="text-xl text-gray-600 mb-8">{successConfig.message}</p>

          <div className="space-y-6">
            <div className="p-8 bg-green-50 rounded-xl border border-green-200">
              <p className="text-green-800 font-medium mb-6 text-lg">
                Suas respostas foram salvas no banco de dados e nos ajudarão a melhorar a próxima edição da FEIND.
              </p>

              <div className="space-y-4">
                {successConfig.showDownloadPdf && (
                  <Button
                    onClick={downloadResponsePDF}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-14 text-lg"
                  >
                    <Download className="w-6 h-6 mr-3" />
                    Baixar Minhas Respostas em PDF
                  </Button>
                )}

                {successConfig.redirectUrl && (
                  <Button
                    onClick={() => window.open(successConfig.redirectUrl, "_blank")}
                    variant="outline"
                    className="w-full h-14 text-lg"
                  >
                    <ExternalLink className="w-6 h-6 mr-3" />
                    {successConfig.redirectText || "Continuar"}
                  </Button>
                )}
              </div>
            </div>

            <div className="text-sm text-gray-500 space-y-2 bg-gray-50 p-4 rounded-lg">
              <p>📧 ID da sua resposta: {submittedResponse?.id}</p>
              <p>
                📅 Enviado em:{" "}
                {submittedResponse ? new Date(submittedResponse.submittedAt).toLocaleString("pt-BR") : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentSection = sections[currentStep]
  const progress = getProgress()
  const remainingSections = sections.length - currentStep - 1

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Adicionar fonte Orbitron */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');
        
        .orbitron-font {
          font-family: 'Orbitron', monospace;
        }
      `}</style>

      {/* Container principal centralizado */}
      <div className="mx-auto w-full">
        {/* Enhanced Header with Custom Colors */}
        <div className="backdrop-blur-sm border-b border-gray-200/60" style={{ backgroundColor: "#07203e" }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-10">
            <div className="text-center">
              {/* Logo Personalizado */}
              {survey.logo && (
                <div className="flex justify-center mb-4 sm:mb-6 transition-all duration-300">
                  <img
                    src={survey.logo || "/placeholder.svg"}
                    alt="Logo da pesquisa"
                    className="object-contain transition-all duration-300"
                    style={{
                      height: `${getLogoSize()}px`,
                      maxWidth: "100%",
                    }}
                  />
                </div>
              )}

              {/* Enhanced Title with Custom Color and Orbitron Font */}
              <h1
                className="text-base sm:text-4xl font-bold mb-1 sm:mb-3 leading-tight text-center orbitron-font"
                style={{ color: "#02d550" }}
              >
                {survey.title}
              </h1>

              {/* Description with Custom Color */}
              {survey.description && (
                <p
                  className="text-xs sm:text-lg leading-relaxed max-w-2xl mx-auto text-center px-2"
                  style={{ color: "#ffffff" }}
                >
                  {survey.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stepper Navigation - Cores Personalizadas */}
        <div className="bg-white backdrop-blur-sm border-b border-gray-200/60 sticky top-0 z-10 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-0">
            {/* Mobile Clean Modern Stepper */}
            <div className="block sm:hidden">
              {/* Progress Bar with Percentage */}
              <div className="relative">
                <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full transition-all duration-500 ease-out flex items-center justify-end pr-3"
                    style={{
                      width: `${progress}%`,
                      background: "linear-gradient(to right, #02d550, #02d550)",
                    }}
                  >
                    <span className="text-white text-xs font-bold drop-shadow">{progress}% concluído</span>
                  </div>
                </div>
              </div>

              {/* Current Step Info */}
              <div className="text-center mt-3">
                <div className="text-xs font-medium text-gray-500">
                  Etapa {currentStep + 1} de {sections.length}
                </div>
                <h3 className="text-sm font-bold text-gray-900 mt-0.5">{sections[currentStep]?.title}</h3>
              </div>
            </div>

            {/* Desktop Stepper - Cores Personalizadas */}
            <div className="hidden sm:block relative">
              {/* Steps Container with Ref */}
              <div ref={stepsContainerRef} className="relative flex justify-between py-6 px-0">
                {/* Progress Line - Cinza Claro */}
                {sections.length > 1 && (
                  <div
                    className="absolute top-[42px] h-1 bg-gray-200 rounded-full overflow-hidden"
                    style={{
                      left: `${progressLineLeft}px`,
                      width: `${progressLineWidth}px`,
                      backgroundColor: "#e5e7eb",
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 h-full transition-all duration-1000 ease-out rounded-full"
                      style={{
                        width: sections.length > 1 ? `${(currentStep / (sections.length - 1)) * 100}%` : "0%",
                        backgroundColor: "#02d550", // Verde personalizado
                      }}
                    />
                  </div>
                )}

                {sections.map((section, index) => {
                  const Icon = section.icon
                  const isActive = index === currentStep
                  const isCompleted = index < currentStep
                  const isAccessible = index <= currentStep

                  return (
                    <div
                      key={index}
                      className={`relative flex flex-col items-center group cursor-pointer transition-all duration-300 ${
                        isAccessible ? "" : "cursor-not-allowed opacity-60"
                      }`}
                      onClick={() => isAccessible && setCurrentStep(index)}
                      onMouseEnter={() => setHoveredStep(index)}
                      onMouseLeave={() => setHoveredStep(null)}
                    >
                      {hoveredStep === index && (
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap z-20 shadow-xl">
                          {section.description}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}

                      {/* Step Icon - Cores Personalizadas */}
                      <div
                        className={`step-icon relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 bg-white shadow-md ${
                          isActive ? "shadow-lg scale-110" : isCompleted ? "" : "group-hover:border-gray-400"
                        }`}
                        style={{
                          border: isActive || isCompleted ? `2px solid #02d550` : "1px solid #d1d5db",
                          backgroundColor: isCompleted ? "#02d550" : "white",
                        }}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              isActive ? "bg-white" : "bg-gray-100"
                            }`}
                          >
                            <Icon className={`w-4 h-4`} style={{ color: isActive ? "#02d550" : "#6b7280" }} />
                          </div>
                        )}

                        {isActive && (
                          <div
                            className="absolute inset-0 rounded-full animate-pulse opacity-30"
                            style={{ border: "2px solid #02d550" }}
                          />
                        )}
                      </div>

                      {/* Step Label - Cores Personalizadas */}
                      <div className="mt-2 text-center">
                        <div
                          className={`text-xs font-medium transition-colors duration-300`}
                          style={{
                            color: isActive || isCompleted ? "#02d550" : "#6b7280",
                          }}
                        >
                          {section.title}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Compact Progress Section */}
              <div className="flex items-center justify-between text-xs border-t border-gray-200 pt-2 pb-3">
                <div className="flex items-center space-x-2">
                  <Target className="w-3 h-3" style={{ color: "#02d550" }} />
                  <span className="font-medium text-gray-700">Progresso</span>
                </div>
                <div className="flex items-center space-x-2">
                  {remainingSections > 0 && (
                    <span className="text-gray-600 text-xs">
                      {remainingSections} restante{remainingSections !== 1 ? "s" : ""}
                    </span>
                  )}
                  <span className="text-xs font-bold" style={{ color: "#02d550" }}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-6">
          {currentSection && (
            <div
              className={`transition-all duration-300 ${
                isTransitioning ? "opacity-0 transform translate-y-4" : "opacity-100 transform translate-y-0"
              }`}
            >
              {/* Enhanced Mobile Section Header */}
              <div
                className={`rounded-t-2xl sm:rounded-t-xl overflow-hidden ${
                  currentSection.bgColor
                } border-b-2 border-gray-100 sm:hidden`}
              >
                <div className="px-4 py-5">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                        currentSection.iconBg
                      }`}
                    >
                      <currentSection.icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg font-bold text-gray-900">{currentSection.title}</h2>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {currentSection.fields.length} pergunta{currentSection.fields.length !== 1 ? "s" : ""} nesta
                        seção
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Redesigned Desktop Content Card */}
              <div className="bg-white rounded-b-2xl sm:rounded-2xl shadow-lg border border-gray-200/60 overflow-hidden">
                {/* Desktop Section Header with Left Border */}
                <div className="hidden sm:flex items-center border-b border-gray-100 relative">
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5`}
                    style={{ backgroundColor: "#02d550" }}
                    aria-hidden="true"
                  ></div>
                  <div className="flex items-center space-x-4 px-6 py-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center`}
                      style={{ backgroundColor: "#02d550" }}
                    >
                      <currentSection.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold" style={{ color: "#02d550" }}>
                        {currentSection.title}
                      </h2>
                      <p className="text-sm text-gray-600">{currentSection.description}</p>
                    </div>
                  </div>
                </div>

                {/* Compact Form Content */}
                <div className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {currentSection.fields.map((field, index) => (
                      <div
                        key={field.id}
                        className={`space-y-2 animate-fadeIn ${
                          index > 0 ? "sm:border-t sm:border-gray-100 sm:pt-4" : ""
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          {/* Mobile-optimized question number - COR PERSONALIZADA */}
                          <div
                            className="w-7 h-7 sm:w-6 sm:h-6 rounded-full text-white flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0 shadow-md"
                            style={{ backgroundColor: "#02d550" }}
                          >
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-1 sm:space-y-1.5">
                            <Label className="text-sm sm:text-base font-semibold text-gray-900 leading-tight block">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {field.description && (
                              <p className="text-xs text-gray-600 leading-normal">{field.description}</p>
                            )}
                            <div className="pt-1">{renderField(field)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <Button
                      variant="outline"
                      onClick={prevStep}
                      disabled={currentStep === 0}
                      className="disabled:opacity-50 border-gray-300 hover:bg-gray-100 h-11 sm:h-10 px-4 text-sm flex-1 sm:flex-none min-w-0 rounded-full sm:rounded-md"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      <span className="truncate">Anterior</span>
                    </Button>

                    {currentStep === sections.length - 1 ? (
                      <Button
                        onClick={submitSurvey}
                        className="text-white shadow-lg hover:shadow-xl transition-all duration-300 h-11 sm:h-10 px-5 text-sm font-medium flex-1 sm:flex-none min-w-0 rounded-full sm:rounded-md"
                        style={{
                          background: "linear-gradient(to right, #02d550, #02d550)",
                        }}
                      >
                        <span className="truncate">Enviar Respostas</span>
                        <CheckCircle className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        onClick={nextStep}
                        className="text-white shadow-lg hover:shadow-xl transition-all duration-300 h-11 sm:h-10 px-5 text-sm font-medium flex-1 sm:flex-none min-w-0 rounded-full sm:rounded-md"
                        style={{
                          background: "linear-gradient(to right, #02d550, #02d550)",
                        }}
                      >
                        <span className="truncate">Próxima Seção</span>
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
