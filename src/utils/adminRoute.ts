// src/utils/adminRoute.ts - Production Ready Admin Routing
import {useAppStore} from '../store/useAppStore';
import {verifyCurrentAdmin} from './adminAuth';

// Enhanced interfaces for better type safety
interface AdminRouteState {
    isInitialized: boolean;
    shortcutSequence: string[];
    shortcutTimer: ReturnType<typeof setTimeout> | null;
    eventListeners: Set<() => void>;
}

// Removed unused AdminAccessResult interface

// AdminStatusInfo interface removed - no longer needed

// Constants with better organization
const ADMIN_CONFIG = {
    ROUTE_PATH: '/admin',
    SHORTCUT_TIMEOUT: 2000,
    TOAST_DURATION: {
        SUCCESS: 4000,
        WARNING: 5000,
        ERROR: 4000,
        INFO: 10000
    }
} as const;

const LEGACY_ADMIN_PATTERNS = [
    'admin-dashboard-krishna-2024',
    'applytrak-admin',
    'secret-analytics',
    'admin-panel-2024'
] as const;

const ADMIN_SHORTCUT_SEQUENCE = ['KeyA', 'KeyD', 'KeyM'] as const;

// State management with better encapsulation
const adminRouteState: AdminRouteState = {
    isInitialized: false,
    shortcutSequence: [],
    shortcutTimer: null,
    eventListeners: new Set()
};

// Utility functions removed - no longer needed

// Removed unused safeParseUrl function

const addEventListenerWithCleanup = (
    target: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
): void => {
    target.addEventListener(event, handler, options);

    const cleanup = () => target.removeEventListener(event, handler);
    adminRouteState.eventListeners.add(cleanup);
};

// Enhanced Route Detection and Navigation
export const isAdminRoute = (): boolean => {
    try {
        return window.location.pathname === ADMIN_CONFIG.ROUTE_PATH;
    } catch (error) {
        console.warn('Failed to check admin route:', error);
        return false;
    }
};

export const navigateToAdmin = (): void => {
    try {
        // Validate current state
        if (isAdminRoute()) {
            console.log('Already on admin route');
            return;
        }

        // Use modern navigation with fallback
        if (window.history?.pushState) {
            window.history.pushState({}, '', ADMIN_CONFIG.ROUTE_PATH);

            // Dispatch custom event for App.tsx
            const event = new CustomEvent('adminRouteChange', {
                detail: {path: ADMIN_CONFIG.ROUTE_PATH}
            });
            window.dispatchEvent(event);

            console.log('Navigated to admin route');
        } else {
            // Fallback for older browsers
            window.location.hash = 'admin-access';
            console.log('Used fallback navigation');
        }
    } catch (error) {
        console.error('Navigation to admin route failed:', error);

        // Ultimate fallback
        try {
            window.location.hash = 'admin-access';
        } catch (fallbackError) {
            console.error('Fallback navigation also failed:', fallbackError);
        }
    }
};

// Enhanced Authentication and Privilege Checking
const checkAdminPrivileges = async (): Promise<boolean> => {
    try {
        const store = useAppStore.getState();

        // Validate store state
        if (!store || typeof store !== 'object') {
            console.error('Invalid store state');
            return false;
        }

        // Check user authentication
        if (!store.auth?.isAuthenticated) {
            console.log('User not authenticated - login required');
            return false;
        }

        // Verify admin status with timeout
        const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Admin verification timeout')), 10000);
        });

        const adminCheckPromise = verifyCurrentAdmin();
        const isAdmin = await Promise.race([adminCheckPromise, timeoutPromise]);

        if (!isAdmin) {
            console.log('User authenticated but lacks admin privileges');

            if (store.showToast && typeof store.showToast === 'function') {
                store.showToast({
                    type: 'warning',
                    message: 'Admin privileges required. Please contact an administrator.',
                    duration: ADMIN_CONFIG.TOAST_DURATION.WARNING
                });
            }
            return false;
        }

        console.log('Admin privileges verified successfully');
        return true;
    } catch (error) {
        console.error('Admin privilege check failed:', error);
        return false;
    }
};

