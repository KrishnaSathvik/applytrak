// src/components/ui/ExportImportActions.tsx - ENHANCED VERSION
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
    FileImage
} from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';
import { Application } from '../../types/application.types';
import { formatDate } from '../../utils/formatters';
import { useAppStore } from '../../store/useAppStore';

interface ExportImportActionsProps {
    applications: Application[];
    onImport: (applications: Application[]) => void;
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

    // Enhanced export options with better descriptions
    const exportOptions = [
        {
            id: 'json' as const,
            name: 'JSON Format',
            description: 'Complete data with all fields - Perfect for backups and data migration',
            icon: Database,
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            borderColor: 'border-blue-200 dark:border-blue-700'
        },
        {
            id: 'csv' as const,
            name: 'CSV Format',
            description: 'Spreadsheet compatible format - Great for analysis in Excel or Google Sheets',
            icon: FileSpreadsheet,
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            borderColor: 'border-green-200 dark:border-green-700'
        },
        {
            id: 'pdf' as const,
            name: 'PDF Format',
            description: 'Print-ready document - Perfect for sharing and presentations',
            icon: FileImage,
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            borderColor: 'border-purple-200 dark:border-purple-700'
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
            await new Promise(resolve => setTimeout(resolve, 500));

            switch (exportFormat) {
                case 'json':
                    exportToJSON();
                    break;
                case 'csv':
                    exportToCSV();
                    break;
                case 'pdf':
                    await exportToPDF();
                    break;
            }
        } catch (error) {
            console.error('Export error:', error);
            showToast({
                type: 'error',
                message: 'Export failed. Please try again.'
            });
        } finally {
            setIsExporting(false);
        }
    };

