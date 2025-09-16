// Test if data was actually saved to MongoDB
require('dotenv').config({ path: '.env.local' })
const { MongoClient } = require('mongodb')

async function checkMongoDB() {
  try {
    console.log('Connecting to MongoDB to verify data...')
    
    const client = new MongoClient(process.env.MONGODB_URL)
    await client.connect()
    
    const db = client.db('rls_guard_dog')
    const collection = db.collection('class_averages')
    
    const documents = await collection.find({}).toArray()
    console.log(`📊 Found ${documents.length} documents in class_averages collection:`)
    
    documents.forEach((doc, index) => {
      console.log(`\nDocument ${index + 1}:`)
      console.log(`  Classroom: ${doc.classroom_name}`)
      console.log(`  Average Grade: ${doc.average_grade}%`)
      console.log(`  Total Students: ${doc.total_students}`)
      console.log(`  Excellent: ${doc.excellent_count}`)
      console.log(`  Good: ${doc.good_count}`)
      console.log(`  Last Updated: ${doc.last_updated}`)
    })
    
    await client.close()
    console.log('\n✅ MongoDB verification complete!')
    
  } catch (error) {
    console.error('❌ Error checking MongoDB:', error)
  }
}

checkMongoDB()
