"use client";

import React from "react";
import { motion } from "framer-motion";

export default function SuggestionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {children}
    </motion.main>
  );
} 