    const exportToJSON = () => {
        try {
            const jsonString = JSON.stringify(applications, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `job-applications-${formatDate(new Date().toISOString())}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `Successfully exported ${applications.length} applications as JSON!`,
                action: {
                    label: 'View Downloads',
                    onClick: () => console.log('Open downloads folder')
                }
            });
            setShowExportModal(false);
        } catch (error) {
            console.error('Export JSON error:', error);
            showToast({
                type: 'error',
                message: 'Failed to export JSON: ' + (error as Error).message
            });
        }
    };

    const exportToCSV = () => {
        try {
            const headers = [
                'Company', 'Position', 'Date Applied', 'Status', 'Type',
                'Location', 'Salary', 'Job Source', 'Job URL', 'Notes'
            ];

            const csvContent = [
                headers.join(','),
                ...applications.map(app => [
                    `"${app.company || ''}"`,
                    `"${app.position || ''}"`,
                    `"${formatDate(app.dateApplied)}"`,
                    `"${app.status || ''}"`,
                    `"${app.type || ''}"`,
                    `"${app.location || ''}"`,
                    `"${app.salary || ''}"`,
                    `"${app.jobSource || ''}"`,
                    `"${app.jobUrl || ''}"`,
                    `"${(app.notes || '').replace(/"/g, '""')}"`
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `job-applications-${formatDate(new Date().toISOString())}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `Successfully exported ${applications.length} applications as CSV!`
            });
            setShowExportModal(false);
        } catch (error) {
            console.error('Export CSV error:', error);
            showToast({
                type: 'error',
                message: 'Failed to export CSV: ' + (error as Error).message
            });
        }
    };

    const exportToPDF = async () => {
        try {
            // For now, export as formatted text that can be converted to PDF
            const textContent = `Job Applications Report
Generated on: ${new Date().toLocaleDateString()}
Total Applications: ${applications.length}

${'='.repeat(80)}

${applications.map((app, index) => `
${index + 1}. ${app.company} - ${app.position}
   Date Applied: ${formatDate(app.dateApplied)}
   Status: ${app.status}
   Type: ${app.type}
   Location: ${app.location || 'Not specified'}
   Salary: ${app.salary || 'Not specified'}
   Source: ${app.jobSource || 'Not specified'}
   ${app.jobUrl ? `URL: ${app.jobUrl}` : ''}
   ${app.notes ? `Notes: ${app.notes}` : ''}
   ${'-'.repeat(40)}
`).join('')}

End of Report`;

            const blob = new Blob([textContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `job-applications-${formatDate(new Date().toISOString())}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `Successfully exported ${applications.length} applications as text file!`
            });
            setShowExportModal(false);
        } catch (error) {
            console.error('Export PDF error:', error);
            showToast({
                type: 'error',
                message: 'Failed to export: ' + (error as Error).message
            });
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImportStatus('loading');
        setImportError('');

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                let importedData: Application[];

                if (file.type === 'application/json' || file.name.endsWith('.json')) {
                    const parsed = JSON.parse(content);
                    // Handle both direct array and backup format
                    importedData = Array.isArray(parsed) ? parsed : parsed.applications || [];
                } else {
                    // Handle CSV import
                    const lines = content.split('\n').filter(line => line.trim());
                    if (lines.length < 2) {
                        throw new Error('CSV file must have at least a header row and one data row');
                    }

                    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());

                    importedData = lines.slice(1).map((line, index) => {
                        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
                        return {
                            id: `imported-${Date.now()}-${index}`,
                            company: values[headers.indexOf('company')] || values[0] || '',
                            position: values[headers.indexOf('position')] || values[1] || '',
                            dateApplied: values[headers.indexOf('date applied')] || values[2] || new Date().toISOString().split('T')[0],
                            status: (values[headers.indexOf('status')] || values[3] || 'Applied') as any,
                            type: (values[headers.indexOf('type')] || values[4] || 'Remote') as any,
                            location: values[headers.indexOf('location')] || values[5] || '',
                            salary: values[headers.indexOf('salary')] || values[6] || '',
                            jobSource: values[headers.indexOf('job source')] || values[7] || '',
                            jobUrl: values[headers.indexOf('job url')] || values[8] || '',
                            notes: values[headers.indexOf('notes')] || values[9] || '',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                    }).filter(app => app.company && app.position); // Filter out invalid entries
                }

                if (!Array.isArray(importedData) || importedData.length === 0) {
                    throw new Error('No valid applications found in the file');
                }

                setImportPreview(importedData);
                setImportStatus('success');
            } catch (error) {
                console.error('Import error:', error);
                setImportError((error as Error).message);
                setImportStatus('error');
            }
        };

        reader.onerror = () => {
            setImportError('Failed to read file');
            setImportStatus('error');
        };

        reader.readAsText(file);
    };

    const confirmImport = async () => {
        try {
            // Use the store's handleImport method for better state management
            if (storeHandleImport) {
                await storeHandleImport(importPreview);
            } else {
                // Fallback to the passed onImport function
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

    const createBackup = () => {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                applications,
                version: '1.0',
                totalCount: applications.length
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
                message: `Backup created with ${applications.length} applications!`
            });
        } catch (error) {
            console.error('Backup error:', error);
            showToast({
                type: 'error',
                message: 'Failed to create backup'
            });
        }
    };

    return (
        <>
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportModal(true)}
                    className="btn btn-secondary btn-sm hover:shadow-md transition-all duration-200"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowImportModal(true)}
                    className="btn btn-secondary btn-sm hover:shadow-md transition-all duration-200"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={createBackup}
                    className="btn btn-secondary btn-sm hover:shadow-md transition-all duration-200"
                >
                    <Save className="h-4 w-4 mr-2" />
                    Backup
                </Button>
            </div>

            {/* Enhanced Export Modal */}
            <Modal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Export Applications"
                size="md"
            >
                <div className="space-y-6">
                    {/* Export Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="glass-subtle rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-primary-600 dark:text-primary-400">
                                {applications.length}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                        </div>
                        <div className="glass-subtle rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                {applications.filter(app => app.status === 'Offer').length}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Offers</div>
                        </div>
                        <div className="glass-subtle rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {applications.filter(app => app.status === 'Interview').length}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">Interviews</div>
                        </div>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Choose Export Format
                        </h3>

                        <div className="space-y-3">
                            {exportOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = exportFormat === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setExportFormat(option.id)}
                                        disabled={isExporting}
                                        className={`w-full p-4 rounded-xl border-2 transition-all duration-300 text-left ${
                                            isSelected
                                                ? `${option.borderColor} ${option.bgColor} shadow-lg scale-[1.02]`
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className={`p-2 rounded-lg ${option.bgColor}`}>
                                                <Icon className={`h-6 w-6 ${option.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                                        {option.name}
                                                    </h4>
                                                    {isSelected && (
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {option.description}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            variant="outline"
                            onClick={() => setShowExportModal(false)}
                            disabled={isExporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || applications.length === 0}
                            className="btn btn-primary btn-md"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export {exportFormat.toUpperCase()}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Enhanced Import Modal */}
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
                <div className="space-y-6">
                    {importStatus === 'idle' && (
                        <>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    Upload a JSON or CSV file containing your job applications.
                                </p>
                                <div className="glass-subtle rounded-lg p-4 space-y-2">
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">Supported formats:</h4>
                                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                        <li>• <strong>JSON:</strong> Exported from this application or backup files</li>
                                        <li>• <strong>CSV:</strong> With columns for Company, Position, Date Applied, etc.</li>
                                    </ul>
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
                                className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-400 transition-colors group"
                            >
                                <div className="text-center">
                                    <Upload className="h-12 w-12 mx-auto text-gray-400 group-hover:text-primary-500 transition-colors mb-4" />
                                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                        Choose File to Import
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        JSON or CSV files accepted
                                    </p>
                                </div>
                            </button>
                        </>
                    )}

                    {importStatus === 'loading' && (
                        <div className="text-center py-12">
                            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary-500 mb-4" />
                            <p className="text-lg font-medium text-gray-900 dark:text-gray-100">Processing file...</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                This may take a few moments
                            </p>
                        </div>
                    )}

                    {importStatus === 'error' && (
                        <div className="glass rounded-lg p-6 border-l-4 border-l-red-500">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-medium text-red-800 dark:text-red-200 mb-1">
                                        Import Failed
                                    </h4>
                                    <p className="text-red-600 dark:text-red-400">{importError}</p>
                                    <button
                                        onClick={() => setImportStatus('idle')}
                                        className="mt-3 text-sm text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100 underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {importStatus === 'success' && (
                        <div className="space-y-4">
                            <div className="glass rounded-lg p-6 border-l-4 border-l-green-500">
                                <div className="flex items-start space-x-3">
                                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                                            Import Preview
                                        </h4>
                                        <p className="text-green-600 dark:text-green-400">
                                            Found {importPreview.length} valid applications ready to import
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="max-h-72 overflow-y-auto glass rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-medium">Company</th>
                                        <th className="px-4 py-3 text-left font-medium">Position</th>
                                        <th className="px-4 py-3 text-left font-medium">Date</th>
                                        <th className="px-4 py-3 text-left font-medium">Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {importPreview.map((app, index) => (
                                        <tr key={index} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-4 py-3 font-medium">{app.company}</td>
                                            <td className="px-4 py-3">{app.position}</td>
                                            <td className="px-4 py-3">{formatDate(app.dateApplied)}</td>
                                            <td className="px-4 py-3">
                                                    <span className={`status-badge status-${app.status.toLowerCase()}`}>
                                                        {app.status}
                                                    </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setImportStatus('idle');
                                        setImportPreview([]);
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={confirmImport}
                                    className="btn btn-primary btn-md"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import {importPreview.length} Applications
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