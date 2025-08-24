// src/components/tables/MobileResponsiveApplicationTable.tsx
// Production-ready responsive table with enhanced UX and performance optimizations
import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Calendar,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Copy,
    DollarSign,
    Download,
    Edit,
    ExternalLink,
    Eye,
    FileIcon,
    FileText,
    MapPin,
    MessageSquare,
    Paperclip,
    Search,
    Trash2,
    X
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {Application, Attachment} from '../../types';
import BulkOperations from './BulkOperations';
import {Modal} from '../ui/Modal';
import {cn} from '../../utils/helpers';

// Constants
const ITEMS_PER_PAGE = 15;
const COMPANY_COLORS = [
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700',
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
    'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
    'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700'
];

// Types
interface ModalState<T> {
    isOpen: boolean;
    application: T | null;
}

interface PaginationData {
    paginatedApplications: Application[];
    totalPages: number;
    startIndex: number;
    endIndex: number;
    showingFrom: number;
    showingTo: number;
}

// Utility function for consistent company colors
const getCompanyColor = (companyName: string): string => {
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) {
        hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length];
};

// Resume Modal Component
interface ResumeModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application | null;
}

const ResumeModal: React.FC<ResumeModalProps> = memo(({isOpen, onClose, application}) => {
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // All hooks must be called before any early returns
    const resumeAttachments = useMemo(() =>
        application?.attachments?.filter(attachment =>
            attachment.name.toLowerCase().includes('resume') ||
            attachment.name.toLowerCase().includes('cv') ||
            attachment.type === 'application/pdf'
        ) || [], [application?.attachments]
    );

    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }, []);

    const handleDownload = useCallback(async (attachment: Attachment) => {
        if (!attachment.data) {
            console.warn('No data available for attachment:', attachment.name);
            return;
        }

        try {
            setDownloadingId(attachment.id || attachment.name);

            // Create blob from base64 data
            const base64Data = attachment.data.includes(',')
                ? attachment.data.split(',')[1]
                : attachment.data;

            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);

            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], {type: attachment.type});

            // Create and trigger download
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = attachment.name;
            link.style.display = 'none';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download attachment:', error);
            // You might want to show a toast notification here
        } finally {
            setDownloadingId(null);
        }
    }, []);

    // Early return after all hooks
    if (!application) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Documents"
            size="lg"
            variant="primary"
            className="resume-modal"
        >
            {/* Resume Content */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-green-600 dark:text-green-400"/>
                    <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                        Resume
                    </h4>
                    <span
                        className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            {resumeAttachments.length} file{resumeAttachments.length !== 1 ? 's' : ''}
          </span>
                </div>

                {resumeAttachments.length > 0 ? (
                    <div className="space-y-3">
                        {resumeAttachments.map((attachment) => (
                            <div
                                key={attachment.id || attachment.name}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                                            <FileIcon className="h-5 w-5 text-green-600 dark:text-green-400"/>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h5 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {attachment.name}
                                            </h5>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {attachment.type} • {formatFileSize(attachment.size || 0)}
                                            </p>
                                            {attachment.uploadedAt && (
                                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                                    Uploaded: {new Date(attachment.uploadedAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownload(attachment)}
                                        disabled={downloadingId === (attachment.id || attachment.name)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex-shrink-0",
                                            downloadingId === (attachment.id || attachment.name)
                                                ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                        )}
                                    >
                                        {downloadingId === (attachment.id || attachment.name) ? (
                                            <>
                                                <div
                                                    className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
                                                Downloading...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="h-3 w-3"/>
                                                Download
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div
                            className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Paperclip className="h-8 w-8 text-gray-400"/>
                        </div>
                        <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                            No resume attached
                        </h5>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                            No resume or attachments have been added for this application. You can add attachments by
                            editing the application.
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
});

// Resume Icon Component
interface ResumeIconProps {
    application: Application;
    variant?: 'desktop' | 'mobile';
    onClick: () => void;
    className?: string;
}

const ResumeIcon: React.FC<ResumeIconProps> = memo(({
                                                        application,
                                                        variant = 'desktop',
                                                        onClick,
                                                        className = ""
                                                    }) => {
    // Hook must be called before early returns
    const resumeAttachments = useMemo(() =>
        application.attachments?.filter(attachment =>
            attachment.name.toLowerCase().includes('resume') ||
            attachment.name.toLowerCase().includes('cv') ||
            attachment.type === 'application/pdf'
        ) || [], [application.attachments]
    );

    const hasResume = resumeAttachments.length > 0;

    if (variant === 'mobile') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    hasResume
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
                    className
                )}
            >
                <Paperclip className="h-3 w-3"/>
                <span>
          {hasResume ? `${resumeAttachments.length} file${resumeAttachments.length > 1 ? 's' : ''}` : 'No Resume'}
        </span>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 group relative",
                hasResume
                    ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 hover:scale-110"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600",
                className
            )}
            title={hasResume ? `View ${resumeAttachments.length} attachment${resumeAttachments.length > 1 ? 's' : ''}` : "No resume attached"}
        >
            {hasResume ? (
                <>
                    <Paperclip className="h-4 w-4 group-hover:scale-110 transition-transform"/>
                    {resumeAttachments.length > 1 && (
                        <span
                            className="absolute -top-1 -right-1 w-4 h-4 bg-green-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {resumeAttachments.length}
            </span>
                    )}
                </>
            ) : (
                <FileText className="h-4 w-4 opacity-50"/>
            )}
        </button>
    );
});

// Notes Modal Component
interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application | null;
}

const NotesModal: React.FC<NotesModalProps> = memo(({isOpen, onClose, application}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async () => {
        if (!application?.notes) return;

        try {
            await navigator.clipboard.writeText(application.notes);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy notes:', error);
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = application.notes;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (fallbackError) {
                console.error('Fallback copy also failed:', fallbackError);
            }
        }
    }, [application?.notes]);

    if (!application) return null;

    const hasNotes = application.notes && application.notes.trim();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Application Notes"
            size="lg"
            variant="primary"
            className="notes-modal"
        >
            {/* Application Info Header */}
            <div
                className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        getCompanyColor(application.company).split(' ')[0],
                        getCompanyColor(application.company).split(' ')[2]
                    )}/>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {application.company}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            {application.position}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Applied: {new Date(application.dateApplied).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Notes Content */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            Notes
                        </h4>
                    </div>
                    {hasNotes && (
                        <button
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200",
                                copied
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            )}
                        >
                            {copied ? (
                                <>
                                    <Check className="h-3 w-3"/>
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-3 w-3"/>
                                    Copy
                                </>
                            )}
                        </button>
                    )}
                </div>

                {hasNotes ? (
                    <div
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div
                                className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">
                                {application.notes}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div
                            className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <FileText className="h-8 w-8 text-gray-400"/>
                        </div>
                        <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                            No notes yet
                        </h5>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
                            No notes have been added for this application. You can add notes by editing the application.
                        </p>
                    </div>
                )}
            </div>

            {/* Character Count & Word Count */}
            {hasNotes && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>
              {application.notes!.length} characters
            </span>
                        <span>
              {application.notes!.split(/\s+/).filter(word => word.length > 0).length} words
            </span>
                    </div>
                </div>
            )}
        </Modal>
    );
});

