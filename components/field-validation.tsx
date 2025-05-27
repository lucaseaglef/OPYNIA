"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { PhoneField } from "@/components/phone-field"
import type { SurveyField } from "@/types/survey"

interface FieldValidationProps {
  field: SurveyField
  value: any
  onChange: (value: any) => void
  className?: string
}

export function FieldValidation({ field, value, onChange, className }: FieldValidationProps) {
  const formatCurrency = (input: string) => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, "")

    if (!numbers) return ""

    // Converte para centavos
    const cents = Number.parseInt(numbers)
    const reais = cents / 100

    // Formata como moeda brasileira
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(reais)
  }

  const formatCEP = (input: string) => {
    const numbers = input.replace(/\D/g, "")
    if (numbers.length <= 5) return numbers
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`
  }

  const handleChange = (newValue: string) => {
    let formattedValue = newValue

    switch (field.type) {
      case "currency":
        formattedValue = formatCurrency(newValue)
        break
      case "cep":
        formattedValue = formatCEP(newValue)
        break
    }

    onChange(formattedValue)
  }

  switch (field.type) {
    case "text":
    case "email":
    case "currency":
    case "cep":
      return (
        <Input
          type={field.type === "email" ? "email" : "text"}
          value={value || ""}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={
            field.type === "email"
              ? "exemplo@email.com"
              : field.type === "currency"
                ? "R$ 0,00"
                : field.type === "cep"
                  ? "12345-678"
                  : "Digite aqui..."
          }
          className={`h-11 sm:h-10 text-sm transition-all duration-200 ${className}`}
        />
      )

    case "phone":
      return <PhoneField value={value || ""} onChange={onChange} className={className} required={field.required} />

    case "textarea":
      return (
        <Textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua resposta..."
          rows={3}
          className={`text-sm resize-none transition-all duration-200 ${className}`}
        />
      )

    default:
      return (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className={`h-11 sm:h-10 text-sm transition-all duration-200 ${className}`}
        />
      )
  }
}
