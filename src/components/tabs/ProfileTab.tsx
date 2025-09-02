// src/components/tabs/ProfileTab.tsx
import React, { useState } from 'react';
import { User, Settings, Shield, Download, Bell, Database, Check, X, Trash2, Eye, Lock, Cloud, BarChart3, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useAuthStore } from '../../store/useAuthStore';
import { exportToJSON, exportToCSV } from '../../utils/exportImport';

const ProfileTab: React.FC = () => {
    const {
    auth, 
    applications,
    openPrivacySettings,
    showToast,
    signOut
  } = useAppStore();

  const { updateUserProfile } = useAuthStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if user is authenticated and email verified
  const isAuthenticated = auth.isAuthenticated;
  
  if (!isAuthenticated) {
    return (
      <div className="space-y-8">
        <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Authentication Required
            </h1>
            <p className="text-gray-600 text-lg mb-4">
              Please sign in and verify your email to access your profile
            </p>
            <div className="text-sm text-gray-500">
              {!auth.isAuthenticated ? 'You need to sign in first' : 'Please check your email and click the verification link'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const user = auth.user;
  const displayName = user?.display_name || 
                     user?.email?.split('@')[0] || 
                     'User';



  const handleEditName = () => {
    setNewDisplayName(displayName);
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (!newDisplayName.trim()) return;
    
    setIsUpdating(true);
    try {
      await updateUserProfile({ full_name: newDisplayName.trim() });
      setIsEditingName(false);
      showToast({
        type: 'success',
        message: 'Display name updated successfully!',
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to update display name:', error);
      showToast({
        type: 'error',
        message: 'Failed to update display name. Please try again.',
        duration: 5000
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setNewDisplayName('');
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      if (format === 'json') {
        await exportToJSON(applications);
        showToast({
          type: 'success',
          message: 'Data exported to JSON successfully!',
          duration: 3000
        });
      } else {
        await exportToCSV(applications);
        showToast({
          type: 'success',
          message: 'Data exported to CSV successfully!',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Export failed:', error);
      showToast({
        type: 'error',
        message: 'Failed to export data. Please try again.',
        duration: 5000
      });
    }
  };

  const handleSignOut = () => {
    signOut();
    showToast({
      type: 'success',
      message: 'Signed out successfully',
      duration: 3000
    });
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAccount = () => {
    // This would typically call a delete account service
    showToast({
      type: 'info',
      message: 'Account deletion feature coming soon. Please contact support.',
      duration: 5000
    });
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="text-center py-8">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {displayName}
          </h1>
          <p className="text-gray-600 text-lg mb-4">
            Manage your account and preferences
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <span>Member since</span>
            <span className="font-medium">
              {'Recently'}
            </span>
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="glass-card">
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Email</div>
              <div className="text-sm text-gray-600">{user?.email || 'Not provided'}</div>
            </div>
            <span className="text-green-600 text-sm font-medium">✓ Verified</span>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Display Name</div>
              {isEditingName ? (
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    type="text"
                    value={newDisplayName}
                    onChange={(e) => setNewDisplayName(e.target.value)}
                    className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter display name"
                    disabled={isUpdating}
                  />
                  <button
                    onClick={handleSaveName}
                    disabled={isUpdating || !newDisplayName.trim()}
                    className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                    title="Save"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isUpdating}
                    className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
                    title="Cancel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-sm text-gray-600">{displayName}</div>
              )}
            </div>
            {!isEditingName && (
              <button 
                onClick={handleEditName}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Edit
              </button>
            )}
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Account Status</div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <span className="text-green-600 text-sm font-medium">✓</span>
          </div>
        </div>
      </div>

      {/* Privacy & Security - Enhanced */}
      <div className="glass-card">
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-green-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Eye className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Privacy Settings</div>
                <div className="text-sm text-gray-600">Control data sharing and analytics</div>
              </div>
            </div>
            <button
              onClick={openPrivacySettings}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Manage
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Data Protection</div>
                <div className="text-sm text-gray-600">Your data is encrypted and secure</div>
              </div>
            </div>
            <span className="text-green-600 text-sm font-medium">✓ Protected</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Cloud className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Cloud Sync</div>
                <div className="text-sm text-gray-600">Your data syncs across devices</div>
              </div>
            </div>
            <span className="text-green-600 text-sm font-medium">✓ Enabled</span>
          </div>
        </div>
      </div>

      {/* Notification Preferences - New */}
      <div className="glass-card">
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-purple-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Error Notifications</div>
                <div className="text-sm text-gray-600">Always show critical errors and warnings</div>
              </div>
            </div>
            <span className="text-green-600 text-sm font-medium">✓ Always On</span>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Success Notifications</div>
                <div className="text-sm text-gray-600">Show when operations complete successfully</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-md text-sm font-medium">
                Enabled
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Info Notifications</div>
                <div className="text-sm text-gray-600">General information and updates</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-sm font-medium">
                Muted
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Settings className="h-5 w-5 text-purple-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Quick Snooze</div>
                <div className="text-sm text-gray-600">Temporarily pause non-critical notifications</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
                15m
              </button>
              <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
                1h
              </button>
              <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium">
                4h
              </button>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mr-3 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Smart Notifications:</strong> Important notifications (errors, warnings) are always shown. 
                You can mute less critical notifications and use quick snooze to temporarily pause them during focused work.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management - Enhanced */}
      <div className="glass-card">
        <div className="flex items-center mb-6">
          <Database className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Data Management</h2>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => handleExportData('json')}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <Download className="h-5 w-5 text-blue-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Export to JSON</div>
                  <div className="text-sm text-gray-600">Complete data with metadata</div>
                </div>
              </div>
              <span className="text-blue-600">→</span>
            </button>
            
            <button 
              onClick={() => handleExportData('csv')}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center">
                <Download className="h-5 w-5 text-green-600 mr-3" />
                <div>
                  <div className="font-medium text-gray-900">Export to CSV</div>
                  <div className="text-sm text-gray-600">Excel & Google Sheets compatible</div>
                </div>
              </div>
              <span className="text-green-600">→</span>
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Data Summary</div>
                <div className="text-sm text-gray-600">
                  {applications.length} applications tracked
                </div>
              </div>
            </div>
            <span className="text-blue-600 text-sm font-medium">
              {applications.length} total
            </span>
          </div>
        </div>
      </div>

      {/* Preferences */}
      <div className="glass-card">
        <div className="flex items-center mb-6">
          <Settings className="h-6 w-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <div className="font-medium text-gray-900">Notifications</div>
                <div className="text-sm text-gray-600">Email and browser notifications</div>
              </div>
            </div>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Configure
            </button>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="glass-card border-2 border-gray-200/30 dark:border-gray-700/30">
        <div className="text-center py-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h3>
          <div className="space-y-3">
            <button 
              onClick={handleSignOut}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Sign Out
            </button>
            <button 
              onClick={handleDeleteAccount}
              className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <Trash2 className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Account
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={confirmDeleteAccount}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
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

export default ProfileTab;
