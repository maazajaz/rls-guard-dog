'use client'

import { useState, useEffect } from 'react'
import { ClassroomAverage } from '@/lib/mongodb'

interface ClassAveragesProps {
  schoolId: string
  classroomIds?: string[]
  showSchoolStats?: boolean
}

export default function ClassAverages({ schoolId, classroomIds, showSchoolStats = true }: ClassAveragesProps) {
  const [averages, setAverages] = useState<ClassroomAverage[]>([])
  const [schoolStats, setSchoolStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasAttemptedAutoSync, setHasAttemptedAutoSync] = useState(false)

  useEffect(() => {
    setHasAttemptedAutoSync(false) // Reset flag when dependencies change
    fetchAverages()
  }, [schoolId, classroomIds])

  const fetchAverages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/class-averages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          schoolId,
          classroomIds,
          includeStats: showSchoolStats
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch class averages')
      }

      const data = await response.json()
      console.log('📊 API Response:', data) // Debug log
      setAverages(data.averages || [])
      setSchoolStats(data.schoolStats || null)
      
      // AUTO-SYNC: If no averages found and haven't tried auto-sync yet
      if ((!data.averages || data.averages.length === 0) && !hasAttemptedAutoSync) {
        console.log('No class averages found, attempting one-time auto-sync...')
        setHasAttemptedAutoSync(true)
        setTimeout(() => {
          autoSyncFromEdgeFunction()
        }, 1000)
      } else if (data.averages && data.averages.length > 0) {
        console.log(`✅ Found ${data.averages.length} class averages`)
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const autoSyncFromEdgeFunction = async () => {
    try {
      console.log('🔄 Auto-syncing from Edge Function...')
      
      const response = await fetch('/api/sync-class-averages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Auto-sync successful:', data)
        
        // Refresh the averages after auto-syncing
        setTimeout(() => {
          setHasAttemptedAutoSync(false) // Reset flag for next manual attempt
          fetchAverages()
        }, 500)
      } else {
        console.log('⚠️ Auto-sync failed, user can use manual sync button')
      }
    } catch (err) {
      console.log('⚠️ Auto-sync error:', err)
      // Fail silently, user can use manual sync button
    }
  }

  const syncWithEdgeFunction = async () => {
    try {
      setSyncing(true)
      setError(null)
      
      const response = await fetch('/api/sync-class-averages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to sync class averages')
      }

      const data = await response.json()
      console.log('Sync result:', data)
      
      // Refresh the averages after syncing
      await fetchAverages()
      
      // Show success message (you could use a toast notification here)
      alert(`Successfully synced ${data.inserted_count} class averages from Edge Function to MongoDB!`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  const triggerRecalculation = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/recalculate-averages', {
        method: 'POST'
      })

      if (!response.ok) {
        throw new Error('Failed to trigger recalculation')
      }

      // Wait a moment then refresh data
      setTimeout(() => {
        fetchAverages()
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger recalculation')
      setLoading(false)
    }
  }

  const getGradeColor = (average: number) => {
    if (average >= 90) return 'text-green-600 bg-green-100'
    if (average >= 80) return 'text-blue-600 bg-blue-100'
    if (average >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="animate-pulse">
          <h3 className="text-lg font-semibold text-white mb-4">Class Averages</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-white/20 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-300 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Class Averages</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={fetchAverages}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* School Statistics */}
      {showSchoolStats && schoolStats && (
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">School Overview</h3>
            <div className="flex gap-2">
              <button
                onClick={syncWithEdgeFunction}
                disabled={syncing}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {syncing ? 'Syncing...' : 'Sync from Edge Function'}
              </button>
              <button
                onClick={triggerRecalculation}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Recalculate
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">{schoolStats.total_classrooms}</div>
              <div className="text-sm text-gray-300">Classrooms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{schoolStats.total_students}</div>
              <div className="text-sm text-gray-300">Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{schoolStats.total_reports}</div>
              <div className="text-sm text-gray-300">Progress Reports</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getGradeColor(schoolStats.overall_average).split(' ')[0]}`}>
                {schoolStats.overall_average.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-300">Overall Average</div>
            </div>
          </div>
        </div>
      )}

      {/* Class Averages */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-4">Class Averages (from MongoDB)</h3>
        
        {averages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-300 mb-4">No class averages available yet.</p>
            <button
              onClick={triggerRecalculation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Calculate Averages
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {averages.map((average) => (
              <div key={average.classroom_id} className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{average.classroom_name}</h4>
                    <p className="text-sm text-gray-300">
                      {average.total_students} students • {average.total_reports} reports
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full font-semibold ${getGradeColor(average.average_grade)}`}>
                    {average.average_grade.toFixed(1)}%
                  </div>
                </div>

                {/* Grade Distribution */}
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <div className="text-green-400 font-semibold">{average.grade_distribution.excellent}</div>
                    <div className="text-gray-400">Excellent</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-400 font-semibold">{average.grade_distribution.good}</div>
                    <div className="text-gray-400">Good</div>
                  </div>
                  <div className="text-center">
                    <div className="text-yellow-400 font-semibold">{average.grade_distribution.satisfactory}</div>
                    <div className="text-gray-400">Satisfactory</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 font-semibold">{average.grade_distribution.needs_improvement}</div>
                    <div className="text-gray-400">Needs Improvement</div>
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  Last updated: {formatDate(average.last_updated)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
