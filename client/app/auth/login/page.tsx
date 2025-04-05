"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft, Eye, EyeOff } from "lucide-react"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/useAuthStore"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export default function Login() {
  const router = useRouter()
  const { login, isLoading, loginSuccess } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (loginSuccess) {
      const timer = setTimeout(() => {
        router.push("/dashboard/main")
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [loginSuccess, router])

  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data)
    } catch (error: any) {
      toast.error(error.message || "Login failed")
    }
  }

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

  return (
    <div className="min-h-screen bg-black text-white font-sans relative flex items-center justify-center p-4">
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

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <Card className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 shadow-xl overflow-hidden">
          {/* Decorative tree branch element */}
          <div className="absolute -top-10 -right-10 w-40 h-40 opacity-10">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M50 10v80M50 30l-20-15M50 30l20-15M30 50h40M30 50l-15 15M30 50l-15-15M70 50l15 15M70 50l15-15M50 70l-20 15M50 70l20 15"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
          </div>

          <CardHeader className="space-y-1 pb-6 relative z-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }}>
              <CardTitle className="text-2xl font-medium text-center">Welcome to TreeTrace</CardTitle>
              <CardDescription className="text-center text-gray-400 pt-1">
                Continue building your family connections
              </CardDescription>
            </motion.div>
          </CardHeader>

          <CardContent className="space-y-5 relative z-10">
            {loginSuccess ? (
              <div className="py-6">
                <div className="flex flex-col items-center justify-center">
                  {/* Success animation */}
                  <div className="relative w-32 h-32 mb-6">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.5 }}
                      className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full"
                    />
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <motion.path
                        d="M50 10v80M30 30L50 10M70 30L50 10M10 50h80M30 30L10 50M30 70L10 50M70 30L90 50M70 70L90 50M30 70L50 90M70 70L50 90"
                        stroke="url(#loginSuccessGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        variants={treeConnectionVariants}
                        initial="hidden"
                        animate="visible"
                        fill="none"
                      />
                      <defs>
                        <linearGradient id="loginSuccessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#0ea5e9" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 1.2, duration: 0.5, type: "spring" }}
                    >
                      <motion.div
                        className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center"
                        animate={{
                          boxShadow: ["0 0 0 0 rgba(16, 185, 129, 0.7)", "0 0 0 10px rgba(16, 185, 129, 0)"],
                        }}
                        transition={{
                          repeat: Number.POSITIVE_INFINITY,
                          duration: 1.5,
                          repeatDelay: 0.5,
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
                          <motion.path
                            d="M5 13l4 4L19 7"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 1.4, duration: 0.6, type: "spring" }}
                          />
                        </svg>
                      </motion.div>
                    </motion.div>
                  </div>
                  <motion.h3
                    className="text-xl font-medium text-white mb-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.6, duration: 0.5 }}
                  >
                    Login Successful!
                  </motion.h3>
                  <motion.p
                    className="text-gray-400 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                  >
                    Redirecting you to your dashboard...
                  </motion.p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                      Email
                    </Label>
                    <Input
                      {...register("email")}
                      type="email"
                      placeholder="name@example.com"
                      className="h-11 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 transition-all"
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-sm">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-300">
                        Password
                      </Label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        {...register("password")}
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="h-11 bg-gray-800/50 border-gray-700/50 focus:border-gray-500 text-white placeholder:text-gray-500 pr-10 transition-all"
                        disabled={isLoading}
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
                    {errors.password && (
                      <motion.p
                        className="text-red-400 text-sm"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {errors.password.message}
                      </motion.p>
                    )}
                  </div>
                </motion.div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full h-11 transition-all duration-300 font-medium relative overflow-hidden ${
                    isLoading ? "bg-gray-800 text-transparent" : "bg-white text-black hover:bg-gray-100"
                  }`}
                >
                  {!isLoading ? (
                    "Sign In"
                  ) : (
                    <>
                      <span className="opacity-0">Sign In</span>
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
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 relative z-10">
            <motion.div
              className="text-sm text-gray-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              New to family tree tracing?{" "}
              <Link href="/auth/signup" className="text-white hover:text-gray-200 transition-colors font-medium">
                Create account
              </Link>
            </motion.div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}


