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

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const sql = createSQLClient()

  if (!sql) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }

  try {
    const result = await sql`
      SELECT * FROM surveys.surveys 
      WHERE id = ${params.id}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Survey not found" }, { status: 404 })
    }

    const row = result[0]
    const survey = {
      id: row.id,
      title: row.title,
      description: row.description || "",
      logo: row.logo || "",
      fields: Array.isArray(row.fields) ? row.fields : JSON.parse(row.fields || "[]"),
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      isActive: row.is_active,
      responses: [],
    }

    return NextResponse.json({ survey })
  } catch (error) {
    console.error("Error fetching survey:", error)
    return NextResponse.json({ error: "Failed to fetch survey" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const sql = createSQLClient()

  if (!sql) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }

  try {
    const survey = await request.json()

    // Ensure the survey ID matches the URL parameter
    survey.id = params.id

    // Validate survey data
    if (!survey.title) {
      return NextResponse.json({ error: "Survey title is required" }, { status: 400 })
    }

    const fieldsJson = JSON.stringify(survey.fields)

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

    return NextResponse.json({ success: true, message: "Survey updated successfully" })
  } catch (error) {
    console.error("Error updating survey:", error)
    return NextResponse.json({ error: "Failed to update survey" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const sql = createSQLClient()

  if (!sql) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }

  try {
    await sql`
      DELETE FROM surveys.surveys 
      WHERE id = ${params.id}
    `

    return NextResponse.json({ success: true, message: "Survey deleted successfully" })
  } catch (error) {
    console.error("Error deleting survey:", error)
    return NextResponse.json({ error: "Failed to delete survey" }, { status: 500 })
  }
}
