import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function createSQLClient() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

  if (!databaseUrl) {
    return null
  }

  try {
    return neon(databaseUrl)
  } catch (error) {
    console.error("Error creating SQL client:", error)
    return null
  }
}

export async function GET(request: NextRequest, { params }: { params: { surveyId: string } }) {
  const sql = createSQLClient()

  if (!sql) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }

  try {
    const result = await sql`
      SELECT * FROM surveys.survey_responses 
      WHERE survey_id = ${params.surveyId}
      ORDER BY submitted_at DESC
    `

    const responses = result.map((row: any) => ({
      id: row.id,
      surveyId: row.survey_id,
      answers: typeof row.answers === "object" ? row.answers : JSON.parse(row.answers || "{}"),
      submittedAt: row.submitted_at instanceof Date ? row.submitted_at.toISOString() : row.submitted_at,
      userAgent: row.user_agent,
    }))

    return NextResponse.json({ responses })
  } catch (error) {
    console.error("Error fetching responses:", error)
    return NextResponse.json({ responses: [] })
  }
}
