"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft, Eye, EyeOff, User, Mail, Lock } from "lucide-react"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { useAuthStore } from "@/store/useAuthStore"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"

export default function Register() {
  const router = useRouter()
  const { register: signUp, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    clearErrors,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    try {
      await signUp(data)
      toast.success("Registration successful!")
      router.push("/auth/login")
    } catch (error: any) {
      toast.error(error.message || "Registration failed")
    }
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                    <Label htmlFor="firstName">First Name</Label>
                    <div className="relative">
                      <Input
                        {...register("firstName")}
                        className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pl-10"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                    {errors.firstName && (
                      <p className="text-red-400 text-sm">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <div className="relative">
                      <Input
                        {...register("lastName")}
                        className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pl-10"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    </div>
                    {errors.lastName && (
                      <p className="text-red-400 text-sm">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const genderField = "gender" as const;
                        setValue(genderField, "male");
                        clearErrors(genderField);
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                        watch("gender") === "male"
                          ? "bg-gray-800/80 border-white/20 shadow-lg shadow-white/5"
                          : "bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50"
                      }`}
                    >
                      <div className={`w-12 h-12 mb-2 rounded-full flex items-center justify-center transition-colors duration-200 ${
                        watch("gender") === "male" ? "bg-blue-500/20" : "bg-gray-700/30"
                      }`}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className={`w-6 h-6 transition-colors duration-200 ${
                            watch("gender") === "male" ? "text-blue-400" : "text-gray-400"
                          }`}
                        >
                          <path
                            d="M12 12a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                            fill="currentColor"
                          />
                          <path
                            d="M12 0c-.6 0-1 .4-1 1v7h2V1c0-.6-.4-1-1-1z"
                            fill="currentColor"
                          />
                          <path
                            d="M17 5.6L15.6 7l3.5 3.5L20.4 9 17 5.6z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <span className={`font-medium transition-colors duration-200 ${
                        watch("gender") === "male" ? "text-white" : "text-gray-400"
                      }`}>
                        Male
                      </span>
                      {watch("gender") === "male" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        </motion.div>
                      )}
                    </motion.button>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const genderField = "gender" as const;
                        setValue(genderField, "female");
                        clearErrors(genderField);
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 ${
                        watch("gender") === "female"
                          ? "bg-gray-800/80 border-white/20 shadow-lg shadow-white/5"
                          : "bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50"
                      }`}
                    >
                      <div className={`w-12 h-12 mb-2 rounded-full flex items-center justify-center transition-colors duration-200 ${
                        watch("gender") === "female" ? "bg-pink-500/20" : "bg-gray-700/30"
                      }`}>
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          className={`w-6 h-6 transition-colors duration-200 ${
                            watch("gender") === "female" ? "text-pink-400" : "text-gray-400"
                          }`}
                        >
                          <path
                            d="M12 12a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 10a4 4 0 1 1 0-8 4 4 0 0 1 0 8z"
                            fill="currentColor"
                          />
                          <path
                            d="M12 0c-.6 0-1 .4-1 1v7h2V1c0-.6-.4-1-1-1z"
                            fill="currentColor"
                          />
                          <path
                            d="M8.5 4.5L7 5.9l2.1 2.1L10.6 6.5 8.5 4.5z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <span className={`font-medium transition-colors duration-200 ${
                        watch("gender") === "female" ? "text-white" : "text-gray-400"
                      }`}>
                        Female
                      </span>
                      {watch("gender") === "female" && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2 w-4 h-4 bg-white rounded-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-pink-500 rounded-full" />
                        </motion.div>
                      )}
                    </motion.button>
                  </div>
                  {errors.gender && (
                    <p className="text-red-400 text-sm mt-1">{errors.gender.message}</p>
                  )}
                </div>

                <div className="space-y-1 pt-2">
                  <h3 className="text-sm font-medium text-gray-300">Account Information</h3>
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent my-1"></div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Input
                      {...register("email")}
                      type="email"
                      className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pl-10"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pl-10 pr-10"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-gray-900 rounded-full p-1"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      {...register("confirmPassword")}
                      type={showConfirmPassword ? "text" : "password"}
                      className="h-10 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pl-10 pr-10"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 focus:ring-offset-gray-900 rounded-full p-1"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
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
        </Card>
      </motion.div>
    </div>
  )
}

