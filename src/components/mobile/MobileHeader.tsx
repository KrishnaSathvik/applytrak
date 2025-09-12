import React from 'react';
import { Moon, Sun, User } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import ApplyTrakLogo from '../ui/ApplyTrakLogo';

const MobileHeader: React.FC = () => {
  const {
    ui,
    setTheme,
    auth,
    openAuthModal
  } = useAppStore();

  const handleThemeToggle = () => {
    const newTheme = ui.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const handleAuth = () => {
    openAuthModal('login');
  };

  const handleLogoClick = () => {
    // Navigate to home page by setting the selected tab to home
    useAppStore.getState().setSelectedTab('home');
  };

  return (
    <header className="mobile-header">
      <div className="mobile-flex mobile-items-center mobile-gap-4">
        <button 
          onClick={handleLogoClick}
          className="mobile-flex mobile-items-center mobile-gap-2 hover:opacity-80 transition-opacity"
        >
          <ApplyTrakLogo size="sm" className="transition-transform duration-300 hover:scale-110" showText={false} />
          <h1 className="mobile-header-title">ApplyTrak</h1>
        </button>
      </div>
      
      <div className="mobile-flex mobile-items-center mobile-gap-2">
        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {ui.theme === 'dark' ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-blue-600" />
          )}
        </button>

        {/* Integrated Auth Button */}
        {!auth.isAuthenticated && (
          <button
            onClick={handleAuth}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors mobile-flex mobile-items-center mobile-gap-1"
          >
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        )}

        {/* User Info for authenticated users */}
        {auth.isAuthenticated && auth.user && (
          <div className="mobile-flex mobile-items-center mobile-gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
              {auth.user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span className="mobile-text-sm mobile-font-medium text-gray-700 dark:text-gray-300 hidden sm:inline">
              {auth.user.email}
            </span>
          </div>
        )}
      </div>
    </header>
  );
};

export default MobileHeader;
