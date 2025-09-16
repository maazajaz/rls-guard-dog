import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json().catch(() => ({}))
    
    const mongoUrl = process.env.MONGODB_URL
    if (!mongoUrl) {
      return NextResponse.json({ error: 'MongoDB URL not configured' }, { status: 500 })
    }

    let edgeResult

    // Check if this is a direct save request (from Edge Function trigger)
    if (requestBody.action === 'save_calculated_data' && requestBody.calculated_averages) {
      console.log('📥 Received direct save request from Edge Function trigger')
      edgeResult = {
        success: true,
        results: requestBody.calculated_averages
      }
    } else {
      // Call the Edge Function to get calculated averages (original behavior)
      console.log('📞 Calling Edge Function to calculate averages')
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      const edgeResponse = await fetch(`${supabaseUrl}/functions/v1/calculate-class-averages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!edgeResponse.ok) {
        const errorText = await edgeResponse.text()
        return NextResponse.json({ error: `Edge Function error: ${errorText}` }, { status: 500 })
      }

      edgeResult = await edgeResponse.json()
    }
    
    if (!edgeResult.success || !edgeResult.results) {
      return NextResponse.json({ error: 'No results from Edge Function' }, { status: 500 })
    }

    console.log(`💾 Saving ${edgeResult.results.length} class averages to MongoDB`)

    // Connect to MongoDB
    const client = new MongoClient(mongoUrl)
    await client.connect()
    
    const db = client.db('rls_guard_dog')
    const collection = db.collection('class_averages')

    // Prepare documents for MongoDB
    const documents = edgeResult.results.map((avg: any) => ({
      classroom_id: avg.classroom_id,
      classroom_name: avg.classroom_name,
      school_id: avg.school_id,
      average_grade: avg.average_grade,
      total_students: avg.total_students,
      total_reports: avg.total_reports,
      excellent_count: avg.grade_distribution.excellent,
      good_count: avg.grade_distribution.good,
      satisfactory_count: avg.grade_distribution.satisfactory,
      needs_improvement_count: avg.grade_distribution.needs_improvement,
      last_updated: new Date(avg.last_updated),
      created_at: new Date()
    }))

    // Clear existing data and insert new data
    await collection.deleteMany({})
    const result = await collection.insertMany(documents)

    await client.close()

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${result.insertedCount} class averages to MongoDB`,
      inserted_count: result.insertedCount,
      edge_function_results: edgeResult.results
    })

  } catch (error) {
    console.error('Error in sync-class-averages API:', error)
    return NextResponse.json({ 
      error: 'Failed to sync class averages',
      details: (error as Error).message 
    }, { status: 500 })
  }
}
