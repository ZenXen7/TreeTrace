"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronRight, BookOpen, Shield, MessageSquare, Heart, Database, Lock, Share2 } from "lucide-react"
import Link from "next/link"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from "@/components/ui/card"
import { Dna, Trees, Network, FileSearch, ShieldCheck } from "lucide-react"

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
          <Link href="/auth/login">
      <Button size="lg" className="bg-white text-black hover:bg-gray-200 transition-colors rounded-full px-8 font-medium flex items-center">
        Start Your Tree
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>

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
       
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-70" />

          <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
            <Image
              src="/treetrace.png?height=600&width=1200"
              alt="TreeTrace Preview"
              width={1200}
              height={600}
              className="w-full object-cover bg-gray-900"
            />

           
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-32 mb-16"
        >
          <h2 className="text-4xl font-bold mb-16 bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 text-center">
            TreeTrace Features
          </h2>

          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {carouselFeatures.map((feature, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    <Card className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 border-gray-800 hover:border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-xl mb-6 flex items-center justify-center ${feature.colorClass}`}>
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-3 text-gray-100">
                          {feature.title}
                        </h3>
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400" />
            <CarouselNext className="hidden md:flex bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-400" />
          </Carousel>
        </motion.div>

        
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="py-24 relative"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ x: -50 }}
                animate={{ x: 0 }}
                transition={{ delay: 1.4 }}
              >
                <h2 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-red-300 to-red-100">
                  Track Health History
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                  Understand your family's health background better. Track hereditary conditions and share important health information with family members securely.
                </p>
                <div className="space-y-4">
                  {healthFeatures.map((feature, index) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.6 + index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="mt-1 bg-red-900/20 p-1.5 rounded-lg">
                        <Heart className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-200">{feature.title}</h3>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ x: 50 }}
                animate={{ x: 0 }}
                transition={{ delay: 1.4 }}
                className="relative"
              >
                <div className="absolute -inset-4 bg-gradient-to-r from-red-500/10 to-purple-500/10 rounded-xl blur-xl" />
                <div className="relative rounded-xl overflow-hidden border border-gray-800">
                  <Image
                    src="/health-tracking.png"
                    alt="Health Tracking Feature"
                    width={600}
                    height={400}
                    className="w-full"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

const healthFeatures = [
  {
    title: "Medical History Tracking",
    description: "Record and track hereditary conditions across generations"
  },
  {
    title: "Secure Sharing",
    description: "Share medical history with family members and healthcare providers"
  },
  {
    title: "Health Insights",
    description: "Understand patterns and potential health risks in your family"
  }
]

const privacyFeatures = [
  {
    title: "Data Encryption",
    description: "Your family data is encrypted and securely stored",
    icon: <Shield className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Privacy Controls",
    description: "Granular control over who can see your family information",
    icon: <Lock className="h-6 w-6 text-blue-400" />
  },
  {
    title: "Regular Backups",
    description: "Automatic backups ensure your family history is never lost",
    icon: <Database className="h-6 w-6 text-blue-400" />
  }
]

const collaborationFeatures = [
  {
    title: "Real-time Updates",
    description: "See changes as they happen",
    icon: <Share2 className="h-5 w-5 text-green-400" />
  },
  {
    title: "Family Chat",
    description: "Discuss and share memories",
    icon: <MessageSquare className="h-5 w-5 text-green-400" />
  },
  {
    title: "Photo Sharing",
    description: "Share and preserve photos",
    icon: <BookOpen className="h-5 w-5 text-green-400" />
  },
  {
    title: "Access Control",
    description: "Manage who can contribute",
    icon: <Lock className="h-5 w-5 text-green-400" />
  }
]

const carouselFeatures = [
  {
    title: "Family Tree Builder",
    description: "Create beautiful, interactive family trees with our intuitive drag-and-drop interface. Add important dates with ease.",
    icon: <Trees className="w-6 h-6" />,
    colorClass: "bg-gradient-to-br from-green-500/20 to-green-600/20 text-green-400",
  },
  {
    title: "DNA Matching",
    description: "Connect with relatives through our advanced DNA matching system. Find common ancestors and expand your family network.",
    icon: <Dna className="w-6 h-6" />,
    colorClass: "bg-gradient-to-br from-blue-500/20 to-blue-600/20 text-blue-400",
  },
  {
    title: "Health Tracking",
    description: "Monitor hereditary health patterns and share important medical history with family members securely.",
    icon: <Heart className="w-6 h-6" />,
    colorClass: "bg-gradient-to-br from-red-500/20 to-red-600/20 text-red-400",
  },
  {
    title: "Smart Search",
    description: "Find ancestors quickly with our intelligent search system that understands name variations and historical contexts.",
    icon: <FileSearch className="w-6 h-6" />,
    colorClass: "bg-gradient-to-br from-amber-500/20 to-amber-600/20 text-amber-400",
  },
  {
    title: "Network Analysis",
    description: "Visualize and analyze complex family relationships with our advanced network visualization tools.",
    icon: <Network className="w-6 h-6" />,
    colorClass: "bg-gradient-to-br from-purple-500/20 to-purple-600/20 text-purple-400",
  },
  {
    title: "Privacy Control",
    description: "Maintain complete control over your family data with granular privacy settings and encrypted storage.",
    icon: <ShieldCheck className="w-6 h-6" />,
    colorClass: "bg-gradient-to-br from-indigo-500/20 to-indigo-600/20 text-indigo-400",
  },
]

