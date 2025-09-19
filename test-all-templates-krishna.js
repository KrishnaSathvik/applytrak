// Test all email templates for Krishna only
const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

// Test user
const testUser = {
  email: 'krishnasathvikm@gmail.com',
  name: 'Krishna'
};

// Function to test a single email template
async function testEmailTemplate(templateName, user) {
  try {
    console.log(`🧪 Testing ${templateName} for ${user.name}...`);
    
    const response = await fetch(`${FUNCTIONS_BASE}/${templateName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        name: user.name
      })
    });
    
    const result = await response.text();
    
    if (response.ok) {
      console.log(`✅ ${templateName}: SUCCESS`);
      console.log(`   Response: ${result.substring(0, 100)}...`);
    } else {
      console.log(`❌ ${templateName}: FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result}`);
    }
    
    console.log('');
    return response.ok;
  } catch (error) {
    console.log(`❌ ${templateName}: ERROR`);
    console.log(`   Error: ${error.message}`);
    console.log('');
    return false;
  }
}

// Delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test all templates
async function testAllTemplates() {
  console.log('🚀 Testing all email templates for Krishna...');
  console.log(`📧 Email: ${testUser.email}`);
  console.log(`👤 Name: ${testUser.name}`);
  console.log('');

  const templates = [
    'welcome-email',
    'achievements-announcement',
    'weekly-goals-email',
    'weekly-tips-email',
    'milestone-email',
    'monthly-analytics-email',
    'inactivity-reminder-email'
  ];

  let successCount = 0;
  let totalCount = templates.length;

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    console.log(`📋 Testing ${i + 1}/${totalCount}: ${template}`);
    console.log('==================================================');
    
    const success = await testEmailTemplate(template, testUser);
    if (success) successCount++;
    
    // Wait 2 seconds between tests to avoid rate limiting
    if (i < templates.length - 1) {
      console.log('⏳ Waiting 2 seconds before next test...');
      await delay(2000);
    }
    console.log('');
  }

  console.log('🎯 TESTING COMPLETE!');
  console.log('==================================================');
  console.log(`📊 Results: ${successCount}/${totalCount} templates successful`);
  console.log(`✅ Success rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('🎉 All templates are working perfectly!');
  } else {
    console.log('⚠️  Some templates need attention.');
  }
}

// Run the tests
testAllTemplates();
