import { createClient } from '@/lib/supabase/server'

type ProgressRecord = {
  id: string
  report_date: string
  grade: number
  feedback: string | null
  profiles: {
    full_name: string | null
  } | null
  classrooms: {
    name: string
  } | null
}

export default async function TeacherView() {
  const supabase = createClient()

  // The RLS policy will automatically filter the progress reports for the teacher's classes.
  const { data: progress, error: progressError } = await supabase
    .from('progress')
    .select(
      `
      id,
      report_date,
      grade,
      feedback,
      profiles ( full_name ),
      classrooms ( name )
    `
    )
    .returns<ProgressRecord[]>()

  if (progressError || !progress) {
    console.error('Error fetching progress:', progressError)
    return <p>Could not fetch progress reports.</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Student Progress</h2>
      {progress.length === 0 ? (
        <p>No progress reports found for your classes.</p>
      ) : (
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Classroom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {progress.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.profiles?.full_name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.classrooms?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(report.report_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{report.grade}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.feedback}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}