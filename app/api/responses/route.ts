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

export async function POST(request: NextRequest) {
  const sql = createSQLClient()

  if (!sql) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }

  try {
    const response = await request.json()

    // Capturar IP do usuário para analytics
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip")

    const answersJson = JSON.stringify(response.answers)

    await sql`
      INSERT INTO surveys.survey_responses (
        id, survey_id, answers, submitted_at, user_agent, ip_address
      ) VALUES (
        ${response.id},
        ${response.surveyId},
        ${answersJson}::jsonb,
        ${response.submittedAt},
        ${response.userAgent || ""},
        ${ip || null}
      )
    `

    console.log(`✅ Resposta ${response.id} salva no banco`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving response:", error)
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 })
  }
}
