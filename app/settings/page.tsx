"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  ArrowLeft,
  User,
  Camera,
  Save,
  Users,
  Bell,
  Palette,
  Globe,
  Eye,
  EyeOff,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Navbar } from "@/components/navbar"
import Link from "next/link"
import { useSupabase } from "@/hooks/useSupabase"

interface AdminUser {
  id: string
  name: string
  email: string
  role: "super_admin" | "admin" | "editor" | "viewer"
  permissions: {
    createSurveys: boolean
    editSurveys: boolean
    deleteSurveys: boolean
    viewResponses: boolean
    exportData: boolean
    manageUsers: boolean
  }
  createdAt: string
  lastLogin?: string
  isActive: boolean
}

const roleLabels = {
  super_admin: "Super Admin",
  admin: "Administrador",
  editor: "Editor",
  viewer: "Visualizador",
}

const roleColors = {
  super_admin: "bg-red-500/20 text-red-400 border-red-500/30",
  admin: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  editor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
}

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = useState({
    name: "João Silva",
    email: "joao@empresa.com",
    role: "admin" as AdminUser["role"],
    avatar: "",
  })
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "viewer" as AdminUser["role"],
    permissions: {
      createSurveys: false,
      editSurveys: false,
      deleteSurveys: false,
      viewResponses: false,
      exportData: false,
      manageUsers: false,
    },
    isActive: true,
  })
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: false,
      weeklyReports: true,
    },
    appearance: {
      theme: "dark",
      language: "pt-BR",
    },
    privacy: {
      profileVisibility: "team",
      dataSharing: false,
    },
  })

  const supabase = useSupabase()

  useEffect(() => {
    loadUsers()
    loadCurrentUser()
  }, [])

  const loadCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const userData = {
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
          email: user.email || "",
          role: "admin" as AdminUser["role"],
          avatar: user.user_metadata?.avatar_url || "",
        }
        setCurrentUser(userData)
        setProfileData({
          name: userData.name,
          email: userData.email,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      }
    } catch (error) {
      console.error("Erro ao carregar usuário atual:", error)
    }
  }

  const loadUsers = async () => {
    try {
      // Simular dados para demonstração
      const mockUsers: AdminUser[] = [
        {
          id: "1",
          name: "João Silva",
          email: "joao@empresa.com",
          role: "super_admin",
          permissions: {
            createSurveys: true,
            editSurveys: true,
            deleteSurveys: true,
            viewResponses: true,
            exportData: true,
            manageUsers: true,
          },
          createdAt: "2024-01-15T10:00:00Z",
          lastLogin: "2024-01-20T14:30:00Z",
          isActive: true,
        },
        {
          id: "2",
          name: "Maria Santos",
          email: "maria@empresa.com",
          role: "admin",
          permissions: {
            createSurveys: true,
            editSurveys: true,
            deleteSurveys: false,
            viewResponses: true,
            exportData: true,
            manageUsers: false,
          },
          createdAt: "2024-01-16T09:00:00Z",
          lastLogin: "2024-01-19T16:45:00Z",
          isActive: true,
        },
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setUpdateStatus(null)

      // Validações
      if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
        setUpdateStatus({ type: "error", message: "As senhas não coincidem" })
        return
      }

      // Atualizar perfil no Supabase Auth
      const updates: any = {}

      if (profileData.name !== currentUser.name) {
        updates.data = { name: profileData.name }
      }

      if (profileData.email !== currentUser.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email,
        })
        if (emailError) throw emailError
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase.auth.updateUser(updates)
        if (updateError) throw updateError
      }

      // Atualizar senha se fornecida
      if (profileData.newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: profileData.newPassword,
        })
        if (passwordError) throw passwordError
      }

      // TODO: Aqui você pode adicionar a sincronização com o banco Neon
      // Exemplo:
      // await updateUserInNeonDB({
      //   id: currentUser.id,
      //   name: profileData.name,
      //   email: profileData.email
      // })

      setCurrentUser({
        ...currentUser,
        name: profileData.name,
        email: profileData.email,
      })

      setProfileData({
        ...profileData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })

      setUpdateStatus({ type: "success", message: "Perfil atualizado com sucesso!" })
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error)
      setUpdateStatus({ type: "error", message: error.message || "Erro ao atualizar perfil" })
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (role: AdminUser["role"]) => {
    const defaultPermissions = {
      super_admin: {
        createSurveys: true,
        editSurveys: true,
        deleteSurveys: true,
        viewResponses: true,
        exportData: true,
        manageUsers: true,
      },
      admin: {
        createSurveys: true,
        editSurveys: true,
        deleteSurveys: false,
        viewResponses: true,
        exportData: true,
        manageUsers: false,
      },
      editor: {
        createSurveys: true,
        editSurveys: true,
        deleteSurveys: false,
        viewResponses: true,
        exportData: false,
        manageUsers: false,
      },
      viewer: {
        createSurveys: false,
        editSurveys: false,
        deleteSurveys: false,
        viewResponses: true,
        exportData: false,
        manageUsers: false,
      },
    }

    setFormData({
      ...formData,
      role,
      permissions: defaultPermissions[role],
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)

      if (editingUser) {
        // Atualizar usuário existente
        const updatedUsers = users.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                permissions: formData.permissions,
                isActive: formData.isActive,
              }
            : user,
        )
        setUsers(updatedUsers)

        // TODO: Sincronizar com Supabase Auth e Neon DB
        // await updateUserInSupabase(editingUser.id, formData)
        // await updateUserInNeonDB(editingUser.id, formData)
      } else {
        // Criar novo usuário
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          user_metadata: {
            name: formData.name,
            role: formData.role,
          },
        })

        if (authError) throw authError

        const newUser: AdminUser = {
          id: authData.user.id,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions,
          createdAt: new Date().toISOString(),
          isActive: formData.isActive,
        }
        setUsers([...users, newUser])

        // TODO: Adicionar ao banco Neon
        // await createUserInNeonDB(newUser)
      }

      setFormData({
        name: "",
        email: "",
        password: "",
        role: "viewer",
        permissions: {
          createSurveys: false,
          editSurveys: false,
          deleteSurveys: false,
          viewResponses: false,
          exportData: false,
          manageUsers: false,
        },
        isActive: true,
      })
      setEditingUser(null)
      setIsDialogOpen(false)
      setUpdateStatus({ type: "success", message: "Usuário salvo com sucesso!" })
    } catch (error: any) {
      console.error("Erro ao salvar usuário:", error)
      setUpdateStatus({ type: "error", message: error.message || "Erro ao salvar usuário" })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (userId: string) => {
    if (confirm("Tem certeza que deseja excluir este usuário?")) {
      try {
        // TODO: Remover do Supabase Auth e Neon DB
        // await supabase.auth.admin.deleteUser(userId)
        // await deleteUserFromNeonDB(userId)

        setUsers(users.filter((user) => user.id !== userId))
        setUpdateStatus({ type: "success", message: "Usuário excluído com sucesso!" })
      } catch (error: any) {
        console.error("Erro ao excluir usuário:", error)
        setUpdateStatus({ type: "error", message: error.message || "Erro ao excluir usuário" })
      }
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const avatarUrl = e.target?.result as string
        setCurrentUser({
          ...currentUser,
          avatar: avatarUrl,
        })

        // TODO: Upload para Supabase Storage e atualizar perfil
        // const { data, error } = await supabase.storage
        //   .from('avatars')
        //   .upload(`${currentUser.id}/avatar.jpg`, file)
        //
        // if (!error) {
        //   await supabase.auth.updateUser({
        //     data: { avatar_url: data.path }
        //   })
        // }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-[#121826] text-gray-100">
      <Navbar />

      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header com espaçamento adequado */}
        <div className="flex items-center space-x-4 mb-8 mt-6">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-gray-400 mt-1">Gerencie seu perfil e configurações da plataforma</p>
          </div>
        </div>

        {/* Status de atualização */}
        {updateStatus && (
          <Alert
            className={`mb-6 ${updateStatus.type === "success" ? "border-green-500/50 bg-green-500/10" : "border-red-500/50 bg-red-500/10"}`}
          >
            {updateStatus.type === "success" ? (
              <CheckCircle className="h-4 w-4 text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400" />
            )}
            <AlertDescription className={updateStatus.type === "success" ? "text-green-400" : "text-red-400"}>
              {updateStatus.message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-8">
          <TabsList className="bg-[#1a2332]/80 backdrop-blur-sm rounded-xl p-2 border border-gray-700/30 inline-flex shadow-lg">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-400 hover:text-white transition-all px-6 py-3 rounded-lg font-medium"
            >
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            {(currentUser.role === "admin" || currentUser.role === "super_admin") && (
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-400 hover:text-white transition-all px-6 py-3 rounded-lg font-medium"
              >
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </TabsTrigger>
            )}
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-400 hover:text-white transition-all px-6 py-3 rounded-lg font-medium"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md text-gray-400 hover:text-white transition-all px-6 py-3 rounded-lg font-medium"
            >
              <Palette className="w-4 h-4 mr-2" />
              Aparência
            </TabsTrigger>
          </TabsList>

          {/* Perfil */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Informações do Perfil */}
              <div className="lg:col-span-2">
                <Card className="bg-[#1a2332]/80 backdrop-blur-sm border-gray-700/30 shadow-xl">
                  <CardHeader className="pb-6">
                    <CardTitle className="text-white flex items-center text-xl">
                      <User className="w-5 h-5 mr-3 text-orange-400" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <form onSubmit={handleProfileUpdate} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                            Nome Completo
                          </Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="bg-[#1e293b]/80 border-gray-600/50 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                            Email
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="bg-[#1e293b]/80 border-gray-600/50 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                          />
                        </div>
                      </div>

                      {/* Seção de Senha em linha única */}
                      <div className="space-y-6">
                        <div className="border-t border-gray-700/50 pt-6">
                          <h3 className="text-base font-medium text-white mb-6">Alterar Senha</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-300">
                                Senha Atual
                              </Label>
                              <div className="relative">
                                <Input
                                  id="currentPassword"
                                  type={showPassword ? "text" : "password"}
                                  value={profileData.currentPassword}
                                  onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                                  className="bg-[#1e293b]/80 border-gray-600/50 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 h-11 pr-12"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-gray-400 hover:text-white"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="newPassword" className="text-sm font-medium text-gray-300">
                                Nova Senha
                              </Label>
                              <Input
                                id="newPassword"
                                type="password"
                                value={profileData.newPassword}
                                onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                                className="bg-[#1e293b]/80 border-gray-600/50 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                              />
                            </div>

                            <div className="space-y-3">
                              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                                Confirmar Senha
                              </Label>
                              <Input
                                id="confirmPassword"
                                type="password"
                                value={profileData.confirmPassword}
                                onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                                className="bg-[#1e293b]/80 border-gray-600/50 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/20 h-11"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-700/50">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {loading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar com Avatar e Informações da Conta */}
              <div className="space-y-6">
                {/* Avatar */}
                <Card className="bg-[#1a2332]/80 backdrop-blur-sm border-gray-700/30 shadow-xl border-l-4 border-l-orange-500">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg">Foto do Perfil</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center space-y-6">
                    <div className="relative inline-block">
                      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center mx-auto overflow-hidden border-4 border-orange-500/20">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar || "/placeholder.svg"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-14 h-14 text-orange-400" />
                        )}
                      </div>
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="absolute -bottom-1 -right-1 w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg">
                          <Camera className="w-5 h-5 text-white" />
                        </div>
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-400">Clique no ícone para alterar</p>
                  </CardContent>
                </Card>

                {/* Informações da Conta */}
                <Card className="bg-[#1a2332]/80 backdrop-blur-sm border-gray-700/30 shadow-xl border-l-4 border-l-orange-500">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-white text-lg">Informações da Conta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-sm">Função:</span>
                      <Badge className={`${roleColors[currentUser.role]} font-medium`}>
                        {roleLabels[currentUser.role]}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-sm">Status:</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 font-medium">Ativo</Badge>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-400 text-sm">Membro desde:</span>
                      <span className="text-white text-sm font-medium">Jan 2024</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Usuários (apenas para admins) */}
          {(currentUser.role === "admin" || currentUser.role === "super_admin") && (
            <TabsContent value="users">
              <Card className="bg-[#1a2332]/80 backdrop-blur-sm border-gray-700/30 shadow-xl">
                <CardHeader className="pb-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center text-xl">
                      <Users className="w-5 h-5 mr-3 text-orange-400" />
                      Gerenciamento de Usuários
                    </CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
                          <Plus className="w-4 h-4 mr-2" />
                          Novo Usuário
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1a2332] border-gray-700 text-white max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-xl font-bold">
                            {editingUser ? "Editar Usuário" : "Novo Usuário"}
                          </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Nome Completo</Label>
                              <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="bg-[#1e293b] border-gray-600"
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="email">Email</Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="bg-[#1e293b] border-gray-600"
                                required
                              />
                            </div>
                          </div>

                          {!editingUser && (
                            <div className="space-y-2">
                              <Label htmlFor="password">Senha</Label>
                              <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="bg-[#1e293b] border-gray-600"
                                required
                              />
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label htmlFor="role">Função</Label>
                            <Select value={formData.role} onValueChange={handleRoleChange}>
                              <SelectTrigger className="bg-[#1e293b] border-gray-600">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1e293b] border-gray-600">
                                <SelectItem value="viewer">Visualizador</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                                {currentUser.role === "super_admin" && (
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-4">
                            <Label>Permissões</Label>
                            <div className="grid grid-cols-2 gap-4">
                              {Object.entries(formData.permissions).map(([key, value]) => (
                                <div key={key} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={key}
                                    checked={value}
                                    onCheckedChange={(checked) =>
                                      setFormData({
                                        ...formData,
                                        permissions: {
                                          ...formData.permissions,
                                          [key]: checked as boolean,
                                        },
                                      })
                                    }
                                  />
                                  <Label htmlFor={key} className="text-sm">
                                    {key === "createSurveys" && "Criar Pesquisas"}
                                    {key === "editSurveys" && "Editar Pesquisas"}
                                    {key === "deleteSurveys" && "Excluir Pesquisas"}
                                    {key === "viewResponses" && "Ver Respostas"}
                                    {key === "exportData" && "Exportar Dados"}
                                    {key === "manageUsers" && "Gerenciar Usuários"}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="isActive"
                              checked={formData.isActive}
                              onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked as boolean })}
                            />
                            <Label htmlFor="isActive">Usuário ativo</Label>
                          </div>

                          <div className="flex justify-end space-x-3">
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setIsDialogOpen(false)
                                setEditingUser(null)
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={loading}>
                              {loading ? "Salvando..." : editingUser ? "Atualizar" : "Criar"} Usuário
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-6 bg-[#1e293b]/60 rounded-lg border border-gray-700/30 hover:bg-[#1e293b]/80 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                          <User className="h-6 w-6 text-orange-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{user.name}</h3>
                          <p className="text-sm text-gray-400">{user.email}</p>
                          {user.lastLogin && (
                            <p className="text-xs text-gray-500">
                              Último login: {new Date(user.lastLogin).toLocaleString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <Badge className={roleColors[user.role]}>{roleLabels[user.role]}</Badge>
                        <Badge
                          className={user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}
                        >
                          {user.isActive ? "Ativo" : "Inativo"}
                        </Badge>

                        <div className="flex space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Notificações */}
          <TabsContent value="notifications">
            <Card className="bg-[#1a2332]/80 backdrop-blur-sm border-gray-700/30 shadow-xl">
              <CardHeader className="pb-6">
                <CardTitle className="text-white flex items-center text-xl">
                  <Bell className="w-5 h-5 mr-3 text-orange-400" />
                  Preferências de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="flex items-center justify-between py-4 border-b border-gray-700/30">
                  <div>
                    <h3 className="text-white font-medium">Notificações por Email</h3>
                    <p className="text-sm text-gray-400 mt-1">Receba atualizações importantes por email</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, emailNotifications: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-b border-gray-700/30">
                  <div>
                    <h3 className="text-white font-medium">Notificações Push</h3>
                    <p className="text-sm text-gray-400 mt-1">Receba notificações no navegador</p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, pushNotifications: checked },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h3 className="text-white font-medium">Relatórios Semanais</h3>
                    <p className="text-sm text-gray-400 mt-1">Receba um resumo semanal das suas pesquisas</p>
                  </div>
                  <Switch
                    checked={settings.notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, weeklyReports: checked },
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aparência */}
          <TabsContent value="appearance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="bg-[#1a2332]/80 backdrop-blur-sm border-gray-700/30 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center text-lg">
                    <Palette className="w-5 h-5 mr-3 text-orange-400" />
                    Tema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={settings.appearance.theme}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, theme: value },
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#1e293b]/80 border-gray-600/50 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-gray-600">
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="auto">Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card className="bg-[#1a2332]/80 backdrop-blur-sm border-gray-700/30 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-white flex items-center text-lg">
                    <Globe className="w-5 h-5 mr-3 text-orange-400" />
                    Idioma
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select
                    value={settings.appearance.language}
                    onValueChange={(value) =>
                      setSettings({
                        ...settings,
                        appearance: { ...settings.appearance, language: value },
                      })
                    }
                  >
                    <SelectTrigger className="bg-[#1e293b]/80 border-gray-600/50 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-gray-600">
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
