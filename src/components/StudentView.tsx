import { createClient } from '@/lib/supabase/server'

type ProgressReport = {
  report_date: string
  grade: number
  feedback: string | null
  classrooms: {
    name: string
  } | null
}

export default async function StudentView() {
  const supabase = createClient()

  const { data: progress, error } = await supabase
    .from('progress')
    .select(
      `
      report_date,
      grade,
      feedback,
      classrooms (
        name
      )
    `
    )
    .returns<ProgressReport[]>()

  if (error) {
    console.error('Error fetching progress:', error)
    return <p>Could not fetch progress reports.</p>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Progress</h2>
      {progress.length === 0 ? (
        <p>No progress reports found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100">
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
              {progress.map((report, index) => (
                <tr key={index}>
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