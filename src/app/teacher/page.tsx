import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

type Student = {
  id: string
  full_name: string | null
}

export default async function TeacherPage() {
  const supabase = createClient()

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
  progressRecords.forEach((record: any) => {
    if (record.profiles) {
      studentsMap.set(record.profiles.id, record.profiles)
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

  const classrooms = teacherClassrooms.map((tc: any) => tc.classrooms).flat();


  const addProgress = async (formData: FormData) => {
    'use server'

    const studentId = formData.get('studentId') as string
    const classroomId = formData.get('classroomId') as string
    const grade = parseInt(formData.get('grade') as string, 10)
    const feedback = formData.get('feedback') as string

    const supabaseAdmin = createClient() // Use admin client if needed, or just the regular one with RLS

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Add New Progress Report</h1>
      <form action={addProgress} className="space-y-4 p-4 border rounded-lg">
        <div>
          <label htmlFor="studentId" className="block text-sm font-medium">
            Select Student
          </label>
          <select
            id="studentId"
            name="studentId"
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
          <label htmlFor="classroomId" className="block text-sm font-medium">
            Select Classroom
          </label>
          <select
            id="classroomId"
            name="classroomId"
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
            Grade (0-100)
          </label>
          <input
            type="number"
            id="grade"
            name="grade"
            min="0"
            max="100"
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
            name="feedback"
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          Submit Report
        </button>
      </form>
    </div>
  )
}
