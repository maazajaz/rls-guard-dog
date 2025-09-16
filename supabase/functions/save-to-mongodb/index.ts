import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { documents } = await req.json()
    
    console.log(`💾 Received ${documents?.length || 0} documents to save to MongoDB`)
    
    const mongoUrl = Deno.env.get('MONGODB_URL')
    if (!mongoUrl) {
      throw new Error('MONGODB_URL environment variable not set')
    }

    // For now, we'll use a workaround since Deno Edge Functions have limited MongoDB support
    // We'll call our Next.js API route which has full MongoDB access
    const nextApiUrl = 'https://your-vercel-deployment.vercel.app/api/sync-class-averages'
    
    console.log('📞 Calling Next.js API to save to MongoDB...')
    
    const response = await fetch(nextApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'save_direct',
        data: documents
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to save to MongoDB: ${response.status}`)
    }

    const result = await response.json()
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully saved to MongoDB',
        result: result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('❌ Error saving to MongoDB:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})