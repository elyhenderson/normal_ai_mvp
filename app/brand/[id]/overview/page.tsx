'use client'

import { useEffect, useState, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@supabase/supabase-js'
import { useSearchParams } from 'next/navigation'

interface BrainData {
  id: string
  brand_name: string
  archetype_primary: string
  archetype_secondary: string
  tone: string
  voice_traits: string[]
  tagline: string
  brand_story: string
  color_palette: {
    primary: string
    secondary: string
    accent: string
    neutral: string
  }
  font_suggestions: {
    headings: string
    body: string
  }
  logo_direction: string
  layout_style: string
  photo_transformation: string
  created_at: string
  user_id: string
}

export default function BrandOverview({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const brainId = searchParams.get('brain_id')
  const [brainData, setBrainData] = useState<BrainData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchBrainData = async () => {
      try {
        // First get the brand name
        const { data: brand, error: brandError } = await supabase
          .from('brands')
          .select('name')
          .eq('id', resolvedParams.id)
          .single()

        if (brandError) {
          console.error('Error fetching brand:', brandError)
          setError('Failed to fetch brand information')
          setIsLoading(false)
          return
        }

        if (!brand) {
          console.error('Brand not found')
          setError('Brand not found')
          setIsLoading(false)
          return
        }

        console.log('Found brand:', brand)

        // Then get the brain data using the brand name
        const { data: brain, error: brainError } = await supabase
          .from('brand_brains')
          .select('*')
          .eq('brand_name', brand.name)
          .maybeSingle()

        if (brainError) {
          console.error('Error fetching brain:', brainError)
          setError('Failed to fetch brand brain')
          setIsLoading(false)
          return
        }

        if (!brain) {
          console.error('Brain not found for brand:', brand.name)
          setError('Brand brain not found')
          setIsLoading(false)
          return
        }

        console.log('Found brain:', brain)

        // Validate required fields
        const requiredFields = ['id', 'brand_name', 'tone', 'voice_traits', 'tagline', 'brand_story']
        const missingFields = requiredFields.filter(field => !brain[field])
        
        if (missingFields.length > 0) {
          console.error('Missing required fields:', missingFields)
          setError(`Missing required fields: ${missingFields.join(', ')}`)
          setIsLoading(false)
          return
        }

        // Only parse the text fields that need to be converted from JSON strings
        try {
          const parsedBrain = {
            ...brain,
            // These fields are already JSON objects from the database
            voice_traits: brain.voice_traits || [],
            color_palette: brain.color_palette || {},
            font_suggestions: brain.font_suggestions || {},
            // These fields need to be parsed from JSON strings
            logo_direction: typeof brain.logo_direction === 'string' ? JSON.parse(brain.logo_direction) : brain.logo_direction || {},
            layout_style: typeof brain.layout_style === 'string' ? JSON.parse(brain.layout_style) : brain.layout_style || {},
            photo_transformation: typeof brain.photo_transformation === 'string' ? JSON.parse(brain.photo_transformation) : brain.photo_transformation || {}
          }
          setBrainData(parsedBrain)
        } catch (parseError) {
          console.error('Error parsing JSON fields:', parseError)
          setError('Error parsing brain data')
        }
      } catch (error) {
        console.error('Error in fetchBrainData:', error)
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError('An unknown error occurred')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchBrainData()
  }, [resolvedParams.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading your brand vision...</p>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
          <p className="text-gray-600 dark:text-gray-400">Please try again or contact support if the problem persists.</p>
          <p className="text-sm text-gray-500 mt-2">Brand ID: {resolvedParams.id}</p>
        </div>
      </div>
    )
  }

  if (!brainData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Brand brain not found</p>
          <p className="text-sm text-gray-500 mt-2">Brand ID: {resolvedParams.id}</p>
        </div>
      </div>
    )
  }

  // Only parse the text fields that need to be converted from JSON strings
  const logoDirection = typeof brainData.logo_direction === 'string' ? JSON.parse(brainData.logo_direction) : brainData.logo_direction
  const layoutStyle = typeof brainData.layout_style === 'string' ? JSON.parse(brainData.layout_style) : brainData.layout_style
  const photoTransform = typeof brainData.photo_transformation === 'string' ? JSON.parse(brainData.photo_transformation) : brainData.photo_transformation

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-12"
          >
            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {brainData.tagline}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                {brainData.brand_story}
              </p>
            </motion.div>

            {/* Brand Identity Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Voice & Tone */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Voice & Tone
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tone</h3>
                    <p className="text-gray-600 dark:text-gray-400">{brainData.tone}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Voice Traits</h3>
                    <div className="flex flex-wrap gap-2">
                      {brainData.voice_traits.map((trait, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                        >
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Visual Identity */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Visual Identity
                </h2>
                <div className="space-y-6">
                  {/* Color Palette */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Palette</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(brainData.color_palette).map(([name, color]) => (
                        <div key={name} className="space-y-2">
                          <div
                            className="w-full h-24 rounded-lg shadow-inner"
                            style={{ backgroundColor: color as string }}
                          />
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                            {name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Typography */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Typography</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Headings</p>
                        <p className="text-2xl" style={{ fontFamily: brainData.font_suggestions.headings }}>
                          {brainData.font_suggestions.headings}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Body</p>
                        <p style={{ fontFamily: brainData.font_suggestions.body }}>
                          {brainData.font_suggestions.body}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Logo Direction */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Logo Direction
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Style</h3>
                    <p className="text-gray-600 dark:text-gray-400">{logoDirection.style}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Elements</h3>
                    <div className="flex flex-wrap gap-2">
                      {logoDirection.elements?.map((element: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm"
                        >
                          {element}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Concepts</h3>
                    <div className="flex flex-wrap gap-2">
                      {logoDirection.concepts?.map((concept: string, index: number) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm"
                        >
                          {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Layout & Photography */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Layout & Photography
                </h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Layout Style</h3>
                    <div className="space-y-2">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Grid:</span> {layoutStyle.grid}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Spacing:</span> {layoutStyle.spacing}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Hierarchy:</span> {layoutStyle.hierarchy}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Photo Treatment</h3>
                    <div className="space-y-2">
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Style:</span> {photoTransform.style}
                      </p>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                          <span className="font-medium">Filters:</span>
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {photoTransform.filters?.map((filter: string, index: number) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm"
                            >
                              {filter}
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Mood:</span> {photoTransform.mood}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
} 