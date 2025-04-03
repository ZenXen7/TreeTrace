"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft, Eye, EyeOff } from "lucide-react"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { createUser } from "@/services/api"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function Register() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordsMatch, setPasswordsMatch] = useState(true)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    setPasswordsMatch(e.target.value === confirmPassword)
  }

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value)
    setPasswordsMatch(e.target.value === password)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      if (!passwordsMatch) {
        throw new Error("Passwords do not match")
      }

      const userData = {
        firstName,
        lastName,
        email,
        password,
      }

      const response = await createUser(userData)
      setRegistrationSuccess(true)
      toast.success("Account created successfully!")

      // Add a delay before redirecting to login
      setTimeout(() => {
        router.push("/auth/login")
      }, 2500)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message || "Registration failed")
    } finally {
      if (!registrationSuccess) {
        setIsLoading(false)
      }
    }
  }

  // Tree connection animation variants
  const treeConnectionVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: "spring", duration: 1.5, bounce: 0 },
        opacity: { duration: 0.2 },
      },
    },
  }

  // Branch growth animation variants
  const branchVariants = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (custom: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { type: "spring", duration: 1.2, bounce: 0, delay: custom * 0.2 },
        opacity: { duration: 0.3, delay: custom * 0.2 },
      },
    }),
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans relative flex items-center justify-center py-12 px-4">
      {/* Background with tree connection patterns */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />

      {/* Animated connection nodes */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatedBackground />
      </div>

      {/* Back button */}
      <Link href="/" className="absolute top-8 left-8 z-10">
        <Button variant="ghost" className="text-gray-400 hover:text-white group flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back</span>
        </Button>
      </Link>

      {/* TreeTrace Logo */}
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

      {/* Registration card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md my-10"
      >
        <Card className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 shadow-xl overflow-hidden">
          {/* Decorative tree branch elements */}
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

          {registrationSuccess ? (
            <div className="p-8">
              <div className="flex flex-col items-center justify-center py-8">
                {/* Success animation */}
                <div className="relative w-48 h-48 mb-8">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full"
                  />

                  {/* Growing tree animation */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    {/* Tree trunk */}
                    <motion.path
                      d="M50 90V50"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={0}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />

                    {/* Main branches */}
                    <motion.path
                      d="M50 50L30 30"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={1}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M50 50L70 30"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={1}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />

                    {/* Secondary branches */}
                    <motion.path
                      d="M30 30L20 20"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={2}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M30 30L40 15"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={2}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M70 30L60 15"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={2}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M70 30L80 20"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={2}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />

                    {/* Leaves/small branches */}
                    <motion.path
                      d="M20 20L15 15"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M20 20L25 10"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M40 15L35 5"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M40 15L45 5"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M60 15L55 5"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M60 15L65 5"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M80 20L75 10"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M80 20L85 15"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={3}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />

                    {/* Roots */}
                    <motion.path
                      d="M50 90L35 95"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={1.5}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />
                    <motion.path
                      d="M50 90L65 95"
                      stroke="url(#registerSuccessGradient)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      variants={branchVariants}
                      custom={1.5}
                      initial="hidden"
                      animate="visible"
                      fill="none"
                    />

                    <defs>
                      <linearGradient id="registerSuccessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#0ea5e9" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* Pulsing circle around the tree */}
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    initial={{ boxShadow: "0 0 0 0 rgba(16, 185, 129, 0)" }}
                    animate={{
                      boxShadow: [
                        "0 0 0 0 rgba(16, 185, 129, 0)",
                        "0 0 0 15px rgba(16, 185, 129, 0.2)",
                        "0 0 0 30px rgba(16, 185, 129, 0)",
                      ],
                    }}
                    transition={{
                      duration: 2.5,
                      times: [0, 0.5, 1],
                      repeat: Number.POSITIVE_INFINITY,
                      delay: 1.5,
                    }}
                  />
                </div>

                <motion.h3
                  className="text-2xl font-medium text-white mb-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.8, duration: 0.5 }}
                >
                  Your Tree Has Been Planted!
                </motion.h3>

                <motion.p
                  className="text-gray-400 text-center max-w-xs"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2, duration: 0.5 }}
                >
                  Your account has been created successfully. Redirecting you to login...
                </motion.p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardHeader className="space-y-1 pb-4 relative z-10">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  <CardTitle className="text-2xl font-medium text-center">Join TreeTrace</CardTitle>
                  <CardDescription className="text-center text-gray-400 pt-1">
                    Begin mapping your family connections
                  </CardDescription>
                </motion.div>
              </CardHeader>

              <CardContent className="space-y-4 relative z-10">
                {error && (
                  <motion.div
                    className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}

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
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="John"
                        required
                        disabled={isLoading}
                        className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-300">
                        Last Name
                      </Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        required
                        disabled={isLoading}
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      disabled={isLoading}
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
                        required
                        disabled={isLoading}
                        className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-gray-900 rounded-full p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        disabled={isLoading}
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
                        required
                        disabled={isLoading}
                        className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-gray-900 rounded-full p-1"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        disabled={isLoading}
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
                  <Button
                    type="submit"
                    className={`w-full h-11 transition-all duration-300 font-medium relative overflow-hidden ${
                      isLoading ? "bg-gray-800 text-transparent" : "bg-white text-black hover:bg-gray-100"
                    }`}
                    disabled={isLoading}
                  >
                    {!isLoading ? (
                      "Create Your Family Tree"
                    ) : (
                      <>
                        <span className="opacity-0">Create Your Family Tree</span>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="h-7 w-7 relative">
                            <motion.div
                              className="absolute inset-0 rounded-full border-2 border-transparent border-t-white"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            />
                            <motion.div
                              className="absolute inset-1 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                              }}
                            />
                          </div>
                        </div>
                      </>
                    )}
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
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

