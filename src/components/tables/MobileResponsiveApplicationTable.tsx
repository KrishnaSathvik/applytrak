import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock,
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
    X,
    FileText as FileTextIcon,
    Eye as EyeIcon
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {Application, Attachment, ApplicationStatus} from '../../types';
import {getAttachmentSignedUrl} from '../../services/databaseService';
import BulkOperations from './BulkOperations';
import {Modal} from '../ui/Modal';
import {cn} from '../../utils/helpers';




// Constants
const ITEMS_PER_PAGE = 15;
const MAX_APPLICATIONS_FOR_INSTANT_FILTER = 100; // Threshold for instant vs debounced filtering
const COMPANY_COLORS = [
    'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
    'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-blue-700',
    'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-blue-700',
    'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-blue-700',
    'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-blue-700',
    'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-blue-700',
    'bg-teal-100 text-teal-800 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-blue-700',
    'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-blue-700',
    'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-blue-700',
    'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-blue-700'
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

// No longer using inline editing - using EditApplicationModal instead

// Utility function for consistent company colors
const getCompanyColor = (companyName: string): string => {
    let hash = 0;
    for (let i = 0; i < companyName.length; i++) {
        hash = companyName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COMPANY_COLORS[Math.abs(hash) % COMPANY_COLORS.length];
};

// Status badge utility function
const getStatusBadge = (status: string): string => {
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
};

// Inline Editable Cell Component
interface InlineEditableCellProps {
    value: string;
    isEditing: boolean;
    placeholder?: string;
    className?: string;
    maxLength?: number;
    appId?: string;
    fieldName?: string;
}

const InlineEditableCell: React.FC<InlineEditableCellProps> = memo(({
    value,
    isEditing,
    placeholder = "Enter value...",
    className = "",
    maxLength = 100,
    appId,
    fieldName
}) => {
    const [editValue, setEditValue] = useState(value);

    useEffect(() => {
        setEditValue(value);
    }, [value]);

    if (isEditing) {
        return (
            <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={placeholder}
                maxLength={maxLength}
                data-app-id={appId}
                data-field={fieldName}
                className="px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 w-full"
            />
        );
    }

    return (
        <div className={cn("text-sm", className)}>
            {value || <span className="text-gray-400 italic">-</span>}
        </div>
    );
});

InlineEditableCell.displayName = 'InlineEditableCell';

// Inline Status Dropdown Component
interface InlineStatusDropdownProps {
    currentStatus: string;
    isEditing: boolean;
    onToggleEdit: () => void;
}

const InlineStatusDropdown: React.FC<InlineStatusDropdownProps> = memo(({
    currentStatus,
    isEditing,
    onToggleEdit
}) => {
    const statusOptions = ['Applied', 'Interview', 'Offer', 'Rejected'];

    if (isEditing) {
        return (
            <select
                value={currentStatus}
                onChange={() => {
                    // Update the status immediately when changed
                    // You can add a callback here to update the status
                }}
                className="px-2 py-1 text-xs border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                autoFocus
            >
                {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                ))}
            </select>
        );
    }

    return (
        <div 
            className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded px-1 py-1 transition-colors"
            onClick={onToggleEdit}
            title="Click to change status"
        >
            <span className={getStatusBadge(currentStatus)}>
                {currentStatus}
            </span>
        </div>
    );
});

InlineStatusDropdown.displayName = 'InlineStatusDropdown';



// Enhanced Resume Component (like before but with view/download)
interface EnhancedResumeProps {
    attachments: Attachment[];
    onView: (attachment: Attachment) => void;
    onDownload: (attachment: Attachment) => void;
}

