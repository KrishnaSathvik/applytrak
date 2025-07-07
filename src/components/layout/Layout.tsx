// src/components/layout/Layout.tsx - FIXED RESPONSIVE VERSION
import React, { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const { ui } = useAppStore();

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const isDesktop = window.innerWidth >= 1024;
            // Auto-close sidebar on mobile when resizing to mobile
            if (!isDesktop && ui.sidebarOpen) {
                // Only close if user manually opened it (not default state)
                // You might want to add this logic to your store
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [ui.sidebarOpen]);

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Background */}
            <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />

            {/* Background Grid Pattern */}
            <div className="fixed inset-0 opacity-30">
                <div className="absolute inset-0 bg-grid dark:bg-grid-dark" />
            </div>

            {/* Background Decorative Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-float" />
                <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-indigo-400/8 to-cyan-400/8 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
                <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-t from-violet-400/5 to-blue-400/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
            </div>

            {/* Header - Fixed at top */}
            <Header />

            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="relative z-10 pt-16"> {/* pt-16 accounts for fixed header height */}
                {/* Content Container with proper responsive margins */}
                <div className={`
                    min-h-[calc(100vh-4rem)] 
                    transition-all duration-300 ease-out
                    ${
                    // Desktop margins based on sidebar state
                    window.innerWidth >= 1024
                        ? (ui.sidebarOpen ? 'ml-64' : 'ml-16')
                        : 'ml-0' // No margin on mobile
                }
                `}>
                    {/* Inner content wrapper */}
                    <div className="p-4 sm:p-6 lg:p-8">
                        {/* Content area with glass effect */}
                        <div className="relative">
                            {/* Subtle content background */}
                            <div className="absolute inset-0 bg-white/20 dark:bg-black/20 rounded-2xl backdrop-blur-sm" />

                            {/* Main content */}
                            <div className="relative z-10">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Scroll to top FAB */}
            <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fab fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
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