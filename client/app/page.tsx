"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Shield, Heart, Sparkles, ArrowRight, Check, X } from "lucide-react"
import Link from "next/link"
import { Network, TreePine, Activity } from "lucide-react"
import AnimatedNodes from "@/components/animated-nodes"
import { useState } from "react"

export default function Home() {
  const [showVideo, setShowVideo] = useState(false)

  const features = [
    {
      title: "Interactive Family Tree",
      description: "Build beautiful, interactive family trees with drag-and-drop simplicity",
      icon: <TreePine className="w-6 h-6" />,
      color: "from-teal-500/10 to-teal-600/10",
      borderColor: "border-teal-500/20",
      iconBg: "bg-teal-500/20",
      iconColor: "text-teal-400",
    },
    {
      title: "Health Tracking",
      description: "Monitor health patterns and hereditary conditions across generations",
      icon: <Heart className="w-6 h-6" />,
      color: "from-pink-500/10 to-pink-600/10",
      borderColor: "border-pink-500/20",
      iconBg: "bg-pink-500/20",
      iconColor: "text-pink-400",
    },
    {
      title: "AI-Powered Insights",
      description: "Get intelligent suggestions and health analysis from our AI assistant",
      icon: <Sparkles className="w-6 h-6" />,
      color: "from-blue-500/10 to-blue-600/10",
      borderColor: "border-blue-500/20",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      title: "Smart Connections",
      description: "Discover potential family connections through our community network",
      icon: <Network className="w-6 h-6" />,
      color: "from-orange-500/10 to-orange-600/10",
      borderColor: "border-orange-500/20",
      iconBg: "bg-orange-500/20",
      iconColor: "text-orange-400",
    },
  ]

  const benefits = [
    "Secure, encrypted data storage",
    "Unlimited family members",
    "AI health insights & reports",
    "Community suggestions",
    "Export & sharing tools",
    "24/7 customer support",
  ]

  const stats = [
    { number: "10K+", label: "Families Connected" },
    { number: "50K+", label: "Health Records" },
    { number: "99.9%", label: "Uptime" },
    { number: "256-bit", label: "Encryption" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-black text-white font-sans relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-10 pointer-events-none" />
      <AnimatedNodes />

      {/* Header */}
      <header className="relative z-20 flex items-center justify-between p-6 lg:p-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <TreePine className="h-6 w-6 text-teal-400" />
          </div>
          <span className="font-bold text-xl tracking-tight">TreeTrace</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-gray-400 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-gray-400 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/auth/login" className="text-gray-400 hover:text-white transition-colors">
            Login
          </Link>
          <Link href="/auth/signup">
            <Button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white border-0 shadow-lg">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center py-20 lg:py-32"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/50 rounded-full border border-gray-700/50 mb-8"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Now in Beta</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl lg:text-7xl font-bold mb-6"
          >
            <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Your Family Story
            </span>
            <br />
            <span className="text-white">Beautifully Connected</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed"
          >
            Build interactive family trees, track health patterns, and discover new connections with AI-powered
            insights. Preserve your heritage for future generations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
              >
                Start Your Tree
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-700 text-white hover:bg-white/10 px-8 py-4 rounded-xl transition-all duration-300"
              onClick={() => setShowVideo(true)}
            >
              Watch Demo
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-teal-400 mb-2">{stat.number}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* Video Modal */}
        {showVideo && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-4xl bg-gray-900 rounded-xl overflow-hidden">
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-4 right-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <div className="aspect-video">
                <video
                  className="w-full h-full"
                  controls
                  autoPlay
                >
                  <source src="/TreeTrace-Demo.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        )}

        {/* App Preview */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
          className="mb-32"
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-70" />
            <div className="relative rounded-2xl overflow-hidden border border-gray-800/50 shadow-2xl">
              <Image
                src="/treetrace.png"
                alt="TreeTrace Application Preview"
                width={1200}
                height={600}
                className="w-full object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          </div>
        </motion.section>

        {/* Features Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-32"
          id="features"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Powerful tools to build, explore, and preserve your family heritage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`rounded-2xl bg-gradient-to-br ${feature.color} backdrop-blur-sm border ${feature.borderColor} p-8 hover:scale-105 transition-all duration-300 group`}
              >
                <div
                  className={`${feature.iconBg} p-3 rounded-xl w-fit mb-6 group-hover:scale-110 transition-transform`}
                >
                  <div className={feature.iconColor}>{feature.icon}</div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Health Focus Section */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="mb-32"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-pink-400 to-red-400 bg-clip-text text-transparent">
                  Health Heritage
                </span>
                <br />
                <span className="text-white">Matters</span>
              </h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Understanding your family's health history is crucial for making informed medical decisions. Track
                hereditary conditions and share vital information securely.
              </p>
              <div className="space-y-4">
                {benefits.slice(0, 3).map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <div className="p-1 bg-pink-500/20 rounded-full">
                      <Check className="w-4 h-4 text-pink-400" />
                    </div>
                    <span className="text-gray-200">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-red-500/20 rounded-2xl blur-xl opacity-70" />
              <div className="relative rounded-2xl overflow-hidden border border-gray-800/50 bg-gray-900/50 p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <Heart className="w-8 h-8 text-pink-400 mb-4" />
                    <div className="text-2xl font-bold text-white mb-2">Health Tracking</div>
                    <div className="text-gray-400 text-sm">Monitor conditions across generations</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50">
                    <Activity className="w-8 h-8 text-blue-400 mb-4" />
                    <div className="text-2xl font-bold text-white mb-2">AI Analysis</div>
                    <div className="text-gray-400 text-sm">Get intelligent health insights</div>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700/50 col-span-2">
                    <Shield className="w-8 h-8 text-green-400 mb-4" />
                    <div className="text-2xl font-bold text-white mb-2">Secure & Private</div>
                    <div className="text-gray-400 text-sm">Your health data is encrypted and protected</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* CTA Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center py-20 mb-20"
        >
          <div className="rounded-2xl bg-gradient-to-r from-teal-900/30 to-blue-900/30 backdrop-blur-sm border border-teal-500/20 p-12">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-teal-400 to-blue-400 bg-clip-text text-transparent">
                Start Your Journey
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
              Join thousands of families preserving their heritage and health history with TreeTrace
            </p>
            <Link href="/auth/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white px-12 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg flex items-center gap-3 mx-auto"
              >
                Create Your Family Tree
                <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="border-t border-gray-800/50 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <TreePine className="h-5 w-5 text-teal-400" />
              </div>
              <span className="font-bold text-lg tracking-tight">TreeTrace</span>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors text-sm">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white transition-colors text-sm">
                Terms of Service
              </Link>
              <div className="text-gray-500 text-sm">© {new Date().getFullYear()} TreeTrace. All rights reserved.</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
