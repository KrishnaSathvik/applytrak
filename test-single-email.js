// Test sending to a single email
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyOTU0MywiZXhwIjoyMDcwMDA1NTQzfQ.jZMxPrFq1yiwRHSrJhlyfkAWeA7IIRgsmRG4UkFh-Fg';

async function testSingleEmail() {
    try {
        console.log('🧪 Testing single email...\n');

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // Test with Tejuu's email
        const { data, error } = await supabase.functions.invoke('achievements-announcement', {
            body: {
                email: 'saitejaswinithumpala@gmail.com',
                name: 'Tejuu'
            }
        });
        
        if (error) {
            console.log(`❌ Error: ${error.message}`);
            console.log(`❌ Details: ${JSON.stringify(error)}`);
        } else {
            console.log(`✅ Success: ${JSON.stringify(data)}`);
        }
        
    } catch (error) {
        console.log(`❌ Exception: ${error.message}`);
    }
}

testSingleEmail();
