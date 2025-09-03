// src/store/useAuthStore.ts - Focused Authentication Store
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '../services/databaseService';
import { AppUser } from '../types';

export interface AuthState {
    user: AppUser | null;
    session: any | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface AuthActions {
    // Authentication methods
    signUp: (email: string, password: string, displayName?: string) => Promise<{ user: AppUser | null; error?: string }>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updateUserProfile: (updates: { full_name?: string; email?: string }) => Promise<void>;
    
    // State management
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
    
    // Initialization
    initializeAuth: () => Promise<void>;
    getAuthStatus: () => AuthState;
}

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: true,
            error: null,

            // Actions
            signUp: async (email, password, displayName) => {
                set({ isLoading: true, error: null });
                
                try {
                    const result = await authService.signUp(email, password, displayName);
                    
                    if (result.user) {
                        // Convert Supabase User to AppUser
                        const appUser: AppUser = {
                            id: result.user.id,
                            email: result.user.email || email,
                            display_name: displayName || result.user.user_metadata?.full_name
                        };
                        
                        set({
                            user: appUser,
                            isAuthenticated: true,
                            isLoading: false,
                            error: null
                        });
                        
                        return { user: appUser };
                    }
                    
                    return { user: null, error: 'No user data received' };
                } catch (error: any) {
                    const errorMessage = error?.message || 'Failed to sign up';
                    set({ error: errorMessage, isLoading: false });
                    return { user: null, error: errorMessage };
                }
            },

            signIn: async (email, password) => {
                set({ isLoading: true, error: null });
                
                try {
                    await authService.signIn(email, password);
                    set({ isLoading: false, error: null });
                } catch (error: any) {
                    const errorMessage = error?.message || 'Failed to sign in';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            signOut: async () => {
                set({ isLoading: true, error: null });
                
                try {
                    await authService.signOut();
                    set({
                        user: null,
                        session: null,
                        isAuthenticated: false,
                        isLoading: false,
                        error: null
                    });
                } catch (error: any) {
                    const errorMessage = error?.message || 'Failed to sign out';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

                        updateUserProfile: async (updates) => {
                set({ isLoading: true, error: null });
                
                try {
                    await authService.updateUserProfile(updates);
                    
                    // Get the updated user data from auth service
                    const updatedUser = await authService.getCurrentUser();
                    
                    if (updatedUser) {
                        // Update local user state with fresh data
                        set({
                            user: {
                                id: updatedUser.id,
                                email: updatedUser.email || '',
                                display_name: updatedUser.user_metadata?.full_name || 
                                            updatedUser.user_metadata?.name ||
                                            updatedUser.email?.split('@')[0] ||
                                            'User'
                            },
                            isLoading: false,
                            error: null
                        });
                    } else {
                        // Fallback: update local state with provided updates
                        const currentUser = get().user;
                        if (currentUser && updates.full_name) {
                            set({
                                user: { ...currentUser, display_name: updates.full_name },
                                isLoading: false,
                                error: null
                            });
                        } else {
                            set({ isLoading: false, error: null });
                        }
                    }
                } catch (error: any) {
                    const errorMessage = error?.message || 'Failed to update profile';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            resetPassword: async (email) => {
                set({ isLoading: true, error: null });
                
                try {
                    await authService.resetPassword(email);
                    set({ isLoading: false, error: null });
                } catch (error: any) {
                    const errorMessage = error?.message || 'Failed to reset password';
                    set({ error: errorMessage, isLoading: false });
                    throw error;
                }
            },

            setLoading: (loading) => set({ isLoading: loading }),
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),

            initializeAuth: async () => {
                try {
                    authService.subscribeToAuthChanges((authState) => {
                        // Convert Supabase User to AppUser if needed
                        const appUser = authState.user ? {
                            id: authState.user.id,
                            email: authState.user.email || '',
                            display_name: authState.user.user_metadata?.full_name
                        } : null;
                        
                        set({
                            user: appUser,
                            session: authState.session,
                            isAuthenticated: authState.isAuthenticated,
                            isLoading: authState.isLoading,
                            error: null
                        });
                    });

                    const currentAuth = authService.getAuthState();
                    // Convert Supabase User to AppUser if needed
                    const appUser = currentAuth.user ? {
                        id: currentAuth.user.id,
                        email: currentAuth.user.email || '',
                        display_name: currentAuth.user.user_metadata?.full_name
                    } : null;
                    
                    set({
                        user: appUser,
                        session: currentAuth.session,
                        isAuthenticated: currentAuth.isAuthenticated,
                        isLoading: currentAuth.isLoading,
                        error: null
                    });

                    // Don't return the unsubscribe function since we can't use it
                } catch (error) {
                    console.error('Authentication initialization failed:', error);
                    set({ isLoading: false, error: 'Failed to initialize authentication' });
                }
            },

            getAuthStatus: () => get()
        }),
        {
            name: 'applytrak-auth-store',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated
            })
        }
    )
);
