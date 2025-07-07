// src/components/layout/Layout.tsx - FIXED: Proper header positioning and layout
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
                {/* Top-left gradient orb */}
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-3xl animate-float" />

                {/* Top-right gradient orb */}
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-blue-400/15 to-purple-400/15 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />

                {/* Bottom gradient orb */}
                <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-t from-indigo-400/10 to-cyan-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            {/* FIXED: Header - Always at top, doesn't scroll */}
            <Header />

            <div className="flex relative z-10">
                {/* FIXED: Sidebar - Positioned below header */}
                <Sidebar />

                {/* FIXED: Main Content - Proper margin to account for sidebar */}
                <main
                    className={`flex-1 transition-all duration-300 ease-out min-h-[calc(100vh-4rem)] ${
                        ui.sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
                    }`}
                >
                    <div className="container mx-auto px-6 py-8 max-w-7xl">
                        {/* Content Wrapper with Glass Effect */}
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
            </div>

            {/* Enhanced scroll to top button */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fab group"
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

                {/* Ripple effect on click */}
                <div className="absolute inset-0 rounded-full bg-white/30 transform scale-0 group-active:scale-110 transition-transform duration-200" />
            </button>
        </div>
    );
};

export default Layout;