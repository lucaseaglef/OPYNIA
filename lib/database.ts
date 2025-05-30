import type { Survey, SurveyResponse } from "@/types/survey"

// Função para criar cliente SQL
function createSQLClient() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

  if (!databaseUrl) {
    console.error("❌ ERRO CRÍTICO: Nenhuma URL de banco encontrada!")
    return null
  }

  try {
    const { neon } = require("@neondatabase/serverless")
    const sql = neon(databaseUrl)
    console.log("✅ Cliente SQL criado com sucesso")
    return sql
  } catch (error) {
    console.error("❌ Erro ao criar cliente SQL:", error)
    return null
  }
}

export class DatabaseService {
  // ==================== SURVEYS ====================

  static async getSurveys(): Promise<Survey[]> {
    const sql = createSQLClient()

    if (!sql) {
      console.error("❌ DatabaseService.getSurveys() - Cliente SQL não disponível")
      return []
    }

    try {
      console.log("🔍 DatabaseService.getSurveys() - Executando query...")

      const result = await sql`
        SELECT 
          id,
          title,
          description,
          logo,
          fields,
          is_active,
          created_at,
          updated_at
        FROM surveys.surveys 
        ORDER BY created_at DESC
      `

      console.log(`✅ DatabaseService.getSurveys() - Query executada! ${result.length} registros encontrados`)

      if (result.length === 0) {
        console.warn("⚠️ Nenhuma pesquisa encontrada no banco!")
        return []
      }

      const surveys = result.map((row, index) => {
        console.log(`📋 Processando pesquisa ${index + 1}:`, {
          id: row.id,
          title: row.title,
          isActive: row.is_active,
          fieldsType: typeof row.fields,
          fieldsLength: Array.isArray(row.fields) ? row.fields.length : row.fields ? row.fields.length : 0,
        })

        return {
          id: row.id,
          title: row.title,
          description: row.description || "",
          logo: row.logo || "",
          fields: Array.isArray(row.fields) ? row.fields : JSON.parse(row.fields || "[]"),
          isActive: row.is_active,
          createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
          updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
          responses: [], // Adicionar array vazio para responses
        }
      })

      console.log(
        "🎯 DatabaseService.getSurveys() - Pesquisas processadas:",
        surveys.map((s) => ({
          id: s.id,
          title: s.title,
          active: s.isActive,
          fieldsCount: s.fields.length,
        })),
      )

      return surveys
    } catch (error) {
      console.error("❌ DatabaseService.getSurveys() - Erro na query:", error)
      return []
    }
  }

  static async getSurveyById(id: string): Promise<Survey | null> {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available")
      return null
    }

