// src/components/admin/AdminLogin.tsx - Simple Admin Authentication
import React, {useCallback, useState} from 'react';
import {Eye, EyeOff, Lock, Shield, User} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

const AdminLogin: React.FC = () => {
    const {modals, authenticateAdmin, showToast} = useAppStore();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const handleClose = () => {
        // Reset state when closing
        setPassword('');
        setShowPassword(false);
        setIsAuthenticating(false);

        // Close modal via store
        useAppStore.setState(state => ({
            modals: {
                ...state.modals,
                adminLogin: {isOpen: false}
            }
        }));
    };

    const handleSubmit = useCallback(async () => {
        if (!password.trim()) {
            showToast({
                type: 'warning',
                message: 'Please enter the admin password.'
            });
            return;
        }

        setIsAuthenticating(true);

        try {
            // Small delay for better UX
            await new Promise(resolve => setTimeout(resolve, 500));

            const success = authenticateAdmin(password);

            if (success) {
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
            }
        } catch (error) {
            console.error('Authentication error:', error);
            showToast({
                type: 'error',
                message: 'Authentication failed. Please try again.'
            });
        } finally {
            setIsAuthenticating(false);
            setPassword(''); // Clear password for security
        }
    }, [password, authenticateAdmin, showToast]);

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <Modal
            isOpen={modals.adminLogin.isOpen}
            onClose={handleClose}
            title="Admin Access"
            size="sm"
            variant="primary"
        >
            <div className="space-y-6">
                {/* Admin Icon */}
                <div className="flex justify-center">
                    <div
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                        <Shield className="h-8 w-8 text-white"/>
                    </div>
                </div>

                {/* Header */}
                <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        ApplyTrak Admin
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enter your admin password to access the dashboard
                    </p>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                    <label className="form-label-enhanced">
                        <Lock className="inline h-4 w-4 mr-2"/>
                        Admin Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter admin password"
                            className="form-input-enhanced pr-12"
                            disabled={isAuthenticating}
                            autoFocus
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            disabled={isAuthenticating}
                        >
                            {showPassword ? (
                                <EyeOff className="h-5 w-5"/>
                            ) : (
                                <Eye className="h-5 w-5"/>
                            )}
                        </button>
                    </div>
                </div>

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
                                Admin Dashboard Access
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                View analytics, feedback, and user insights to improve ApplyTrak for everyone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={handleSubmit}
                        disabled={isAuthenticating || !password.trim()}
                        className="
              btn btn-primary form-btn group relative overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
              min-w-[120px] justify-center
            "
                    >
                        {isAuthenticating ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                Verifying...
                            </>
                        ) : (
                            <>
                                <Shield
                                    className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                Access Admin
                            </>
                        )}
                    </button>
                </div>

                {/* Security Note */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        🔐 Secure admin access for authorized users only
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default AdminLogin;