// Notes Icon Component
interface NotesIconProps {
    application: Application;
    variant?: 'desktop' | 'mobile';
    onClick: () => void;
    className?: string;
}

const NotesIcon: React.FC<NotesIconProps> = memo(({
                                                      application,
                                                      variant = 'desktop',
                                                      onClick,
                                                      className = ""
                                                  }) => {
    const hasNotes = application.notes && application.notes.trim();

    if (variant === 'mobile') {
        return (
            <button
                onClick={onClick}
                className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
                    hasNotes
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
                    className
                )}
            >
                <Eye className="h-3 w-3"/>
                <span>
          {hasNotes ? 'View Notes' : 'No Notes'}
        </span>
            </button>
        );
    }

    return (
        <button
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 group",
                hasNotes
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 hover:scale-110"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600",
                className
            )}
            title={hasNotes ? "View notes" : "No notes"}
        >
            {hasNotes ? (
                <MessageSquare className="h-4 w-4 group-hover:scale-110 transition-transform"/>
            ) : (
                <FileText className="h-4 w-4 opacity-50"/>
            )}
        </button>
    );
});

// Main Component
const MobileResponsiveApplicationTable: React.FC = () => {
    const {
        filteredApplications,
        ui,
        setSearchQuery,
        clearSearch,
        openEditModal,
        deleteApplication
    } = useAppStore();

    // State management
    const [showRejected, setShowRejected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Modal states
    const [notesModal, setNotesModal] = useState<ModalState<Application>>({
        isOpen: false,
        application: null
    });

    const [resumeModal, setResumeModal] = useState<ModalState<Application>>({
        isOpen: false,
        application: null
    });

    // Refs for cleanup
    const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, []);

    // Optimized resize handler
    useEffect(() => {
        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
            resizeTimeoutRef.current = setTimeout(() => {
                setIsMobile(window.innerWidth < 768);
            }, 100);
        };

        window.addEventListener('resize', handleResize, {passive: true});
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                clearTimeout(resizeTimeoutRef.current);
            }
        };
    }, []);

    // Modal handlers
    const openNotesModal = useCallback((application: Application) => {
        setNotesModal({isOpen: true, application});
    }, []);

    const closeNotesModal = useCallback(() => {
        setNotesModal({isOpen: false, application: null});
    }, []);

    const openResumeModal = useCallback((application: Application) => {
        setResumeModal({isOpen: true, application});
    }, []);

    const closeResumeModal = useCallback(() => {
        setResumeModal({isOpen: false, application: null});
    }, []);

    // Optimized filtered data
    const {activeApplications, rejectedApplications} = useMemo(() => {
        const active: Application[] = [];
        const rejected: Application[] = [];

        filteredApplications.forEach(app => {
            if (app.status === 'Rejected') {
                rejected.push(app);
            } else {
                active.push(app);
            }
        });

        return {activeApplications: active, rejectedApplications: rejected};
    }, [filteredApplications]);

    const currentApplications = showRejected ? rejectedApplications : activeApplications;

    // Pagination calculations
    const paginationData = useMemo((): PaginationData => {
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        const totalPgs = Math.ceil(currentApplications.length / ITEMS_PER_PAGE);

        return {
            paginatedApplications: currentApplications.slice(startIdx, endIdx),
            totalPages: totalPgs,
            startIndex: startIdx,
            endIndex: endIdx,
            showingFrom: startIdx + 1,
            showingTo: Math.min(endIdx, currentApplications.length)
        };
    }, [currentApplications, currentPage]);

    // Event handlers
    const handleDelete = useCallback(async (id: string, company: string) => {
        if (!window.confirm(`Are you sure you want to delete the application for ${company}?`)) {
            return;
        }

        try {
            await deleteApplication(id);
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Delete failed:', error);
            // You might want to show a toast notification here
        }
    }, [deleteApplication]);

    const toggleRowSelection = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    }, []);

    const handleSelectAll = useCallback(() => {
        const allCurrentIds = paginationData.paginatedApplications.map(app => app.id);
        const allSelected = allCurrentIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !allCurrentIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const filtered = prev.filter(id => !allCurrentIds.includes(id));
                return [...filtered, ...allCurrentIds];
            });
        }
    }, [paginationData.paginatedApplications, selectedIds]);

    // Utility functions
    const formatDate = useCallback((dateString: string): string => {
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: isMobile ? '2-digit' : 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid Date';
        }
    }, [isMobile]);

    const getStatusBadge = useCallback((status: string): string => {
        const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-bold tracking-wider uppercase';
        switch (status) {
            case 'Applied':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100`;
            case 'Interview':
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100`;
            case 'Offer':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100`;
            case 'Rejected':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100`;
        }
    }, []);

    // Search handlers
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setCurrentPage(1);
    }, [setSearchQuery]);

    const handleClearSearch = useCallback(() => {
        clearSearch();
        setCurrentPage(1);
    }, [clearSearch]);

    // Tab switching
    const handleTabSwitch = useCallback((rejected: boolean) => {
        setShowRejected(rejected);
        setCurrentPage(1);
        setSelectedIds([]);
    }, []);

    // Pagination handlers
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= paginationData.totalPages) {
            setCurrentPage(page);
        }
    }, [paginationData.totalPages]);

    const goToPrevious = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    const goToNext = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    return (
        <div className="space-y-4">
            {/* Search and Controls */}
            <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10 pointer-events-none"/>
                    <input
                        type="text"
                        placeholder="Search applications..."
                        value={ui.searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 font-medium text-base transition-colors duration-150"
                    />
                    {ui.searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    )}
                </div>

                {/* Tab Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => handleTabSwitch(false)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-all duration-150 ${
                            !showRejected
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="hidden sm:inline">Active</span>
                        <span className="sm:hidden">Active</span>
                        <span className="ml-1 font-extrabold">({activeApplications.length})</span>
                    </button>
                    <button
                        onClick={() => handleTabSwitch(true)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-all duration-150 ${
                            showRejected
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="hidden sm:inline">Rejected</span>
                        <span className="sm:hidden">Rejected</span>
                        <span className="ml-1 font-extrabold">({rejectedApplications.length})</span>
                    </button>
                </div>

                {/* Results Summary */}
                <div
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <div>
                        <span
                            className="font-semibold">Showing {paginationData.showingFrom} to {paginationData.showingTo}</span> of{' '}
                        <span className="font-bold">{currentApplications.length}</span> applications
                        {ui.searchQuery && (
                            <div
                                className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 sm:mt-0 sm:ml-2 sm:inline">
                                (filtered from {filteredApplications.length} total)
                            </div>
                        )}
                    </div>
                    <div className="text-xs font-medium opacity-75">
                        {ITEMS_PER_PAGE} per page • Page <span className="font-bold">{currentPage}</span> of{' '}
                        <span className="font-bold">{paginationData.totalPages}</span>
                    </div>
                </div>
            </div>

            {/* Bulk Operations */}
            <BulkOperations
                selectedIds={selectedIds}
                applications={currentApplications}
                onSelectionChange={setSelectedIds}
            />

            {/* Content Views */}
            {isMobile ? (
                <MobileCardView
                    applications={paginationData.paginatedApplications}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleRowSelection}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onNotesClick={openNotesModal}
                    onResumeClick={openResumeModal}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    searchQuery={ui.searchQuery}
                    showRejected={showRejected}
                />
            ) : (
                <DesktopTableView
                    applications={paginationData.paginatedApplications}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleRowSelection}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    onNotesClick={openNotesModal}
                    onResumeClick={openResumeModal}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    searchQuery={ui.searchQuery}
                    showRejected={showRejected}
                    startIndex={paginationData.startIndex}
                    onSelectAll={handleSelectAll}
                />
            )}

            {/* Pagination */}
            {paginationData.totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 text-center">
                        Page <span className="font-bold text-blue-600 dark:text-blue-400">{currentPage}</span> of{' '}
                        <span className="font-bold">{paginationData.totalPages}</span> •{' '}
                        <span className="font-bold">{currentApplications.length}</span> total applications
                        {selectedIds.length > 0 && (
                            <span className="ml-2 text-purple-600 dark:text-purple-400">
                • <span className="font-bold">{selectedIds.length}</span> selected
              </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={goToPrevious}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-bold tracking-wide text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronLeft className="h-4 w-4"/>
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                        </button>

                        {isMobile ? (
                            <span className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400">
                {currentPage} of {paginationData.totalPages}
              </span>
                        ) : (
                            <div className="flex gap-1">
                                {Array.from({length: Math.min(paginationData.totalPages, 5)}, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`px-3 py-2 text-sm font-bold tracking-wide rounded-md transition-colors duration-150 ${
                                                page === currentPage
                                                    ? 'bg-blue-600 text-white'
                                                    : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        <button
                            onClick={goToNext}
                            disabled={currentPage === paginationData.totalPages}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-bold tracking-wide text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <span className="sm:hidden">Next</span>
                            <ChevronRight className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            )}

            {/* Modals */}
            <NotesModal
                isOpen={notesModal.isOpen}
                onClose={closeNotesModal}
                application={notesModal.application}
            />

            <ResumeModal
                isOpen={resumeModal.isOpen}
                onClose={closeResumeModal}
                application={resumeModal.application}
            />
        </div>
    );
};

// View Components Interface
interface ViewProps {
    applications: Application[];
    selectedIds: string[];
    onToggleSelection: (id: string) => void;
    onEdit: (app: Application) => void;
    onDelete: (id: string, company: string) => void;
    onNotesClick: (app: Application) => void;
    onResumeClick: (app: Application) => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    searchQuery: string;
    showRejected: boolean;
}

// Mobile Card View Component
const MobileCardView: React.FC<ViewProps> = memo(({
                                                      applications,
                                                      selectedIds,
                                                      onToggleSelection,
                                                      onEdit,
                                                      onDelete,
                                                      onNotesClick,
                                                      onResumeClick,
                                                      formatDate,
                                                      getStatusBadge,
                                                      searchQuery,
                                                      showRejected
                                                  }) => {
    const highlightText = useCallback((text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    }, [searchQuery]);

    if (applications.length === 0) {
        return (
            <div className="text-center py-12 px-4">
                <div className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? (
                        <div className="space-y-2">
                            <Search className="h-12 w-12 mx-auto opacity-30"/>
                            <p className="text-lg font-bold">No results found</p>
                            <p className="text-sm font-medium leading-relaxed">No applications match "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Paperclip className="h-12 w-12 mx-auto opacity-30"/>
                            <p className="text-lg font-bold">No {showRejected ? 'rejected' : 'active'} applications</p>
                            {!showRejected && (
                                <p className="text-sm font-medium leading-relaxed">Add your first application above!</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {applications.map((app) => (
                <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedIds.includes(app.id)}
                    onToggleSelection={() => onToggleSelection(app.id)}
                    onEdit={() => onEdit(app)}
                    onDelete={() => onDelete(app.id, app.company)}
                    onNotesClick={() => onNotesClick(app)}
                    onResumeClick={() => onResumeClick(app)}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    searchQuery={searchQuery}
                    highlightText={highlightText}
                />
            ))}
        </div>
    );
});

// Application Card Component
interface CardProps {
    application: Application;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onNotesClick: () => void;
    onResumeClick: () => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    searchQuery: string;
    highlightText: (text: string) => string;
}

const ApplicationCard: React.FC<CardProps> = memo(({
                                                       application,
                                                       isSelected,
                                                       onToggleSelection,
                                                       onEdit,
                                                       onDelete,
                                                       onNotesClick,
                                                       onResumeClick,
                                                       formatDate,
                                                       getStatusBadge,
                                                       searchQuery,
                                                       highlightText
                                                   }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const companyColorClasses = getCompanyColor(application.company);
    const hasNotes = application.notes && application.notes.trim();

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 ${
            isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}>
            <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelection}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            aria-label={`Select application for ${application.company}`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <div
                                    className={`w-3 h-3 rounded-full border ${companyColorClasses.split(' ')[0]} ${companyColorClasses.split(' ')[2]}`}/>
                                <h3
                                    className="font-extrabold text-lg text-gray-900 dark:text-gray-100 truncate"
                                    dangerouslySetInnerHTML={{__html: highlightText(application.company)}}
                                />
                            </div>
                            <p
                                className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate"
                                dangerouslySetInnerHTML={{__html: highlightText(application.position)}}
                            />
                        </div>
                    </div>
                    <span className={getStatusBadge(application.status)}>
            {application.status}
          </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0"/>
                        <span className="text-gray-600 dark:text-gray-400 truncate font-semibold">
              {formatDate(application.dateApplied)}
            </span>
                    </div>
                    <div className="flex items-center space-x-2">
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                    application.type === 'Remote'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : application.type === 'Hybrid'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
              {application.type}
            </span>
                    </div>
                    {application.location && (
                        <div className="flex items-center space-x-2 col-span-2">
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0"/>
                            <span
                                className="text-gray-600 dark:text-gray-400 truncate font-medium"
                                dangerouslySetInnerHTML={{__html: highlightText(application.location)}}
                            />
                        </div>
                    )}
                    {application.salary && application.salary !== '-' && (
                        <div className="flex items-center space-x-2 col-span-2">
                            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0"/>
                            <span className="text-gray-600 dark:text-gray-400 truncate font-semibold">
                {application.salary}
              </span>
                        </div>
                    )}
                </div>

                <div
                    className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        >
                            {isExpanded ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                        </button>

                        <NotesIcon
                            application={application}
                            variant="mobile"
                            onClick={onNotesClick}
                        />

                        <ResumeIcon
                            application={application}
                            variant="mobile"
                            onClick={onResumeClick}
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-md text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors duration-150"
                            aria-label="Edit application"
                        >
                            <Edit className="h-4 w-4"/>
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                            aria-label="Delete application"
                        >
                            <Trash2 className="h-4 w-4"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Desktop Table View Component
const DesktopTableView: React.FC<ViewProps & { startIndex: number; onSelectAll: () => void }> = memo(({
                                                                                                          applications,
                                                                                                          selectedIds,
                                                                                                          onToggleSelection,
                                                                                                          onEdit,
                                                                                                          onDelete,
                                                                                                          onNotesClick,
                                                                                                          onResumeClick,
                                                                                                          formatDate,
                                                                                                          getStatusBadge,
                                                                                                          showRejected,
                                                                                                          startIndex,
                                                                                                          onSelectAll
                                                                                                      }) => {
    if (applications.length === 0) {
        return (
            <div
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="text-center py-16 px-6">
                    <div className="space-y-4">
                        <div
                            className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Search className="h-8 w-8 text-gray-400"/>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                No {showRejected ? 'rejected' : 'active'} applications
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                                {showRejected
                                    ? 'Rejected applications will appear here when you mark them as rejected.'
                                    : 'Add your first application using the form above to get started!'
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const allCurrentPageSelected = applications.length > 0 && applications.every(app => selectedIds.includes(app.id));

    return (
        <div
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        <th className="w-12 px-4 py-4 text-center">
                            <input
                                type="checkbox"
                                checked={allCurrentPageSelected}
                                onChange={onSelectAll}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                aria-label="Select all applications on this page"
                            />
                        </th>
                        <th className="w-16 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">#</th>
                        <th className="w-24 px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Date</th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Company</th>
                        <th className="min-w-[140px] px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Position</th>
                        <th className="w-20 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Type</th>
                        <th className="min-w-[100px] px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Location</th>
                        <th className="w-24 px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Salary</th>
                        <th className="w-20 px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Source</th>
                        <th className="w-24 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Status</th>
                        <th className="w-20 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Notes</th>
                        <th className="w-20 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Resume</th>
                        <th className="w-16 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">URL</th>
                        <th className="w-24 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {applications.map((app, index) => {
                        const companyColorClasses = getCompanyColor(app.company);

                        return (
                            <tr
                                key={app.id}
                                className={`transition-colors duration-150 ${
                                    selectedIds.includes(app.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <td className="w-12 px-4 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(app.id)}
                                        onChange={() => onToggleSelection(app.id)}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                        aria-label={`Select application for ${app.company}`}
                                    />
                                </td>
                                <td className="w-16 px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400 font-bold">
                                    {startIndex + index + 1}
                                </td>
                                <td className="w-24 px-4 py-4 text-left">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {formatDate(app.dateApplied)}
                                    </div>
                                </td>
                                <td className="min-w-[140px] px-4 py-4 text-left">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-3 h-3 rounded-full border flex-shrink-0 ${companyColorClasses.split(' ')[0]} ${companyColorClasses.split(' ')[2]}`}/>
                                        <div
                                            className="text-sm font-extrabold text-gray-900 dark:text-gray-100 truncate max-w-[120px]"
                                            title={app.company}
                                        >
                                            {app.company}
                                        </div>
                                    </div>
                                </td>
                                <td className="min-w-[140px] px-4 py-4 text-left">
                                    <div
                                        className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[140px]"
                                        title={app.position}
                                    >
                                        {app.position}
                                    </div>
                                </td>
                                <td className="w-20 px-4 py-4 text-center">
                    <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold tracking-wide uppercase ${
                            app.type === 'Remote' ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400' :
                                app.type === 'Hybrid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                      {app.type}
                    </span>
                                </td>
                                <td className="min-w-[100px] px-4 py-4 text-left">
                                    <div
                                        className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px] font-medium"
                                        title={app.location || ''}
                                    >
                                        {app.location || <span className="text-gray-400 italic font-normal">-</span>}
                                    </div>
                                </td>
                                <td className="w-24 px-4 py-4 text-left">
                                    <div
                                        className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[80px] font-semibold"
                                        title={app.salary || ''}
                                    >
                                        {app.salary && app.salary !== '-' ? app.salary :
                                            <span className="text-gray-400 italic font-normal">-</span>}
                                    </div>
                                </td>
                                <td className="w-20 px-4 py-4 text-left">
                                    <div
                                        className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[60px] font-medium"
                                        title={app.jobSource || ''}
                                    >
                                        {app.jobSource || <span className="text-gray-400 italic font-normal">-</span>}
                                    </div>
                                </td>
                                <td className="w-24 px-4 py-4 text-center">
                    <span className={getStatusBadge(app.status)}>
                      {app.status}
                    </span>
                                </td>
                                <td className="w-20 px-4 py-4 text-center">
                                    <NotesIcon
                                        application={app}
                                        onClick={() => onNotesClick(app)}
                                    />
                                </td>
                                <td className="w-20 px-4 py-4 text-center">
                                    <ResumeIcon
                                        application={app}
                                        onClick={() => onResumeClick(app)}
                                    />
                                </td>
                                <td className="w-16 px-4 py-4 text-center">
                                    {app.jobUrl ? (
                                        <button
                                            onClick={() => window.open(app.jobUrl, '_blank', 'noopener,noreferrer')}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors duration-150"
                                            title="Open job posting"
                                            aria-label="Open job posting in new tab"
                                        >
                                            <ExternalLink className="h-4 w-4"/>
                                        </button>
                                    ) : (
                                        <span className="text-gray-400 italic font-normal">-</span>
                                    )}
                                </td>
                                <td className="w-24 px-4 py-4 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        <button
                                            onClick={() => onEdit(app)}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors duration-150"
                                            title="Edit application"
                                            aria-label="Edit application"
                                        >
                                            <Edit className="h-3.5 w-3.5"/>
                                        </button>
                                        <button
                                            onClick={() => onDelete(app.id, app.company)}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                                            title="Delete application"
                                            aria-label="Delete application"
                                        >
                                            <Trash2 className="h-3.5 w-3.5"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

// Set display names
ResumeModal.displayName = 'ResumeModal';
ResumeIcon.displayName = 'ResumeIcon';
NotesModal.displayName = 'NotesModal';
NotesIcon.displayName = 'NotesIcon';
MobileCardView.displayName = 'MobileCardView';
DesktopTableView.displayName = 'DesktopTableView';

export default MobileResponsiveApplicationTable;