"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export function AnimatedBackground() {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
  }>>([])

  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      duration: Math.random() * 5 + 8,
      delay: Math.random() * 5
    }))
    setParticles(newParticles)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/30"
          initial={{
            top: `${particle.y}%`,
            left: `${particle.x}%`,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            scale: [0, 1, 1, 0],
            opacity: [0, 0.5, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            boxShadow: "0 0 8px 2px rgba(255, 255, 255, 0.3)",
          }}
        />
      ))}
    </div>
  )
}