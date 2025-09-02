import React from 'react';
import { X, Check, Star, Zap, BarChart3, Database, Users } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    trigger?: 'limit_reached' | 'analytics' | 'general';
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, trigger = 'general' }) => {
    const { applications } = useAppStore();

    if (!isOpen) return null;

    const getModalContent = () => {
        switch (trigger) {
            case 'limit_reached':
                return {
                    title: 'Application Limit Reached!',
                    subtitle: 'You\'ve reached the 50 application limit',
                    description: 'Sign up now to track unlimited applications and unlock powerful features.',
                    icon: <Database className="h-12 w-12 text-blue-600" />,
                    primaryAction: 'Sign Up for Free',
                    secondaryAction: 'Continue with Limited Access'
                };
            case 'analytics':
                return {
                    title: 'Sign Up for Advanced Analytics',
                    subtitle: 'Get deeper insights into your job search',
                    description: 'Access company success rates, salary trends, and detailed performance metrics with cloud sync.',
                    icon: <BarChart3 className="h-12 w-12 text-purple-600" />,
                    primaryAction: 'Sign Up for Free',
                    secondaryAction: 'Maybe Later'
                };
            default:
                return {
                    title: 'Sign Up for Free',
                    subtitle: 'Unlock all features',
                    description: 'Get unlimited applications, advanced analytics, and cloud sync.',
                    icon: <Star className="h-12 w-12 text-yellow-600" />,
                    primaryAction: 'Sign Up for Free',
                    secondaryAction: 'Maybe Later'
                };
        }
    };

    const content = getModalContent();

    const handleSignUp = () => {
        onClose();
        useAppStore.setState(state => ({
            ...state,
            modals: {
                ...state.modals,
                signup: { isOpen: true }
            }
        }));
    };

    const handleSignIn = () => {
        onClose();
        useAppStore.setState(state => ({
            ...state,
            modals: {
                ...state.modals,
                login: { isOpen: true }
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                            {content.icon}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {content.title}
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400">
                                {content.subtitle}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <p className="text-lg text-gray-700 dark:text-gray-300 text-center">
                        {content.description}
                    </p>

                    {/* Current Usage */}
                    {trigger === 'limit_reached' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-blue-800 dark:text-blue-200">
                                        Current Usage
                                    </h3>
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        {applications.length}/50 applications tracked
                                    </p>
                                </div>
                                <div className="text-2xl font-bold text-blue-600">
                                    100%
                                </div>
                            </div>
                            <div className="mt-3 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '100%' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Features */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                            What you'll get with a free account:
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Unlimited applications
                                </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Advanced analytics
                                </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Cloud sync & backup
                                </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Export & import data
                                </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Goal tracking & insights
                                </span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                                    Access from any device
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Benefits */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                            Why sign up?
                        </h3>
                        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                            <div className="flex items-start gap-3">
                                <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                <span><strong>Cloud sync:</strong> Never lose your data with automatic backup and sync across devices</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <BarChart3 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                <span><strong>Advanced analytics:</strong> Get deeper insights into your job search performance</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <Users className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                <span><strong>Multi-device access:</strong> Use ApplyTrak on your phone, tablet, or computer</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 space-y-3">
                    <button
                        onClick={handleSignUp}
                        className="w-full btn btn-primary py-3 text-lg font-semibold"
                    >
                        {content.primaryAction}
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handleSignIn}
                            className="flex-1 btn btn-secondary py-2"
                        >
                            Already have an account? Sign In
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 btn btn-outline py-2"
                        >
                            {content.secondaryAction}
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        Free forever • No credit card required • Cancel anytime
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UpgradeModal;
