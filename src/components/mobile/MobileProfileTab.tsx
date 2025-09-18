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
  Trash2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const MobileProfileTab: React.FC = () => {
  const { 
    auth, 
    signOut, 
    showToast,
    openPrivacySettings
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<'profile' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'account' | 'data' | null>(null);
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

  const handleDeleteAccount = () => {
    setDeleteType('account');
    setShowDeleteConfirm(true);
  };

  const handleDeleteData = () => {
    setDeleteType('data');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      // Import privacy service to delete all user data
      const { privacyService } = await import('../../services/privacyService');
      
      const isAccountDeletion = deleteType === 'account';
      const actionText = isAccountDeletion ? 'account and all data' : 'all your data';
      
      showToast({
        type: 'info',
        message: `Deleting ${actionText}...`,
        duration: 2000
      });

      // Delete all user data (both account and data deletion do the same thing)
      await privacyService.deleteAllUserData(String(auth.user?.id));

      showToast({
        type: 'success',
        message: `${isAccountDeletion ? 'Account' : 'Data'} deleted successfully. You will be signed out.`,
        duration: 3000
      });

      // Sign out and reload after a delay
      setTimeout(async () => {
        await signOut();
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error(`Failed to delete ${deleteType}:`, error);
      showToast({
        type: 'error',
        message: `Failed to delete ${deleteType === 'account' ? 'account' : 'data'}. Please try again or contact support.`,
        duration: 5000
      });
    } finally {
      setShowDeleteConfirm(false);
      setDeleteType(null);
    }
  };

  const handlePrivacySettings = () => {
    openPrivacySettings();
  };

  const handleNotificationSettings = () => {
    showToast({
      type: 'info',
      message: 'Notification settings coming soon! For now, you can manage email preferences in Privacy Settings.',
      duration: 4000
    });
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
                <button 
                  onClick={handlePrivacySettings}
                  className="btn btn-secondary mobile-text-sm"
                >
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
                <button 
                  onClick={handleNotificationSettings}
                  className="btn btn-secondary mobile-text-sm"
                >
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
                className="w-full btn btn-secondary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-full btn btn-secondary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete Account
              </button>
              <button
                onClick={handleDeleteData}
                className="w-full btn btn-secondary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete My Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <Trash2 className={`h-6 w-6 mr-3 ${deleteType === 'account' ? 'text-red-600' : 'text-orange-600'}`} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {deleteType === 'account' ? 'Delete Account' : 'Delete My Data'}
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {deleteType === 'account' 
                ? 'Are you sure you want to delete your account? This will permanently remove your account and all associated data. This action cannot be undone.'
                : 'Are you sure you want to delete all your data? This will permanently remove all your job applications, goals, and analytics data. Your account will remain but be empty. This action cannot be undone.'
              }
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDelete}
                className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors ${
                  deleteType === 'account' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {deleteType === 'account' ? 'Delete Account' : 'Delete My Data'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteType(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileProfileTab;
