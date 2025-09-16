'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AddTestProgress() {
  const [isAdding, setIsAdding] = useState(false)
  const [message, setMessage] = useState('')

  const addTestProgress = async () => {
    setIsAdding(true)
    setMessage('')
    
    try {
      const supabase = createClient()
      
      // Generate random test data
      const grade = Math.floor(Math.random() * 30) + 70 // 70-100
      const studentName = `Test Student ${Date.now()}`
      
      const { error } = await supabase
        .from('progress')
        .insert([
          {
            student_id: `test-student-${Math.random().toString(36).substr(2, 9)}`,
            student_name: studentName,
            classroom_id: 'classroom-1', // Class 1
            grade: grade,
            report_date: new Date().toISOString(),
            feedback: `Test feedback for ${grade}% grade`
          }
        ])
        .select()

      if (error) {
        throw error
      }

      setMessage(`✅ Test progress added! Student: ${studentName}, Grade: ${grade}%. 
      
📋 Data inserted:
• Student ID: test-student-${Math.random().toString(36).substr(2, 9)}
• Classroom: Class 1 (classroom-1)
• Grade: ${grade}%
• Time: ${new Date().toLocaleTimeString()}

🔔 This should trigger the database trigger → Edge Function → MongoDB sync automatically.

⏳ Wait a few seconds then check the Class Averages section below to see if it updated...`)
      
      // Don't auto-refresh, let user see the message and manually check
      // setTimeout(() => {
      //   window.location.reload()
      // }, 2000)
      
    } catch (error) {
      console.error('Error adding test progress:', error)
      setMessage(`❌ Error: ${(error as Error).message}`)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">🧪 Test Automatic MongoDB Sync</h3>
      <p className="text-yellow-700 mb-4">
        Click the button below to add test progress data. This should automatically trigger the MongoDB sync via database triggers.
      </p>
      
      <button
        onClick={addTestProgress}
        disabled={isAdding}
        className={`px-4 py-2 rounded-lg font-medium ${
          isAdding
            ? 'bg-yellow-300 text-yellow-600 cursor-not-allowed'
            : 'bg-yellow-500 text-white hover:bg-yellow-600'
        }`}
      >
        {isAdding ? '⏳ Adding Test Progress...' : '🚀 Add Test Progress & Trigger Sync'}
      </button>
      
      {message && (
        <div className="mt-4 p-3 bg-white border rounded-md">
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  )
}