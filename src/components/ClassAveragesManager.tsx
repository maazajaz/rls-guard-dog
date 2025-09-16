'use client'

import { useState } from 'react'
import { calculateClassAverages, getClassAveragesFromCache, CalculationResult } from '@/lib/classAverages'

type CachedAverage = {
  classroom_id: string
  average_grade: number
  total_students: number
  total_reports: number
  last_calculated: string
  period: string
}

export default function ClassAveragesManager() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [cachedAverages, setCachedAverages] = useState<CachedAverage[]>([])
  const [showAverages, setShowAverages] = useState(false)

  const handleCalculate = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const calculationResult = await calculateClassAverages()
      setResult(calculationResult)
      
      // If successful, fetch updated cached data
      if (calculationResult.success) {
        const cached = await getClassAveragesFromCache()
        setCachedAverages(cached)
      }
    } catch (error) {
      console.error('Error calculating averages:', error)
      setResult({
        success: false,
        message: 'Failed to calculate averages',
        calculatedAverages: 0,
        period: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleViewAverages = async () => {
    setLoading(true)
    try {
      const cached = await getClassAveragesFromCache()
      setCachedAverages(cached)
      setShowAverages(true)
    } catch (error) {
      console.error('Error fetching averages:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Class Averages Manager</h3>
          <p className="text-gray-300 text-sm">Calculate and manage class averages with MongoDB integration</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 px-4 rounded-lg font-medium shadow-lg hover:from-emerald-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Calculating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculate Averages
            </>
          )}
        </button>

        <button
          onClick={handleViewAverages}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium shadow-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Cached Averages
        </button>
      </div>

      {/* Calculation Result */}
      {result && (
        <div className={`mb-6 p-4 rounded-lg border ${result.success ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <h4 className={`font-semibold ${result.success ? 'text-green-300' : 'text-red-300'}`}>
              {result.success ? 'Calculation Successful' : 'Calculation Failed'}
            </h4>
          </div>
          
          <p className="text-gray-300 text-sm mb-2">{result.message}</p>
          
          {result.success && (
            <div className="text-sm text-gray-400">
              <p>Period: {result.period}</p>
              <p>Calculated Averages: {result.calculatedAverages}</p>
            </div>
          )}

          {result.error && (
            <p className="text-red-300 text-sm mt-2">Error: {result.error}</p>
          )}

          {result.summary && result.summary.length > 0 && (
            <div className="mt-3">
              <h5 className="text-green-300 font-medium mb-2">Summary:</h5>
              <div className="space-y-1">
                {result.summary.map((item, index) => (
                  <div key={index} className="text-sm text-gray-300">
                    <span className="font-medium">{item.classroom}:</span> {item.average}% 
                    <span className="text-gray-400"> ({item.students} students, {item.reports} reports)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cached Averages Display */}
      {showAverages && cachedAverages.length > 0 && (
        <div className="bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-semibold">Cached Class Averages</h4>
            <button
              onClick={() => setShowAverages(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {cachedAverages.map((avg, index) => (
              <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-white font-medium">
                    Classroom: {avg.classroom_id.substring(0, 8)}...
                  </h5>
                  <span className="text-emerald-400 font-bold text-lg">
                    {avg.average_grade}%
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Students: {avg.total_students} | Reports: {avg.total_reports}</p>
                  <p>Period: {avg.period}</p>
                  <p>Last Updated: {formatDate(avg.last_calculated)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showAverages && cachedAverages.length === 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-300 text-sm">
            No cached averages found. Try calculating averages first.
          </p>
        </div>
      )}
    </div>
  )
}