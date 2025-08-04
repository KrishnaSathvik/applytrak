// src/utils/adminRoute.ts - Secret Admin Access Handler (FIXED & ENHANCED)
import {useAppStore} from '../store/useAppStore';

// Secret admin access patterns
const ADMIN_PATTERNS = [
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
 * 🔧 FIXED: Initialize admin route handlers with proper cleanup
 */
export const initializeAdminRoutes = (): (() => void) => {
    // Prevent double initialization
    if (isInitialized) {
        console.warn('⚠️ Admin routes already initialized');
        return () => {
        }; // Return empty cleanup function
    }

    console.log('🔑 Initializing admin routes...');
    isInitialized = true;

    // 🔧 FIXED: URL Hash Detection with error handling
    const checkUrlForAdmin = () => {
        try {
            const hash = window.location.hash.substring(1); // Remove #
            const params = new URLSearchParams(window.location.search);
            const adminParam = params.get('admin');
            const accessParam = params.get('access');

            if (ADMIN_PATTERNS.includes(hash) ||
                ADMIN_PATTERNS.includes(adminParam || '') ||
                accessParam === 'admin') {

                console.log('🔑 Admin pattern detected in URL');
                openAdminLogin();

                // 🔧 IMPROVED: Clean the URL for security without breaking navigation
                const cleanUrl = `${window.location.origin}${window.location.pathname}`;
                window.history.replaceState({}, document.title, cleanUrl);
            }
        } catch (error) {
            console.error('❌ Error checking URL for admin access:', error);
        }
    };

    // 🔧 FIXED: Keyboard Shortcut Detection with better error handling
    const handleKeyDown = (event: KeyboardEvent) => {
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
                        console.log('🎯 Admin keyboard shortcut activated!');
                        openAdminLogin();
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

    // 🔧 FIXED: Reset shortcut sequence with proper cleanup
    const resetShortcutSequence = () => {
        shortcutSequence = [];
        if (shortcutTimer) {
            clearTimeout(shortcutTimer);
            shortcutTimer = null;
        }
    };

    // 🔧 ENHANCED: Console Command Detection with better implementation
    const addConsoleCommands = () => {
        try {
            // Add secret console commands
            (window as any).__applytrak_admin = () => {
                console.log('🔑 Opening ApplyTrak Admin Dashboard...');
                openAdminLogin();
                return 'Admin login modal opened';
            };

            (window as any).__applytrak_analytics = () => {
                try {
                    const store = useAppStore.getState();
                    console.log('📊 Opening Analytics...');

                    if (store.ui.admin.authenticated) {
                        store.setAdminSection('analytics');
                        if (!store.ui.admin.dashboardOpen) {
                            store.openAdminDashboard();
                        }
                        return 'Analytics section opened';
                    } else {
                        openAdminLogin();
                        return 'Admin login required - opening login modal';
                    }
                } catch (error) {
                    console.error('❌ Error opening analytics:', error);
                    return 'Error opening analytics';
                }
            };

            // 🔧 NEW: Additional console utilities
            (window as any).__applytrak_info = () => {
                const store = useAppStore.getState();
                return {
                    authenticated: store.ui.admin.authenticated,
                    dashboardOpen: store.ui.admin.dashboardOpen,
                    currentSection: store.ui.admin.currentSection,
                    analyticsEnabled: store.analyticsSettings.enabled,
                    shortcuts: 'Ctrl+Shift+A+D+M for admin access'
                };
            };

            // Add helpful console messages
            console.log(
                '%c🔑 ApplyTrak Admin Access Available',
                'color: #3b82f6; font-weight: bold; font-size: 16px; background: #f0f9ff; padding: 8px; border-radius: 4px;'
            );
            console.log(
                '%c📋 Available Commands:',
                'color: #374151; font-weight: bold; font-size: 14px;'
            );
            console.log(
                '%c  • __applytrak_admin() - Open admin login',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c  • __applytrak_analytics() - Open analytics (if authenticated)',
                'color: #6b7280; font-size: 12px;'
            );
            console.log(
                '%c  • __applytrak_info() - Show admin status',
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

        } catch (error) {
            console.error('❌ Error setting up console commands:', error);
        }
    };

    // 🔧 ENHANCED: Special URL Pattern Detection
    const handleSpecialUrls = () => {
        try {
            checkUrlForAdmin(); // This already handles most URL patterns
        } catch (error) {
            console.error('❌ Error handling special URLs:', error);
        }
    };

    // 🔧 NEW: Listen for popstate events (back/forward button)
    const handlePopState = () => {
        setTimeout(checkUrlForAdmin, 100); // Small delay to ensure URL is updated
    };

    // 🔧 ENHANCED: Initialize all handlers with error handling
    try {
        checkUrlForAdmin();
        handleSpecialUrls();
        addConsoleCommands();

        // Add event listeners
        document.addEventListener('keydown', handleKeyDown, {passive: false});
        window.addEventListener('hashchange', checkUrlForAdmin);
        window.addEventListener('popstate', handlePopState);

        console.log('✅ Admin routes initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing admin routes:', error);
        isInitialized = false; // Reset flag on error
    }

    // 🔧 ENHANCED: Return comprehensive cleanup function
    return () => {
        try {
            console.log('🧹 Cleaning up admin routes...');

            // Remove event listeners
            document.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('hashchange', checkUrlForAdmin);
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

            // Reset initialization flag
            isInitialized = false;

            console.log('✅ Admin routes cleanup completed');
        } catch (error) {
            console.error('❌ Error during admin routes cleanup:', error);
        }
    };
};

/**
 * 🔧 ENHANCED: Open admin login modal with better error handling
 */
const openAdminLogin = () => {
    try {
        const store = useAppStore.getState();

        // If already authenticated, open dashboard directly
        if (store.ui.admin.authenticated) {
            store.openAdminDashboard();
            store.showToast({
                type: 'info',
                message: '🔑 Admin dashboard opened',
                duration: 2000
            });
            console.log('✅ Admin dashboard opened (already authenticated)');
            return;
        }

        // Open login modal
        useAppStore.setState(state => ({
            modals: {
                ...state.modals,
                adminLogin: {isOpen: true}
            }
        }));

        store.showToast({
            type: 'info',
            message: '🔐 Admin access requested',
            duration: 2000
        });

        console.log('🔐 Admin login modal opened');
    } catch (error) {
        console.error('❌ Error opening admin login:', error);
    }
};

/**
 * 🔧 ENHANCED: Create admin access bookmark with better fallbacks
 */
export const createAdminBookmark = (): Promise<void> => {
    return new Promise((resolve) => {
        try {
            const adminUrl = `${window.location.origin}${window.location.pathname}?access=admin`;

            // Try to copy URL to clipboard first (most reliable)
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(adminUrl)
                    .then(() => {
                        useAppStore.getState().showToast({
                            type: 'success',
                            message: '🔑 Admin URL copied to clipboard! Bookmark it for easy access.',
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
 * 🔧 NEW: Fallback copy method for older browsers
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
 * 🔧 ENHANCED: Quick admin access methods for different scenarios
 */
export const adminAccess = {
    // URL-based access
    byUrl: () => {
        try {
            window.location.hash = 'admin-dashboard-krishna-2024';
            console.log('🔗 Admin URL hash set');
        } catch (error) {
            console.error('❌ Error setting admin URL:', error);
        }
    },

    // Direct programmatic access
    direct: () => {
        console.log('🎯 Direct admin access requested');
        openAdminLogin();
    },

    // Create bookmark
    bookmark: async () => {
        console.log('🔖 Creating admin bookmark...');
        await createAdminBookmark();
    },

    // Check if admin mode is available
    isAvailable: () => {
        return process.env.NODE_ENV === 'development' ||
            window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.protocol === 'file:' ||
            window.location.hostname.includes('local');
    },

    // 🔧 NEW: Get current admin status
    getStatus: () => {
        try {
            const store = useAppStore.getState();
            return {
                authenticated: store.ui.admin.authenticated,
                dashboardOpen: store.ui.admin.dashboardOpen,
                currentSection: store.ui.admin.currentSection,
                isInitialized
            };
        } catch (error) {
            console.error('❌ Error getting admin status:', error);
            return {
                authenticated: false,
                dashboardOpen: false,
                currentSection: 'overview' as const,
                isInitialized: false
            };
        }
    },

    // 🔧 NEW: Force logout admin
    logout: () => {
        try {
            const store = useAppStore.getState();
            store.logoutAdmin();
            console.log('🚪 Admin logged out');
        } catch (error) {
            console.error('❌ Error logging out admin:', error);
        }
    }
};

// 🔧 ENHANCED: Add to window for debugging with better organization
if (process.env.NODE_ENV === 'development') {
    (window as any).__adminAccess = adminAccess;
    (window as any).__adminRoutes = {
        initialize: initializeAdminRoutes,
        patterns: ADMIN_PATTERNS,
        shortcut: ADMIN_SHORTCUT_SEQUENCE.join('+'),
        isInitialized: () => isInitialized
    };

    console.log('🔧 Development mode: Admin utilities available');
    console.log('  • window.__adminAccess - Admin access methods');
    console.log('  • window.__adminRoutes - Route utilities');
}

// 🔧 NEW: Export initialization status checker
export const isAdminRoutesInitialized = () => isInitialized;

// 🔧 NEW: Emergency admin access (for development)
export const emergencyAdminAccess = () => {
    if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 Emergency admin access activated!');
        openAdminLogin();
    } else {
        console.warn('🚨 Emergency admin access only available in development mode');
    }
};