const EnhancedResume: React.FC<EnhancedResumeProps> = memo(({
    attachments,
    onView,
    onDownload
}) => {
    const resumeAttachments = attachments?.filter(att => 
        att.name.toLowerCase().includes('resume') || 
        att.name.toLowerCase().includes('cv') ||
        att.type === 'application/pdf'
    ) || [];

    if (attachments?.length === 0) {
        return (
            <div className="text-center text-gray-400 text-xs">
                <FileTextIcon className="h-4 w-4 mx-auto mb-1" />
                No docs
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {/* Resume/CV Section */}
            {resumeAttachments.length > 0 && (
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <FileTextIcon className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Resume</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => onView(resumeAttachments[0])}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="View resume"
                        >
                            <EyeIcon className="h-3 w-3" />
                        </button>
                        <button
                            onClick={() => onDownload(resumeAttachments[0])}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            title="Download resume"
                        >
                            <Download className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Other Documents */}
            {attachments.filter(att => 
                !att.name.toLowerCase().includes('resume') && 
                !att.name.toLowerCase().includes('cv') &&
                att.type !== 'application/pdf'
            ).length > 0 && (
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Paperclip className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">
                            {attachments.filter(att => 
                                !att.name.toLowerCase().includes('resume') && 
                                !att.name.toLowerCase().includes('cv') &&
                                att.type !== 'application/pdf'
                            ).length}
                        </span>
                    </div>
                    <button
                        onClick={() => onView(attachments.find(att => 
                            !att.name.toLowerCase().includes('resume') && 
                            !att.name.toLowerCase().includes('cv') &&
                            att.type !== 'application/pdf'
                        )!)}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="View documents"
                    >
                        <EyeIcon className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
});

EnhancedResume.displayName = 'EnhancedResume';

// Efficient Document Handler Component
interface DocumentHandlerProps {
    attachments: Attachment[];
    onDocumentAction: (action: 'view' | 'download' | 'copy', attachment: Attachment) => void;
}

const DocumentHandler: React.FC<DocumentHandlerProps> = memo(({
    attachments,
    onDocumentAction
}) => {
    const resumeAttachments = attachments?.filter(att => 
        att.name.toLowerCase().includes('resume') || 
        att.name.toLowerCase().includes('cv') ||
        att.type === 'application/pdf'
    ) || [];

    const otherAttachments = attachments?.filter(att => 
        !att.name.toLowerCase().includes('resume') && 
        !att.name.toLowerCase().includes('cv') &&
        att.type !== 'application/pdf'
    ) || [];

    if (attachments?.length === 0) {
        return (
            <div className="text-center text-gray-400 text-xs">
                <FileTextIcon className="h-4 w-4 mx-auto mb-1" />
                No docs
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-1">
            {/* Resume/CV Section */}
            {resumeAttachments.length > 0 && (
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <FileTextIcon className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium text-green-600">Resume</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => onDocumentAction('view', resumeAttachments[0])}
                            className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                            title="View resume"
                        >
                            <EyeIcon className="h-3 w-3" />
                        </button>
                        <button
                            onClick={() => onDocumentAction('download', resumeAttachments[0])}
                            className="p-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                            title="Download resume"
                        >
                            <Download className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Other Documents */}
            {otherAttachments.length > 0 && (
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        <Paperclip className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">{otherAttachments.length}</span>
                    </div>
                    <button
                        onClick={() => onDocumentAction('view', otherAttachments[0])}
                        className="p-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="View documents"
                    >
                        <EyeIcon className="h-3 w-3" />
                    </button>
                </div>
            )}
        </div>
    );
});

DocumentHandler.displayName = 'DocumentHandler';

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
        try {
            setDownloadingId(attachment.id || attachment.name);

            if (attachment.storagePath) {
                // For cloud-stored attachments, get a signed URL and download
                const url = await getAttachmentSignedUrl(attachment.storagePath, 300);
                const link = document.createElement('a');
                link.href = url;
                link.download = attachment.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setDownloadingId(null);
                return;
            }
            
            if (attachment.data) {
                // If we already stored a Blob URL (blob:…), download directly
                if (attachment.data.startsWith('blob:')) {
                    const link = document.createElement('a');
                    link.href = attachment.data;
                    link.download = attachment.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setDownloadingId(null);
                    return;
                }

                // For data URLs, convert to blob and download
                const res = await fetch(attachment.data);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = attachment.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setDownloadingId(null);
                return;
            }
            
            alert('No file available to download.');
            setDownloadingId(null);
        } catch (error) {
            console.error('Failed to download attachment:', error);
            alert('Unable to download this attachment. Please try again.');
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
                                            <h5 className="font-semibold text-gray-900 dark:text-gray-100 whitespace-normal break-words">
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
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    if (attachment.storagePath) {
                                                        // For cloud-stored attachments, get a signed URL
                                                        const url = await getAttachmentSignedUrl(attachment.storagePath, 300);
                                                        window.open(url, '_blank', 'noopener,noreferrer');
                                                        return;
                                                    }
                                                    
                                                    if (attachment.data) {
                                                        // If we already stored a Blob URL (blob:…), open directly
                                                        if (attachment.data.startsWith('blob:')) {
                                                            window.open(attachment.data, '_blank', 'noopener,noreferrer');
                                                            return;
                                                        }

                                                        // For data URLs, convert to blob URL
                                                        const res = await fetch(attachment.data);
                                                        const blob = await res.blob();
                                                        const objUrl = URL.createObjectURL(blob);
                                                        window.open(objUrl, '_blank', 'noopener,noreferrer');
                                                        // revoke after a minute to give the new tab time to load
                                                        setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
                                                        return;
                                                    }
                                                    
                                                    alert('No file available to view.');
                                                } catch (error) {
                                                    console.error('Failed to view attachment:', error);
                                                    alert('Unable to view this attachment. Please try downloading it instead.');
                                                }
                                            }}
                                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                        >
                                            <Eye className="h-3 w-3"/>
                                            View
                                        </button>
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
                    "inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]",
                    hasResume
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
                    className
                )}
            >
                <Download className="h-4 w-4"/>
                <span className="text-sm">
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
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 hover:scale-110"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600",
                className
            )}
            title={hasResume ? `View ${resumeAttachments.length} attachment${resumeAttachments.length > 1 ? 's' : ''}` : "No resume attached"}
        >
            {hasResume ? (
                <>
                    <Download className="h-4 w-4 group-hover:scale-110 transition-transform"/>
                    {resumeAttachments.length > 1 && (
                        <span
                            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {resumeAttachments.length}
            </span>
                    )}
                </>
            ) : (
                <Download className="h-4 w-4 opacity-50"/>
            )}
        </button>
    );
});

