import type React from "react"
import "./globals.css"
import ClientLayout from "./ClientLayout"

export const metadata = {
  title: "Opynia - Plataforma de Pesquisas",
  description: "Crie e gerencie pesquisas de satisfação profissionais com análises avançadas",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ClientLayout>{children}</ClientLayout>
}
