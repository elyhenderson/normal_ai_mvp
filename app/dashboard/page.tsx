'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../../utils/supabase'
import Image from 'next/image'

interface Brand {
  id: string
  name: string
  description: string
  created_at: string
  brand_type: string
}

interface BrainData {
  id: string
  brand_name: string
  archetype_primary: string
  archetype_secondary: string
  color_palette: {
    primary: string
    secondary: string
    accent: string
    neutral: string
  }
  logo_url?: string
  mockup_urls?: string[] | string | null
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [brains, setBrains] = useState<Record<string, BrainData[]>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGeneratingMockups, setIsGeneratingMockups] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    async function fetchData() {
      if (!user) return

      try {
        // Fetch brands
        const { data: brandsData, error: brandsError } = await supabase
          .from('brands')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (brandsError) throw brandsError

        setBrands(brandsData)

        // Fetch brains for each brand
        const { data: brainsData, error: brainsError } = await supabase
          .from('brand_brains')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (brainsError) throw brainsError
        
        // Group brains by brand name
        const brainsByBrand: Record<string, BrainData[]> = {}
        brainsData?.forEach(brain => {
          if (!brainsByBrand[brain.brand_name]) {
            brainsByBrand[brain.brand_name] = []
          }
          brainsByBrand[brain.brand_name].push(brain)
        })
        setBrains(brainsByBrand)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const generateMockups = async (brand: Brand, brainData: BrainData) => {
    if (!brainData.logo_url) {
      alert('Please generate a logo first before creating mockups.')
      return
    }

    setIsGeneratingMockups(prev => ({ ...prev, [brand.id]: true }))
    setError(null)

    try {
      const res = await fetch('/api/generateMockups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_name: brand.name,
          brand_type: brand.brand_type,
          logo_url: brainData.logo_url,
          color_palette: brainData.color_palette,
          brain_id: brainData.id
        }),
      })

      const data = await res.json()
      if (data.error) {
        console.error('Error details:', data.details)
        setError(`Error: ${data.error}`)
      } else {
        // Update the local state with new mockup URLs
        setBrains(prev => ({
          ...prev,
          [brand.name]: prev[brand.name].map(brain => 
            brain.id === brainData.id 
              ? { ...brain, mockup_urls: data.mockupUrls }
              : brain
          )
        }))
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to generate mockups')
    } finally {
      setIsGeneratingMockups(prev => ({ ...prev, [brand.id]: false }))
    }
  }

  function getMockupUrls(mockupUrls: string[] | string | null | undefined): string[] {
    if (!mockupUrls) return [];
    if (Array.isArray(mockupUrls)) return mockupUrls;
    try {
      const parsed = JSON.parse(mockupUrls);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white shadow-sm dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Normal AI</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-300 mr-4">{user.email}</span>
              <button
                onClick={() => signOut()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Brands
            </h2>
            <button
              onClick={() => router.push('/onboarding/select-mode')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Create New Brand
            </button>
          </div>

          {brands.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
              <p className="text-gray-600 dark:text-gray-300">
                You haven't created any brands yet. Get started by creating your first brand!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {brands.map((brand) => {
                const brandBrains = brains[brand.name] || []
                const latestBrain = brandBrains[0]
                
                return (
                  <div key={brand.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {brand.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {brand.brand_type}
                          </p>
                        </div>
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => router.push(`/brand/${brand.id}/overview`)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Details
                          </button>
                          {latestBrain && (
                            <button
                              onClick={() => router.push(`/brand/${brand.id}/overview?brain_id=${latestBrain.id}`)}
                              className="inline-flex items-center px-3 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                              View Brain
                            </button>
                          )}
                        </div>
                      </div>

                      {latestBrain && (
                        <>
                          {/* Brain Info */}
                          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Archetype</h5>
                                <p className="text-gray-900 dark:text-white">{latestBrain.archetype_primary}</p>
                              </div>
                              <div>
                                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Secondary Archetype</h5>
                                <p className="text-gray-900 dark:text-white">{latestBrain.archetype_secondary}</p>
                              </div>
                            </div>
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Color Palette</h5>
                              <div className="flex space-x-2 mt-2">
                                {Object.entries(latestBrain.color_palette).map(([key, color]) => (
                                  <div
                                    key={key}
                                    className="h-6 w-6 rounded-full shadow-inner"
                                    style={{ backgroundColor: color }}
                                    title={`${key}: ${color}`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Logo Display */}
                          {latestBrain.logo_url && (
                            <div className="mb-6">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Brand Logo
                              </h4>
                              <div 
                                className="relative h-32 w-32 mx-auto rounded-lg overflow-hidden"
                                style={{ backgroundColor: latestBrain.color_palette.primary }}
                              >
                                <Image
                                  src={latestBrain.logo_url}
                                  alt={`${brand.name} logo`}
                                  fill
                                  style={{ objectFit: 'contain' }}
                                  className="p-2"
                                />
                              </div>
                            </div>
                          )}

                          {/* Mockups Section */}
                          <div className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Brand Mockups
                              </h4>
                              {!latestBrain.mockup_urls && (
                                <button
                                  onClick={() => generateMockups(brand, latestBrain)}
                                  disabled={isGeneratingMockups[brand.id]}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isGeneratingMockups[brand.id] ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      Generating Mockups...
                                    </>
                                  ) : (
                                    'Generate Mockups'
                                  )}
                                </button>
                              )}
                            </div>

                            {error && (
                              <div className="text-sm text-red-600 dark:text-red-500 mb-4">
                                {error}
                              </div>
                            )}

                            {latestBrain.mockup_urls ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getMockupUrls(latestBrain.mockup_urls).map((url: string, index: number) => {
                                  const mockupTypes = ['Billboard', 'Storefront', 'Product', 'Stationery', 'Environment'];
                                  return (
                                    <div key={url} className="relative aspect-square rounded-lg overflow-hidden shadow-lg">
                                      <Image
                                        src={url}
                                        alt={`${brand.name} ${mockupTypes[index]} mockup`}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="hover:scale-105 transition-transform duration-200"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            ) : latestBrain.logo_url ? (
                              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-400">
                                  Ready to generate photorealistic mockups for your brand
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-gray-600 dark:text-gray-400">
                                  Generate a logo first to create brand mockups
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Created {new Date(brand.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* New Mockup Board Section */}
        {brands.length > 0 && (
          <div className="mt-12 px-4 sm:px-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Brand Mockup Board
                </h2>

                {brands.map((brand) => {
                  const brandBrains = brains[brand.name] || []
                  const latestBrain = brandBrains[0]

                  if (!latestBrain) return null

                  return (
                    <div key={brand.id} className="mb-12 last:mb-0">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {brand.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {brand.brand_type}
                          </p>
                        </div>

                        {latestBrain.logo_url && !latestBrain.mockup_urls && (
                          <button
                            onClick={() => generateMockups(brand, latestBrain)}
                            disabled={isGeneratingMockups[brand.id]}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {isGeneratingMockups[brand.id] ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Creating Brand Mockups...
                              </>
                            ) : (
                              'Generate Brand Mockups'
                            )}
                          </button>
                        )}
                      </div>

                      {error && brand.id === Object.keys(isGeneratingMockups)[0] && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <p className="text-sm text-red-600 dark:text-red-400">
                            {error}
                          </p>
                        </div>
                      )}

                      {latestBrain.mockup_urls ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                          {(() => {
                            const urls: string[] = Array.isArray(latestBrain.mockup_urls) 
                              ? latestBrain.mockup_urls 
                              : JSON.parse(latestBrain.mockup_urls || '[]');
                            return urls.map((url: string, index: number) => {
                              const mockupTypes = ['Billboard', 'Storefront', 'Product', 'Stationery', 'Environment']
                              return (
                                <div key={url} className="flex flex-col">
                                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-lg">
                                    <Image
                                      src={url}
                                      alt={`${brand.name} ${mockupTypes[index]} mockup`}
                                      fill
                                      style={{ objectFit: 'cover' }}
                                      className="hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>
                                  <p className="mt-3 text-sm font-medium text-gray-900 dark:text-white text-center">
                                    {mockupTypes[index]} Mockup
                                  </p>
                                </div>
                              )
                            })
                          })()}
                        </div>
                      ) : latestBrain.logo_url ? (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400">
                            Ready to generate photorealistic mockups for your brand
                          </p>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <p className="text-gray-600 dark:text-gray-400">
                            Generate a logo first to create brand mockups
                          </p>
                        </div>
                      )}

                      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                          {latestBrain.logo_url && (
                            <div className="relative h-12 w-12 rounded overflow-hidden" style={{ backgroundColor: latestBrain.color_palette.primary }}>
                              <Image
                                src={latestBrain.logo_url}
                                alt={`${brand.name} logo`}
                                fill
                                style={{ objectFit: 'contain' }}
                                className="p-2"
                              />
                            </div>
                          )}
                          <div className="flex space-x-2">
                            {Object.entries(latestBrain.color_palette).map(([key, color]) => (
                              <div
                                key={key}
                                className="h-6 w-6 rounded-full shadow-inner"
                                style={{ backgroundColor: color }}
                                title={`${key}: ${color}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 