// Notes Modal Component
interface NotesModalProps {
    isOpen: boolean;
    onClose: () => void;
    application: Application | null;
    onSaveNotes?: (notes: string) => Promise<void>;
}

const NotesModal: React.FC<NotesModalProps> = memo(({isOpen, onClose, application, onSaveNotes}) => {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedNotes, setEditedNotes] = useState('');

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

    const handleEdit = useCallback(() => {
        setIsEditing(true);
        setEditedNotes(application?.notes || '');
    }, [application?.notes]);

    const handleSave = useCallback(async () => {
        if (onSaveNotes) {
            try {
                await onSaveNotes(editedNotes);
                setIsEditing(false);
            } catch (error) {
                console.error('Failed to save notes:', error);
            }
        }
    }, [editedNotes, onSaveNotes]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setEditedNotes(application?.notes || '');
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
            {/* Notes Content Only - No Company Info Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
                            Notes for {application.company}
                        </h4>
                    </div>
                    <div className="flex items-center gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={handleSave}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                                >
                                    <Check className="h-3 w-3"/>
                                    Save
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <X className="h-3 w-3"/>
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                                >
                                    <Edit className="h-3 w-3"/>
                                    Edit
                                </button>
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
                            </>
                        )}
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-3">
                        <textarea
                            value={editedNotes}
                            onChange={(e) => setEditedNotes(e.target.value)}
                            placeholder="Enter your notes here..."
                            className="w-full h-32 p-3 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            You can use markdown formatting for better organization.
                        </p>
                    </div>
                ) : hasNotes ? (
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
                    "inline-flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 min-h-[44px]",
                    hasNotes
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600",
                    className
                )}
            >
                <Eye className="h-4 w-4"/>
                <span className="text-sm">
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

// Main Component with Performance Optimization
const MobileResponsiveApplicationTable: React.FC = () => {
    const {
        filteredApplications,
        ui,
        setSearchQuery,
        deleteApplication,
        updateApplication,
        showToast
    } = useAppStore();

    // Use applications directly - modern React can handle large datasets
    const safeApplications = filteredApplications;



    // State management
    const [showRejected, setShowRejected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    
    // No longer using inline editing - using EditApplicationModal instead

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
    
    // Color cache for company colors - memoized to prevent recalculation
    const colorCacheRef = useRef(new Map<string, string>());
    
    // Optimized company color function with caching
    const getCompanyColorOptimized = useCallback((companyName: string): string => {
        if (colorCacheRef.current.has(companyName)) {
            return colorCacheRef.current.get(companyName)!;
        }
        
        const color = getCompanyColor(companyName);
        colorCacheRef.current.set(companyName, color);
        return color;
    }, []);

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

    // Optimized filtered data with better performance
    const {activeApplications, rejectedApplications} = useMemo(() => {
        // Use more efficient filtering for large datasets
        if (filteredApplications.length > MAX_APPLICATIONS_FOR_INSTANT_FILTER) {
            // For large datasets, use Set for O(1) lookups
            const active: Application[] = [];
            const rejected: Application[] = [];
            
            for (let i = 0; i < filteredApplications.length; i++) {
                const app = filteredApplications[i];
                if (app.status === 'Rejected') {
                    rejected.push(app);
                } else {
                    active.push(app);
                }
            }
            
            return {activeApplications: active, rejectedApplications: rejected};
        } else {
            // For smaller datasets, use filter for cleaner code
            const active = safeApplications.filter(app => app.status !== 'Rejected');
            const rejected = safeApplications.filter(app => app.status === 'Rejected');
            return {activeApplications: active, rejectedApplications: rejected};
        }
    }, [safeApplications]);

    const currentApplications = showRejected ? rejectedApplications : activeApplications;

    // Pagination calculations with performance optimization
    const paginationData = useMemo((): PaginationData => {
        const totalApps = currentApplications.length;
        if (totalApps === 0) {
            return {
                paginatedApplications: [],
                totalPages: 0,
                startIndex: 0,
                endIndex: 0,
                showingFrom: 0,
                showingTo: 0
            };
        }

        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, totalApps);
        const totalPgs = Math.ceil(totalApps / ITEMS_PER_PAGE);

        // Only slice if we have data to avoid unnecessary array operations
        const paginated = totalApps > 0 ? currentApplications.slice(startIdx, endIdx) : [];

        return {
            paginatedApplications: paginated,
            totalPages: totalPgs,
            startIndex: startIdx,
            endIndex: endIdx,
            showingFrom: startIdx + 1,
            showingTo: endIdx
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



    // Row editing handlers
    // Edit modal handlers
    const { openEditModal } = useAppStore();
    
    const handleEditClick = useCallback((application: Application) => {
        openEditModal(application);
    }, [openEditModal]);

    const handleDocumentAction = useCallback((action: 'view' | 'download' | 'copy', attachment: Attachment) => {
        switch (action) {
            case 'view':
                // Open document in new tab or modal
                if (attachment.data) {
                    const blob = new Blob([attachment.data], { type: attachment.type });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                    // Clean up the URL after a delay
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                }
                break;
            case 'download':
                // Download the document
                if (attachment.data) {
                    const blob = new Blob([attachment.data], { type: attachment.type });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = attachment.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }
                break;
            case 'copy':
                // Copy document link or content to clipboard
                navigator.clipboard.writeText(attachment.name);
                break;
        }
    }, []);

    // Utility functions
    const formatDate = useCallback((dateString: string): string => {
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            
            // Use a consistent, compact format that fits well in the table
            const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = date.getDate();
            const yearNum = date.getFullYear();
            
            // Format: "Jan 15, 2024" - always compact and readable
            return `${monthStr} ${dayNum}, ${yearNum}`;
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid Date';
        }
    }, []);



    // Search handlers with performance optimization
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        
        // Only update if the query actually changed to prevent unnecessary re-renders
        if (query !== ui.searchQuery) {
            setSearchQuery(query);
            setCurrentPage(1);
        }
    }, [setSearchQuery, ui.searchQuery]);

    const handleClearSearch = useCallback(() => {
        // Only clear if there's actually a query to clear
        if (ui.searchQuery.trim()) {
            setSearchQuery('');
            setCurrentPage(1);
        }
    }, [setSearchQuery, ui.searchQuery]);

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
                        // Performance optimization: prevent excessive re-renders during typing
                        onKeyDown={(e) => {
                            // Allow immediate search on Enter key
                            if (e.key === 'Enter') {
                                e.currentTarget.blur();
                            }
                        }}
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

            {/* Content Views with Performance Optimization */}
            {paginationData.paginatedApplications.length > 0 ? (
                isMobile ? (
                                    <MobileCardView
                    key={`mobile-${showRejected}-${currentPage}`}
                    applications={paginationData.paginatedApplications}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleRowSelection}
                    onDelete={handleDelete}
                    onNotesClick={openNotesModal}
                    onResumeClick={openResumeModal}
                    formatDate={formatDate}
                    searchQuery={ui.searchQuery}
                    showRejected={showRejected}
                    getCompanyColor={getCompanyColorOptimized}
                    handleEditClick={handleEditClick}
                    handleDocumentAction={handleDocumentAction}
                />
                ) : (
                    <DesktopTableView
                        key={`desktop-${showRejected}-${currentPage}`}
                        applications={paginationData.paginatedApplications}
                        selectedIds={selectedIds}
                        onToggleSelection={toggleRowSelection}
                        onDelete={handleDelete}
                        onNotesClick={openNotesModal}
                        onResumeClick={openResumeModal}
                        formatDate={formatDate}
                        searchQuery={ui.searchQuery}
                        showRejected={showRejected}
                        startIndex={paginationData.startIndex}
                        onSelectAll={handleSelectAll}
                        getCompanyColor={getCompanyColorOptimized}
                        handleEditClick={handleEditClick}
                        handleDocumentAction={handleDocumentAction}
                        updateApplication={updateApplication}
                    />
                )
            ) : (
                <div className="text-center py-12">
                    <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-12 w-12 text-gray-400"/>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        No {showRejected ? 'rejected' : 'active'} applications found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                        {ui.searchQuery 
                            ? 'Try adjusting your search terms or clear the search to see all applications.'
                            : showRejected
                                ? 'Rejected applications will appear here when you mark them as rejected.'
                                : 'Add your first application using the form above to get started!'
                        }
                    </p>
                </div>
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
                onSaveNotes={async (notes: string) => {
                    if (notesModal.application) {
                        try {
                            await updateApplication(notesModal.application.id, { notes });
                            showToast({
                                type: 'success',
                                message: 'Notes saved successfully!'
                            });
                        } catch (error) {
                            console.error('Failed to save notes:', error);
                            showToast({
                                type: 'error',
                                message: 'Failed to save notes. Please try again.'
                            });
                        }
                    }
                }}
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
    onDelete: (id: string, company: string) => void;
    onNotesClick?: (app: Application) => void;
    onResumeClick?: (app: Application) => void;

    formatDate: (date: string) => string;
    searchQuery?: string;
    showRejected: boolean;
    getCompanyColor: (companyName: string) => string;
    // Edit modal function
    handleEditClick: (application: Application) => void;
    handleDocumentAction: (action: 'view' | 'download' | 'copy', attachment: Attachment) => void;
    // Application update function
    updateApplication?: (id: string, updates: Partial<Application>) => Promise<void>;
}

// Mobile Card View Component
const MobileCardView: React.FC<ViewProps> = memo(({
                                                      applications,
                                                      selectedIds,
                                                      onToggleSelection,
                                                      onDelete,
                                                      onNotesClick,
                                                      onResumeClick,

                                                      formatDate,
                                                      searchQuery,
                                                      showRejected,
                                                      getCompanyColor
                                                  }) => {
    const highlightText = useCallback((text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    }, [searchQuery]);

    // Create a default highlightText function if searchQuery is not provided
    const defaultHighlightText = useCallback((text: string) => text, []);

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
        <div className="space-y-1">
            {applications.map((app) => (
                <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedIds.includes(app.id)}
                    onToggleSelection={() => onToggleSelection(app.id)}
                    onDelete={() => onDelete(app.id, app.company)}
                    onNotesClick={() => onNotesClick?.(app)}
                    onResumeClick={() => onResumeClick?.(app)}
                    formatDate={formatDate}
                    highlightText={searchQuery ? highlightText : defaultHighlightText}
                    getCompanyColor={getCompanyColor}
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
    onDelete: () => void;
    onNotesClick: () => void;
    onResumeClick: () => void;
    formatDate: (date: string) => string;
    highlightText: (text: string) => string;
    getCompanyColor: (companyName: string) => string;
}

const ApplicationCard: React.FC<CardProps> = memo(({
                                                       application,
                                                       isSelected,
                                                       onToggleSelection,
                                                       onDelete,
                                                       onNotesClick,
                                                       onResumeClick,
                                                       formatDate,
                                                       highlightText,
                                                       getCompanyColor
                                                   }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const companyColorClasses = getCompanyColor(application.company);
    // Removed unused hasNotes

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border transition-all duration-200 shadow-sm ${
            isSelected ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}>
            <div className="p-2 sm:p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelection}
                            className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 w-3 h-3 flex-shrink-0 dark:bg-gray-700"
                            style={{ 
                                width: '14px', 
                                height: '14px', 
                                minWidth: '14px', 
                                minHeight: '14px',
                                maxWidth: '14px',
                                maxHeight: '14px'
                            }}
                            aria-label={`Select application for ${application.company}`}
                        />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                                <div
                                    className={`w-2 h-2 rounded-full border flex-shrink-0 ${companyColorClasses.split(' ')[0]} ${companyColorClasses.split(' ')[2]}`}/>
                                <h3
                                    className="font-bold text-sm text-gray-900 dark:text-gray-100 whitespace-normal break-words leading-tight"
                                    dangerouslySetInnerHTML={{__html: highlightText(application.company)}}
                                />
                            </div>
                            <p
                                className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-normal break-words leading-relaxed"
                                dangerouslySetInnerHTML={{__html: highlightText(application.position)}}
                            />
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                            application.status === 'Applied' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' :
                            application.status === 'Interview' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' :
                            application.status === 'Offer' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' :
                            'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                            {application.status}
                        </span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs mb-2">
                    <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0"/>
                        <span className="text-gray-700 dark:text-gray-200 whitespace-nowrap font-medium">
              {formatDate(application.dateApplied)}
            </span>
                    </div>
                    <span className="text-gray-400">•</span>
                    <div className="flex items-center gap-2">
                        {/* Work Type */}
                        <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase whitespace-nowrap ${
                                application.type === 'Remote'
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700'
                                    : application.type === 'Onsite'
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                        : application.type === 'Hybrid'
                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                            }`}>
                            {application.type === 'Remote' ? '🏠' : application.type === 'Onsite' ? '🏢' : '🔄'} {application.type}
                        </span>
                        
                        {/* Employment Type */}
                        {application.employmentType && application.employmentType !== '-' ? (
                            <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase whitespace-nowrap ${
                                    application.employmentType === 'Full-time'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700'
                                        : application.employmentType === 'Contract'
                                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700'
                                            : application.employmentType === 'Part-time'
                                                ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700'
                                                : application.employmentType === 'Internship'
                                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700'
                                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                                }`}>
                                {application.employmentType === 'Full-time' ? '💼' : 
                                 application.employmentType === 'Contract' ? '📋' : 
                                 application.employmentType === 'Part-time' ? '⏰' : '🎓'} {application.employmentType}
                            </span>
                        ) : (
                            <span className="text-gray-400 text-xs">-</span>
                        )}
                    </div>
                    {application.location && (
                        <>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center space-x-1">
                                <MapPin className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0"/>
                                <span
                                    className="text-gray-700 dark:text-gray-200 whitespace-normal break-words font-medium"
                                    dangerouslySetInnerHTML={{__html: highlightText(application.location)}}
                                />
                            </div>
                        </>
                    )}
                    {application.salary && application.salary !== '-' && (
                        <>
                            <span className="text-gray-400">•</span>
                            <div className="flex items-center space-x-1">
                                <DollarSign className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0"/>
                                <span className="text-gray-700 dark:text-gray-200 whitespace-normal break-words font-medium">
                {application.salary}
              </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Expanded Notes Section */}
                {isExpanded && application.notes && application.notes.trim() && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Notes</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                            <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                                {application.notes}
                            </p>
                        </div>
                    </div>
                )}

                <div
                    className="flex items-center justify-between gap-1 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-1 flex-wrap">
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150"
                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        >
                            {isExpanded ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}
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

                    <div className="flex items-center justify-end sm:justify-start">
                        <button
                            onClick={onDelete}
                            className="p-2.5 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                            aria-label="Delete application"
                        >
                            <Trash2 className="h-5 w-5"/>
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
                                                                                                          onDelete,
                                                                                                          onNotesClick,
                                                                                                          onResumeClick,
                                                                                                          formatDate,
                                                                                                          showRejected,
                                                                                                          startIndex,
                                                                                                          onSelectAll,
                                                                                                          getCompanyColor,
                                                                                                          handleEditClick,
                                                                                                          updateApplication
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
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" style={{ tableLayout: 'auto' }}>
                    <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <th className="w-10 px-2 py-2 text-center">
                            <input
                                type="checkbox"
                                checked={allCurrentPageSelected}
                                onChange={onSelectAll}
                                className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                style={{ 
                                    width: '14px', 
                                    height: '14px', 
                                    minWidth: '14px', 
                                    minHeight: '14px',
                                    maxWidth: '14px',
                                    maxHeight: '14px'
                                }}
                                aria-label="Select all applications on this page"
                            />
                        </th>
                        <th className="w-12 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">#</th>
                        <th className="w-20 px-2 py-2 text-center text-xs font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Date</th>
                        <th className="w-28 px-2 py-2 text-left text-xs font-extrabold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Company</th>
                        <th className="w-32 px-2 py-2 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Position</th>
                        <th className="w-20 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Work Type</th>
                        <th className="w-20 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Employment</th>
                        <th className="w-24 px-2 py-2 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Location</th>
                        <th className="w-20 px-2 py-2 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Salary</th>
                        <th className="w-24 px-2 py-2 text-left text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Source</th>
                        <th className="w-20 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Status</th>
                        <th className="w-24 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Notes</th>
                        <th className="w-16 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Resume</th>
                        <th className="w-12 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">URL</th>
                        <th className="w-20 px-2 py-2 text-center text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {applications.map((app, index) => {
                        const companyColorClasses = getCompanyColor(app.company);

                        return (
                            <tr
                                key={app.id}
                                className={`group transition-colors duration-150 ${
                                    false
                                        ? 'bg-blue-50 dark:bg-blue-900/10 border-l-4 border-l-blue-500'
                                        : selectedIds.includes(app.id)
                                        ? 'bg-blue-50 dark:bg-blue-900/20'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <td className="w-10 px-2 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(app.id)}
                                        onChange={() => onToggleSelection(app.id)}
                                        className="w-3 h-3 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                style={{ 
                                    width: '14px', 
                                    height: '14px', 
                                    minWidth: '14px', 
                                    minHeight: '14px',
                                    maxWidth: '14px',
                                    maxHeight: '14px'
                                }}
                                        aria-label={`Select application for ${app.company}`}
                                    />
                                </td>
                                <td className="w-12 px-2 py-2 text-center text-sm text-gray-700 dark:text-gray-200 font-bold">
                                    {startIndex + index + 1}
                                </td>
                                <td className="w-20 px-2 py-2 text-center">
                                    <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap overflow-hidden">
                                        {formatDate(app.dateApplied)}
                                    </div>
                                </td>
                                <td className="w-28 px-2 py-2 text-left">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={`w-3 h-3 rounded-full border flex-shrink-0 ${companyColorClasses.split(' ')[0]} ${companyColorClasses.split(' ')[2]}`}/>
                                        <span className="text-sm font-extrabold text-gray-900 dark:text-gray-100 whitespace-normal break-words block w-28">
                                            {app.company}
                                        </span>
                                    </div>
                                </td>
                                <td className="w-32 px-2 py-2 text-left">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 whitespace-normal break-words block w-32">
                                        {app.position}
                                    </span>
                                </td>
                                {/* Work Type Column */}
                                <td className="w-20 px-2 py-2 text-center">
                                    <span
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase whitespace-nowrap min-w-[70px] justify-center ${
                                            app.type === 'Remote' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700' :
                                                app.type === 'Onsite' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700' :
                                                    app.type === 'Hybrid' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                                        }`}>
                                        {app.type === 'Remote' ? '🏠' : app.type === 'Onsite' ? '🏢' : '🔄'} {app.type}
                                    </span>
                                </td>
                                
                                {/* Employment Type Column */}
                                <td className="w-20 px-2 py-2 text-center">
                                    {app.employmentType && app.employmentType !== '-' ? (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase whitespace-nowrap min-w-[70px] justify-center ${
                                                app.employmentType === 'Full-time' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700' :
                                                    app.employmentType === 'Contract' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-200 dark:border-orange-700' :
                                                        app.employmentType === 'Part-time' ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-700' :
                                                            app.employmentType === 'Internship' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                                            }`}>
                                            {app.employmentType === 'Full-time' ? '💼' : 
                                             app.employmentType === 'Contract' ? '📋' : 
                                             app.employmentType === 'Part-time' ? '⏰' : '🎓'} {app.employmentType}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 text-xs">-</span>
                                    )}
                                </td>
                                <td className="w-24 px-2 py-2 text-left">
                                    {false ? (
                                        <input
                                            type="text"
                                            value={app.location || ''}
                                            onChange={() => {}}
                                            placeholder="Enter location"
                                            className="text-sm text-gray-700 dark:text-gray-300 border border-blue-300 rounded px-2 py-1 w-full min-w-[150px] focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all duration-200"
                                            maxLength={50}
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-normal break-words block w-20 font-medium">
                                            {app.location || <span className="text-gray-400 italic">-</span>}
                                        </span>
                                    )}
                                </td>
                                <td className="w-20 px-2 py-2 text-left">
                                    {false ? (
                                        <input
                                            type="text"
                                            value={app.salary || ''}
                                            onChange={() => {}}
                                            placeholder="Enter salary"
                                            className="text-sm text-gray-700 dark:text-gray-300 border border-blue-300 rounded px-2 py-1 w-full min-w-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all duration-200"
                                            maxLength={20}
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-normal break-words block w-20 font-medium">
                                            {app.salary || <span className="text-gray-400 italic">-</span>}
                                        </span>
                                    )}
                                </td>
                                <td className="w-24 px-2 py-2 text-left">
                                    {false ? (
                                        <input
                                            type="text"
                                            value={app.jobSource || ''}
                                            onChange={() => {}}
                                            placeholder="Enter source"
                                            className="text-sm text-gray-700 dark:text-gray-300 border border-blue-300 rounded px-2 py-1 w-full min-w-[120px] focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium transition-all duration-200"
                                            maxLength={30}
                                        />
                                    ) : (
                                        <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-normal break-words block w-20 font-medium">
                                            {app.jobSource || <span className="text-gray-400 italic">-</span>}
                                        </span>
                                    )}
                                </td>
                                <td className="w-20 px-2 py-2 text-center">
                                    <select
                                        value={app.status}
                                        onChange={(e) => {
                                            // Update status directly without entering edit mode
                                            const newStatus = e.target.value as ApplicationStatus;
                                            // Call updateApplication directly
                                            updateApplication?.(app.id, { status: newStatus });
                                        }}
                                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-medium min-w-[100px] transition-all duration-200"
                                    >
                                        {['Applied', 'Interview', 'Offer', 'Rejected'].map(status => (
                                            <option key={status} value={status}>{status}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="w-24 px-2 py-2 text-center">
                                    <NotesIcon
                                        application={app}
                                        onClick={() => onNotesClick?.(app)}
                                    />
                                </td>
                                <td className="w-16 px-2 py-2 text-center">
                                    <ResumeIcon
                                        application={app}
                                        onClick={() => onResumeClick?.(app)}
                                    />
                                </td>
                                <td className="w-12 px-2 py-2 text-center">
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
                                <td className="w-20 px-2 py-2 text-center">
                                    <div className="flex items-center justify-center space-x-1">
                                        {false ? (
                                            <>
                                                <button
                                                    onClick={() => {}}
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-150"
                                                    title="Save changes"
                                                    aria-label="Save changes"
                                                >
                                                    <Check className="h-3.5 w-3.5"/>
                                                </button>
                                                <button
                                                    onClick={() => {}}
                                                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors duration-150"
                                                    title="Cancel editing"
                                                    aria-label="Cancel editing"
                                                >
                                                    <X className="h-3.5 w-3.5"/>
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEditClick(app)}
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
                                            </>
                                        )}
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

// @ts-ignore
export default React.memo(MobileResponsiveApplicationTable);