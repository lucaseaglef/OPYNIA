"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, GripVertical, Save, ArrowLeft, Sparkles, Wand2, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { SurveyStorage } from "@/lib/survey-storage"
import { LogoUpload } from "@/components/logo-upload"
import type { Survey, SurveyField } from "@/types/survey"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import Link from "next/link"

const fieldTypes = [
  { value: "text", label: "Texto Curto", icon: "📝", color: "bg-blue-100 text-blue-700" },
  { value: "email", label: "E-mail", icon: "📧", color: "bg-cyan-100 text-cyan-700" },
  { value: "phone", label: "Telefone", icon: "📱", color: "bg-green-100 text-green-700" },
  { value: "currency", label: "Moeda (R$)", icon: "💰", color: "bg-emerald-100 text-emerald-700" },
  { value: "cep", label: "CEP", icon: "📍", color: "bg-amber-100 text-amber-700" },
  { value: "textarea", label: "Texto Longo", icon: "📄", color: "bg-indigo-100 text-indigo-700" },
  { value: "checkbox", label: "Múltipla Escolha", icon: "☑️", color: "bg-green-100 text-green-700" },
  { value: "radio", label: "Escolha Única", icon: "🔘", color: "bg-purple-100 text-purple-700" },
  { value: "dropdown", label: "Menu Suspenso", icon: "📋", color: "bg-pink-100 text-pink-700" },
  { value: "stars", label: "Avaliação Estrelas", icon: "⭐", color: "bg-yellow-100 text-yellow-700" },
  { value: "likert", label: "Escala Likert", icon: "📊", color: "bg-orange-100 text-orange-700" },
  { value: "numeric", label: "Escala Numérica", icon: "🔢", color: "bg-red-100 text-red-700" },
  { value: "ranking", label: "Classificação", icon: "🏆", color: "bg-teal-100 text-teal-700" },
  { value: "datetime", label: "Data e Hora", icon: "📅", color: "bg-cyan-100 text-cyan-700" },
  { value: "file", label: "Upload Arquivo", icon: "📎", color: "bg-gray-100 text-gray-700" },
  { value: "divider", label: "Divisor", icon: "➖", color: "bg-slate-100 text-slate-700" },
]

const likertOptions = ["Discordo Totalmente", "Discordo", "Neutro", "Concordo", "Concordo Totalmente"]

