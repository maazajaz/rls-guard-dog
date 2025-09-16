'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Student = {
  id: string
  full_name: string | null
}

type Classroom = {
  id: string
  name: string
}

type StudentAssignmentProps = {
  students: Student[]
  teacherClassrooms: Classroom[]
}

export default function StudentAssignment({ students, teacherClassrooms }: StudentAssignmentProps) {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudent || !selectedClassroom) return

    setIsAssigning(true)
    
    try {
      const { error } = await supabase
        .from('student_classrooms')
        .insert({ 
          student_id: selectedStudent, 
          classroom_id: selectedClassroom 
        })

      if (error) {
        console.error('Error assigning student:', error)
        if (error.code === '23505') {
          alert(' Student Already Assigned!\n\nThis student is already assigned to this classroom. Each student can only be assigned to a classroom once.')
        } else {
          alert('Failed to assign student: ' + error.message)
        }
      } else {
        setSelectedStudent('')
        setSelectedClassroom('')
        router.refresh()
        alert(' Success!\n\nStudent successfully assigned to classroom!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsAssigning(false)
    }
  }

  if (teacherClassrooms.length === 0) {
    return (
      <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-yellow-300 mb-2">No Classrooms Assigned</h3>
        <p className="text-yellow-200">You haven&apos;t been assigned to any classrooms yet. Contact your head teacher to get classroom assignments.</p>
      </div>
    )
  }

  if (students.length === 0) {
    return (
      <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-400/30 rounded-xl p-8 text-center">
        <div className="w-12 h-12 bg-blue-400/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-300 mb-2">No Students Available</h3>
        <p className="text-blue-200">There are no students in your school yet. Students need to sign up first before they can be assigned to classrooms.</p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl shadow-xl border border-white/10 p-6">
      <form onSubmit={handleAssignStudent} className="space-y-6">
        <div>
          <label htmlFor="student" className="block text-sm font-semibold text-gray-200 mb-2">
            Select Student
          </label>
          <select
            id="student"
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            required
            className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
          >
            <option value="" className="bg-gray-800 text-gray-200">Choose a student...</option>
            {students.map((student) => (
              <option key={student.id} value={student.id} className="bg-gray-800 text-gray-200">
                {student.full_name || 'Unnamed Student'}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="classroom" className="block text-sm font-semibold text-gray-200 mb-2">
            Select Your Classroom
          </label>
          <select
            id="classroom"
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            required
            className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
          >
            <option value="" className="bg-gray-800 text-gray-200">Choose a classroom...</option>
            {teacherClassrooms.map((classroom) => (
              <option key={classroom.id} value={classroom.id} className="bg-gray-800 text-gray-200">
                {classroom.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isAssigning || !selectedStudent || !selectedClassroom}
          className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-semibold"
        >
          {isAssigning ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Assigning...
            </div>
          ) : (
            'Assign Student to Classroom'
          )}
        </button>
      </form>
    </div>
  )
}
