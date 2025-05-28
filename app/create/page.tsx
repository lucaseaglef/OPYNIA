"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, GripVertical, Save, ArrowLeft, Settings, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SurveyStorage } from "@/lib/survey-storage"
import type { Survey, SurveyField } from "@/types/survey"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import Link from "next/link"

const fieldTypes = [
  {
    value: "text",
    label: "Texto Curto",
    icon: "📝",
    color: "bg-orange-100 text-orange-700",
    description: "Campo de texto simples",
  },
  {
    value: "email",
    label: "E-mail",
    icon: "📧",
    color: "bg-orange-100 text-orange-700",
    description: "Validação automática de email",
  },
  {
    value: "phone",
    label: "Telefone",
    icon: "📱",
    color: "bg-orange-100 text-orange-700",
    description: "Máscara de telefone brasileiro",
  },
  {
    value: "currency",
    label: "Moeda",
    icon: "💰",
    color: "bg-orange-100 text-orange-700",
    description: "Formato R$ 1.234,56",
  },
  { value: "cep", label: "CEP", icon: "📍", color: "bg-orange-100 text-orange-700", description: "Máscara 12345-678" },
  {
    value: "textarea",
    label: "Texto Longo",
    icon: "📄",
    color: "bg-orange-100 text-orange-700",
    description: "Área de texto expandida",
  },
  {
    value: "checkbox",
    label: "Múltipla Escolha",
    icon: "☑️",
    color: "bg-orange-100 text-orange-700",
    description: "Várias opções selecionáveis",
  },
  {
    value: "radio",
    label: "Escolha Única",
    icon: "🔘",
    color: "bg-orange-100 text-orange-700",
    description: "Uma opção por vez",
  },
  {
    value: "dropdown",
    label: "Menu Suspenso",
    icon: "📋",
    color: "bg-orange-100 text-orange-700",
    description: "Lista de opções",
  },
  {
    value: "stars",
    label: "Avaliação",
    icon: "⭐",
    color: "bg-orange-100 text-orange-700",
    description: "Sistema de estrelas",
  },
  {
    value: "likert",
    label: "Escala Likert",
    icon: "📊",
    color: "bg-orange-100 text-orange-700",
    description: "Concordo/Discordo",
  },
  {
    value: "numeric",
    label: "Escala Numérica",
    icon: "🔢",
    color: "bg-orange-100 text-orange-700",
    description: "Avaliação de 0-10",
  },
  {
    value: "ranking",
    label: "Classificação",
    icon: "🏆",
    color: "bg-orange-100 text-orange-700",
    description: "Ordenar por preferência",
  },
  {
    value: "datetime",
    label: "Data e Hora",
    icon: "📅",
    color: "bg-orange-100 text-orange-700",
    description: "Seletor de data/hora",
  },
  {
    value: "file",
    label: "Upload",
    icon: "📎",
    color: "bg-orange-100 text-orange-700",
    description: "Envio de arquivos",
  },
  {
    value: "divider",
    label: "Divisor",
    icon: "➖",
    color: "bg-orange-100 text-orange-700",
    description: "Separador de seções",
  },
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
  const [selectedField, setSelectedField] = useState<string | null>(null)

  const addField = (type: string) => {
    const newField: SurveyField = {
      id: `field_${Date.now()}`,
      type: type as any,
      label: `Novo ${fieldTypes.find((t) => t.value === type)?.label}`,
      required: false,
      ...(type === "stars" && { min: 1, max: 5 }),
      ...(type === "numeric" && { min: 0, max: 10 }),
      ...(type === "likert" && { options: likertOptions }),
      ...(["checkbox", "radio", "dropdown", "ranking"].includes(type) && { options: ["Opção 1", "Opção 2"] }),
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

    setSelectedField(newField.id)
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

    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }

  const duplicateField = (fieldId: string) => {
    const fieldToDuplicate = survey.fields?.find((f) => f.id === fieldId)
    if (!fieldToDuplicate) return

    const newField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      label: `${fieldToDuplicate.label} (Cópia)`,
    }

    const fieldIndex = survey.fields?.findIndex((f) => f.id === fieldId) || 0
    const newFields = [...(survey.fields || [])]
    newFields.splice(fieldIndex + 1, 0, newField)

    setSurvey((prev) => ({
      ...prev,
      fields: newFields,
    }))
  }

  const addOption = (fieldId: string) => {
    const field = survey.fields?.find((f) => f.id === fieldId)
    if (!field) return

    updateField(fieldId, {
      options: [...(field.options || []), `Opção ${(field.options?.length || 0) + 1}`],
    })
  }

  const updateOption = (fieldId: string, optionIndex: number, value: string) => {
    const field = survey.fields?.find((f) => f.id === fieldId)
    if (!field?.options) return

    const newOptions = [...field.options]
    newOptions[optionIndex] = value
    updateField(fieldId, { options: newOptions })
  }

  const removeOption = (fieldId: string, optionIndex: number) => {
    const field = survey.fields?.find((f) => f.id === fieldId)
    if (!field?.options) return

    const newOptions = field.options.filter((_, index) => index !== optionIndex)
    updateField(fieldId, { options: newOptions })
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(survey.fields || [])
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setSurvey((prev) => ({ ...prev, fields: items }))
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

  const renderFieldPreview = (field: SurveyField) => {
    const fieldType = fieldTypes.find((t) => t.value === field.type)

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-300">
            {field.label || "Campo sem título"}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </Label>
          <span className="text-xs text-gray-500">{fieldType?.icon}</span>
        </div>

        {field.description && <p className="text-xs text-gray-400">{field.description}</p>}

        <div className="bg-[#2a3548] rounded p-3 border border-gray-600">
          {field.type === "text" && (
            <Input placeholder="Digite aqui..." className="bg-transparent border-gray-500" disabled />
          )}
          {field.type === "textarea" && (
            <Textarea placeholder="Digite sua resposta..." className="bg-transparent border-gray-500" disabled />
          )}
          {field.type === "email" && (
            <Input type="email" placeholder="seu@email.com" className="bg-transparent border-gray-500" disabled />
          )}
          {field.type === "phone" && (
            <Input placeholder="(11) 99999-9999" className="bg-transparent border-gray-500" disabled />
          )}
          {["radio", "checkbox"].includes(field.type) && (
            <div className="space-y-2">
              {field.options?.slice(0, 3).map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <input type={field.type} disabled className="text-orange-500" />
                  <span className="text-sm text-gray-300">{option}</span>
                </div>
              ))}
              {(field.options?.length || 0) > 3 && (
                <span className="text-xs text-gray-500">+{(field.options?.length || 0) - 3} mais...</span>
              )}
            </div>
          )}
          {field.type === "stars" && (
            <div className="flex space-x-1">
              {Array.from({ length: field.max || 5 }).map((_, idx) => (
                <span key={idx} className="text-yellow-400">
                  ⭐
                </span>
              ))}
            </div>
          )}
          {field.type === "divider" && (
            <div className="text-center py-2">
              <Separator className="bg-gray-600" />
              <span className="text-sm text-gray-400 mt-2 block">{field.label}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const selectedFieldData = selectedField ? survey.fields?.find((f) => f.id === selectedField) : null

  return (
    <div className="min-h-screen bg-[#121826] text-gray-100">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-orange-500/20 bg-[#1e293b]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm" className="border-orange-500/30 text-orange-400">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <Plus className="w-6 h-6 mr-2 text-orange-500" />
                  Criar Nova Pesquisa
                </h1>
                <p className="text-sm text-gray-400">Construa sua pesquisa de forma visual e intuitiva</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={saveSurvey} className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <Save className="w-4 h-4 mr-2" />
                Salvar Pesquisa
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar Esquerda - Tipos de Campo */}
        <div className="w-80 bg-[#1e293b] border-r border-orange-500/20 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white mb-2">Componentes</h3>
            <p className="text-xs text-gray-400">Clique para adicionar ao formulário</p>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {fieldTypes.map((type) => (
                <Button
                  key={type.value}
                  variant="ghost"
                  onClick={() => addField(type.value)}
                  className="w-full justify-start h-auto p-3 hover:bg-orange-500/10 hover:border-orange-400 border border-transparent text-left"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <span className="text-xl">{type.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-200">{type.label}</div>
                      <div className="text-xs text-gray-400 truncate">{type.description}</div>
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Área Central - Construção do Formulário */}
        <div className="flex-1 flex flex-col">
          {/* Configurações Básicas */}
          <div className="bg-[#1e293b] border-b border-gray-700 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-gray-400">Título da Pesquisa</Label>
                <Input
                  value={survey.title}
                  onChange={(e) => setSurvey((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome da sua pesquisa"
                  className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                />
              </div>
              <div className="flex items-end">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={survey.isActive}
                    onCheckedChange={(checked) => setSurvey((prev) => ({ ...prev, isActive: checked }))}
                  />
                  <Label className="text-xs text-gray-400">Pesquisa ativa</Label>
                </div>
              </div>
            </div>

            {survey.title && (
              <div className="mt-3">
                <Label className="text-xs text-gray-400">Descrição (opcional)</Label>
                <Textarea
                  value={survey.description}
                  onChange={(e) => setSurvey((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o objetivo da pesquisa..."
                  rows={2}
                  className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                />
              </div>
            )}
          </div>

          {/* Área de Construção */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6">
                {(survey.fields?.length || 0) === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Comece criando seu formulário</h3>
                    <p className="text-gray-400 mb-4">Adicione campos da barra lateral para começar</p>
                  </div>
                ) : (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="form-builder">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {survey.fields?.map((field, index) => (
                            <Draggable key={field.id} draggableId={field.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`group relative bg-[#1e293b] rounded-lg border-2 transition-all duration-200 ${
                                    selectedField === field.id
                                      ? "border-orange-500 shadow-lg shadow-orange-500/20"
                                      : "border-gray-600 hover:border-gray-500"
                                  } ${snapshot.isDragging ? "shadow-2xl rotate-2" : ""}`}
                                  onClick={() => setSelectedField(field.id)}
                                >
                                  {/* Drag Handle */}
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                  </div>

                                  {/* Field Actions */}
                                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        duplicateField(field.id)
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-blue-500/20"
                                    >
                                      <Copy className="w-3 h-3 text-blue-400" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeField(field.id)
                                      }}
                                      className="h-6 w-6 p-0 hover:bg-red-500/20"
                                    >
                                      <Trash2 className="w-3 h-3 text-red-400" />
                                    </Button>
                                  </div>

                                  <div className="p-4 pl-8">{renderFieldPreview(field)}</div>

                                  {/* Selection Indicator */}
                                  {selectedField === field.id && (
                                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-orange-500 rounded-l"></div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          )) || []}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Painel Direito - Propriedades do Campo */}
        <div className="w-80 bg-[#1e293b] border-l border-orange-500/20 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Propriedades
            </h3>
          </div>

          <ScrollArea className="flex-1">
            {selectedFieldData ? (
              <div className="p-4 space-y-4">
                {/* Mesmo conteúdo do painel de propriedades da página de edição */}
                {/* Tipo do Campo */}
                <div>
                  <Label className="text-xs text-gray-400">Tipo do Campo</Label>
                  <div className="mt-1 p-2 bg-[#2a3548] rounded border border-gray-600 flex items-center space-x-2">
                    <span className="text-lg">{fieldTypes.find((t) => t.value === selectedFieldData.type)?.icon}</span>
                    <span className="text-sm text-gray-300">
                      {fieldTypes.find((t) => t.value === selectedFieldData.type)?.label}
                    </span>
                  </div>
                </div>

                {/* Título */}
                {selectedFieldData.type !== "divider" && (
                  <div>
                    <Label className="text-xs text-gray-400">Título do Campo</Label>
                    <Input
                      value={selectedFieldData.label}
                      onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                      placeholder="Digite o título..."
                      className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                    />
                  </div>
                )}

                {/* Título da Seção (para divisores) */}
                {selectedFieldData.type === "divider" && (
                  <div>
                    <Label className="text-xs text-gray-400">Título da Seção</Label>
                    <Input
                      value={selectedFieldData.label}
                      onChange={(e) => updateField(selectedFieldData.id, { label: e.target.value })}
                      placeholder="Nome da seção..."
                      className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                    />
                  </div>
                )}

                {/* Descrição */}
                {selectedFieldData.type !== "divider" && (
                  <div>
                    <Label className="text-xs text-gray-400">Descrição (opcional)</Label>
                    <Textarea
                      value={selectedFieldData.description || ""}
                      onChange={(e) => updateField(selectedFieldData.id, { description: e.target.value })}
                      placeholder="Instruções adicionais..."
                      rows={2}
                      className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                    />
                  </div>
                )}

                {/* Campo Obrigatório */}
                {selectedFieldData.type !== "divider" && (
                  <div className="flex items-center justify-between p-3 bg-[#2a3548] rounded border border-gray-600">
                    <Label className="text-sm text-gray-300">Campo obrigatório</Label>
                    <Switch
                      checked={selectedFieldData.required}
                      onCheckedChange={(checked) => updateField(selectedFieldData.id, { required: checked })}
                    />
                  </div>
                )}

                {/* Opções para campos de múltipla escolha */}
                {["checkbox", "radio", "dropdown", "ranking"].includes(selectedFieldData.type) && (
                  <div>
                    <Label className="text-xs text-gray-400">Opções</Label>
                    <div className="mt-2 space-y-2">
                      {selectedFieldData.options?.map((option, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(selectedFieldData.id, index, e.target.value)}
                            placeholder={`Opção ${index + 1}`}
                            className="bg-[#2a3548] border-gray-600 text-white"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOption(selectedFieldData.id, index)}
                            className="hover:bg-red-500/20 text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addOption(selectedFieldData.id)}
                        className="w-full border-gray-600 text-gray-300 hover:bg-green-500/20 hover:border-green-400"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Opção
                      </Button>
                    </div>
                  </div>
                )}

                {/* Configurações para estrelas */}
                {selectedFieldData.type === "stars" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Mínimo</Label>
                      <Input
                        type="number"
                        value={selectedFieldData.min || 1}
                        onChange={(e) => updateField(selectedFieldData.id, { min: Number.parseInt(e.target.value) })}
                        min="1"
                        max="10"
                        className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Máximo</Label>
                      <Input
                        type="number"
                        value={selectedFieldData.max || 5}
                        onChange={(e) => updateField(selectedFieldData.id, { max: Number.parseInt(e.target.value) })}
                        min="1"
                        max="10"
                        className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Configurações para numérico */}
                {selectedFieldData.type === "numeric" && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-gray-400">Valor Mínimo</Label>
                      <Input
                        type="number"
                        value={selectedFieldData.min || 0}
                        onChange={(e) => updateField(selectedFieldData.id, { min: Number.parseInt(e.target.value) })}
                        className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-400">Valor Máximo</Label>
                      <Input
                        type="number"
                        value={selectedFieldData.max || 10}
                        onChange={(e) => updateField(selectedFieldData.id, { max: Number.parseInt(e.target.value) })}
                        className="mt-1 bg-[#2a3548] border-gray-600 text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Validações automáticas */}
                {["email", "phone", "currency", "cep"].includes(selectedFieldData.type) && (
                  <div className="p-3 bg-green-900/20 rounded border border-green-500/30">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-green-400 text-xs font-medium">✅ Validação Automática</span>
                    </div>
                    <p className="text-xs text-green-300">
                      {selectedFieldData.type === "email" && "Formato de e-mail validado automaticamente"}
                      {selectedFieldData.type === "phone" && "Máscara de telefone brasileiro aplicada"}
                      {selectedFieldData.type === "currency" && "Formato R$ 1.234,56 aplicado"}
                      {selectedFieldData.type === "cep" && "Máscara 12345-678 aplicada"}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center">
                <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Settings className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-400">Selecione um campo para editar suas propriedades</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Rodapé */}
      <footer className="py-4 border-t border-gray-700/50 bg-[#0f1419]">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-xs text-gray-400">
            Desenvolvido por <span className="text-orange-400 font-semibold">EAGLE DIGITAL HOUSE</span>
            {" • "}
            TODOS OS DIREITOS RESERVADOS
          </p>
        </div>
      </footer>
    </div>
  )
}
