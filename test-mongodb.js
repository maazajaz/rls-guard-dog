// Test MongoDB connection
// Run this with: node test-mongodb.js

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const client = new MongoClient(process.env.MONGODB_URL);
  
  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test database access
    const db = client.db('rls_guard_dog');
    const collections = await db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    // Test creating a document
    const testCollection = db.collection('test');
    const result = await testCollection.insertOne({ 
      test: true, 
      timestamp: new Date(),
      message: 'Hello from RLS Guard Dog!' 
    });
    console.log('✅ Test document created:', result.insertedId);
    
    // Clean up test document
    await testCollection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Test document cleaned up');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your MONGODB_URL in .env.local');
    console.log('2. Ensure your IP is whitelisted in MongoDB Atlas');
    console.log('3. Verify username/password are correct');
  } finally {
    await client.close();
    console.log('👋 Connection closed');
  }
}

testConnection();
