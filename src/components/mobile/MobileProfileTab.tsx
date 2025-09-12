import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  Shield, 
  Bell, 
  Edit,
  Save,
  X,
  CheckCircle,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const MobileProfileTab: React.FC = () => {
  const { 
    auth, 
    signOut, 
    showToast
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<'profile' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: auth.user?.display_name || '',
    email: auth.user?.email || ''
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      showToast({
        type: 'success',
        message: 'Signed out successfully',
        duration: 2000
      });
    } catch (error) {
      console.error('Sign out error:', error);
      showToast({
        type: 'error',
        message: 'Failed to sign out',
        duration: 3000
      });
    }
  };

  const handleSaveProfile = async () => {
    try {
      // Here you would typically update the user profile
      // For now, we'll just show a success message
      showToast({
        type: 'success',
        message: 'Profile updated successfully',
        duration: 3000
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Profile update error:', error);
      showToast({
        type: 'error',
        message: 'Failed to update profile',
        duration: 3000
      });
    }
  };




  if (!auth.isAuthenticated || !auth.user) {
    return (
      <div className="mobile-content">
        <div className="mobile-empty-state">
          <div className="mobile-empty-state-icon">
            <User className="h-8 w-8" />
          </div>
          <h3 className="mobile-empty-state-title">
            Sign in required
          </h3>
          <p className="mobile-empty-state-description">
            Please sign in to access your profile and settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-content">
      {/* Header */}
      <div className="card">
        <div className="mobile-flex mobile-items-center mobile-gap-4 mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {auth.user.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            <h1 className="mobile-text-xl mobile-font-bold text-gray-900 dark:text-gray-100">
              Profile
            </h1>
            <p className="mobile-text-sm text-gray-600 dark:text-gray-400">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="mobile-flex mobile-gap-2">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'profile'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveSection('settings')}
            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'settings'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="card">
          <div className="mobile-flex mobile-items-center mobile-justify-between mb-6">
            <h2 className="mobile-text-lg mobile-font-semibold text-gray-900 dark:text-gray-100">
              Profile Information
            </h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary mobile-flex mobile-items-center mobile-gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <div className="mobile-flex mobile-gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="btn btn-primary mobile-flex mobile-items-center mobile-gap-2"
                >
                  <Save className="h-4 w-4" />
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="mobile-space-y-4">
            {/* Display Name */}
            <div className="mobile-form-group">
              <label className="mobile-form-label">Display Name</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                  className="mobile-form-input"
                  placeholder="Enter your display name"
                />
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="mobile-flex mobile-items-center mobile-gap-3">
                    <User className="h-5 w-5 text-gray-500" />
                    <span className="mobile-text-sm text-gray-900 dark:text-gray-100">
                      {editForm.displayName || 'Not set'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="mobile-form-group">
              <label className="mobile-form-label">Email</label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="mobile-flex mobile-items-center mobile-gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <span className="mobile-text-sm text-gray-900 dark:text-gray-100">
                    {editForm.email}
                  </span>
                  <div className="ml-auto">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Account Created */}
            <div className="mobile-form-group">
              <label className="mobile-form-label">Member Since</label>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="mobile-flex mobile-items-center mobile-gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <span className="mobile-text-sm text-gray-900 dark:text-gray-100">
                    Member since {new Date().getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="mobile-form-group">
              <label className="mobile-form-label">Account Status</label>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="mobile-flex mobile-items-center mobile-gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="mobile-text-sm text-green-800 dark:text-green-200 mobile-font-medium">
                    Active & Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Section */}
      {activeSection === 'settings' && (
        <div className="mobile-space-y-4">
          {/* Privacy Settings */}
          <div className="card">
            <h2 className="mobile-text-lg mobile-font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Privacy & Security
            </h2>
            
            <div className="mobile-space-y-4">
              <div className="mobile-flex mobile-items-center mobile-justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="mobile-flex mobile-items-center mobile-gap-3">
                  <Shield className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="mobile-text-sm mobile-font-medium text-gray-900 dark:text-gray-100">
                      Data Privacy
                    </div>
                    <div className="mobile-text-xs text-gray-500">
                      Control how your data is used
                    </div>
                  </div>
                </div>
                <button className="btn btn-secondary mobile-text-sm">
                  Manage
                </button>
              </div>

              <div className="mobile-flex mobile-items-center mobile-justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="mobile-flex mobile-items-center mobile-gap-3">
                  <Bell className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="mobile-text-sm mobile-font-medium text-gray-900 dark:text-gray-100">
                      Notifications
                    </div>
                    <div className="mobile-text-xs text-gray-500">
                      Email and push notifications
                    </div>
                  </div>
                </div>
                <button className="btn btn-secondary mobile-text-sm">
                  Configure
                </button>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="card">
            <h2 className="mobile-text-lg mobile-font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Account Actions
            </h2>
            
            <div className="mobile-space-y-3">
              <button
                onClick={handleSignOut}
                className="w-full btn btn-secondary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileProfileTab;
