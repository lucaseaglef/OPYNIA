export interface SurveyField {
  id: string
  type:
    | "text"
    | "textarea"
    | "checkbox"
    | "radio"
    | "dropdown"
    | "stars"
    | "likert"
    | "numeric"
    | "ranking"
    | "datetime"
    | "file"
    | "divider"
    | "email"
    | "phone"
    | "currency"
    | "cep"
  label: string
  description?: string
  required?: boolean
  options?: string[]
  min?: number
  max?: number
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    currency?: string
    mask?: string
  }
  conditionalLogic?: {
    dependsOn: string
    showWhen: string
  }
}

export interface Survey {
  id: string
  title: string
  description: string
  logo?: string
  logoFile?: File
  fields: SurveyField[]
  createdAt: string
  isActive: boolean
  responses: SurveyResponse[]
  // Novas configurações de sucesso
  successConfig?: {
    title?: string
    message?: string
    redirectUrl?: string
    redirectText?: string
    showDownloadPdf?: boolean
  }
}

export interface SurveyResponse {
  id: string
  surveyId: string
  answers: Record<string, any>
  submittedAt: string
  userAgent?: string
}

export interface SurveyStats {
  totalResponses: number
  averageRating?: number
  satisfactionScore?: number // Nova propriedade para substituir npsScore
  npsScore?: number // Manter para compatibilidade
  completionRate: number
}

export interface ExportFormat {
  type: "csv" | "excel" | "json" | "pdf"
  label: string
  icon: string
  description: string
}
