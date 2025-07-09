// src/components/ui/ExportImportActions.tsx - FINAL INTEGRATED VERSION
import React, { useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle,
    Download,
    FileSpreadsheet,
    FileText,
    Save,
    Upload,
    Loader2,
    Database,
    FileImage,
    BarChart3,
    Shield
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Application } from '../../types/application.types';
import { formatDate } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';
import {
    exportToPDF,
    exportToCSV,
    exportToJSON,
    importApplications
} from '../../utils/exportImport';

interface ExportImportActionsProps {
    applications: Application[];
    onImport?: (applications: Application[]) => void;
}

export const ExportImportActions: React.FC<ExportImportActionsProps> = ({
                                                                            applications,
                                                                            onImport
                                                                        }) => {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [importError, setImportError] = useState<string>('');
    const [importPreview, setImportPreview] = useState<Application[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { showToast, handleImport: storeHandleImport } = useAppStore();

    // Enhanced export options with beautiful descriptions
    const exportOptions = [
        {
            id: 'json' as const,
            name: 'JSON Format',
            description: 'Complete data backup with all fields - Perfect for data migration and full backups',
            icon: Database,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
            borderColor: 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600',
            features: ['All fields included', 'Attachments preserved', 'Date formats maintained']
        },
        {
            id: 'csv' as const,
            name: 'CSV Format',
            description: 'Spreadsheet compatible format - Perfect for analysis in Excel, Google Sheets, or data visualization',
            icon: FileSpreadsheet,
            color: 'text-emerald-600 dark:text-emerald-400',
            bgColor: 'bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
            borderColor: 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600',
            features: ['Excel compatible', 'Easy data analysis', 'Charts & pivot tables']
        },
        {
            id: 'pdf' as const,
            name: 'PDF Report',
            description: 'Professional document format - Perfect for sharing, presentations, and printed reports',
            icon: FileImage,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
            borderColor: 'border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600',
            features: ['Print-ready format', 'Professional layout', 'Easy sharing']
        }
    ];

    const handleExport = async () => {
        if (applications.length === 0) {
            showToast({
                type: 'warning',
                message: 'No applications to export'
            });
            return;
        }

        setIsExporting(true);

        try {
            // Add a small delay to show the loading state
            await new Promise(resolve => setTimeout(resolve, 800));

            switch (exportFormat) {
                case 'json':
                    await exportToJSON(applications);
                    showToast({
                        type: 'success',
                        message: `Successfully exported ${applications.length} applications as JSON!`,
                        action: {
                            label: 'View Downloads',
                            onClick: () => console.log('Open downloads folder')
                        }
                    });
                    break;
                case 'csv':
                    await exportToCSV(applications);
                    showToast({
                        type: 'success',
                        message: `Successfully exported ${applications.length} applications as CSV!`
                    });
                    break;
                case 'pdf':
                    await exportToPDF(applications);
                    showToast({
                        type: 'success',
                        message: `Successfully exported ${applications.length} applications as PDF!`
                    });
                    break;
            }
            setShowExportModal(false);
        } catch (error) {
            console.error('Export error:', error);
            showToast({
                type: 'error',
                message: `Export failed: ${(error as Error).message}`
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportStatus('loading');
        setImportError('');

        try {
            const importedApplications = await importApplications(file);
            setImportPreview(importedApplications);
            setImportStatus('success');
        } catch (error) {
            console.error('Import error:', error);
            setImportError((error as Error).message);
            setImportStatus('error');
        }
    };

    const confirmImport = async () => {
        try {
            if (storeHandleImport) {
                await storeHandleImport(importPreview);
            } else if (onImport) {
                await onImport(importPreview);
                showToast({
                    type: 'success',
                    message: `Successfully imported ${importPreview.length} applications!`
                });
            }

            setShowImportModal(false);
            setImportPreview([]);
            setImportStatus('idle');

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            console.error('Import confirmation error:', error);
            showToast({
                type: 'error',
                message: 'Failed to import applications'
            });
        }
    };

    const createBackup = async () => {
        try {
            if (applications.length === 0) {
                showToast({
                    type: 'warning',
                    message: 'No applications to backup'
                });
                return;
            }

            const backup = {
                timestamp: new Date().toISOString(),
                applications,
                version: '1.0',
                totalCount: applications.length,
                metadata: {
                    exportedBy: 'ApplyTrak',
                    exportType: 'backup'
                }
            };

            const jsonString = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `applytrak-backup-${formatDate(new Date().toISOString())}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `Backup created with ${applications.length} applications!`,
                action: {
                    label: 'Create Another',
                    onClick: createBackup
                }
            });
        } catch (error) {
            console.error('Backup error:', error);
            showToast({
                type: 'error',
                message: 'Failed to create backup'
            });
        }
    };

    const getExportStats = () => {
        const total = applications.length;
        const offers = applications.filter(app => app.status === 'Offer').length;
        const interviews = applications.filter(app => app.status === 'Interview').length;
        const applied = applications.filter(app => app.status === 'Applied').length;
        const rejected = applications.filter(app => app.status === 'Rejected').length;

        return { total, offers, interviews, applied, rejected };
    };

    const stats = getExportStats();

    return (
        <>
            {/* ACTION BUTTONS */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportModal(true)}
                    className="btn btn-secondary btn-sm hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold tracking-wide"
                >
                    <Download className="h-4 w-4 mr-2" />
                    <span className="font-bold tracking-wide">Export</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportModal(true)}
                    className="btn btn-secondary btn-sm hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold tracking-wide"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    <span className="font-bold tracking-wide">Import</span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={createBackup}
                    className="btn btn-secondary btn-sm hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold tracking-wide"
                >
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="font-bold tracking-wide">Backup</span>
                </Button>
            </div>

            {/* ENHANCED EXPORT MODAL */}
            <Modal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Export Applications"
                size="lg"
            >
                <div className="space-y-8">
                    {/* EXPORT STATS DASHBOARD */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="glass-subtle rounded-xl p-4 text-center border border-gray-200/50 dark:border-gray-700/50">
                            <div className="text-2xl font-extrabold text-gradient-static mb-1">
                                {stats.total}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Total</div>
                        </div>
                        <div className="glass-subtle rounded-xl p-4 text-center border border-green-200/50 dark:border-green-700/50">
                            <div className="text-2xl font-extrabold text-gradient-blue mb-1">
                                {stats.offers}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Offers</div>
                        </div>
                        <div className="glass-subtle rounded-xl p-4 text-center border border-blue-200/50 dark:border-blue-700/50">
                            <div className="text-2xl font-extrabold text-gradient-purple mb-1">
                                {stats.interviews}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Interviews</div>
                        </div>
                        <div className="glass-subtle rounded-xl p-4 text-center border border-orange-200/50 dark:border-orange-700/50">
                            <div className="text-2xl font-extrabold text-gradient-static mb-1">
                                {stats.applied}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-bold uppercase tracking-widest">Pending</div>
                        </div>
                    </div>

                    {/* EXPORT FORMAT SELECTION */}
                    <div>
                        <h3 className="text-lg font-bold text-gradient-static mb-6 flex items-center gap-3 tracking-wide">
                            <BarChart3 className="h-5 w-5" />
                            Choose Export Format
                        </h3>

                        <div className="space-y-4">
                            {exportOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = exportFormat === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setExportFormat(option.id)}
                                        disabled={isExporting}
                                        className={`w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left ${
                                            isSelected
                                                ? `${option.borderColor} ${option.bgColor} shadow-xl scale-[1.02] transform`
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 hover:scale-[1.01] transform'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-5">
                                            <div className={`p-3 rounded-xl ${option.bgColor} border border-white/20`}>
                                                <Icon className={`h-7 w-7 ${option.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-lg font-bold text-gradient-static tracking-wide">
                                                        {option.name}
                                                    </h4>
                                                    {isSelected && (
                                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-medium leading-relaxed">
                                                    {option.description}
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {option.features.map((feature, index) => (
                                                        <span
                                                            key={index}
                                                            className="text-xs font-bold tracking-wider uppercase px-2 py-1 rounded-full bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300"
                                                        >
                                                            {feature}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* ACTION BUTTONS */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                        <Button
                            variant="outline"
                            onClick={() => setShowExportModal(false)}
                            disabled={isExporting}
                            className="font-bold tracking-wide px-6 py-3"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || applications.length === 0}
                            className="btn btn-primary btn-lg font-bold tracking-wide px-8 py-3 hover:scale-105 transition-transform"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                    <span className="font-bold tracking-wide">Exporting...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="h-5 w-5 mr-3" />
                                    <span className="font-bold tracking-wide">Export {exportFormat.toUpperCase()}</span>
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* ENHANCED IMPORT MODAL */}
            <Modal
                isOpen={showImportModal}
                onClose={() => {
                    setShowImportModal(false);
                    setImportStatus('idle');
                    setImportPreview([]);
                    setImportError('');
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                    }
                }}
                title="Import Applications"
                size="lg"
            >
                <div className="space-y-8">
                    {importStatus === 'idle' && (
                        <>
                            <div className="glass-subtle rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                                <h4 className="font-bold text-gradient-static mb-3 flex items-center gap-3 tracking-wide">
                                    <Upload className="h-5 w-5" />
                                    Supported Import Formats
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3">
                                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        <div>
                                            <div className="font-bold text-gradient-blue tracking-wide">JSON Files</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Exported from ApplyTrak or backup files</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <FileSpreadsheet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                        <div>
                                            <div className="font-bold text-gradient-static tracking-wide">CSV Files</div>
                                            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Spreadsheet exports with proper columns</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl hover:border-primary-500 dark:hover:border-primary-400 transition-all duration-300 group hover:bg-gradient-to-br hover:from-blue-50/30 hover:to-purple-50/30 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 hover:scale-[1.02] transform"
                            >
                                <div className="text-center">
                                    <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 w-fit mx-auto mb-6 group-hover:scale-110 transition-transform">
                                        <Upload className="h-10 w-10 text-white" />
                                    </div>
                                    <p className="text-xl font-bold text-gradient-static mb-2 tracking-wide">
                                        Choose File to Import
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wider">
                                        JSON or CSV files accepted • Max 100MB
                                    </p>
                                </div>
                            </button>
                        </>
                    )}

                    {importStatus === 'loading' && (
                        <div className="text-center py-16">
                            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary-500 mb-6" />
                            <p className="text-xl font-bold text-gradient-static mb-2 tracking-wide">Processing your file...</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium tracking-wider">
                                Validating data and preparing import preview
                            </p>
                        </div>
                    )}

                    {importStatus === 'error' && (
                        <div className="glass rounded-xl p-8 border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/50 to-pink-50/50 dark:from-red-900/20 dark:to-pink-900/20">
                            <div className="flex items-start space-x-4">
                                <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h4 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2 tracking-wide">
                                        Import Failed
                                    </h4>
                                    <p className="text-red-600 dark:text-red-400 font-medium leading-relaxed mb-4">{importError}</p>
                                    <button
                                        onClick={() => setImportStatus('idle')}
                                        className="btn btn-outline text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600 font-bold tracking-wide"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {importStatus === 'success' && (
                        <div className="space-y-6">
                            <div className="glass rounded-xl p-6 border-l-4 border-l-green-500 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20">
                                <div className="flex items-start space-x-4">
                                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                                    <div>
                                        <h4 className="text-lg font-bold text-green-800 dark:text-green-200 mb-2 tracking-wide">
                                            Import Preview Ready
                                        </h4>
                                        <p className="text-green-600 dark:text-green-400 font-medium leading-relaxed">
                                            Found <span className="font-extrabold text-gradient-blue">{importPreview.length}</span> valid applications ready to import
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-80 overflow-y-auto glass rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50/90 dark:bg-gray-800/90 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">Company</th>
                                        <th className="px-6 py-4 text-left font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">Position</th>
                                        <th className="px-6 py-4 text-left font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">Date</th>
                                        <th className="px-6 py-4 text-left font-bold tracking-wider uppercase text-gray-700 dark:text-gray-300">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {importPreview.map((app, index) => (
                                        <tr key={index} className="border-t border-gray-200/50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gradient-static">{app.company}</td>
                                            <td className="px-6 py-4 font-semibold tracking-tight">{app.position}</td>
                                            <td className="px-6 py-4 font-medium tracking-wider">{formatDate(app.dateApplied)}</td>
                                            <td className="px-6 py-4">
                                                    <span className={`status-badge status-${app.status.toLowerCase()} font-bold tracking-wider uppercase`}>
                                                        {app.status}
                                                    </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setImportStatus('idle');
                                        setImportPreview([]);
                                    }}
                                    className="font-bold tracking-wide px-6 py-3"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmImport}
                                    className="btn btn-primary btn-lg font-bold tracking-wide px-8 py-3 hover:scale-105 transition-transform"
                                >
                                    <Upload className="h-5 w-5 mr-3" />
                                    <span className="font-bold tracking-wide">Import {importPreview.length} Applications</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default ExportImportActions;