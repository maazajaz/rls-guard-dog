// Test the sync API route
require('dotenv').config({ path: '.env.local' })

async function testSyncAPI() {
  try {
    console.log('Testing sync API route...')
    
    const response = await fetch('http://localhost:3000/api/sync-class-averages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const result = await response.json()
    console.log('Sync API Response:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('Error testing sync API:', error)
  }
}

testSyncAPI()
