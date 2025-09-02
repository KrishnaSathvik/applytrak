// src/components/modals/SignupModal.tsx
import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { PrivacyConsents } from '../../store/useAppStore';
import { useAppStore } from '../../store/useAppStore';
import PrivacyConsentSection from '../auth/PrivacyConsentSection';
import LegalModal from '../modals/LegalModal';
import EmailVerificationModal from './EmailVerificationModal';
import { privacyService } from '../../services/privacyService';
import { supabase } from '../../services/databaseService'; // ⬅ adjust if your client lives elsewhere

// ===================== Types =====================
interface FormData {
    displayName: string;
    email: string;
    password: string;
    confirmPassword: string;
}
interface FormErrors {
    displayName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
}
interface PasswordStrength {
    score: number; label: string; color: string;
}

// ===================== Constants =====================
const PASSWORD_REQUIREMENTS = {
    MIN_LENGTH: 8,
    PATTERNS: { LOWERCASE: /[a-z]/, UPPERCASE: /[A-Z]/, DIGIT: /\d/ },
};
const EMAIL_PATTERN = /\S+@\S+\.\S+/;
const MIN_NAME_LENGTH = 2;

// ===================== Helpers =====================

// Removed unused functions

// ===================== Component =====================
const SignupModal: React.FC = () => {
    const { modals, closeAuthModal, openAuthModal, signUp, auth } = useAppStore();

    const [formData, setFormData] = useState<FormData>({ displayName: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [privacyConsents, setPrivacyConsents] = useState<PrivacyConsents>({ required: false, cloudSync: false, analytics: true, marketing: false });

    const [legal, setLegal] = useState<{ open: boolean; kind: 'terms' | 'privacy' }>({ open: false, kind: 'terms' });
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [signupEmail, setSignupEmail] = useState('');
    const openTerms = () => setLegal({ open: true, kind: 'terms' });
    const openPrivacy = () => setLegal({ open: true, kind: 'privacy' });
    const closeLegal = () => setLegal(s => ({ ...s, open: false }));

    const resetForm = () => {
        setFormData({ displayName: '', email: '', password: '', confirmPassword: '' });
        setShowPassword(false); setShowConfirmPassword(false); setErrors({});
        setPrivacyConsents({ required: false, cloudSync: false, analytics: true, marketing: false });
    };
    const handleClose = () => { resetForm(); closeAuthModal(); };

    // ---------- Field handlers ----------
    const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value; 
        setFormData(p => ({ ...p, displayName: value })); 
        if (errors.displayName) {
            setErrors(p => {
                const newErrors = {...p};
                delete newErrors.displayName;
                return newErrors;
            });
        }
    };
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value; 
        setFormData(p => ({ ...p, email: value })); 
        if (errors.email) {
            setErrors(p => {
                const newErrors = {...p};
                delete newErrors.email;
                return newErrors;
            });
        }
    };
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value; 
        setFormData(p => ({ ...p, password: value })); 
        if (errors.password) {
            setErrors(p => {
                const newErrors = {...p};
                delete newErrors.password;
                return newErrors;
            });
        }
    };
    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value; 
        setFormData(p => ({ ...p, confirmPassword: value })); 
        if (errors.confirmPassword) {
            setErrors(p => {
                const newErrors = {...p};
                delete newErrors.confirmPassword;
                return newErrors;
            });
        }
    };

    // ---------- Validation ----------
    const validateField = (field: keyof FormData, value: string): string => {
        switch (field) {
            case 'displayName':
                if (!value.trim()) return 'Display name is required';
                if (value.trim().length < MIN_NAME_LENGTH) return 'Display name must be at least 2 characters';
                return '';
            case 'email':
                if (!value.trim()) return 'Email is required';
                if (!EMAIL_PATTERN.test(value)) return 'Please enter a valid email address';
                return '';
            case 'password':
                if (!value) return 'Password is required';
                if (value.length < PASSWORD_REQUIREMENTS.MIN_LENGTH) return 'Password must be at least 8 characters';
                if (!PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(value) || !PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(value) || !PASSWORD_REQUIREMENTS.PATTERNS.DIGIT.test(value))
                    return 'Password must contain uppercase, lowercase, and a number';
                return '';
            case 'confirmPassword':
                if (!value) return 'Please confirm your password';
                if (value !== formData.password) return 'Passwords do not match';
                return '';
            default: return '';
        }
    };

    const getPasswordStrength = (password: string): PasswordStrength => {
        let score = 0;
        if (password.length >= PASSWORD_REQUIREMENTS.MIN_LENGTH) score++;
        if (PASSWORD_REQUIREMENTS.PATTERNS.LOWERCASE.test(password)) score++;
        if (PASSWORD_REQUIREMENTS.PATTERNS.UPPERCASE.test(password)) score++;
        if (PASSWORD_REQUIREMENTS.PATTERNS.DIGIT.test(password)) score++;
        if (password.length >= 12) score++;
        if (/[^A-Za-z0-9]/.test(password)) score++;
        if (score <= 2) return { score, label: 'Weak',  color: 'text-red-600' };
        if (score <= 4) return { score, label: 'Good',  color: 'text-yellow-600' };
        return               { score, label: 'Strong', color: 'text-green-600' };
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};
        (Object.keys(formData) as (keyof FormData)[]).forEach((field) => {
            const err = validateField(field, formData[field]);
            if (err) newErrors[field] = err;
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isFormValid = (): boolean =>
        !!(formData.displayName.trim() && formData.email && formData.password && formData.confirmPassword && privacyConsents.required && privacyConsents.cloudSync);

    // ---------- Submit ----------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        if (!privacyConsents.required || !privacyConsents.cloudSync) return;

        try {
            const { user } = await signUp(
                formData.email,
                formData.password,
                formData.displayName,
                { required: privacyConsents.required, cloudSync: privacyConsents.cloudSync, analytics: privacyConsents.analytics, marketing: false }
            );

            if (user) {
                // Debug: Log the user object to see what we're getting
                console.log('Signup user object:', user);
                console.log('User ID:', (user as any)?.id);
                console.log('User external_id:', (user as any)?.external_id);
                console.log('User ID type:', typeof (user as any)?.id);
                console.log('User ID length:', (user as any)?.id?.length);
                
                // Supabase Auth UID — we map this to public.users.external_id
                const authUid: string | undefined = (user as any)?.id ?? (user as any)?.external_id ?? undefined;

                // Fire-and-forget non-blocking effects
                const sideEffects: Promise<any>[] = [
                    // Welcome email will be sent after email verification is completed
                ];

                // Let the database trigger handle user creation automatically
                try {
                    if (!authUid) throw new Error('Missing auth UID after signup');

                    // Wait a moment for the trigger to create the user record
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Save initial privacy settings and enable analytics (service will resolve bigint user_id internally)
                    // Make this non-blocking to avoid signup failures
                    sideEffects.push(
                        privacyService.saveInitialPrivacySettings(authUid, privacyConsents.cloudSync, privacyConsents.analytics)
                            .then(async () => {
                                // Update the user's display name if provided (after privacy settings are saved)
                                if (formData.displayName && formData.displayName.trim()) {
                                    try {
                                        if (!supabase) throw new Error('Supabase client not initialized');
                                        const { error: updateError } = await supabase.rpc('update_user_display_name', {
                                            user_external_id: authUid,
                                            new_display_name: formData.displayName.trim()
                                        });
                                        if (updateError) {
                                            console.warn('Failed to update display name:', updateError);
                                        } else {
                                            console.log('Display name updated successfully');
                                        }
                                    } catch (error) {
                                        console.warn('Failed to update display name:', error);
                                    }
                                }

                                // Enable analytics if user consented
                                if (privacyConsents.analytics) {
                                    try {
                                        const { analyticsService } = await import('../../services/analyticsService');
                                        await analyticsService.enableAnalytics({ trackingLevel: 'standard' });
                                        console.log('Analytics enabled for new user');
                                    } catch (error) {
                                        console.warn('Failed to enable analytics:', error);
                                    }
                                }
                            })
                            .catch(error => {
                                console.warn('Failed to save initial privacy settings:', error);
                                // Don't throw - this shouldn't block signup
                            })
                    );
                } catch (dbErr) {
                    console.error('post-signup profile/consent setup failed', dbErr);
                }

                await Promise.allSettled(sideEffects);
                
                // Show email verification modal instead of closing
                setSignupEmail(formData.email);
                setShowEmailVerification(true);
            }
        } catch {
            // surfaced via auth.error
        }
    };

    const passwordStrength = getPasswordStrength(formData.password);

    // ===================== UI =====================
    return (
        <Modal isOpen={modals.auth?.signupOpen || false} onClose={handleClose} title="" size="md" fullscreenOnMobile={true}>
            <div className="relative">
                {/* Progress Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 rounded-t-lg" />
                </div>

                {/* Content */}
                <div className="pt-6 pb-6 px-6">
                    {/* Header Section - Compact */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-4 shadow-lg">
                            <UserPlus className="h-8 w-8 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Create Account
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Start tracking your job applications
                        </p>
                    </div>

                    {/* Signup Form - Compact */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Display Name */}
                        <div className="space-y-2">
                            <label className="form-label-enhanced">
                                <User className="inline h-4 w-4 mr-2" />
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={formData.displayName}
                                onChange={handleDisplayNameChange}
                                placeholder="Your preferred name"
                                className={`form-input-enhanced ${errors.displayName ? 'border-red-500 focus:border-red-500' : ''}`}
                                disabled={auth.isLoading}
                                autoComplete="name"
                                autoFocus
                            />
                            {errors.displayName && <p className="form-error">{errors.displayName}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="form-label-enhanced">
                                <Mail className="inline h-4 w-4 mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={handleEmailChange}
                                placeholder="you@example.com"
                                className={`form-input-enhanced ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                                disabled={auth.isLoading}
                                autoComplete="email"
                            />
                            {errors.email && <p className="form-error">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="form-label-enhanced">
                                <Lock className="inline h-4 w-4 mr-2" />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handlePasswordChange}
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
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>

                            {/* Strength */}
                            {formData.password && (
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                passwordStrength.score <= 2 ? 'bg-red-500' : passwordStrength.score <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}
                                            style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                                        />
                                    </div>
                                    <span className={`font-medium ${passwordStrength.color}`}>{passwordStrength.label}</span>
                                </div>
                            )}
                            {errors.password && <p className="form-error">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <label className="form-label-enhanced">
                                <Lock className="inline h-4 w-4 mr-2" />
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleConfirmPasswordChange}
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
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="form-error">{errors.confirmPassword}</p>}
                        </div>

                        {/* Privacy Consents */}
                        <PrivacyConsentSection
                            value={privacyConsents}
                            onChange={setPrivacyConsents}
                            disabled={auth.isLoading}
                            onViewTerms={openTerms}
                            onViewPrivacy={openPrivacy}
                        />

                        {/* Auth Error */}
                        {auth.error && (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200/50 dark:border-red-700/50">
                                <p className="text-sm text-red-700 dark:text-red-300 font-medium">{auth.error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={auth.isLoading || !isFormValid()}
                            className="w-full btn btn-primary form-btn group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed min-h-[3.25rem] justify-center bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
                        >
                            {auth.isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-200" />
                                    Create Account
                                </>
                            )}
                        </button>
                    </form>

                    {/* Action Links - Compact */}
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
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

                {/* Legal modal */}
                <LegalModal isOpen={legal.open} kind={legal.kind} onClose={closeLegal} />
                
                {/* Email Verification Modal */}
                <EmailVerificationModal
                    isOpen={showEmailVerification}
                    onClose={() => {
                        setShowEmailVerification(false);
                        // Don't close the signup modal here - let verification complete handle it
                    }}
                    email={signupEmail}
                    onVerificationComplete={() => {
                        setShowEmailVerification(false);
                        handleClose(); // Close the signup modal after verification
                    }}
                />
            </div>
        </Modal>
    );
};

export default SignupModal;
