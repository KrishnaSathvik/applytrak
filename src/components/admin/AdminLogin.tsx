// src/components/admin/AdminLogin.tsx - Enhanced Admin Authentication with Email + Password
import React, {useCallback, useState} from 'react';
import {Eye, EyeOff, Lock, Shield, User, Mail} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';
import {authenticateAdmin, trackLoginAttempt, isLoginRateLimited} from '../../utils/adminAuth';

const AdminLogin: React.FC = () => {
    const {modals, showToast} = useAppStore();

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Form validation
    const [errors, setErrors] = useState<{email?: string; password?: string}>({});

    const handleClose = () => {
        // Reset state when closing
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setIsAuthenticating(false);
        setErrors({});

        // Close modal via store
        useAppStore.setState(state => ({
            modals: {
                ...state.modals,
                adminLogin: {isOpen: false}
            }
        }));
    };

    const validateForm = (): boolean => {
        const newErrors: {email?: string; password?: string} = {};

        // Email validation
        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!password.trim()) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        e?.preventDefault();

        // Validate form
        if (!validateForm()) {
            return;
        }

        // Check rate limiting
        if (isLoginRateLimited(email)) {
            showToast({
                type: 'error',
                message: 'Too many failed attempts. Please wait 15 minutes before trying again.',
                duration: 6000
            });
            return;
        }

        setIsAuthenticating(true);

        try {
            // Small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            // Authenticate using enhanced admin auth
            const result = await authenticateAdmin(email, password);

            // Track login attempt
            trackLoginAttempt(email, result.success);

            if (result.success) {
                // Close modal and open admin dashboard
                handleClose();

                // Open admin dashboard
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

                showToast({
                    type: 'success',
                    message: '🔑 Welcome to ApplyTrak Admin Dashboard',
                    duration: 4000
                });
            } else {
                // Show specific error message
                showToast({
                    type: 'error',
                    message: result.error || 'Authentication failed. Please check your credentials.',
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Authentication error:', error);

            // Track failed attempt
            trackLoginAttempt(email, false);

            showToast({
                type: 'error',
                message: 'Authentication system error. Please try again.',
                duration: 5000
            });
        } finally {
            setIsAuthenticating(false);
        }
    }, [email, password, showToast]);

    // Handle Enter key
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isAuthenticating) {
            handleSubmit();
        }
    };

    return (
        <Modal
            isOpen={modals.adminLogin.isOpen}
            onClose={handleClose}
            title="Admin Dashboard Access"
            size="md"
        >
            <div className="space-y-6">
                {/* Header with Icon */}
                <div className="text-center">
                    <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <Shield className="h-8 w-8 text-white"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Admin Authentication
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Sign in with your admin credentials to access the dashboard
                    </p>
                </div>

                {/* Enhanced Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div>
                        <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail className="h-5 w-5 text-gray-400"/>
                            </div>
                            <input
                                id="admin-email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    // Clear email error when user starts typing
                                    if (errors.email) {
                                        setErrors(prev => ({...prev, email: undefined}));
                                    }
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="admin@applytrak.com"
                                className={`
                                    form-input-enhanced pl-10
                                    ${errors.email ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' : ''}
                                `}
                                disabled={isAuthenticating}
                                autoComplete="email"
                                autoFocus
                            />
                        </div>
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="admin-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-5 w-5 text-gray-400"/>
                            </div>
                            <input
                                id="admin-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    // Clear password error when user starts typing
                                    if (errors.password) {
                                        setErrors(prev => ({...prev, password: undefined}));
                                    }
                                }}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter your admin password"
                                className={`
                                    form-input-enhanced pl-10 pr-10
                                    ${errors.password ? 'border-red-300 dark:border-red-600 focus:ring-red-500 focus:border-red-500' : ''}
                                `}
                                disabled={isAuthenticating}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                disabled={isAuthenticating}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5"/>
                                ) : (
                                    <Eye className="h-5 w-5"/>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isAuthenticating || !email.trim() || !password.trim()}
                        className="
                            w-full btn btn-primary form-btn group relative overflow-hidden
                            disabled:opacity-50 disabled:cursor-not-allowed
                            justify-center
                        "
                    >
                        {isAuthenticating ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                Verifying Admin Access...
                            </>
                        ) : (
                            <>
                                <Shield
                                    className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                Access Admin Dashboard
                            </>
                        )}
                    </button>
                </form>

                {/* Info Box */}
                <div
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="h-3 w-3 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Enhanced Admin Security
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                Admin access is verified against the database. Only authorized users with admin privileges can access the dashboard.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Admin Instructions */}
                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border border-amber-200/50 dark:border-amber-700/50">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Shield className="h-3 w-3 text-amber-600 dark:text-amber-400"/>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                For Administrators
                            </h4>
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                                Use your regular ApplyTrak account credentials. Admin privileges are verified in the database upon login.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security Note */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        🔐 Secure database-verified admin authentication
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default AdminLogin;