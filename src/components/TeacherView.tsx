import { createClient } from '@/lib/supabase/server'
import AddProgressForm from './AddProgressForm'
import StudentAssignment from './StudentAssignment'
import ClassAverages from './ClassAverages'

type ProgressRecord = {
  id: string
  report_date: string
  grade: number
  feedback: string | null
  student_id: string
  classroom_id: string
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

type Student = {
  id: string
  full_name: string | null
}

export default async function TeacherView() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div className="text-red-600">Not authenticated</div>
  }

  // Get teacher's profile and school_id
  const { data: teacherProfile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!teacherProfile) {
    return <div className="text-red-600">Profile not found</div>
  }

  // Get teacher's classrooms - fix the data structure
  const { data: classroomTeachers, error: classroomError } = await supabase
    .from('classroom_teachers')
    .select(`
      classrooms (
        id,
        name
      )
    `)
    .eq('teacher_id', user.id)

  // Get progress reports for teacher's classes
  const { data: progress, error: progressError } = await supabase
    .from('progress')
    .select(`
      id,
      report_date,
      grade,
      feedback,
      student_id,
      classroom_id,
      profiles ( full_name ),
      classrooms ( name )
    `)
    .order('report_date', { ascending: false })
    .returns<ProgressRecord[]>()

  if (progressError || classroomError) {
    console.error('Error fetching data:', { progressError, classroomError })
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">Could not fetch teacher data.</p>
        <p className="text-red-600 text-sm mt-1">
          Progress Error: {progressError?.message || 'None'}<br/>
          Classroom Error: {classroomError?.message || 'None'}
        </p>
      </div>
    )
  }

  // Extract classrooms from the classroom_teachers join
  const teacherClassrooms: Classroom[] = classroomTeachers?.map((ct: any) => ct.classrooms).filter(Boolean) || []

  // Get students in teacher's classrooms - updated to use the new student_classrooms table
  const { data: enrolledStudents } = await supabase
    .from('student_classrooms')
    .select(`
      profiles (
        id,
        full_name
      ),
      classrooms (
        id,
        name
      )
    `)
    .in('classroom_id', teacherClassrooms.map(c => c.id))

  // Get all students in the school for assignment purposes
  const { data: allSchoolStudents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'student')

  // Extract unique students from enrolled students
  const enrolledStudentList = enrolledStudents?.map((es: any) => es.profiles).filter(Boolean) || []
  
  // Calculate stats
  const totalStudents = new Set(enrolledStudentList?.map(s => s.id) || []).size
  const averageGrade = progress && progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + p.grade, 0) / progress.length)
    : 0

  return (
    <div className="space-y-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center mr-4 shadow-xl">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Teacher Dashboard</h2>
            <p className="text-gray-200">Manage your classrooms and track student progress</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-6 border border-blue-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">My Classrooms</p>
                <p className="text-3xl font-bold text-white">{teacherClassrooms.length}</p>
              </div>
              <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 backdrop-blur-lg rounded-2xl p-6 border border-emerald-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-100">Total Students</p>
                <p className="text-3xl font-bold text-white">{totalStudents}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-400/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-6 border border-purple-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">Progress Reports</p>
                <p className="text-3xl font-bold text-white">{progress?.length || 0}</p>
              </div>
              <div className="w-10 h-10 bg-purple-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-400/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-6 border border-orange-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Class Average</p>
                <p className="text-3xl font-bold text-white">{averageGrade}%</p>
              </div>
              <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Classroom List */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-white/10">
          <h3 className="font-semibold text-white mb-3">Your Classrooms</h3>
          {teacherClassrooms.length === 0 ? (
            <p className="text-gray-300 text-sm">No classrooms assigned yet. Contact your head teacher.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {teacherClassrooms.map((classroom) => (
                <span key={classroom.id} className="bg-blue-500/30 text-blue-300 px-4 py-2 rounded-full text-sm font-medium border border-blue-400/30">
                  {classroom.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MongoDB Class Averages for Teacher's Classrooms */}
      <ClassAverages 
        schoolId={teacherProfile.school_id}
        classroomIds={teacherClassrooms.map(c => c.id)}
        showSchoolStats={false}
      />

      {/* Student Assignment */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center mr-3 shadow-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Assign Students to Your Classrooms</h3>
        </div>
        <StudentAssignment 
          students={allSchoolStudents || []}
          teacherClassrooms={teacherClassrooms}
        />
      </div>

      {/* Add Progress Form */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mr-3 shadow-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Add Progress Report</h3>
        </div>
        <AddProgressForm 
          classrooms={teacherClassrooms} 
          students={enrolledStudentList || []}
        />
      </div>

      {/* Progress Reports Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="px-8 py-6 bg-white/5 border-b border-white/20">
          <h3 className="text-xl font-bold text-white">Recent Progress Reports</h3>
        </div>
        
        {!progress || progress.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-200 mb-2">No progress reports found for your classes.</p>
            <p className="text-sm text-gray-400">Add your first progress report using the form above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200 uppercase tracking-wider">
                    Student
                  </th>
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
                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                      {report.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                      {report.classrooms?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-300">
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
                      {report.feedback || 'No feedback'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}