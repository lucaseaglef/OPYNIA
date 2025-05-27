"use client"

import type React from "react"

import { useState } from "react"
import { Download, FileText, FileSpreadsheet, Database, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SurveyStorage } from "@/lib/survey-storage"
import type { Survey, SurveyResponse } from "@/types/survey"
import jsPDF from "jspdf"
import "jspdf-autotable"

interface ExportManagerProps {
  survey: Survey
  responses: SurveyResponse[]
}

export function ExportManager({ survey, responses }: ExportManagerProps) {
  const [importing, setImporting] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  const exportCSV = async () => {
    try {
      const csv = await SurveyStorage.exportToCSV(survey.id)
      if (csv) {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${survey.title.replace(/[^a-z0-9]/gi, "_")}_resultados_${new Date().toISOString().split("T")[0]}.csv`
        link.click()
      }
    } catch (error) {
      console.error("Error exporting CSV:", error)
      alert("Erro ao exportar CSV. Tente novamente.")
    }
  }

  const exportExcel = async () => {
    try {
      // Create Excel-compatible CSV with UTF-8 BOM
      const csv = await SurveyStorage.exportToCSV(survey.id)
      if (csv) {
        const BOM = "\uFEFF"
        const blob = new Blob([BOM + csv], { type: "application/vnd.ms-excel;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${survey.title.replace(/[^a-z0-9]/gi, "_")}_resultados_${new Date().toISOString().split("T")[0]}.xlsx`
        link.click()
      }
    } catch (error) {
      console.error("Error exporting Excel:", error)
      alert("Erro ao exportar Excel. Tente novamente.")
    }
  }

  const exportJSON = () => {
    try {
      const data = {
        survey,
        responses,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `${survey.title.replace(/[^a-z0-9]/gi, "_")}_backup_${new Date().toISOString().split("T")[0]}.json`
      link.click()
    } catch (error) {
      console.error("Error exporting JSON:", error)
      alert("Erro ao exportar JSON. Tente novamente.")
    }
  }

  const exportPDF = () => {
    try {
      const doc = new jsPDF()

      // Header
      doc.setFontSize(20)
      doc.setTextColor(59, 130, 246)
      doc.text(survey.title, 20, 30)

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text(`Relatório gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 20, 40)
      doc.text(`Total de respostas: ${responses.length}`, 20, 50)

      let yPosition = 70

      // Summary stats
      doc.setFontSize(16)
      doc.setTextColor(0, 0, 0)
      doc.text("Resumo Estatístico", 20, yPosition)
      yPosition += 20

      // Create table data for each field
      survey.fields.forEach((field) => {
        if (field.type === "divider") return

        const fieldResponses = responses.map((r) => r.answers[field.id]).filter(Boolean)

        if (fieldResponses.length === 0) return

        // Add new page if needed
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 30
        }

        doc.setFontSize(14)
        doc.setTextColor(0, 0, 0)
        doc.text(field.label, 20, yPosition)
        yPosition += 10

        if (["radio", "dropdown", "checkbox"].includes(field.type)) {
          // Count occurrences
          const counts: { [key: string]: number } = {}
          fieldResponses.forEach((response) => {
            if (Array.isArray(response)) {
              response.forEach((item) => {
                counts[item] = (counts[item] || 0) + 1
              })
            } else {
              counts[response] = (counts[response] || 0) + 1
            }
          })

          const tableData = Object.entries(counts).map(([option, count]) => [
            option,
            count.toString(),
            `${((count / fieldResponses.length) * 100).toFixed(1)}%`,
          ])
          ;(doc as any).autoTable({
            startY: yPosition,
            head: [["Opção", "Respostas", "Percentual"]],
            body: tableData,
            theme: "grid",
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 20 },
          })

          yPosition = (doc as any).lastAutoTable.finalY + 20
        } else if (field.type === "stars" || field.type === "numeric") {
          const numbers = fieldResponses.map(Number).filter((n) => !isNaN(n))
          if (numbers.length > 0) {
            const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length
            const min = Math.min(...numbers)
            const max = Math.max(...numbers)
            ;(doc as any).autoTable({
              startY: yPosition,
              head: [["Métrica", "Valor"]],
              body: [
                ["Média", avg.toFixed(2)],
                ["Mínimo", min.toString()],
                ["Máximo", max.toString()],
                ["Total de respostas", numbers.length.toString()],
              ],
              theme: "grid",
              headStyles: { fillColor: [59, 130, 246] },
              margin: { left: 20 },
            })

            yPosition = (doc as any).lastAutoTable.finalY + 20
          }
        }
      })

      // Individual responses
      if (responses.length > 0) {
        doc.addPage()
        yPosition = 30

        doc.setFontSize(16)
        doc.text("Respostas Individuais", 20, yPosition)
        yPosition += 20

        responses.slice(0, 10).forEach((response, index) => {
          if (yPosition > 250) {
            doc.addPage()
            yPosition = 30
          }

          doc.setFontSize(12)
          doc.setTextColor(0, 0, 0)
          doc.text(
            `Resposta #${index + 1} - ${new Date(response.submittedAt).toLocaleDateString("pt-BR")}`,
            20,
            yPosition,
          )
          yPosition += 10

          survey.fields.forEach((field) => {
            if (field.type === "divider" || !response.answers[field.id]) return

            if (yPosition > 270) {
              doc.addPage()
              yPosition = 30
            }

            doc.setFontSize(10)
            doc.setTextColor(100, 100, 100)
            doc.text(`${field.label}:`, 25, yPosition)
            yPosition += 7

            doc.setTextColor(0, 0, 0)
            const answer = Array.isArray(response.answers[field.id])
              ? response.answers[field.id].join(", ")
              : response.answers[field.id].toString()

            const lines = doc.splitTextToSize(answer, 160)
            doc.text(lines, 25, yPosition)
            yPosition += lines.length * 5 + 5
          })

          yPosition += 10
        })

        if (responses.length > 10) {
          doc.text(`... e mais ${responses.length - 10} respostas`, 20, yPosition)
        }
      }

      doc.save(`${survey.title.replace(/[^a-z0-9]/gi, "_")}_relatorio_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      console.error("Error exporting PDF:", error)
      alert("Erro ao exportar PDF. Tente novamente.")
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImporting(true)

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      if (data.survey && data.responses) {
        // Import responses
        for (const response of data.responses) {
          await SurveyStorage.saveResponse(survey.id, response.answers)
        }

        alert(`${data.responses.length} respostas importadas com sucesso!`)
        setImportDialogOpen(false)
        window.location.reload()
      } else {
        alert("Arquivo de backup inválido.")
      }
    } catch (error) {
      console.error("Error importing:", error)
      alert("Erro ao importar arquivo. Verifique se é um backup válido.")
    } finally {
      setImporting(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="hover:bg-green-50 hover:border-green-300">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={exportCSV} className="cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportExcel} className="cursor-pointer">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exportar Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportJSON} className="cursor-pointer">
            <Database className="w-4 h-4 mr-2" />
            Backup JSON
          </DropdownMenuItem>
          <DropdownMenuItem onClick={exportPDF} className="cursor-pointer">
            <FileText className="w-4 h-4 mr-2" />
            Relatório PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setImportDialogOpen(true)} className="cursor-pointer">
            <Upload className="w-4 h-4 mr-2" />
            Importar Backup
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Backup</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="backup-file">Selecione o arquivo de backup (JSON)</Label>
              <Input id="backup-file" type="file" accept=".json" onChange={handleImport} disabled={importing} />
            </div>
            <p className="text-sm text-gray-600">
              Selecione um arquivo de backup JSON exportado anteriormente para restaurar as respostas.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
