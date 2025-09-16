import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // This endpoint will help us see if the automatic triggers are working
    const now = new Date().toISOString()
    
    console.log(`🔍 [${now}] Checking if automatic sync should have triggered...`)
    
    // Check recent progress additions
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    const { data: recentProgress, error } = await supabase
      .from('progress')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (error) {
      throw error
    }
    
    console.log(`📊 Found ${recentProgress?.length || 0} recent progress records`)
    
    return NextResponse.json({
      success: true,
      message: 'Progress check completed',
      recent_progress: recentProgress,
      check_time: now,
      note: 'If progress was added recently, automatic triggers should have fired'
    })

  } catch (error) {
    console.error('❌ Error checking progress:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}