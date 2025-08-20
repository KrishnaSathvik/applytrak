// src/testDatabase.js
export const testDatabase = async () => {
    console.log('🔧 Testing database connection...');

    // Check environment variables
    const url = process.env.REACT_APP_SUPABASE_URL;
    const key = process.env.REACT_APP_SUPABASE_ANON_KEY;

    console.log('Environment Variables:');
    console.log('- URL:', url ? '✅ Set' : '❌ Missing');
    console.log('- Key:', key ? '✅ Set' : '❌ Missing');

    if (!url || !key) {
        console.error('❌ Create .env.local file with your Supabase credentials');
        return false;
    }

    try {
        // Dynamic import to avoid module issues
        const dbModule = await import('./services/databaseService');

        const client = dbModule.initializeSupabase();
        if (!client) {
            console.error('❌ Supabase client failed to initialize');
            return false;
        }

        console.log('✅ Supabase client initialized');

        // Check auth
        if (!dbModule.isAuthenticated()) {
            console.log('⚠️ Not authenticated - sign in first');
            return false;
        }

        console.log('✅ User is authenticated');

        // Test getUserDbId
        const userDbId = await dbModule.getUserDbId();
        console.log('User DB ID:', userDbId);

        return true;

    } catch (error) {
        console.error('❌ Test failed:', error);
        return false;
    }
};