// Test a single function to debug the authentication issue
const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

async function testFunction() {
  try {
    console.log('🧪 Testing achievements-announcement function...');
    
    const response = await fetch(`${FUNCTIONS_BASE}/achievements-announcement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'krishnasathvikm@gmail.com',
        name: 'Krishna'
      })
    });
    
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result}`);
    
    if (response.ok) {
      console.log('✅ Function works!');
    } else {
      console.log('❌ Function failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFunction();
