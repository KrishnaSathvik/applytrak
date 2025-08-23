// src/components/layout/Layout.tsx
import React, {useEffect, useState} from 'react';
import {ChevronUp} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import Header from './Header';
import Sidebar from './Sidebar';
import Footer from './Footer';
import ToastContainer from '../ui/ToastContainer';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({children}) => {
    const {ui} = useAppStore();
    const [showScrollTop, setShowScrollTop] = useState(false);
    const [isDesktop, setIsDesktop] = useState(false);

    // Handle scroll visibility for scroll-to-top button
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400);
        };

        window.addEventListener('scroll', handleScroll, {passive: true});
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 1024);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const getMainContentMargin = () => {
        if (!isDesktop) return 'ml-0';
        return ui.sidebarOpen ? 'ml-64' : 'ml-16';
    };

    const scrollToTop = () => {
        window.scrollTo({top: 0, behavior: 'smooth'});
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col">
            {/* Background Layers */}
            <div
                className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900"/>

            {/* Background Grid Pattern */}
            <div className="fixed inset-0 opacity-30">
                <div className="absolute inset-0 bg-grid dark:bg-grid-dark"/>
            </div>

            {/* Decorative Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-float"/>
                <div
                    className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-bl from-indigo-400/8 to-cyan-400/8 rounded-full blur-2xl animate-float"
                    style={{animationDelay: '2s'}}
                />
                <div
                    className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-t from-violet-400/5 to-blue-400/5 rounded-full blur-3xl animate-float"
                    style={{animationDelay: '4s'}}
                />
            </div>

            {/* Header - Fixed at top */}
            <Header/>

            {/* Sidebar */}
            <Sidebar/>

            {/* Main Content Area */}
            <main className="relative z-10 pt-16 flex-1">
                <div className={`
          min-h-[calc(100vh-4rem-200px)] 
          transition-all duration-300 ease-out
          ${getMainContentMargin()}
        `}>
                    <div className="p-4 sm:p-6 lg:p-8">
                        <div className="relative">
                            {/* Content background with glass effect */}
                            <div
                                className="absolute inset-0 bg-white/30 dark:bg-black/30 rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg"/>

                            {/* Main content */}
                            <div className="relative z-10 p-2 sm:p-4 lg:p-6">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <div className={`
        relative z-10 transition-all duration-300 ease-out
        ${getMainContentMargin()}
      `}>
                <Footer/>
            </div>

            {/* Scroll to top button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110 animate-fade-in"
                    aria-label="Scroll to top"
                >
                    <ChevronUp className="w-6 h-6 group-hover:scale-110 transition-transform duration-300"/>
                </button>
            )}

            {/* Loading overlay */}
            {ui.isLoading && (
                <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"/>
                        <span className="font-medium text-gray-900 dark:text-gray-100">Loading...</span>
                    </div>
                </div>
            )}

            {/* Toast notifications */}
            <ToastContainer/>
        </div>
    );
};

export default Layout;