// Enhanced Admin Route Access Handler
export const handleAdminRouteAccess = async (): Promise<boolean> => {
    try {
        const store = useAppStore.getState();

        if (!store || typeof store !== 'object') {
            console.error('Invalid store state during route access');
            return false;
        }

        // Handle authenticated users
        if (store.auth?.isAuthenticated) {
            const hasAdminPrivileges = await checkAdminPrivileges();

            if (hasAdminPrivileges) {
                console.log('Opening admin dashboard for authenticated admin');

                // Safely update store state
                try {
                    useAppStore.setState(state => ({
                        ui: {
                            ...state.ui,
                            admin: {
                                ...state.ui?.admin,
                                authenticated: true,
                                dashboardOpen: true
                            }
                        }
                    }));

                    // Show success message
                    if (store.showToast && typeof store.showToast === 'function') {
                        store.showToast({
                            type: 'success',
                            message: 'Welcome to ApplyTrak Admin Dashboard',
                            duration: ADMIN_CONFIG.TOAST_DURATION.SUCCESS
                        });
                    }
                    return true;
                } catch (stateError) {
                    console.error('Failed to update admin state:', stateError);
                    return false;
                }
            } else {
                // Redirect non-admin users
                if (window.history?.replaceState) {
                    window.history.replaceState({}, '', '/');
                }
                return false;
            }
        }

        // Handle unauthenticated users
        console.log('Opening admin login modal for unauthenticated user');

        try {
            useAppStore.setState(state => ({
                modals: {
                    ...state.modals,
                    adminLogin: {isOpen: true}
                }
            }));
        } catch (modalError) {
            console.error('Failed to open admin login modal:', modalError);
        }

        return false;
    } catch (error) {
        console.error('Admin route access handling failed:', error);

        // Safe redirect on error
        try {
            if (window.history?.replaceState) {
                window.history.replaceState({}, '', '/');
            }
        } catch (redirectError) {
            console.error('Failed to redirect after error:', redirectError);
        }

        return false;
    }
};

// Enhanced Admin Access Function
const openAdminAccess = async (): Promise<void> => {
    try {
        console.log('Admin access requested - routing to admin');
        navigateToAdmin();
    } catch (error) {
        console.error('Failed to open admin access:', error);

        const store = useAppStore.getState();
        if (store?.showToast && typeof store.showToast === 'function') {
            store.showToast({
                type: 'error',
                message: 'Error accessing admin panel. Please try again.',
                duration: ADMIN_CONFIG.TOAST_DURATION.ERROR
            });
        }
    }
};

// Enhanced URL Pattern Detection
const checkUrlForLegacyAdmin = async (): Promise<void> => {
    try {
        const currentUrl = window.location;
        const hash = currentUrl.hash.substring(1);
        const params = new URLSearchParams(currentUrl.search);
        const adminParam = params.get('admin');
        const accessParam = params.get('access');

        // Check for legacy patterns
        const hasLegacyPattern =
            LEGACY_ADMIN_PATTERNS.includes(hash as any) ||
            LEGACY_ADMIN_PATTERNS.includes(adminParam as any) ||
            accessParam === 'admin';

        if (hasLegacyPattern) {
            console.log('Legacy admin pattern detected - redirecting to admin route');

            // Clean URL
            const cleanUrl = `${currentUrl.origin}${currentUrl.pathname}`;
            if (window.history?.replaceState) {
                window.history.replaceState({}, document.title, cleanUrl);
            }

            // Navigate to admin
            navigateToAdmin();
        }
    } catch (error) {
        console.error('URL pattern check failed:', error);
    }
};

// Keyboard shortcuts removed for security - admin access only via login

// Console commands removed for security - admin access only via login

// Enhanced Initialization
export const initializeAdminRoutes = (): (() => void) => {
    if (adminRouteState.isInitialized) {
        console.warn('Admin routes already initialized');
        return () => {
        };
    }

    try {
        console.log('Initializing admin routes with enhanced security...');
        adminRouteState.isInitialized = true;

        // Create event handlers for legacy URL cleanup only
        const hashChangeHandler = () => {
            setTimeout(checkUrlForLegacyAdmin, 100);
        };
        const popStateHandler = () => {
            setTimeout(checkUrlForLegacyAdmin, 100);
        };

        // Initialize components - only legacy URL cleanup
        checkUrlForLegacyAdmin();

        // Add event listeners with cleanup tracking - only for URL cleanup
        addEventListenerWithCleanup(window, 'hashchange', hashChangeHandler);
        addEventListenerWithCleanup(window, 'popstate', popStateHandler);

        console.log('Admin routes initialized successfully');
    } catch (error) {
        console.error('Admin routes initialization failed:', error);
        adminRouteState.isInitialized = false;
    }

    // Return comprehensive cleanup function
    return (): void => {
        try {
            console.log('Cleaning up admin routes...');

            // Clear all event listeners
            adminRouteState.eventListeners.forEach(cleanup => {
                try {
                    cleanup();
                } catch (error) {
                    console.warn('Event listener cleanup failed:', error);
                }
            });
            adminRouteState.eventListeners.clear();

            // Clear timers
            if (adminRouteState.shortcutTimer) {
                clearTimeout(adminRouteState.shortcutTimer);
                adminRouteState.shortcutTimer = null;
            }

            // Reset state
            adminRouteState.shortcutSequence = [];
            adminRouteState.isInitialized = false;

            // Console commands already removed for security

            console.log('Admin routes cleanup completed');
        } catch (error) {
            console.error('Admin routes cleanup failed:', error);
        }
    };
};

