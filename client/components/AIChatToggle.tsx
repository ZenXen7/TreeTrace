'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export default function AIChatToggle({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed right-0 top-1/2 transform -translate-y-1/2 p-4 rounded-l-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 transition-colors z-50 flex items-center justify-center`}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      style={{ width: 56, height: 56 }}
    >
      <MessageSquare className="w-6 h-6" />
    </motion.button>
  );
} 