'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StudentEnrollmentRequest from './StudentEnrollmentRequest'

type ProgressReport = {
  id: string
  report_date: string
  grade: number
  feedback: string | null
  classrooms: {
    name: string
  } | null
}

export default function StudentView() {
  const [progress, setProgress] = useState<ProgressReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [studentProfile, setStudentProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        setUser(user)

        // Get student's profile and school_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('school_id')
          .eq('id', user.id)
          .single()

        if (profileError || !profile) {
          setError('Profile not found')
          setLoading(false)
          return
        }

        setStudentProfile(profile)

        // Fetch student's progress reports
        const { data: progressData, error: progressError } = await supabase
          .from('progress')
          .select(`
            id,
            report_date,
            grade,
            feedback,
            classrooms (
              name
            )
          `)
          .eq('student_id', user.id)
          .order('report_date', { ascending: false })
          .returns<ProgressReport[]>()

        if (progressError) {
          setError(`Could not fetch progress reports: ${progressError.message}`)
        } else {
          setProgress(progressData || [])
        }

        setLoading(false)
      } catch (err) {
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        <span className="ml-3 text-white">Loading your dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">{error}</p>
      </div>
    )
  }

  if (!user || !studentProfile) {
    return <div className="text-red-600">Authentication or profile data missing</div>
  }

  // Calculate average grade
  const averageGrade = progress.length > 0 
    ? Math.round(progress.reduce((sum, report) => sum + report.grade, 0) / progress.length)
    : 0

  return (
    <div className="space-y-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Your Academic Progress</h2>
            <p className="text-gray-200">Track your learning journey</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 backdrop-blur-lg rounded-2xl p-6 border border-cyan-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-cyan-100">Total Reports</p>
                <p className="text-3xl font-bold text-white">{progress.length}</p>
              </div>
              <div className="w-10 h-10 bg-cyan-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Average Grade</p>
                <p className="text-3xl font-bold text-white">{averageGrade}%</p>
              </div>
              <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Latest Grade</p>
                <p className="text-3xl font-bold text-white">
                  {progress.length > 0 ? `${progress[0].grade}%` : 'N/A'}
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {progress.length === 0 ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-200 mb-2">No Progress Reports Yet</h3>
            <p className="text-gray-300">Your teachers haven&apos;t added any progress reports yet. Check back later!</p>
          </div>
        </div>
      ) : (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="px-8 py-6 bg-white/5 border-b border-white/20">
            <h3 className="text-xl font-bold text-white">Progress Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                    Classroom
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {progress.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {report.classrooms?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(report.report_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        report.grade >= 90 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30' :
                        report.grade >= 80 ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' :
                        report.grade >= 70 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30' :
                        'bg-red-500/20 text-red-400 border border-red-400/30'
                      }`}>
                        {report.grade}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {report.feedback || 'No feedback provided'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Enrollment Request */}
      <StudentEnrollmentRequest 
        studentId={user.id}
        schoolId={studentProfile.school_id}
      />
    </div>
  )
}