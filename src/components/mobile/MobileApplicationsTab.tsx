import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import MobileApplicationsTable from './MobileApplicationsTable';
import MobileApplicationForm from './MobileApplicationForm';
import ImportModal from '../modals/ImportModal';

const MobileApplicationsTab: React.FC = () => {
  const { 
    applications, 
    filteredApplications
  } = useAppStore();
  
  const [showImportModal, setShowImportModal] = useState(false);


  const handleQuickImport = () => {
    setShowImportModal(true);
  };





  return (
    <div className="mobile-content">
      <div className="mobile-space-y-4">
      {/* Header Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mobile-gap-4">
          <div className="space-y-1">
            <h1 className="mobile-text-xl font-bold text-gray-900 dark:text-gray-100">
              Applications
            </h1>
            <p className="mobile-text-sm text-gray-600 dark:text-gray-300">
              Track and manage your job applications
            </p>
            <div className="flex flex-wrap items-center mobile-gap-2 mobile-text-sm text-gray-500 dark:text-gray-400">
              <span>Total: {applications.length}</span>
              <span>Active: {applications.filter(app => app.status !== 'Rejected').length}</span>
              <span>Interviews: {applications.filter(app => app.status === 'Interview').length}</span>

            </div>
          </div>
          <div className="flex flex-col sm:flex-row mobile-gap-2">
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
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {applications.filter(app => app.status === 'Applied').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Applied</div>
          </div>
          <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
              {applications.filter(app => app.status === 'Interview').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Interviews</div>
          </div>
          <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              {applications.filter(app => app.status === 'Offer').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Offers</div>
          </div>
          <div className="glass-card p-2 sm:p-3 md:p-4 text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
              {applications.filter(app => app.status === 'Rejected').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">Rejected</div>
          </div>
        </div>
      )}

      {/* Add Application Form - Always Visible */}
      <div className="glass-card">
        <div className="mb-4">
          <h2 className="mobile-text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Application</h2>
          <p className="mobile-text-sm text-gray-600 dark:text-gray-300">Fill out the details below to track your job application</p>
        </div>
        <MobileApplicationForm onSuccess={() => {}} />
      </div>

      {/* Applications Table */}
      <div className="glass-card">
        <div className="mb-4">
          <h2 className="mobile-text-lg font-semibold text-gray-900 dark:text-gray-100">Your Applications</h2>
          <p className="mobile-text-sm text-gray-600 dark:text-gray-300">
            Showing {filteredApplications.length} of {applications.length} applications
          </p>
        </div>
        
        {applications.length === 0 ? (
          <div className="text-center py-6 sm:py-8 md:py-12">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <Upload className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-gray-400" />
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-2">
              No active applications
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-6 px-4">
              Add your first application using the form above to get started!
            </p>
          </div>
        ) : (
          <MobileApplicationsTable />
        )}
      </div>



             {/* Import Modal */}
       <ImportModal
         isOpen={showImportModal}
         onClose={() => setShowImportModal(false)}
       />
      </div>
    </div>
  );
};

export default MobileApplicationsTab;
