// src/components/layout/Footer.tsx
import React, {useMemo} from 'react';
import {Heart, Mail, MessageSquare} from 'lucide-react';
import ApplyTrakLogo from '../ui/ApplyTrakLogo';
import {useAppStore} from '../../store/useAppStore';

const Footer: React.FC = () => {
    const {
        openFeedbackModal,
        modals: modalState
    } = useAppStore();

    const currentYear = new Date().getFullYear();

    // Check if any modal is open
    const isModalOpen = useMemo(() => {
        return modalState?.editApplication?.isOpen ||
            modalState?.goalSetting?.isOpen ||
            modalState?.milestone?.isOpen ||
            modalState?.recovery?.isOpen ||
            modalState?.feedback?.isOpen ||
            modalState?.adminLogin?.isOpen ||
            modalState?.privacySettings?.isOpen;
    }, [modalState]);

    const handleFeedbackClick = () => {
        openFeedbackModal?.('general');
    };

    // Don't render footer if modal is open
    if (isModalOpen) {
        return null;
    }

    return (
        <footer className="mt-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">

                    {/* Left: Copyright */}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                        <ApplyTrakLogo size="xs"/>
                        <span>© {currentYear} ApplyTrak</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="flex items-center gap-1">
                            Made with <Heart className="h-3 w-3 text-red-500"/> for job seekers
                        </span>
                    </div>

                    {/* Right: Quick Actions */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleFeedbackClick}
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            aria-label="Send feedback"
                        >
                            <MessageSquare className="h-3 w-3"/>
                            <span className="text-xs">Feedback</span>
                        </button>

                        <a
                            href="mailto:applytrak@gmail.com"
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            aria-label="Contact support"
                        >
                            <Mail className="h-3 w-3"/>
                            <span className="text-xs">Support</span>
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;