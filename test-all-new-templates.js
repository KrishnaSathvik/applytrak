const FUNCTIONS_BASE = 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1';

// Test data for Krishna
const testData = {
  email: 'krishnasathvikm@gmail.com',
  name: 'Krishna',
  achievementId: 1, // Assuming achievement ID 1 exists
  applicationId: 1, // Assuming application ID 1 exists
  goalType: 'weekly'
};

// Test function to make HTTP requests
async function testEmailFunction(functionName, testData) {
  try {
    console.log(`🧪 Testing ${functionName}...`);
    
    const response = await fetch(`${FUNCTIONS_BASE}/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.text();
    
    if (response.ok) {
      console.log(`✅ ${functionName}: SUCCESS`);
      console.log(`   Response: ${result.substring(0, 100)}...`);
    } else {
      console.log(`❌ ${functionName}: FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result}`);
    }
    
    console.log('');
    return response.ok;
  } catch (error) {
    console.log(`❌ ${functionName}: ERROR`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    return false;
  }
}

// Test all new email templates
async function testAllNewTemplates() {
  console.log('🚀 Testing All New Email Templates\n');
  console.log('=' .repeat(50));
  
  const templates = [
    {
      name: 'achievement-unlocked-email',
      data: {
        email: testData.email,
        name: testData.name,
        achievementId: testData.achievementId
      }
    },
    {
      name: 'weekly-achievement-summary-email',
      data: {
        email: testData.email,
        name: testData.name
      }
    },
    {
      name: 'goal-achievement-email',
      data: {
        email: testData.email,
        name: testData.name,
        goalType: testData.goalType
      }
    },
    {
      name: 'interview-scheduled-email',
      data: {
        email: testData.email,
        name: testData.name,
        applicationId: testData.applicationId
      }
    },
    {
      name: 'offer-received-email',
      data: {
        email: testData.email,
        name: testData.name,
        applicationId: testData.applicationId
      }
    },
    {
      name: 'followup-reminder-email',
      data: {
        email: testData.email,
        name: testData.name
      }
    }
  ];
  
  let successCount = 0;
  let totalCount = templates.length;
  
  for (const template of templates) {
    const success = await testEmailFunction(template.name, template.data);
    if (success) successCount++;
  }
  
  console.log('=' .repeat(50));
  console.log(`📊 Results: ${successCount}/${totalCount} templates working`);
  
  if (successCount === totalCount) {
    console.log('🎉 All new email templates are working perfectly!');
  } else {
    console.log('⚠️  Some templates need attention. Check the errors above.');
  }
}

// Run the tests
testAllNewTemplates().catch(console.error);
