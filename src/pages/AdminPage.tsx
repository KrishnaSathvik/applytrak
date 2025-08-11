// src/pages/AdminPage.tsx - PHASE 1.5: Automatic Admin Page Routing
import React, {useEffect, useState} from 'react';
import {Shield, Users, LogIn} from 'lucide-react';
import {useAppStore} from '../store/useAppStore';
import {verifyCurrentAdmin} from '../utils/adminAuth';
import AdminDashboard from '../components/admin/AdminDashboard';
import LoadingScreen from '../components/ui/LoadingScreen';

// ============================================================================
// ADMIN PAGE COMPONENT - Automatic Admin Detection & Routing
// ============================================================================

const AdminPage: React.FC = () => {
    const {
        auth,
        ui,
        showToast,
        modals
    } = useAppStore();

    const [isVerifyingAdmin, setIsVerifyingAdmin] = useState(true);
    const [adminVerified, setAdminVerified] = useState(false);

    // ============================================================================
    // AUTOMATIC ADMIN VERIFICATION ON PAGE LOAD
    // ============================================================================
    useEffect(() => {
        const verifyAdminAccess = async () => {
            console.log('🔑 AdminPage: Starting admin verification...');

            try {
                // If user is not authenticated at all, show login
                if (!auth.isAuthenticated) {
                    console.log('🔐 User not authenticated - will show admin login');
                    setIsVerifyingAdmin(false);
                    setAdminVerified(false);
                    return;
                }

                // If user is authenticated, verify admin privileges
                console.log('🔍 Verifying admin privileges for authenticated user...');
                const isAdmin = await verifyCurrentAdmin();

                if (isAdmin) {
                    console.log('✅ Admin privileges verified - opening admin dashboard');

                    // Set admin state to authenticated and open dashboard
                    useAppStore.setState(state => ({
                        ui: {
                            ...state.ui,
                            admin: {
                                ...state.ui.admin,
                                authenticated: true,
                                dashboardOpen: true
                            }
                        }
                    }));

                    setAdminVerified(true);

                    showToast({
                        type: 'success',
                        message: '🔑 Welcome to ApplyTrak Admin Dashboard',
                        duration: 4000
                    });
                } else {
                    console.log('❌ User authenticated but not admin - redirecting to home');

                    showToast({
                        type: 'warning',
                        message: 'Admin privileges required. Please contact an administrator.',
                        duration: 5000
                    });

                    // Redirect non-admin users back to main app after a short delay
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                }
            } catch (error) {
                console.error('❌ Error verifying admin access:', error);

                showToast({
                    type: 'error',
                    message: 'Error verifying admin access. Please try again.',
                    duration: 5000
                });

                // Redirect to home on error
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);
            } finally {
                setIsVerifyingAdmin(false);
            }
        };

        verifyAdminAccess();
    }, [auth.isAuthenticated, showToast]);

    // ============================================================================
    // HANDLE AUTHENTICATION STATE CHANGES
    // ============================================================================
    useEffect(() => {
        // When user authenticates, re-verify admin status
        if (auth.isAuthenticated && !isVerifyingAdmin && !adminVerified) {
            console.log('🔄 User authenticated - re-verifying admin status...');
            setIsVerifyingAdmin(true);
        }
    }, [auth.isAuthenticated, isVerifyingAdmin, adminVerified]);

    // ============================================================================
    // LOADING STATE - Admin Verification in Progress
    // ============================================================================
    if (isVerifyingAdmin || auth.isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
                <div className="text-center space-y-6 max-w-md mx-auto p-8">
                    {/* Loading Animation */}
                    <div className="relative">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                            <Shield className="h-10 w-10 text-white animate-spin-slow" />
                        </div>
                        <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"></div>
                    </div>

                    {/* Loading Text */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Verifying Admin Access
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {auth.isLoading
                                ? 'Checking authentication status...'
                                : 'Verifying admin privileges...'
                            }
                        </p>
                    </div>

                    {/* Security Note */}
                    <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Shield className="h-4 w-4 text-blue-500" />
                            <span>Database-verified admin authentication</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ============================================================================
    // ADMIN DASHBOARD - Authenticated Admin User
    // ============================================================================
    if (auth.isAuthenticated && adminVerified && ui.admin.authenticated && ui.admin.dashboardOpen) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {/* Full-screen admin dashboard */}
                <AdminDashboard />
            </div>
        );
    }

    // ============================================================================
    // ADMIN LOGIN - Unauthenticated Users or Non-Admin Users
    // ============================================================================
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-4">
            <div className="w-full max-w-md">
                {/* Admin Login Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-2">
                            ApplyTrak Admin
                        </h1>
                        <p className="text-blue-100">
                            Secure Admin Dashboard Access
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8 space-y-6">
                        {/* Status Message */}
                        {!auth.isAuthenticated ? (
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                                    <LogIn className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Authentication Required
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                        Please sign in with your admin credentials to access the dashboard.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <div className="w-12 h-12 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                        Access Denied
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                        You are signed in, but admin privileges are required to access this area.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="space-y-4">
                            {!auth.isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        // Open admin login modal
                                        useAppStore.setState(state => ({
                                            modals: {
                                                ...state.modals,
                                                adminLogin: {
                                                    isOpen: true,
                                                    returnPath: '/admin'
                                                }
                                            }
                                        }));
                                    }}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        Sign In as Admin
                                    </span>
                                </button>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            window.location.href = '/';
                                        }}
                                        className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                                    >
                                        Return to Application Tracker
                                    </button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                                        Contact an administrator if you need admin access
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Security Features */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                Security Features
                            </h4>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <li>• Database-verified admin authentication</li>
                                <li>• Real-time privilege verification</li>
                                <li>• Secure session management</li>
                                <li>• Admin activity audit logging</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        ApplyTrak Admin Dashboard
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;