// Test MongoDB service directly
const { mongoService } = require('./src/lib/mongodb.js')

async function testMongoService() {
  try {
    console.log('🔍 Testing MongoDB service...')
    
    // Test school averages
    const schoolId = '2d760439-19b7-4bb8-bfd6-f50b58f6f869'
    const averages = await mongoService.getSchoolAverages(schoolId)
    
    console.log(`📊 Found ${averages.length} averages for school ${schoolId}`)
    
    if (averages.length > 0) {
      console.log('✅ Sample average:', JSON.stringify(averages[0], null, 2))
    } else {
      console.log('❌ No averages found in MongoDB')
      
      // Try to get all documents
      console.log('🔍 Checking all documents in collection...')
      const collection = await mongoService.getClassAveragesCollection()
      const allDocs = await collection.find({}).toArray()
      console.log(`📄 Total documents in collection: ${allDocs.length}`)
      
      if (allDocs.length > 0) {
        console.log('📋 Sample document:', JSON.stringify(allDocs[0], null, 2))
      }
    }
    
  } catch (error) {
    console.error('❌ MongoDB test failed:', error)
  }
}

testMongoService()