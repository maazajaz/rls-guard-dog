'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type School = {
  id: string
  name: string
}

type SignupFormProps = {
  schools: School[]
}

export default function SignupForm({ schools }: SignupFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            school_id: schoolId,
            // role will be set in a database trigger after profile creation
          },
        },
      })

      if (error) {
        console.error('Error signing up:', error)
        alert(`Signup failed: ${error.message}`)
      } else {
        // Redirect to a page that informs the user to check their email for verification
        router.push('/login?message=Check your email to confirm your account')
      }
    } catch (err) {
      console.error('Unexpected error during signup:', err)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="blob blob-1 animation-delay-2s"></div>
        <div className="blob blob-2 animation-delay-4s"></div>
        <div className="blob blob-3 animation-delay-6s"></div>
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-gray-200">Join your school&apos;s educational platform</p>
          </div>

          {/* Form */}
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-semibold text-gray-200 mb-2">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="block w-full px-4 py-3 text-white placeholder-gray-300 border border-white/20 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label htmlFor="school" className="block text-sm font-semibold text-gray-200 mb-2">
                Select Your School
              </label>
              <select
                id="school"
                name="school"
                required
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="block w-full px-4 py-3 text-white border border-white/20 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
              >
                <option value="" className="bg-gray-800 text-gray-200">-- Select a school --</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id} className="bg-gray-800 text-gray-200">
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 text-white placeholder-gray-300 border border-white/20 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 text-white placeholder-gray-300 border border-white/20 rounded-xl shadow-sm bg-white/10 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200"
                placeholder="Create a password"
              />
            </div>
            
            <button
              type="submit"
              className="w-full px-6 py-3 text-white font-semibold bg-gradient-to-r from-emerald-500 to-cyan-600 rounded-xl shadow-xl hover:from-emerald-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Sign Up
            </button>
          </form>
          
          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-200">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors duration-200">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