// Enhanced Bookmark Creation
const createAdminBookmark = async (): Promise<void> => {
    return new Promise<void>((resolve) => {
        try {
            const adminUrl = `${window.location.origin}${ADMIN_CONFIG.ROUTE_PATH}`;

            const showSuccessMessage = (): void => {
                const store = useAppStore.getState();
                if (store?.showToast && typeof store.showToast === 'function') {
                    store.showToast({
                        type: 'success',
                        message: 'Admin URL copied! Bookmark /admin for easy access.',
                        duration: ADMIN_CONFIG.TOAST_DURATION.WARNING
                    });
                }
            };

            const showErrorMessage = (): void => {
                const store = useAppStore.getState();
                if (store?.showToast && typeof store.showToast === 'function') {
                    store.showToast({
                        type: 'info',
                        message: `Admin URL: ${adminUrl}`,
                        duration: ADMIN_CONFIG.TOAST_DURATION.INFO
                    });
                }
            };

            // Try modern clipboard API
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(adminUrl)
                    .then(() => {
                        showSuccessMessage();
                        resolve();
                    })
                    .catch(() => {
                        fallbackCopyMethod(adminUrl, showSuccessMessage, showErrorMessage);
                        resolve();
                    });
            } else {
                fallbackCopyMethod(adminUrl, showSuccessMessage, showErrorMessage);
                resolve();
            }
        } catch (error) {
            console.error('Bookmark creation failed:', error);

            const store = useAppStore.getState();
            if (store?.showToast && typeof store.showToast === 'function') {
                store.showToast({
                    type: 'error',
                    message: 'Failed to create admin bookmark',
                    duration: ADMIN_CONFIG.TOAST_DURATION.ERROR
                });
            }
            resolve();
        }
    });
};

// Enhanced Fallback Copy Method
const fallbackCopyMethod = (
    text: string,
    onSuccess: () => void,
    onError: () => void
): void => {
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, 99999);

        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);

        if (successful) {
            onSuccess();
        } else {
            onError();
        }
    } catch (error) {
        console.warn('Fallback copy method failed:', error);
        onError();
    }
};

// Enhanced Admin Access API
export const adminAccess = {
    // Direct route access
    route: async (): Promise<void> => {
        console.log('Direct admin route access requested');
        await openAdminAccess();
    },

    // Legacy URL access removed for security

    // Create bookmark
    bookmark: async (): Promise<void> => {
        console.log('Creating admin bookmark...');
        await createAdminBookmark();
    },

    // Check availability
    isAvailable: async (): Promise<boolean> => {
        try {
            const store = useAppStore.getState();

            if (!store?.auth?.isAuthenticated) {
                return false;
            }

            return await verifyCurrentAdmin();
        } catch (error) {
            console.error('Admin availability check failed:', error);
            return false;
        }
    },

    // Status check removed for security

    // Route checks
    isOnAdminRoute: (): boolean => isAdminRoute(),

    // Handle route access
    handleRouteAccess: async (): Promise<boolean> => handleAdminRouteAccess()
};

// Enhanced Admin Utils
export const adminUtils = {
    checkAdminPrivileges,
    handleAdminRouteAccess,
    isAdminRoute,
    navigateToAdmin,
    createAdminBookmark,
    patterns: LEGACY_ADMIN_PATTERNS,
    shortcutSequence: ADMIN_SHORTCUT_SEQUENCE,
    config: ADMIN_CONFIG
};

export default {
    initializeAdminRoutes,
    adminAccess,
    adminUtils
};