'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export default function SelectMode() {
  const router = useRouter()

  const handleModeSelect = (mode: 'guided' | 'freestyle') => {
    router.push(`/onboarding/${mode}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            How would you like to build your Brand Brain?
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Choose the creative process that works best for you
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Guided Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeSelect('guided')}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-blue-500 opacity-20 blur-2xl"></div>
            <div className="relative">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Guided Experience
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We'll ask 30 deeply creative questions to build a brand aligned with your soul.
              </p>
              <div className="mt-6 flex items-center text-blue-600 dark:text-blue-400">
                <span>Get started</span>
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.button>

          {/* Freestyle Option */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleModeSelect('freestyle')}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-purple-500 opacity-20 blur-2xl"></div>
            <div className="relative">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Freestyle
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Write your brand idea in your own words and attach images or vibes.
              </p>
              <div className="mt-6 flex items-center text-purple-600 dark:text-purple-400">
                <span>Start creating</span>
                <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  )
} 