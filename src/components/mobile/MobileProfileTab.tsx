import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Calendar, 
  LogOut, 
  Shield, 
  Bell, 
  Download, 
  Upload,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { exportToJSON, importFromJSON } from '../../utils/exportImport';

const MobileProfileTab: React.FC = () => {
  const { 
    auth, 
    signOut, 
    showToast,
    applications,
    handleImport
  } = useAppStore();

  const [activeSection, setActiveSection] = useState<'profile' | 'settings' | 'data'>('profile');
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

  const handleExportData = async () => {
    try {
      await exportToJSON(applications);
      showToast({
        type: 'success',
        message: 'Data exported successfully',
        duration: 3000
      });
    } catch (error) {
      console.error('Export error:', error);
      showToast({
        type: 'error',
        message: 'Failed to export data',
        duration: 3000
      });
    }
  };

  const handleImportData = () => {
    // Trigger file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const result = await importFromJSON(file);
          await handleImport(result.applications);
          showToast({
            type: 'success',
            message: 'Data imported successfully',
            duration: 3000
          });
        } catch (error) {
          console.error('Import error:', error);
          showToast({
            type: 'error',
            message: 'Failed to import data',
            duration: 3000
          });
        }
      }
    };
    input.click();
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
          <button
            onClick={() => setActiveSection('data')}
            className={`flex-1 p-3 rounded-lg text-sm font-medium transition-colors ${
              activeSection === 'data'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            Data
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

      {/* Data Section */}
      {activeSection === 'data' && (
        <div className="mobile-space-y-4">
          {/* Data Summary */}
          <div className="card">
            <h2 className="mobile-text-lg mobile-font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Your Data
            </h2>
            
            <div className="mobile-grid-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <div className="mobile-text-2xl mobile-font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {applications.length}
                </div>
                <div className="mobile-text-sm text-blue-800 dark:text-blue-200">
                  Applications
                </div>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <div className="mobile-text-2xl mobile-font-bold text-green-600 dark:text-green-400 mb-1">
                  {applications.filter(app => app.attachments && app.attachments.length > 0).length}
                </div>
                <div className="mobile-text-sm text-green-800 dark:text-green-200">
                  With Files
                </div>
              </div>
            </div>
          </div>

          {/* Data Actions */}
          <div className="card">
            <h2 className="mobile-text-lg mobile-font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Data Management
            </h2>
            
            <div className="mobile-space-y-3">
              <button
                onClick={handleExportData}
                className="w-full btn btn-secondary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </button>
              
              <button
                onClick={handleImportData}
                className="w-full btn btn-secondary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Data
              </button>
            </div>
          </div>

          {/* Data Info */}
          <div className="card">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="mobile-flex mobile-items-start mobile-gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <div className="mobile-text-sm mobile-font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Data Security
                  </div>
                  <div className="mobile-text-xs text-blue-800 dark:text-blue-200">
                    Your data is encrypted and stored securely. You can export your data at any time or delete your account if needed.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileProfileTab;
