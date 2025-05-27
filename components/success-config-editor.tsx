"use client"

import { useState } from "react"
import { Settings, Save, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { SurveyStorage } from "@/lib/survey-storage"
import type { Survey } from "@/types/survey"

interface SuccessConfigEditorProps {
  survey: Survey
  onUpdate: (survey: Survey) => void
}

export function SuccessConfigEditor({ survey, onUpdate }: SuccessConfigEditorProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    title: survey.successConfig?.title || "Obrigado pela sua participação!",
    message: survey.successConfig?.message || "Sua resposta foi enviada com sucesso.",
    showBackButton: survey.successConfig?.showBackButton ?? true,
    redirectUrl: survey.successConfig?.redirectUrl || "",
    redirectDelay: survey.successConfig?.redirectDelay || 0,
    customCss: survey.successConfig?.customCss || "",
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedSurvey = {
        ...survey,
        successConfig: config,
      }

      await SurveyStorage.updateSurvey(survey.id, updatedSurvey)
      onUpdate(updatedSurvey)
      setOpen(false)
    } catch (error) {
      console.error("Error updating success config:", error)
      alert("Erro ao salvar configurações. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
          <Settings className="w-4 h-4 mr-2" />
          Configurar Sucesso
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Página de Sucesso</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="success-title">Título da Página</Label>
            <Input
              id="success-title"
              value={config.title}
              onChange={(e) => setConfig({ ...config, title: e.target.value })}
              placeholder="Obrigado pela sua participação!"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="success-message">Mensagem</Label>
            <Textarea
              id="success-message"
              value={config.message}
              onChange={(e) => setConfig({ ...config, message: e.target.value })}
              placeholder="Sua resposta foi enviada com sucesso."
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="show-back-button"
              checked={config.showBackButton}
              onCheckedChange={(checked) => setConfig({ ...config, showBackButton: checked })}
            />
            <Label htmlFor="show-back-button">Mostrar botão "Voltar ao início"</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="redirect-url">URL de Redirecionamento (opcional)</Label>
            <Input
              id="redirect-url"
              value={config.redirectUrl}
              onChange={(e) => setConfig({ ...config, redirectUrl: e.target.value })}
              placeholder="https://exemplo.com"
              type="url"
            />
            <p className="text-sm text-gray-600">
              Se preenchido, o usuário será redirecionado para esta URL após enviar a resposta.
            </p>
          </div>

          {config.redirectUrl && (
            <div className="space-y-2">
              <Label htmlFor="redirect-delay">Delay do Redirecionamento (segundos)</Label>
              <Input
                id="redirect-delay"
                type="number"
                min="0"
                max="30"
                value={config.redirectDelay}
                onChange={(e) => setConfig({ ...config, redirectDelay: Number.parseInt(e.target.value) || 0 })}
              />
              <p className="text-sm text-gray-600">
                Tempo em segundos antes do redirecionamento automático. 0 = imediato.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="custom-css">CSS Personalizado (opcional)</Label>
            <Textarea
              id="custom-css"
              value={config.customCss}
              onChange={(e) => setConfig({ ...config, customCss: e.target.value })}
              placeholder=".success-page { background: linear-gradient(...); }"
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-sm text-gray-600">CSS personalizado para estilizar a página de sucesso.</p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-2">Preview</h4>
            <div className="p-4 border rounded-lg bg-gray-50">
              <h3 className="text-xl font-bold text-center mb-2">{config.title}</h3>
              <p className="text-center text-gray-600 mb-4">{config.message}</p>
              {config.showBackButton && (
                <div className="text-center">
                  <Button variant="outline" size="sm" disabled>
                    Voltar ao início
                  </Button>
                </div>
              )}
              {config.redirectUrl && (
                <p className="text-sm text-blue-600 text-center mt-2">
                  <ExternalLink className="w-4 h-4 inline mr-1" />
                  Redirecionando para {config.redirectUrl}
                  {config.redirectDelay > 0 && ` em ${config.redirectDelay}s`}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
