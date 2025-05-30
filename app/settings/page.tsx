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
import { FloatingMenu } from "@/components/floating-menu"
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
        setCurrentUser({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
          email: user.email || "",
          role: "admin",
          avatar: user.user_metadata?.avatar_url || "",
        })
        setProfileData({
          name: user.user_metadata?.name || user.email?.split("@")[0] || "Usuário",
          email: user.email || "",
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
      setLoading(true)
      const response = await fetch('/api/users')
      const data = await response.json()
      
      if (response.ok) {
        setUsers(data.users || [])
        console.log(`✅ ${data.users?.length || 0} usuários carregados`)
      } else {
        console.error("Erro ao carregar usuários:", data.error)
        alert(`Erro ao carregar usuários: ${data.error}`)
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
      alert("Erro ao carregar usuários. Verifique sua conexão.")
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      // Aqui você implementaria a atualização do perfil
      setCurrentUser({
        ...currentUser,
        name: profileData.name,
        email: profileData.email,
      })
      alert("Perfil atualizado com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error)
      alert("Erro ao atualizar perfil. Tente novamente.")
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
        const response = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            permissions: formData.permissions,
            isActive: formData.isActive,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          console.log(`✅ Usuário ${editingUser.id} atualizado`)
          alert("Usuário atualizado com sucesso!")
          await loadUsers() // Recarregar lista
        } else {
          console.error("Erro ao atualizar usuário:", data.error)
          alert(`Erro ao atualizar usuário: ${data.error}`)
        }
      } else {
        // Criar novo usuário
        if (!formData.password) {
          alert("Senha é obrigatória para novos usuários")
          return
        }

        const response = await fetch('/api/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            role: formData.role,
            permissions: formData.permissions,
            isActive: formData.isActive,
          }),
        })

        const data = await response.json()

        if (response.ok) {
          console.log(`✅ Usuário ${data.user.email} criado`)
          alert("Usuário criado com sucesso!")
          await loadUsers() // Recarregar lista
        } else {
          console.error("Erro ao criar usuário:", data.error)
          alert(`Erro ao criar usuário: ${data.error}`)
        }
      }

      // Resetar formulário
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
    } catch (error) {
      console.error("Erro ao salvar usuário:", error)
      alert("Erro ao salvar usuário. Tente novamente.")
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
    if (!confirm("Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.")) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        console.log(`✅ Usuário ${userId} deletado`)
        alert("Usuário deletado com sucesso!")
        await loadUsers() // Recarregar lista
      } else {
        console.error("Erro ao deletar usuário:", data.error)
        alert(`Erro ao deletar usuário: ${data.error}`)
      }
    } catch (error) {
      console.error("Erro ao deletar usuário:", error)
      alert("Erro ao deletar usuário. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setCurrentUser({
          ...currentUser,
          avatar: e.target?.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-[#121826] text-gray-100">
      <FloatingMenu />

      <div className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Configurações
            </h1>
            <p className="text-sm text-gray-400 mt-1">Gerencie seu perfil e configurações da plataforma</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-[#1a2332] rounded-xl p-2 border border-gray-700/50 inline-flex">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
            >
              <User className="w-4 h-4 mr-2" />
              Perfil
            </TabsTrigger>
            {(currentUser.role === "admin" || currentUser.role === "super_admin") && (
              <TabsTrigger
                value="users"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Usuários
              </TabsTrigger>
            )}
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notificações
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400 hover:text-white transition-colors px-6 py-2 rounded-lg"
            >
              <Palette className="w-4 h-4 mr-2" />
              Aparência
            </TabsTrigger>
          </TabsList>

          {/* Perfil */}
          <TabsContent value="profile">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Informações do Perfil */}
              <div className="lg:col-span-2">
                <Card className="bg-[#1a2332] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <User className="w-5 h-5 mr-2 text-orange-400" />
                      Informações Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome Completo</Label>
                          <Input
                            id="name"
                            value={profileData.name}
                            onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                            className="bg-[#1e293b] border-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="bg-[#1e293b] border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Alterar Senha</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Senha Atual</Label>
                            <div className="relative">
                              <Input
                                id="currentPassword"
                                type={showPassword ? "text" : "password"}
                                value={profileData.currentPassword}
                                onChange={(e) => setProfileData({ ...profileData, currentPassword: e.target.value })}
                                className="bg-[#1e293b] border-gray-600 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="newPassword">Nova Senha</Label>
                            <Input
                              id="newPassword"
                              type="password"
                              value={profileData.newPassword}
                              onChange={(e) => setProfileData({ ...profileData, newPassword: e.target.value })}
                              className="bg-[#1e293b] border-gray-600"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                            <Input
                              id="confirmPassword"
                              type="password"
                              value={profileData.confirmPassword}
                              onChange={(e) => setProfileData({ ...profileData, confirmPassword: e.target.value })}
                              className="bg-[#1e293b] border-gray-600"
                            />
                          </div>
                        </div>
                      </div>

                      <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Salvando..." : "Salvar Alterações"}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Avatar e Informações da Conta */}
              <div className="space-y-6">
                <Card className="bg-[#1a2332] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Foto do Perfil</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
                        {currentUser.avatar ? (
                          <img
                            src={currentUser.avatar || "/placeholder.svg"}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-12 h-12 text-orange-400" />
                        )}
                      </div>
                      <label htmlFor="avatar-upload" className="cursor-pointer">
                        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors">
                          <Camera className="w-4 h-4 text-white" />
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
                    <p className="text-sm text-gray-400">Clique no ícone para alterar sua foto</p>
                  </CardContent>
                </Card>

                <Card className="bg-[#1a2332] border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Informações da Conta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Função:</span>
                      <Badge className={roleColors[currentUser.role]}>{roleLabels[currentUser.role]}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Status:</span>
                      <Badge className="bg-green-500/20 text-green-400">Ativo</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Membro desde:</span>
                      <span className="text-white">Jan 2024</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Usuários (apenas para admins) */}
          {(currentUser.role === "admin" || currentUser.role === "super_admin") && (
            <TabsContent value="users">
              <Card className="bg-[#1a2332] border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center">
                      <Users className="w-5 h-5 mr-2 text-orange-400" />
                      Gerenciamento de Usuários
                    </CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
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
                              disabled={loading}
                            >
                              Cancelar
                            </Button>
                            <Button 
                              type="submit" 
                              className="bg-orange-500 hover:bg-orange-600"
                              disabled={loading}
                            >
                              {loading ? "Salvando..." : (editingUser ? "Atualizar" : "Criar")} Usuário
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                      <span className="ml-2 text-gray-400">Carregando usuários...</span>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum usuário encontrado</p>
                      <p className="text-sm">Clique em "Novo Usuário" para adicionar o primeiro usuário</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-[#1e293b] rounded-lg border border-gray-700/50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                              <User className="h-5 w-5 text-orange-400" />
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
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEdit(user)}
                                disabled={loading}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(user.id)}
                                className="text-red-400 hover:text-red-300"
                                disabled={loading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Notificações */}
          <TabsContent value="notifications">
            <Card className="bg-[#1a2332] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-orange-400" />
                  Preferências de Notificação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Notificações por Email</h3>
                    <p className="text-sm text-gray-400">Receba atualizações importantes por email</p>
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

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Notificações Push</h3>
                    <p className="text-sm text-gray-400">Receba notificações no navegador</p>
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

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Relatórios Semanais</h3>
                    <p className="text-sm text-gray-400">Receba um resumo semanal das suas pesquisas</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#1a2332] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-orange-400" />
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
                    <SelectTrigger className="bg-[#1e293b] border-gray-600">
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

              <Card className="bg-[#1a2332] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <Globe className="w-5 h-5 mr-2 text-orange-400" />
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
                    <SelectTrigger className="bg-[#1e293b] border-gray-600">
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
