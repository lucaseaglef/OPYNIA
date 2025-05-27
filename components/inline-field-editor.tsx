"use client"

import { useState, useEffect } from "react"
import { X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { SurveyStorage } from "@/lib/survey-storage"
import type { Survey, SurveyField } from "@/types/survey"

interface InlineFieldEditorProps {
  survey: Survey
  field: SurveyField
  onUpdate: (updatedSurvey: Survey) => void
}

export function InlineFieldEditor({ survey, field, onUpdate }: InlineFieldEditorProps) {
  const [saving, setSaving] = useState(false)
  const [fieldData, setFieldData] = useState(field)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const hasChanged = JSON.stringify(field) !== JSON.stringify(fieldData)
    setHasChanges(hasChanged)
  }, [field, fieldData])

  const handleSave = async () => {
    if (!hasChanges) {
      onUpdate(survey)
      return
    }

    setSaving(true)
    try {
      const updatedFields = survey.fields.map((f) => (f.id === field.id ? fieldData : f))
      const updatedSurvey = { ...survey, fields: updatedFields }

      await SurveyStorage.updateSurvey(survey.id, updatedSurvey)
      onUpdate(updatedSurvey)
    } catch (error) {
      console.error("Error updating field:", error)
      alert("Erro ao salvar campo. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFieldData(field)
    setHasChanges(false)
    onUpdate(survey)
  }

  const updateFieldData = (updates: Partial<SurveyField>) => {
    setFieldData({ ...fieldData, ...updates })
  }

  return (
    <div className="p-4 border-2 border-blue-300 rounded-lg bg-blue-50/50">
      <div className="space-y-4">
        <div>
          <Label htmlFor="field-label">Título do Campo</Label>
          <Input
            id="field-label"
            value={fieldData.label}
            onChange={(e) => updateFieldData({ label: e.target.value })}
            placeholder="Digite o título do campo"
          />
        </div>

        <div>
          <Label htmlFor="field-description">Descrição (opcional)</Label>
          <Textarea
            id="field-description"
            value={fieldData.description || ""}
            onChange={(e) => updateFieldData({ description: e.target.value })}
            placeholder="Descrição adicional para o campo"
            rows={2}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="field-required"
            checked={fieldData.required}
            onCheckedChange={(checked) => updateFieldData({ required: checked })}
          />
          <Label htmlFor="field-required">Campo obrigatório</Label>
        </div>

        {/* Type-specific options */}
        {["radio", "dropdown", "checkbox"].includes(fieldData.type) && (
          <div>
            <Label>Opções</Label>
            <div className="space-y-2">
              {fieldData.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(fieldData.options || [])]
                      newOptions[index] = e.target.value
                      updateFieldData({ options: newOptions })
                    }}
                    placeholder={`Opção ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newOptions = fieldData.options?.filter((_, i) => i !== index)
                      updateFieldData({ options: newOptions })
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newOptions = [...(fieldData.options || []), ""]
                  updateFieldData({ options: newOptions })
                }}
              >
                Adicionar Opção
              </Button>
            </div>
          </div>
        )}

        {["numeric", "stars"].includes(fieldData.type) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="field-min">Valor Mínimo</Label>
              <Input
                id="field-min"
                type="number"
                value={fieldData.min || 0}
                onChange={(e) => updateFieldData({ min: Number.parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label htmlFor="field-max">Valor Máximo</Label>
              <Input
                id="field-max"
                type="number"
                value={fieldData.max || 10}
                onChange={(e) => updateFieldData({ max: Number.parseInt(e.target.value) || 10 })}
              />
            </div>
          </div>
        )}

        {fieldData.type === "text" && (
          <div>
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={fieldData.placeholder || ""}
              onChange={(e) => updateFieldData({ placeholder: e.target.value })}
              placeholder="Texto de exemplo para o campo"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            {hasChanges && (
              <div className="flex items-center space-x-1 text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span className="text-sm">Alterações não salvas</span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? (
                "Salvando..."
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
