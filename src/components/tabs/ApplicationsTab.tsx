import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import MobileResponsiveApplicationTable from '../tables/MobileResponsiveApplicationTable';
import ApplicationForm from '../forms/ApplicationForm';
import ImportModal from '../modals/ImportModal';
import EditApplicationModal from '../modals/EditApplicationModal';

const ApplicationsTab: React.FC = () => {
  const { 
    applications, 
    filteredApplications,
    auth
  } = useAppStore();
  
  const [showImportModal, setShowImportModal] = useState(false);


  const handleQuickImport = () => {
    setShowImportModal(true);
  };

  const handleFormSuccess = () => {
    // Form stays visible after successful submission
    // User can add more applications if needed
  };



  return (
    <div className="space-y-2 md:space-y-4">
      {/* Header Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3">
          <div className="space-y-0.5 sm:space-y-1">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Applications
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm md:text-base">
              Track and manage your job applications
            </p>
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Total: {applications.length}</span>
              <span>Active: {applications.filter(app => app.status !== 'Rejected').length}</span>
              <span>Interviews: {applications.filter(app => app.status === 'Interview').length}</span>
              {!auth.isAuthenticated && (
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  Limit: {applications.length}/50
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
            <button
              onClick={handleQuickImport}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-colors flex items-center justify-center min-h-[36px] sm:min-h-[40px]"
            >
              <Upload className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-6">
          <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 mb-1">
              {applications.filter(app => app.status === 'Applied').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Applied</div>
          </div>
          <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 mb-1">
              {applications.filter(app => app.status === 'Interview').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Interviews</div>
          </div>
          <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 mb-1">
              {applications.filter(app => app.status === 'Offer').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Offers</div>
          </div>
          <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 mb-1">
              {applications.filter(app => app.status === 'Rejected').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Rejected</div>
          </div>
        </div>
      )}

      {/* Add Application Form - Always Visible */}
      <div className="glass-card">
        <div className="mb-2 sm:mb-3">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Application</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">Fill out the details below to track your job application</p>
        </div>
        <ApplicationForm onSuccess={handleFormSuccess} />
      </div>



      {/* Applications Table */}
      <div className="glass-card">
        <div className="mb-2 sm:mb-3">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100">Your Applications</h2>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Showing {filteredApplications.length} of {applications.length} applications
          </p>
        </div>
        
        {applications.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No active applications
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 sm:mb-6 px-4">
              Add your first application using the form above to get started!
            </p>
          </div>
        ) : (
          <MobileResponsiveApplicationTable />
        )}
      </div>


      
      {/* Import Modal */}
      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* Edit Application Modal */}
      <EditApplicationModal />

    </div>
  );
};

export default ApplicationsTab;
