"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

// Configurações de países com validação
const countries = [
  {
    code: "BR",
    name: "Brasil",
    flag: "🇧🇷",
    format: "(99) 99999-9999",
    pattern: /^$$[0-9]{2}$$\s[0-9]{4,5}-[0-9]{4}$/,
    placeholder: "(11) 99999-9999",
    maxLength: 15,
  },
  {
    code: "US",
    name: "Estados Unidos",
    flag: "🇺🇸",
    format: "(999) 999-9999",
    pattern: /^$$[0-9]{3}$$\s[0-9]{3}-[0-9]{4}$/,
    placeholder: "(555) 123-4567",
    maxLength: 14,
  },
  {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    format: "(999) 999-9999",
    pattern: /^$$[0-9]{3}$$\s[0-9]{3}-[0-9]{4}$/,
    placeholder: "(011) 1234-5678",
    maxLength: 14,
  },
  {
    code: "MX",
    name: "México",
    flag: "🇲🇽",
    format: "(999) 999-9999",
    pattern: /^$$[0-9]{3}$$\s[0-9]{3}-[0-9]{4}$/,
    placeholder: "(555) 123-4567",
    maxLength: 14,
  },
  {
    code: "CL",
    name: "Chile",
    flag: "🇨🇱",
    format: "+56 9 9999 9999",
    pattern: /^\+56\s9\s[0-9]{4}\s[0-9]{4}$/,
    placeholder: "+56 9 1234 5678",
    maxLength: 16,
  },
  {
    code: "CO",
    name: "Colômbia",
    flag: "🇨🇴",
    format: "(999) 999-9999",
    pattern: /^$$[0-9]{3}$$\s[0-9]{3}-[0-9]{4}$/,
    placeholder: "(301) 123-4567",
    maxLength: 14,
  },
]

interface PhoneFieldProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
  required?: boolean
  label?: string
  description?: string
}

export function PhoneField({ value = "", onChange, className, required, label, description }: PhoneFieldProps) {
  const [selectedCountry, setSelectedCountry] = useState("BR")
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    // Extrair país e número do valor inicial
    if (value) {
      const country = countries.find((c) => value.startsWith(c.code + ":"))
      if (country) {
        setSelectedCountry(country.code)
        setPhoneNumber(value.replace(country.code + ":", ""))
      } else {
        // Valor sem país, assumir Brasil
        setPhoneNumber(value)
      }
    }
  }, [value])

  const currentCountry = countries.find((c) => c.code === selectedCountry) || countries[0]

  const formatPhoneNumber = (input: string, country: (typeof countries)[0]) => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, "")

    if (country.code === "BR") {
      // Brasil: (99) 99999-9999 ou (99) 9999-9999
      if (numbers.length <= 2) return numbers
      if (numbers.length <= 6) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
      if (numbers.length <= 10) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    } else if (country.code === "CL") {
      // Chile: +56 9 9999 9999
      if (numbers.length <= 1) return `+56 ${numbers}`
      if (numbers.length <= 5) return `+56 9 ${numbers.slice(1)}`
      return `+56 9 ${numbers.slice(1, 5)} ${numbers.slice(5, 9)}`
    } else {
      // EUA, Argentina, México, Colômbia: (999) 999-9999
      if (numbers.length <= 3) return numbers.length > 0 ? `(${numbers}` : ""
      if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
      return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
    }
  }

  const handlePhoneChange = (input: string) => {
    const formatted = formatPhoneNumber(input, currentCountry)
    setPhoneNumber(formatted)

    // Enviar valor com código do país
    const fullValue = `${selectedCountry}:${formatted}`
    onChange?.(fullValue)
  }

  const handleCountryChange = (countryCode: string) => {
    setSelectedCountry(countryCode)
    const country = countries.find((c) => c.code === countryCode)
    if (country) {
      // Reformatar número para o novo país
      const numbers = phoneNumber.replace(/\D/g, "")
      const formatted = formatPhoneNumber(numbers, country)
      setPhoneNumber(formatted)

      const fullValue = `${countryCode}:${formatted}`
      onChange?.(fullValue)
    }
  }

  const validatePhone = () => {
    if (!phoneNumber) return true
    return currentCountry.pattern.test(phoneNumber)
  }

  const isValid = validatePhone()

  return (
    <div className="space-y-2">
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {description && <p className="text-xs text-gray-600">{description}</p>}

      <div className="flex space-x-2">
        {/* Seletor de País */}
        <Select value={selectedCountry} onValueChange={handleCountryChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue>
              <div className="flex items-center space-x-2">
                <span>{currentCountry.flag}</span>
                <span className="text-xs">{currentCountry.code}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code}>
                <div className="flex items-center space-x-2">
                  <span>{country.flag}</span>
                  <span className="text-sm">{country.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Campo de Telefone */}
        <Input
          value={phoneNumber}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder={currentCountry.placeholder}
          maxLength={currentCountry.maxLength}
          className={`flex-1 ${!isValid && phoneNumber ? "border-red-400 focus:border-red-400" : ""} ${className}`}
        />
      </div>

      {/* Feedback de validação */}
      {phoneNumber && !isValid && <p className="text-xs text-red-600">Formato esperado: {currentCountry.format}</p>}

      {phoneNumber && isValid && <p className="text-xs text-green-600">✓ Número válido para {currentCountry.name}</p>}
    </div>
  )
}
