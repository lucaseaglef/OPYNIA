import type { Survey, SurveyResponse, SurveyStats } from "@/types/survey"
import { DatabaseService } from "./database"

export class SurveyAnalytics {
  static calculateStats(survey: Survey, responses: SurveyResponse[]): SurveyStats {
    const totalResponses = responses.length

    // Calculate average rating from star fields (1-5 scale)
    const starFields = survey.fields.filter((f) => f.type === "stars")
    let averageRating: number | undefined

    if (starFields.length > 0) {
      const ratings = responses.flatMap((r) =>
        starFields.map((f) => r.answers[f.id]).filter((rating) => rating && typeof rating === "number"),
      )
      if (ratings.length > 0) {
        averageRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      }
    }

    // Calculate overall satisfaction score (média das avaliações) instead of NPS
    let satisfactionScore: number | undefined
    if (starFields.length > 0) {
      const allRatings = responses.flatMap((r) =>
        starFields.map((f) => r.answers[f.id]).filter((rating) => rating && typeof rating === "number"),
      )

      if (allRatings.length > 0) {
        // Calculate average and convert to percentage (1-5 scale to 0-100%)
        const average = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
        satisfactionScore = Math.round(((average - 1) / 4) * 100) // Convert 1-5 scale to 0-100%
      }
    }

    // Calculate completion rate based on required fields
    const requiredFields = survey.fields.filter((f) => f.required && f.type !== "divider")
    let completionRate = 100

    if (requiredFields.length > 0 && responses.length > 0) {
      const completedResponses = responses.filter((response) =>
        requiredFields.every((field) => {
          const answer = response.answers[field.id]
          return answer !== undefined && answer !== null && answer !== ""
        }),
      )
      completionRate = Math.round((completedResponses.length / responses.length) * 100)
    }

    return {
      totalResponses,
      averageRating,
      satisfactionScore, // Nova propriedade para substituir npsScore
      completionRate,
    }
  }

  static getFieldAnalytics(field: any, responses: SurveyResponse[]) {
    const answers = responses
      .map((r) => r.answers[field.id])
      .filter((answer) => answer !== undefined && answer !== null && answer !== "")

    switch (field.type) {
      case "radio":
      case "dropdown":
        return this.getCategoricalData(answers)
      case "checkbox":
        return this.getMultiSelectData(answers)
      case "stars":
      case "numeric":
        return this.getNumericalData(answers)
      case "likert":
        return this.getLikertData(answers, field.options || [])
      case "ranking":
        return this.getRankingData(answers, field.options || [])
      default:
        return null
    }
  }

  private static getCategoricalData(answers: any[]) {
    const counts: Record<string, number> = {}
    answers.forEach((answer) => {
      counts[answer] = (counts[answer] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value, percentage: Math.round((value / answers.length) * 100) }))
      .sort((a, b) => b.value - a.value)
  }

