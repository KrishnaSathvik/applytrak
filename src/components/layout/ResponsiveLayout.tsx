import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import MobileLayout from '../mobile/MobileLayout';

interface ResponsiveLayoutProps {
  children?: React.ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkIsMobile = () => {
      // Check if screen width is mobile (768px and below)
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      setIsLoading(false);
    };

    // Initial check
    checkIsMobile();

    // Listen for resize events
    const handleResize = () => {
      checkIsMobile();
    };

    window.addEventListener('resize', handleResize);
    
    // Also check for touch capability as a secondary indicator
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (hasTouch && window.innerWidth <= 1024) {
      setIsMobile(true);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Show loading state briefly to prevent layout shift
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Render appropriate layout based on device type
  if (isMobile) {
    return <MobileLayout>{children}</MobileLayout>;
  }

  return <Layout>{children}</Layout>;
};

export default ResponsiveLayout;