const generateSlug = (title: string) => {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

export default function CreateSurvey() {
  const router = useRouter()
  const [survey, setSurvey] = useState<Partial<Survey>>({
    title: "",
    description: "",
    logo: "",
    fields: [],
    isActive: true,
  })

  // Estado para controlar quais seções estão abertas
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({})

  // Organizar campos em seções
  const organizeFieldsInSections = () => {
    const sections: { title: string; fields: SurveyField[]; id: string }[] = []
    let currentSection = { title: "Campos Gerais", fields: [] as SurveyField[], id: "general" }

    survey.fields?.forEach((field) => {
      if (field.type === "divider") {
        if (currentSection.fields.length > 0) {
          sections.push(currentSection)
        }
        currentSection = {
          title: field.label || "Nova Seção",
          fields: [],
          id: field.id,
        }
      } else {
        currentSection.fields.push(field)
      }
    })

    if (currentSection.fields.length > 0) {
      sections.push(currentSection)
    }

    return sections
  }

  const addField = (type: string) => {
    const newField: SurveyField = {
      id: `field_${Date.now()}`,
      type: type as any,
      label: "",
      required: false,
      ...(type === "stars" && { min: 1, max: 5 }),
      ...(type === "numeric" && { min: 0, max: 10 }),
      ...(type === "likert" && { options: likertOptions }),
      ...(["checkbox", "radio", "dropdown", "ranking"].includes(type) && { options: [""] }),
      ...(type === "email" && { validation: { pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$" } }),
      ...(type === "phone" && {
        validation: { pattern: "^$$[0-9]{2}$$\\s[0-9]{4,5}-[0-9]{4}$", mask: "(99) 99999-9999" },
      }),
      ...(type === "currency" && { validation: { currency: "BRL", min: 0 } }),
      ...(type === "cep" && { validation: { pattern: "^[0-9]{5}-[0-9]{3}$" } }),
    }

    setSurvey((prev) => ({
      ...prev,
      fields: [...(prev.fields || []), newField],
    }))
  }

  const updateField = (fieldId: string, updates: Partial<SurveyField>) => {
    setSurvey((prev) => ({
      ...prev,
      fields: prev.fields?.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
    }))
  }

  const removeField = (fieldId: string) => {
    setSurvey((prev) => ({
      ...prev,
      fields: prev.fields?.filter((field) => field.id !== fieldId),
    }))
  }

  const addOption = (fieldId: string) => {
    updateField(fieldId, {
      options: [...(survey.fields?.find((f) => f.id === fieldId)?.options || []), ""],
    })
  }

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = survey.fields?.find((f) => f.id === fieldId)
    if (field?.options) {
      const newOptions = [...field.options]
      newOptions[optionIndex] = value
      updateField(fieldId, { options: newOptions })
    }
  }

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = survey.fields?.find((f) => f.id === fieldId)
    if (field?.options) {
      const newOptions = field.options.filter((_, index) => index !== optionIndex)
      updateField(fieldId, { options: newOptions })
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(survey.fields || [])
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSurvey((prev) => ({ ...prev, fields: items }))
  }

  const handleLogoChange = (logoData: string | null) => {
    setSurvey((prev) => ({ ...prev, logo: logoData || "" }))
  }

  const saveSurvey = async () => {
    if (!survey.title || !survey.fields?.length) {
      alert("Por favor, preencha o título e adicione pelo menos um campo.")
      return
    }

    const newSurvey: Survey = {
      id: generateSlug(survey.title) || `survey_${Date.now()}`,
      title: survey.title,
      description: survey.description || "",
      logo: survey.logo || "",
      fields: survey.fields,
      createdAt: new Date().toISOString(),
      isActive: survey.isActive || false,
      responses: [],
    }

    try {
      const success = await SurveyStorage.saveSurvey(newSurvey)
      if (success) {
        alert("Pesquisa criada com sucesso!")
        router.push("/")
      } else {
        alert("Erro ao criar pesquisa. Tente novamente.")
      }
    } catch (error) {
      console.error("Error saving survey:", error)
      alert("Erro ao criar pesquisa. Tente novamente.")
    }
  }

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const sections = organizeFieldsInSections()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10"></div>
        <div className="relative border-b border-white/20 backdrop-blur-xl bg-white/80">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/">
                  <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:border-purple-300">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar
                  </Button>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Criar Nova Pesquisa
                  </h1>
                  <p className="text-gray-600 font-medium">Configure sua pesquisa de satisfação</p>
                </div>
              </div>
              <Button
                onClick={saveSurvey}
                size="lg"
                className="gradient-primary text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Save className="w-5 h-5 mr-2" />
                Salvar Pesquisa
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Survey Basic Info */}
        <Card className="glass-card border-0 shadow-xl mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">Informações Básicas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <LogoUpload
              currentLogo={survey.logo}
              onLogoChange={handleLogoChange}
              className="border-t border-gray-200 pt-6"
            />

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold">
                Título da Pesquisa *
              </Label>
              <Input
                id="title"
                value={survey.title}
                onChange={(e) => setSurvey((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Pesquisa de Satisfação - Evento Tech 2024"
                className="text-lg py-3 border-2 focus:border-purple-300 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={survey.description}
                onChange={(e) => setSurvey((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo da pesquisa..."
                className="min-h-[100px] border-2 focus:border-purple-300 transition-colors"
              />
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <Switch
                id="active"
                checked={survey.isActive}
                onCheckedChange={(checked) => setSurvey((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="active" className="text-base font-semibold text-green-800">
                Pesquisa ativa (pode receber respostas)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Field Types */}
        <Card className="glass-card border-0 shadow-xl mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl gradient-secondary flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <CardTitle className="text-xl">Adicionar Campos com Validação</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {fieldTypes.map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  onClick={() => addField(type.value)}
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-purple-300"
                >
                  <span className="text-2xl">{type.icon}</span>
                  <span className="text-sm font-medium text-center">{type.label}</span>
                  <Badge variant="secondary" className={type.color}>
                    {type.value}
                  </Badge>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Seções Organizadas em Accordions */}
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => (
            <Card key={section.id} className="glass-card border-0 shadow-xl">
              <Collapsible open={openSections[section.id] !== false} onOpenChange={() => toggleSection(section.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {sectionIndex + 1}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {section.fields.length} campo{section.fields.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                          {section.fields.length} campos
                        </Badge>
                        {openSections[section.id] !== false ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId={`section-${section.id}`}>
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {section.fields.map((field, fieldIndex) => {
                              const globalIndex = survey.fields?.findIndex((f) => f.id === field.id) || 0
                              return (
                                <Draggable key={field.id} draggableId={field.id} index={globalIndex}>
                                  {(provided) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200"
                                    >
                                      <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                          <div
                                            {...provided.dragHandleProps}
                                            className="cursor-grab active:cursor-grabbing"
                                          >
                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                          </div>
                                          <span className="text-xl">
                                            {fieldTypes.find((t) => t.value === field.type)?.icon}
                                          </span>
                                          <div>
                                            <h4 className="font-medium">
                                              {fieldTypes.find((t) => t.value === field.type)?.label}
                                            </h4>
                                            <Badge variant="secondary" className="text-xs">
                                              Campo #{fieldIndex + 1}
                                            </Badge>
                                          </div>
                                        </div>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => removeField(field.id)}
                                          className="hover:bg-red-50 hover:border-red-300 hover:text-red-600"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>

                                      {field.type !== "divider" && (
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                              <Label className="text-sm font-medium">Título do Campo *</Label>
                                              <Input
                                                value={field.label}
                                                onChange={(e) => updateField(field.id, { label: e.target.value })}
                                                placeholder="Ex: Como você avalia o evento?"
                                                className="mt-1"
                                              />
                                            </div>
                                            <div>
                                              <Label className="text-sm font-medium">Descrição (opcional)</Label>
                                              <Input
                                                value={field.description || ""}
                                                onChange={(e) => updateField(field.id, { description: e.target.value })}
                                                placeholder="Instruções adicionais..."
                                                className="mt-1"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center space-x-2">
                                            <Switch
                                              checked={field.required}
                                              onCheckedChange={(checked) =>
                                                updateField(field.id, { required: checked })
                                              }
                                            />
                                            <Label className="text-sm font-medium">Campo obrigatório</Label>
                                          </div>

                                          {/* Validação específica por tipo */}
                                          {["email", "phone", "currency", "cep"].includes(field.type) && (
                                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                              <div className="flex items-center space-x-2 mb-1">
                                                <span className="text-green-600 font-medium text-sm">
                                                  ✅ Validação Automática
                                                </span>
                                              </div>
                                              <p className="text-xs text-green-700">
                                                {field.type === "email" &&
                                                  "Formato de e-mail será validado automaticamente"}
                                                {field.type === "phone" && "Seleção de país e validação por região"}
                                                {field.type === "currency" && "Formato R$ 1.234,56 será aplicado"}
                                                {field.type === "cep" && "Máscara 12345-678 será aplicada"}
                                              </p>
                                            </div>
                                          )}

                                          {/* Opções para campos de múltipla escolha */}
                                          {["checkbox", "radio", "dropdown", "ranking"].includes(field.type) && (
                                            <div className="space-y-2">
                                              <Label className="text-sm font-medium">Opções</Label>
                                              <div className="space-y-2">
                                                {field.options?.map((option, optionIndex) => (
                                                  <div key={optionIndex} className="flex space-x-2">
                                                    <Input
                                                      value={option}
                                                      onChange={(e) =>
                                                        updateOption(field.id, optionIndex, e.target.value)
                                                      }
                                                      placeholder={`Opção ${optionIndex + 1}`}
                                                      className="flex-1"
                                                    />
                                                    <Button
                                                      variant="outline"
                                                      size="sm"
                                                      onClick={() => removeOption(field.id, optionIndex)}
                                                      className="hover:bg-red-50"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                  </div>
                                                ))}
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => addOption(field.id)}
                                                  className="hover:bg-green-50"
                                                >
                                                  <Plus className="w-4 h-4 mr-2" />
                                                  Adicionar Opção
                                                </Button>
                                              </div>
                                            </div>
                                          )}

                                          {/* Configurações para estrelas */}
                                          {field.type === "stars" && (
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-sm font-medium">Mínimo de Estrelas</Label>
                                                <Input
                                                  type="number"
                                                  value={field.min || 1}
                                                  onChange={(e) =>
                                                    updateField(field.id, { min: Number.parseInt(e.target.value) })
                                                  }
                                                  min="1"
                                                  max="10"
                                                  className="mt-1"
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium">Máximo de Estrelas</Label>
                                                <Input
                                                  type="number"
                                                  value={field.max || 5}
                                                  onChange={(e) =>
                                                    updateField(field.id, { max: Number.parseInt(e.target.value) })
                                                  }
                                                  min="1"
                                                  max="10"
                                                  className="mt-1"
                                                />
                                              </div>
                                            </div>
                                          )}

                                          {/* Configurações para escala numérica */}
                                          {field.type === "numeric" && (
                                            <div className="grid grid-cols-2 gap-4">
                                              <div>
                                                <Label className="text-sm font-medium">Valor Mínimo</Label>
                                                <Input
                                                  type="number"
                                                  value={field.min || 0}
                                                  onChange={(e) =>
                                                    updateField(field.id, { min: Number.parseInt(e.target.value) })
                                                  }
                                                  className="mt-1"
                                                />
                                              </div>
                                              <div>
                                                <Label className="text-sm font-medium">Valor Máximo</Label>
                                                <Input
                                                  type="number"
                                                  value={field.max || 10}
                                                  onChange={(e) =>
                                                    updateField(field.id, { max: Number.parseInt(e.target.value) })
                                                  }
                                                  className="mt-1"
                                                />
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      {/* Configuração para divisor */}
                                      {field.type === "divider" && (
                                        <div>
                                          <Label className="text-sm font-medium">Título da Seção</Label>
                                          <Input
                                            value={field.label}
                                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                                            placeholder="Ex: 🧾 Informações Pessoais"
                                            className="mt-1"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              )
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {survey.fields?.length === 0 && (
          <Card className="glass-card border-0 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mb-6 animate-pulse-slow">
                <Plus className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Adicione campos à sua pesquisa</h3>
              <p className="text-gray-600 text-center max-w-md">
                Use os botões acima para adicionar diferentes tipos de campos com validação automática à sua pesquisa
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
