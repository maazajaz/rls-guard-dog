// Simple test to check if triggers are set up correctly
// Run this to verify the database triggers are working

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfsadbwvdjexsbcyiwxt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmc2FkYnd2ZGpleHNiY3lpd3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODU4MywiZXhwIjoyMDczNTM0NTgzfQ.BU1sYnCD7Y5-e3fCOCunprssMv3uYxOrfN6B-CNFXEM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkTriggersSetup() {
  try {
    console.log('🔍 Checking if triggers are properly set up...')
    
    // Check if the trigger function exists
    const { data: functions, error: functionError } = await supabase
      .rpc('sql', {
        query: `
          SELECT proname, prosrc 
          FROM pg_proc 
          WHERE proname = 'trigger_class_average_calculation'
        `
      })
    
    if (functionError) {
      console.log('⚠️ Function check failed, this is expected if you haven\'t run the SQL yet')
      console.log('📝 Please run the SQL from 0003_setup_automatic_triggers.sql in your Supabase dashboard')
      return
    }
    
    console.log('✅ Trigger function exists!')
    
    // Check if triggers exist
    const { data: triggers, error: triggerError } = await supabase
      .rpc('sql', {
        query: `
          SELECT trigger_name, event_manipulation, event_object_table 
          FROM information_schema.triggers 
          WHERE trigger_name LIKE 'trigger_progress_%'
        `
      })
    
    if (triggerError) {
      console.log('⚠️ Trigger check failed, please make sure you ran the SQL')
      return
    }
    
    if (triggers && triggers.length > 0) {
      console.log('✅ Triggers are set up!')
      triggers.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name} on ${trigger.event_manipulation}`)
      })
    } else {
      console.log('❌ No triggers found. Please run the SQL migration.')
    }
    
  } catch (error) {
    console.error('❌ Error checking triggers:', error.message)
    console.log('\n📝 NEXT STEPS:')
    console.log('1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qfsadbwvdjexsbcyiwxt')
    console.log('2. Click on "SQL Editor"')
    console.log('3. Copy and paste the SQL from supabase/migrations/0003_setup_automatic_triggers.sql')
    console.log('4. Click "Run" to execute the SQL')
    console.log('5. Come back and run this test again')
  }
}

checkTriggersSetup()
