'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AnimatedNodes from '@/components/animated-nodes'

const features = [
  {
    title: 'User Registration & Profile Management',
    description: [
      'Create an account with email and username',
      'Secure login/logout with access to a personal dashboard',
      'Update profile details and delete account if needed'
    ],
    icon: '👤',
    colorClass: 'bg-blue-500/10'
  },
  {
    title: 'Family Tree Creation & Visualization',
    description: [
      'Add family members with key details (names, relationships, dates)',
      'Edit/delete nodes and modify the tree in real-time',
      'Choose from three visual views: Tabular, Line-Based, and Traditional Tree View'
    ],
    icon: '🧬',
    colorClass: 'bg-purple-500/10'
  },
  {
    title: 'Smart Filtering & Search',
    description: [
      'Filter family trees by generation, surname, date range, or branch',
      'Quickly locate specific people or sections with search functionality'
    ],
    icon: '🔍',
    colorClass: 'bg-green-500/10'
  },
  {
    title: 'Real-Time Collaboration',
    description: [
      'Invite family members with custom access levels (view-only, editor)',
      'Edit family trees simultaneously with real-time syncing',
      'Receive live notifications for edits, invites, and updates'
    ],
    icon: '👥',
    colorClass: 'bg-yellow-500/10'
  },
  {
    title: 'Family Tree Matching & Merging',
    description: [
      'Get notified when matches are found with other public trees',
      'Review, cross-reference, and merge family trees with common ancestors'
    ],
    icon: '🔗',
    colorClass: 'bg-red-500/10'
  },
  {
    title: 'Hereditary Health Tracking',
    description: [
      'Input health conditions for each family member',
      'View health data across generations with color-coded indicators',
      'Get visual reports showing possible hereditary risks and trends'
    ],
    icon: '❤️',
    colorClass: 'bg-pink-500/10'
  }
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