'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../../utils/supabase'

interface Brand {
  id: string
  name: string
  description: string
  creation_method: string
  created_at: string
}

interface BrainData {
  id: string
  brand_story: string
  tagline: string
  tone: string
  voice_traits: string[]
  primary_archetype: string
  secondary_archetype: string
  blob_behavior: {
    movement: string
    speed: string
    complexity: string
  }
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
  logo_direction: {
    style: string
    elements: string[]
    concepts: string[]
  }
  layout_style: {
    grid: string
    spacing: string
    hierarchy: string
  }
  photo_transform: {
    style: string
    filters: string[]
    mood: string
  }
}

export default function BrandOverview() {
  const params = useParams()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [brainData, setBrainData] = useState<BrainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isGptLoading, setIsGptLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        // Fetch brand data
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select('*')
          .eq('id', params.id)
          .single()

        if (brandError) throw brandError
        setBrand(brandData)

        // Fetch brain data if brain_id is present
        const brainId = searchParams.get('brain_id')
        if (brainId) {
          const { data: brain, error: brainError } = await supabase
            .from('brand_brains')
            .select('*')
            .eq('id', brainId)
            .single()

          if (brainError) throw brainError
          setBrainData(brain)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, params.id, searchParams])

  const handleGptTest = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGptLoading(true)
    try {
      const res = await fetch('/api/test-gpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })
      const data = await res.json()
      setResponse(data.result)
    } catch (error) {
      console.error('Error:', error)
      setResponse('Error: Failed to get response from GPT')
    } finally {
      setIsGptLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Brand not found</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">This brand doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{brand.name}</h1>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Brand Description */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Brand Description
            </h2>
            <div className="prose dark:prose-invert">
              <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                {brand.description}
              </p>
            </div>
          </div>

          {/* Brain Data Display */}
          {brainData && (
            <div className="space-y-6">
              {/* Core Brand Elements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Core Brand Elements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Brand Story</h3>
                    <p className="text-gray-600 dark:text-gray-300">{brainData.brand_story}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tagline</h3>
                    <p className="text-gray-600 dark:text-gray-300">{brainData.tagline}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tone</h3>
                    <p className="text-gray-600 dark:text-gray-300">{brainData.tone}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Voice Traits</h3>
                    <div className="flex flex-wrap gap-2">
                      {brainData.voice_traits.map((trait, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                          {trait}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Archetypes */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Brand Archetypes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Primary Archetype</h3>
                    <p className="text-gray-600 dark:text-gray-300">{brainData.primary_archetype}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secondary Archetype</h3>
                    <p className="text-gray-600 dark:text-gray-300">{brainData.secondary_archetype}</p>
                  </div>
                </div>
              </div>

              {/* Visual Elements */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Visual Elements
                </h2>
                
                {/* Color Palette */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Color Palette</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(brainData.color_palette).map(([name, color]) => (
                      <div key={name} className="text-center">
                        <div 
                          className="w-full h-20 rounded-lg mb-2" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                          {name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Typography</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Headings</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.font_suggestions.headings}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.font_suggestions.body}</p>
                    </div>
                  </div>
                </div>

                {/* Logo Direction */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logo Direction</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Style</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.logo_direction.style}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Elements</h4>
                      <div className="flex flex-wrap gap-2">
                        {brainData.logo_direction.elements.map((element, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                            {element}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Concepts</h4>
                      <div className="flex flex-wrap gap-2">
                        {brainData.logo_direction.concepts.map((concept, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                            {concept}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Layout Style */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Layout Style</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grid</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.layout_style.grid}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Spacing</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.layout_style.spacing}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hierarchy</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.layout_style.hierarchy}</p>
                    </div>
                  </div>
                </div>

                {/* Photo Transform */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Photo Treatment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Style</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.photo_transform.style}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filters</h4>
                      <div className="flex flex-wrap gap-2">
                        {brainData.photo_transform.filters.map((filter, index) => (
                          <span key={index} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                            {filter}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mood</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.photo_transform.mood}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* GPT Test Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Test GPT Integration
            </h2>
            <form onSubmit={handleGptTest} className="space-y-4">
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enter your prompt
                </label>
                <textarea
                  id="prompt"
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Ask GPT something..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isGptLoading || !prompt.trim()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {isGptLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    'Send to GPT'
                  )}
                </button>
              </div>
            </form>

            {response && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Response:</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{response}</p>
                </div>
              </div>
            )}
          </div>

          {/* Brain Creation Test Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Test Brain Creation
            </h2>
            <form onSubmit={async (e) => {
              e.preventDefault()
              try {
                const res = await fetch('/api/createBrain', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    user_id: user?.id,
                    input: brand.description
                  }),
                })
                const data = await res.json()
                if (data.error) {
                  alert('Error: ' + data.error)
                } else {
                  alert('Brain created successfully! ID: ' + data.id)
                }
              } catch (error) {
                console.error('Error:', error)
                alert('Failed to create brain')
              }
            }} className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                This will create a brain using your brand description as input.
              </p>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create Brain
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
} 