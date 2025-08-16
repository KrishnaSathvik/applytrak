import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'success' | 'error' | 'warning';
}

interface StatusState {
    envVars: boolean;
    client: boolean;
    auth: boolean;
    tables: boolean;
    realtime: boolean;
}

interface TestResult {
    success: boolean;
    error?: string;
    count?: number;
}

interface SubscriptionInfo {
    table: string;
    channel: any;
}

interface DebugInfo {
    step: string;
    logs: LogEntry[];
    status: StatusState;
    subscriptions: SubscriptionInfo[];
    testResults: Record<string, TestResult>;
}

const RealtimeSyncDebugger = () => {
    const [debugInfo, setDebugInfo] = useState<DebugInfo>({
        step: 'Initializing...',
        logs: [],
        status: {
            envVars: false,
            client: false,
            auth: false,
            tables: false,
            realtime: false
        },
        subscriptions: [],
        testResults: {}
    });

    const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugInfo(prev => ({
            ...prev,
            logs: [...prev.logs, { timestamp, message, type }]
        }));
    };

    const updateStatus = (key: keyof StatusState, value: boolean) => {
        setDebugInfo(prev => ({
            ...prev,
            status: { ...prev.status, [key]: value }
        }));
    };

    const updateStep = (step) => {
        setDebugInfo(prev => ({ ...prev, step }));
    };

    useEffect(() => {
        const debugRealtimeSync = async () => {
            addLog('🚀 Starting real-time sync debug...', 'info');

            // Step 1: Check Environment Variables
            updateStep('Checking Environment Variables...');
            const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
            const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

            if (!supabaseUrl || !supabaseKey) {
                addLog('❌ Environment variables missing', 'error');
                return;
            }

            addLog(`✅ Environment variables found`, 'success');
            addLog(`📍 URL: ${supabaseUrl}`, 'info');
            updateStatus('envVars', true);

            // Step 2: Create Supabase Client
            updateStep('Creating Supabase Client...');
            let supabase;
            try {
                supabase = createClient(supabaseUrl, supabaseKey, {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                    },
                    realtime: {
                        params: {
                            eventsPerSecond: 10
                        }
                    }
                });
                addLog('✅ Supabase client created', 'success');
                updateStatus('client', true);
            } catch (error) {
                addLog(`❌ Client creation failed: ${error.message}`, 'error');
                return;
            }

            // Step 3: Test Authentication
            updateStep('Testing Authentication...');
            try {
                const { data: { user }, error: authError } = await supabase.auth.getUser();

                if (authError) {
                    addLog(`⚠️ Auth error: ${authError.message}`, 'warning');
                } else if (user) {
                    addLog(`✅ Authenticated as: ${user.email}`, 'success');
                    updateStatus('auth', true);

                    // Check if user is admin
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('id, email, is_admin')
                        .eq('external_id', user.id)
                        .single();

                    if (!userError && userData) {
                        addLog(`👑 Admin status: ${userData.is_admin ? 'YES' : 'NO'}`, userData.is_admin ? 'success' : 'info');
                    }
                } else {
                    addLog('ℹ️ No authenticated user (anonymous mode)', 'info');
                }
            } catch (error) {
                addLog(`❌ Auth test failed: ${error.message}`, 'error');
            }

            // Step 4: Test Table Access
            updateStep('Testing Table Access...');
            const tables = ['applications', 'feedback', 'goals', 'analytics_events', 'users'];
            const tableResults: Record<string, TestResult> = {};

            for (const table of tables) {
                try {
                    const { data, error } = await supabase
                        .from(table)
                        .select('count')
                        .limit(1);

                    if (error) {
                        addLog(`❌ ${table}: ${error.message}`, 'error');
                        tableResults[table] = { success: false, error: error.message };
                    } else {
                        addLog(`✅ ${table}: Access OK`, 'success');
                        tableResults[table] = { success: true, count: data?.length || 0 };
                    }
                } catch (error) {
                    addLog(`❌ ${table}: ${error.message}`, 'error');
                    tableResults[table] = { success: false, error: error.message };
                }
            }

            updateStatus('tables', Object.values(tableResults).some(r => r.success));
            setDebugInfo(prev => ({ ...prev, testResults: tableResults }));

            // Step 5: Test Real-time Subscriptions
            updateStep('Testing Real-time Subscriptions...');
            const subscriptions: SubscriptionInfo[] = [];

            for (const table of ['applications', 'feedback', 'goals']) {
                try {
                    addLog(`📡 Setting up real-time for ${table}...`, 'info');

                    const channel = supabase
                        .channel(`debug-${table}-${Date.now()}`)
                        .on('postgres_changes',
                            { event: '*', schema: 'public', table },
                            (payload) => {
                                addLog(`🔔 Real-time event from ${table}: ${payload.eventType}`, 'success');
                                console.log('Real-time payload:', payload);
                            }
                        )
                        .subscribe((status, err) => {
                            if (err) {
                                addLog(`❌ ${table} subscription error: ${err.message}`, 'error');
                            } else {
                                addLog(`📡 ${table} subscription status: ${status}`, status === 'SUBSCRIBED' ? 'success' : 'info');
                                if (status === 'SUBSCRIBED') {
                                    updateStatus('realtime', true);
                                }
                            }
                        });

                    subscriptions.push({ table, channel });
                } catch (error) {
                    addLog(`❌ ${table} subscription setup failed: ${error.message}`, 'error');
                }
            }

            setDebugInfo(prev => ({ ...prev, subscriptions }));

            // Step 6: Test Data Insert (to trigger real-time)
            setTimeout(async () => {
                addLog('🧪 Testing real-time trigger with data insert...', 'info');

                try {
                    // Insert a test record (you can delete this later)
                    const { error } = await supabase
                        .from('analytics_events')
                        .insert({
                            user_id: 27, // Your user ID from the table
                            event_name: 'realtime_test',
                            properties: { test: true },
                            session_id: `test-${Date.now()}`,
                            device_type: 'desktop'
                        });

                    if (error) {
                        addLog(`❌ Test insert failed: ${error.message}`, 'error');
                    } else {
                        addLog('✅ Test record inserted - watch for real-time event above!', 'success');
                    }
                } catch (error) {
                    addLog(`❌ Test insert error: ${error.message}`, 'error');
                }
            }, 3000);

            // Cleanup after 30 seconds
            setTimeout(() => {
                addLog('🧹 Cleaning up subscriptions...', 'info');
                subscriptions.forEach(({ table, channel }) => {
                    try {
                        channel.unsubscribe();
                        addLog(`✅ ${table} subscription cleaned up`, 'success');
                    } catch (error) {
                        addLog(`❌ Failed to cleanup ${table}: ${error.message}`, 'error');
                    }
                });
            }, 30000);

            updateStep('Debug Complete - Check logs below');
        };

        debugRealtimeSync();
    }, []);

    const getStatusColor = (status) => {
        return status ? 'text-green-600' : 'text-red-600';
    };

    const getLogColor = (type: 'info' | 'success' | 'error' | 'warning') => {
        switch (type) {
            case 'success': return 'text-green-600';
            case 'error': return 'text-red-600';
            case 'warning': return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-4xl mx-auto">
            <h2 className="text-xl font-bold mb-4">🔍 Real-time Sync Debugger</h2>

            {/* Current Step */}
            <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded">
                <div className="font-medium">Current Step:</div>
                <div className="text-lg">{debugInfo.step}</div>
            </div>

            {/* Status Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="text-center">
                    <div className={`text-lg font-bold ${getStatusColor(debugInfo.status.envVars)}`}>
                        {debugInfo.status.envVars ? '✅' : '❌'}
                    </div>
                    <div className="text-sm">Env Vars</div>
                </div>
                <div className="text-center">
                    <div className={`text-lg font-bold ${getStatusColor(debugInfo.status.client)}`}>
                        {debugInfo.status.client ? '✅' : '❌'}
                    </div>
                    <div className="text-sm">Client</div>
                </div>
                <div className="text-center">
                    <div className={`text-lg font-bold ${getStatusColor(debugInfo.status.auth)}`}>
                        {debugInfo.status.auth ? '✅' : '⚠️'}
                    </div>
                    <div className="text-sm">Auth</div>
                </div>
                <div className="text-center">
                    <div className={`text-lg font-bold ${getStatusColor(debugInfo.status.tables)}`}>
                        {debugInfo.status.tables ? '✅' : '❌'}
                    </div>
                    <div className="text-sm">Tables</div>
                </div>
                <div className="text-center">
                    <div className={`text-lg font-bold ${getStatusColor(debugInfo.status.realtime)}`}>
                        {debugInfo.status.realtime ? '✅' : '⏳'}
                    </div>
                    <div className="text-sm">Real-time</div>
                </div>
            </div>

            {/* Table Test Results */}
            {Object.keys(debugInfo.testResults).length > 0 && (
                <div className="mb-6">
                    <h3 className="font-bold mb-2">Table Access Results:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {Object.entries(debugInfo.testResults).map(([table, result]) => (
                            <div key={table} className={`p-2 rounded text-sm ${result.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                                <span className="font-medium">{table}:</span>
                                {result.success ? ` ✅ OK` : ` ❌ ${result.error}`}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Logs */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded border">
                <h3 className="font-bold mb-2">Debug Logs:</h3>
                <div className="max-h-96 overflow-y-auto space-y-1">
                    {debugInfo.logs.map((log, index) => (
                        <div key={index} className="text-sm font-mono">
                            <span className="text-gray-500">[{log.timestamp}]</span>
                            <span className={`ml-2 ${getLogColor(log.type)}`}>
                                {log.message}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <h4 className="font-medium mb-2">What to look for:</h4>
                <ul className="list-disc list-inside space-y-1">
                    <li>All status indicators should be ✅ green</li>
                    <li>Real-time subscription status should show "SUBSCRIBED"</li>
                    <li>You should see a real-time event notification after the test insert</li>
                    <li>If any step fails, check the detailed error messages in the logs</li>
                </ul>
            </div>
        </div>
    );
};

export default RealtimeSyncDebugger;