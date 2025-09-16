import { NextResponse } from 'next/server'
import { mongoService } from '@/lib/mongodb'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Verify user authentication and role
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to trigger recalculation (teachers and head teachers)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    if (profile.role === 'student') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Trigger the Edge Function to recalculate averages
    const response = await mongoService.triggerRecalculation()
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function failed: ${errorText}`)
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      message: 'Class averages recalculation triggered successfully',
      details: result
    })

  } catch (error) {
    console.error('Error triggering recalculation:', error)
    return NextResponse.json(
      { 
        error: 'Failed to trigger recalculation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
