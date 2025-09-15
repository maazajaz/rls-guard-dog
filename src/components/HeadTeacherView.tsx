import { createClient } from '@/lib/supabase/server'
import ClassroomManagement from './ClassroomManagement'

type ProgressRecord = {
  id: string
  report_date: string
  grade: number
  feedback: string | null
  student_id: string
  classroom_id: string
  profiles: {
    full_name: string | null
    role: string
  } | null
  classrooms: {
    name: string
  } | null
}

type SchoolStats = {
  totalStudents: number
  totalTeachers: number
  totalClassrooms: number
  averageGrade: number
  recentReports: number
}

export default async function HeadTeacherView() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return <div className="text-red-600">Not authenticated</div>
  }

  // Get head teacher's school_id
  const { data: headTeacherProfile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!headTeacherProfile) {
    return <div className="text-red-600">Profile not found</div>
  }

  // Get all progress reports in the school
  const { data: progress, error: progressError } = await supabase
    .from('progress')
    .select(`
      id,
      report_date,
      grade,
      feedback,
      student_id,
      classroom_id,
      profiles ( full_name, role ),
      classrooms ( name )
    `)
    .order('report_date', { ascending: false })
    .returns<ProgressRecord[]>()

  // Get all profiles in the school for stats
  const { data: allProfiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('school_id', headTeacherProfile.school_id)

  // Get all classrooms in the school
  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('school_id', headTeacherProfile.school_id)

  // Get teachers specifically for classroom management - try direct query first
  const { data: teachersData, error: teachersError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('role', 'teacher')
    .eq('school_id', headTeacherProfile.school_id)

  // Fallback to filtering from allProfiles if direct query fails
  const teachers = teachersData || (allProfiles?.filter(p => p.role === 'teacher') || [])

  // Debug logging
  if (profilesError) console.error('Profiles error:', profilesError)
  if (teachersError) console.error('Teachers error:', teachersError)
  console.log('School ID:', headTeacherProfile.school_id)
  console.log('All profiles:', allProfiles?.length || 0)
  console.log('Teachers found:', teachers.length)
  console.log('Teachers data:', teachers)

  if (progressError) {
    console.error('Error fetching progress:', progressError)
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">Could not fetch school data.</p>
        <p className="text-red-600 text-sm mt-1">Error: {progressError.message}</p>
      </div>
    )
  }

  // Calculate school statistics
  const students = allProfiles?.filter(p => p.role === 'student') || []
  const schoolTeachers = allProfiles?.filter(p => p.role === 'teacher') || []
  const recentReports = progress?.filter(p => {
    const reportDate = new Date(p.report_date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return reportDate >= weekAgo
  }).length || 0

  const stats: SchoolStats = {
    totalStudents: students.length,
    totalTeachers: schoolTeachers.length,
    totalClassrooms: classrooms?.length || 0,
    averageGrade: progress && progress.length > 0 
      ? Math.round(progress.reduce((sum, p) => sum + p.grade, 0) / progress.length)
      : 0,
    recentReports
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-8">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Head Teacher Dashboard</h2>
            <p className="text-gray-200">Manage your school's classrooms and monitor academic progress</p>
          </div>
        </div>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-blue-400/20 to-blue-600/20 backdrop-blur-lg rounded-2xl p-4 border border-blue-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Students</p>
                <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
              </div>
              <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-400/20 to-green-600/20 backdrop-blur-lg rounded-2xl p-4 border border-green-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-100">Total Teachers</p>
                <p className="text-2xl font-bold text-white">{stats.totalTeachers}</p>
              </div>
              <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-400/20 to-orange-600/20 backdrop-blur-lg rounded-2xl p-4 border border-orange-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-100">Classrooms</p>
                <p className="text-2xl font-bold text-white">{stats.totalClassrooms}</p>
              </div>
              <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-400/20 to-purple-600/20 backdrop-blur-lg rounded-2xl p-4 border border-purple-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-100">School Average</p>
                <p className="text-2xl font-bold text-white">{stats.averageGrade}%</p>
              </div>
              <div className="w-10 h-10 bg-purple-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-pink-400/20 to-pink-600/20 backdrop-blur-lg rounded-2xl p-4 border border-pink-300/30 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-pink-100">Recent Reports</p>
                <p className="text-2xl font-bold text-white">{stats.recentReports}</p>
              </div>
              <div className="w-10 h-10 bg-pink-400 rounded-lg flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* School Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Students List */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-400 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Students ({students.length})</h3>
          </div>
          {students.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-blue-400/20 rounded-lg border border-blue-300/30">
                  <span className="font-medium text-white">{student.full_name || 'Unnamed Student'}</span>
                  <span className="text-xs font-semibold text-blue-200 bg-blue-500/30 px-2 py-1 rounded-full">Student</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teachers List */}
        <div className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-green-400 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Teachers ({schoolTeachers.length})</h3>
          </div>
          {schoolTeachers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <p className="text-gray-300 text-sm">No teachers assigned yet.</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2">
              {schoolTeachers.map((teacher) => (
                <div key={teacher.id} className="flex items-center justify-between p-3 bg-green-400/20 rounded-lg border border-green-300/30">
                  <span className="font-medium text-white">{teacher.full_name || 'Unnamed Teacher'}</span>
                  <span className="text-xs font-semibold text-green-200 bg-green-500/30 px-2 py-1 rounded-full">Teacher</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Classroom Management */}
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/30 p-6">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-indigo-400 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white">Classroom Management</h3>
        </div>
        <ClassroomManagement 
          teachers={teachers} 
          classrooms={classrooms || []} 
        />
      </div>

      {/* Progress Reports Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">All Progress Reports</h3>
          </div>
        </div>
        
        {!progress || progress.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-gray-600 mb-2">No Progress Reports</h4>
            <p className="text-gray-500 mb-1">No progress reports found in your school.</p>
            <p className="text-sm text-gray-400">Teachers can add progress reports from their dashboard.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Classroom
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Feedback
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
                {progress.map((report) => (
                  <tr key={report.id} className="hover:bg-white/70 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.profiles?.full_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {report.classrooms?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(report.report_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        report.grade >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                        report.grade >= 80 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        report.grade >= 70 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                        'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {report.grade}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">
                      {report.feedback || 'No feedback provided'}
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