// src/components/ui/ExportImportActions.tsx - 🚀 ENTERPRISE-GRADE ENHANCED VERSION
import React, {useCallback, useRef, useState} from 'react';
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
import {Application} from '../../types/application.types';
import {formatDate} from '../../utils/formatters';
import {useAppStore} from '../../store/useAppStore';
import {exportToCSV, exportToJSON, exportToPDF, importApplications} from '../../utils/exportImport';
import {Modal} from './Modal';
import {cn} from '../../utils/helpers';

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
    const {showToast, handleImport: storeHandleImport} = useAppStore();

    // 🎨 Enhanced export options with beautiful design
    const exportOptions = [
        {
            id: 'json' as const,
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
            id: 'csv' as const,
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
            id: 'pdf' as const,
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

    const handleExport = useCallback(async () => {
        if (applications.length === 0) {
            showToast({
                type: 'warning',
                message: 'No applications to export',
                duration: 4000
            });
            return;
        }

        setIsExporting(true);

        try {
            // Add realistic loading delay for better UX
            await new Promise(resolve => setTimeout(resolve, 1200));

            switch (exportFormat) {
                case 'json':
                    await exportToJSON(applications);
                    showToast({
                        type: 'success',
                        message: `🎉 Successfully exported ${applications.length} applications as JSON!`,
                        duration: 6000,
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
                        message: `📊 Successfully exported ${applications.length} applications as CSV!`,
                        duration: 6000
                    });
                    break;
                case 'pdf':
                    await exportToPDF(applications);
                    showToast({
                        type: 'success',
                        message: `📄 Successfully exported ${applications.length} applications as PDF!`,
                        duration: 6000
                    });
                    break;
            }
            setShowExportModal(false);
        } catch (error) {
            console.error('Export error:', error);
            showToast({
                type: 'error',
                message: `Export failed: ${(error as Error).message}`,
                duration: 8000
            });
        } finally {
            setIsExporting(false);
        }
    }, [applications, exportFormat, showToast]);

    const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    }, []);

    const confirmImport = useCallback(async () => {
        try {
            if (storeHandleImport) {
                const result = await storeHandleImport(importPreview);
                showToast({
                    type: 'success',
                    message: `🚀 Successfully imported ${result.successCount} applications!${result.errorCount > 0 ? ` ${result.errorCount} failed.` : ''}`,
                    duration: 6000
                });
            } else if (onImport) {
                await onImport(importPreview);
                showToast({
                    type: 'success',
                    message: `✅ Successfully imported ${importPreview.length} applications!`,
                    duration: 6000
                });
            }

            setShowImportModal(false);
            resetImportState();
        } catch (error) {
            console.error('Import confirmation error:', error);
            showToast({
                type: 'error',
                message: 'Failed to import applications',
                duration: 6000
            });
        }
    }, [importPreview, storeHandleImport, onImport, showToast]);

    const createBackup = useCallback(async () => {
        try {
            if (applications.length === 0) {
                showToast({
                    type: 'warning',
                    message: 'No applications to backup',
                    duration: 4000
                });
                return;
            }

            const backup = {
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
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `🛡️ Backup created with ${applications.length} applications!`,
                duration: 6000,
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
                duration: 6000
            });
        }
    }, [applications, showToast]);

    const getExportStats = useCallback(() => {
        const total = applications.length;
        const offers = applications.filter(app => app.status === 'Offer').length;
        const interviews = applications.filter(app => app.status === 'Interview').length;
        const applied = applications.filter(app => app.status === 'Applied').length;
        const rejected = applications.filter(app => app.status === 'Rejected').length;

        // Calculate additional insights
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const monthlyApps = applications.filter(app => new Date(app.dateApplied) >= thisMonth).length;

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

    const resetImportState = useCallback(() => {
        setImportStatus('idle');
        setImportPreview([]);
        setImportError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const stats = getExportStats();

    return (
        <>
            {/* 🎨 ENHANCED ACTION BUTTONS */}
            <div className="flex gap-3">
                <button
                    onClick={() => setShowExportModal(true)}
                    className={cn(
                        "btn btn-secondary btn-sm group relative overflow-hidden",
                        "hover:shadow-lg hover:scale-105 active:scale-95",
                        "transition-all duration-200 font-bold tracking-wide",
                        "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20",
                        "border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600",
                        "text-blue-700 dark:text-blue-300"
                    )}
                >
                    <Download className="h-4 w-4 mr-2 group-hover:animate-bounce"/>
                    <span className="relative z-10">Export</span>
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"/>
                </button>

                <button
                    onClick={() => setShowImportModal(true)}
                    className={cn(
                        "btn btn-secondary btn-sm group relative overflow-hidden",
                        "hover:shadow-lg hover:scale-105 active:scale-95",
                        "transition-all duration-200 font-bold tracking-wide",
                        "bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20",
                        "border-emerald-200 dark:border-emerald-700 hover:border-emerald-300 dark:hover:border-emerald-600",
                        "text-emerald-700 dark:text-emerald-300"
                    )}
                >
                    <Upload className="h-4 w-4 mr-2 group-hover:animate-bounce"/>
                    <span className="relative z-10">Import</span>
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-green-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"/>
                </button>

                <button
                    onClick={createBackup}
                    className={cn(
                        "btn btn-secondary btn-sm group relative overflow-hidden",
                        "hover:shadow-lg hover:scale-105 active:scale-95",
                        "transition-all duration-200 font-bold tracking-wide",
                        "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
                        "border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600",
                        "text-purple-700 dark:text-purple-300"
                    )}
                >
                    <Shield className="h-4 w-4 mr-2 group-hover:animate-pulse"/>
                    <span className="relative z-10">Backup</span>
                    <div
                        className="absolute inset-0 bg-gradient-to-r from-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"/>
                </button>
            </div>

            {/* 🚀 ENHANCED EXPORT MODAL */}
            <Modal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                title="Export Your Applications"
                size="xl"
                variant="primary"
                className="export-modal"
            >
                <div className="space-y-8">
                    {/* 📊 BEAUTIFUL STATS DASHBOARD */}
                    <div
                        className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-700/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                <BarChart3 className="h-6 w-6"/>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Export Analytics</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Your application data
                                    overview</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div
                                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 dark:border-gray-700/20">
                                <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-2">
                                    {stats.total}
                                </div>
                                <div
                                    className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                                    <Users className="h-3 w-3"/>
                                    Total Apps
                                </div>
                            </div>

                            <div
                                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 dark:border-gray-700/20">
                                <div className="text-3xl font-extrabold text-green-600 dark:text-green-400 mb-2">
                                    {stats.offers}
                                </div>
                                <div
                                    className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                                    <Award className="h-3 w-3"/>
                                    Offers
                                </div>
                            </div>

                            <div
                                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 dark:border-gray-700/20">
                                <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 mb-2">
                                    {stats.successRate}%
                                </div>
                                <div
                                    className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                                    <Target className="h-3 w-3"/>
                                    Success Rate
                                </div>
                            </div>

                            <div
                                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20 dark:border-gray-700/20">
                                <div className="text-3xl font-extrabold text-orange-600 dark:text-orange-400 mb-2">
                                    {stats.monthlyApps}
                                </div>
                                <div
                                    className="text-xs text-gray-600 dark:text-gray-400 font-medium uppercase tracking-wider flex items-center justify-center gap-1">
                                    <Calendar className="h-3 w-3"/>
                                    This Month
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex justify-center">
                            <div
                                className="text-sm text-gray-600 dark:text-gray-400 bg-white/40 dark:bg-gray-800/40 rounded-lg px-4 py-2 border border-white/30 dark:border-gray-700/30">
                                <span className="font-medium">Interview Rate:</span> {stats.interviewRate}% •
                                <span
                                    className="font-medium ml-2">Recent Activity:</span> {stats.monthlyApps} applications
                                this month
                            </div>
                        </div>
                    </div>

                    {/* 🎨 ENHANCED FORMAT SELECTION */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="h-6 w-6 text-amber-600 dark:text-amber-400"/>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Choose Export
                                    Format</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Select the best format for your
                                    needs</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {exportOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected = exportFormat === option.id;

                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => setExportFormat(option.id)}
                                        disabled={isExporting}
                                        className={cn(
                                            "w-full p-6 rounded-2xl border-2 transition-all duration-300 text-left group relative overflow-hidden",
                                            isSelected
                                                ? `${option.borderColor} bg-gradient-to-br ${option.bgGradient} shadow-xl ring-4 ${option.ringColor} scale-[1.02]`
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 hover:scale-[1.01]"
                                        )}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex items-start gap-5">
                                                <div className={cn(
                                                    "p-4 rounded-2xl border-2 border-white/30 dark:border-gray-700/30 backdrop-blur-sm",
                                                    isSelected
                                                        ? `bg-gradient-to-br ${option.bgGradient} shadow-lg`
                                                        : "bg-gray-100 dark:bg-gray-800"
                                                )}>
                                                    <Icon className={cn(
                                                        "h-8 w-8",
                                                        isSelected ? option.color : "text-gray-600 dark:text-gray-400"
                                                    )}/>
                                                </div>

                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-gray-800 dark:group-hover:text-gray-50 transition-colors">
                                                            {option.name}
                                                        </h4>
                                                        <div className="flex items-center gap-3">
                                                            <span className={cn(
                                                                "text-xs font-medium px-2 py-1 rounded-full",
                                                                isSelected
                                                                    ? "bg-white/60 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300"
                                                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
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
                                                                    "text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200",
                                                                    isSelected
                                                                        ? "bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 text-gray-700 dark:text-gray-300"
                                                                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
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
                    </div>

                    {/* 📋 EXPORT ACTIONS */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => setShowExportModal(false)}
                            disabled={isExporting}
                            className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || applications.length === 0}
                            className={cn(
                                "btn btn-primary px-8 py-3 font-bold tracking-wide disabled:opacity-50",
                                "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
                                "shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30",
                                "transform hover:scale-105 active:scale-95 transition-all duration-200"
                            )}
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
                    </div>
                </div>
            </Modal>

            {/* 🚀 ENHANCED IMPORT MODAL */}
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
                            {/* 📁 SUPPORTED FORMATS */}
                            <div
                                className="bg-gradient-to-r from-emerald-50 via-green-50 to-blue-50 dark:from-emerald-900/20 dark:via-green-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-emerald-200/50 dark:border-emerald-700/50">
                                <div className="flex items-center gap-3 mb-6">
                                    <div
                                        className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white">
                                        <FileText className="h-6 w-6"/>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">Supported
                                            Import Formats</h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">We support multiple file
                                            formats for easy import</p>
                                    </div>
                                </div>

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
                            </div>

                            {/* 📤 DRAG & DROP UPLOAD AREA */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json,.csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full p-12 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 transition-all duration-300 group hover:bg-gradient-to-r hover:from-blue-50/50 hover:via-indigo-50/50 hover:to-purple-50/50 dark:hover:from-blue-900/10 dark:hover:via-indigo-900/10 dark:hover:to-purple-900/10 hover:scale-[1.02] active:scale-[0.98]"
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
                                        JSON or CSV files accepted • Maximum 200MB
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
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span>Reading file</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"
                                         style={{animationDelay: '0.5s'}}></div>
                                    <span>Validating data</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                                         style={{animationDelay: '1s'}}></div>
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
                                    <h4 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3">
                                        Import Failed
                                    </h4>
                                    <p className="text-red-600 dark:text-red-400 mb-6 leading-relaxed">{importError}</p>
                                    <button
                                        onClick={() => setImportStatus('idle')}
                                        className="btn btn-outline border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/20 px-6 py-2 font-bold tracking-wide"
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
                            {/* ✅ SUCCESS MESSAGE */}
                            <div
                                className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl p-8 border-l-4 border-l-emerald-500">
                                <div className="flex items-start gap-5">
                                    <div
                                        className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white flex-shrink-0 animate-pulse">
                                        <CheckCircle className="h-8 w-8"/>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-xl font-bold text-emerald-800 dark:text-emerald-200 mb-3">
                                            🎉 Import Preview Ready
                                        </h4>
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

                            {/* 📋 PREVIEW TABLE */}
                            <div
                                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
                                <div
                                    className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                                    <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                                        Import Preview
                                    </h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Review your applications before importing
                                    </p>
                                </div>

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
                                        {importPreview.slice(0, 10).map((app, index) => (
                                            <tr key={index}
                                                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
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
                                                            "px-3 py-1.5 rounded-full text-xs font-bold border",
                                                            app.status === 'Applied' && 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-700',
                                                            app.status === 'Interview' && 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700',
                                                            app.status === 'Offer' && 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700',
                                                            app.status === 'Rejected' && 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
                                                        )}>
                                                            {app.status}
                                                        </span>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>

                                    {importPreview.length > 10 && (
                                        <div
                                            className="p-4 bg-gray-50 dark:bg-gray-800 text-center border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Showing first 10 of {importPreview.length} applications
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 🚀 IMPORT ACTIONS */}
                            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => {
                                        setImportStatus('idle');
                                        setImportPreview([]);
                                    }}
                                    className="px-6 py-3 text-gray-600 dark:text-gray-400 font-medium hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmImport}
                                    className={cn(
                                        "btn btn-primary px-8 py-3 font-bold tracking-wide",
                                        "bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700",
                                        "shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30",
                                        "transform hover:scale-105 active:scale-95 transition-all duration-200"
                                    )}
                                >
                                    <Upload className="h-5 w-5 mr-2"/>
                                    Import {importPreview.length} Applications
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
};

export default ExportImportActions;