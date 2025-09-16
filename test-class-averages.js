// Test script for class averages Edge Function
// Run this with: node test-class-averages.js

const fetch = require('node-fetch');

// Configuration - update these with your actual values
const SUPABASE_URL = 'https://your-project-ref.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';

async function testCalculateClassAverages() {
  console.log('🧪 Testing Class Averages Edge Function...\n');

  try {
    console.log('📊 Calling calculate-class-averages function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-class-averages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n🎉 Success! Calculated ${result.calculatedAverages} class averages`);
      console.log(`📅 Period: ${result.period}`);
      
      if (result.summary && result.summary.length > 0) {
        console.log('\n📈 Summary:');
        result.summary.forEach((item, index) => {
          console.log(`${index + 1}. ${item.classroom}: ${item.average}% (${item.students} students, ${item.reports} reports)`);
        });
      }
    } else {
      console.log(`\n❌ Calculation failed: ${result.message}`);
      if (result.error) {
        console.log(`Error details: ${result.error}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function testGetClassAverages() {
  console.log('\n🧪 Testing Get Class Averages Function...\n');

  try {
    console.log('📊 Calling get-class-averages function...');
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/get-class-averages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // period: '2025-09' // Optional filter
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    console.log('✅ Response received:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      console.log(`\n🎉 Retrieved ${result.totalAverages} class averages`);
      
      if (result.averages && result.averages.length > 0) {
        console.log('\n📈 Class Averages:');
        result.averages.forEach((avg, index) => {
          console.log(`${index + 1}. ${avg.classroomName}: ${avg.averageGrade}% (${avg.totalStudents} students)`);
        });
      }

      if (result.groupedBySchool) {
        console.log('\n🏫 Grouped by School:');
        Object.keys(result.groupedBySchool).forEach(schoolId => {
          console.log(`School ${schoolId}: ${result.groupedBySchool[schoolId].length} classrooms`);
        });
      }
    } else {
      console.log(`\n❌ Retrieval failed: ${result.error}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Edge Function Tests');
  console.log('=================================\n');

  // Test calculation function
  await testCalculateClassAverages();
  
  // Wait a moment before testing retrieval
  console.log('\n⏱️ Waiting 3 seconds before testing retrieval...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test retrieval function
  await testGetClassAverages();
  
  console.log('\n✅ All tests completed!');
}

// Only run if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCalculateClassAverages,
  testGetClassAverages,
  runTests
};