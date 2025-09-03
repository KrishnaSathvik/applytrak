// Fix User From App
// Run this in your browser console while logged into your app

async function fixUserIssue() {
    try {
        console.log('🔧 Starting user fix...');
        
        // Import Supabase client
        const { supabase } = await import('./src/services/databaseService.js');
        
        if (!supabase) {
            console.error('❌ Supabase client not available');
            return;
        }
        
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
        
        // Test notification preferences
        console.log('🔔 Testing notification preferences...');
        const { data: notifData, error: notifError } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('userid', userIdData);
        
        if (notifError) {
            console.error('❌ Error checking notification preferences:', notifError);
        } else {
            console.log('✅ Notification preferences:', notifData);
        }
        
        console.log('🎉 User fix completed! Try the profile features now.');
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the fix
fixUserIssue();
