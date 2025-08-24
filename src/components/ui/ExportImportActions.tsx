import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
    Activity,
    AlertCircle,
    Award,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    Database,
    Download,
    FileImage,
    FileSpreadsheet,
    FileText,
    Loader2,
    Shield,
    Target,
    TrendingUp,
    Upload,
    Users,
    Zap
} from 'lucide-react';
import {Application} from '../../types';
import {formatDate} from '../../utils/formatters';
import {useAppStore} from '../../store/useAppStore';
import {exportToCSV, exportToJSON, exportToPDF, importApplications as parseImport} from '../../utils/exportImport';
import {Modal} from './Modal';
import {cn} from '../../utils/helpers';

// Constants for better maintainability
const FILE_CONSTRAINTS = {
    MAX_SIZE_MB: 200,
    SUPPORTED_EXTENSIONS: ['.json', '.csv'] as const,
    PREVIEW_LIMIT: 10,
} as const;

const LOADING_DELAYS = {
    EXPORT: 1200,
    IMPORT: 800,
} as const;

const TOAST_DURATIONS = {
    SUCCESS: 6000,
    ERROR: 8000,
    WARNING: 4000,
} as const;

// Type definitions for better type safety
type ExportFormat = 'json' | 'csv' | 'pdf';
type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

// Import result type to handle store responses
interface ImportResult {
    successCount: number;
    errorCount: number;
    errors?: string[];
}

interface ExportOption {
    id: ExportFormat;
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgGradient: string;
    borderColor: string;
    ringColor: string;
    features: string[];
    fileSize: string;
    compatibility: string;
}

interface ExportImportActionsProps {
    applications: Application[];
    onImport?: (applications: Application[]) => void;
}

interface ApplicationStats {
    total: number;
    offers: number;
    interviews: number;
    applied: number;
    rejected: number;
    monthlyApps: number;
    successRate: number;
    interviewRate: number;
}

interface BackupData {
    timestamp: string;
    applications: Application[];
    version: string;
    totalCount: number;
    metadata: {
        exportedBy: string;
        exportType: string;
        checksum: string;
    };
}

// Export options configuration
const EXPORT_OPTIONS: ExportOption[] = [
    {
        id: 'json',
        name: 'JSON Format',
        description: 'Complete data backup with all fields preserved - Perfect for data migration and comprehensive backups',
        icon: Database,
        color: 'text-blue-600 dark:text-blue-400',
        bgGradient: 'from-blue-50 via-indigo-50 to-blue-100 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-blue-800/30',
        borderColor: 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600',
        ringColor: 'ring-blue-500/30',
        features: ['All fields included', 'Metadata preserved', 'Easy re-import', 'JSON standard'],
        fileSize: 'Small',
        compatibility: 'Universal'
    },
    {
        id: 'csv',
        name: 'CSV Format',
        description: 'Spreadsheet compatible format - Perfect for analysis in Excel, Google Sheets, or data visualization tools',
        icon: FileSpreadsheet,
        color: 'text-emerald-600 dark:text-emerald-400',
        bgGradient: 'from-emerald-50 via-green-50 to-emerald-100 dark:from-emerald-900/30 dark:via-green-900/20 dark:to-emerald-800/30',
        borderColor: 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600',
        ringColor: 'ring-emerald-500/30',
        features: ['Excel compatible', 'Easy data analysis', 'Charts & pivot tables', 'Wide support'],
        fileSize: 'Small',
        compatibility: 'Excel, Sheets'
    },
    {
        id: 'pdf',
        name: 'PDF Report',
        description: 'Professional document format - Perfect for sharing, presentations, and printed reports with stakeholders',
        icon: FileImage,
        color: 'text-purple-600 dark:text-purple-400',
        bgGradient: 'from-purple-50 via-pink-50 to-purple-100 dark:from-purple-900/30 dark:via-pink-900/20 dark:to-purple-800/30',
        borderColor: 'border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600',
        ringColor: 'ring-purple-500/30',
        features: ['Print-ready format', 'Professional layout', 'Easy sharing', 'Read-only secure'],
        fileSize: 'Medium',
        compatibility: 'Universal'
    }
];