    try {
      const result = await sql`
        SELECT * FROM surveys.surveys 
        WHERE id = ${id}
        LIMIT 1
      `

      if (result.length === 0) return null

      const row = result[0]
      return {
        id: row.id,
        title: row.title,
        description: row.description || "",
        logo: row.logo || "",
        fields: Array.isArray(row.fields) ? row.fields : JSON.parse(row.fields || "[]"),
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
        isActive: row.is_active,
        responses: [],
      }
    } catch (error) {
      console.error("Error fetching survey by ID:", error)
      return null
    }
  }

  static async saveSurvey(survey: Survey): Promise<boolean> {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available, cannot save survey")
      return false
    }

    try {
      // Verificar se a pesquisa já existe
      const existing = await sql`
        SELECT id FROM surveys.surveys WHERE id = ${survey.id}
      `

      const fieldsJson = JSON.stringify(survey.fields)

      if (existing.length > 0) {
        // Atualizar pesquisa existente
        await sql`
          UPDATE surveys.surveys 
          SET 
            title = ${survey.title},
            description = ${survey.description},
            logo = ${survey.logo || ""},
            fields = ${fieldsJson}::jsonb,
            is_active = ${survey.isActive},
            updated_at = NOW()
          WHERE id = ${survey.id}
        `
        console.log(`✅ Pesquisa ${survey.id} atualizada no banco`)
      } else {
        // Criar nova pesquisa
        await sql`
          INSERT INTO surveys.surveys (
            id, title, description, logo, fields, is_active, created_at
          ) VALUES (
            ${survey.id},
            ${survey.title},
            ${survey.description},
            ${survey.logo || ""},
            ${fieldsJson}::jsonb,
            ${survey.isActive},
            ${survey.createdAt}
          )
        `
        console.log(`✅ Pesquisa ${survey.id} criada no banco`)
      }

      return true
    } catch (error) {
      console.error("Error saving survey:", error)
      return false
    }
  }

  static async deleteSurvey(surveyId: string): Promise<boolean> {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available, cannot delete survey")
      return false
    }

    try {
      await sql`
        DELETE FROM surveys.surveys 
        WHERE id = ${surveyId}
      `
      return true
    } catch (error) {
      console.error("Error deleting survey:", error)
      return false
    }
  }

  // ==================== RESPONSES ====================

  static async getResponses(): Promise<SurveyResponse[]> {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available, returning empty array")
      return []
    }

    try {
      const result = await sql`
        SELECT * FROM surveys.survey_responses 
        ORDER BY submitted_at DESC
      `

      return result.map((row: any) => ({
        id: row.id,
        surveyId: row.survey_id,
        answers: typeof row.answers === "object" ? row.answers : JSON.parse(row.answers || "{}"),
        submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
        userAgent: row.user_agent,
      }))
    } catch (error) {
      console.error("Error fetching responses:", error)
      return []
    }
  }

  static async getSurveyResponses(surveyId: string): Promise<SurveyResponse[]> {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available, returning empty array")
      return []
    }

    try {
      const result = await sql`
        SELECT * FROM surveys.survey_responses 
        WHERE survey_id = ${surveyId}
        ORDER BY submitted_at DESC
      `

      return result.map((row: any) => ({
        id: row.id,
        surveyId: row.survey_id,
        answers: typeof row.answers === "object" ? row.answers : JSON.parse(row.answers || "{}"),
        submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
        userAgent: row.user_agent,
      }))
    } catch (error) {
      console.error("Error fetching survey responses:", error)
      return []
    }
  }

  static async saveResponse(response: SurveyResponse, ipAddress?: string): Promise<boolean> {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available, cannot save response")
      return false
    }

    try {
      const answersJson = JSON.stringify(response.answers)

      // Check for recent duplicate content from the same IP for the same survey
      const duplicateCheck = await sql`
        SELECT id FROM surveys.survey_responses
        WHERE survey_id = ${response.surveyId}
          AND answers = ${answersJson}::jsonb
          AND ip_address = ${ipAddress || null}
          AND submitted_at >= NOW() - INTERVAL '1 minute' -- Check for submissions in the last minute
        LIMIT 1;
      `

      if (duplicateCheck.length > 0) {
        console.warn(
          `Recent duplicate response content from IP ${ipAddress} for survey ${response.surveyId}. Existing ID: ${duplicateCheck[0].id}. New attempt ID: ${response.id}. Preventing save.`,
        )
        return true // Indicate success to client to avoid error, but don't save duplicate
      }

      const result = await sql`
        INSERT INTO surveys.survey_responses (
          id, survey_id, answers, submitted_at, user_agent, ip_address
        ) VALUES (
          ${response.id},
          ${response.surveyId},
          ${answersJson}::jsonb,
          ${response.submittedAt},
          ${response.userAgent || ""},
          ${ipAddress || null}
        )
        ON CONFLICT (id) DO NOTHING
        RETURNING id; -- Return id if inserted, null/empty if conflict
      `
      // Check if insert happened
      if (result.length > 0 && result[0].id === response.id) {
        console.log(`✅ Response ${response.id} saved for survey ${response.surveyId}`)
      } else {
        console.warn(
          `Response ${response.id} for survey ${response.surveyId} was not inserted (possibly due to ID conflict or other reason).`,
        )
      }
      return true // Always return true to client for better UX on resubmits/duplicates
    } catch (error) {
      console.error("Error saving response:", error)
      return false
    }
  }

  static async exportToCSV(surveyId: string): Promise<string> {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available, cannot export CSV")
      return ""
    }

    try {
      // Buscar pesquisa e respostas
      const surveyResult = await sql`
        SELECT * FROM surveys.surveys WHERE id = ${surveyId}
      `

      if (surveyResult.length === 0) return ""

      const survey = surveyResult[0]
      const fields = Array.isArray(survey.fields) ? survey.fields : JSON.parse(survey.fields || "[]")

      const responsesResult = await sql`
        SELECT * FROM surveys.survey_responses 
        WHERE survey_id = ${surveyId}
        ORDER BY submitted_at DESC
      `

      if (responsesResult.length === 0) return ""

      // Gerar CSV
      const dataFields = fields.filter((f: any) => f.type !== "divider")
      const headers = ["ID", "Data de Submissão", ...dataFields.map((f: any) => f.label)]

      const rows = responsesResult.map((response: any) => {
        const answers = typeof response.answers === "object" ? response.answers : JSON.parse(response.answers || "{}")

        return [
          response.id,
          new Date(response.submitted_at).toLocaleString("pt-BR"),
          ...dataFields.map((field: any) => {
            const answer = answers[field.id]
            if (Array.isArray(answer)) return answer.join("; ")
            return answer || ""
          }),
        ]
      })

      return [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
        .join("\n")
    } catch (error) {
      console.error("Error exporting CSV:", error)
      return ""
    }
  }

  // ==================== ANALYTICS ====================

  static async getSurveyStats(surveyId: string) {
    const sql = createSQLClient()

    if (!sql) {
      console.warn("Database not available, returning empty array")
      return []
    }

    try {
      const result = await sql`
        SELECT 
          COUNT(*) as total_responses,
          COUNT(DISTINCT ip_address) as unique_visitors,
          DATE_TRUNC('day', submitted_at) as response_date,
          COUNT(*) as daily_count
        FROM surveys.survey_responses 
        WHERE survey_id = ${surveyId}
        GROUP BY DATE_TRUNC('day', submitted_at)
        ORDER BY response_date DESC
      `

      return result
    } catch (error) {
      console.error("Error fetching survey stats:", error)
      return []
    }
  }

  static async calculateSatisfactionAverage(surveyId: string): Promise<number | null> {
    const sql = createSQLClient()

    if (!sql) {
      return null
    }

    try {
      // Buscar a pesquisa para identificar campos de estrelas
      const surveyResult = await sql`
        SELECT fields FROM surveys.surveys WHERE id = ${surveyId}
      `

      if (surveyResult.length === 0) return null

      const survey = surveyResult[0]
      const fields = Array.isArray(survey.fields) ? survey.fields : JSON.parse(survey.fields || "[]")

      // Encontrar campos de estrelas (1-5) para calcular média
      const starFields = fields.filter((f: any) => f.type === "stars" && f.min === 1 && f.max === 5)

      if (starFields.length === 0) return null

      // Buscar todas as respostas
      const responses = await sql`
        SELECT answers FROM surveys.survey_responses 
        WHERE survey_id = ${surveyId}
      `

      if (responses.length === 0) return null

      // Calcular média baseado nas avaliações de estrelas
      let totalRatings = 0
      let sumRatings = 0

      responses.forEach((response: any) => {
        const answers = typeof response.answers === "object" ? response.answers : JSON.parse(response.answers || "{}")

        starFields.forEach((field: any) => {
          const rating = answers[field.id]
          if (rating && typeof rating === "number") {
            totalRatings++
            sumRatings += rating
          }
        })
      })

      if (totalRatings === 0) return null

      // Calcular média e converter para percentual (1-5 para 0-100%)
      const average = sumRatings / totalRatings
      const percentage = Math.round(((average - 1) / 4) * 100)
      return percentage
    } catch (error) {
      console.error("Error calculating satisfaction average:", error)
      return null
    }
  }

  // Método NPS que retorna média de satisfação
  static async calculateNPS(surveyId: string): Promise<number | null> {
    return this.calculateSatisfactionAverage(surveyId)
  }
}
