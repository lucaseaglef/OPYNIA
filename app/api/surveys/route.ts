import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Função para criar cliente SQL no servidor
function createSQLClient() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL

  if (!databaseUrl) {
    console.error("❌ ERRO: Nenhuma URL de banco encontrada nas variáveis de ambiente do servidor!")
    return null
  }

  try {
    const sql = neon(databaseUrl)
    console.log("✅ Cliente SQL criado com sucesso no servidor")
    return sql
  } catch (error) {
    console.error("❌ Erro ao criar cliente SQL:", error)
    return null
  }
}

export async function GET() {
  const sql = createSQLClient()

  if (!sql) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }

  try {
    console.log("🔍 API: Buscando pesquisas no banco...")

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

    console.log(`✅ API: ${result.length} pesquisas encontradas`)

    const surveys = result.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description || "",
      logo: row.logo || "",
      fields: Array.isArray(row.fields) ? row.fields : JSON.parse(row.fields || "[]"),
      isActive: row.is_active,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
      responses: [],
    }))

    console.log(
      "📋 API: Pesquisas processadas:",
      surveys.map((s) => ({ id: s.id, title: s.title })),
    )

    return NextResponse.json({ surveys })
  } catch (error) {
    console.error("❌ API: Erro ao buscar pesquisas:", error)
    return NextResponse.json({ error: "Failed to fetch surveys" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const sql = createSQLClient()

  if (!sql) {
    return NextResponse.json({ error: "Database connection failed" }, { status: 500 })
  }

  try {
    const survey = await request.json()

    // Validate survey data
    if (!survey.id || !survey.title) {
      return NextResponse.json({ error: "Invalid survey data" }, { status: 400 })
    }

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
      console.log(`✅ API: Pesquisa ${survey.id} atualizada`)
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
      console.log(`✅ API: Pesquisa ${survey.id} criada`)
    }

    return NextResponse.json({ success: true, message: "Survey saved successfully" })
  } catch (error) {
    console.error("❌ API: Erro ao salvar pesquisa:", error)
    return NextResponse.json({ error: "Failed to save survey" }, { status: 500 })
  }
}