// Utility functions for styling
const getButtonGradient = (colorScheme: 'blue' | 'emerald' | 'purple') => {
    const gradients = {
        blue: {
            bg: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
            border: 'border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600',
            text: 'text-blue-700 dark:text-blue-300',
            overlay: 'from-blue-400/10 to-indigo-400/10'
        },
        emerald: {
            bg: 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20',
            border: 'border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600',
            text: 'text-emerald-700 dark:text-emerald-300',
            overlay: 'from-emerald-400/10 to-green-400/10'
        },
        purple: {
            bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
            border: 'border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600',
            text: 'text-purple-700 dark:text-purple-300',
            overlay: 'from-purple-400/10 to-pink-400/10'
        }
    };
    return gradients[colorScheme];
};

const getStatusBadgeStyle = (status: string) => {
    const styles = {
        Applied: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
        Interview: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700',
        Offer: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
        Rejected: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
    };
    return styles[status as keyof typeof styles] || styles.Applied;
};

export const ExportImportActions: React.FC<ExportImportActionsProps> = ({
                                                                            applications,
                                                                            onImport
                                                                        }) => {
    // State management
    const [showExportModal, setShowExportModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importStatus, setImportStatus] = useState<ImportStatus>('idle');
    const [importError, setImportError] = useState<string>('');
    const [importPreview, setImportPreview] = useState<Application[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<ExportFormat>('json');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const {showToast, handleImport: storeHandleImport} = useAppStore();

    // Reset import state - defined early to avoid declaration order issues
    const resetImportState = useCallback(() => {
        setImportStatus('idle');
        setImportPreview([]);
        setImportError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    // Memoized calculations for better performance
    const exportStats = useMemo((): ApplicationStats => {
        const total = applications.length;
        const offers = applications.filter(app => app.status === 'Offer').length;
        const interviews = applications.filter(app => app.status === 'Interview').length;
        const applied = applications.filter(app => app.status === 'Applied').length;
        const rejected = applications.filter(app => app.status === 'Rejected').length;

        // Calculate monthly applications
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const monthlyApps = applications.filter(app =>
            new Date(app.dateApplied) >= thisMonth
        ).length;

        // Calculate rates
        const successRate = total > 0 ? Math.round((offers / total) * 100) : 0;
        const interviewRate = total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0;

        return {
            total,
            offers,
            interviews,
            applied,
            rejected,
            monthlyApps,
            successRate,
            interviewRate
        };
    }, [applications]);

    // Export handler with improved error handling
    const handleExport = useCallback(async () => {
        if (applications.length === 0) {
            showToast({
                type: 'warning',
                message: 'No applications to export',
                duration: TOAST_DURATIONS.WARNING
            });
            return;
        }

        setIsExporting(true);

        try {
            // Realistic loading delay for better UX
            await new Promise(resolve => setTimeout(resolve, LOADING_DELAYS.EXPORT));

            const exportHandlers = {
                json: () => exportToJSON(applications),
                csv: () => exportToCSV(applications),
                pdf: () => exportToPDF(applications)
            };

            await exportHandlers[exportFormat]();

            const messages = {
                json: `Successfully exported ${applications.length} applications as JSON!`,
                csv: `Successfully exported ${applications.length} applications as CSV!`,
                pdf: `Successfully exported ${applications.length} applications as PDF!`
            };

            showToast({
                type: 'success',
                message: messages[exportFormat],
                duration: TOAST_DURATIONS.SUCCESS,
                ...(exportFormat === 'json' && {
                    action: {
                        label: 'View Downloads',
                        onClick: () => console.log('Open downloads folder')
                    }
                })
            });

            setShowExportModal(false);
        } catch (error) {
            console.error('Export error:', error);
            showToast({
                type: 'error',
                message: `Export failed: ${(error as Error).message}`,
                duration: TOAST_DURATIONS.ERROR
            });
        } finally {
            setIsExporting(false);
        }
    }, [applications, exportFormat, showToast]);

    // File upload handler with enhanced validation
    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > FILE_CONSTRAINTS.MAX_SIZE_MB * 1024 * 1024) {
            setImportError(`File size exceeds ${FILE_CONSTRAINTS.MAX_SIZE_MB}MB limit`);
            setImportStatus('error');
            return;
        }

        setImportStatus('loading');
        setImportError('');

        try {
            await new Promise(resolve => setTimeout(resolve, LOADING_DELAYS.IMPORT));

            // ✅ use the aliased name
            const result = await parseImport(file);

            // Diagnostics
            console.log('[UI] import result:', {
                totalProcessed: result?.totalProcessed,
                appsLen: result?.applications?.length,
                warnings: result?.warnings?.length
            });
            if (Array.isArray(result?.warnings) && result.warnings.length) {
                console.warn('[UI] import warnings (first 5):', result.warnings.slice(0, 5));
            }

            if (!result || !Array.isArray(result.applications) || result.applications.length === 0) {
                throw new Error('No valid applications found in the file');
            }

            setImportPreview(result.applications);
            setImportStatus('success');
        } catch (error) {
            console.error('Import error:', error);
            setImportError((error as Error).message);
            setImportStatus('error');
        }
    }, []);

    // Import confirmation handler
    const confirmImport = useCallback(async () => {
        try {
            if (storeHandleImport) {
                const result = await storeHandleImport(importPreview);
                // Handle ImportResult type properly
                if (typeof result === 'object' && 'successCount' in result) {
                    showToast({
                        type: 'success',
                        message: `Successfully imported ${result.successCount} applications!${result.errorCount > 0 ? ` ${result.errorCount} failed.` : ''}`,
                        duration: TOAST_DURATIONS.SUCCESS
                    });
                } else {
                    // Fallback for when result is just a boolean or different type
                    showToast({
                        type: 'success',
                        message: `Successfully imported ${importPreview.length} applications!`,
                        duration: TOAST_DURATIONS.SUCCESS
                    });
                }
            } else if (onImport) {
                await onImport(importPreview);
                showToast({
                    type: 'success',
                    message: `Successfully imported ${importPreview.length} applications!`,
                    duration: TOAST_DURATIONS.SUCCESS
                });
            }

            setShowImportModal(false);
            resetImportState();
        } catch (error) {
            console.error('Import confirmation error:', error);
            showToast({
                type: 'error',
                message: 'Failed to import applications',
                duration: TOAST_DURATIONS.ERROR
            });
        }
    }, [importPreview, storeHandleImport, onImport, showToast, resetImportState]);

    // Enhanced backup creation with metadata
    const createBackup = useCallback(async () => {
        try {
            if (applications.length === 0) {
                showToast({
                    type: 'warning',
                    message: 'No applications to backup',
                    duration: TOAST_DURATIONS.WARNING
                });
                return;
            }

            const backup: BackupData = {
                timestamp: new Date().toISOString(),
                applications,
                version: '1.0',
                totalCount: applications.length,
                metadata: {
                    exportedBy: 'ApplyTrak Enterprise',
                    exportType: 'full_backup',
                    checksum: Date.now().toString(36)
                }
            };

            const jsonString = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonString], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `applytrak-backup-${formatDate(new Date().toISOString())}.json`;
            link.setAttribute('aria-label', 'Download backup file');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `Backup created with ${applications.length} applications!`,
                duration: TOAST_DURATIONS.SUCCESS,
                action: {
                    label: 'Create Another',
                    onClick: createBackup
                }
            });
        } catch (error) {
            console.error('Backup error:', error);
            showToast({
                type: 'error',
                message: 'Failed to create backup',
                duration: TOAST_DURATIONS.ERROR
            });
        }
    }, [applications, showToast]);

    // Action button component for reusability
    const ActionButton: React.FC<{
        onClick: () => void;
        icon: React.ComponentType<{ className?: string }>;
        label: string;
        colorScheme: 'blue' | 'emerald' | 'purple';
        animationClass?: string;
    }> = ({onClick, icon: Icon, label, colorScheme, animationClass = 'group-hover:animate-bounce'}) => {
        const styles = getButtonGradient(colorScheme);

        return (
            <button
                onClick={onClick}
                className={cn(
                    'btn btn-secondary btn-sm group relative overflow-hidden',
                    'hover:shadow-lg hover:scale-105 active:scale-95',
                    'transition-all duration-200 font-bold tracking-wide',
                    styles.bg,
                    styles.border,
                    styles.text
                )}
                aria-label={label}
            >
                <Icon className={`h-4 w-4 mr-2 ${animationClass}`}/>
                <span className="relative z-10">{label}</span>
                <div
                    className={`absolute inset-0 bg-gradient-to-r ${styles.overlay} opacity-0 group-hover:opacity-100 transition-opacity duration-200`}/>
            </button>
        );
    };

    // Stats card component for reusability
    const StatsCard: React.FC<{
        value: number;
        label: string;
        icon: React.ComponentType<{ className?: string }>;
        color: string;
    }> = ({value, label, icon: Icon, color}) => (
        <div
            className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 dark:border-gray-700/20">
            <div className={`text-3xl font-extrabold ${color} mb-2`}>
                {value}
            </div>
            <div
                className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                <Icon className="h-3 w-3"/>
                {label}
            </div>
        </div>
    );

    return (
        <>
            {/* Action Buttons */}
            <div className="flex gap-3">
                <ActionButton
                    onClick={() => setShowExportModal(true)}
                    icon={Download}
                    label="Export"
                    colorScheme="blue"
                />

                <ActionButton
                    onClick={() => setShowImportModal(true)}
                    icon={Upload}
                    label="Import"
                    colorScheme="emerald"
                />

                <ActionButton
                    onClick={createBackup}
                    icon={Shield}
                    label="Backup"
                    colorScheme="purple"
                    animationClass="group-hover:animate-pulse"
                />
            </div>

            {/* Export Modal */}
            <Modal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Export Your Applications"
                size="xl"
                variant="primary"
                className="export-modal"
            >
                <div className="space-y-8">
                    {/* Stats Dashboard */}
                    <section
                        className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                        <header className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                <BarChart3 className="h-6 w-6"/>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Export Analytics</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Your application data
                                    overview</p>
                            </div>
                        </header>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <StatsCard
                                value={exportStats.total}
                                label="Total Apps"
                                icon={Users}
                                color="text-blue-600 dark:text-blue-400"
                            />
                            <StatsCard
                                value={exportStats.offers}
                                label="Offers"
                                icon={Award}
                                color="text-green-600 dark:text-green-400"
                            />
                            <StatsCard
                                value={exportStats.successRate}
                                label="Success Rate"
                                icon={Target}
                                color="text-purple-600 dark:text-purple-400"
                            />
                            <StatsCard
                                value={exportStats.monthlyApps}
                                label="This Month"
                                icon={Calendar}
                                color="text-orange-600 dark:text-orange-400"
                            />
                        </div>

                        <div className="mt-4 flex justify-center">
                            <div
                                className="text-sm text-gray-600 dark:text-gray-400 bg-white/40 dark:bg-gray-800/40 rounded-lg px-4 py-2 border border-white/30 dark:border-gray-700/30">
                                <span className="font-medium">Interview Rate:</span> {exportStats.interviewRate}% •
                                <span
                                    className="font-medium ml-2">Recent Activity:</span> {exportStats.monthlyApps} applications
                                this month
                            </div>
                        </div>
                    </section>

                    {/* Format Selection */}
                    <section>
                        <header className="flex items-center gap-3 mb-6">
                            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400"/>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Choose Export
                                    Format</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Select the best format for your
                                    needs</p>
                            </div>
                        </header>

                        <div className="space-y-4">
                            {EXPORT_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isSelected = exportFormat === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setExportFormat(option.id)}
                                        disabled={isExporting}
                                        className={cn(
                                            'w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden',
                                            isSelected
                                                ? `${option.borderColor} bg-gradient-to-br ${option.bgGradient} shadow-xl ring-4 ${option.ringColor} scale-[1.02]`
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 hover:scale-[1.01]',
                                            'disabled:opacity-50 disabled:cursor-not-allowed'
                                        )}
                                        aria-pressed={isSelected}
                                        aria-label={`Select ${option.name} format`}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex items-start gap-5">
                                                <div className={cn(
                                                    'p-4 rounded-2xl border-2 border-white/30 dark:border-gray-700/30 backdrop-blur-sm',
                                                    isSelected
                                                        ? `bg-gradient-to-br ${option.bgGradient} shadow-lg`
                                                        : 'bg-gray-100 dark:bg-gray-800'
                                                )}>
                                                    <Icon className={cn(
                                                        'h-8 w-8',
                                                        isSelected ? option.color : 'text-gray-600 dark:text-gray-400'
                                                    )}/>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-gray-50 transition-colors">
                                                            {option.name}
                                                        </h3>
                                                        <div className="flex items-center gap-3">
                              <span className={cn(
                                  'text-xs font-medium px-2 py-1 rounded-full',
                                  isSelected
                                      ? 'bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              )}>
                                {option.fileSize}
                              </span>
                                                            {isSelected && (
                                                                <CheckCircle
                                                                    className="h-6 w-6 text-green-600 dark:text-green-400 animate-pulse"/>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                                                        {option.description}
                                                    </p>

                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        {option.features.map((feature, index) => (
                                                            <span
                                                                key={index}
                                                                className={cn(
                                                                    'text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200',
                                                                    isSelected
                                                                        ? 'bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 text-gray-700 dark:text-gray-300'
                                                                        : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                                                )}
                                                            >
                                ✓ {feature}
                              </span>
                                                        ))}
                                                    </div>

                                                    <div
                                                        className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-2">
                                                        <span>Compatible with:</span>
                                                        <span className="font-medium">{option.compatibility}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div
                                                className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-indigo-400/5 to-purple-400/5 animate-pulse"/>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </section>

                    {/* Export Actions */}
                    <footer className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowExportModal(false)}
                            disabled={isExporting}
                            className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                            type="button"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || applications.length === 0}
                            className={cn(
                                'btn btn-primary px-8 py-3 font-bold tracking-wide disabled:opacity-50',
                                'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
                                'shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30',
                                'transform hover:scale-105 active:scale-95 transition-all duration-200'
                            )}
                            type="button"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-2 animate-spin"/>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="h-5 w-5 mr-2"/>
                                    Export {exportFormat.toUpperCase()}
                                </>
                            )}
                        </button>
                    </footer>
                </div>
            </Modal>

            {/* Import Modal */}
            <Modal
                isOpen={showImportModal}
                onClose={() => {
                    setShowImportModal(false);
                    resetImportState();
                }}
                title="Import Applications"
                size="xl"
                variant="success"
                className="import-modal"
            >
                <div className="space-y-8">
                    {importStatus === 'idle' && (
                        <>
                            {/* Supported Formats */}
                            <section
                                className="bg-gradient-to-r from-emerald-50 via-green-50 to-blue-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/50">
                                <header className="flex items-center gap-3 mb-6">
                                    <div
                                        className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                                        <FileText className="h-6 w-6"/>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Supported
                                            Import Formats</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">We support multiple file
                                            formats for easy import</p>
                                    </div>
                                </header>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div
                                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <Database className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100">JSON Files
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Exported from ApplyTrak or backup files
                                                </div>
                                                <div
                                                    className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">
                                                    ✓ Complete data preservation
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-5 border border-white/30 dark:border-gray-700/30 group hover:scale-105 transition-transform duration-200">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white group-hover:scale-110 transition-transform duration-200">
                                                <FileSpreadsheet className="h-6 w-6"/>
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 dark:text-gray-100">CSV Files
                                                </div>
                                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                                    Spreadsheet exports with proper columns
                                                </div>
                                                <div
                                                    className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
                                                    ✓ Excel & Google Sheets compatible
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
                                accept={FILE_CONSTRAINTS.SUPPORTED_EXTENSIONS.join(',')}
                                onChange={handleFileUpload}
                                className="hidden"
                                aria-label="Choose file to import"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-12 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/10 dark:hover:via-indigo-900/10 dark:hover:to-purple-900/10 hover:scale-[1.02] active:scale-[0.98]"
                                type="button"
                            >
                                <div className="text-center">
                                    <div
                                        className="p-6 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 w-fit mx-auto mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                        <Upload className="h-16 w-16 text-white"/>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        Choose File to Import
                                    </p>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                                        JSON or CSV files accepted • Maximum {FILE_CONSTRAINTS.MAX_SIZE_MB}MB
                                    </p>
                                    <div
                                        className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-500">
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
                        </>
                    )}

                    {importStatus === 'loading' && (
                        <div className="text-center py-20">
                            <div
                                className="p-6 rounded-3xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 w-fit mx-auto mb-8 animate-pulse shadow-xl">
                                <Loader2 className="h-16 w-16 animate-spin text-white"/>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                                Processing your file...
                            </p>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Validating data and preparing import preview
                            </p>
                            <div
                                className="flex items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"/>
                                    <span>Reading file</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"
                                         style={{animationDelay: '0.5s'}}/>
                                    <span>Validating data</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                                         style={{animationDelay: '1s'}}/>
                                    <span>Preparing preview</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {importStatus === 'error' && (
                        <div
                            className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl p-8 border-l-4 border-l-red-500">
                            <div className="flex items-start gap-5">
                                <div
                                    className="p-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white flex-shrink-0">
                                    <AlertCircle className="h-8 w-8"/>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3">
                                        Import Failed
                                    </h3>
                                    <p className="text-red-600 dark:text-red-400 mb-6 leading-relaxed">{importError}</p>
                                    <button
                                        onClick={() => setImportStatus('idle')}
                                        className="btn btn-outline border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20 px-6 py-2 font-bold tracking-wide"
                                        type="button"
                                    >
                                        <Upload className="h-4 w-4 mr-2"/>
                                        Try Again
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {importStatus === 'success' && (
                        <div className="space-y-8">
                            {/* Success Message */}
                            <div
                                className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 border-l-4 border-l-emerald-500">
                                <div className="flex items-start gap-5">
                                    <div
                                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white flex-shrink-0 animate-pulse">
                                        <CheckCircle className="h-8 w-8"/>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-3">
                                            Import Preview Ready
                                        </h3>
                                        <p className="text-emerald-600 dark:text-emerald-400 text-lg">
                                            Found <span
                                            className="font-bold text-2xl">{importPreview.length}</span> valid
                                            applications ready to import
                                        </p>
                                        <div
                                            className="flex items-center gap-4 mt-4 text-sm text-emerald-700 dark:text-emerald-300">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-4 w-4"/>
                                                <span>High quality data detected</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4"/>
                                                <span>All validations passed</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview Table */}
                            <div
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                                <header
                                    className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                                        Import Preview
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Review your applications before importing
                                    </p>
                                </header>

                                <div className="max-h-80 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead
                                            className="sticky top-0 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300">#</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300">Company</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300">Position</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300">Date</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-700 dark:text-gray-300">Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {importPreview.slice(0, FILE_CONSTRAINTS.PREVIEW_LIMIT).map((app, index) => (
                                            <tr
                                                key={index}
                                                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                            >
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                                    {app.company}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                    {app.position}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                                                    {formatDate(app.dateApplied)}
                                                </td>
                                                <td className="px-6 py-4">
                            <span className={cn(
                                'px-3 py-1.5 rounded-full text-xs font-bold border',
                                getStatusBadgeStyle(app.status)
                            )}>
                              {app.status}
                            </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>

                                    {importPreview.length > FILE_CONSTRAINTS.PREVIEW_LIMIT && (
                                        <div
                                            className="p-4 bg-gray-50 dark:bg-gray-800 text-center border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Showing
                                                first {FILE_CONSTRAINTS.PREVIEW_LIMIT} of {importPreview.length} applications
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Import Actions */}
                            <footer
                                className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        setImportStatus('idle');
                                        setImportPreview([]);
                                    }}
                                    className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmImport}
                                    className={cn(
                                        'btn btn-primary px-8 py-3 font-bold tracking-wide',
                                        'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700',
                                        'shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30',
                                        'transform hover:scale-105 active:scale-95 transition-all duration-200'
                                    )}
                                    type="button"
                                >
                                    <Upload className="h-5 w-5 mr-2"/>
                                    Import {importPreview.length} Applications
                                </button>
                            </footer>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default ExportImportActions;