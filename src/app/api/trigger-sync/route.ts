import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Manual trigger: Calling Edge Function...')
    
    // Call the Supabase Edge Function
    const functionUrl = 'https://pgkacugrlsmvudxjklfo.supabase.co/functions/v1/calculate-class-averages'
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trigger: 'manual',
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function failed: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Edge Function result:', result)

    return NextResponse.json({
      success: true,
      message: 'Edge Function triggered successfully',
      result: result
    })

  } catch (error) {
    console.error('❌ Error triggering Edge Function:', error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message
      },
      { status: 500 }
    )
  }
}