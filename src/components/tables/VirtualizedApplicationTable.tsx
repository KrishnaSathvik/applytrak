// src/components/tables/VirtualizedApplicationTable.tsx
// Production-ready virtualized table for handling 100+ applications efficiently
import React, {memo, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {FixedSizeList as List} from 'react-window';
import {Edit, ExternalLink, Paperclip, Search, StickyNote, Trash2, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {Application} from '../../types';
import SearchHighlight from '../ui/SearchHighlight';

// Constants for performance optimization
const ITEM_HEIGHT = 64;
const VISIBLE_ITEMS = 10;
const SEARCH_DEBOUNCE_MS = 300;

interface VirtualizedTableProps {
    height?: number;
    width?: string;
    className?: string;
}

interface PopupState {
    showNotes: boolean;
    showAttachments: boolean;
}

interface VirtualizedRowData {
    applications: Application[];
    selectedIds: string[];
    onToggleSelection: (id: string) => void;
    onEdit: (app: Application) => void;
    onDelete: (id: string, company: string) => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    searchQuery: string;
}

const VirtualizedApplicationTable: React.FC<VirtualizedTableProps> = ({
                                                                          height = ITEM_HEIGHT * VISIBLE_ITEMS,
                                                                          width = '100%',
                                                                          className = ''
                                                                      }) => {
    const {
        filteredApplications,
        ui,
        setSearchQuery,
        openEditModal,
        deleteApplication
    } = useAppStore();

    // State management
    const [showRejected, setShowRejected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, []);

    // Memoized filtered data with performance optimization
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

        return {
            activeApplications: active,
            rejectedApplications: rejected
        };
    }, [filteredApplications]);

    const currentApplications = showRejected ? rejectedApplications : activeApplications;

    // Optimized event handlers with useCallback
    const handleDelete = useCallback(async (id: string, company: string) => {
        if (!window.confirm(`Are you sure you want to delete the application for ${company}?`)) {
            return;
        }

        try {
            await deleteApplication(id);
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } catch (error) {
            console.error('Failed to delete application:', error);
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
        const allCurrentIds = currentApplications.map(app => app.id);
        const allSelected = allCurrentIds.length > 0 &&
            allCurrentIds.every(id => selectedIds.includes(id));

        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !allCurrentIds.includes(id)));
        } else {
            setSelectedIds(prev => {
                const filtered = prev.filter(id => !allCurrentIds.includes(id));
                return [...filtered, ...allCurrentIds];
            });
        }
    }, [currentApplications, selectedIds]);

    // Memoized utility functions
    const formatDate = useCallback((dateString: string): string => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Invalid Date';
            }

            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Invalid Date';
        }
    }, []);

    const getStatusBadge = useCallback((status: string): string => {
        const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';

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

    // Optimized debounced search
    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        debounceRef.current = setTimeout(() => {
            setSearchQuery(query);
        }, SEARCH_DEBOUNCE_MS);
    }, [setSearchQuery]);

    const handleClearSearch = useCallback(() => {
        setSearchQuery('');
    }, [setSearchQuery]);

    const handleTabSwitch = useCallback((rejected: boolean) => {
        setShowRejected(rejected);
        setSelectedIds([]); // Clear selection when switching tabs
    }, []);

    // Memoized row data for virtual list
    const rowData = useMemo((): VirtualizedRowData => ({
        applications: currentApplications,
        selectedIds,
        onToggleSelection: toggleRowSelection,
        onEdit: openEditModal,
        onDelete: handleDelete,
        formatDate,
        getStatusBadge,
        searchQuery: ui.searchQuery
    }), [
        currentApplications,
        selectedIds,
        toggleRowSelection,
        openEditModal,
        handleDelete,
        formatDate,
        getStatusBadge,
        ui.searchQuery
    ]);

    const isAllSelected = useMemo(() =>
            currentApplications.length > 0 &&
            currentApplications.every(app => selectedIds.includes(app.id))
        , [currentApplications, selectedIds]);

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <div className="relative flex-1 max-w-md">
                    <Search
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none"
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        placeholder="Search applications..."
                        defaultValue={ui.searchQuery}
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        aria-label="Search applications"
                    />
                    {ui.searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    )}
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1" role="tablist">
                    <button
                        onClick={() => handleTabSwitch(false)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            !showRejected
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        role="tab"
                        aria-selected={!showRejected}
                    >
                        Active ({activeApplications.length})
                    </button>
                    <button
                        onClick={() => handleTabSwitch(true)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            showRejected
                                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                        role="tab"
                        aria-selected={showRejected}
                    >
                        Rejected ({rejectedApplications.length})
                    </button>
                </div>
            </div>

            {/* Virtual Scrolling Table */}
            <div
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                {/* Table Header */}
                <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <div
                        className="grid grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <div className="col-span-1">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                aria-label="Select all applications"
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

                {/* Content Area */}
                {currentApplications.length === 0 ? (
                    <EmptyState
                        searchQuery={ui.searchQuery}
                        showRejected={showRejected}
                    />
                ) : (
                    <List
                        height={height}
                        itemCount={currentApplications.length}
                        itemSize={ITEM_HEIGHT}
                        width={width}
                        itemData={rowData}
                        overscanCount={5} // Render 5 extra items for smoother scrolling
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

// Empty state component
interface EmptyStateProps {
    searchQuery: string;
    showRejected: boolean;
}

const EmptyState: React.FC<EmptyStateProps> = ({searchQuery, showRejected}) => (
    <div className="px-6 py-12 text-center">
        <div className="text-gray-500 dark:text-gray-400">
            {searchQuery ? (
                <>
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true"/>
                    <p className="text-lg font-medium">No applications found</p>
                    <p className="text-sm mt-1">No applications match "{searchQuery}"</p>
                </>
            ) : (
                <>
                    <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" aria-hidden="true"/>
                    <p className="text-lg font-medium">No {showRejected ? 'rejected' : 'active'} applications</p>
                    {!showRejected && (
                        <p className="text-sm mt-1">Add your first application above!</p>
                    )}
                </>
            )}
        </div>
    </div>
);

// Memoized Row Component for Virtual Scrolling
interface VirtualizedRowProps {
    index: number;
    style: React.CSSProperties;
    data: VirtualizedRowData;
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
    if (!application) return null;

    const isSelected = selectedIds.includes(application.id);

    const [popupState, setPopupState] = useState<PopupState>({
        showNotes: false,
        showAttachments: false
    });

    // Memoized computed values
    const hasNotes = useMemo(() => Boolean(application.notes?.trim()), [application.notes]);
    const hasAttachments = useMemo(() =>
        Boolean(application.attachments?.length), [application.attachments]
    );

    // Event handlers
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

    const handleUrlClick = useCallback(() => {
        if (application.jobUrl) {
            window.open(application.jobUrl, '_blank', 'noopener,noreferrer');
        }
    }, [application.jobUrl]);

    return (
        <div
            style={style}
            className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
            }`}
        >
            <div className="grid grid-cols-12 gap-4 px-4 py-3 items-center">
                {/* Checkbox */}
                <div className="col-span-1">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={handleToggleSelection}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select application for ${application.company}`}
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
                    <TypeBadge type={application.type}/>
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
                            onClick={handleUrlClick}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                            title="Open job posting"
                            aria-label="Open job posting in new tab"
                        >
                            <ExternalLink className="h-3 w-3"/>
                        </button>
                    ) : (
                        <span className="text-gray-400" aria-label="No URL available">-</span>
                    )}
                </div>

                {/* Actions */}
                <div className="col-span-2 relative">
                    <ActionButtons
                        application={application}
                        hasNotes={hasNotes}
                        hasAttachments={hasAttachments}
                        popupState={popupState}
                        onToggleNotes={toggleNotes}
                        onToggleAttachments={toggleAttachments}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        searchQuery={searchQuery}
                    />
                </div>
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    // Optimized comparison for React.memo
    const prevApp = prevProps.data.applications[prevProps.index];
    const nextApp = nextProps.data.applications[nextProps.index];

    if (!prevApp || !nextApp) return false;

    const prevSelected = prevProps.data.selectedIds.includes(prevApp.id);
    const nextSelected = nextProps.data.selectedIds.includes(nextApp.id);

    return (
        prevApp.id === nextApp.id &&
        prevApp.updatedAt === nextApp.updatedAt &&
        prevSelected === nextSelected &&
        prevProps.data.searchQuery === nextProps.data.searchQuery
    );
});

