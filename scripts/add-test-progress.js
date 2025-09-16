const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://pgkacugrlsmvudxjklfo.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBna2FjdWdybHNtdnVkeGprbGZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1MDI0NjEsImV4cCI6MjA1MDA3ODQ2MX0.AJZQFKoGSEiWD7rAUDzB6e9ZWoE8SuLMYZkbr_ZqOxQ'

const supabase = createClient(supabaseUrl, supabaseKey)

async function addTestProgress() {
  console.log('🧪 Adding test progress to trigger automatic sync...')
  
  try {
    // Generate random grade
    const grade = Math.floor(Math.random() * 30) + 70 // 70-100
    
    const { data, error } = await supabase
      .from('progress')
      .insert([
        {
          student_id: 'test-student-' + Math.random().toString(36).substr(2, 9),
          student_name: 'Test Student ' + Date.now(),
          classroom_id: 'classroom-1', // Class 1
          grade: grade,
          report_date: new Date().toISOString()
        }
      ])
      .select()

    if (error) {
      console.error('❌ Error adding progress:', error)
      return
    }

    console.log('✅ Test progress added successfully!')
    console.log('📊 Data:', data)
    console.log('🎯 Grade:', grade)
    console.log('⏱️ This should trigger automatic MongoDB sync...')
    
    // Wait a moment for the trigger to fire
    console.log('⏳ Waiting 3 seconds for automatic sync...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    console.log('✅ Done! Check your dashboard to see if it updated automatically.')
    
  } catch (error) {
    console.error('💥 Script error:', error)
  }
}

addTestProgress()