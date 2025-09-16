// Test script for the Edge Function
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = 'https://qfsadbwvdjexsbcyiwxt.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testEdgeFunction() {
  try {
    console.log('Testing Edge Function...')
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-class-averages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    })
    
    const result = await response.json()
    console.log('Response:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testEdgeFunction()