// Type badge component
interface TypeBadgeProps {
    type: string;
}

const TypeBadge: React.FC<TypeBadgeProps> = memo(({type}) => {
    const getBadgeClass = () => {
        switch (type) {
            case 'Remote':
                return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
            case 'Hybrid':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
        }
    };

    return (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass()}`}>
      {type}
    </span>
    );
});

// Action buttons component
interface ActionButtonsProps {
    application: Application;
    hasNotes: boolean;
    hasAttachments: boolean;
    popupState: PopupState;
    onToggleNotes: () => void;
    onToggleAttachments: () => void;
    onEdit: () => void;
    onDelete: () => void;
    searchQuery: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = memo(({
                                                              application,
                                                              hasNotes,
                                                              hasAttachments,
                                                              popupState,
                                                              onToggleNotes,
                                                              onToggleAttachments,
                                                              onEdit,
                                                              onDelete,
                                                              searchQuery
                                                          }) => (
    <>
        <div className="flex items-center space-x-1">
            {hasNotes && (
                <button
                    onClick={onToggleNotes}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
                    title="View notes"
                    aria-label="View notes"
                >
                    <StickyNote className="h-3 w-3"/>
                </button>
            )}

            {hasAttachments && (
                <button
                    onClick={onToggleAttachments}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    title={`${application.attachments!.length} attachments`}
                    aria-label={`View ${application.attachments!.length} attachments`}
                >
                    <Paperclip className="h-3 w-3"/>
                    {application.attachments!.length > 1 && (
                        <span className="ml-1 text-xs">{application.attachments!.length}</span>
                    )}
                </button>
            )}

            <button
                onClick={onEdit}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                title="Edit application"
                aria-label="Edit application"
            >
                <Edit className="h-3 w-3"/>
            </button>

            <button
                onClick={onDelete}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                title="Delete application"
                aria-label="Delete application"
            >
                <Trash2 className="h-3 w-3"/>
            </button>
        </div>

        {/* Popups */}
        {popupState.showNotes && hasNotes && (
            <PopupNote
                notes={application.notes!}
                searchQuery={searchQuery}
            />
        )}

        {popupState.showAttachments && hasAttachments && (
            <PopupAttachments
                attachments={application.attachments!}
            />
        )}
    </>
));

// Popup components
interface PopupNoteProps {
    notes: string;
    searchQuery: string;
}

const PopupNote: React.FC<PopupNoteProps> = memo(({notes, searchQuery}) => (
    <div
        className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-xs right-0">
        <div className="text-sm">
            <SearchHighlight
                text={notes}
                searchQuery={searchQuery}
                className="text-gray-900 dark:text-gray-100"
            />
        </div>
    </div>
));

interface PopupAttachmentsProps {
    attachments: Application['attachments'];
}

const PopupAttachments: React.FC<PopupAttachmentsProps> = memo(({attachments}) => (
    <div
        className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-48 right-0">
        <div className="space-y-2">
            {attachments!.map((attachment, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
          <span className="text-gray-900 dark:text-gray-100 truncate flex-1">
            {attachment.name}
          </span>
                    <a
                        href={attachment.data}
                        download={attachment.name}
                        className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Download"
                        aria-label={`Download ${attachment.name}`}
                    >
                        <ExternalLink className="h-3 w-3"/>
                    </a>
                </div>
            ))}
        </div>
    </div>
));

// Set display names for better debugging
VirtualizedRow.displayName = 'VirtualizedRow';
TypeBadge.displayName = 'TypeBadge';
ActionButtons.displayName = 'ActionButtons';
PopupNote.displayName = 'PopupNote';
PopupAttachments.displayName = 'PopupAttachments';

export default VirtualizedApplicationTable;