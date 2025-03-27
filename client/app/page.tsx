"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronRight, Leaf, Users, BookOpen } from "lucide-react"

export default function Home() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  }

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {/* Hero gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div initial="initial" animate="animate" variants={staggerContainer} className="text-center space-y-10">
          <motion.div variants={fadeIn} className="inline-block mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-800 text-gray-300 border border-gray-700">
              <span className="mr-1 text-green-400">✦</span> Launching Soon
            </span>
          </motion.div>

          <motion.h1 variants={fadeIn} className="text-5xl sm:text-7xl font-bold tracking-tight">
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100">
              Your Family Story,
            </span>
            <span className="block bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-300 to-gray-100 mt-2">
              Beautifully Connected
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-gray-400 text-xl max-w-2xl mx-auto leading-relaxed font-light">
            Build, explore, and preserve your family heritage with TreeTrace's intuitive family tree builder.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 transition-colors rounded-full px-8 font-medium"
            >
              Start Your Tree <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-gray-700 text-white hover:bg-white/10 rounded-full px-8 font-medium"
            >
              Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="mt-28 relative"
        >
          {/* Glow effect behind the image */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-70" />

          <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
            <Image
              src="/placeholder.svg?height=600&width=1200"
              alt="TreeTrace Preview"
              width={1200}
              height={600}
              className="w-full object-cover bg-gray-900"
            />

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-32 mb-16 text-center"
        >
          <h2 className="text-3xl font-bold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400">
            Why Choose TreeTrace
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9 + index * 0.2, duration: 0.6 }}
                className="p-8 rounded-2xl bg-gradient-to-b from-gray-800/50 to-gray-900/50 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all group"
              >
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-3 rounded-xl inline-flex mb-6 group-hover:from-gray-600 group-hover:to-gray-700 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-gray-100">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

const features = [
  {
    title: "Easy Tree Building",
    description:
      "Intuitive tools to create and manage your family tree with just a few clicks. Add relatives, photos, and stories seamlessly.",
    icon: <Leaf className="h-6 w-6 text-green-400" />,
  },
  {
    title: "Smart Connections",
    description:
      "Discover potential family links through our advanced matching system that helps you find missing branches in your family tree.",
    icon: <Users className="h-6 w-6 text-blue-400" />,
  },
  {
    title: "Preserve History",
    description:
      "Save stories, photos, and documents to keep your family heritage alive for generations to come with secure cloud storage.",
    icon: <BookOpen className="h-6 w-6 text-purple-400" />,
  },
]

