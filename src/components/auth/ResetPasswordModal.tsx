// src/components/modals/ResetPasswordModal.tsx
import React, {useCallback, useState} from 'react';
import {ArrowLeft, CheckCircle, Mail, Send, Shield, Zap, Clock} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

// Constants
const EMAIL_PATTERN = /\S+@\S+\.\S+/;

// Types
interface FormErrors {
    email?: string;
}

const ResetPasswordModal: React.FC = () => {
    const {
        modals,
        closeAuthModal,
        openAuthModal,
        resetPassword,
        auth
    } = useAppStore();

    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<FormErrors>({});
    const [isSuccess, setIsSuccess] = useState(false);

    const resetForm = () => {
        setEmail('');
        setErrors({});
        setIsSuccess(false);
    };

    const handleClose = () => {
        resetForm();
        closeAuthModal();
    };

    const validateEmail = (emailValue: string): string => {
        if (!emailValue.trim()) {
            return 'Email is required';
        }
        if (!EMAIL_PATTERN.test(emailValue)) {
            return 'Please enter a valid email address';
        }
        return '';
    };

    const validateForm = (): boolean => {
        const emailError = validateEmail(email);
        const newErrors: FormErrors = {};

        if (emailError) {
            newErrors.email = emailError;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            await resetPassword(email);
            setIsSuccess(true);
        } catch (error) {
            // Error handling is done in the store
        }
    }, [email, resetPassword]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setEmail(value);

        // Clear error when user starts typing
        if (errors.email) {
            setErrors(prev => {
                const newErrors = {...prev};
                delete newErrors.email;
                return newErrors;
            });
        }
    };

    const handleBackToLogin = () => {
        openAuthModal('login');
    };

    const handleTryDifferentEmail = () => {
        setIsSuccess(false);
    };

    const isFormValid = () => {
        return email.trim() !== '';
    };

    return (
        <Modal
            isOpen={modals.auth.resetPasswordOpen}
            onClose={handleClose}
            title=""
            size="xl"
        >
            <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 rounded-t-lg" />
                </div>

                {/* Content */}
                <div className="pt-8 pb-6 px-8">
                    {!isSuccess ? (
                        <>
                            {/* Header Section - Enhanced with modern design */}
                            <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30 mb-8">
                                <div className="text-center py-8">
                                    {/* Enhanced Icon and Title */}
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6 shadow-lg">
                                        <Mail className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                                        Reset Your Password
                                    </h2>
                                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                                        Enter your email address and we'll send you a secure link to reset your password.
                                    </p>
                                    
                                    {/* Enhanced Benefits Section */}
                                    <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <Shield className="h-4 w-4 text-blue-500" />
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">Secure</div>
                                            <div className="text-xs text-gray-600">Link</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <Zap className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">Instant</div>
                                            <div className="text-xs text-gray-600">Delivery</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center mb-2">
                                                <Clock className="h-4 w-4 text-yellow-500" />
                                            </div>
                                            <div className="text-sm font-bold text-gray-900">24hr</div>
                                            <div className="text-xs text-gray-600">Expiry</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Reset Form - Enhanced */}
                            <div className="glass-card mb-8">
                                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                                    {/* Email Field */}
                                    <div className="space-y-2">
                                        <label className="form-label-enhanced">
                                            <Mail className="inline h-4 w-4 mr-2"/>
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={handleInputChange}
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

                                    {/* Error Display */}
                                    {auth.error && (
                                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200/50 dark:border-red-700/50">
                                            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                                {auth.error}
                                            </p>
                                        </div>
                                    )}

                                    {/* Submit Button */}
                                    <button
                                        type="submit"
                                        disabled={auth.isLoading || !isFormValid()}
                                        className="w-full btn btn-primary form-btn group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed min-h-[3.25rem] justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                                    >
                                        {auth.isLoading ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                                Send Reset Link
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        /* Success State - Enhanced */
                        <div className="glass-card bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200/30 dark:border-green-700/30">
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-blue-100 mb-6 shadow-lg">
                                    <CheckCircle className="h-10 w-10 text-green-600" />
                                </div>
                                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                                    Check Your Email
                                </h2>
                                <p className="text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto leading-relaxed">
                                    We've sent a secure password reset link to:
                                </p>
                                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 mb-6 max-w-md mx-auto border border-gray-200/50 dark:border-gray-700/50">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {email}
                                    </p>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                    Didn't receive the email? Check your spam folder or try again
                                </p>

                                <button
                                    onClick={handleTryDifferentEmail}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                                >
                                    Try a different email
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Back to Login - Enhanced */}
                    <div className="glass-card">
                        <div className="p-6">
                            <button
                                onClick={handleBackToLogin}
                                className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                disabled={auth.isLoading}
                            >
                                <ArrowLeft className="h-4 w-4"/>
                                Back to Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ResetPasswordModal;