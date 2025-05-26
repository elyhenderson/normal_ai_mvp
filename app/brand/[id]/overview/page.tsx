'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAuth } from '../../../context/AuthContext'
import { supabase } from '../../../../utils/supabase'
import Image from 'next/image'

interface Brand {
  id: string
  name: string
  description: string
  creation_method: string
  created_at: string
}

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
  hero_image_url?: string
  logo_url?: string
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
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [heroImageUrl, setHeroImageUrl] = useState<string | null>(null)
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

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
          setHeroImageUrl(brain.hero_image_url)
          setLogoUrl(brain.logo_url)
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
      {/* Hero Section */}
      {brainData && (
        <div className="relative h-64 md:h-96 overflow-hidden">
          {heroImageUrl ? (
            <>
              <Image
                src={heroImageUrl}
                alt={`${brand.name} hero image`}
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-gray-800"></div>
          )}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
            <div className="text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{brand.name}</h1>
              <p className="text-xl md:text-2xl text-gray-200">{brainData.tagline}</p>
              <div className="mt-4 flex space-x-4">
                <button
                  onClick={async () => {
                    try {
                      setIsGeneratingImage(true)
                      const res = await fetch('/api/generateHeroImage', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          brand_name: brand.name.trim(),
                          archetype_primary: brainData.archetype_primary,
                          archetype_secondary: brainData.archetype_secondary,
                          color_palette: brainData.color_palette,
                          photo_transformation: brainData.photo_transformation,
                          brain_id: brainData.id
                        }),
                      })
                      const data = await res.json()
                      if (data.error) {
                        console.error('Error details:', data.details)
                        alert(`Error: ${data.error}\n\nPlease check the console for more details.`)
                      } else {
                        setHeroImageUrl(data.imageUrl)
                      }
                    } catch (error) {
                      console.error('Error:', error)
                      alert('Failed to generate hero image. Please check the console for more details.')
                    } finally {
                      setIsGeneratingImage(false)
                    }
                  }}
                  disabled={isGeneratingImage}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50"
                >
                  {isGeneratingImage ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Hero Image...
                    </>
                  ) : (
                    'Generate Hero Image'
                  )}
                </button>

                <button
                  onClick={async () => {
                    try {
                      setIsGeneratingLogo(true)
                      const res = await fetch('/api/generateLogo', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          brand_name: brand.name.trim(),
                          archetype_primary: brainData.archetype_primary,
                          archetype_secondary: brainData.archetype_secondary,
                          color_palette: brainData.color_palette,
                          logo_direction: brainData.logo_direction,
                          brain_id: brainData.id
                        }),
                      })
                      const data = await res.json()
                      if (data.error) {
                        console.error('Error details:', data.details)
                        alert(`Error: ${data.error}\n\nPlease check the console for more details.`)
                      } else {
                        setLogoUrl(data.logoUrl)
                      }
                    } catch (error) {
                      console.error('Error:', error)
                      alert('Failed to generate logo. Please check the console for more details.')
                    } finally {
                      setIsGeneratingLogo(false)
                    }
                  }}
                  disabled={isGeneratingLogo}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-black bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white disabled:opacity-50"
                >
                  {isGeneratingLogo ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Generating Logo...
                    </>
                  ) : (
                    'Generate Logo'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                    <p className="text-gray-600 dark:text-gray-300">{brainData.archetype_primary}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Secondary Archetype</h3>
                    <p className="text-gray-600 dark:text-gray-300">{brainData.archetype_secondary}</p>
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
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {brainData.color_palette && Object.entries(brainData.color_palette).map(([name, color]) => (
                      <div key={name} className="flex flex-col items-center">
                        <div 
                          className="w-16 h-16 rounded-lg shadow-inner mb-2" 
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">{name}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-500 uppercase">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Font Suggestions */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Typography</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Headings</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.font_suggestions.headings}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body Text</h4>
                      <p className="text-gray-600 dark:text-gray-400">{brainData.font_suggestions.body}</p>
                    </div>
                  </div>
                </div>

                {/* Logo Direction */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Logo Direction</h3>
                  <p className="text-gray-600 dark:text-gray-400">{brainData.logo_direction}</p>
                </div>

                {/* Layout Style */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Layout Style</h3>
                  <p className="text-gray-600 dark:text-gray-400">{brainData.layout_style}</p>
                </div>

                {/* Photo Transformation */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Photo Treatment</h3>
                  <p className="text-gray-600 dark:text-gray-400">{brainData.photo_transformation}</p>
                </div>
              </div>
            </div>
          )}

          {/* Logo Display Section */}
          {logoUrl && (
            <div className="mb-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Brand Logo
              </h2>
              <div className="relative h-64 w-64 mx-auto overflow-hidden rounded-lg" style={{ backgroundColor: brainData?.color_palette?.primary || '#FFFFFF' }}>
                <Image
                  src={logoUrl}
                  alt={`${brand.name} logo`}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  className="p-4"
                />
              </div>
              <p className="mt-4 text-sm text-center text-gray-600 dark:text-gray-400">
                Generated logo for {brand.name}
              </p>
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

        {/* Bottom Hero Section Display */}
        {heroImageUrl && (
          <div className="mt-12 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Generated Hero Image
            </h2>
            <div className="relative h-[600px] w-full overflow-hidden rounded-lg">
              <Image
                src={heroImageUrl}
                alt={`${brand.name} hero image full view`}
                fill
                style={{ objectFit: 'cover' }}
                priority
                className="hover:scale-105 transition-transform duration-300"
              />
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Generated for {brand.name} using {brainData?.archetype_primary} and {brainData?.archetype_secondary} archetypes
            </p>
          </div>
        )}
      </main>
    </div>
  )
} 