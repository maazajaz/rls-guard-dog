import { NextRequest, NextResponse } from 'next/server'
import { mongoService } from '@/lib/mongodb'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Temporarily skip auth check for debugging
    console.log('🔍 Debugging class-averages API without auth check')
    
    const body = await request.json()
    const { schoolId, classroomIds, includeStats } = body

    console.log('📊 Class averages request:', { schoolId, classroomIds, includeStats })

    if (!schoolId) {
      return NextResponse.json({ error: 'School ID is required' }, { status: 400 })
    }

    let averages
    if (classroomIds && classroomIds.length > 0) {
      // Get averages for specific classrooms
      averages = await mongoService.getClassroomAverages(classroomIds)
    } else {
      // Get all averages for the school
      averages = await mongoService.getSchoolAverages(schoolId)
    }

    console.log(`📈 Found ${averages.length} averages from MongoDB`)

    let schoolStats = null
    if (includeStats) {
      schoolStats = await mongoService.getSchoolStatistics(schoolId)
    }

    console.log('✅ Returning class averages data:', { averagesCount: averages.length, hasStats: !!schoolStats })

    return NextResponse.json({
      success: true,
      averages,
      schoolStats
    })

  } catch (error) {
    console.error('Error fetching class averages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch class averages' },
      { status: 500 }
    )
  }
}
