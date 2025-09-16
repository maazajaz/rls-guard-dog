// Test script to add a new progress record and verify automatic trigger
// Run this after setting up the triggers in Supabase

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfsadbwvdjexsbcyiwxt.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmc2FkYnd2ZGpleHNiY3lpd3h0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NTg1ODMsImV4cCI6MjA3MzUzNDU4M30.yrXbcqLaKYzK7TOcjwvq6tvgzbFqUSQPyp1NBifUEZ8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAutomaticTrigger() {
  try {
    console.log('🧪 Testing automatic trigger by adding new progress...')
    
    // First, let's get existing student and classroom IDs
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('role', 'student')
      .limit(1)
    
    const { data: classrooms, error: classroomError } = await supabase
      .from('classrooms')
      .select('id, name')
      .limit(1)
    
    if (profileError || classroomError || !profiles?.length || !classrooms?.length) {
      console.log('❌ No students or classrooms found. Please ensure you have data in your database.')
      console.log('Profile error:', profileError)
      console.log('Classroom error:', classroomError)
      return
    }
    
    const student = profiles[0]
    const classroom = classrooms[0]
    
    console.log(`📝 Adding progress for student: ${student.full_name} in classroom: ${classroom.name}`)
    
    // Add a new progress record
    const { data, error } = await supabase
      .from('progress')
      .insert({
        student_id: student.id,
        classroom_id: classroom.id,
        grade: 88, // New test grade
        feedback: 'Test progress for trigger verification',
        report_date: new Date().toISOString().split('T')[0]
      })
      .select()
    
    if (error) {
      console.error('❌ Error adding progress:', error)
      return
    }
    
    console.log('✅ Progress added successfully:', data)
    console.log('🔔 This should have triggered the Edge Function automatically!')
    console.log('📊 Check your Supabase Logs in the Dashboard to see if the Edge Function was called')
    console.log('📈 The class averages should update in MongoDB automatically')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testAutomaticTrigger()
