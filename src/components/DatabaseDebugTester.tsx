import React, { useState } from 'react';

const DatabaseDebugTester = () => {
    const [testResults, setTestResults] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const runTests = async () => {
        setIsLoading(true);
        setTestResults('Running tests...\n');

        try {
            // Import your database service functions
            const { testDatabaseConnection, debugSupabaseSync, checkEnvironment } = await import('../services/databaseService');

            let results = '';

            // Test 1: Environment Check
            results += '=== ENVIRONMENT CHECK ===\n';
            const url = process.env.REACT_APP_SUPABASE_URL;
            const key = process.env.REACT_APP_SUPABASE_ANON_KEY;
            results += `URL: ${url ? 'Set' : 'Missing'}\n`;
            results += `Key: ${key ? 'Set' : 'Missing'}\n\n`;

            // Test 2: Connection Test
            results += '=== CONNECTION TEST ===\n';
            const connectionSuccess = await testDatabaseConnection();
            results += `Connection: ${connectionSuccess ? 'Success' : 'Failed'}\n\n`;

            // Test 3: Manual Application Test
            if (connectionSuccess) {
                results += '=== MANUAL INSERT TEST ===\n';
                try {
                    const { databaseService } = await import('../services/databaseService');

                    const testApp = {
                        company: 'Test Company',
                        position: 'Test Position',
                        dateApplied: new Date().toISOString().split('T')[0],
                        status: 'Applied' as const,
                        type: 'Remote' as const,
                        location: 'Test Location',
                        salary: '$100,000',
                        jobSource: 'Debug Test',
                        jobUrl: 'https://test.com',
                        notes: 'This is a test application',
                        attachments: []
                    };

                    const newApp = await databaseService.addApplication(testApp);
                    results += `Insert Success: ${newApp.id}\n`;

                    // Clean up the test application
                    await databaseService.deleteApplication(newApp.id);
                    results += 'Test application cleaned up\n';

                } catch (error) {
                    results += `Insert Failed: ${error.message}\n`;
                }
            }

            setTestResults(results);

        } catch (error) {
            setTestResults(`Error running tests: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">
                    Database Connection Tester
                </h2>

                <div className="mb-4">
                    <button
                        onClick={runTests}
                        disabled={isLoading}
                        className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                            isLoading
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                    >
                        {isLoading ? 'Running Tests...' : 'Test Database Connection'}
                    </button>
                </div>

                {testResults && (
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap overflow-auto max-h-96">
                        {testResults}
                    </div>
                )}

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h3 className="font-semibold text-yellow-800 mb-2">
                        Quick Troubleshooting:
                    </h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Make sure .env.local file exists with correct values</li>
                        <li>• Restart your development server after adding environment variables</li>
                        <li>• Check browser console for detailed error messages</li>
                        <li>• Ensure you're signed in to your account</li>
                        <li>• Verify Supabase RLS policies allow your user to insert data</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default DatabaseDebugTester;