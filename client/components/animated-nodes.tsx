"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function AnimatedNodes() {
  const [nodes, setNodes] = useState<Array<{
    id: number;
    top: string;
    left: string;
    width: number;
    height: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
   
    const generatedNodes = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      width: Math.random() * 8 + 4,
      height: Math.random() * 8 + 4,
      duration: Math.random() * 5 + 8,
      delay: Math.random() * 5
    }));
    
    setNodes(generatedNodes);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {nodes.map((node) => (
        <motion.div 
          key={node.id}
          className="absolute rounded-full bg-white/30"
          initial={{ 
            top: node.top, 
            left: node.left,
            scale: 0,
            opacity: 0 
          }}
          animate={{ 
            scale: [0, 1, 1, 0],
            opacity: [0, 0.5, 0.5, 0] 
          }}
          transition={{ 
            duration: node.duration,
            repeat: Infinity,
            delay: node.delay,
            ease: "easeInOut"
          }}
          style={{
            width: `${node.width}px`,
            height: `${node.height}px`,
            boxShadow: '0 0 8px 2px rgba(255, 255, 255, 0.3)'
          }}
        />
      ))}
    </div>
  );
}
