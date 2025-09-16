import { NextRequest, NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

// MongoDB connection setup
const MONGODB_URL = process.env.MONGODB_URL!

if (!MONGODB_URL) {
  throw new Error('Please define the MONGODB_URL environment variable in .env.local')
}

let cachedClient: MongoClient | null = null

async function connectToMongoDB() {
  if (cachedClient) {
    return cachedClient
  }

  try {
    const client = new MongoClient(MONGODB_URL)
    await client.connect()
    cachedClient = client
    return client
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    throw error
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📊 MongoDB save API called')
    
    const body = await request.json()
    const { documents, period } = body

    if (!documents || !Array.isArray(documents)) {
      return NextResponse.json(
        { success: false, error: 'Invalid documents data' },
        { status: 400 }
      )
    }

    console.log('💾 Saving', documents.length, 'documents to MongoDB')

    // Connect to MongoDB
    const client = await connectToMongoDB()
    const db = client.db('rls_guard_dog')
    const collection = db.collection('class_averages')

    // Delete existing records for the current period
    if (period) {
      const deleteResult = await collection.deleteMany({ period })
      console.log('🗑️ Deleted', deleteResult.deletedCount, 'existing records for period', period)
    }

    // Insert new documents
    const insertResult = await collection.insertMany(documents)
    console.log('✅ Inserted', insertResult.insertedCount, 'new documents')

    return NextResponse.json({
      success: true,
      insertedCount: insertResult.insertedCount,
      message: 'Documents saved successfully to MongoDB'
    })

  } catch (error) {
    console.error('❌ MongoDB save API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}