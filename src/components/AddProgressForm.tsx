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
    } else {
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-medium">Add Progress Report</h3>
      <div>
        <label htmlFor="student" className="block text-sm font-medium">
          Student
        </label>
        <select
          id="student"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Select a student</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="classroom" className="block text-sm font-medium">
          Classroom
        </label>
        <select
          id="classroom"
          value={classroomId}
          onChange={(e) => setClassroomId(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">Select a classroom</option>
          {classrooms.map((classroom) => (
            <option key={classroom.id} value={classroom.id}>
              {classroom.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="grade" className="block text-sm font-medium">
          Grade
        </label>
        <input
          type="number"
          id="grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <div>
        <label htmlFor="feedback" className="block text-sm font-medium">
          Feedback
        </label>
        <textarea
          id="feedback"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-blue-500 text-white rounded-md"
      >
        Add Report
      </button>
    </form>
  )
}
