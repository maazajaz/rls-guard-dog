import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

export async function POST(request: NextRequest) {
  try {
    const mongoUrl = process.env.MONGODB_URL
    if (!mongoUrl) {
      return NextResponse.json({ error: 'MongoDB URL not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { calculated_averages } = body

    if (!calculated_averages || !Array.isArray(calculated_averages)) {
      return NextResponse.json({ error: 'Invalid calculated averages data' }, { status: 400 })
    }

    console.log(`💾 Saving ${calculated_averages.length} calculated averages to MongoDB...`)

    // Connect to MongoDB
    const client = new MongoClient(mongoUrl)
    await client.connect()
    
    const db = client.db('rls_guard_dog')
    const collection = db.collection('class_averages')

    // Define type for calculated averages
    interface CalculatedAverage {
      classroom_id: string
      classroom_name: string
      school_id: string
      average_grade: number
      total_students: number
      total_reports: number
      last_updated: string
      grade_distribution: {
        excellent: number
        good: number
        satisfactory: number
        needs_improvement: number
      }
    }

    // Prepare documents for MongoDB
    const documents = calculated_averages.map((avg: CalculatedAverage) => ({
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

    console.log(`📤 Inserting ${documents.length} documents into MongoDB`)

    // Clear existing data and insert new data
    await collection.deleteMany({})
    const result = await collection.insertMany(documents)

    await client.close()

    console.log(`✅ Successfully saved ${result.insertedCount} documents to MongoDB`)

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${result.insertedCount} class averages to MongoDB`,
      inserted_count: result.insertedCount,
      documents: documents
    })

  } catch (error) {
    console.error('Error saving calculated data to MongoDB:', error)
    return NextResponse.json({ 
      error: 'Failed to save to MongoDB',
      details: (error as Error).message 
    }, { status: 500 })
  }
}