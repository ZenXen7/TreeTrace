"use client"

import { useEffect, useState, useCallback } from "react"

export function usePerformance() {
  const [isVisible, setIsVisible] = useState(false)
  const [isReducedMotion, setIsReducedMotion] = useState(false)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setIsReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches)
    }

    mediaQuery.addEventListener("change", handleChange)
    return () => mediaQuery.removeEventListener("change", handleChange)
  }, [])

  const createIntersectionObserver = useCallback(
    (callback: (isVisible: boolean) => void, options?: IntersectionObserverInit) => {
      return new IntersectionObserver(
        ([entry]) => {
          callback(entry.isIntersecting)
        },
        {
          threshold: 0.1,
          rootMargin: "50px",
          ...options,
        }
      )
    },
    []
  )

  const debounce = useCallback((func: Function, wait: number) => {
    let timeout: NodeJS.Timeout
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }, [])

  const throttle = useCallback((func: Function, limit: number) => {
    let inThrottle: boolean
    return function executedFunction(...args: any[]) {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }, [])

  const prefetchRoute = useCallback((href: string) => {
    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = href
    document.head.appendChild(link)
  }, [])

  const preloadImage = useCallback((src: string) => {
    const img = new Image()
    img.src = src
  }, [])

  return {
    isReducedMotion,
    createIntersectionObserver,
    debounce,
    throttle,
    prefetchRoute,
    preloadImage,
  }
}