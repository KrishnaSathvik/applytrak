// src/utils/adminRoute.ts - Enhanced Admin Routing with Dedicated /admin Route
import {useAppStore} from '../store/useAppStore';
import {verifyCurrentAdmin, getSessionStatus} from './adminAuth';

// Legacy admin access patterns (for backwards compatibility)
const LEGACY_ADMIN_PATTERNS = [
    'admin-dashboard-krishna-2024',
    'applytrak-admin',
    'secret-analytics',
    'admin-panel-2024'
];

// Keyboard shortcut pattern (Ctrl+Shift+A+D+M)
const ADMIN_SHORTCUT_SEQUENCE = ['KeyA', 'KeyD', 'KeyM'];
let shortcutSequence: string[] = [];
let shortcutTimer: ReturnType<typeof setTimeout> | null = null;

// Track if admin routes are initialized to prevent double initialization
let isInitialized = false;

/**
 * NEW: Check if current URL is /admin route
 */
const isAdminRoute = (): boolean => {
    return window.location.pathname === '/admin';
};

/**
 * NEW: Navigate to /admin route
 */
const navigateToAdmin = () => {
    try {
        window.history.pushState({}, '', '/admin');

        // Trigger a custom event so App.tsx can detect the route change
        window.dispatchEvent(new CustomEvent('adminRouteChange', { detail: { path: '/admin' } }));

        console.log('🔗 Navigated to /admin route');
    } catch (error) {
        console.error('❌ Error navigating to admin route:', error);
        // Fallback to hash-based navigation
        window.location.hash = 'admin-access';
    }
};

/**
 * Enhanced: Check if current user has admin privileges
 */
const checkAdminPrivileges = async (): Promise<boolean> => {
    try {
        const store = useAppStore.getState();

        // First check if user is authenticated
        if (!store.auth?.isAuthenticated) {
            console.log('🔐 User not authenticated - opening login first');
            return false;
        }

        // Check admin status in database
        const isAdmin = await verifyCurrentAdmin();

        if (!isAdmin) {
            console.log('❌ User authenticated but not admin');
            store.showToast({
                type: 'warning',
                message: 'Admin privileges required. Please contact an administrator.',
                duration: 5000
            });
            return false;
        }

        console.log('✅ Admin privileges verified');
        return true;
    } catch (error) {
        console.error('❌ Error checking admin privileges:', error);
        return false;
    }
};

/**
 * NEW: Handle /admin route access
 */
const handleAdminRouteAccess = async (): Promise<boolean> => {
    try {
        const store = useAppStore.getState();

        // Check if user is already authenticated and admin
        if (store.auth?.isAuthenticated) {
            const hasAdminPrivileges = await checkAdminPrivileges();

            if (hasAdminPrivileges) {
                // User is admin - open dashboard directly
                console.log('🎯 Opening admin dashboard for authenticated admin');

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

                useAppStore.getState().showToast({
                    type: 'success',
                    message: '🔑 Welcome to ApplyTrak Admin Dashboard',
                    duration: 4000
                });
                return true;
            } else {
                // User is authenticated but not admin - redirect to home
                window.history.replaceState({}, '', '/');
                return false;
            }
        }

        // User is not authenticated - show admin login modal
        console.log('🔑 Opening admin login modal for /admin route');
        useAppStore.setState(state => ({
            modals: {
                ...state.modals,
                adminLogin: {isOpen: true}
            }
        }));

        return false; // Don't show admin dashboard yet
    } catch (error) {
        console.error('❌ Error handling admin route access:', error);
        // Redirect to home on error
        window.history.replaceState({}, '', '/');
        return false;
    }
};

/**
 * Enhanced: Open admin access - now routes to /admin
 */
const openAdminAccess = async () => {
    try {
        console.log('🔑 Admin access requested - routing to /admin');
        navigateToAdmin();
    } catch (error) {
        console.error('❌ Error opening admin access:', error);
        useAppStore.getState().showToast({
            type: 'error',
            message: 'Error accessing admin panel. Please try again.',
            duration: 4000
        });
    }
};

/**
 * Enhanced: Initialize admin route handlers with database authentication
 */
