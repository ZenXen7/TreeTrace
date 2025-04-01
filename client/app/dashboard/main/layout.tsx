import type { Metadata } from "next"
import "../../globals.css"
import { Outfit } from "next/font/google"

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
})

export const metadata: Metadata = {
  title: "Dashboard | TreeTrace",
  description: "Manage your family trees and connections",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className={`min-h-screen bg-black antialiased ${outfit.variable} ${outfit.className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-5 pointer-events-none" />
      {children}
    </div>
  )
}