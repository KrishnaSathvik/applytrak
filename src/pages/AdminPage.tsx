// src/pages/AdminPage.tsx - Production Ready Admin Page
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {AlertCircle, LogIn, Shield, Users} from 'lucide-react';
import {useAppStore} from '../store/useAppStore';
import {verifyCurrentAdmin} from '../utils/adminAuth';
import AdminDashboard from '../components/admin/AdminDashboard';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AdminPageState {
    isVerifyingAdmin: boolean;
    adminVerified: boolean;
    hasError: boolean;
    errorMessage: string;
}

interface SecurityFeature {
    icon: typeof Shield;
    text: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ADMIN_PAGE_CONFIG = {
    VERIFICATION_TIMEOUT: 10000, // 10 seconds
    REDIRECT_DELAY: 2000, // 2 seconds
    TOAST_DURATION: {
        SUCCESS: 4000,
        WARNING: 5000,
        ERROR: 5000,
    },
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,
} as const;

const SECURITY_FEATURES: readonly SecurityFeature[] = [
    {icon: Shield, text: 'Database-verified admin authentication'},
    {icon: Shield, text: 'Real-time privilege verification'},
    {icon: Shield, text: 'Secure session management'},
    {icon: Shield, text: 'Admin activity audit logging'},
] as const;

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AdminPage: React.FC = () => {
    // ============================================================================
    // STORE & STATE
    // ============================================================================

    const {auth, ui, showToast, modals} = useAppStore();

    const [adminState, setAdminState] = useState<AdminPageState>({
        isVerifyingAdmin: true,
        adminVerified: false,
        hasError: false,
        errorMessage: '',
    });

    // ============================================================================
    // MEMOIZED VALUES
    // ============================================================================

    const isLoading = useMemo(() =>
            adminState.isVerifyingAdmin || auth.isLoading,
        [adminState.isVerifyingAdmin, auth.isLoading]
    );

    const isAuthenticated = useMemo(() =>
            auth.isAuthenticated && !!auth.user,
        [auth.isAuthenticated, auth.user]
    );

    const shouldShowDashboard = useMemo(() =>
            isAuthenticated &&
            adminState.adminVerified &&
            ui.admin.authenticated &&
            ui.admin.dashboardOpen,
        [isAuthenticated, adminState.adminVerified, ui.admin.authenticated, ui.admin.dashboardOpen]
    );

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    const updateAdminState = useCallback((updates: Partial<AdminPageState>) => {
        setAdminState(prev => ({...prev, ...updates}));
    }, []);

    const setAdminAuthenticated = useCallback(() => {
        useAppStore.setState(state => ({
            ui: {
                ...state.ui,
                admin: {
                    ...state.ui.admin,
                    authenticated: true,
                    dashboardOpen: true,
                },
            },
        }));
    }, []);

    const redirectToHome = useCallback((delay: number = ADMIN_PAGE_CONFIG.REDIRECT_DELAY) => {
        setTimeout(() => {
            try {
                window.location.href = '/';
            } catch (error) {
                console.error('Navigation failed:', error);
                // Fallback: reload the page to reset state
                window.location.reload();
            }
        }, delay);
    }, []);

    const openAdminLoginModal = useCallback(() => {
        useAppStore.setState(state => ({
            modals: {
                ...state.modals,
                adminLogin: {
                    isOpen: true,
                    returnPath: '/admin',
                },
            },
        }));
    }, []);

    // ============================================================================
    // ADMIN VERIFICATION LOGIC
    // ============================================================================

    const verifyAdminWithRetry = useCallback(async (attempt: number = 1): Promise<boolean> => {
        try {
            console.log(`Admin verification attempt ${attempt}/${ADMIN_PAGE_CONFIG.RETRY_ATTEMPTS}`);

            const verificationPromise = verifyCurrentAdmin();
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Verification timeout')), ADMIN_PAGE_CONFIG.VERIFICATION_TIMEOUT)
            );

            const isAdmin = await Promise.race([verificationPromise, timeoutPromise]);
            return isAdmin;
        } catch (error) {
            console.error(`Admin verification attempt ${attempt} failed:`, error);

            if (attempt < ADMIN_PAGE_CONFIG.RETRY_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, ADMIN_PAGE_CONFIG.RETRY_DELAY));
                return verifyAdminWithRetry(attempt + 1);
            }

            throw error;
        }
    }, []);

    const handleVerificationSuccess = useCallback((userEmail?: string) => {
        console.log('Admin privileges verified - opening dashboard');

        setAdminAuthenticated();
        updateAdminState({
            adminVerified: true,
            hasError: false,
            errorMessage: ''
        });

        showToast({
            type: 'success',
            message: '🔑 Welcome to ApplyTrak Admin Dashboard',
            duration: ADMIN_PAGE_CONFIG.TOAST_DURATION.SUCCESS,
        });
    }, [setAdminAuthenticated, updateAdminState, showToast]);

    const handleVerificationFailure = useCallback((isAuthenticated: boolean, error?: Error) => {
        console.log('Admin verification failed:', {isAuthenticated, error: error?.message});

        const errorMessage = error?.message || 'Admin verification failed';
        updateAdminState({
            hasError: true,
            errorMessage,
            adminVerified: false
        });

        if (isAuthenticated) {
            showToast({
                type: 'warning',
                message: 'Admin privileges required. Please contact an administrator.',
                duration: ADMIN_PAGE_CONFIG.TOAST_DURATION.WARNING,
            });
            redirectToHome();
        } else {
            showToast({
                type: 'error',
                message: 'Error verifying admin access. Please try again.',
                duration: ADMIN_PAGE_CONFIG.TOAST_DURATION.ERROR,
            });
        }
    }, [updateAdminState, showToast, redirectToHome]);

    const performAdminVerification = useCallback(async () => {
        console.log('Starting admin verification process...');

        updateAdminState({
            isVerifyingAdmin: true,
            hasError: false,
            errorMessage: ''
        });

        try {
            if (!isAuthenticated) {
                console.log('User not authenticated - showing login interface');
                updateAdminState({
                    isVerifyingAdmin: false,
                    adminVerified: false
                });
                return;
            }

            console.log('Verifying admin privileges for authenticated user...');
            const isAdmin = await verifyAdminWithRetry();

            if (isAdmin) {
                handleVerificationSuccess(auth.user?.email);
            } else {
                handleVerificationFailure(true);
            }
        } catch (error) {
            const verificationError = error instanceof Error ? error : new Error('Unknown verification error');
            handleVerificationFailure(isAuthenticated, verificationError);
            redirectToHome();
        } finally {
            updateAdminState({isVerifyingAdmin: false});
        }
    }, [
        isAuthenticated,
        auth.user?.email,
        updateAdminState,
        verifyAdminWithRetry,
        handleVerificationSuccess,
        handleVerificationFailure,
        redirectToHome
    ]);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Main verification effect
    useEffect(() => {
        let isMounted = true;

        const runVerification = async () => {
            if (isMounted) {
                await performAdminVerification();
            }
        };

        runVerification();

        return () => {
            isMounted = false;
        };
    }, [performAdminVerification]);

    // Re-verify when authentication state changes
    useEffect(() => {
        if (isAuthenticated && !adminState.isVerifyingAdmin && !adminState.adminVerified && !adminState.hasError) {
            console.log('Authentication state changed - re-verifying admin status...');
            updateAdminState({isVerifyingAdmin: true});
        }
    }, [isAuthenticated, adminState.isVerifyingAdmin, adminState.adminVerified, adminState.hasError, updateAdminState]);

    // ============================================================================
    // RENDER COMPONENTS
    // ============================================================================

    const renderLoadingState = () => (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
            <div className="text-center space-y-6 max-w-md mx-auto p-8">
                {/* Loading Animation */}
                <div className="relative">
                    <div
                        className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center animate-pulse">
                        <Shield className="h-10 w-10 text-white"/>
                    </div>
                    <div
                        className="absolute inset-0 w-20 h-20 mx-auto rounded-full border-4 border-blue-200 border-t-blue-500 animate-spin"/>
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
                <div
                    className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4 border border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Shield className="h-4 w-4 text-blue-500"/>
                        <span>Database-verified admin authentication</span>
                    </div>
                </div>

                {/* Error State */}
                {adminState.hasError && (
                    <div
                        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                            <AlertCircle className="h-4 w-4"/>
                            <span className="text-sm font-medium">Verification Error</span>
                        </div>
                        <p className="text-red-600 dark:text-red-300 text-xs mt-1">
                            {adminState.errorMessage}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );

    const renderSecurityFeatures = () => (
        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500"/>
                Security Features
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                {SECURITY_FEATURES.map((feature, index) => (
                    <li key={index}>• {feature.text}</li>
                ))}
            </ul>
        </div>
    );

    const renderActionButton = () => {
        if (!isAuthenticated) {
            return (
                <button
                    onClick={openAdminLoginModal}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    type="button"
                >
          <span className="flex items-center justify-center gap-2">
            <Shield className="h-5 w-5"/>
            Sign In as Admin
          </span>
                </button>
            );
        }

        return (
            <div className="space-y-3">
                <button
                    onClick={() => redirectToHome(0)}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105"
                    type="button"
                >
                    Return to Application Tracker
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    Contact an administrator if you need admin access
                </p>
            </div>
        );
    };

    const renderLoginInterface = () => (
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
                        {!isAuthenticated ? (
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
                            {renderActionButton()}
                        </div>

                        {/* Security Features */}
                        {renderSecurityFeatures()}
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

    // ============================================================================
    // MAIN RENDER
    // ============================================================================

    // Loading state
    if (isLoading) {
        return renderLoadingState();
    }

    // Admin dashboard
    if (shouldShowDashboard) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <AdminDashboard/>
            </div>
        );
    }

    // Login interface
    return renderLoginInterface();
};

export default AdminPage;