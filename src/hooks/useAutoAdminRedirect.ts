// src/hooks/useAutoAdminRedirect.ts - Production Ready Auto Admin Detection
import {useCallback, useEffect, useRef} from 'react';
import {useAppStore} from '../store/useAppStore';
import {logAdminAction, verifyCurrentAdmin} from '../utils/adminAuth';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AdminRedirectConfig {
    readonly VERIFICATION_DELAY: number;
    readonly VERIFICATION_TIMEOUT: number;
    readonly MAX_RETRY_ATTEMPTS: number;
    readonly RETRY_DELAY: number;
    readonly TOAST_DURATION: number;
}

interface VerificationState {
    isChecking: boolean;
    hasChecked: boolean;
    retryCount: number;
    lastAttempt: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CONFIG: AdminRedirectConfig = {
    VERIFICATION_DELAY: 500, // Wait for auth to settle
    VERIFICATION_TIMEOUT: 8000, // 8 second timeout
    MAX_RETRY_ATTEMPTS: 2, // Retry twice on failure
    RETRY_DELAY: 1000, // 1 second between retries
    TOAST_DURATION: 4000,
} as const;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

/**
 * Hook that automatically detects admin users after login and redirects them to admin dashboard
 * This runs after any successful authentication (login/signup) with enhanced error handling
 */
export const useAutoAdminRedirect = (): void => {
    // ============================================================================
    // STORE & REFS
    // ============================================================================

    const {auth, ui, showToast} = useAppStore();
    const verificationStateRef = useRef<VerificationState>({
        isChecking: false,
        hasChecked: false,
        retryCount: 0,
        lastAttempt: 0,
    });
    const isMountedRef = useRef(true);

    // ============================================================================
    // UTILITY FUNCTIONS
    // ============================================================================

    const resetVerificationState = useCallback((): void => {
        verificationStateRef.current = {
            isChecking: false,
            hasChecked: false,
            retryCount: 0,
            lastAttempt: 0,
        };
    }, []);

    const shouldPerformCheck = useCallback((): boolean => {
        const state = verificationStateRef.current;
        const currentTime = Date.now();

        // Don't check if already checking or recently checked
        if (state.isChecking || (state.hasChecked && currentTime - state.lastAttempt < 30000)) {
            return false;
        }

        // Must be authenticated with user email
        if (!auth.isAuthenticated || !auth.user?.email || auth.isLoading) {
            return false;
        }

        // Don't check if admin dashboard is already open
        if (ui.admin.dashboardOpen || ui.admin.authenticated) {
            return false;
        }

        return true;
    }, [auth.isAuthenticated, auth.user?.email, auth.isLoading, ui.admin.dashboardOpen, ui.admin.authenticated]);

    const updateAdminState = useCallback((isAdmin: boolean): void => {
        if (!isMountedRef.current) return;

        try {
            useAppStore.setState(state => ({
                ui: {
                    ...state.ui,
                    admin: {
                        ...state.ui.admin,
                        authenticated: isAdmin,
                        dashboardOpen: isAdmin,
                        currentSection: isAdmin ? 'overview' : state.ui.admin.currentSection,
                    },
                },
            }));

            console.log(`Admin state updated: ${isAdmin ? 'authenticated' : 'not admin'}`);
        } catch (error) {
            console.error('Failed to update admin state:', error);
        }
    }, []);

    const showSuccessMessage = useCallback((userEmail: string): void => {
        if (!isMountedRef.current) return;

        try {
            showToast({
                type: 'success',
                message: 'Welcome to ApplyTrak Admin Dashboard',
                duration: CONFIG.TOAST_DURATION,
            });

            console.log(`Admin user automatically redirected to dashboard: ${userEmail}`);
        } catch (error) {
            console.error('Failed to show success message:', error);
        }
    }, [showToast]);

    // ============================================================================
    // ADMIN VERIFICATION LOGIC
    // ============================================================================

    const performAdminVerification = useCallback(async (
        userEmail: string,
        attempt: number = 1
    ): Promise<boolean> => {
        try {
            console.log(`Admin verification attempt ${attempt}/${CONFIG.MAX_RETRY_ATTEMPTS} for: ${userEmail}`);

            const verificationPromise = verifyCurrentAdmin();
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Verification timeout')), CONFIG.VERIFICATION_TIMEOUT)
            );

            const isAdmin = await Promise.race([verificationPromise, timeoutPromise]);

            if (isAdmin) {
                console.log(`Admin privileges confirmed for: ${userEmail}`);

                // Log the auto-redirect action
                try {
                    logAdminAction(
                        {
                            authenticated: true,
                            userId: auth.user?.id || userEmail,
                            lastLogin: new Date().toISOString(),
                            sessionTimeout: 1800000
                        },
                        'auto_admin_redirect',
                        {email: userEmail, timestamp: new Date().toISOString()}
                    );
                } catch (logError) {
                    console.warn('Failed to log admin action:', logError);
                }
            }

            return isAdmin;
        } catch (error) {
            console.error(`Admin verification attempt ${attempt} failed:`, error);

            if (attempt < CONFIG.MAX_RETRY_ATTEMPTS && isMountedRef.current) {
                console.log(`Retrying admin verification in ${CONFIG.RETRY_DELAY}ms...`);
                await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                return performAdminVerification(userEmail, attempt + 1);
            }

            throw error;
        }
    }, [auth.user?.id]);

