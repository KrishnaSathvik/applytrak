import React, {useCallback, useState} from 'react';
import {Eye, EyeOff, Lock, Mail, Monitor, Smartphone, User, UserPlus, Zap} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

const SignupModal: React.FC = () => {
    const {
        modals,
        closeAuthModal,
        openAuthModal,
        signUp,
        auth
    } = useAppStore();

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleClose = () => {
        setFormData({displayName: '', email: '', password: '', confirmPassword: ''});
        setShowPassword(false);
        setShowConfirmPassword(false);
        setErrors({});
        closeAuthModal();
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.displayName.trim()) {
            newErrors.displayName = 'Display name is required';
        } else if (formData.displayName.trim().length < 2) {
            newErrors.displayName = 'Display name must be at least 2 characters';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain uppercase, lowercase, and number';
        }

        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            await signUp(formData.email, formData.password, formData.displayName);
        } catch (error) {
            // Error handling is done in the store
        }
    }, [formData, signUp]);

    const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({...prev, [field]: e.target.value}));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({...prev, [field]: ''}));
        }
    };

    const getPasswordStrength = () => {
        const password = formData.password;
        if (!password) return {score: 0, label: '', color: ''};

        let score = 0;
        if (password.length >= 8) score += 25;
        if (/[a-z]/.test(password)) score += 25;
        if (/[A-Z]/.test(password)) score += 25;
        if (/\d/.test(password)) score += 25;

        if (score < 50) return {score, label: 'Weak', color: 'bg-red-500'};
        if (score < 75) return {score, label: 'Fair', color: 'bg-yellow-500'};
        if (score < 100) return {score, label: 'Good', color: 'bg-blue-500'};
        return {score, label: 'Strong', color: 'bg-green-500'};
    };

    const passwordStrength = getPasswordStrength();

    return (
        <Modal
            isOpen={modals.auth.signupOpen}
            onClose={handleClose}
            title="Create Account"
            size="sm"
            variant="primary"
        >
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="text-center">
                    <div
                        className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <UserPlus className="h-8 w-8 text-white"/>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        Join ApplyTrak
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Start tracking your job applications with cloud sync
                    </p>
                </div>

                {/* Benefits Banner */}
                <div
                    className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
                    <div className="text-center">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                            ✨ What you'll get:
                        </p>
                        <div
                            className="flex items-center justify-center gap-4 text-xs text-green-700 dark:text-green-300">
                            <div className="flex items-center gap-1">
                                <Smartphone className="h-3 w-3"/>
                                <span>Mobile & Desktop</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Monitor className="h-3 w-3"/>
                                <span>Cloud Backup</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Zap className="h-3 w-3"/>
                                <span>Real-time Sync</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Display Name Field */}
                    <div className="space-y-2">
                        <label className="form-label-enhanced">
                            <User className="inline h-4 w-4 mr-2"/>
                            Display Name
                        </label>
                        <input
                            type="text"
                            value={formData.displayName}
                            onChange={handleInputChange('displayName')}
                            placeholder="Your name"
                            className={`form-input-enhanced ${errors.displayName ? 'border-red-500 focus:border-red-500' : ''}`}
                            disabled={auth.isLoading}
                            autoComplete="name"
                            autoFocus
                        />
                        {errors.displayName && (
                            <p className="form-error">{errors.displayName}</p>
                        )}
                    </div>

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
                            placeholder="you@example.com"
                            className={`form-input-enhanced ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                            disabled={auth.isLoading}
                            autoComplete="email"
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
                                placeholder="Create a strong password"
                                className={`form-input-enhanced pr-12 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                disabled={auth.isLoading}
                                autoComplete="new-password"
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

                        {/* Password Strength Indicator */}
                        {formData.password && (
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Password strength:</span>
                                    <span className={`text-xs font-medium ${
                                        passwordStrength.score < 50 ? 'text-red-600' :
                                            passwordStrength.score < 75 ? 'text-yellow-600' :
                                                passwordStrength.score < 100 ? 'text-blue-600' : 'text-green-600'
                                    }`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                                        style={{width: `${passwordStrength.score}%`}}
                                    />
                                </div>
                            </div>
                        )}

                        {errors.password && (
                            <p className="form-error">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-2">
                        <label className="form-label-enhanced">
                            <Lock className="inline h-4 w-4 mr-2"/>
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={formData.confirmPassword}
                                onChange={handleInputChange('confirmPassword')}
                                placeholder="Confirm your password"
                                className={`form-input-enhanced pr-12 ${errors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                disabled={auth.isLoading}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                disabled={auth.isLoading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5"/>
                                ) : (
                                    <Eye className="h-5 w-5"/>
                                )}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="form-error">{errors.confirmPassword}</p>
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
                        disabled={auth.isLoading || !formData.email || !formData.password || !formData.confirmPassword}
                        className="
                            w-full btn btn-primary form-btn group relative overflow-hidden
                            disabled:opacity-50 disabled:cursor-not-allowed
                            min-h-[3.25rem] justify-center
                        "
                    >
                        {auth.isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                Creating account...
                            </>
                        ) : (
                            <>
                                <UserPlus
                                    className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                {/* Action Links */}
                <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                            onClick={() => openAuthModal('login')}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            disabled={auth.isLoading}
                        >
                            Sign in
                        </button>
                    </div>
                </div>

                {/* Terms Note */}
                <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        By creating an account, you agree to our Terms of Service and Privacy Policy
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default SignupModal;