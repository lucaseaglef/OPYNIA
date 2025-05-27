import type { Survey, SurveyResponse, SurveyField } from "@/types/survey"

export class SurveyStorage {
  // ==================== SURVEYS ====================

  static async getSurveys(): Promise<Survey[]> {
    console.log("🔍 SurveyStorage.getSurveys() - Buscando via API...")

    try {
      const response = await fetch("/api/surveys", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("✅ SurveyStorage.getSurveys() - Sucesso via API:", data.surveys.length, "pesquisas encontradas")
      console.log(
        "📋 Títulos das pesquisas:",
        data.surveys.map((s: Survey) => s.title),
      )

      return data.surveys || []
    } catch (error) {
      console.error("❌ SurveyStorage.getSurveys() - Erro na API:", error)
      return []
    }
  }

  static async getSurveyById(id: string): Promise<Survey | null> {
    try {
      const response = await fetch(`/api/surveys/${id}`)

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.survey
    } catch (error) {
      console.error("Error getting survey by ID:", error)
      return null
    }
  }

  static async saveSurvey(survey: Survey): Promise<boolean> {
    try {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(survey),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error saving survey:", error)
      return false
    }
  }

  static async updateSurvey(surveyId: string, updates: Partial<Survey>): Promise<boolean> {
    try {
      // Buscar pesquisa atual
      const currentSurvey = await this.getSurveyById(surveyId)
      if (!currentSurvey) return false

      // Aplicar atualizações
      const updatedSurvey = { ...currentSurvey, ...updates }

      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSurvey),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error updating survey:", error)
      return false
    }
  }

  static async deleteSurvey(surveyId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/surveys/${surveyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.success
    } catch (error) {
      console.error("Error deleting survey:", error)
      return false
    }
  }

  // ==================== RESPONSES ====================

  static async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    try {
      const response = await fetch(`/api/responses/${surveyId}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data.responses || []
    } catch (error) {
      console.error("Error getting survey responses:", error)
      return []
    }
  }

  static async saveResponse(response: SurveyResponse, ipAddress?: string): Promise<boolean> {
    try {
      const apiResponse = await fetch("/api/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(response),
      })

      if (!apiResponse.ok) {
        throw new Error(`HTTP error! status: ${apiResponse.status}`)
      }

      const data = await apiResponse.json()
      return data.success
    } catch (error) {
      console.error("Error saving response:", error)
      return false
    }
  }

  static async exportToCSV(surveyId: string): Promise<string> {
    try {
      // Buscar pesquisa e respostas via API
      const survey = await this.getSurveyById(surveyId)
      const responses = await this.getSurveyResponses(surveyId)

      if (!survey || responses.length === 0) return ""

      const headers = [
        "ID",
        "Data de Submissão",
        ...survey.fields.filter((f) => f.type !== "divider").map((f) => f.label),
      ]

      const rows = responses.map((response) => [
        response.id,
        new Date(response.submittedAt).toLocaleString("pt-BR"),
        ...survey.fields
          .filter((f) => f.type !== "divider")
          .map((field) => {
            const answer = response.answers[field.id]
            if (Array.isArray(answer)) return answer.join("; ")
            return answer || ""
          }),
      ])

      return [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")
    } catch (error) {
      console.error("Error exporting to CSV:", error)
      return ""
    }
  }

  // Métodos auxiliares para compatibilidade
  static async updateSurveyField(
    surveyId: string,
    fieldId: string,
    fieldUpdates: Partial<SurveyField>,
  ): Promise<boolean> {
    try {
      const survey = await this.getSurveyById(surveyId)
      if (!survey) return false

      const updatedFields = survey.fields.map((field) => (field.id === fieldId ? { ...field, ...fieldUpdates } : field))

      return await this.updateSurvey(surveyId, { fields: updatedFields })
    } catch (error) {
      console.error("Error updating survey field:", error)
      return false
    }
  }

  static async duplicateSurveyField(surveyId: string, fieldId: string): Promise<boolean> {
    try {
      const survey = await this.getSurveyById(surveyId)
      if (!survey) return false

      const fieldToDuplicate = survey.fields.find((f) => f.id === fieldId)
      if (!fieldToDuplicate) return false

      const newField: SurveyField = {
        ...fieldToDuplicate,
        id: `field_${Date.now()}`,
        label: `${fieldToDuplicate.label} (Cópia)`,
      }

      const fieldIndex = survey.fields.findIndex((f) => f.id === fieldId)
      const newFields = [...survey.fields]
      newFields.splice(fieldIndex + 1, 0, newField)

      return await this.updateSurvey(surveyId, { fields: newFields })
    } catch (error) {
      console.error("Error duplicating survey field:", error)
      return false
    }
  }

  static async deleteSurveyField(surveyId: string, fieldId: string): Promise<boolean> {
    try {
      const survey = await this.getSurveyById(surveyId)
      if (!survey) return false

      const updatedFields = survey.fields.filter((f) => f.id !== fieldId)
      return await this.updateSurvey(surveyId, { fields: updatedFields })
    } catch (error) {
      console.error("Error deleting survey field:", error)
      return false
    }
  }
}
