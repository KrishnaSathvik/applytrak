import React, {useCallback, useState} from 'react';
import {Eye, EyeOff, Lock, LogIn, Mail, Monitor, Smartphone, Zap} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

const LoginModal: React.FC = () => {
    const {
        modals,
        closeAuthModal,
        openAuthModal,
        signIn,
        auth,
        showToast
    } = useAppStore();

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleClose = () => {
        setFormData({email: '', password: ''});
        setShowPassword(false);
        setErrors({});
        closeAuthModal();
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            await signIn(formData.email, formData.password);
        } catch (error) {
            // Error handling is done in the store
        }
    }, [formData, signIn]);

    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [field]: e.target.value}));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: ''}));
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <Modal
            isOpen={modals.auth.loginOpen}
            onClose={handleClose}
            title="Welcome Back"
            size="sm"
            variant="primary"
        >
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="text-center">
                    <div
                        className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <LogIn className="h-8 w-8 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Sign in to ApplyTrak
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Access your applications across all devices
                    </p>
                </div>

                {/* Benefits Banner */}
                <div
                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-center justify-center gap-6 text-xs text-blue-700 dark:text-blue-300">
                        <div className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3"/>
                            <span className="font-medium">Cross-Device</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Monitor className="h-3 w-3"/>
                            <span className="font-medium">Cloud Sync</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Zap className="h-3 w-3"/>
                            <span className="font-medium">Real-time</span>
                        </div>
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email Field */}
                    <div className="space-y-2">
                        <label className="form-label-enhanced">
                            <Mail className="inline h-4 w-4 mr-2"/>
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange('email')}
                            onKeyPress={handleKeyPress}
                            placeholder="you@example.com"
                            className={`form-input-enhanced ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                            disabled={auth.isLoading}
                            autoComplete="email"
                            autoFocus
                        />
                        {errors.email && (
                            <p className="form-error">{errors.email}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label className="form-label-enhanced">
                            <Lock className="inline h-4 w-4 mr-2"/>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleInputChange('password')}
                                onKeyPress={handleKeyPress}
                                placeholder="Enter your password"
                                className={`form-input-enhanced pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                disabled={auth.isLoading}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                disabled={auth.isLoading}
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5"/>
                                ) : (
                                    <Eye className="h-5 w-5"/>
                                )}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="form-error">{errors.password}</p>
                        )}
                    </div>

                    {/* Error Display */}
                    {auth.error && (
                        <div
                            className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200/50 dark:border-red-700/50">
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                {auth.error}
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={auth.isLoading || !formData.email || !formData.password}
                        className="
                            w-full btn btn-primary form-btn group relative overflow-hidden
                            disabled:opacity-50 disabled:cursor-not-allowed
                            min-h-[3.25rem] justify-center
                        "
                    >
                        {auth.isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                Signing in...
                            </>
                        ) : (
                            <>
                                <LogIn
                                    className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                {/* Action Links */}
                <div className="space-y-3 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={() => openAuthModal('reset')}
                        className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-medium"
                        disabled={auth.isLoading}
                    >
                        Forgot your password?
                    </button>

                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Don't have an account?{' '}
                        <button
                            onClick={() => openAuthModal('signup')}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            disabled={auth.isLoading}
                        >
                            Sign up
                        </button>
                    </div>
                </div>

                {/* Security Note */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        🔐 Your data is encrypted and secure
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default LoginModal;