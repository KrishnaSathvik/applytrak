// src/components/auth/EmailVerificationModal.tsx
import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../services/databaseService';

// ===================== Constants =====================
const FUNCTIONS_BASE = process.env.REACT_APP_FUNCTIONS_BASE || 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1';

// ===================== Helpers =====================
async function sendWelcomeEmail(email: string, name?: string) {
    try {
        if (!FUNCTIONS_BASE) {
            console.warn('FUNCTIONS_BASE not configured, skipping welcome email');
            return;
        }
        
        console.log('Sending welcome email to:', email);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        
        const response = await fetch(`${FUNCTIONS_BASE}/welcome-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name }),
            signal: controller.signal
        });
        
        clearTimeout(timer);
        
        if (response.ok) {
            console.log('Welcome email sent successfully');
        } else {
            console.warn('Failed to send welcome email:', response.status, response.statusText);
        }
    } catch (error) {
        console.warn('Error sending welcome email:', error);
    }
}

interface EmailVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    email: string;
    onVerificationComplete: () => void;
}

const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
    isOpen,
    onClose,
    email,
    onVerificationComplete
}) => {
    const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verifying' | 'verified' | 'failed'>('pending');
    const [error, setError] = useState<string | null>(null);
    const [resendCountdown, setResendCountdown] = useState(0);
    const { showToast } = useAppStore();

    // Listen for auth state changes to detect email verification
    useEffect(() => {
        if (!isOpen || verificationStatus === 'verified') return;

        if (!supabase) return;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change in verification modal:', event, session?.user?.email);
            
            if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
                console.log('Email verified! User signed in automatically');
                setVerificationStatus('verified');
                await handleVerificationComplete();
            } else if (event === 'TOKEN_REFRESHED' && session?.user?.email_confirmed_at) {
                console.log('Email verified via token refresh! User signed in automatically');
                setVerificationStatus('verified');
                await handleVerificationComplete();
            }
        });

        return () => subscription.unsubscribe();
    }, [isOpen, verificationStatus]);

    // Resend countdown timer
    useEffect(() => {
        if (resendCountdown > 0) {
            const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [resendCountdown]);

    // Periodic check for email verification (in case auth state change doesn't fire)
    useEffect(() => {
        if (!isOpen || verificationStatus === 'verified') return;

        const checkVerificationStatus = async () => {
            if (!supabase) return;
            
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.email_confirmed_at && session.user.email === email) {
                    console.log('Email verification detected via periodic check');
                    setVerificationStatus('verified');
                    await handleVerificationComplete();
                }
            } catch (error) {
                console.warn('Error checking verification status:', error);
            }
        };

        // Check immediately
        checkVerificationStatus();

        // Then check every 3 seconds
        const interval = setInterval(checkVerificationStatus, 3000);
        
        return () => clearInterval(interval);
    }, [isOpen, verificationStatus, email]);

    const handleVerificationComplete = async () => {
        try {
            showToast({
                type: 'success',
                message: 'Email verified! Welcome to ApplyTrak! 🎉',
                duration: 5000
            });

            // Sync local applications to cloud after email verification
            try {
                const { syncLocalApplicationsToCloud } = useAppStore.getState();
                await syncLocalApplicationsToCloud();
            } catch (error) {
                console.error('Failed to sync local applications:', error);
            }

            // Send welcome email after successful email verification
            try {
                const { auth } = useAppStore.getState();
                const userDisplayName = auth.user?.display_name || undefined;
                await sendWelcomeEmail(email, userDisplayName);
            } catch (error) {
                console.error('Failed to send welcome email:', error);
            }

            // Close modal and complete verification
            onVerificationComplete();
            onClose();
        } catch (error) {
            console.error('Error in verification complete:', error);
            // Still close modal even if there's an error
            onVerificationComplete();
            onClose();
        }
    };

    const handleResendEmail = async () => {
        try {
            setVerificationStatus('verifying');
            setError(null);

            if (!supabase) throw new Error('Supabase client not initialized');
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email
            });

            if (error) {
                throw error;
            }

            setResendCountdown(60); // 60 second countdown
            showToast({
                type: 'success',
                message: 'Verification email resent! Check your inbox.',
                duration: 4000
            });
        } catch (error: any) {
            setError(error.message || 'Failed to resend verification email');
            setVerificationStatus('failed');
        } finally {
            setVerificationStatus('pending');
        }
    };

    const handleManualVerification = async () => {
        try {
            setVerificationStatus('verifying');
            setError(null);

            // Check if user is now verified
            if (!supabase) throw new Error('Supabase client not initialized');
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user?.email_confirmed_at && session.user.email === email) {
                console.log('Manual verification check: Email confirmed!');
                setVerificationStatus('verified');
                await handleVerificationComplete();
            } else {
                setError('Email not yet verified. Please check your inbox and click the verification link.');
                setVerificationStatus('failed');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to check verification status');
            setVerificationStatus('failed');
        } finally {
            setVerificationStatus('pending');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Verify Your Email" size="sm">
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-4">
                        <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Check Your Email
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                        We've sent a verification link to <strong>{email}</strong>
                    </p>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start space-x-3">
                        <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-800 dark:text-blue-200">
                            <p className="font-medium mb-1">Next steps:</p>
                            <ol className="list-decimal list-inside space-y-1">
                                <li>Check your email inbox (and spam folder)</li>
                                <li>Click the verification link in the email</li>
                                <li>Return here and click "I've Verified My Email"</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-700">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleManualVerification}
                        disabled={verificationStatus === 'verifying'}
                        className="w-full btn btn-primary form-btn flex items-center justify-center space-x-2"
                    >
                        {verificationStatus === 'verifying' ? (
                            <>
                                <RefreshCw className="h-5 w-5 animate-spin" />
                                <span>Checking...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-5 w-5" />
                                <span>I've Verified My Email</span>
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleResendEmail}
                        disabled={resendCountdown > 0 || verificationStatus === 'verifying'}
                        className="w-full btn btn-secondary form-btn"
                    >
                        {resendCountdown > 0 
                            ? `Resend in ${resendCountdown}s` 
                            : 'Resend Verification Email'
                        }
                    </button>
                </div>

                {/* Help Text */}
                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>Didn't receive the email? Check your spam folder or try resending.</p>
                </div>
            </div>
        </Modal>
    );
};

export default EmailVerificationModal;
