// src/components/layout/Layout.tsx - PERFECT SEAMLESS LAYOUT
import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { ui } = useAppStore();

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl animate-float" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-400/15 to-purple-400/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-t from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            {/* Header - Fixed at top */}
            <Header />

            {/* Main Layout Container - NO GAPS */}
            <div className="flex pt-16">
                {/* Sidebar - Perfectly aligned */}
                <Sidebar />

                {/* Main Content Area - Seamless connection */}
                <main className={`
                    flex-1 min-h-[calc(100vh-4rem)]
                    transition-all duration-300 ease-out
                    ${ui.sidebarOpen
                    ? 'lg:ml-0'
                    : 'lg:ml-0'
                }
                `}>
                    {/* Content Container - NO padding gaps */}
                    <div className="h-full">
                        {/* Content Wrapper */}
                        <div className="relative h-full">
                            {/* Subtle background gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-500/5 dark:from-black/20 dark:via-transparent dark:to-blue-900/10 rounded-3xl blur-3xl transform rotate-1" />

                            {/* Main content area - PERFECT SPACING */}
                            <div className="relative z-10 p-6">
                                {children}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Scroll to top button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-8 right-8 z-40 flex items-center justify-center w-14 h-14 bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-none rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-110 active:scale-95"
                aria-label="Scroll to top"
            >
                <svg
                    className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <div className="absolute inset-0 rounded-full bg-white/30 transform scale-0 group-active:scale-110 transition-transform duration-200" />
            </button>
        </div>
    );
};

export default Layout;