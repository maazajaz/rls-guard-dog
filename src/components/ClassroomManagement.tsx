'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Teacher = {
  id: string
  full_name: string | null
}

type Classroom = {
  id: string
  name: string
}

type ClassroomManagementProps = {
  teachers: Teacher[]
  classrooms: Classroom[]
}

export default function ClassroomManagement({ teachers, classrooms }: ClassroomManagementProps) {
  const [classroomName, setClassroomName] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [selectedClassroom, setSelectedClassroom] = useState('')
  const [isCreatingClassroom, setIsCreatingClassroom] = useState(false)
  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classroomName.trim()) return

    setIsCreatingClassroom(true)
    
    try {
      // Get current user's school_id first
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to create classrooms')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .single()

      if (!profile?.school_id) {
        alert('Could not find your school information')
        return
      }

      const { error } = await supabase
        .from('classrooms')
        .insert({ 
          name: classroomName.trim(),
          school_id: profile.school_id
        })

      if (error) {
        console.error('Error creating classroom:', error)
        alert('Failed to create classroom: ' + error.message)
      } else {
        setClassroomName('')
        router.refresh()
        alert('Classroom created successfully!')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsCreatingClassroom(false)
    }
  }

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher || !selectedClassroom) return

    setIsAssigningTeacher(true)
    
    try {
      const { error } = await supabase
        .from('classroom_teachers')
        .insert({ 
          teacher_id: selectedTeacher, 
          classroom_id: selectedClassroom 
        })

      if (error) {
        console.error('Error assigning teacher:', error)
        alert('Failed to assign teacher: ' + error.message)
      } else {
        setSelectedTeacher('')
        setSelectedClassroom('')
        router.refresh()
      }
    } catch (error) {
      console.error('Error:', error)
      alert('An unexpected error occurred')
    } finally {
      setIsAssigningTeacher(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Create Classroom Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Create New Classroom</h3>
            <p className="text-gray-200">Add a new classroom to your school</p>
          </div>
        </div>
        
        <form onSubmit={handleCreateClassroom} className="space-y-6">
          <div>
            <label htmlFor="classroomName" className="block text-sm font-semibold text-gray-200 mb-2">
              Classroom Name
            </label>
            <input
              type="text"
              id="classroomName"
              value={classroomName}
              onChange={(e) => setClassroomName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300"
              placeholder="e.g., Mathematics 101, Science Lab A"
            />
          </div>
          <button
            type="submit"
            disabled={isCreatingClassroom || !classroomName.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-semibold"
          >
            {isCreatingClassroom ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </div>
            ) : (
              'Create Classroom'
            )}
          </button>
        </form>
      </div>

      {/* Assign Teacher to Classroom Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Assign Teacher to Classroom</h3>
            <p className="text-gray-200">Connect teachers with their classrooms</p>
          </div>
        </div>
        
        {teachers.length === 0 || classrooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-200 mb-2">Prerequisites Required</h4>
            <p className="text-gray-300 mb-4">
              {teachers.length === 0 && "No teachers available. "}
              {classrooms.length === 0 && "No classrooms available. "}
            </p>
            <p className="text-sm text-gray-400">
              {classrooms.length === 0 ? "Create a classroom first." : "Add teachers to your school first."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleAssignTeacher} className="space-y-6">
            <div>
              <label htmlFor="teacher" className="block text-sm font-semibold text-gray-200 mb-2">
                Select Teacher
              </label>
              <select
                id="teacher"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
              >
                <option value="" className="bg-gray-800 text-gray-200">Choose a teacher...</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id} className="bg-gray-800 text-gray-200">
                    {teacher.full_name || 'Unnamed Teacher'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="classroom" className="block text-sm font-semibold text-gray-200 mb-2">
                Select Classroom
              </label>
              <select
                id="classroom"
                value={selectedClassroom}
                onChange={(e) => setSelectedClassroom(e.target.value)}
                required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
              >
                <option value="" className="bg-gray-800 text-gray-200">Choose a classroom...</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id} className="bg-gray-800 text-gray-200">
                    {classroom.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isAssigningTeacher || !selectedTeacher || !selectedClassroom}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 font-semibold"
            >
              {isAssigningTeacher ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Assigning...
                </div>
              ) : (
                'Assign Teacher'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
