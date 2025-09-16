import { MongoClient, Db, Collection } from 'mongodb'

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

export interface ClassroomAverage {
  _id?: string
  classroom_id: string
  classroom_name: string
  school_id: string
  average_grade: number
  total_students: number
  total_reports: number
  last_updated: Date
  grade_distribution: {
    excellent: number
    good: number
    satisfactory: number
    needs_improvement: number
  }
}

interface MongoClassroomAverage {
  _id?: string
  classroom_id: string
  classroom_name: string
  school_id: string
  average_grade: number
  total_students: number
  total_reports: number
  last_updated: Date
  excellent_count: number
  good_count: number
  satisfactory_count: number
  needs_improvement_count: number
}

class MongoDBService {
  private client!: MongoClient
  private clientPromise: Promise<MongoClient>

  constructor() {
    if (!process.env.MONGODB_URL) {
      throw new Error('Please add your MongoDB URL to .env.local')
    }

    if (process.env.NODE_ENV === 'development') {
      // In development mode, use a global variable to preserve the value
      // across module reloads caused by HMR (Hot Module Replacement).
      if (!global._mongoClientPromise) {
        this.client = new MongoClient(process.env.MONGODB_URL)
        global._mongoClientPromise = this.client.connect()
      }
      this.clientPromise = global._mongoClientPromise
    } else {
      // In production mode, it's best to not use a global variable.
      this.client = new MongoClient(process.env.MONGODB_URL)
      this.clientPromise = this.client.connect()
    }
  }

  async getDatabase(): Promise<Db> {
    const client = await this.clientPromise
    return client.db('rls_guard_dog')
  }

  async getClassAveragesCollection(): Promise<Collection<MongoClassroomAverage>> {
    const db = await this.getDatabase()
    return db.collection<MongoClassroomAverage>('class_averages')
  }

  // Get class averages for a specific school
  async getSchoolAverages(schoolId: string): Promise<ClassroomAverage[]> {
    const collection = await this.getClassAveragesCollection()
    const rawData = await collection
      .find({ school_id: schoolId })
      .sort({ average_grade: -1 })
      .toArray()
    
    // Transform the data to match the expected structure
    return rawData.map(doc => ({
      ...doc,
      grade_distribution: {
        excellent: doc.excellent_count || 0,
        good: doc.good_count || 0,
        satisfactory: doc.satisfactory_count || 0,
        needs_improvement: doc.needs_improvement_count || 0
      }
    }))
  }

  // Get class averages for specific classrooms
  async getClassroomAverages(classroomIds: string[]): Promise<ClassroomAverage[]> {
    const collection = await this.getClassAveragesCollection()
    const rawData = await collection
      .find({ classroom_id: { $in: classroomIds } })
      .sort({ average_grade: -1 })
      .toArray()
    
    // Transform the data to match the expected structure
    return rawData.map(doc => ({
      ...doc,
      grade_distribution: {
        excellent: doc.excellent_count || 0,
        good: doc.good_count || 0,
        satisfactory: doc.satisfactory_count || 0,
        needs_improvement: doc.needs_improvement_count || 0
      }
    }))
  }

  // Get overall school statistics
  async getSchoolStatistics(schoolId: string) {
    const collection = await this.getClassAveragesCollection()
    
    const stats = await collection.aggregate([
      { $match: { school_id: schoolId } },
      {
        $group: {
          _id: null,
          total_classrooms: { $sum: 1 },
          overall_average: { $avg: "$average_grade" },
          total_students: { $sum: "$total_students" },
          total_reports: { $sum: "$total_reports" },
          excellent_total: { $sum: "$excellent_count" },
          good_total: { $sum: "$good_count" },
          satisfactory_total: { $sum: "$satisfactory_count" },
          needs_improvement_total: { $sum: "$needs_improvement_count" }
        }
      }
    ]).toArray()

    return stats[0] || {
      total_classrooms: 0,
      overall_average: 0,
      total_students: 0,
      total_reports: 0,
      excellent_total: 0,
      good_total: 0,
      satisfactory_total: 0,
      needs_improvement_total: 0
    }
  }

  // Manually trigger recalculation (for testing)
  async triggerRecalculation(): Promise<Response> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration')
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/calculate-class-averages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    })

    return response
  }
}

// Export a singleton instance
export const mongoService = new MongoDBService()
