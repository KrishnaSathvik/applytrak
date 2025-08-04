// src/components/modals/FeedbackModal.tsx - User Feedback Collection Modal
import React, {useCallback, useState} from 'react';
import {Bug, Heart, Lightbulb, MessageSquare, Send, Star} from 'lucide-react';
import {Modal} from '../ui/Modal';
import {useAppStore} from '../../store/useAppStore';

const FeedbackModal: React.FC = () => {
    const {modals, closeFeedbackModal, submitFeedback} = useAppStore();
    const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general' | 'love'>(
        modals.feedback.initialType || 'general'
    );
    const [rating, setRating] = useState(5);
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form when modal opens
    React.useEffect(() => {
        if (modals.feedback.isOpen) {
            setFeedbackType(modals.feedback.initialType || 'general');
            setRating(5);
            setMessage('');
            setEmail('');
            setIsSubmitting(false);
        }
    }, [modals.feedback.isOpen, modals.feedback.initialType]);

    const handleSubmit = useCallback(async () => {
        if (!message.trim()) return;

        setIsSubmitting(true);

        try {
            await submitFeedback(feedbackType, rating, message, email || undefined);
            // Modal will be closed by the store action
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [feedbackType, rating, message, email, submitFeedback]);

    const feedbackTypes = [
        {
            type: 'love' as const,
            icon: Heart,
            label: 'Love it!',
            color: 'text-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-700'
        },
        {
            type: 'feature' as const,
            icon: Lightbulb,
            label: 'Feature idea',
            color: 'text-yellow-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            borderColor: 'border-yellow-200 dark:border-yellow-700'
        },
        {
            type: 'bug' as const,
            icon: Bug,
            label: 'Bug report',
            color: 'text-red-600',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            borderColor: 'border-red-200 dark:border-red-700'
        },
        {
            type: 'general' as const,
            icon: MessageSquare,
            label: 'General',
            color: 'text-blue-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-700'
        }
    ];

    const getPlaceholderText = () => {
        switch (feedbackType) {
            case 'bug':
                return "Please describe the bug you encountered...\n\n• What were you trying to do?\n• What happened instead?\n• Any error messages?\n• Steps to reproduce the issue";
            case 'feature':
                return "What feature would you like to see?\n\n• How would this feature help you?\n• Any specific details or requirements?\n• Have you seen this implemented elsewhere?";
            case 'love':
                return "What do you love about ApplyTrak?\n\n• Which features are most helpful?\n• How has it improved your job search?\n• Any specific moments of delight?";
            case 'general':
            default:
                return "Share your thoughts about ApplyTrak...\n\n• Overall experience\n• Suggestions for improvement\n• Questions or concerns\n• Any other feedback";
        }
    };

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
                    <div className="grid grid-cols-2 gap-3">
                        {feedbackTypes.map(({type, icon: Icon, label, color, bgColor, borderColor}) => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setFeedbackType(type)}
                                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 
                  flex flex-col items-center gap-3 text-center group
                  ${feedbackType === type
                                    ? `${borderColor} ${bgColor}`
                                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                }
                `}
                            >
                                <Icon
                                    className={`h-6 w-6 ${color} group-hover:scale-110 transition-transform duration-200`}/>
                                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {label}
                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Rating */}
                <div>
                    <label className="form-label-enhanced mb-3">
                        How would you rate ApplyTrak?
                    </label>
                    <div className="flex gap-2 justify-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="transition-all duration-200 hover:scale-125 p-1"
                                title={`${star} star${star !== 1 ? 's' : ''}`}
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
                    <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {rating === 5 ? '⭐ Amazing!' :
                            rating === 4 ? '😊 Great!' :
                                rating === 3 ? '🙂 Good' :
                                    rating === 2 ? '😐 Okay' :
                                        '😞 Needs work'}
                    </p>
                </div>

                {/* Message */}
                <div>
                    <label className="form-label-enhanced mb-3">
                        Tell us more
                    </label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={getPlaceholderText()}
                        rows={6}
                        className="form-input-enhanced resize-none"
                        maxLength={2000}
                        required
                    />
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Your feedback helps make ApplyTrak better for everyone! 🚀
                        </p>
                        <span className={`text-xs font-medium ${
                            message.length > 1800 ? 'text-red-500' :
                                message.length > 1500 ? 'text-yellow-500' :
                                    'text-gray-500 dark:text-gray-400'
                        }`}>
              {message.length} / 2000
            </span>
                    </div>
                </div>

                {/* Email (Optional) */}
                <div>
                    <label className="form-label-enhanced mb-3">
                        Email (optional - for follow-up)
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="form-input-enhanced"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        💡 Leave your email if you'd like us to follow up on your feedback
                    </p>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !message.trim()}
                        className="
              btn btn-primary form-btn group relative overflow-hidden
              disabled:opacity-50 disabled:cursor-not-allowed
              min-w-[140px] justify-center
            "
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
                                unless you choose to provide your email for follow-up.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default FeedbackModal;