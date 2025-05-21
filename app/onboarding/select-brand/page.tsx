'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../../utils/supabase'

interface Brand {
  id: string
  name: string
  created_at: string
}

export default function SelectBrand() {
  const router = useRouter()
  const { user } = useAuth()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBrands() {
      if (!user) return
      
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('user_id', user.id)
      
      if (error) {
        console.error('Error fetching brands:', error)
        return
      }
      
      setBrands(data || [])
      setLoading(false)
    }

    fetchBrands()
  }, [user])

  const handleNewBrand = () => {
    router.push('/onboarding/select-mode')
  }

  const handleExistingBrand = (brandId: string) => {
    router.push(`/brand/${brandId}/overview`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome to Normal AI
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Let's get started with your brand
          </p>
        </div>

        <div className="space-y-6">
          <button
            onClick={handleNewBrand}
            className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10 transition-all duration-200 ease-in-out transform hover:scale-[1.02]"
          >
            Create New Brand
          </button>

          {brands.length > 0 && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  or select existing
                </span>
              </div>
            </div>
          )}

          {brands.length > 0 && (
            <div className="mt-6 space-y-4">
              {brands.map((brand) => (
                <button
                  key={brand.id}
                  onClick={() => handleExistingBrand(brand.id)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                >
                  <span>{brand.name}</span>
                  <svg
                    className="h-5 w-5 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 