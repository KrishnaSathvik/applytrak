// src/hooks/useAutoAdminRedirect.ts - AUTOMATIC ADMIN DETECTION AFTER LOGIN
import {useEffect} from 'react';
import {useAppStore} from '../store/useAppStore';
import {verifyDatabaseAdmin} from '../utils/adminAuth';

/**
 * Hook that automatically detects admin users after login and redirects them to admin dashboard
 * This runs after any successful authentication (login/signup)
 */
export const useAutoAdminRedirect = () => {
    const {auth, ui, showToast} = useAppStore();

    useEffect(() => {
        const checkAndRedirectAdmin = async () => {
            // Only check if user just authenticated and not already on admin
            if (
                auth.isAuthenticated &&
                auth.user &&
                auth.user.email &&
                !ui.admin.dashboardOpen &&
                !auth.isLoading
            ) {
                console.log('🔍 Checking if authenticated user is admin:', auth.user.email);

                try {
                    // Check if user is admin in database
                    const isAdmin = await verifyDatabaseAdmin(auth.user.email);

                    if (isAdmin) {
                        console.log('✅ Admin detected! Auto-redirecting to admin dashboard...');

                        // Set admin state and open dashboard
                        useAppStore.setState(state => ({
                            ui: {
                                ...state.ui,
                                admin: {
                                    ...state.ui.admin,
                                    authenticated: true,
                                    dashboardOpen: true,
                                    currentSection: 'overview'
                                }
                            }
                        }));

                        // Show welcome message
                        showToast({
                            type: 'success',
                            message: '🔑 Welcome to ApplyTrak Admin Dashboard',
                            duration: 4000
                        });

                        console.log('🎯 Admin user automatically redirected to dashboard');
                    } else {
                        console.log('👤 Regular user - staying on main application');
                    }
                } catch (error) {
                    console.error('❌ Error checking admin status:', error);
                    // Fail silently - user stays on main app
                }
            }
        };

        // Small delay to ensure auth state is fully settled
        const timeoutId = setTimeout(checkAndRedirectAdmin, 500);

        return () => clearTimeout(timeoutId);
    }, [
        auth.isAuthenticated,
        auth.user?.email,
        auth.isLoading,
        ui.admin.dashboardOpen,
        showToast
    ]);
};

export default useAutoAdminRedirect;