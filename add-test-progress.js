// Simple test to add progress for existing user
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfsadbwvdjexsbcyiwxt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmc2FkYnd2ZGpleHNiY3lpd3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODU4MywiZXhwIjoyMDczNTM0NTgzfQ.BU1sYnCD7Y5-e3fCOCunprssMv3uYxOrfN6B-CNFXEM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addTestProgress() {
  try {
    console.log('🧪 Adding test progress record...')
    
    // Get existing data
    const { data: classrooms } = await supabase
      .from('classrooms')
      .select('id, name')
      .limit(1)
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .limit(1)
    
    if (!classrooms?.length || !profiles?.length) {
      console.log('❌ No classrooms or profiles found')
      return
    }
    
    const classroom = classrooms[0]
    const user = profiles[0]
    
    console.log(`📝 Adding progress for ${user.full_name} in ${classroom.name}`)
    
    // Add new progress record
    const { data, error } = await supabase
      .from('progress')
      .insert({
        student_id: user.id,
        classroom_id: classroom.id,
        grade: Math.floor(Math.random() * 30) + 70, // Random grade 70-100
        feedback: `Test progress record - ${new Date().toLocaleTimeString()}`,
        report_date: new Date().toISOString().split('T')[0]
      })
      .select()
    
    if (error) {
      console.error('❌ Error adding progress:', error)
      return
    }
    
    console.log('✅ Progress added successfully!')
    console.log('📊 Data:', data)
    console.log('🔔 This should trigger the Edge Function automatically!')
    console.log('📈 Check Supabase logs to see if the trigger worked')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

addTestProgress()