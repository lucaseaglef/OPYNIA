"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, User, Mail, Shield, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

export default function UsersManagement() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [showPassword, setShowPassword] = useState(false)
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

  const supabase = useSupabase()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
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
        {
          id: "3",
          name: "Pedro Costa",
          email: "pedro@empresa.com",
          role: "editor",
          permissions: {
            createSurveys: true,
            editSurveys: true,
            deleteSurveys: false,
            viewResponses: true,
            exportData: false,
            manageUsers: false,
          },
          createdAt: "2024-01-17T11:00:00Z",
          isActive: false,
        },
      ]
      setUsers(mockUsers)
    } catch (error) {
      console.error("Erro ao carregar usuários:", error)
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
      } else {
        // Criar novo usuário
        const newUser: AdminUser = {
          id: Date.now().toString(),
          name: formData.name,
          email: formData.email,
          role: formData.role,
          permissions: formData.permissions,
          createdAt: new Date().toISOString(),
          isActive: formData.isActive,
        }
        setUsers([...users, newUser])
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
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  const toggleUserStatus = async (userId: string) => {
    const updatedUsers = users.map((user) => (user.id === userId ? { ...user, isActive: !user.isActive } : user))
    setUsers(updatedUsers)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121826] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-700 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-300 font-medium">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#121826] text-gray-100">
      <FloatingMenu />

      <div className="pt-24 md:pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
                Gerenciamento de Usuários
              </h1>
              <p className="text-sm text-gray-400 mt-1">Gerencie usuários administrativos e suas permissões</p>
            </div>
          </div>

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
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="bg-[#1e293b] border-gray-600 pr-10"
                        required
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
                      <SelectItem value="super_admin">Super Admin</SelectItem>
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
                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                    {editingUser ? "Atualizar" : "Criar"} Usuário
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#1e293b] border-t border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{users.length}</p>
                  <p className="text-sm text-gray-400">Total de Usuários</p>
                </div>
                <User className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-t border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{users.filter((u) => u.isActive).length}</p>
                  <p className="text-sm text-gray-400">Usuários Ativos</p>
                </div>
                <Shield className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-t border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">{users.filter((u) => u.role === "admin").length}</p>
                  <p className="text-sm text-gray-400">Administradores</p>
                </div>
                <Mail className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1e293b] border-t border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-white">
                    {
                      users.filter(
                        (u) => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                      ).length
                    }
                  </p>
                  <p className="text-sm text-gray-400">Ativos (7 dias)</p>
                </div>
                <User className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card className="bg-[#1a2332] border border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
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
                    <Badge className={user.isActive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                      {user.isActive ? "Ativo" : "Inativo"}
                    </Badge>

                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleUserStatus(user.id)}
                        className={
                          user.isActive ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"
                        }
                      >
                        {user.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
