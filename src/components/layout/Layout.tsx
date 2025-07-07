// src/components/layout/Layout.tsx - MATCHES YOUR CSS SYSTEM
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
        <div className="min-h-screen bg-grid dark:bg-grid-dark relative">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl animate-float" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-400/15 to-purple-400/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-t from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            {/* Header - Sticky at top */}
            <Header />

            {/* Sidebar - Fixed positioning */}
            <Sidebar />

            {/* Main Content Area - Adjusts based on sidebar state */}
            <main className={`
                min-h-screen transition-all duration-300 ease-out
                ${ui.sidebarOpen
                ? 'lg:ml-64'
                : 'lg:ml-16'
            }
            `}>
                {/* Content Container */}
                <div className="p-6">
                    {/* Content Wrapper with glass effect */}
                    <div className="relative">
                        {/* Subtle background gradient */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-blue-500/5 dark:from-black/20 dark:via-transparent dark:to-blue-900/10 rounded-3xl blur-3xl transform rotate-1" />

                        {/* Main content area */}
                        <div className="relative z-10">
                            {children}
                        </div>
                    </div>
                </div>
            </main>

            {/* Scroll to top button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fab"
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
            </button>
        </div>
    );
};

export default Layout;