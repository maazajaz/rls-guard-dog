import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    console.log('🔄 Calling Edge Function directly...')
    
    const response = await fetch(`${supabaseUrl}/functions/v1/calculate-class-averages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        test: true,
        timestamp: new Date().toISOString()
      })
    })

    console.log('📡 Edge Function Response Status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Edge Function Error:', errorText)
      return NextResponse.json({ 
        error: 'Edge Function failed', 
        details: errorText,
        status: response.status 
      }, { status: 500 })
    }

    const result = await response.json()
    console.log('✅ Edge Function Success:', result)

    return NextResponse.json({
      success: true,
      message: 'Edge Function called successfully',
      result
    })

  } catch (error) {
    console.error('🔥 API Error:', error)
    return NextResponse.json({
      error: 'Failed to call Edge Function',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
