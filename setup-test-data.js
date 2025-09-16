// Setup test data for the RLS Guard Dog system
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qfsadbwvdjexsbcyiwxt.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmc2FkYnd2ZGpleHNiY3lpd3h0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Nzk1ODU4MywiZXhwIjoyMDczNTM0NTgzfQ.BU1sYnCD7Y5-e3fCOCunprssMv3uYxOrfN6B-CNFXEM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupTestData() {
  try {
    console.log('🏗️ Setting up test data...')
    
    // 1. Create a school
    const { data: schools, error: schoolError } = await supabase
      .from('schools')
      .insert({ name: 'Test Elementary School' })
      .select()
    
    if (schoolError) {
      console.error('❌ Error creating school:', schoolError)
      return
    }
    
    const schoolId = schools[0].id
    console.log('✅ Created school:', schools[0].name)
    
    // 2. Create a classroom
    const { data: classrooms, error: classroomError } = await supabase
      .from('classrooms')
      .insert({ 
        name: 'Class 1',
        school_id: schoolId
      })
      .select()
    
    if (classroomError) {
      console.error('❌ Error creating classroom:', classroomError)
      return
    }
    
    const classroomId = classrooms[0].id
    console.log('✅ Created classroom:', classrooms[0].name)
    
    // 3. Create test users (Note: In real app, these would be created via auth)
    // For testing, we'll create profiles with fake UUIDs
    const teacherId = '6d8910db-30df-44fc-a51f-ec57d213ac08' // Your current user ID
    const studentIds = [
      'aaaaaaaa-bbbb-cccc-dddd-000000000001',
      'aaaaaaaa-bbbb-cccc-dddd-000000000002',
      'aaaaaaaa-bbbb-cccc-dddd-000000000003'
    ]
    
    // Create teacher profile
    const { data: teacherProfile, error: teacherError } = await supabase
      .from('profiles')
      .upsert({
        id: teacherId,
        full_name: 'John Teacher',
        role: 'teacher',
        school_id: schoolId
      })
      .select()
    
    if (teacherError) {
      console.log('⚠️ Teacher profile error (might already exist):', teacherError.message)
    } else {
      console.log('✅ Created/updated teacher profile')
    }
    
    // Create student profiles
    for (let i = 0; i < studentIds.length; i++) {
      const { data: studentProfile, error: studentError } = await supabase
        .from('profiles')
        .upsert({
          id: studentIds[i],
          full_name: `Student ${i + 1}`,
          role: 'student',
          school_id: schoolId
        })
        .select()
      
      if (studentError) {
        console.log(`⚠️ Student ${i + 1} profile error:`, studentError.message)
      } else {
        console.log(`✅ Created student profile: Student ${i + 1}`)
      }
    }
    
    // 4. Assign teacher to classroom
    const { data: assignment, error: assignmentError } = await supabase
      .from('classroom_teachers')
      .upsert({
        classroom_id: classroomId,
        teacher_id: teacherId
      })
      .select()
    
    if (assignmentError) {
      console.log('⚠️ Teacher assignment error:', assignmentError.message)
    } else {
      console.log('✅ Assigned teacher to classroom')
    }
    
    // 5. Create initial progress records
    const progressRecords = [
      { student_id: studentIds[0], grade: 85, feedback: 'Good work on math' },
      { student_id: studentIds[0], grade: 92, feedback: 'Excellent reading comprehension' },
      { student_id: studentIds[1], grade: 78, feedback: 'Needs improvement in writing' },
      { student_id: studentIds[1], grade: 88, feedback: 'Great progress in science' },
      { student_id: studentIds[2], grade: 95, feedback: 'Outstanding performance' },
      { student_id: studentIds[2], grade: 90, feedback: 'Excellent math skills' }
    ]
    
    for (const record of progressRecords) {
      const { data: progress, error: progressError } = await supabase
        .from('progress')
        .insert({
          student_id: record.student_id,
          classroom_id: classroomId,
          grade: record.grade,
          feedback: record.feedback,
          report_date: new Date().toISOString().split('T')[0]
        })
        .select()
      
      if (progressError) {
        console.log(`⚠️ Progress record error:`, progressError.message)
      } else {
        console.log(`✅ Created progress record: Grade ${record.grade}`)
      }
    }
    
    console.log('🎉 Test data setup complete!')
    console.log('📊 Summary:')
    console.log(`   - School: ${schools[0].name}`)
    console.log(`   - Classroom: ${classrooms[0].name}`)
    console.log(`   - Students: 3`)
    console.log(`   - Progress Records: ${progressRecords.length}`)
    console.log('💡 Now you can test the automatic trigger!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupTestData()