// src/components/tables/BulkOperations.tsx
// Production-ready bulk operations component with enhanced error handling and UX
import React, {useCallback, useMemo, useState} from 'react';
import {Archive, Edit3, Trash2, X} from 'lucide-react';
import {Application, ApplicationStatus} from '../../types';
import {useAppStore} from '../../store/useAppStore';

// Constants
const STATUS_OPTIONS: ApplicationStatus[] = ['Applied', 'Interview', 'Offer', 'Rejected'];
const MAX_DISPLAYED_APPLICATIONS = 10;

interface BulkOperationsProps {
    selectedIds: string[];
    allApplications: Application[]; // All applications for bulk operations across all pages
    onSelectionChange: (newSelectedIds: string[]) => void;
    className?: string;
}

interface ModalState {
    showDeleteModal: boolean;
    showStatusModal: boolean;
}

interface ProcessingState {
    isProcessing: boolean;
    operation: 'delete' | 'status' | 'reject' | null;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
                                                           selectedIds,
                                                           allApplications,
                                                           onSelectionChange,
                                                           className = ''
                                                       }) => {
    // Store hooks
    const {
        deleteApplications,
        updateApplication,
        showToast
    } = useAppStore();

    // State management
    const [modalState, setModalState] = useState<ModalState>({
        showDeleteModal: false,
        showStatusModal: false
    });

    const [processingState, setProcessingState] = useState<ProcessingState>({
        isProcessing: false,
        operation: null
    });

    const [newStatus, setNewStatus] = useState<ApplicationStatus>('Applied');

    // Memoized computed values - use allApplications for bulk operations
    const selectedApplications = useMemo(() =>
            allApplications.filter(app => selectedIds.includes(app.id)),
        [allApplications, selectedIds]
    );

    const statusCounts = useMemo(() =>
            selectedApplications.reduce((acc, app) => {
                acc[app.status] = (acc[app.status] || 0) + 1;
                return acc;
            }, {} as Record<ApplicationStatus, number>),
        [selectedApplications]
    );

    const isProcessingOperation = (operation: ProcessingState['operation']) =>
        processingState.isProcessing && processingState.operation === operation;

    // Modal handlers
    const openDeleteModal = useCallback(() => {
        setModalState(prev => ({...prev, showDeleteModal: true}));
    }, []);

    const closeDeleteModal = useCallback(() => {
        setModalState(prev => ({...prev, showDeleteModal: false}));
    }, []);

    const openStatusModal = useCallback(() => {
        setModalState(prev => ({...prev, showStatusModal: true}));
    }, []);

    const closeStatusModal = useCallback(() => {
        setModalState(prev => ({...prev, showStatusModal: false}));
    }, []);

    // Operation handlers
    const handleBulkDelete = useCallback(async () => {
        if (processingState.isProcessing || selectedIds.length === 0) return;

        try {
            setProcessingState({isProcessing: true, operation: 'delete'});

            await deleteApplications(selectedIds);

            closeDeleteModal();
            onSelectionChange([]);

            showToast({
                type: 'success',
                message: `Successfully deleted ${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''}`
            });
        } catch (error) {
            console.error('Bulk delete error:', error);
            showToast({
                type: 'error',
                message: 'Failed to delete applications. Please try again.'
            });
        } finally {
            setProcessingState({isProcessing: false, operation: null});
        }
    }, [selectedIds, processingState.isProcessing, deleteApplications, closeDeleteModal, onSelectionChange, showToast]);

    const handleBulkStatusUpdate = useCallback(async () => {
        if (processingState.isProcessing || selectedIds.length === 0) return;

        try {
            setProcessingState({isProcessing: true, operation: 'status'});

            // Update each application individually
            const updatePromises = selectedIds.map(id =>
                updateApplication(id, {status: newStatus})
            );

            await Promise.all(updatePromises);

            closeStatusModal();
            onSelectionChange([]);

            showToast({
                type: 'success',
                message: `Successfully updated ${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''} to ${newStatus}`
            });
        } catch (error) {
            console.error('Bulk status update error:', error);
            showToast({
                type: 'error',
                message: 'Failed to update applications. Please try again.'
            });
        } finally {
            setProcessingState({isProcessing: false, operation: null});
        }
    }, [selectedIds, newStatus, processingState.isProcessing, updateApplication, closeStatusModal, onSelectionChange, showToast]);

    const handleQuickReject = useCallback(async () => {
        if (processingState.isProcessing || selectedIds.length === 0) return;

        try {
            setProcessingState({isProcessing: true, operation: 'reject'});

            // Update each application to rejected status
            const updatePromises = selectedIds.map(id =>
                updateApplication(id, {status: 'Rejected'})
            );

            await Promise.all(updatePromises);

            onSelectionChange([]);

            showToast({
                type: 'success',
                message: `Successfully marked ${selectedIds.length} application${selectedIds.length !== 1 ? 's' : ''} as rejected`
            });
        } catch (error) {
            console.error('Quick reject error:', error);
            showToast({
                type: 'error',
                message: 'Failed to update applications. Please try again.'
            });
        } finally {
            setProcessingState({isProcessing: false, operation: null});
        }
    }, [selectedIds, processingState.isProcessing, updateApplication, onSelectionChange, showToast]);

    const clearSelection = useCallback(() => {
        onSelectionChange([]);
    }, [onSelectionChange]);

    // Don't hide the component - always show it to allow users to start selecting

    return (
        <>
            <div
                className={`flex items-center justify-between p-4 ${selectedIds.length > 0 ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'} rounded-lg mb-4 ${className}`}>
                <div className="flex items-center space-x-4">
                    {selectedIds.length > 0 ? (
                        <>
                            <span className="text-sm font-bold text-blue-900 dark:text-blue-100 tracking-wide">
                                <span className="font-extrabold text-blue-600 dark:text-blue-400">
                                    {selectedIds.length}
                                </span>{' '}
                                application{selectedIds.length !== 1 ? 's' : ''} selected
                            </span>

                            <div className="flex space-x-2">
                                <button
                                    onClick={openStatusModal}
                                    disabled={processingState.isProcessing}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold tracking-wide text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    aria-label="Update status of selected applications"
                                >
                                    <Edit3 className="h-4 w-4"/>
                                    Update Status
                                </button>

                                <button
                                    onClick={handleQuickReject}
                                    disabled={processingState.isProcessing}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold tracking-wide text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    aria-label="Mark selected applications as rejected"
                                >
                                    {isProcessingOperation('reject') ? (
                                        <>
                                            <div
                                                className="w-4 h-4 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"/>
                                            Rejecting...
                                        </>
                                    ) : (
                                        <>
                                            <Archive className="h-4 w-4"/>
                                            Mark Rejected
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={openDeleteModal}
                                    disabled={processingState.isProcessing}
                                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-bold tracking-wide text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-md hover:bg-red-200 dark:hover:bg-red-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                    aria-label="Delete selected applications"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                    Delete
                                </button>
                            </div>
                        </>
                    ) : (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Use the checkboxes above to select applications for bulk operations
                        </span>
                    )}
                </div>

                {selectedIds.length > 0 && (
                    <button
                        onClick={clearSelection}
                        disabled={processingState.isProcessing}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                        aria-label="Clear selection"
                    >
                        <X className="h-4 w-4"/>
                        Clear Selection
                    </button>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {modalState.showDeleteModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="delete-modal-title" role="dialog"
                     aria-modal="true">
                    <div
                        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                             onClick={closeDeleteModal}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"
                              aria-hidden="true">&#8203;</span>

                        <div
                            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div
                                        className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                        <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true"/>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100"
                                            id="delete-modal-title">
                                            Confirm Bulk Delete
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                                Are you sure you want to delete{' '}
                                                <span className="font-bold text-red-600 dark:text-red-400">
                          {selectedIds.length}
                        </span>{' '}
                                                application{selectedIds.length !== 1 ? 's' : ''}? This action cannot be
                                                undone.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        Selected Applications:
                                    </h4>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {selectedApplications.slice(0, MAX_DISPLAYED_APPLICATIONS).map(app => (
                                            <div key={app.id} className="flex justify-between text-sm">
                        <span className="text-gray-900 dark:text-gray-100 font-medium truncate">
                          {app.company} - {app.position}
                        </span>
                                                <span
                                                    className="text-gray-500 dark:text-gray-400 font-medium ml-2 flex-shrink-0">
                          {app.status}
                        </span>
                                            </div>
                                        ))}
                                        {selectedApplications.length > MAX_DISPLAYED_APPLICATIONS && (
                                            <div
                                                className="text-sm text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-600 font-medium">
                                                ... and{' '}
                                                <span className="font-bold">
                          {selectedApplications.length - MAX_DISPLAYED_APPLICATIONS}
                        </span>{' '}
                                                more applications
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div
                                    className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                                    <p className="text-sm text-red-800 dark:text-red-200 font-medium leading-relaxed">
                                        <strong className="font-bold">Warning:</strong> This will permanently delete all
                                        selected applications and their attachments.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleBulkDelete}
                                    disabled={isProcessingOperation('delete')}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-bold text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    {isProcessingOperation('delete') ? (
                                        <>
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>
                                            Deleting...
                                        </>
                                    ) : (
                                        `Delete ${selectedIds.length} Application${selectedIds.length !== 1 ? 's' : ''}`
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeDeleteModal}
                                    disabled={isProcessingOperation('delete')}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Update Modal */}
            {modalState.showStatusModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="status-modal-title" role="dialog"
                     aria-modal="true">
                    <div
                        className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                             onClick={closeStatusModal}></div>

                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"
                              aria-hidden="true">&#8203;</span>

                        <div
                            className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div
                                        className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                        <Edit3 className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true"/>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-gray-100"
                                            id="status-modal-title">
                                            Update Application Status
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                                                Update the status for{' '}
                                                <span className="font-bold text-blue-600 dark:text-blue-400">
                          {selectedIds.length}
                        </span>{' '}
                                                selected application{selectedIds.length !== 1 ? 's' : ''}:
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        New Status
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                        aria-label="Select new status"
                                    >
                                        {STATUS_OPTIONS.map(status => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="mt-4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-2">
                                        Current Status Distribution:
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(statusCounts).map(([status, count]) => (
                                            <div key={status} className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400 font-medium">
                          {status}:
                        </span>
                                                <span className="font-bold text-gray-900 dark:text-gray-100">
                          {count}
                        </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium leading-relaxed">
                                        All selected applications will be updated to{' '}
                                        <strong className="font-bold">{newStatus}</strong> status.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    onClick={handleBulkStatusUpdate}
                                    disabled={isProcessingOperation('status')}
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    {isProcessingOperation('status') ? (
                                        <>
                                            <div
                                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"/>
                                            Updating...
                                        </>
                                    ) : (
                                        `Update ${selectedIds.length} Application${selectedIds.length !== 1 ? 's' : ''}`
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeStatusModal}
                                    disabled={isProcessingOperation('status')}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

BulkOperations.displayName = 'BulkOperations';

export {BulkOperations};
export default BulkOperations;