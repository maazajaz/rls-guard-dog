// Test the updated MongoDB service
require('dotenv').config({ path: '.env.local' })
const { mongoService } = require('./src/lib/mongodb')

async function testMongoDB() {
  try {
    console.log('Testing updated MongoDB service...')
    
    // Test getting school averages (you may need to adjust the school_id)
    const schoolId = '2d760439-19b7-4bb8-bfd6-f50b58f6f869' // From our previous data
    const averages = await mongoService.getSchoolAverages(schoolId)
    
    console.log(`📊 Found ${averages.length} class averages for school:`)
    
    averages.forEach((avg, index) => {
      console.log(`\nClass ${index + 1}:`)
      console.log(`  Name: ${avg.classroom_name}`)
      console.log(`  Average: ${avg.average_grade}%`)
      console.log(`  Grade Distribution:`)
      console.log(`    Excellent (90-100): ${avg.grade_distribution.excellent}`)
      console.log(`    Good (80-89): ${avg.grade_distribution.good}`)
      console.log(`    Satisfactory (70-79): ${avg.grade_distribution.satisfactory}`)
      console.log(`    Needs Improvement (<70): ${avg.grade_distribution.needs_improvement}`)
    })
    
    console.log('\n✅ MongoDB service test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error testing MongoDB service:', error)
  }
}

testMongoDB()
