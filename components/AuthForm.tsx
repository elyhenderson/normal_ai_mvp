'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function AuthForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [error, setError] = useState('')

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (data.user) {
          router.push('/dashboard') // Redirect to dashboard after successful login
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        alert('Check your email for the confirmation link!')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm p-8 bg-white rounded-2xl shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {mode === 'signin' 
            ? 'Sign in to continue to Normal AI'
            : 'Start your journey with Normal AI'}
        </p>
      </div>

      <form onSubmit={handleAuth} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 
                     focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     transition-colors"
            placeholder="••••••••"
            required
          />
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full bg-black text-white py-3 rounded-xl font-medium
                   hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>

        <div className="text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  )
} 