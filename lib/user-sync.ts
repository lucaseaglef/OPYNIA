import { createClient } from "@supabase/supabase-js"
import { neon } from "@neondatabase/serverless"

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// Configuração do Neon
const sql = neon(process.env.DATABASE_URL!)

export interface UserData {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string
  permissions?: Record<string, boolean>
  is_active?: boolean
}

/**
 * Sincroniza dados do usuário entre Supabase Auth e Neon DB
 */
export class UserSyncService {
  /**
   * Atualiza perfil do usuário no Supabase Auth
   */
  static async updateUserProfile(userId: string, data: Partial<UserData>) {
    try {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          name: data.name,
          role: data.role,
          avatar_url: data.avatar_url,
        },
        email: data.email,
      })

      if (error) throw error

      // Sincronizar com Neon DB
      await this.syncUserToNeon(userId, data)

      return { success: true }
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      throw error
    }
  }

  /**
   * Cria novo usuário no Supabase Auth
   */
  static async createUser(userData: Omit<UserData, "id"> & { password: string }) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        user_metadata: {
          name: userData.name,
          role: userData.role,
          avatar_url: userData.avatar_url,
        },
        email_confirm: true,
      })

      if (error) throw error

      // Sincronizar com Neon DB
      await this.syncUserToNeon(data.user.id, {
        ...userData,
        id: data.user.id,
      })

      return { success: true, user: data.user }
    } catch (error) {
      console.error("Erro ao criar usuário:", error)
      throw error
    }
  }

  /**
   * Remove usuário do Supabase Auth
   */
  static async deleteUser(userId: string) {
    try {
      const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (error) throw error

      // Remover do Neon DB
      await this.removeUserFromNeon(userId)

      return { success: true }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      throw error
    }
  }

  /**
   * Sincroniza dados do usuário com o banco Neon
   */
  private static async syncUserToNeon(userId: string, userData: Partial<UserData>) {
    try {
      // Verificar se usuário já existe
      const existingUser = await sql`
        SELECT id FROM users WHERE id = ${userId}
      `

      if (existingUser.length > 0) {
        // Atualizar usuário existente
        await sql`
          UPDATE users 
          SET 
            name = ${userData.name || ""},
            email = ${userData.email || ""},
            role = ${userData.role || "viewer"},
            avatar_url = ${userData.avatar_url || null},
            permissions = ${JSON.stringify(userData.permissions || {})},
            is_active = ${userData.is_active !== undefined ? userData.is_active : true},
            updated_at = NOW()
          WHERE id = ${userId}
        `
      } else {
        // Criar novo usuário
        await sql`
          INSERT INTO users (id, name, email, role, avatar_url, permissions, is_active, created_at, updated_at)
          VALUES (
            ${userId},
            ${userData.name || ""},
            ${userData.email || ""},
            ${userData.role || "viewer"},
            ${userData.avatar_url || null},
            ${JSON.stringify(userData.permissions || {})},
            ${userData.is_active !== undefined ? userData.is_active : true},
            NOW(),
            NOW()
          )
        `
      }

      return { success: true }
    } catch (error) {
      console.error("Erro ao sincronizar com Neon:", error)
      throw error
    }
  }

  /**
   * Remove usuário do banco Neon
   */
  private static async removeUserFromNeon(userId: string) {
    try {
      await sql`
        DELETE FROM users WHERE id = ${userId}
      `
      return { success: true }
    } catch (error) {
      console.error("Erro ao remover usuário do Neon:", error)
      throw error
    }
  }

  /**
   * Busca dados do usuário no Neon
   */
  static async getUserFromNeon(userId: string) {
    try {
      const user = await sql`
        SELECT * FROM users WHERE id = ${userId}
      `
      return user[0] || null
    } catch (error) {
      console.error("Erro ao buscar usuário no Neon:", error)
      throw error
    }
  }

  /**
   * Lista todos os usuários do Neon
   */
  static async getAllUsersFromNeon() {
    try {
      const users = await sql`
        SELECT * FROM users ORDER BY created_at DESC
      `
      return users
    } catch (error) {
      console.error("Erro ao buscar usuários no Neon:", error)
      throw error
    }
  }
}
