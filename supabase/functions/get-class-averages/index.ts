import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { MongoClient } from "https://deno.land/x/mongo@v0.32.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body for optional period filter
    const body = req.method === 'POST' ? await req.json() : {}
    const { period, schoolId, classroomId } = body

    // Initialize MongoDB client
    const mongoUrl = Deno.env.get('MONGODB_URL')!
    const client = new MongoClient()
    await client.connect(mongoUrl)
    
    const db = client.database("rls_guard_dog")
    const collection = db.collection("class_averages")

    console.log('📊 Fetching class averages from MongoDB...')

    // Build query filter
    const filter: any = {}
    if (period) filter.period = period
    if (schoolId) filter.schoolId = schoolId
    if (classroomId) filter.classroomId = classroomId

    // Fetch averages with optional filtering
    const averages = await collection
      .find(filter)
      .sort({ lastCalculated: -1 })
      .limit(100)
      .toArray()

    // Close MongoDB connection
    await client.close()

    console.log(`✅ Retrieved ${averages.length} class averages`)

    // Transform data for response
    const transformedAverages = averages.map(avg => ({
      classroomId: avg.classroomId,
      classroomName: avg.classroomName,
      schoolId: avg.schoolId,
      averageGrade: avg.averageGrade,
      totalStudents: avg.totalStudents,
      totalReports: avg.totalReports,
      lastCalculated: avg.lastCalculated,
      period: avg.period
    }))

    // Group by school for better organization
    const groupedBySchool = transformedAverages.reduce((acc, avg) => {
      if (!acc[avg.schoolId]) {
        acc[avg.schoolId] = []
      }
      acc[avg.schoolId].push(avg)
      return acc
    }, {} as Record<string, any[]>)

    const response = {
      success: true,
      totalAverages: averages.length,
      averages: transformedAverages,
      groupedBySchool,
      period: period || 'all',
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Error in get-class-averages function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        averages: [],
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
 * supabase functions deploy get-class-averages
 * 
 * To invoke this function:
 * curl -X POST 'https://your-project-ref.supabase.co/functions/v1/get-class-averages' \
 *   -H 'Authorization: Bearer YOUR_SUPABASE_ANON_KEY' \
 *   -H 'Content-Type: application/json' \
 *   -d '{"period": "2025-09", "schoolId": "optional"}'
 */