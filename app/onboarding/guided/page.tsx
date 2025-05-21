'use client'

import { useRouter } from 'next/navigation'

export default function Guided() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Coming Soon
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Our guided creative experience is under construction. We're crafting 30 deeply creative questions to help build your perfect brand.
        </p>
        <button
          onClick={() => router.push('/onboarding/select-mode')}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    </div>
  )
} 