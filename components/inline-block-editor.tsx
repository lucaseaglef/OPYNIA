"use client"

import { useState } from "react"
import { Save, X, Edit3, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { SurveyStorage } from "@/lib/survey-storage"
import type { Survey, SurveyField } from "@/types/survey"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface InlineBlockEditorProps {
  survey: Survey
  field: SurveyField
  onUpdate: (updatedSurvey: Survey) => void
  onCancel: () => void
}

export function InlineBlockEditor({ survey, field, onUpdate, onCancel }: InlineBlockEditorProps) {
  const [editedField, setEditedField] = useState<SurveyField>({ ...field })
  const [saving, setSaving] = useState(false)

  const fieldTypes = [
    { value: "text", label: "Texto Curto", icon: "📝", color: "bg-blue-100 text-blue-700" },
    { value: "textarea", label: "Texto Longo", icon: "📄", color: "bg-indigo-100 text-indigo-700" },
    { value: "email", label: "E-mail", icon: "📧", color: "bg-cyan-100 text-cyan-700" },
    { value: "phone", label: "Telefone", icon: "📱", color: "bg-green-100 text-green-700" },
    { value: "currency", label: "Valor em Real", icon: "💰", color: "bg-emerald-100 text-emerald-700" },
    { value: "cep", label: "CEP", icon: "📍", color: "bg-orange-100 text-orange-700" },
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

  const updateField = (updates: Partial<SurveyField>) => {
    setEditedField((prev) => ({ ...prev, ...updates }))
  }

  const handleTypeChange = (newType: string) => {
    const baseField = {
      ...editedField,
      type: newType as any,
    }

    // Configurar campos específicos baseado no tipo
    switch (newType) {
      case "stars":
        updateField({ ...baseField, min: 1, max: 5, options: undefined })
        break
      case "numeric":
        updateField({ ...baseField, min: 0, max: 10, options: undefined })
        break
      case "likert":
        updateField({ ...baseField, options: likertOptions, min: undefined, max: undefined })
        break
      case "checkbox":
      case "radio":
      case "dropdown":
      case "ranking":
        updateField({ ...baseField, options: editedField.options || [""], min: undefined, max: undefined })
        break
      case "currency":
        updateField({
          ...baseField,
          options: undefined,
          min: undefined,
          max: undefined,
          validation: { currency: "BRL", mask: "currency" },
        })
        break
      case "email":
        updateField({
          ...baseField,
          options: undefined,
          min: undefined,
          max: undefined,
          validation: { pattern: "email" },
        })
        break
      case "phone":
        updateField({
          ...baseField,
          options: undefined,
          min: undefined,
          max: undefined,
          validation: { mask: "phone" },
        })
        break
      case "cep":
        updateField({
          ...baseField,
          options: undefined,
          min: undefined,
          max: undefined,
          validation: { mask: "cep" },
        })
        break
      default:
        updateField({ ...baseField, options: undefined, min: undefined, max: undefined, validation: undefined })
    }
  }

  const addOption = () => {
    updateField({
      options: [...(editedField.options || []), ""],
    })
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...(editedField.options || [])]
    newOptions[index] = value
    updateField({ options: newOptions })
  }

  const removeOption = (index: number) => {
    const newOptions = (editedField.options || []).filter((_, i) => i !== index)
    updateField({ options: newOptions })
  }

  const saveField = async () => {
    if (!editedField.label.trim()) {
      alert("O título do campo é obrigatório")
      return
    }

    setSaving(true)
    try {
      // Atualizar o campo no survey
      const updatedFields = survey.fields.map((f) => (f.id === field.id ? editedField : f))

      const updatedSurvey = { ...survey, fields: updatedFields }

      // Salvar no banco
      const success = await SurveyStorage.saveSurvey(updatedSurvey)

      if (success) {
        onUpdate(updatedSurvey)
      } else {
        alert("Erro ao salvar alterações. Tente novamente.")
      }
    } catch (error) {
      console.error("Error saving field:", error)
      alert("Erro ao salvar alterações. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const currentFieldType = fieldTypes.find((t) => t.value === editedField.type)

  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <Edit3 className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-blue-800">Editando Campo</h3>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={saving} className="hover:bg-gray-100">
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={saveField} disabled={saving} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Tipo do Campo */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-gray-700">Tipo do Campo</Label>
        <Select value={editedField.type} onValueChange={handleTypeChange}>
          <SelectTrigger className="border-2 focus:border-blue-400">
            <SelectValue>
              <div className="flex items-center space-x-2">
                <span className="text-lg">{currentFieldType?.icon}</span>
                <span>{currentFieldType?.label}</span>
                <Badge variant="secondary" className={currentFieldType?.color}>
                  {editedField.type}
                </Badge>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {fieldTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{type.icon}</span>
                  <span>{type.label}</span>
                  <Badge variant="secondary" className={type.color}>
                    {type.value}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {/* Título do Campo */}
        {editedField.type !== "divider" && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Título do Campo *</Label>
            <Input
              value={editedField.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="Ex: Como você avalia o evento?"
              className="border-2 focus:border-blue-400"
            />
          </div>
        )}

        {/* Título da Seção (para divisores) */}
        {editedField.type === "divider" && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Título da Seção *</Label>
            <Input
              value={editedField.label}
              onChange={(e) => updateField({ label: e.target.value })}
              placeholder="Ex: Informações Pessoais"
              className="border-2 focus:border-blue-400"
            />
          </div>
        )}

        {/* Descrição */}
        {editedField.type !== "divider" && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">Descrição (opcional)</Label>
            <Textarea
              value={editedField.description || ""}
              onChange={(e) => updateField({ description: e.target.value })}
              placeholder="Instruções adicionais..."
              rows={2}
              className="border-2 focus:border-blue-400"
            />
          </div>
        )}

        {/* Campo Obrigatório */}
        {editedField.type !== "divider" && (
          <div className="flex items-center space-x-3 p-3 bg-blue-100 rounded-lg">
            <Switch checked={editedField.required} onCheckedChange={(checked) => updateField({ required: checked })} />
            <Label className="font-semibold text-blue-800">Campo obrigatório</Label>
          </div>
        )}

        {/* Opções para campos de múltipla escolha */}
        {["checkbox", "radio", "dropdown", "ranking"].includes(editedField.type) && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Opções</Label>
            <div className="space-y-2">
              {editedField.options?.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Opção ${index + 1}`}
                    className="border-2 focus:border-blue-400"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="hover:bg-red-50 hover:border-red-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="hover:bg-green-50 hover:border-green-300"
              >
                + Adicionar Opção
              </Button>
            </div>
          </div>
        )}

        {/* Configurações para estrelas */}
        {editedField.type === "stars" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Mínimo</Label>
              <Input
                type="number"
                value={editedField.min || 1}
                onChange={(e) => updateField({ min: Number.parseInt(e.target.value) })}
                min="1"
                max="10"
                className="border-2 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Máximo</Label>
              <Input
                type="number"
                value={editedField.max || 5}
                onChange={(e) => updateField({ max: Number.parseInt(e.target.value) })}
                min="1"
                max="10"
                className="border-2 focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {/* Configurações para numérico */}
        {editedField.type === "numeric" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Valor Mínimo</Label>
              <Input
                type="number"
                value={editedField.min || 0}
                onChange={(e) => updateField({ min: Number.parseInt(e.target.value) })}
                className="border-2 focus:border-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Valor Máximo</Label>
              <Input
                type="number"
                value={editedField.max || 10}
                onChange={(e) => updateField({ max: Number.parseInt(e.target.value) })}
                className="border-2 focus:border-blue-400"
              />
            </div>
          </div>
        )}

        {/* Informações sobre validação automática */}
        {["email", "phone", "currency", "cep"].includes(editedField.type) && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-green-600">✓</span>
              <span className="text-sm font-medium text-green-800">
                {editedField.type === "email" && "Validação automática de e-mail aplicada"}
                {editedField.type === "phone" && "Máscara de telefone (11) 99999-9999 aplicada"}
                {editedField.type === "currency" && "Máscara de moeda R$ 1.234,56 aplicada"}
                {editedField.type === "cep" && "Máscara de CEP 12345-678 aplicada"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
