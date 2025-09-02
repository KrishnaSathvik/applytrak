import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import MobileResponsiveApplicationTable from '../tables/MobileResponsiveApplicationTable';
import ApplicationForm from '../forms/ApplicationForm';
import ImportModal from '../modals/ImportModal';

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
    <div className="space-y-8">
      {/* Header Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Applications
            </h1>
            <p className="text-gray-600 text-lg">
              Track and manage your job applications
            </p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Total: {applications.length}</span>
              <span>Active: {applications.filter(app => app.status !== 'Rejected').length}</span>
              <span>Interviews: {applications.filter(app => app.status === 'Interview').length}</span>
              {!auth.isAuthenticated && (
                <span className="text-blue-600 font-semibold">
                  Free Tier: {applications.length}/50
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">

            <button
              onClick={handleQuickImport}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
            >
              <Upload className="h-5 w-5 mr-2" />
              Import Applications
            </button>
          </div>
        </div>
      </div>

      {/* Add Application Form - Always Visible */}
      <div className="glass-card">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Add New Application</h2>
          <p className="text-sm text-gray-600">Fill out the details below to track your job application</p>
        </div>
        <ApplicationForm onSuccess={handleFormSuccess} />
      </div>



      {/* Applications Table */}
      <div className="glass-card">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Applications</h2>
          <p className="text-sm text-gray-600">
            Showing {filteredApplications.length} of {applications.length} applications
          </p>
        </div>
        
        {applications.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No active applications
            </h3>
            <p className="text-gray-600 mb-6">
              Add your first application using the form above to get started!
            </p>
          </div>
        ) : (
          <MobileResponsiveApplicationTable />
        )}
      </div>

      {/* Quick Stats */}
      {applications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {applications.filter(app => app.status === 'Applied').length}
            </div>
            <div className="text-sm text-gray-600">Applied</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 mb-1">
              {applications.filter(app => app.status === 'Interview').length}
            </div>
            <div className="text-sm text-gray-600">Interviews</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {applications.filter(app => app.status === 'Offer').length}
            </div>
            <div className="text-sm text-gray-600">Offers</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-2xl font-bold text-red-600 mb-1">
              {applications.filter(app => app.status === 'Rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </div>
      )}
      
      {/* Import Modal */}
      <ImportModal 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />




    </div>
  );
};

export default ApplicationsTab;
