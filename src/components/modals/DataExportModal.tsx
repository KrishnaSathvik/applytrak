// src/components/modals/DataExportModal.tsx
import React, { useState } from 'react';
import { 
    Download, 
    FileText, 
    FileJson, 
    FileSpreadsheet, 
    X,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { exportToJSON, exportToCSV, exportToPDF } from '../../utils/exportImport';

interface DataExportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type ExportFormat = 'json' | 'csv' | 'pdf';

const DataExportModal: React.FC<DataExportModalProps> = ({ isOpen, onClose }) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    if (!isOpen) return null;

    const handleExport = async () => {
        setIsExporting(true);
        setExportStatus('loading');
        setErrorMessage('');

        try {
            const applications = await databaseService.getApplications();
            
            if (applications.length === 0) {
                throw new Error('No applications to export');
            }
            
            // Use the existing robust export functions
            if (selectedFormat === 'json') {
                await exportToJSON(applications);
            } else if (selectedFormat === 'csv') {
                await exportToCSV(applications);
            } else if (selectedFormat === 'pdf') {
                await exportToPDF(applications);
            }
            
            setExportStatus('success');
        } catch (error) {
            console.error('Export failed:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Failed to export data. Please try again.');
            setExportStatus('error');
        } finally {
            setIsExporting(false);
        }
    };

    const handleClose = () => {
        setExportStatus('idle');
        setErrorMessage('');
        setSelectedFormat('json');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Export Data
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Export your job applications and data for backup
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {exportStatus === 'idle' && (
                        <div className="space-y-8">
                            {/* Export Formats */}
                            <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200/50 dark:border-green-700/50">
                                <header className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                                        <Download className="h-6 w-6"/>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            Export Formats
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Choose your preferred export format
                                        </p>
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div 
                                        className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200 cursor-pointer ${selectedFormat === 'json' ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}
                                        onClick={() => setSelectedFormat('json')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <FileJson className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">JSON</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Complete data backup</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div 
                                        className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200 cursor-pointer ${selectedFormat === 'csv' ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}
                                        onClick={() => setSelectedFormat('csv')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <FileSpreadsheet className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">CSV</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Spreadsheet format</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div 
                                        className={`bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200 cursor-pointer ${selectedFormat === 'pdf' ? 'ring-2 ring-green-500 dark:ring-green-400' : ''}`}
                                        onClick={() => setSelectedFormat('pdf')}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <FileText className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-white">PDF</h4>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Printable report</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>


                            {/* Warning */}
                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200/50 dark:border-yellow-800/50 rounded-xl p-4 backdrop-blur-sm">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <div className="p-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                                            <Download className="h-5 w-5" />
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                                            Export Your Data
                                        </h3>
                                        <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                            <p>This will download all your local data. Keep this file safe as a backup in case of sync issues.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {exportStatus === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Exporting Data...
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-center">
                                Please wait while we prepare your export file.
                            </p>
                        </div>
                    )}

                    {/* Success State */}
                    {exportStatus === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
                                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Export Complete!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                Your data has been successfully exported and downloaded.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {/* Error State */}
                    {exportStatus === 'error' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Export Failed
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                                {errorMessage || 'Something went wrong during export. Please try again.'}
                            </p>
                            <div className="flex space-x-3">
                                <button
                                    onClick={handleClose}
                                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={handleExport}
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {exportStatus === 'idle' && (
                    <div className="sticky bottom-0 flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-b-2xl">
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-lg hover:bg-gray-50/80 dark:hover:bg-gray-700/80 transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="px-6 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Export Data</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataExportModal;