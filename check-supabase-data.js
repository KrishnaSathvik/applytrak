// Check Supabase Cloud Database for your data
// Run this in your browser console

console.log('🔍 CHECKING SUPABASE CLOUD DATABASE');
console.log('===================================');

// Check if Supabase client is available
const checkSupabaseData = async () => {
  try {
    // Try to access the Supabase client from the app
    const supabaseUrl = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
    
    // Create a simple fetch request to check applications
    const response = await fetch(`${supabaseUrl}/rest/v1/applications?select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Found ${data.length} applications in Supabase cloud database`);
      
      if (data.length > 0) {
        console.log('Sample applications:');
        data.slice(0, 5).forEach((app, index) => {
          console.log(`${index + 1}. ${app.company} - ${app.position} (${app.dateApplied})`);
        });
        
        const shouldSync = confirm(`Found ${data.length} applications in cloud database. Do you want to sync them back to your local app?`);
        if (shouldSync) {
          console.log('🔄 To sync this data back:');
          console.log('1. Make sure you\'re logged into your ApplyTrak account');
          console.log('2. The app should automatically sync this data');
          console.log('3. If not, try refreshing the page');
        }
      } else {
        console.log('❌ No applications found in cloud database');
      }
    } else {
      console.log('❌ Failed to access Supabase database:', response.status, response.statusText);
    }
  } catch (error) {
    console.log('❌ Error checking Supabase:', error);
  }
};

// Run the check
checkSupabaseData();
