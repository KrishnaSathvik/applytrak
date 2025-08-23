import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AlertTriangle, Bug, CheckCircle, Heart, Lightbulb, MessageSquare, Send, Star} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

// Enhanced types for better type safety
interface FeedbackType {
    type: 'bug' | 'feature' | 'general' | 'love';
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
}

interface FormValidation {
    message: {
        isValid: boolean;
        error?: string;
    };
    email: {
        isValid: boolean;
        error?: string;
    };
}

const FeedbackModal: React.FC = () => {
    const {modals, closeFeedbackModal, submitFeedback} = useAppStore();

    // State management
    const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general' | 'love'>(
        modals.feedback.initialType || 'general'
    );
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // Refs for focus management
    const messageTextareaRef = useRef<HTMLTextAreaElement>(null);
    const firstButtonRef = useRef<HTMLButtonElement>(null);

    // Memoized feedback types configuration
    const feedbackTypes = useMemo<FeedbackType[]>(() => [
        {
            type: 'love',
            icon: Heart,
            label: 'Love it!',
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-700',
            description: 'Share what you love about ApplyTrak'
        },
        {
            type: 'feature',
            icon: Lightbulb,
            label: 'Feature idea',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-700',
            description: 'Suggest new features or improvements'
        },
        {
            type: 'bug',
            icon: Bug,
            label: 'Bug report',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-700',
            description: 'Report issues or problems you encountered'
        },
        {
            type: 'general',
            icon: MessageSquare,
            label: 'General',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-700',
            description: 'General feedback or questions'
        }
    ], []);

    // Form validation
    const validation = useMemo<FormValidation>(() => {
        const messageValidation = {
            isValid: message.trim().length >= 10,
            error: message.trim().length === 0
                ? 'Message is required'
                : message.trim().length < 10
                    ? 'Message must be at least 10 characters'
                    : undefined
        };

        const emailValidation = {
            isValid: email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
            error: email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ? 'Please enter a valid email address'
                : undefined
        };

        return {
            message: messageValidation,
            email: emailValidation
        };
    }, [message, email]);

    const isFormValid = validation.message.isValid && validation.email.isValid;

    // Reset form when modal opens
    useEffect(() => {
        if (modals.feedback.isOpen) {
            setFeedbackType(modals.feedback.initialType || 'general');
            setRating(5);
            setMessage('');
            setEmail('');
            setIsSubmitting(false);
            setShowSuccess(false);

            // Focus management
            setTimeout(() => {
                firstButtonRef.current?.focus();
            }, 100);
        }
    }, [modals.feedback.isOpen, modals.feedback.initialType]);

    // Auto-resize textarea
    useEffect(() => {
        if (messageTextareaRef.current) {
            messageTextareaRef.current.style.height = 'auto';
            messageTextareaRef.current.style.height = `${messageTextareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    // Enhanced placeholder text with dynamic content
    const getPlaceholderText = useCallback(() => {
        const baseTexts = {
            bug: {
                primary: "Please describe the bug you encountered in detail...",
                prompts: [
                    "• What were you trying to do?",
                    "• What happened instead of what you expected?",
                    "• Are there any error messages?",
                    "• Can you reproduce this issue consistently?",
                    "• What browser/device are you using?"
                ]
            },
            feature: {
                primary: "What feature would you like to see in ApplyTrak?",
                prompts: [
                    "• How would this feature help your job search?",
                    "• Any specific details or requirements?",
                    "• Have you seen this implemented elsewhere?",
                    "• How urgent/important is this feature to you?"
                ]
            },
            love: {
                primary: "What do you love most about ApplyTrak?",
                prompts: [
                    "• Which features are most helpful to you?",
                    "• How has it improved your job search process?",
                    "• Any specific moments that stood out?",
                    "• What would you tell other job seekers about it?"
                ]
            },
            general: {
                primary: "Share your thoughts about ApplyTrak...",
                prompts: [
                    "• Overall experience and impressions",
                    "• Suggestions for improvement",
                    "• Questions or concerns",
                    "• Any other feedback or ideas"
                ]
            }
        };

        const content = baseTexts[feedbackType];
        return `${content.primary}\n\n${content.prompts.join('\n')}`;
    }, [feedbackType]);

    // Enhanced rating labels
    const getRatingLabel = useCallback((rating: number) => {
        const labels = {
            5: {emoji: '⭐', text: 'Amazing!'},
            4: {emoji: '😊', text: 'Great!'},
            3: {emoji: '🙂', text: 'Good'},
            2: {emoji: '😐', text: 'Okay'},
            1: {emoji: '😞', text: 'Needs work'}
        };
        return labels[rating as keyof typeof labels] || labels[3];
    }, []);

    // Enhanced submit handler
    const handleSubmit = useCallback(async () => {
        if (!isFormValid) {
            // Focus on first invalid field
            if (!validation.message.isValid) {
                messageTextareaRef.current?.focus();
            }
            return;
        }

        setIsSubmitting(true);

        try {
            await submitFeedback(feedbackType, rating, message.trim(), email.trim() || undefined);
            setShowSuccess(true);

            // Close modal after showing success message
            setTimeout(() => {
                closeFeedbackModal();
            }, 2000);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
            // Error handling is typically managed by the store/toast system
        } finally {
            setIsSubmitting(false);
        }
    }, [feedbackType, rating, message, email, submitFeedback, closeFeedbackModal, isFormValid, validation]);

    // Keyboard navigation
    useEffect(() => {
        if (!modals.feedback.isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closeFeedbackModal();
            } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                if (isFormValid && !isSubmitting) {
                    handleSubmit();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [modals.feedback.isOpen, closeFeedbackModal, handleSubmit, isFormValid, isSubmitting]);

    // Character count helper
    const getCharacterCountColor = useCallback((length: number) => {
        if (length > 1800) return 'text-red-500';
        if (length > 1500) return 'text-yellow-500';
        return 'text-gray-500 dark:text-gray-400';
    }, []);

    if (showSuccess) {
        return (
            <Modal
                isOpen={modals.feedback.isOpen}
                onClose={closeFeedbackModal}
                title="Thank You!"
                size="md"
                variant="primary"
            >
                <div className="text-center py-8">
                    <div className="mb-6">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Feedback Submitted Successfully!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            Thank you for helping make ApplyTrak better. Your feedback is valuable to us!
                        </p>
                    </div>
                    {email && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            We'll follow up with you at {email} if needed.
                        </p>
                    )}
                </div>
            </Modal>
        );
    }

    return (
        <Modal
            isOpen={modals.feedback.isOpen}
            onClose={closeFeedbackModal}
            title="Share Your Feedback"
            size="lg"
            variant="primary"
        >
            <div className="space-y-6">
                {/* Feedback Type Selection */}
                <div>
                    <label className="form-label-enhanced mb-4">
                        What would you like to share?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {feedbackTypes.map(({
                                                type,
                                                icon: Icon,
                                                label,
                                                color,
                                                bgColor,
                                                borderColor,
                                                description
                                            }, index) => (
                            <button
                                key={type}
                                ref={index === 0 ? firstButtonRef : undefined}
                                type="button"
                                onClick={() => setFeedbackType(type)}
                                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 
                  flex flex-col items-center gap-3 text-center group
                  hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20
                  ${feedbackType === type
                                    ? `${borderColor} ${bgColor} shadow-md`
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }
                `}
                                aria-pressed={feedbackType === type}
                                aria-describedby={`feedback-type-${type}-desc`}
                            >
                                <Icon
                                    className={`h-6 w-6 ${color} group-hover:scale-110 transition-transform duration-200`}/>
                                <div>
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 block">
                    {label}
                  </span>
                                    <span
                                        id={`feedback-type-${type}-desc`}
                                        className="text-xs text-gray-500 dark:text-gray-400 mt-1 block"
                                    >
                    {description}
                  </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rating */}
                <div>
                    <label className="form-label-enhanced mb-3">
                        How would you rate ApplyTrak?
                    </label>
                    <div className="flex gap-1 justify-center mb-3">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="transition-all duration-200 hover:scale-125 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                            >
                                <Star
                                    className={`h-8 w-8 transition-colors duration-200 ${
                                        star <= rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="text-center">
            <span className="text-2xl" role="img" aria-label={getRatingLabel(rating).text}>
              {getRatingLabel(rating).emoji}
            </span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {getRatingLabel(rating).text}
                        </p>
                    </div>
                </div>

                {/* Message */}
                <div>
                    <label className="form-label-enhanced mb-3">
                        Tell us more
                        <span className="text-red-500 ml-1" aria-label="required">*</span>
                    </label>
                    <div className="relative">
            <textarea
                ref={messageTextareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={getPlaceholderText()}
                rows={6}
                maxLength={2000}
                required
                className={`
                form-input-enhanced resize-none transition-all duration-200
                ${!validation.message.isValid && message.length > 0
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : ''
                }
              `}
                aria-describedby="message-help message-error"
                style={{minHeight: '120px'}}
            />
                        {!validation.message.isValid && validation.message.error && (
                            <div className="absolute inset-y-0 right-3 flex items-start pt-3">
                                <AlertTriangle className="h-4 w-4 text-red-500"/>
                            </div>
                        )}
                    </div>

                    {/* Message validation and character count */}
                    <div className="flex justify-between items-start mt-2 gap-2">
                        <div className="flex-1">
                            {!validation.message.isValid && validation.message.error && (
                                <p id="message-error"
                                   className="text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <AlertTriangle className="h-3 w-3 mr-1"/>
                                    {validation.message.error}
                                </p>
                            )}
                            {validation.message.isValid && message.length >= 10 && (
                                <p id="message-help" className="text-xs text-gray-500 dark:text-gray-400">
                                    Your feedback helps make ApplyTrak better for everyone!
                                </p>
                            )}
                        </div>
                        <span className={`text-xs font-medium flex-shrink-0 ${getCharacterCountColor(message.length)}`}>
              {message.length} / 2000
            </span>
                    </div>
                </div>

                {/* Email (Optional) */}
                <div>
                    <label className="form-label-enhanced mb-3">
                        Email (optional - for follow-up)
                    </label>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={`
                form-input-enhanced transition-all duration-200
                ${!validation.email.isValid
                                ? 'border-red-500 ring-1 ring-red-500/20'
                                : ''
                            }
              `}
                            aria-describedby="email-help email-error"
                        />
                        {!validation.email.isValid && (
                            <div className="absolute inset-y-0 right-3 flex items-center">
                                <AlertTriangle className="h-4 w-4 text-red-500"/>
                            </div>
                        )}
                    </div>

                    {!validation.email.isValid && validation.email.error ? (
                        <p id="email-error" className="text-sm text-red-600 dark:text-red-400 mt-2 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1"/>
                            {validation.email.error}
                        </p>
                    ) : (
                        <p id="email-help" className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Leave your email if you'd like us to follow up on your feedback
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isFormValid}
                        className="
              btn btn-primary form-btn group relative overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
              min-w-[140px] justify-center transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
            "
                        aria-describedby="submit-help"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send
                                    className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform duration-200"/>
                                Send Feedback
                            </>
                        )}
                    </button>
                </div>

                {/* Keyboard shortcut hint */}
                {isFormValid && (
                    <p id="submit-help" className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Press Ctrl+Enter (Cmd+Enter on Mac) to submit quickly
                    </p>
                )}

                {/* Privacy Note */}
                <div
                    className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-start gap-3">
                        <div
                            className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-blue-600 dark:text-blue-400 text-xs">🔒</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                Privacy Friendly
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
                                Your feedback is stored locally and helps improve ApplyTrak. We don't collect personal
                                data
                                unless you choose to provide your email for follow-up. All feedback is used solely for
                                product improvement purposes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default FeedbackModal;