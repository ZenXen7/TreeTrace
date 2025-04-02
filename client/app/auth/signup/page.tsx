"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { ChevronLeft, Eye, EyeOff, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { AnimatedBackground } from "@/components/AnimatedBackground"



export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [date, setDate] = useState<Date>()

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordsMatch(e.target.value === confirmPassword)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setPasswordsMatch(e.target.value === password)
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans relative flex items-center justify-center py-12 px-4">
      
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />

     
      <div className="absolute inset-0 overflow-hidden">
      <AnimatedBackground />
      </div>

    
      <Link href="/" className="absolute top-8 left-8 z-10">
        <Button variant="ghost" className="text-gray-400 hover:text-white group flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </Button>
      </Link>

    
      <div className="absolute top-8 right-8 flex items-center gap-2">
        <div className="h-6 w-6">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
            <path
              d="M12 3v18M12 7l-3-3M12 7l3-3M5 12h14M7 12l-3 3M7 12l-3-3M17 12l3 3M17 12l3-3M12 17l-3 3M12 17l3 3"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <span className="font-medium text-white text-lg tracking-tight">TreeTrace</span>
      </div>

    
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md my-10"
      >
        <Card className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 shadow-xl overflow-hidden">
         
          <div className="absolute -top-10 -right-10 w-40 h-40 opacity-10">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 10v80M50 30l-20-15M50 30l20-15M30 50h40M30 50l-15 15M30 50l-15-15M70 50l15 15M70 50l15-15M50 70l-20 15M50 70l20 15"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 opacity-10 rotate-180">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 10v80M50 30l-20-15M50 30l20-15M30 50h40M30 50l-15 15M30 50l-15-15M70 50l15 15M70 50l15-15M50 70l-20 15M50 70l20 15"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>

          <CardHeader className="space-y-1 pb-4 relative z-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <CardTitle className="text-2xl font-medium text-center">Join TreeTrace</CardTitle>
              <CardDescription className="text-center text-gray-400 pt-1">
                Begin mapping your family connections
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-4 relative z-10">
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
           
              <div className="space-y-1">
                <h3 className="text-sm font-medium text-gray-300">Personal Information</h3>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-1"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium text-gray-300">
                    First Name
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                    Last Name
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>

             

           
              <div className="space-y-1 pt-2">
                <h3 className="text-sm font-medium text-gray-300">Account Information</h3>
                <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-1"></div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a secure password"
                    value={password}
                    onChange={handlePasswordChange}
                    className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-gray-900 rounded-full p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-gray-900 rounded-full p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!passwordsMatch && confirmPassword.length > 0 && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>
            </motion.div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 relative z-10">
            <motion.div
              className="w-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Button className="w-full h-11 bg-white text-black hover:bg-gray-100 transition-colors font-medium">
                Create Your Family Tree
              </Button>
            </motion.div>

            <motion.div
              className="text-sm text-gray-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              Already tracing your roots?{" "}
              <Link href="/auth/login" className="text-white hover:text-gray-200 transition-colors font-medium">
                Sign in
              </Link>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}

