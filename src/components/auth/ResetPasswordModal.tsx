import React, {useCallback, useState} from 'react';
import {ArrowLeft, CheckCircle, Mail, Send} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

const ResetPasswordModal: React.FC = () => {
    const {
        modals,
        closeAuthModal,
        openAuthModal,
        resetPassword,
        auth
    } = useAppStore();

    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);

    const handleClose = () => {
        setEmail('');
        setErrors({});
        setIsSuccess(false);
        closeAuthModal();
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
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
        setEmail(e.target.value);
        // Clear error when user starts typing
        if (errors.email) {
            setErrors(prev => ({...prev, email: ''}));
        }
    };

    return (
        <Modal
            isOpen={modals.auth.resetPasswordOpen}
            onClose={handleClose}
            title="Reset Password"
            size="sm"
            variant="primary"
        >
            <div className="space-y-6">
                {!isSuccess ? (
                    <>
                        {/* Header */}
                        <div className="text-center">
                            <div
                                className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                                <Mail className="h-8 w-8 text-white"/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Reset Your Password
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Enter your email address and we'll send you a link to reset your password
                            </p>
                        </div>

                        {/* Reset Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                disabled={auth.isLoading || !email}
                                className="
                                    w-full btn btn-primary form-btn group relative overflow-hidden
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    min-h-[3.25rem] justify-center
                                "
                            >
                                {auth.isLoading ? (
                                    <>
                                        <div
                                            className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send
                                            className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200"/>
                                        Send Reset Link
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    /* Success State */
                    <div className="text-center">
                        <div
                            className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <CheckCircle className="h-8 w-8 text-white"/>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            Check Your Email
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                            We've sent a password reset link to:
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-6">
                            {email}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                            Didn't receive the email? Check your spam folder or try again
                        </p>

                        <button
                            onClick={() => setIsSuccess(false)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                        >
                            Try a different email
                        </button>
                    </div>
                )}

                {/* Back to Login */}
                <div className="pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={() => openAuthModal('login')}
                        className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        disabled={auth.isLoading}
                    >
                        <ArrowLeft className="h-4 w-4"/>
                        Back to Sign In
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ResetPasswordModal;