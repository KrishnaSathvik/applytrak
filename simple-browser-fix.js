// Simple Browser Fix
// Run this in your browser console while logged into your app

async function fixUserIssue() {
    try {
        console.log('🔧 Starting user fix...');
        
        // Get the Supabase client from the global scope or window
        let supabase;
        
        // Try different ways to access Supabase
        if (window.supabase) {
            supabase = window.supabase;
        } else if (window.__SUPABASE_CLIENT__) {
            supabase = window.__SUPABASE_CLIENT__;
        } else {
            // Try to access it from React DevTools or other global variables
            console.log('🔍 Looking for Supabase client...');
            console.log('Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
            
            // If we can't find it, we'll need to use a different approach
            console.error('❌ Cannot find Supabase client. Let\'s try a different approach...');
            
            // Try to call the function directly via fetch
            await callEnsureUserExistsDirectly();
            return;
        }
        
        console.log('✅ Found Supabase client');
        
        // Check current auth state
        const { data: { session } } = await supabase.auth.getSession();
        console.log('👤 Current session:', session?.user?.email);
        
        if (!session?.user) {
            console.error('❌ Not authenticated - please sign in first');
            return;
        }
        
        // Call the ensure_user_exists function
        console.log('🔄 Calling ensure_user_exists function...');
        const { data, error } = await supabase.rpc('ensure_user_exists');
        
        if (error) {
            console.error('❌ Error calling ensure_user_exists:', error);
            return;
        }
        
        console.log('✅ User fix result:', data);
        
        // Test current_user_id function
        console.log('🧪 Testing current_user_id function...');
        const { data: userIdData, error: userIdError } = await supabase.rpc('current_user_id');
        
        if (userIdError) {
            console.error('❌ Error calling current_user_id:', userIdError);
        } else {
            console.log('✅ Current user ID:', userIdData);
        }
        
        console.log('🎉 User fix completed! Try the profile features now.');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Alternative approach using direct fetch
async function callEnsureUserExistsDirectly() {
    try {
        console.log('🔄 Trying direct API call...');
        
        // Get the current session token
        const response = await fetch('/api/auth/session', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            console.error('❌ Cannot get session token');
            return;
        }
        
        const sessionData = await response.json();
        console.log('📋 Session data:', sessionData);
        
        // Call the RPC function directly
        const rpcResponse = await fetch('https://ihlaenwiyxtmkehfoesg.supabase.co/rest/v1/rpc/ensure_user_exists', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${sessionData.access_token}`,
                'apikey': 'your-anon-key' // You'll need to replace this with your actual anon key
            },
            body: JSON.stringify({})
        });
        
        if (!rpcResponse.ok) {
            console.error('❌ RPC call failed:', rpcResponse.status, rpcResponse.statusText);
            return;
        }
        
        const result = await rpcResponse.json();
        console.log('✅ Direct RPC result:', result);
        
    } catch (error) {
        console.error('❌ Direct API call failed:', error);
    }
}

// Run the fix
fixUserIssue();
