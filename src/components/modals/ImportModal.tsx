// src/components/modals/ImportModal.tsx
import React, { useRef, useState } from 'react';
import { 
    Upload, 
    FileText, 
    Database, 
    FileSpreadsheet, 
    Clock, 
    Shield, 
    Activity,
    X,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import * as XLSX from 'xlsx';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
    const { bulkAddApplications } = useAppStore();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importStatus, setImportStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [importedCount, setImportedCount] = useState(0);
    const [errorMessage, setErrorMessage] = useState('');
    const [fileName, setFileName] = useState('');
    const [importSummary, setImportSummary] = useState<{total: number; withNotes: number; withAttachments: number} | null>(null);

    if (!isOpen) return null;

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setImportStatus('loading');
        setErrorMessage('');

        try {
            let applications: any[] = [];
            
            if (file.name.toLowerCase().endsWith('.json')) {
                // Handle JSON files
                const text = await file.text();
                const data = JSON.parse(text);
                
                // Handle different JSON formats
                if (Array.isArray(data)) {
                    // Direct array of applications
                    applications = data.map(app => ({
                        company: app.company || app.Company || '',
                        position: app.position || app.Position || '',
                        dateApplied: app.dateApplied || app.dateApplied || app.date || app.Date || new Date().toISOString().split('T')[0],
                        type: app.type || app.Type || 'Remote',
                        status: app.status || app.Status || 'Applied',
                        location: app.location || app.Location || '',
                        salary: app.salary || app.Salary || '',
                        jobSource: app.jobSource || app.source || app.Source || app.jobsource || '',
                        jobUrl: app.jobUrl || app.url || app.Url || app.joburl || '',
                        notes: app.notes || app.Notes || '',
                        attachments: app.attachments || app.Attachments || []
                    }));
                } else if (data.applications && Array.isArray(data.applications)) {
                    // Object with applications array
                    applications = data.applications.map((app: any) => ({
                        company: app.company || app.Company || '',
                        position: app.position || app.Position || '',
                        dateApplied: app.dateApplied || app.dateApplied || app.date || app.Date || new Date().toISOString().split('T')[0],
                        type: app.type || app.Type || 'Remote',
                        status: app.status || app.Status || 'Applied',
                        location: app.location || app.Location || '',
                        salary: app.salary || app.Salary || '',
                        jobSource: app.jobSource || app.source || app.Source || app.jobsource || '',
                        jobUrl: app.jobUrl || app.url || app.Url || app.joburl || '',
                        notes: app.notes || app.Notes || '',
                        attachments: app.attachments || app.Attachments || []
                    }));
                }
            } else if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
                // Handle Excel files
                const arrayBuffer = await file.arrayBuffer();
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    throw new Error('Excel file must have at least a header row and one data row');
                }
                
                const headers = jsonData[0] as string[];
                const dataRows = jsonData.slice(1) as any[][];
                
                applications = dataRows.map(row => {
                    const app: any = {};
                    headers.forEach((header, index) => {
                        if (header && row[index] !== undefined) {
                            app[header.toLowerCase().trim()] = row[index];
                        }
                    });
                    
                    return {
                        company: app.company || app.Company || '',
                        position: app.position || app.Position || '',
                        dateApplied: app.dateapplied || app.dateapplied || app.date || app.Date || new Date().toISOString().split('T')[0],
                        type: app.type || app.Type || 'Remote',
                        status: app.status || app.Status || 'Applied',
                        location: app.location || app.Location || '',
                        salary: app.salary || app.Salary || '',
                        jobSource: app.jobSource || app.source || app.Source || app.jobsource || '',
                        jobUrl: app.jobUrl || app.url || app.Url || app.joburl || '',
                        notes: app.notes || app.Notes || '',
                        attachments: app.attachments || app.Attachments || []
                    };
                }).filter(app => app.company && app.position);
            } else {
                // Handle CSV files
                const text = await file.text();
                const lines = text.split('\n');
                const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                        const app: any = {};
                        headers.forEach((header, index) => {
                            app[header.toLowerCase()] = values[index] || '';
                        });
                        
                        if (app.company && app.position) {
                            applications.push({
                                company: app.company,
                                position: app.position,
                                dateApplied: app.dateapplied || app.date || new Date().toISOString().split('T')[0],
                                type: app.type || 'Remote',
                                status: app.status || 'Applied',
                                location: app.location || '',
                                salary: app.salary || '',
                                jobSource: app.source || app.jobsource || '',
                                jobUrl: app.url || app.joburl || '',
                                notes: app.notes || '',
                                attachments: [] // CSV doesn't support attachments, so empty array
                            });
                        }
                    }
                }
            }
            
            // Filter out invalid applications
            applications = applications.filter(app => app.company && app.position);
            
            // Log import details for debugging
            console.log('Import details:', {
                totalApplications: applications.length,
                sampleApplication: applications[0],
                fieldsWithNotes: applications.filter(app => app.notes && app.notes.trim()).length,
                fieldsWithAttachments: applications.filter(app => app.attachments && app.attachments.length > 0).length
            });
            
            if (applications.length > 0) {
                await bulkAddApplications(applications);
                setImportedCount(applications.length);
                
                // Count fields with data
                const withNotes = applications.filter(app => app.notes && app.notes.trim()).length;
                const withAttachments = applications.filter(app => app.attachments && app.attachments.length > 0).length;
                
                // Store import summary for display
                setImportSummary({
                    total: applications.length,
                    withNotes,
                    withAttachments
                });
                
                setImportStatus('success');
            } else {
                setErrorMessage('No valid applications found in the file. Please check the file format.');
                setImportStatus('error');
            }
        } catch (error) {
            console.error('Import error:', error);
            setErrorMessage('Failed to import applications. Please check the file format.');
            setImportStatus('error');
        }
    };

    const resetModal = () => {
        setImportStatus('idle');
        setImportedCount(0);
        setErrorMessage('');
        setFileName('');
        setImportSummary(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        resetModal();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Import Applications
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Import your job applications from JSON, CSV, or Excel files
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
                    {importStatus === 'idle' && (
                        <div className="space-y-8">
                            {/* Supported Formats */}
                            <section className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                                <header className="flex items-center gap-3 mb-6">
                                    <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                        <FileText className="h-6 w-6"/>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                            Supported Import Formats
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            We support multiple file formats for easy import
                                        </p>
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <Database className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100">JSON Files</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Exported from ApplyTrak or backup files
                                                </div>
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                                    ✓ Complete data preservation
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <FileSpreadsheet className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100">CSV Files</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Spreadsheet exports with proper columns
                                                </div>
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                                    ✓ Universal compatibility
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <Database className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100">Excel Files</div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Native Excel format support
                                                </div>
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                                    ✓ .xlsx & .xls supported
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* File Upload Area */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv,.xlsx,.xls"
                                onChange={handleFileUpload}
                                className="hidden"
                                aria-label="Choose file to import"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-12 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/10 dark:hover:to-purple-900/10 hover:scale-[1.02] active:scale-[0.98]"
                                type="button"
                            >
                                <div className="text-center">
                                    <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 w-fit mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                        <Upload className="h-16 w-16 text-white"/>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        Choose File to Import
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        JSON, CSV, or Excel files accepted • Maximum 50MB
                                    </p>
                                    <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4"/>
                                            <span>Quick processing</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Shield className="h-4 w-4"/>
                                            <span>Secure upload</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Activity className="h-4 w-4"/>
                                            <span>Auto-validation</span>
                                        </div>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {importStatus === 'loading' && (
                        <div className="text-center py-12">
                            <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-500 to-purple-600 w-fit mx-auto mb-6">
                                <Loader2 className="h-16 w-16 text-white animate-spin"/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Importing Applications
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400">
                                Processing {fileName}... Please wait.
                            </p>
                        </div>
                    )}

                    {importStatus === 'success' && (
                        <div className="text-center py-12">
                            <div className="p-6 rounded-3xl bg-gradient-to-r from-green-500 to-emerald-600 w-fit mx-auto mb-6">
                                <CheckCircle className="h-16 w-16 text-white"/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Import Successful!
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Successfully imported {importedCount} applications from {fileName}
                            </p>
                            {importSummary && (
                                <div className="text-sm text-gray-500 dark:text-gray-400 mb-6 space-y-1">
                                    <p>📝 Applications with notes: {importSummary.withNotes}</p>
                                    <p>📎 Applications with attachments: {importSummary.withAttachments}</p>
                                </div>
                            )}
                            <button
                                onClick={handleClose}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {importStatus === 'error' && (
                        <div className="text-center py-12">
                            <div className="p-6 rounded-3xl bg-gradient-to-r from-red-500 to-pink-600 w-fit mx-auto mb-6">
                                <AlertCircle className="h-16 w-16 text-white"/>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                                Import Failed
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                {errorMessage}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={resetModal}
                                    className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Try Again
                                </button>
                                <button
                                    onClick={handleClose}
                                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImportModal;
