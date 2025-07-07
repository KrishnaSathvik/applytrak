// src/components/tables/BulkOperations.tsx - FIXED STORE METHOD CALLS
import React, { useState } from 'react';
import { Archive, Edit3, Trash2 } from 'lucide-react';
import { Application, ApplicationStatus } from '../../types';
import { useAppStore } from '../../store/useAppStore';

interface BulkOperationsProps {
    selectedIds: string[];
    applications: Application[];
    onSelectionChange: (newSelectedIds: string[]) => void;
}

export const BulkOperations: React.FC<BulkOperationsProps> = ({
                                                                  selectedIds,
                                                                  applications,
                                                                  onSelectionChange
                                                              }) => {
    // FIXED: Check what methods are actually available in your store
    const {
        deleteApplications,
        updateApplication, // Using updateApplication instead of updateApplicationStatus
        showToast
    } = useAppStore();

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState<ApplicationStatus>('Applied');
    const [isProcessing, setIsProcessing] = useState(false);

    const selectedApplications = applications.filter(app => selectedIds.includes(app.id));

    const handleBulkDelete = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);
            await deleteApplications(selectedIds);
            setShowDeleteModal(false);
            onSelectionChange([]);
            showToast({
                type: 'success',
                message: `Successfully deleted ${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''}`
            });
        } catch (error) {
            console.error('Error deleting applications:', error);
            showToast({
                type: 'error',
                message: 'Failed to delete applications'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBulkStatusUpdate = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // FIXED: Update each application individually with the correct method signature
            await Promise.all(
                selectedIds.map(id =>
                    updateApplication(id, { status: newStatus })
                )
            );

            setShowStatusModal(false);
            onSelectionChange([]);
            showToast({
                type: 'success',
                message: `Successfully updated ${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''} to ${newStatus}`
            });
        } catch (error) {
            console.error('Error updating applications:', error);
            showToast({
                type: 'error',
                message: 'Failed to update applications'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleQuickReject = async () => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // FIXED: Update each application individually with the correct method signature
            await Promise.all(
                selectedIds.map(id =>
                    updateApplication(id, { status: 'Rejected' })
                )
            );

            onSelectionChange([]);
            showToast({
                type: 'success',
                message: `Successfully marked ${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''} as rejected`
            });
        } catch (error) {
            console.error('Error updating applications:', error);
            showToast({
                type: 'error',
                message: 'Failed to update applications'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const clearSelection = () => {
        onSelectionChange([]);
    };

    if (selectedIds.length === 0) return null;

    const statusCounts = selectedApplications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {} as Record<ApplicationStatus, number>);

    return (
        <>
            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {selectedIds.length} application{selectedIds.length !== 1 ? 's' : ''} selected
                    </span>

                    <div className="flex space-x-2">
                        <button
                            onClick={() => setShowStatusModal(true)}
                            disabled={isProcessing}
                            className="btn btn-sm btn-secondary"
                        >
                            <Edit3 className="h-4 w-4 mr-1" />
                            Update Status
                        </button>

                        <button
                            onClick={handleQuickReject}
                            disabled={isProcessing}
                            className="btn btn-sm btn-warning"
                        >
                            <Archive className="h-4 w-4 mr-1" />
                            Mark Rejected
                        </button>

                        <button
                            onClick={() => setShowDeleteModal(true)}
                            disabled={isProcessing}
                            className="btn btn-sm btn-danger"
                        >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                        </button>
                    </div>
                </div>

                <button
                    onClick={clearSelection}
                    disabled={isProcessing}
                    className="btn btn-sm btn-ghost"
                >
                    Clear Selection
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-red-500" />
                                Confirm Bulk Delete
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Are you sure you want to delete {selectedIds.length} application{selectedIds.length !== 1 ? 's' : ''}?
                                This action cannot be undone.
                            </p>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Selected Applications:
                                </h4>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {selectedApplications.slice(0, 10).map(app => (
                                        <div key={app.id} className="flex justify-between text-sm">
                                            <span className="text-gray-900 dark:text-gray-100">
                                                {app.company} - {app.position}
                                            </span>
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {app.status}
                                            </span>
                                        </div>
                                    ))}
                                    {selectedApplications.length > 10 && (
                                        <div className="text-sm text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-700">
                                            ... and {selectedApplications.length - 10} more applications
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                <p className="text-sm text-red-800 dark:text-red-200">
                                    <strong>Warning:</strong> This will permanently delete all selected applications and their attachments.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                disabled={isProcessing}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={isProcessing}
                                className="btn btn-danger"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        Delete {selectedIds.length} Application{selectedIds.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {showStatusModal && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Edit3 className="h-5 w-5 text-blue-500" />
                                Update Application Status
                            </h3>
                        </div>

                        <div className="p-6 space-y-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                Update the status for {selectedIds.length} selected application{selectedIds.length !== 1 ? 's' : ''}:
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    New Status
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                                    className="form-select w-full"
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Interview">Interview</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Current Status Distribution:
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(statusCounts).map(([status, count]) => (
                                        <div key={status} className="flex justify-between">
                                            <span className="text-gray-600 dark:text-gray-400">{status}:</span>
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    All selected applications will be updated to <strong>{newStatus}</strong> status.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowStatusModal(false)}
                                disabled={isProcessing}
                                className="btn btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkStatusUpdate}
                                disabled={isProcessing}
                                className="btn btn-primary"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        Update {selectedIds.length} Application{selectedIds.length !== 1 ? 's' : ''}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BulkOperations;