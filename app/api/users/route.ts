import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente administrativo do Supabase (com service_role_key)
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// GET - Listar todos os usuários
export async function GET() {
  try {
    const supabase = createAdminClient()

    // Buscar usuários do Supabase Auth
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()

    if (authError) {
      console.error("Erro ao buscar usuários:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Buscar perfis adicionais da tabela user_profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      console.error("Erro ao buscar perfis:", profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Combinar dados de autenticação com perfis
    const users = authUsers.users.map(user => {
      const profile = profiles?.find(p => p.user_id === user.id) || {}
      
      return {
        id: user.id,
        name: user.user_metadata?.name || profile.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email,
        role: profile.role || 'viewer',
        permissions: profile.permissions || {
          createSurveys: false,
          editSurveys: false,
          deleteSurveys: false,
          viewResponses: false,
          exportData: false,
          manageUsers: false,
        },
        isActive: !user.banned_until,
        createdAt: user.created_at,
        lastLogin: user.last_sign_in_at
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erro no GET /api/users:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, permissions, isActive } = await request.json()

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name
      },
      email_confirm: true // Email já confirmado por padrão
    })

    if (authError) {
      console.error("Erro ao criar usuário:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
    }

    // Salvar perfil adicional na tabela user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        name,
        role,
        permissions,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error("Erro ao criar perfil:", profileError)
      // Se falhar ao criar perfil, remover usuário criado
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Se não está ativo, banir temporariamente
    if (!isActive) {
      const banUntil = new Date()
      banUntil.setFullYear(banUntil.getFullYear() + 10) // Ban por 10 anos = efetivamente permanente
      
      await supabase.auth.admin.updateUserById(authData.user.id, {
        ban_duration: "876000h" // 10 anos em horas
      })
    }

    console.log(`✅ Usuário ${email} criado com sucesso`)
    return NextResponse.json({ 
      success: true, 
      user: {
        id: authData.user.id,
        name,
        email,
        role,
        permissions,
        isActive,
        createdAt: authData.user.created_at
      }
    })

  } catch (error) {
    console.error("Erro no POST /api/users:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
} 