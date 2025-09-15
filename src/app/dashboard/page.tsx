import { createClient } from '@/lib/supabase/server'
import StudentView from '@/components/StudentView'
import TeacherView from '@/components/TeacherView'
import HeadTeacherView from '@/components/HeadTeacherView'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, full_name, school_id')
    .eq('id', user.id)
    .single()

  // Debug logging
  console.log('User ID:', user.id)
  console.log('Profile data:', profile)
  console.log('Profile error:', profileError)

  const handleSignOut = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  const renderView = () => {
    if (profileError) {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-white/20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile Error</h3>
          <p className="text-red-600 mb-4 font-medium">{profileError.message}</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <p className="text-gray-600">Error Code: <span className="font-mono text-gray-800">{profileError.code}</span></p>
            <p className="text-gray-600">User ID: <span className="font-mono text-gray-800">{user.id}</span></p>
            <p className="text-gray-600">This might be a Row Level Security (RLS) policy issue.</p>
          </div>
        </div>
      )
    }

    if (!profile) {
      return (
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-white/20">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-4">No profile found. This might be a database issue.</p>
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
            <p className="text-gray-600">User ID: <span className="font-mono text-gray-800">{user.id}</span></p>
            <p className="text-gray-600">Try signing out and back in, or contact support.</p>
          </div>
        </div>
      )
    }

    switch (profile?.role) {
      case 'student':
        return <StudentView />
      case 'teacher':
        return <TeacherView />
      case 'head_teacher':
        return <HeadTeacherView />
      default:
        return (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center border border-white/20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 3v6m0 6v6m6-12h-6m-6 0h6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Role Assignment Needed</h3>
            <p className="text-gray-600 mb-4">You do not have a role assigned.</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
              <p className="text-gray-600">Profile found but role is: <span className="font-mono text-gray-800">{profile?.role || 'null'}</span></p>
              <p className="text-gray-600">Contact your administrator to assign a role.</p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="relative z-10 container mx-auto p-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 mb-8 border border-white/20">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Welcome back, <span className="text-yellow-300">{profile?.full_name || user.email}</span>
              </h1>
              <p className="text-gray-200 text-lg">
                {profile?.role ? `Role: ${profile.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}` : 'Loading your dashboard...'}
              </p>
            </div>
            <form action={handleSignOut}>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-2xl hover:from-red-600 hover:to-pink-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 font-semibold text-lg"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
        
        {/* Main Content */}
        {renderView()}
      </div>
    </div>
  )
}