  private static getMultiSelectData(answers: any[]) {
    const counts: Record<string, number> = {}
    const totalResponses = answers.length

    answers.forEach((answerArray) => {
      if (Array.isArray(answerArray)) {
        answerArray.forEach((answer) => {
          counts[answer] = (counts[answer] || 0) + 1
        })
      }
    })

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percentage: Math.round((value / totalResponses) * 100),
      }))
      .sort((a, b) => b.value - a.value)
  }

  private static getNumericalData(answers: number[]) {
    const numericAnswers = answers.filter((a) => typeof a === "number")
    if (numericAnswers.length === 0) return null

    const avg = numericAnswers.reduce((sum, val) => sum + val, 0) / numericAnswers.length
    const min = Math.min(...numericAnswers)
    const max = Math.max(...numericAnswers)

    // Create distribution for chart
    const distribution: Record<number, number> = {}
    numericAnswers.forEach((answer) => {
      distribution[answer] = (distribution[answer] || 0) + 1
    })

    const chartData = Object.entries(distribution)
      .map(([value, count]) => ({
        name: value,
        value: count,
        percentage: Math.round((count / numericAnswers.length) * 100),
      }))
      .sort((a, b) => Number(a.name) - Number(b.name))

    return {
      average: avg,
      min,
      max,
      count: numericAnswers.length,
      distribution: chartData,
      median: this.calculateMedian(numericAnswers),
    }
  }

  private static getLikertData(answers: any[], options: string[]) {
    const counts: Record<string, number> = {}
    options.forEach((option) => (counts[option] = 0))

    answers.forEach((answer) => {
      if (counts.hasOwnProperty(answer)) {
        counts[answer]++
      }
    })

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: answers.length > 0 ? Math.round((value / answers.length) * 100) : 0,
    }))
  }

  private static getRankingData(answers: any[], options: string[]) {
    const positionScores: Record<string, number[]> = {}
    options.forEach((option) => (positionScores[option] = []))

    answers.forEach((answerArray) => {
      if (Array.isArray(answerArray)) {
        answerArray.forEach((option, index) => {
          if (positionScores[option]) {
            positionScores[option].push(index + 1)
          }
        })
      }
    })

    return Object.entries(positionScores)
      .map(([name, positions]) => {
        const avgPosition =
          positions.length > 0 ? positions.reduce((sum, pos) => sum + pos, 0) / positions.length : options.length
        return {
          name,
          averagePosition: avgPosition,
          totalVotes: positions.length,
          score: Math.round((options.length - avgPosition + 1) * 10), // Score out of 10
        }
      })
      .sort((a, b) => a.averagePosition - b.averagePosition)
  }

  private static calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  // Método atualizado para calcular média de satisfação
  static calculateSatisfactionAverage(responses: SurveyResponse[], starFields: any[]): any {
    if (starFields.length === 0) return null

    const allRatings = responses.flatMap((r) =>
      starFields.map((f) => r.answers[f.id]).filter((rating) => rating && typeof rating === "number"),
    )

    if (allRatings.length === 0) return null

    const average = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
    const percentage = Math.round(((average - 1) / 4) * 100) // Convert 1-5 scale to 0-100%

    // Categorize ratings for detailed analysis
    const excellent = allRatings.filter((rating) => rating === 5).length
    const good = allRatings.filter((rating) => rating === 4).length
    const average_ratings = allRatings.filter((rating) => rating === 3).length
    const poor = allRatings.filter((rating) => rating === 2).length
    const terrible = allRatings.filter((rating) => rating === 1).length

    return {
      average: average,
      percentage: percentage,
      excellent,
      good,
      average_ratings,
      poor,
      terrible,
      total: allRatings.length,
    }
  }

  // Manter método para compatibilidade, mas agora retorna média
  static calculateNPS(responses: SurveyResponse[], starFields: any[]): any {
    if (starFields.length === 0) return null

    const allRatings = responses.flatMap((r) =>
      starFields.map((f) => r.answers[f.id]).filter((rating) => rating && typeof rating === "number"),
    )

    if (allRatings.length === 0) return null

    // Calcular média simples das notas
    const average = allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length
    const score = Math.round(average * 10) / 10 // Arredondar para 1 casa decimal

    return {
      score: score,
      average: average,
      total: allRatings.length,
      // Manter distribuição para análise detalhada
      excellent: allRatings.filter((rating) => rating === 5).length,
      good: allRatings.filter((rating) => rating === 4).length,
      average_ratings: allRatings.filter((rating) => rating === 3).length,
      poor: allRatings.filter((rating) => rating === 2).length,
      terrible: allRatings.filter((rating) => rating === 1).length,
    }
  }

  // Método específico para calcular média usando o banco de dados
  static async calculateSurveyAverage(surveyId: string): Promise<number | null> {
    try {
      return await DatabaseService.calculateSatisfactionAverage(surveyId)
    } catch (error) {
      console.error("Error calculating survey average:", error)
      return null
    }
  }
}
