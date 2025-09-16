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

type AddProgressFormProps = {
  students: Student[]
  classrooms: Classroom[]
}

export default function AddProgressForm({
  students,
  classrooms,
}: AddProgressFormProps) {
  const [studentId, setStudentId] = useState('')
  const [classroomId, setClassroomId] = useState('')
  const [grade, setGrade] = useState('')
  const [feedback, setFeedback] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { error } = await supabase.from('progress').insert({
      student_id: studentId,
      classroom_id: classroomId,
      grade: parseInt(grade, 10),
      feedback,
    })

    if (error) {
      console.error('Error inserting progress:', error)
      alert('Error adding progress report. Please try again.')
    } else {
      console.log('✅ Progress report added successfully!')
      console.log('🔔 This should trigger automatic class average calculation...')
      alert('Progress report added! Class averages will update automatically.')
      
      // Refresh the page to show the new progress report
      router.refresh()
      // Reset form
      setStudentId('')
      setClassroomId('')
      setGrade('')
      setFeedback('')
    }
  }

  return (
    <div className="space-y-6">
      {students.length === 0 || classrooms.length === 0 ? (
        <div className="bg-yellow-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-xl p-6">
          <p className="text-yellow-300 font-semibold mb-2">Cannot add progress reports yet</p>
          <p className="text-yellow-200 text-sm">
            {students.length === 0 && "No students found. "}
            {classrooms.length === 0 && "No classrooms assigned. "}
            Contact your head teacher to set up classrooms and student assignments.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 p-6 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
          <div>
            <label htmlFor="student" className="block text-sm font-semibold text-gray-200 mb-2">
              Student
            </label>
            <select
              id="student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
            >
              <option value="" className="bg-gray-800 text-gray-200">Select a student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id} className="bg-gray-800 text-gray-200">
                  {student.full_name || 'Unnamed Student'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="classroom" className="block text-sm font-semibold text-gray-200 mb-2">
              Classroom
            </label>
            <select
              id="classroom"
              value={classroomId}
              onChange={(e) => setClassroomId(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
            >
              <option value="" className="bg-gray-800 text-gray-200">Select a classroom</option>
              {classrooms.map((classroom) => (
                <option key={classroom.id} value={classroom.id} className="bg-gray-800 text-gray-200">
                  {classroom.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="grade" className="block text-sm font-semibold text-gray-200 mb-2">
              Grade (0-100)
            </label>
            <input
              type="number"
              id="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              min="0"
              max="100"
              required
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300"
              placeholder="Enter grade (0-100)"
            />
          </div>
          <div>
            <label htmlFor="feedback" className="block text-sm font-semibold text-gray-200 mb-2">
              Feedback (optional)
            </label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 resize-none"
              placeholder="Enter feedback for the student..."
            />
          </div>
          <button
            type="submit"
            disabled={!studentId || !classroomId || !grade}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-semibold"
          >
            Add Progress Report
          </button>
        </form>
      )}
    </div>
  )
}
