// src/components/ui/ExportImport.tsx - FIXED VERSION
import React, {useRef, useState} from 'react';
import {AlertCircle, CheckCircle, Download, FileSpreadsheet, FileText, Save, Upload} from 'lucide-react';
import {Button} from './Button';
import {Modal} from './Modal';
import {Application} from '../../types/application.types';
import {formatDate} from '../../utils/formatters';

interface ExportImportProps {
    applications: Application[];
    onImport: (applications: Application[]) => Promise<void>;
    onBackup: () => Promise<void>;
}

type ExportFormat = 'json' | 'csv' | 'pdf';

export const ExportImport: React.FC<ExportImportProps> = ({
                                                              applications,
                                                              onImport,
                                                              onBackup
                                                          }) => {
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('json');
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importPreview, setImportPreview] = useState<Application[]>([]);
    const [importError, setImportError] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            switch (exportFormat) {
                case 'json':
                    await exportToJSON();
                    break;
                case 'csv':
                    await exportToCSV();
                    break;
                case 'pdf':
                    await exportToPDF();
                    break;
            }
            setShowExportModal(false);
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsExporting(false);
        }
    };

    const exportToJSON = async () => {
        const dataStr = JSON.stringify(applications, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        // FIXED: Convert Date to ISO string before passing to formatDate
        downloadFile(dataBlob, `job-applications-${formatDate(new Date().toISOString())}.json`);
    };

    const exportToCSV = async () => {
        const headers = [
            'Company', 'Position', 'Date Applied', 'Status', 'Type', 'Location',
            'Salary', 'Job Source', 'Job URL', 'Notes'
        ];

        const csvContent = [
            headers.join(','),
            ...applications.map(app => [
                `"${app.company || ''}"`,
                `"${app.position || ''}"`,
                // FIXED: Pass app.dateApplied string directly to formatDate
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

        const dataBlob = new Blob([csvContent], {type: 'text/csv'});
        // FIXED: Convert Date to ISO string before passing to formatDate
        downloadFile(dataBlob, `job-applications-${formatDate(new Date().toISOString())}.csv`);
    };

    const exportToPDF = async () => {
        // Note: In a real implementation, you'd use a library like jsPDF
        // For now, we'll export as text that could be converted to PDF
        const textContent = applications.map(app =>
            `Company: ${app.company}\n` +
            `Position: ${app.position}\n` +
            // FIXED: Pass app.dateApplied string directly to formatDate
            `Date Applied: ${formatDate(app.dateApplied)}\n` +
            `Status: ${app.status}\n` +
            `Type: ${app.type}\n` +
            `Location: ${app.location || 'N/A'}\n` +
            `Salary: ${app.salary || 'N/A'}\n` +
            `Job Source: ${app.jobSource || 'N/A'}\n` +
            `Job URL: ${app.jobUrl || 'N/A'}\n` +
            `Notes: ${app.notes || 'N/A'}\n` +
            '\n---\n\n'
        ).join('');

        const dataBlob = new Blob([textContent], {type: 'text/plain'});
        // FIXED: Convert Date to ISO string before passing to formatDate
        downloadFile(dataBlob, `job-applications-${formatDate(new Date().toISOString())}.txt`);
    };

    const downloadFile = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImportFile(file);
            setImportError('');
            parseImportFile(file);
        }
    };

    const parseImportFile = async (file: File) => {
        try {
            const text = await file.text();

            if (file.name.endsWith('.json')) {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    // Validate the structure
                    const validApplications = data.filter(isValidApplication);
                    setImportPreview(validApplications);
                    if (validApplications.length !== data.length) {
                        setImportError(`${data.length - validApplications.length} invalid entries were filtered out.`);
                    }
                } else {
                    setImportError('Invalid JSON format. Expected an array of applications.');
                }
            } else if (file.name.endsWith('.csv')) {
                const applications = parseCSV(text);
                setImportPreview(applications);
            } else {
                setImportError('Unsupported file format. Please use JSON or CSV files.');
            }
        } catch (error) {
            setImportError('Failed to parse file. Please check the file format.');
        }
    };

    const parseCSV = (csvText: string): Application[] => {
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim().toLowerCase());
        const applications: Application[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());

            if (values.length >= 3) { // Minimum required fields
                const app: Partial<Application> = {
                    id: `import-${Date.now()}-${i}`,
                    company: values[headers.indexOf('company')] || '',
                    position: values[headers.indexOf('position')] || '',
                    dateApplied: values[headers.indexOf('date applied')] || new Date().toISOString().split('T')[0],
                    status: (values[headers.indexOf('status')] as any) || 'Applied',
                    type: (values[headers.indexOf('type')] as any) || 'Remote',
                    location: values[headers.indexOf('location')] || '',
                    salary: values[headers.indexOf('salary')] || '',
                    jobSource: values[headers.indexOf('job source')] || '',
                    jobUrl: values[headers.indexOf('job url')] || '',
                    notes: values[headers.indexOf('notes')] || '',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                if (isValidApplication(app)) {
                    applications.push(app as Application);
                }
            }
        }

        return applications;
    };

    const isValidApplication = (app: any): app is Application => {
        return (
            app &&
            typeof app === 'object' &&
            typeof app.company === 'string' &&
            typeof app.position === 'string' &&
            app.company.trim() !== '' &&
            app.position.trim() !== ''
        );
    };

    const handleImport = async () => {
        if (importPreview.length === 0) return;

        setIsImporting(true);
        try {
            await onImport(importPreview);
            setShowImportModal(false);
            setImportFile(null);
            setImportPreview([]);
            setImportError('');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error) {
            setImportError('Failed to import applications. Please try again.');
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2"
            >
                <Download className="h-4 w-4"/>
                Export
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportModal(true)}
                className="flex items-center gap-2"
            >
                <Upload className="h-4 w-4"/>
                Import
            </Button>

            <Button
                variant="outline"
                size="sm"
                onClick={onBackup}
                className="flex items-center gap-2"
            >
                <Save className="h-4 w-4"/>
                Backup
            </Button>

            {/* Export Modal */}
            <Modal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Export Applications"
                size="md"
            >
                <div className="space-y-6">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Export {applications.length} applications in your preferred format.
                        </p>

                        <div className="space-y-3">
                            <label
                                className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="json"
                                    checked={exportFormat === 'json'}
                                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                                    className="mr-3"
                                />
                                <FileText className="h-5 w-5 text-blue-500 mr-3"/>
                                <div>
                                    <div className="font-medium">JSON</div>
                                    <div className="text-sm text-gray-500">Complete data with all fields</div>
                                </div>
                            </label>

                            <label
                                className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="csv"
                                    checked={exportFormat === 'csv'}
                                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                                    className="mr-3"
                                />
                                <FileSpreadsheet className="h-5 w-5 text-green-500 mr-3"/>
                                <div>
                                    <div className="font-medium">CSV</div>
                                    <div className="text-sm text-gray-500">Spreadsheet compatible format</div>
                                </div>
                            </label>

                            <label
                                className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                <input
                                    type="radio"
                                    name="exportFormat"
                                    value="pdf"
                                    checked={exportFormat === 'pdf'}
                                    onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                                    className="mr-3"
                                />
                                <FileText className="h-5 w-5 text-red-500 mr-3"/>
                                <div>
                                    <div className="font-medium">Text/PDF</div>
                                    <div className="text-sm text-gray-500">Human-readable format</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <Button
                            variant="outline"
                            onClick={() => setShowExportModal(false)}
                            disabled={isExporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2"
                        >
                            {isExporting ? (
                                <>
                                    <div
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4"/>
                                    Export {exportFormat.toUpperCase()}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Import Modal */}
            <Modal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
                title="Import Applications"
                size="lg"
            >
                <div className="space-y-6">
                    <div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Import applications from a JSON or CSV file. Supported formats:
                        </p>
                        <ul className="text-sm text-gray-500 dark:text-gray-400 list-disc list-inside space-y-1 mb-4">
                            <li>JSON: Exported from this application</li>
                            <li>CSV: With columns for Company, Position, Date Applied, etc.</li>
                        </ul>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select File
                        </label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json,.csv"
                            onChange={handleFileSelect}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {importError && (
                        <div
                            className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"/>
                            <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                {importError}
                            </div>
                        </div>
                    )}

                    {importPreview.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500"/>
                                Preview ({importPreview.length} applications)
                            </h4>
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 max-h-64 overflow-y-auto">
                                <div className="space-y-2">
                                    {importPreview.slice(0, 5).map((app, index) => (
                                        <div key={index} className="text-sm">
                                            <span className="font-medium">{app.company}</span> - {app.position}
                                            {/* FIXED: Pass app.dateApplied string directly to formatDate */}
                                            <span className="text-gray-500 ml-2">({formatDate(app.dateApplied)})</span>
                                        </div>
                                    ))}
                                    {importPreview.length > 5 && (
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            ... and {importPreview.length - 5} more
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <Button
                            variant="outline"
                            onClick={() => setShowImportModal(false)}
                            disabled={isImporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={isImporting || importPreview.length === 0}
                            className="flex items-center gap-2"
                        >
                            {isImporting ? (
                                <>
                                    <div
                                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Importing...
                                </>
                            ) : (
                                <>
                                    <Upload className="h-4 w-4"/>
                                    Import {importPreview.length} Application{importPreview.length !== 1 ? 's' : ''}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};