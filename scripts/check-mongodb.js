const { MongoClient } = require('mongodb')

const MONGODB_URI = 'mongodb+srv://maazajaz777:9R9wfBHfKAJA6v8i@cluster0.uxvol.mongodb.net/rls_guardian?retryWrites=true&w=majority&appName=Cluster0'

async function checkMongoDB() {
  console.log('🔍 Checking MongoDB data...')
  
  const client = new MongoClient(MONGODB_URI)
  
  try {
    await client.connect()
    console.log('✅ Connected to MongoDB')
    
    const db = client.database('rls_guardian')
    const collection = db.collection('class_averages')
    
    const documents = await collection.find({}).toArray()
    
    console.log(`📊 Found ${documents.length} documents in class_averages collection:`)
    
    for (const doc of documents) {
      console.log(`\n🏫 ${doc.classroom_name}:`)
      console.log(`   📈 Average: ${doc.average_grade}%`)
      console.log(`   👥 Students: ${doc.total_students}`)
      console.log(`   📋 Reports: ${doc.total_reports}`)
      console.log(`   🕐 Last Updated: ${new Date(doc.last_updated).toLocaleString()}`)
      console.log(`   📊 Distribution: ${doc.excellent_count}/${doc.good_count}/${doc.satisfactory_count}/${doc.needs_improvement_count}`)
    }
    
    if (documents.length === 0) {
      console.log('📭 No documents found in MongoDB')
    }
    
  } catch (error) {
    console.error('❌ MongoDB error:', error)
  } finally {
    await client.close()
    console.log('🔒 MongoDB connection closed')
  }
}

checkMongoDB()