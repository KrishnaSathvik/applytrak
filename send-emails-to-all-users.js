const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

// JWT verification is now OFF for all email functions, so no auth needed!

// Your 3 users from database
const users = [
  {
    email: 'krishnasathvikm@gmail.com',
    name: 'Krishna'
  },
  {
    email: 'saitejaswinithumpala@gmail.com', 
    name: 'Tejuu'
  },
  {
    email: 'divyakodanganti@gmail.com',
    name: 'Divya Kodanganti'
  }
];

// Function to send welcome email
async function sendWelcomeEmail(user) {
  try {
    console.log(`📧 Sending welcome email to ${user.name} (${user.email})...`);
    
    const response = await fetch(`${FUNCTIONS_BASE}/welcome-email`, {
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
      console.log(`✅ Welcome email sent to ${user.name}: SUCCESS`);
      console.log(`   Response: ${result.substring(0, 100)}...`);
    } else {
      console.log(`❌ Welcome email failed for ${user.name}: FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result}`);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`❌ Welcome email error for ${user.name}: ${error.message}`);
    return false;
  }
}

// Function to send achievement announcement email
async function sendAchievementEmail(user) {
  try {
    console.log(`🎉 Sending achievement announcement to ${user.name} (${user.email})...`);
    
    const response = await fetch(`${FUNCTIONS_BASE}/achievements-announcement`, {
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
      console.log(`✅ Achievement email sent to ${user.name}: SUCCESS`);
      console.log(`   Response: ${result.substring(0, 100)}...`);
    } else {
      console.log(`❌ Achievement email failed for ${user.name}: FAILED`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${result}`);
    }
    
    return response.ok;
  } catch (error) {
    console.log(`❌ Achievement email error for ${user.name}: ${error.message}`);
    return false;
  }
}

// Function to wait for specified minutes
function wait(minutes) {
  return new Promise(resolve => setTimeout(resolve, minutes * 60 * 1000));
}

// Main function to send emails to all users
async function sendEmailsToAllUsers() {
  console.log('🚀 Starting email campaign to all 3 users...');
  console.log('📋 Users:', users.map(u => `${u.name} (${u.email})`).join(', '));
  console.log('⏰ Will wait 1 minute between each user');
  console.log('');

  let successCount = 0;
  let totalEmails = 0;

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`\n👤 Processing user ${i + 1}/3: ${user.name}`);
    console.log('=' .repeat(50));

    // Send welcome email
    const welcomeSuccess = await sendWelcomeEmail(user);
    totalEmails++;
    if (welcomeSuccess) successCount++;

    // Wait 30 seconds between emails for same user
    console.log('⏳ Waiting 30 seconds before sending achievement email...');
    await wait(0.5);

    // Send achievement announcement email
    const achievementSuccess = await sendAchievementEmail(user);
    totalEmails++;
    if (achievementSuccess) successCount++;

    // Wait 1 minute before next user (except for last user)
    if (i < users.length - 1) {
      console.log('⏳ Waiting 1 minute before next user...');
      await wait(1);
    }
  }

  console.log('\n🎯 EMAIL CAMPAIGN COMPLETE!');
  console.log('=' .repeat(50));
  console.log(`📊 Total emails sent: ${successCount}/${totalEmails}`);
  console.log(`✅ Success rate: ${((successCount / totalEmails) * 100).toFixed(1)}%`);
  console.log('');
  
  if (successCount === totalEmails) {
    console.log('🎉 ALL EMAILS SENT SUCCESSFULLY!');
    console.log('✨ All 3 users should now have received:');
    console.log('   📧 Welcome email');
    console.log('   🏆 Achievement announcement email');
  } else {
    console.log('⚠️  Some emails failed. Check the logs above for details.');
  }
}

// Run the email campaign
sendEmailsToAllUsers().catch(console.error);
