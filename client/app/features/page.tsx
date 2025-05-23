'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AnimatedNodes from '@/components/animated-nodes'

const features = [
  {
    title: 'Family Tree Builder',
    description: [
      'Create and visualize your family tree with an intuitive drag-and-drop interface',
      'Add, edit, and connect relatives easily',
      'View your tree in a beautiful, interactive layout'
    ],
    icon: '🧬',
    colorClass: 'bg-green-500/10'
  },
  {
    title: 'Health Overview & Tracking',
    description: [
      'See a summary of health conditions across your family',
      'Filter and sort by condition or generation',
      'Export health data as CSV or generate custom PDF reports'
    ],
    icon: '❤️',
    colorClass: 'bg-red-500/10'
  },
  {
    title: 'Medical History Forms',
    description: [
      'Record and update each family member\'s medical history',
      'Track conditions, allergies, medications, and more',
      'Easily update information as your family grows'
    ],
    icon: '📋',
    colorClass: 'bg-amber-500/10'
  },
  {
    title: 'AI Health Assistant',
    description: [
      'Get instant health insights and risk analysis',
      'Ask questions about your family\'s health data',
      'Receive professional, AI-powered answers'
    ],
    icon: '✨',
    colorClass: 'bg-blue-500/10'
  },
  {
    title: 'Suggestions & Similar Trees',
    description: [
      'Discover new relatives and connections with smart suggestions',
      'Orange circle highlights similar family members or trees from the TreeTrace community',
      'Easily review and add suggested members to your tree'
    ],
    icon: '🟠',
    colorClass: 'bg-orange-500/10'
  },
  {
    title: 'Report Generation',
    description: [
      'Export your health overview or custom AI-generated reports as CSV or PDF',
      'Share and keep records of your family\'s health history'
    ],
    icon: '📄',
    colorClass: 'bg-purple-500/10'
  },
  {
    title: 'User Guide',
    description: [
      'Step-by-step instructions and tips to help you get started',
      'Find answers to common questions and learn about all features'
    ],
    icon: '📖',
    colorClass: 'bg-teal-500/10'
  },
  {
    title: 'Privacy & Security',
    description: [
      'Your data is encrypted and private',
      'Manage privacy settings and control who can see your information'
    ],
    icon: '🛡️',
    colorClass: 'bg-indigo-500/10'
  },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-black pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/tree-connections.svg')] bg-center opacity-15 pointer-events-none" />
      
      {/* Animated Background */}
      <AnimatedNodes />

      {/* Navigation */}
      <Link href="/" className="absolute top-8 left-8 z-10">
        <Button variant="ghost" className="text-gray-400 hover:text-white group flex items-center gap-2">
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Home</span>
        </Button>
      </Link>

      {/* Logo */}
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

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div 
          className="text-center space-y-6 pt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-4">
            🌳 TreeTrace Features
          </h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
            Discover the powerful tools and features that make TreeTrace the perfect platform for exploring and preserving your family heritage.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <Card className="h-full bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/5">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${feature.colorClass}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-100">{feature.title}</h3>
                  <ul className="space-y-2">
                    {feature.description.map((item, i) => (
                      <li key={i} className="text-gray-400 text-sm leading-relaxed flex items-start gap-2">
                        <span className="text-green-400 mt-1">✦</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          className="mt-24 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Start Your Journey?</h2>
          <Link href="/auth/signup">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-200 transition-colors rounded-full px-8 font-medium"
            >
              Create Your Family Tree
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}