    const checkAndRedirectAdmin = useCallback(async (): Promise<void> => {
        if (!shouldPerformCheck()) {
            return;
        }

        const userEmail = auth.user?.email;
        if (!userEmail) {
            console.log('No user email available for admin check');
            return;
        }

        const state = verificationStateRef.current;

        // Update verification state
        state.isChecking = true;
        state.lastAttempt = Date.now();
        state.retryCount++;

        console.log(`Checking if authenticated user is admin: ${userEmail}`);

        try {
            const isAdmin = await performAdminVerification(userEmail);

            if (!isMountedRef.current) {
                console.log('Component unmounted during verification');
                return;
            }

            if (isAdmin) {
                updateAdminState(true);
                showSuccessMessage(userEmail);
            } else {
                console.log(`Regular user confirmed - staying on main application: ${userEmail}`);
            }

            // Mark as successfully checked
            state.hasChecked = true;
            state.retryCount = 0;

        } catch (error) {
            console.error('Error checking admin status:', error);

            // Don't show error to user - fail silently and stay on main app
            // This prevents disruption of normal user flow

            if (state.retryCount >= CONFIG.MAX_RETRY_ATTEMPTS) {
                state.hasChecked = true; // Stop retrying
            }
        } finally {
            state.isChecking = false;
        }
    }, [shouldPerformCheck, auth.user?.email, performAdminVerification, updateAdminState, showSuccessMessage]);

    // ============================================================================
    // EFFECTS
    // ============================================================================

    // Reset verification state when auth state changes significantly
    useEffect(() => {
        const currentEmail = auth.user?.email;
        const prevEmail = verificationStateRef.current.lastAttempt ? 'previous' : null;

        if (!auth.isAuthenticated || !currentEmail) {
            resetVerificationState();
        } else if (currentEmail !== prevEmail) {
            // New user logged in - reset state
            resetVerificationState();
        }
    }, [auth.isAuthenticated, auth.user?.email, resetVerificationState]);

    // Main verification effect
    useEffect(() => {
        if (!shouldPerformCheck()) {
            return;
        }

        let timeoutId: ReturnType<typeof setTimeout>;

        const scheduleCheck = () => {
            timeoutId = setTimeout(() => {
                if (isMountedRef.current && shouldPerformCheck()) {
                    checkAndRedirectAdmin();
                }
            }, CONFIG.VERIFICATION_DELAY);
        };

        scheduleCheck();

        return () => {
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [shouldPerformCheck, checkAndRedirectAdmin]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            resetVerificationState();
        };
    }, [resetVerificationState]);

    // ============================================================================
    // DEBUG LOGGING (Development Only)
    // ============================================================================

    useEffect(() => {
        if (process.env.NODE_ENV === 'development') {
            const debugInfo = {
                isAuthenticated: auth.isAuthenticated,
                userEmail: auth.user?.email || 'none',
                isLoading: auth.isLoading,
                adminDashboardOpen: ui.admin.dashboardOpen,
                adminAuthenticated: ui.admin.authenticated,
                verificationState: {
                    isChecking: verificationStateRef.current.isChecking,
                    hasChecked: verificationStateRef.current.hasChecked,
                    retryCount: verificationStateRef.current.retryCount,
                },
                shouldPerformCheck: shouldPerformCheck(),
            };

            console.log('AutoAdminRedirect State:', debugInfo);
        }
    }, [
        auth.isAuthenticated,
        auth.user?.email,
        auth.isLoading,
        ui.admin.dashboardOpen,
        ui.admin.authenticated,
        shouldPerformCheck,
    ]);
};

// ============================================================================
// HOOK VARIANTS FOR SPECIFIC USE CASES
// ============================================================================

/**
 * Simplified version that only checks once per session
 * Use this if you want less aggressive checking
 */
export const useAutoAdminRedirectOnce = (): void => {
    const hasCheckedRef = useRef(false);
    const {auth, ui, showToast} = useAppStore();

    useEffect(() => {
        const checkOnce = async () => {
            if (hasCheckedRef.current) return;

            if (auth.isAuthenticated && auth.user?.email && !ui.admin.dashboardOpen) {
                hasCheckedRef.current = true;

                try {
                    const isAdmin = await verifyCurrentAdmin();

                    if (isAdmin) {
                        useAppStore.setState(state => ({
                            ui: {
                                ...state.ui,
                                admin: {
                                    ...state.ui.admin,
                                    authenticated: true,
                                    dashboardOpen: true,
                                    currentSection: 'overview',
                                },
                            },
                        }));

                        showToast({
                            type: 'success',
                            message: 'Welcome to ApplyTrak Admin Dashboard',
                            duration: CONFIG.TOAST_DURATION,
                        });
                    }
                } catch (error) {
                    console.error('One-time admin check failed:', error);
                }
            }
        };

        const timeoutId = setTimeout(checkOnce, CONFIG.VERIFICATION_DELAY);
        return () => clearTimeout(timeoutId);
    }, [auth.isAuthenticated, auth.user?.email, ui.admin.dashboardOpen, showToast]);

    // Reset check flag when user changes
    useEffect(() => {
        if (!auth.isAuthenticated) {
            hasCheckedRef.current = false;
        }
    }, [auth.isAuthenticated]);
};

export default useAutoAdminRedirect;