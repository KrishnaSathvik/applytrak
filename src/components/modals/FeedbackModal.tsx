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
    gradient: string;
}

interface FormValidation {
    message: {
        isValid: boolean;
        error: string;
    };
    email: {
        isValid: boolean;
        error: string;
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

    // Memoized feedback types configuration with enhanced styling
    const feedbackTypes = useMemo<FeedbackType[]>(() => [
        {
            type: 'love',
            icon: Heart,
            label: 'Love it!',
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-700',
            description: 'Share what you love about ApplyTrak',
            gradient: 'from-red-500 to-pink-500'
        },
        {
            type: 'feature',
            icon: Lightbulb,
            label: 'Feature idea',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-700',
            description: 'Suggest new features or improvements',
            gradient: 'from-yellow-500 to-orange-500'
        },
        {
            type: 'bug',
            icon: Bug,
            label: 'Bug report',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-700',
            description: 'Report issues or problems you encountered',
            gradient: 'from-red-600 to-red-700'
        },
        {
            type: 'general',
            icon: MessageSquare,
            label: 'General',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-700',
            description: 'General feedback or questions',
            gradient: 'from-blue-500 to-indigo-500'
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
                    : ''
        };

        const emailValidation = {
            isValid: email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
            error: email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
                ? 'Please enter a valid email address'
                : ''
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
            5: {emoji: '⭐', text: 'Amazing!', color: 'text-yellow-500'},
            4: {emoji: '😊', text: 'Great!', color: 'text-green-500'},
            3: {emoji: '🙂', text: 'Good', color: 'text-blue-500'},
            2: {emoji: '😐', text: 'Okay', color: 'text-orange-500'},
            1: {emoji: '😞', text: 'Needs work', color: 'text-red-500'}
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
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400"/>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                            Feedback Submitted Successfully!
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-lg">
                            Thank you for helping make ApplyTrak better. Your feedback is valuable to us!
                        </p>
                    </div>
                    {email && (
                        <div className="glass-card p-4 border border-green-200 dark:border-green-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                We'll follow up with you at <span className="font-semibold text-green-600 dark:text-green-400">{email}</span> if needed.
                            </p>
                        </div>
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
            <div className="space-y-8">
                {/* Feedback Type Selection */}
                <div>
                    <div className="card-header mb-6">
                        <h3 className="text-xl font-bold text-white tracking-tight">What would you like to share?</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {feedbackTypes.map(({
                                                type,
                                                icon: Icon,
                                                label,
                                                color,
                                                bgColor,
                                                description,
                                                gradient
                                            }, index) => (
                            <button
                                key={type}
                                ref={index === 0 ? firstButtonRef : undefined}
                                type="button"
                                onClick={() => setFeedbackType(type)}
                                className={`
                  glass-card p-6 rounded-2xl border-2 transition-all duration-300 
                  flex flex-col items-center gap-4 text-center group
                  hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20
                  ${feedbackType === type
                                    ? `border-${gradient.split('-')[1]}-300 dark:border-${gradient.split('-')[1]}-600 shadow-lg scale-105`
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:scale-102'
                                }
                `}
                                aria-pressed={feedbackType === type}
                                aria-describedby={`feedback-type-${type}-desc`}
                            >
                                <div className={`
                  w-16 h-16 rounded-full flex items-center justify-center
                  ${feedbackType === type 
                    ? `bg-gradient-to-br ${gradient} text-white shadow-lg` 
                    : `${bgColor} ${color}`
                  }
                  transition-all duration-300 group-hover:scale-110
                `}>
                                    <Icon className="h-8 w-8"/>
                                </div>
                                <div>
                  <span className="text-lg font-bold text-gray-900 dark:text-gray-100 block mb-2">
                    {label}
                  </span>
                                    <span
                                        id={`feedback-type-${type}-desc`}
                                        className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                                    >
                    {description}
                  </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rating */}
                <div className="glass-card p-6">
                    <div className="card-header mb-6">
                        <h3 className="text-xl font-bold text-white tracking-tight">How would you rate ApplyTrak?</h3>
                    </div>
                    <div className="flex gap-2 justify-center mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="transition-all duration-300 hover:scale-125 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:bg-gray-100 dark:hover:bg-gray-800"
                                title={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                                aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                            >
                                <Star
                                    className={`h-10 w-10 transition-all duration-300 ${
                                        star <= rating
                                            ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg'
                                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                    <div className="text-center">
                        <div className="text-4xl mb-3" role="img" aria-label={getRatingLabel(rating).text}>
                            {getRatingLabel(rating).emoji}
                        </div>
                        <p className={`text-xl font-bold ${getRatingLabel(rating).color}`}>
                            {getRatingLabel(rating).text}
                        </p>
                    </div>
                </div>

                {/* Message */}
                <div className="glass-card p-6">
                    <div className="card-header mb-6">
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            Tell us more
                            <span className="text-red-300 ml-1" aria-label="required">*</span>
                        </h3>
                    </div>
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
                form-input-enhanced resize-none transition-all duration-300
                ${!validation.message.isValid && message.length > 0
                    ? 'border-red-500 ring-1 ring-red-500/20'
                    : ''
                }
              `}
                aria-describedby="message-help message-error"
                style={{minHeight: '140px'}}
            />
                        {!validation.message.isValid && validation.message.error && (
                            <div className="absolute inset-y-0 right-4 flex items-start pt-4">
                                <AlertTriangle className="h-5 w-5 text-red-500"/>
                            </div>
                        )}
                    </div>

                    {/* Message validation and character count */}
                    <div className="flex justify-between items-start mt-4 gap-4">
                        <div className="flex-1">
                            {!validation.message.isValid && validation.message.error && (
                                <p id="message-error"
                                   className="text-sm text-red-600 dark:text-red-400 flex items-center">
                                    <AlertTriangle className="h-4 w-4 mr-2"/>
                                    {validation.message.error}
                                </p>
                            )}
                            {validation.message.isValid && message.length >= 10 && (
                                <p id="message-help" className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500"/>
                                    Your feedback helps make ApplyTrak better for everyone!
                                </p>
                            )}
                        </div>
                        <span className={`text-sm font-semibold flex-shrink-0 ${getCharacterCountColor(message.length)}`}>
              {message.length} / 2000
            </span>
                    </div>
                </div>

                {/* Email (Optional) */}
                <div className="glass-card p-6">
                    <div className="card-header mb-6">
                        <h3 className="text-xl font-bold text-white tracking-tight">Email (optional - for follow-up)</h3>
                    </div>
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className={`
                form-input-enhanced transition-all duration-300
                ${!validation.email.isValid
                                ? 'border-red-500 ring-1 ring-red-500/20'
                                : ''
                            }
              `}
                            aria-describedby="email-help email-error"
                        />
                        {!validation.email.isValid && (
                            <div className="absolute inset-y-0 right-4 flex items-center">
                                <AlertTriangle className="h-5 w-5 text-red-500"/>
                            </div>
                        )}
                    </div>

                    {!validation.email.isValid && validation.email.error ? (
                        <p id="email-error" className="text-sm text-red-600 dark:text-red-400 mt-3 flex items-center">
                            <AlertTriangle className="h-4 w-4 mr-2"/>
                            {validation.email.error}
                        </p>
                    ) : (
                        <p id="email-help" className="text-sm text-gray-600 dark:text-gray-400 mt-3 flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2 text-blue-500"/>
                            Leave your email if you'd like us to follow up on your feedback
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !isFormValid}
                        className="
              btn btn-primary form-btn group relative overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
              min-w-[160px] justify-center transition-all duration-300
              focus:outline-none focus:ring-2 focus:ring-blue-500/20
              text-lg font-semibold
            "
                        aria-describedby="submit-help"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"/>
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send
                                    className="h-6 w-6 mr-3 group-hover:translate-x-1 transition-transform duration-300"/>
                                Send Feedback
                            </>
                        )}
                    </button>
                </div>

                {/* Keyboard shortcut hint */}
                {isFormValid && (
                    <p id="submit-help" className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Press Ctrl+Enter (Cmd+Enter on Mac) to submit quickly
                    </p>
                )}

                {/* Privacy Note */}
                <div className="glass-card p-6 border border-blue-200/50 dark:border-blue-700/50">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 dark:text-blue-400 text-lg">🔒</span>
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                                Privacy Friendly
                            </h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                Your feedback is stored locally and helps improve ApplyTrak. We don't collect personal
                                data unless you choose to provide your email for follow-up. All feedback is used solely for
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