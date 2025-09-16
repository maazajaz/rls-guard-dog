import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type Student = {
  id: string
  full_name: string | null
}

export default async function TeacherPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  // Fetch students that the teacher can see via the progress table RLS
  const { data: progressRecords, error: progressError } = await supabase
    .from('progress')
    .select('profiles(id, full_name)')

  if (progressError) {
    console.error('Error fetching progress records for students:', progressError)
    return <p>Could not fetch student data.</p>
  }

  // Extract unique students from the progress records
  const studentsMap = new Map<string, Student>()
  progressRecords?.forEach((record) => {
    if (record.profiles && Array.isArray(record.profiles)) {
      record.profiles.forEach((profile) => {
        const student: Student = {
          id: profile.id,
          full_name: profile.full_name
        }
        studentsMap.set(profile.id, student)
      })
    }
  })
  const students = Array.from(studentsMap.values())

  // Fetch classrooms for the current teacher
  const { data: teacherClassrooms, error: classroomsError } = await supabase
    .from('classroom_teachers')
    .select('classrooms (id, name)')
    .eq('teacher_id', user.id)

  if (classroomsError || !teacherClassrooms) {
    console.error('Error fetching teacher classrooms:', classroomsError)
    return <p>Could not fetch classrooms.</p>
  }

  interface TeacherClassroom {
    classrooms: Array<{
      id: string
      name: string
    }>
  }

  const classrooms = teacherClassrooms.map((tc: TeacherClassroom) => tc.classrooms).flat();


  const addProgress = async (formData: FormData) => {
    'use server'

    const studentId = formData.get('studentId') as string
    const classroomId = formData.get('classroomId') as string
    const grade = parseInt(formData.get('grade') as string, 10)
    const feedback = formData.get('feedback') as string

    const supabaseAdmin = await createClient() // Use admin client if needed, or just the regular one with RLS

    const { error } = await supabaseAdmin.from('progress').insert({
      student_id: studentId,
      classroom_id: classroomId,
      grade: grade,
      feedback: feedback,
    })

    if (error) {
      console.error('Error inserting progress:', error)
    } else {
      revalidatePath('/dashboard')
      redirect('/dashboard') // Redirect to dashboard to see updated progress
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="blob blob-1 animation-delay-2s"></div>
        <div className="blob blob-2 animation-delay-4s"></div>
        <div className="blob blob-3 animation-delay-6s"></div>
      </div>
      
      <div className="relative z-10 container mx-auto p-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-xl">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Add New Progress Report</h1>
              <p className="text-gray-200">Submit academic progress for your students</p>
            </div>
          </div>
          
          <form action={addProgress} className="space-y-6 p-6 border border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
            <div>
              <label htmlFor="studentId" className="block text-sm font-semibold text-gray-200 mb-2">
                Select Student
              </label>
              <select
                id="studentId"
                name="studentId"
                required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
              >
                <option value="" className="bg-gray-800 text-gray-200">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id} className="bg-gray-800 text-gray-200">
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="classroomId" className="block text-sm font-semibold text-gray-200 mb-2">
                Select Classroom
              </label>
              <select
                id="classroomId"
                name="classroomId"
                required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white"
              >
                <option value="" className="bg-gray-800 text-gray-200">Select a classroom</option>
                {classrooms.map((classroom: { id: string; name: string }) => (
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
                name="grade"
                min="0"
                max="100"
                required
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300"
                placeholder="Enter grade (0-100)"
              />
            </div>
            <div>
              <label htmlFor="feedback" className="block text-sm font-semibold text-gray-200 mb-2">
                Feedback
              </label>
              <textarea
                id="feedback"
                name="feedback"
                rows={4}
                className="w-full px-4 py-3 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all duration-200 bg-white/10 backdrop-blur-sm text-white placeholder-gray-300 resize-none"
                placeholder="Enter feedback for the student..."
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-xl hover:from-emerald-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-400 transform hover:-translate-y-0.5 transition-all duration-200 shadow-xl hover:shadow-2xl font-semibold"
            >
              Submit Progress Report
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
