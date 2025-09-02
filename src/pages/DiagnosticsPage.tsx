// src/pages/DiagnosticsPage.tsx - Simple Diagnostics Page
import React from 'react';

const DiagnosticsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        🔧 System Diagnostics
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Basic diagnostic information for troubleshooting ApplyTrak issues.
                    </p>
                </div>
                
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            📚 Common Issues & Solutions
                        </h2>
                        
                        <div className="space-y-6">
                            <div className="border-l-4 border-red-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    ❌ Environment Variables Missing
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    If you see "Missing environment variables" errors:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                                    <li>Check if you have a <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">.env</code> file in your project root</li>
                                    <li>Ensure it contains <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">REACT_APP_SUPABASE_URL</code> and <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">REACT_APP_SUPABASE_ANON_KEY</code></li>
                                    <li>Restart your development server after adding environment variables</li>
                                </ul>
                            </div>
                            
                            <div className="border-l-4 border-yellow-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    ⚠️ Authentication Issues
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    If authentication is failing:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                                    <li>Verify your Supabase project is active and not paused</li>
                                    <li>Check if email confirmations are enabled in your Supabase dashboard</li>
                                    <li>Ensure your RLS policies allow the operations you're trying to perform</li>
                                </ul>
                            </div>
                            
                            <div className="border-l-4 border-blue-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    🔍 Database Access Issues
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    If database queries are failing:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                                    <li>Check your Row Level Security (RLS) policies in Supabase</li>
                                    <li>Verify that the required tables exist in your database</li>
                                    <li>Ensure your user has the correct permissions</li>
                                </ul>
                            </div>
                            
                            <div className="border-l-4 border-green-500 pl-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                    💡 Getting Help
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                    For additional support:
                                </p>
                                <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 ml-4">
                                    <li>Check the browser console for detailed error messages</li>
                                    <li>Verify your internet connection</li>
                                    <li>Try refreshing the page or clearing browser cache</li>
                                    <li>Ensure you're using a supported browser</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiagnosticsPage;
