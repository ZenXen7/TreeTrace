"use client"

import dynamic from 'next/dynamic'
import { Suspense } from 'react'

// Dynamically import the treeview component to ensure it only runs on client-side
const TreeViewPage = dynamic(() => import('./TreeViewPage'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
          <div className="w-8 h-8 text-teal-400 animate-pulse">🌳</div>
        </div>
        <p className="text-gray-400">Loading family tree...</p>
      </div>
    </div>
  )
})

export default function TreeViewWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-teal-500/20 rounded-full flex items-center justify-center mb-4">
            <div className="w-8 h-8 text-teal-400 animate-pulse">🌳</div>
          </div>
          <p className="text-gray-400">Loading family tree...</p>
        </div>
      </div>
    }>
      <TreeViewPage />
    </Suspense>
  )
}