export const initializeAdminRoutes = (): (() => void) => {
    // Prevent double initialization
    if (isInitialized) {
        console.warn('⚠️ Admin routes already initialized');
        return () => {}; // Return empty cleanup function
    }

    console.log('🔑 Initializing enhanced admin routes with database authentication...');
    isInitialized = true;

    // Enhanced: URL Hash Detection (legacy patterns) - now redirects to /admin
    const checkUrlForLegacyAdmin = async () => {
        try {
            const hash = window.location.hash.substring(1); // Remove #
            const params = new URLSearchParams(window.location.search);
            const adminParam = params.get('admin');
            const accessParam = params.get('access');

            if (LEGACY_ADMIN_PATTERNS.includes(hash) ||
                LEGACY_ADMIN_PATTERNS.includes(adminParam || '') ||
                accessParam === 'admin') {

                console.log('🔑 Legacy admin pattern detected in URL - redirecting to /admin');

                // Clean the URL and redirect to /admin
                const cleanUrl = `${window.location.origin}${window.location.pathname}`;
                window.history.replaceState({}, document.title, cleanUrl);

                // Navigate to /admin route
                navigateToAdmin();
            }
        } catch (error) {
            console.error('❌ Error checking URL for legacy admin access:', error);
        }
    };

    // Enhanced: Keyboard Shortcut Detection with authentication check
    const handleKeyDown = async (event: KeyboardEvent) => {
        try {
            // Only trigger if Ctrl+Shift are held
            if (!event.ctrlKey || !event.shiftKey) {
                resetShortcutSequence();
                return;
            }

            // Add key to sequence
            if (ADMIN_SHORTCUT_SEQUENCE.includes(event.code)) {
                shortcutSequence.push(event.code);

                // Reset timer
                if (shortcutTimer) clearTimeout(shortcutTimer);
                shortcutTimer = setTimeout(resetShortcutSequence, 2000);

                // Check if sequence is complete
                if (shortcutSequence.length === ADMIN_SHORTCUT_SEQUENCE.length) {
                    const isCorrectSequence = shortcutSequence.every(
                        (key, index) => key === ADMIN_SHORTCUT_SEQUENCE[index]
                    );

                    if (isCorrectSequence) {
                        event.preventDefault();
                        console.log('🎯 Admin keyboard shortcut activated - routing to /admin');
                        await openAdminAccess();
                        resetShortcutSequence();
                    }
                }
            } else {
                resetShortcutSequence();
            }
        } catch (error) {
            console.error('❌ Error in keyboard shortcut handler:', error);
            resetShortcutSequence();
        }
    };

    // Reset shortcut sequence with proper cleanup
    const resetShortcutSequence = () => {
        shortcutSequence = [];
        if (shortcutTimer) {
            clearTimeout(shortcutTimer);
            shortcutTimer = null;
        }
    };

    // Enhanced: Console Command Detection with database authentication
    const addConsoleCommands = () => {
        try {
            // Enhanced admin console command - now routes to /admin
            (window as any).__applytrak_admin = async () => {
                console.log('🔑 Opening ApplyTrak Admin Dashboard - routing to /admin');
                await openAdminAccess();
                return 'Navigated to /admin route';
            };

            // Enhanced analytics console command
            (window as any).__applytrak_analytics = async () => {
                try {
                    const store = useAppStore.getState();
                    console.log('📊 Opening Analytics...');

                    // Check authentication and admin privileges
                    if (store.auth?.isAuthenticated) {
                        const hasAdminPrivileges = await checkAdminPrivileges();

                        if (hasAdminPrivileges && store.ui.admin.authenticated) {
                            // Use the store's setAdminSection method if available
                            if (store.setAdminSection) {
                                store.setAdminSection('analytics');
                            }
                            // Use the store's openAdminDashboard method if available
                            if (store.openAdminDashboard && !store.ui.admin.dashboardOpen) {
                                store.openAdminDashboard();
                            }
                            return 'Analytics section opened';
                        } else {
                            await openAdminAccess();
                            return 'Admin authentication required';
                        }
                    } else {
                        await openAdminAccess();
                        return 'User authentication required';
                    }
                } catch (error) {
                    console.error('❌ Error opening analytics:', error);
                    return 'Error opening analytics';
                }
            };

            // Enhanced info console command
            (window as any).__applytrak_info = async () => {
                const store = useAppStore.getState();
                const sessionStatus = await getSessionStatus();

                return {
                    authenticated: store.ui.admin.authenticated,
                    dashboardOpen: store.ui.admin.dashboardOpen,
                    currentSection: store.ui.admin.currentSection,
                    analyticsEnabled: store.analyticsSettings.enabled,
                    userAuthenticated: store.auth?.isAuthenticated || false,
                    adminSessionValid: sessionStatus.authenticated,
                    adminPrivileges: sessionStatus.isValidAdmin,
                    shortcuts: 'Ctrl+Shift+A+D+M for admin access'
                };
            };

            // NEW: Admin status check command
            (window as any).__applytrak_admin_status = async () => {
                try {
                    const store = useAppStore.getState();
                    const isAdmin = await verifyCurrentAdmin();
                    const sessionStatus = await getSessionStatus();

                    console.log('🔐 Admin Status Check:');
                    console.log(`  User Authenticated: ${store.auth?.isAuthenticated || false}`);
                    console.log(`  Has Admin Privileges: ${isAdmin}`);
                    console.log(`  Admin Session Valid: ${sessionStatus.authenticated}`);
                    console.log(`  Session Valid Admin: ${sessionStatus.isValidAdmin}`);

                    return {
                        userAuthenticated: store.auth?.isAuthenticated || false,
                        hasAdminPrivileges: isAdmin,
                        adminSessionValid: sessionStatus.authenticated,
                        sessionValidAdmin: sessionStatus.isValidAdmin
                    };
                } catch (error) {
                    console.error('❌ Error checking admin status:', error);
                    return { error: 'Failed to check admin status' };
                }
            };

            // Add helpful console messages
            console.log(
                '%c🔑 ApplyTrak Admin Access Available (Enhanced)',
                'color: #3b82f6; font-weight: bold; font-size: 16px; background: #f0f9ff; padding: 8px; border-radius: 4px;'
            );
            console.log(
                '%c📋 Available Commands:',
                'color: #374151; font-weight: bold; font-size: 14px;'
            );
            console.log(
                '%c  • __applytrak_admin() - Open admin access (database-verified)',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c  • __applytrak_analytics() - Open analytics (admin required)',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c  • __applytrak_info() - Show admin status',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c  • __applytrak_admin_status() - Check admin privileges',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c  • Ctrl+Shift+A+D+M - Keyboard shortcut',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c  • URL: ?access=admin or #admin-dashboard-krishna-2024',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c🔐 Enhanced Security: Database admin verification enabled',
                'color: #059669; font-weight: bold; font-size: 12px;'
            );

        } catch (error) {
            console.error('❌ Error setting up console commands:', error);
        }
    };

    // Enhanced: Special URL Pattern Detection
    const handleSpecialUrls = async () => {
        try {
            await checkUrlForLegacyAdmin(); // This already handles most URL patterns
        } catch (error) {
            console.error('❌ Error handling special URLs:', error);
        }
    };

    // Listen for popstate events (back/forward button)
    const handlePopState = async () => {
        setTimeout(() => checkUrlForLegacyAdmin(), 100); // Small delay to ensure URL is updated
    };

    // Enhanced: Initialize all handlers with error handling
    try {
        handleSpecialUrls();
        addConsoleCommands();

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown, {passive: false});
        window.addEventListener('hashchange', checkUrlForLegacyAdmin);
        window.addEventListener('popstate', handlePopState);

        console.log('✅ Enhanced admin routes initialized successfully with database authentication');
    } catch (error) {
        console.error('❌ Error initializing admin routes:', error);
        isInitialized = false; // Reset flag on error
    }

    // Enhanced: Return comprehensive cleanup function
    return () => {
        try {
            console.log('🧹 Cleaning up enhanced admin routes...');

            // Remove event listeners
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('hashchange', checkUrlForLegacyAdmin);
            window.removeEventListener('popstate', handlePopState);

            // Clear timers
            if (shortcutTimer) {
                clearTimeout(shortcutTimer);
                shortcutTimer = null;
            }

            // Reset sequence
            resetShortcutSequence();

            // Clean up console commands
            delete (window as any).__applytrak_admin;
            delete (window as any).__applytrak_analytics;
            delete (window as any).__applytrak_info;
            delete (window as any).__applytrak_admin_status;

            // Reset initialization flag
            isInitialized = false;

            console.log('✅ Enhanced admin routes cleanup completed');
        } catch (error) {
            console.error('❌ Error during admin routes cleanup:', error);
        }
    };
};

