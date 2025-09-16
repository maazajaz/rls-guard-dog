'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type Classroom = {
  id: string
  name: string
  classroom_teachers: {
    profiles: {
      full_name: string | null
    } | null
  }[]
}

type EnrollmentRequest = {
  id: string
  classroom_id: string
  status: 'pending' | 'approved' | 'rejected'
  request_message: string | null
  teacher_response: string | null
  created_at: string
  classrooms: {
    name: string
  }[] | null
}

export default function StudentEnrollmentRequest({ 
  studentId, 
  schoolId 
}: { 
  studentId: string
  schoolId: string 
}) {
  const [availableClassrooms, setAvailableClassrooms] = useState<Classroom[]>([])
  const [enrollmentRequests, setEnrollmentRequests] = useState<EnrollmentRequest[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [requestMessage, setRequestMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  const fetchAvailableClassrooms = useCallback(async () => {
    try {
      // Get classrooms student is already enrolled in
      const { data: enrolledClassrooms } = await supabase
        .from('student_classrooms')
        .select('classroom_id')
        .eq('student_id', studentId)

      const enrolledIds = enrolledClassrooms?.map(ec => ec.classroom_id) || []

      // Get pending requests to exclude them too (handle if table doesn't exist)
      let pendingRequests: { classroom_id: string }[] = []
      try {
        const { data } = await supabase
          .from('enrollment_requests')
          .select('classroom_id')
          .eq('student_id', studentId)
          .eq('status', 'pending')
        
        pendingRequests = data || []
      } catch {
        // Table might not exist yet, continue without it
      }

      const pendingIds = pendingRequests?.map(pr => pr.classroom_id) || []
      const excludeIds = [...enrolledIds, ...pendingIds]

      // Get all classrooms in the school first
      const { data: allClassrooms } = await supabase
        .from('classrooms')
        .select(`
          id,
          name,
          school_id
        `)
        .eq('school_id', schoolId)

      // For each classroom, try to get teacher info (but don't exclude if no teacher)
      const classroomsWithTeachers = []
      if (allClassrooms) {
        for (const classroom of allClassrooms) {
          const { data: teachers } = await supabase
            .from('classroom_teachers')
            .select(`
              profiles (
                full_name
              )
            `)
            .eq('classroom_id', classroom.id)
            .limit(1)

          classroomsWithTeachers.push({
            ...classroom,
            classroom_teachers: teachers || []
          })
        }
      }

      // Filter out enrolled and pending classrooms
      const availableClassrooms = classroomsWithTeachers?.filter(classroom => 
        !excludeIds.includes(classroom.id)
      ) || []

      setAvailableClassrooms(availableClassrooms as unknown as Classroom[])
    } catch (error) {
      console.error('Error fetching available classrooms:', error)
    }
  }, [studentId, schoolId, supabase])

  const fetchEnrollmentRequests = useCallback(async () => {
    try {
      let requests: EnrollmentRequest[] = []
      try {
        const { data } = await supabase
          .from('enrollment_requests')
          .select(`
            id,
            classroom_id,
            status,
            request_message,
            teacher_response,
            created_at,
            classrooms (
              name
            )
          `)
          .eq('student_id', studentId)
          .order('created_at', { ascending: false })

        requests = (data || []) as EnrollmentRequest[]
      } catch {
        // Table might not exist yet
      }

      setEnrollmentRequests(requests as EnrollmentRequest[])
    } catch (error) {
      console.error('Error fetching enrollment requests:', error)
    }
  }, [studentId, supabase])

  useEffect(() => {
    fetchAvailableClassrooms()
    fetchEnrollmentRequests()
  }, [fetchAvailableClassrooms, fetchEnrollmentRequests])

  const submitEnrollmentRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClassroom) return

    setLoading(true)
    
    try {
      // Get teacher ID for the classroom
      const { data: teacherData } = await supabase
        .from('classroom_teachers')
        .select('teacher_id')
        .eq('classroom_id', selectedClassroom)
        .single()

      if (!teacherData) {
        setMessage('Error: Could not find teacher for this classroom')
        setLoading(false)
        return
      }

      try {
        const { error } = await supabase
          .from('enrollment_requests')
          .insert({
            student_id: studentId,
            classroom_id: selectedClassroom,
            teacher_id: teacherData.teacher_id,
            request_message: requestMessage || null
          })

        if (error) {
          setMessage(`Error: ${error.message}`)
        } else {
          setMessage('Enrollment request submitted successfully!')
          setSelectedClassroom('')
          setRequestMessage('')
          fetchAvailableClassrooms()
          fetchEnrollmentRequests()
          
          // Clear success message after 3 seconds
          setTimeout(() => setMessage(''), 3000)
        }
      } catch {
        setMessage('Enrollment requests feature is not available yet. Please contact your teacher directly.')
      }
    } catch {
      setMessage('Error submitting request. Please try again.')
    }
    
    setLoading(false)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/30'
      case 'approved':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border border-red-400/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-400/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Request Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center mr-3 shadow-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Request to Join a Class</h3>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-500/20 border border-red-400/30 text-red-400' 
              : 'bg-emerald-500/20 border border-emerald-400/30 text-emerald-400'
          }`}>
            {message}
          </div>
        )}

        <form onSubmit={submitEnrollmentRequest} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Select Classroom
            </label>
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-lg"
              required
              disabled={loading}
            >
              <option value="">Choose a classroom...</option>
              {availableClassrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id} className="bg-gray-800">
                  {classroom.name} - {classroom.classroom_teachers?.[0]?.profiles?.full_name || 'No teacher assigned yet'}
                </option>
              ))}
            </select>
            {availableClassrooms.length === 0 && (
              <p className="text-gray-400 text-sm mt-2">No available classrooms to join.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Message to Teacher (Optional)
            </label>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              placeholder="Why would you like to join this class?"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-lg resize-none"
              rows={3}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedClassroom}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>

      {/* Enrollment Requests History */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">My Enrollment Requests</h3>
        </div>

        {enrollmentRequests.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No enrollment requests yet</p>
            <p className="text-sm">Submit a request above to join a class!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollmentRequests.map((request) => (
              <div key={request.id} className="bg-white/5 rounded-xl p-6 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="text-lg font-semibold text-white">
                    {request.classrooms?.[0]?.name || 'Unknown Classroom'}
                  </h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-300 text-sm mb-3">
                  Submitted on {formatDate(request.created_at)}
                </p>

                {request.request_message && (
                  <div className="mb-3">
                    <p className="text-gray-400 text-sm font-medium">Your message:</p>
                    <p className="text-gray-300 text-sm mt-1 bg-white/5 p-3 rounded-lg">
                      {request.request_message}
                    </p>
                  </div>
                )}

                {request.teacher_response && (
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Teacher response:</p>
                    <p className="text-gray-300 text-sm mt-1 bg-white/5 p-3 rounded-lg">
                      {request.teacher_response}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}