"use client"
import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Send, X, Bot, User, Sparkles } from "lucide-react"
import { AIService } from "@/services/ai.service"


interface AIChatSidebarProps {
  isOpen: boolean
  onClose: () => void
  allFamilyData: any[]
  title?: string
}

export default function AIChatSidebar({
  isOpen,
  onClose,
  allFamilyData,
  title = "AI Health Assistant",
}: AIChatSidebarProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const aiService = AIService.getInstance()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMessage = input.trim()
    setInput("")
    setMessages((prev) => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)
    try {
      const response = await aiService.askGemini(userMessage, allFamilyData)
      setMessages((prev) => [...prev, { role: "assistant", content: response }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-96 bg-gradient-to-b from-gray-900 to-gray-950 border-l border-gray-800/50 shadow-2xl flex flex-col z-50"
            style={{
              boxShadow: "-10px 0 25px -5px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-800/50 bg-gray-900/80 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-lg font-medium text-white">{title}</h2>
                  <p className="text-xs text-gray-400">Powered by AI</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {messages.length > 0 && (
                  <button
                    onClick={clearChat}
                    className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                    title="Clear chat"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <div className="p-4 bg-teal-500/10 rounded-full">
                    <Bot className="w-8 h-8 text-teal-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white mb-2">Welcome to AI Health Assistant</h3>
                    <p className="text-gray-400 text-sm max-w-xs">
                      Ask me anything about your family's health data, patterns, or medical insights.
                    </p>
                  </div>
                  <div className="space-y-2 w-full">
                    <button
                      onClick={() => setInput("What health patterns do you see in my family?")}
                      className="w-full p-3 text-left bg-gray-800/50 hover:bg-gray-800/70 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      What health patterns do you see in my family?
                    </button>
                    <button
                      onClick={() => setInput("Are there any hereditary risks I should know about?")}
                      className="w-full p-3 text-left bg-gray-800/50 hover:bg-gray-800/70 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      Are there any hereditary risks I should know about?
                    </button>
                  </div>
                </div>
              )}

              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} items-start space-x-2`}
                >
                  {message.role === "assistant" && (
                    <div className="flex-shrink-0 p-1.5 bg-teal-500/20 rounded-full mt-1">
                      <Bot className="w-4 h-4 text-teal-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-lg"
                        : "bg-gray-800/80 text-gray-100 border border-gray-700/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="flex-shrink-0 p-1.5 bg-gray-700 rounded-full mt-1">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start items-start space-x-2"
                >
                  <div className="flex-shrink-0 p-1.5 bg-teal-500/20 rounded-full mt-1">
                    <Bot className="w-4 h-4 text-teal-400" />
                  </div>
                  <div className="bg-gray-800/80 border border-gray-700/50 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-400">Analyzing your data...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-800/50 bg-gray-900/50 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about health patterns, risks, or insights..."
                    className="w-full bg-gray-800/80 text-white rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:bg-gray-800 transition-all duration-200 placeholder-gray-500 border border-gray-700/50"
                    disabled={isLoading}
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-teal-600 shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>Press Enter to send</span>
                  <span>{input.length}/500</span>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