/**
 * Enhanced: Create admin bookmark for /admin route
 */
const createAdminBookmark = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
        try {
            const adminUrl = `${window.location.origin}/admin`;

            // Try modern clipboard API first
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(adminUrl)
                    .then(() => {
                        useAppStore.getState().showToast({
                            type: 'success',
                            message: '🔑 Admin URL copied! Bookmark /admin for easy access. Database authentication required.',
                            duration: 5000
                        });
                        resolve();
                    })
                    .catch(() => {
                        fallbackCopyMethod(adminUrl);
                        resolve();
                    });
            } else {
                fallbackCopyMethod(adminUrl);
                resolve();
            }
        } catch (error) {
            console.error('❌ Error creating admin bookmark:', error);
            useAppStore.getState().showToast({
                type: 'error',
                message: 'Failed to create admin bookmark',
                duration: 3000
            });
            resolve();
        }
    });
};

/**
 * Fallback copy method for older browsers
 */
const fallbackCopyMethod = (text: string) => {
    try {
        // Create temporary textarea
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
            useAppStore.getState().showToast({
                type: 'success',
                message: '🔑 Admin URL copied! Bookmark it for easy access.',
                duration: 5000
            });
        } else {
            throw new Error('Copy command failed');
        }
    } catch (error) {
        // Final fallback: show URL in toast
        useAppStore.getState().showToast({
            type: 'info',
            message: `🔑 Admin URL: ${text}`,
            duration: 10000
        });
    }
};

