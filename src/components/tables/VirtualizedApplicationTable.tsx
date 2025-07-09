// src/components/tables/VirtualizedApplicationTable.tsx
// Use this instead of ApplicationTable.tsx when you have 100+ applications
import React, {memo, useCallback, useMemo, useState} from 'react';
import {FixedSizeList as List} from 'react-window';
import {Edit, ExternalLink, Paperclip, Search, StickyNote, Trash2, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {Application} from '../../types';
import SearchHighlight from '../ui/SearchHighlight';

const ITEM_HEIGHT = 64; // Height of each row in pixels
const VISIBLE_ITEMS = 10; // Number of items visible at once

interface VirtualizedTableProps {
    height?: number;
    width?: string;
}

const VirtualizedApplicationTable: React.FC<VirtualizedTableProps> = ({
                                                                          height = ITEM_HEIGHT * VISIBLE_ITEMS,
                                                                          width = '100%'
                                                                      }) => {
    const {
        filteredApplications,
        ui,
        setSearchQuery,
        openEditModal,
        deleteApplication
    } = useAppStore();

    const [showRejected, setShowRejected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Memoize filtered data
    const {activeApplications, rejectedApplications} = useMemo(() => ({
        activeApplications: filteredApplications.filter(app => app.status !== 'Rejected'),
        rejectedApplications: filteredApplications.filter(app => app.status === 'Rejected')
    }), [filteredApplications]);

    const currentApplications = showRejected ? rejectedApplications : activeApplications;

    // Memoize event handlers
    const handleDelete = useCallback((id: string, company: string) => {
        if (window.confirm(`Are you sure you want to delete the application for ${company}?`)) {
            deleteApplication(id);
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    }, [deleteApplication]);

    const toggleRowSelection = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    }, []);

    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }, []);

    const getStatusBadge = useCallback((status: string) => {
        const baseClasses = 'status-badge';
        switch (status) {
            case 'Applied':
                return `${baseClasses} status-applied`;
            case 'Interview':
                return `${baseClasses} status-interview`;
            case 'Offer':
                return `${baseClasses} status-offer`;
            case 'Rejected':
                return `${baseClasses} status-rejected`;
            default:
                return `${baseClasses} status-applied`;
        }
    }, []);

    // Debounced search
    const debouncedSearch = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (query: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setSearchQuery(query), 300);
        };
    }, [setSearchQuery]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearch(e.target.value);
    }, [debouncedSearch]);

    return (
        <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
                    <input
                        type="text"
                        placeholder="Search applications..."
                        onChange={handleSearchChange}
                        className="form-input pl-10 pr-10"
                    />
                    {ui.searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    )}
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => setShowRejected(false)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            !showRejected
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        Active ({activeApplications.length})
                    </button>
                    <button
                        onClick={() => setShowRejected(true)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            showRejected
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        Rejected ({rejectedApplications.length})
                    </button>
                </div>
            </div>

            {/* Virtual Scrolling Table */}
            <div className="card overflow-hidden">
                {/* Table Header */}
                <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div
                        className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="col-span-1">
                            <input
                                type="checkbox"
                                checked={currentApplications.length > 0 && selectedIds.length === currentApplications.length}
                                onChange={() => {
                                    if (selectedIds.length === currentApplications.length) {
                                        setSelectedIds([]);
                                    } else {
                                        setSelectedIds(currentApplications.map(app => app.id));
                                    }
                                }}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                        </div>
                        <div className="col-span-1">#</div>
                        <div className="col-span-1">Date</div>
                        <div className="col-span-2">Company</div>
                        <div className="col-span-2">Position</div>
                        <div className="col-span-1">Type</div>
                        <div className="col-span-1">Status</div>
                        <div className="col-span-1">URL</div>
                        <div className="col-span-2">Actions</div>
                    </div>
                </div>

                {/* Virtualized List */}
                {currentApplications.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <div className="text-gray-500 dark:text-gray-400">
                            {ui.searchQuery ? (
                                <>
                                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                                    <p>No applications found matching "{ui.searchQuery}"</p>
                                </>
                            ) : (
                                <>
                                    <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                                    <p>No {showRejected ? 'rejected' : 'active'} applications yet</p>
                                    {!showRejected && (
                                        <p className="text-sm mt-1">Add your first application above!</p>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                ) : (
                    <List
                        height={height}
                        itemCount={currentApplications.length}
                        itemSize={ITEM_HEIGHT}
                        width={width}
                        itemData={{
                            applications: currentApplications,
                            selectedIds,
                            onToggleSelection: toggleRowSelection,
                            onEdit: openEditModal,
                            onDelete: handleDelete,
                            formatDate,
                            getStatusBadge,
                            searchQuery: ui.searchQuery
                        }}
                    >
                        {VirtualizedRow}
                    </List>
                )}
            </div>

            {/* Statistics */}
            <div className="text-sm text-gray-700 dark:text-gray-300 text-center">
                Showing {currentApplications.length} applications
                {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
            </div>
        </div>
    );
};

// Memoized Row Component for Virtual Scrolling
interface VirtualizedRowProps {
    index: number;
    style: React.CSSProperties;
    data: {
        applications: Application[];
        selectedIds: string[];
        onToggleSelection: (id: string) => void;
        onEdit: (app: Application) => void;
        onDelete: (id: string, company: string) => void;
        formatDate: (date: string) => string;
        getStatusBadge: (status: string) => string;
        searchQuery: string;
    };
}

const VirtualizedRow: React.FC<VirtualizedRowProps> = memo(({index, style, data}) => {
    const {
        applications,
        selectedIds,
        onToggleSelection,
        onEdit,
        onDelete,
        formatDate,
        getStatusBadge,
        searchQuery
    } = data;

    const application = applications[index];
    const isSelected = selectedIds.includes(application.id);

    const [popupState, setPopupState] = useState<{
        showNotes: boolean;
        showAttachments: boolean;
    }>({showNotes: false, showAttachments: false});

    const hasNotes = useMemo(() => Boolean(application.notes), [application.notes]);
    const hasAttachments = useMemo(() =>
        Boolean(application.attachments?.length), [application.attachments]
    );

    const toggleNotes = useCallback(() => {
        setPopupState(prev => ({...prev, showNotes: !prev.showNotes}));
    }, []);

    const toggleAttachments = useCallback(() => {
        setPopupState(prev => ({...prev, showAttachments: !prev.showAttachments}));
    }, []);

    const handleToggleSelection = useCallback(() => {
        onToggleSelection(application.id);
    }, [onToggleSelection, application.id]);

    const handleEdit = useCallback(() => {
        onEdit(application);
    }, [onEdit, application]);

    const handleDelete = useCallback(() => {
        onDelete(application.id, application.company);
    }, [onDelete, application.id, application.company]);

    return (
        <div
            style={style}
            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
            }`}
        >
            <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleToggleSelection}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                </div>

                {/* Index */}
                <div className="col-span-1 text-sm text-gray-500 dark:text-gray-400">
                    {index + 1}
                </div>

                {/* Date */}
                <div className="col-span-1 text-sm font-medium">
                    {formatDate(application.dateApplied)}
                </div>

                {/* Company */}
                <div className="col-span-2 font-medium truncate">
                    <SearchHighlight
                        text={application.company}
                        searchQuery={searchQuery}
                        className="text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* Position */}
                <div className="col-span-2 truncate">
                    <SearchHighlight
                        text={application.position}
                        searchQuery={searchQuery}
                        className="text-gray-900 dark:text-gray-100"
                    />
                </div>

                {/* Type */}
                <div className="col-span-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        application.type === 'Remote'
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : application.type === 'Hybrid'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                    }`}>
                        {application.type}
                    </span>
                </div>

                {/* Status */}
                <div className="col-span-1">
                    <span className={getStatusBadge(application.status)}>
                        {application.status}
                    </span>
                </div>

                {/* URL */}
                <div className="col-span-1">
                    {application.jobUrl ? (
                        <button
                            onClick={() => window.open(application.jobUrl, '_blank')}
                            className="btn btn-sm btn-outline"
                            title="Open job posting"
                        >
                            <ExternalLink className="h-3 w-3"/>
                        </button>
                    ) : (
                        <span className="text-gray-400">-</span>
                    )}
                </div>

                {/* Actions */}
                <div className="col-span-2 relative">
                    <div className="flex items-center space-x-1">
                        {hasNotes && (
                            <button
                                onClick={toggleNotes}
                                className="btn btn-sm btn-outline"
                                title="View notes"
                            >
                                <StickyNote className="h-3 w-3"/>
                            </button>
                        )}

                        {hasAttachments && (
                            <button
                                onClick={toggleAttachments}
                                className="btn btn-sm btn-outline"
                                title={`${application.attachments!.length} attachments`}
                            >
                                <Paperclip className="h-3 w-3"/>
                                <span className="ml-1 text-xs">{application.attachments!.length}</span>
                            </button>
                        )}

                        <button
                            onClick={handleEdit}
                            className="btn btn-sm btn-outline text-amber-600 hover:text-amber-700"
                            title="Edit application"
                        >
                            <Edit className="h-3 w-3"/>
                        </button>

                        <button
                            onClick={handleDelete}
                            className="btn btn-sm btn-outline text-red-600 hover:text-red-700"
                            title="Delete application"
                        >
                            <Trash2 className="h-3 w-3"/>
                        </button>
                    </div>

                    {/* Popups */}
                    {popupState.showNotes && hasNotes && (
                        <div
                            className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-xs right-0">
                            <div className="text-sm">
                                <SearchHighlight
                                    text={application.notes!}
                                    searchQuery={searchQuery}
                                    className="text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>
                    )}

                    {popupState.showAttachments && hasAttachments && (
                        <div
                            className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-48 right-0">
                            <div className="space-y-2">
                                {application.attachments!.map((attachment, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-gray-900 dark:text-gray-100 truncate flex-1">
                                            {attachment.name}
                                        </span>
                                        <a
                                            href={attachment.data}
                                            download={attachment.name}
                                            className="ml-2 text-primary-600 hover:text-primary-700"
                                            title="Download"
                                        >
                                            <ExternalLink className="h-3 w-3"/>
                                        </a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    const prevApp = prevProps.data.applications[prevProps.index];
    const nextApp = nextProps.data.applications[nextProps.index];
    const prevSelected = prevProps.data.selectedIds.includes(prevApp?.id);
    const nextSelected = nextProps.data.selectedIds.includes(nextApp?.id);

    return (
        prevApp?.id === nextApp?.id &&
        prevApp?.updatedAt === nextApp?.updatedAt &&
        prevSelected === nextSelected &&
        prevProps.data.searchQuery === nextProps.data.searchQuery
    );
});

VirtualizedRow.displayName = 'VirtualizedRow';

export default VirtualizedApplicationTable;