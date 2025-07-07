// src/components/layout/Layout.tsx - MOBILE RESPONSIVE FIXED
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
            {/* Background Decorative Elements - MOBILE OPTIMIZED */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Top-left gradient orb - SMALLER ON MOBILE */}
                <div className="absolute -top-20 sm:-top-40 -left-20 sm:-left-40 w-40 sm:w-80 h-40 sm:h-80 bg-gradient-to-br from-primary-400/20 to-secondary-400/20 rounded-full blur-2xl sm:blur-3xl animate-float" />

                {/* Top-right gradient orb - MOBILE POSITIONED */}
                <div className="absolute -top-10 sm:-top-20 -right-10 sm:-right-20 w-32 sm:w-60 h-32 sm:h-60 bg-gradient-to-bl from-blue-400/15 to-purple-400/15 rounded-full blur-xl sm:blur-2xl animate-float" style={{ animationDelay: '2s' }} />

                {/* Bottom gradient orb - MOBILE RESPONSIVE */}
                <div className="absolute -bottom-16 sm:-bottom-32 left-1/2 transform -translate-x-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-gradient-to-t from-indigo-400/10 to-cyan-400/10 rounded-full blur-2xl sm:blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            {/* Header - ALWAYS AT TOP */}
            <Header />

            <div className="flex relative z-10">
                {/* Sidebar - MOBILE RESPONSIVE */}
                <Sidebar />

                {/* Main Content - MOBILE OPTIMIZED */}
                <main
                    className={`flex-1 transition-all duration-300 ease-out min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] ${
                        ui.sidebarOpen
                            ? 'lg:ml-64'
                            : 'lg:ml-16'
                    }`}
                >
                    {/* MOBILE RESPONSIVE CONTAINER */}
                    <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl">
                        {/* Content Wrapper with Glass Effect - MOBILE OPTIMIZED */}
                        <div className="relative">
                            {/* Subtle background gradient - LIGHTER ON MOBILE */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 sm:from-white/30 via-transparent to-blue-500/5 dark:from-black/10 dark:sm:from-black/20 dark:via-transparent dark:to-blue-900/10 rounded-2xl sm:rounded-3xl blur-2xl sm:blur-3xl transform rotate-1" />

                            {/* Main content area */}
                            <div className="relative z-10">
                                {children}
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Enhanced scroll to top button - MOBILE OPTIMIZED */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-4 sm:bottom-6 lg:bottom-8 right-4 sm:right-6 lg:right-8 z-40 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r from-primary-500 to-secondary-500 text-white border-none rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group hover:scale-110 active:scale-95"
                aria-label="Scroll to top"
            >
                <svg
                    className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform duration-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>

                {/* Ripple effect on click - MOBILE OPTIMIZED */}
                <div className="absolute inset-0 rounded-full bg-white/30 transform scale-0 group-active:scale-110 transition-transform duration-200" />
            </button>

            {/* Mobile overlay when sidebar is open */}
            {ui.sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => useAppStore.getState().toggleSidebar()}
                />
            )}
        </div>
    );
};

export default Layout;