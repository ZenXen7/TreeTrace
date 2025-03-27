"use client"

import type React from "react"
import "./globals.css"
import { Outfit } from "next/font/google"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`min-h-screen bg-black antialiased ${outfit.variable} ${outfit.className}`}>
        {children}
      </body>
    </html>
  )
}