/**
 * Enhanced: Quick admin access methods with /admin routing
 */
export const adminAccess = {
    // Direct access to /admin route
    route: async () => {
        console.log('🎯 Direct admin route access requested');
        await openAdminAccess();
    },

    // Legacy URL-based access (redirects to /admin)
    byUrl: async () => {
        try {
            window.location.hash = 'admin-dashboard-krishna-2024';
            console.log('🔗 Legacy admin URL hash set - will redirect to /admin');
        } catch (error) {
            console.error('❌ Error setting admin URL:', error);
        }
    },

    // Create bookmark for /admin route
    bookmark: async () => {
        console.log('🔖 Creating admin bookmark for /admin route...');
        await createAdminBookmark();
    },

    // Check if admin mode is available
    isAvailable: async (): Promise<boolean> => {
        try {
            const store = useAppStore.getState();

            // Check if user is authenticated
            if (!store.auth?.isAuthenticated) {
                return false;
            }

            // Check admin privileges
            return await verifyCurrentAdmin();
        } catch (error) {
            console.error('❌ Error checking admin availability:', error);
            return false;
        }
    },

    // Check admin status
    status: async () => {
        return (window as any).__applytrak_admin_status();
    },

    // NEW: Check if currently on /admin route
    isOnAdminRoute: (): boolean => {
        return isAdminRoute();
    },

    // NEW: Handle /admin route access (for App.tsx)
    handleRouteAccess: async (): Promise<boolean> => {
        return await handleAdminRouteAccess();
    }
};

// Enhanced: Export additional utilities for /admin routing
export const adminUtils = {
    checkAdminPrivileges,
    handleAdminRouteAccess,
    isAdminRoute,
    navigateToAdmin,
    createAdminBookmark,
    patterns: LEGACY_ADMIN_PATTERNS,
    shortcutSequence: ADMIN_SHORTCUT_SEQUENCE
};

export default {
    initializeAdminRoutes,
    adminAccess,
    adminUtils
};