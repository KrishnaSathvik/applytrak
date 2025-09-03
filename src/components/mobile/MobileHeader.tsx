import React from 'react';
import { Moon, Sun, LogIn, UserPlus } from 'lucide-react';
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

  const handleLogin = () => {
    openAuthModal('login');
  };

  const handleSignup = () => {
    openAuthModal('signup');
  };

  return (
    <header className="mobile-header">
      <div className="mobile-flex mobile-items-center mobile-gap-4">
        <ApplyTrakLogo size="sm" className="transition-transform duration-300 hover:scale-110" showText={false} />
        <h1 className="mobile-header-title">ApplyTrak</h1>
      </div>
      
      <div className="mobile-header-actions">
        {/* Theme Toggle */}
        <button
          onClick={handleThemeToggle}
          className="btn btn-secondary"
          aria-label={`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {ui.theme === 'dark' ? (
            <Sun className="h-4 w-4 text-yellow-500" />
          ) : (
            <Moon className="h-4 w-4 text-blue-600" />
          )}
        </button>

        {/* Authentication Buttons */}
        {!auth.isAuthenticated && (
          <>
            <button
              onClick={handleLogin}
              className="btn btn-secondary mobile-flex mobile-items-center mobile-gap-2"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Sign In</span>
            </button>
            <button
              onClick={handleSignup}
              className="btn btn-primary mobile-flex mobile-items-center mobile-gap-2"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Up</span>
            </button>
          </>
        )}

        {/* User Info for authenticated users */}
        {auth.isAuthenticated && auth.user && (
          <div className="mobile-flex mobile-items-center mobile-gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
