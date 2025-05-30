import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Cliente administrativo do Supabase
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

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, email, role, permissions, isActive } = await request.json()
    const userId = params.id

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Dados obrigatórios não fornecidos" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Atualizar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(userId, {
      email,
      user_metadata: {
        name
      }
    })

    if (authError) {
      console.error("Erro ao atualizar usuário:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    // Atualizar perfil na tabela user_profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        name,
        role,
        permissions,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error("Erro ao atualizar perfil:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Gerenciar status ativo/inativo
    if (!isActive) {
      // Banir usuário
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "876000h" // 10 anos em horas
      })
    } else {
      // Remover ban (se existir)
      await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "none"
      })
    }

    console.log(`✅ Usuário ${userId} atualizado com sucesso`)
    return NextResponse.json({ 
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
        permissions,
        isActive
      }
    })

  } catch (error) {
    console.error("Erro no PUT /api/users/[id]:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Deletar usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const supabase = createAdminClient()

    // Deletar perfil da tabela user_profiles primeiro
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId)

    if (profileError) {
      console.error("Erro ao deletar perfil:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Deletar usuário do Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)

    if (authError) {
      console.error("Erro ao deletar usuário:", authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    console.log(`✅ Usuário ${userId} deletado com sucesso`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Erro no DELETE /api/users/[id]:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
} 