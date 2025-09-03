// src/components/layout/Footer.tsx
import React, {useMemo} from 'react';
import {Github, Heart, Mail, MessageSquare} from 'lucide-react';

import {useAppStore} from '../../store/useAppStore';

const Footer: React.FC = () => {
    const {
        openFeedbackModal,
        modals: modalState
    } = useAppStore();

    const currentYear = new Date().getFullYear();

    // Check if any modal is open
    const isModalOpen = useMemo(() => {
        return modalState?.goalSetting?.isOpen ||
            modalState?.milestone?.isOpen ||
            modalState?.recovery?.isOpen ||
            modalState?.feedback?.isOpen ||
            modalState?.adminLogin?.isOpen ||
            modalState?.privacySettings?.isOpen ||
            modalState?.editApplication?.isOpen;
    }, [modalState]);

    const handleFeedbackClick = () => {
        openFeedbackModal?.('general');
    };

    // Don't render footer if modal is open
    if (isModalOpen) {
        return null;
    }

    return (
        <footer className="mt-12 relative hidden md:block">
            {/* Background with gradient and glass effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/60 to-blue-50/80 dark:from-gray-800/80 dark:via-gray-900/60 dark:to-gray-800/80 backdrop-blur-sm border-t border-blue-200/30 dark:border-gray-700/30"></div>
            
            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    
                    {/* Left: Brand Section */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>© {currentYear} ApplyTrak</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                Made with <Heart className="h-3 w-3 text-red-500 fill-current"/> for job seekers
                            </span>
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleFeedbackClick}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200/50 dark:border-gray-700/50 rounded-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-sm backdrop-blur-sm"
                            aria-label="Send feedback"
                        >
                            <MessageSquare className="h-4 w-4"/>
                            <span>Feedback</span>
                        </button>

                        <a
                            href="https://github.com/KrishnaSathvik/applytrak-showcase"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200/50 dark:border-gray-700/50 rounded-lg transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm backdrop-blur-sm"
                            aria-label="View on GitHub"
                        >
                            <Github className="h-4 w-4"/>
                            <span>GitHub</span>
                        </a>

                        <a
                            href="mailto:applytrak@gmail.com"
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200/50 dark:border-gray-700/50 rounded-lg transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 hover:shadow-sm backdrop-blur-sm"
                            aria-label="Contact support"
                        >
                            <Mail className="h-4 w-4"/>
                            <span>Support</span>
                        </a>
                    </div>
                </div>
                
                {/* Bottom section with additional info */}
                <div className="mt-6 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-500">
                        <div className="flex items-center gap-4">
                            <span>Built with modern web technologies</span>
                            <span className="hidden sm:inline">•</span>
                            <span>Secure & Privacy-focused</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span>Version 1.0.0</span>
                            <span className="hidden sm:inline">•</span>
                            <span className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                All systems normal
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;