import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClassAverage {
  classroomId: string
  classroomName: string
  schoolId: string
  averageGrade: number
  totalStudents: number
  totalReports: number
  lastCalculated: Date
  period: string
}

interface ProgressData {
  classroom_id: string
  classrooms: {
    name: string
    school_id: string
  }
  grade: number
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Initialize MongoDB client
    const mongoUrl = Deno.env.get('MONGODB_URL')!
    const client = new MongoClient()
    await client.connect(mongoUrl)
    
    const db = client.database("rls_guard_dog")
    const collection = db.collection("class_averages")

    console.log('🚀 Starting class averages calculation...')

    // Fetch all progress data with classroom information
    const { data: progressData, error: progressError } = await supabase
      .from('progress')
      .select(`
        classroom_id,
        grade,
        report_date,
        classrooms (
          name,
          school_id
        )
      `)
      .not('grade', 'is', null)

    if (progressError) {
      throw new Error(`Failed to fetch progress data: ${progressError.message}`)
    }

    if (!progressData || progressData.length === 0) {
      console.log('⚠️ No progress data found')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No progress data to calculate averages from',
          calculatedAverages: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📊 Processing ${progressData.length} progress records...`)

    // Group progress data by classroom
    const classroomGroups = new Map<string, ProgressData[]>()
    
    for (const record of progressData as ProgressData[]) {
      if (!record.classroom_id || !record.classrooms) continue
      
      if (!classroomGroups.has(record.classroom_id)) {
        classroomGroups.set(record.classroom_id, [])
      }
      classroomGroups.get(record.classroom_id)!.push(record)
    }

    console.log(`🏫 Found ${classroomGroups.size} classrooms to process`)

    // Calculate averages for each classroom
    const classAverages: ClassAverage[] = []
    const currentPeriod = new Date().toISOString().slice(0, 7) // YYYY-MM format

    for (const [classroomId, records] of classroomGroups) {
      if (records.length === 0) continue

      const classroom = records[0].classrooms
      const grades = records.map(r => r.grade).filter(g => g !== null && g !== undefined)
      
      if (grades.length === 0) continue

      // Calculate average grade
      const averageGrade = grades.reduce((sum, grade) => sum + grade, 0) / grades.length
      
      // Get unique students count
      const uniqueStudents = new Set(records.map(r => `${r.classroom_id}`)).size

      const classAverage: ClassAverage = {
        classroomId,
        classroomName: classroom.name,
        schoolId: classroom.school_id,
        averageGrade: Math.round(averageGrade * 100) / 100, // Round to 2 decimal places
        totalStudents: uniqueStudents,
        totalReports: records.length,
        lastCalculated: new Date(),
        period: currentPeriod
      }

      classAverages.push(classAverage)
      
      console.log(`📈 ${classroom.name}: ${classAverage.averageGrade}% (${classAverage.totalReports} reports, ${classAverage.totalStudents} students)`)
    }

    if (classAverages.length === 0) {
      console.log('⚠️ No valid class averages calculated')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No valid class averages could be calculated',
          calculatedAverages: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Save to MongoDB
    console.log(`💾 Saving ${classAverages.length} class averages to MongoDB...`)

    // Delete existing records for current period to avoid duplicates
    await collection.deleteMany({ period: currentPeriod })

    // Insert new averages
    const insertResult = await collection.insertMany(classAverages)
    
    console.log(`✅ Successfully saved ${insertResult.insertedIds.length} class averages`)

    // Also save a summary to Supabase for quick access
    console.log('💾 Updating Supabase cache...')
    
    for (const avg of classAverages) {
      const { error: upsertError } = await supabase
        .from('class_averages_cache')
        .upsert({
          classroom_id: avg.classroomId,
          average_grade: avg.averageGrade,
          total_students: avg.totalStudents,
          total_reports: avg.totalReports,
          last_calculated: avg.lastCalculated.toISOString(),
          period: avg.period
        }, {
          onConflict: 'classroom_id,period'
        })

      if (upsertError) {
        console.error(`❌ Error updating cache for classroom ${avg.classroomId}:`, upsertError)
      }
    }

    // Close MongoDB connection
    await client.close()

    const response = {
      success: true,
      message: `Successfully calculated and saved class averages`,
      calculatedAverages: classAverages.length,
      period: currentPeriod,
      summary: classAverages.map(avg => ({
        classroom: avg.classroomName,
        average: avg.averageGrade,
        students: avg.totalStudents,
        reports: avg.totalReports
      }))
    }

    console.log('🎉 Class averages calculation completed successfully!')

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in calculate-class-averages function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

/* To deploy this function, run:
 * supabase functions deploy calculate-class-averages
 * 
 * To invoke this function:
 * curl -X POST 'https://your-project-ref.supabase.co/functions/v1/calculate-class-averages' \
 *   -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
 *   -H 'Content-Type: application/json'
 * 
 * Or call it from your app:
 * const { data, error } = await supabase.functions.invoke('calculate-class-averages')
 */