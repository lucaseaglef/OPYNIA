"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface LogoUploadProps {
  currentLogo?: string
  onLogoChange: (logoData: string | null) => void
  className?: string
}

export function LogoUpload({ currentLogo, onLogoChange, className = "" }: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("image/")) {
      // Verificar tamanho do arquivo (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("O arquivo deve ter no máximo 2MB")
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setPreview(result)
        onLogoChange(result)
      }
      reader.readAsDataURL(file)
    } else {
      alert("Por favor, selecione um arquivo de imagem válido (PNG, JPG, GIF, etc.)")
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const removeLogo = () => {
    setPreview(null)
    onLogoChange(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Label className="text-base font-semibold">Logo da Pesquisa</Label>

      {preview ? (
        <div className="relative group">
          <div className="w-full max-w-xs mx-auto p-4 border-2 border-gray-200 rounded-xl bg-white shadow-sm">
            <img
              src={preview || "/placeholder.svg"}
              alt="Logo da pesquisa"
              className="w-full h-32 object-contain rounded-lg"
            />
          </div>
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={removeLogo}
              className="w-8 h-8 p-0 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openFileDialog}
              className="hover:bg-blue-50 hover:border-blue-300"
            >
              Alterar Logo
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer hover:border-blue-400 ${
            isDragging ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:bg-blue-50/30"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
              {isDragging ? (
                <Upload className="w-8 h-8 text-blue-600 animate-bounce" />
              ) : (
                <ImageIcon className="w-8 h-8 text-blue-600" />
              )}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900 mb-2">
                {isDragging ? "Solte o arquivo aqui" : "Adicionar Logo"}
              </p>
              <p className="text-gray-600 mb-4">Arraste uma imagem ou clique para selecionar</p>
              <div className="text-sm text-gray-500 space-y-1">
                <p>Formatos aceitos: PNG, JPG, GIF, SVG</p>
                <p>Tamanho máximo: 2MB</p>
                <p>Recomendado: 400x200px ou proporção 2:1</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInputChange} className="hidden" />
    </div>
  )
}
