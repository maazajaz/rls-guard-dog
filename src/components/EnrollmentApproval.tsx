'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type EnrollmentRequest = {
  id: string
  student_id: string
  classroom_id: string
  request_message: string | null
  created_at: string
  profiles: {
    full_name: string | null
  } | null
  classrooms: {
    name: string
  } | null
}

type Classroom = {
  id: string
  name: string
}

export default function EnrollmentApproval({ 
  teacherId, 
  classrooms 
}: { 
  teacherId: string
  classrooms: Classroom[]
}) {
  const [pendingRequests, setPendingRequests] = useState<EnrollmentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  const supabase = createClient()

  useEffect(() => {
    fetchPendingRequests()
  }, [])

  const fetchPendingRequests = async () => {
    try {
      if (classrooms.length === 0) {
        setLoading(false)
        return
      }

      const classroomIds = classrooms.map(c => c.id)

      const { data: requests, error } = await supabase
        .from('enrollment_requests')
        .select(`
          id,
          student_id,
          classroom_id,
          request_message,
          created_at,
          profiles!enrollment_requests_student_id_fkey (
            full_name
          ),
          classrooms (
            name
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('status', 'pending')
        .in('classroom_id', classroomIds)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching enrollment requests:', error)
      } else {
        setPendingRequests((requests || []) as unknown as EnrollmentRequest[])
      }
    } catch (error) {
      console.error('Error fetching enrollment requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (requestId: string, action: 'approved' | 'rejected', response?: string) => {
    setProcessingId(requestId)
    
    try {
      const { error } = await supabase
        .from('enrollment_requests')
        .update({
          status: action,
          teacher_response: response || null
        })
        .eq('id', requestId)

      if (error) {
        setMessage(`Error: ${error.message}`)
      } else {
        setMessage(`Request ${action} successfully!`)
        fetchPendingRequests() // Refresh the list
        
        // Clear success message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      }
    } catch (error) {
      setMessage('Error processing request. Please try again.')
    } finally {
      setProcessingId(null)
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

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <span className="ml-3 text-white">Loading enrollment requests...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center mr-3 shadow-xl">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Enrollment Requests</h3>
          <p className="text-gray-300 text-sm">Students requesting to join your classes</p>
        </div>
        {pendingRequests.length > 0 && (
          <div className="ml-auto">
            <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-400/30 px-3 py-1 rounded-full text-sm font-medium">
              {pendingRequests.length} pending
            </span>
          </div>
        )}
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

      {pendingRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No pending enrollment requests</p>
          <p className="text-sm">Students can request to join your classes from their dashboard</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={(response) => handleApproval(request.id, 'approved', response)}
              onReject={(response) => handleApproval(request.id, 'rejected', response)}
              isProcessing={processingId === request.id}
              formatDate={formatDate}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RequestCard({ 
  request, 
  onApprove, 
  onReject, 
  isProcessing, 
  formatDate 
}: {
  request: EnrollmentRequest
  onApprove: (response?: string) => void
  onReject: (response?: string) => void
  isProcessing: boolean
  formatDate: (date: string) => string
}) {
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [teacherResponse, setTeacherResponse] = useState('')

  const handleAction = (action: 'approve' | 'reject') => {
    setActionType(action)
    setShowResponseForm(true)
  }

  const submitAction = () => {
    if (actionType === 'approve') {
      onApprove(teacherResponse)
    } else if (actionType === 'reject') {
      onReject(teacherResponse)
    }
    setShowResponseForm(false)
    setTeacherResponse('')
    setActionType(null)
  }

  const cancelAction = () => {
    setShowResponseForm(false)
    setTeacherResponse('')
    setActionType(null)
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className="text-lg font-semibold text-white">
            {request.profiles?.full_name || 'Unknown Student'}
          </h4>
          <p className="text-gray-300 text-sm">
            wants to join <span className="font-medium text-blue-300">{request.classrooms?.name || 'Unknown Classroom'}</span>
          </p>
          <p className="text-gray-400 text-xs mt-1">
            Requested on {formatDate(request.created_at)}
          </p>
        </div>
      </div>

      {request.request_message && (
        <div className="mb-4">
          <p className="text-gray-400 text-sm font-medium mb-2">Student's message:</p>
          <p className="text-gray-300 text-sm bg-white/5 p-3 rounded-lg">
            {request.request_message}
          </p>
        </div>
      )}

      {!showResponseForm ? (
        <div className="flex gap-3">
          <button
            onClick={() => handleAction('approve')}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-2 px-4 rounded-lg font-medium shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={() => handleAction('reject')}
            disabled={isProcessing}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-lg font-medium shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Reject'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              {actionType === 'approve' ? 'Welcome message (optional)' : 'Reason for rejection (optional)'}
            </label>
            <textarea
              value={teacherResponse}
              onChange={(e) => setTeacherResponse(e.target.value)}
              placeholder={
                actionType === 'approve' 
                  ? 'Welcome to the class! Looking forward to working with you.'
                  : 'Please explain why the request was denied.'
              }
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent backdrop-blur-lg resize-none"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={submitAction}
              disabled={isProcessing}
              className={`flex-1 text-white py-2 px-4 rounded-lg font-medium shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                actionType === 'approve'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700'
                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              }`}
            >
              {isProcessing ? 'Processing...' : `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`}
            </button>
            <button
              onClick={cancelAction}
              disabled={isProcessing}
              className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg font-medium shadow-lg hover:bg-gray-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}