// src/components/layout/Footer.tsx - Fully Mobile-Responsive Footer
import React from 'react';
import {Briefcase, Coffee, Heart, Mail, MessageSquare, Shield, TrendingUp} from 'lucide-react';
import ApplyTrakLogo from '../ui/ApplyTrakLogo';
import {useAppStore} from '../../store/useAppStore';

const Footer: React.FC = () => {
    const {
        applications,
        goalProgress,
        openFeedbackModal,
        analyticsSettings,
        adminAnalytics,
        modals: modalState // Rename to avoid conflict
    } = useAppStore();

    const currentYear = new Date().getFullYear();
    const totalApplications = applications.length;
    const successRate = goalProgress.totalProgress || 0;

    // Hide footer when any modal is open
    const isModalOpen = modalState?.editApplication?.isOpen ||
        modalState?.goalSetting?.isOpen ||
        modalState?.milestone?.isOpen ||
        modalState?.recovery?.isOpen ||
        modalState?.analyticsConsent?.isOpen ||
        modalState?.feedback?.isOpen ||
        modalState?.adminLogin?.isOpen;

    // Don't render footer if modal is open
    if (isModalOpen) {
        return null;
    }

    // Quick stats for footer
    const footerStats = [
        {
            label: 'Applications Tracked',
            value: totalApplications.toLocaleString(),
            icon: Briefcase,
            color: 'text-blue-600 dark:text-blue-400'
        },
        {
            label: 'Goal Progress',
            value: `${Math.round(successRate)}%`,
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400'
        },
        {
            label: 'Session Time',
            value: `${Math.round((adminAnalytics?.usageMetrics.averageSessionDuration || 0) / (1000 * 60))}min`,
            icon: Coffee,
            color: 'text-purple-600 dark:text-purple-400'
        }
    ];

    const handleFeedbackClick = () => {
        if (openFeedbackModal) {
            openFeedbackModal('general');
        }
    };

    const handlePrivacyClick = () => {
        // This would open a privacy modal or navigate to privacy page
        console.log('Privacy policy clicked');
    };

    const handleSupportClick = () => {
        if (openFeedbackModal) {
            openFeedbackModal('bug');
        }
    };

    return (
        <footer className="relative mt-8 sm:mt-12 border-t border-gray-200 dark:border-gray-700">
            {/* Background with glass effect */}
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md"></div>

            <div className="relative z-10">
                {/* Main Footer Content */}
                <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">

                    {/* Mobile-First Grid Layout */}
                    <div className="space-y-6 sm:space-y-8 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-8">

                        {/* ApplyTrak Brand & Version - Full width on mobile */}
                        <div className="text-center sm:text-left lg:col-span-2">
                            <div
                                className="flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                                <ApplyTrakLogo size="sm" className="sm:size-md"/>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        ApplyTrak
                                    </h3>
                                    <span
                                        className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full font-medium">
                                        v1.0
                                    </span>
                                </div>
                            </div>


                        </div>

                        {/* Quick Links - Centered on mobile */}
                        <div className="text-center sm:text-left">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 text-sm sm:text-base">
                                Quick Actions
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                <li>
                                    <button
                                        onClick={handleFeedbackClick}
                                        className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group w-full sm:w-auto min-h-[44px] sm:min-h-0 p-2 sm:p-0 rounded-lg sm:rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 sm:hover:bg-transparent"
                                    >
                                        <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform"/>
                                        Send Feedback
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Contact & Social - Centered on mobile */}
                        <div className="text-center sm:text-left">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 text-sm sm:text-base">
                                Connect
                            </h4>
                            <ul className="space-y-2 sm:space-y-3">
                                <li>
                                    <a
                                        href="mailto:applytrak@gmail.com"
                                        className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group w-full sm:w-auto min-h-[44px] sm:min-h-0 p-2 sm:p-0 rounded-lg sm:rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 sm:hover:bg-transparent break-all sm:break-normal"
                                    >
                                        <Mail
                                            className="h-4 w-4 group-hover:scale-110 transition-transform flex-shrink-0"/>
                                        <span className="text-xs sm:text-sm">applytrak@gmail.com</span>
                                    </a>
                                </li>
                            </ul>

                            {/* Privacy Badge - Responsive */}
                            {analyticsSettings?.enabled && (
                                <div
                                    className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200/50 dark:border-green-700/50">
                                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                                        <Shield
                                            className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400 flex-shrink-0"/>
                                        <span className="text-xs font-medium text-green-700 dark:text-green-300">
                                            Privacy-First Analytics
                                        </span>
                                    </div>
                                    <p className="text-xs text-green-600 dark:text-green-400 text-center sm:text-left">
                                        Your data stays local & anonymous
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>


                </div>

                {/* Bottom Bar - Mobile Optimized */}
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
                        <div
                            className="flex flex-col space-y-3 sm:space-y-4 lg:space-y-0 lg:flex-row lg:items-center lg:justify-between">

                            {/* Copyright - Mobile Stacked */}
                            <div
                                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center lg:text-left">
                                <span>© 2025 ApplyTrak. All rights reserved.</span>
                                <span className="hidden sm:inline lg:inline">•</span>
                                <span className="flex items-center justify-center gap-1">
                                    Made with
                                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 animate-pulse"/>
                                    for job seekers
                                </span>
                            </div>

                            {/* Logo & Status - Mobile Optimized */}
                            <div
                                className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-2 sm:gap-4">
                                <div className="flex items-center gap-2">
                                    <ApplyTrakLogo size="xs"/>
                                    <span className="text-xs text-gray-500 dark:text-gray-500">
                                        Powered by ApplyTrak
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span>All systems operational</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;