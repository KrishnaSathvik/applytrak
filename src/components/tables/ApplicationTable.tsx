// src/components/tables/ApplicationTable.tsx - OPTIMIZED VERSION
import React, { useState, memo, useCallback, useMemo } from 'react';
import { Edit, ExternalLink, Paperclip, Search, StickyNote, Trash2, X } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Application } from '../../types';
import SearchHighlight from '../ui/SearchHighlight';
import BulkOperations from './BulkOperations';

const ApplicationTable: React.FC = () => {
    const {
        filteredApplications,
        ui,
        setSearchQuery,
        setCurrentPage,
        openEditModal,
        deleteApplication
    } = useAppStore();

    const [showRejected, setShowRejected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // OPTIMIZATION 1: Memoize filtered data to prevent recalculation
    const { activeApplications, rejectedApplications } = useMemo(() => ({
        activeApplications: filteredApplications.filter(app => app.status !== 'Rejected'),
        rejectedApplications: filteredApplications.filter(app => app.status === 'Rejected')
    }), [filteredApplications]);

    const currentApplications = showRejected ? rejectedApplications : activeApplications;

    // OPTIMIZATION 2: Memoize pagination calculations
    const { paginatedApplications, totalPages, startIndex, endIndex } = useMemo(() => {
        const startIdx = (ui.currentPage - 1) * ui.itemsPerPage;
        const endIdx = startIdx + ui.itemsPerPage;
        return {
            paginatedApplications: currentApplications.slice(startIdx, endIdx),
            totalPages: Math.ceil(currentApplications.length / ui.itemsPerPage),
            startIndex: startIdx,
            endIndex: endIdx
        };
    }, [currentApplications, ui.currentPage, ui.itemsPerPage]);

    // OPTIMIZATION 3: Memoize event handlers to prevent prop changes
    const handleDelete = useCallback((id: string, company: string) => {
        if (window.confirm(`Are you sure you want to delete the application for ${company}? This action cannot be undone.`)) {
            deleteApplication(id);
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    }, [deleteApplication]);

    const handleSelectionChange = useCallback((newSelectedIds: string[]) => {
        setSelectedIds(newSelectedIds);
    }, []);

    const toggleRowSelection = useCallback((id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    }, []);

    // OPTIMIZATION 4: Memoize utility functions
    const formatDate = useCallback((dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }, []);

    const getStatusBadge = useCallback((status: string) => {
        const baseClasses = 'status-badge';
        switch (status) {
            case 'Applied': return `${baseClasses} status-applied`;
            case 'Interview': return `${baseClasses} status-interview`;
            case 'Offer': return `${baseClasses} status-offer`;
            case 'Rejected': return `${baseClasses} status-rejected`;
            default: return `${baseClasses} status-applied`;
        }
    }, []);

    // OPTIMIZATION 5: Debounced search with useMemo
    const debouncedSearch = useMemo(() => {
        let timeoutId: NodeJS.Timeout;
        return (query: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => setSearchQuery(query), 300);
        };
    }, [setSearchQuery]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        debouncedSearch(query);
    }, [debouncedSearch]);

    return (
        <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* OPTIMIZED Search */}
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

                {/* Toggle Buttons */}
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

            {/* Bulk Operations */}
            <BulkOperations
                applications={paginatedApplications}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
            />

            {/* OPTIMIZED Table */}
            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="table">
                        <thead>
                        <tr>
                            <th className="w-12">
                                <input
                                    type="checkbox"
                                    checked={paginatedApplications.length > 0 && selectedIds.length === paginatedApplications.length}
                                    onChange={() => {
                                        if (selectedIds.length === paginatedApplications.length) {
                                            setSelectedIds([]);
                                        } else {
                                            setSelectedIds(paginatedApplications.map(app => app.id));
                                        }
                                    }}
                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                            </th>
                            <th className="w-16">#</th>
                            <th className="min-w-24">Date</th>
                            <th className="min-w-32">Company</th>
                            <th className="min-w-32">Position</th>
                            <th className="min-w-20">Type</th>
                            <th className="min-w-24 hidden md:table-cell">Location</th>
                            <th className="min-w-24 hidden lg:table-cell">Salary</th>
                            <th className="min-w-20 hidden xl:table-cell">Source</th>
                            <th className="min-w-20">Status</th>
                            <th className="min-w-16">URL</th>
                            <th className="min-w-32">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedApplications.length === 0 ? (
                            <tr>
                                <td colSpan={12} className="px-6 py-12 text-center">
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
                                </td>
                            </tr>
                        ) : (
                            // OPTIMIZATION 6: Use memoized ApplicationRow
                            paginatedApplications.map((app, index) => (
                                <MemoizedApplicationRow
                                    key={app.id}
                                    application={app}
                                    index={startIndex + index + 1}
                                    isSelected={selectedIds.includes(app.id)}
                                    onToggleSelection={() => toggleRowSelection(app.id)}
                                    onEdit={() => openEditModal(app)}
                                    onDelete={() => handleDelete(app.id, app.company)}
                                    formatDate={formatDate}
                                    getStatusBadge={getStatusBadge}
                                    searchQuery={ui.searchQuery}
                                />
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Showing {startIndex + 1} to {Math.min(endIndex, currentApplications.length)} of{' '}
                        {currentApplications.length} applications
                    </div>
                    <div className="flex space-x-1">
                        <button
                            onClick={() => setCurrentPage(ui.currentPage - 1)}
                            disabled={ui.currentPage === 1}
                            className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({length: totalPages}, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`btn btn-sm ${
                                    page === ui.currentPage
                                        ? 'btn-primary'
                                        : 'btn-secondary'
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(ui.currentPage + 1)}
                            disabled={ui.currentPage === totalPages}
                            className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// OPTIMIZATION 7: Completely optimize ApplicationRow with memo and single state
interface ApplicationRowProps {
    application: Application;
    index: number;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    searchQuery: string;
}

const ApplicationRow: React.FC<ApplicationRowProps> = memo(({
                                                                application,
                                                                index,
                                                                isSelected,
                                                                onToggleSelection,
                                                                onEdit,
                                                                onDelete,
                                                                formatDate,
                                                                getStatusBadge,
                                                                searchQuery
                                                            }) => {
    // OPTIMIZATION: Single state instead of multiple useState
    const [popupState, setPopupState] = useState<{
        showNotes: boolean;
        showAttachments: boolean;
    }>({ showNotes: false, showAttachments: false });

    // OPTIMIZATION: Memoize expensive operations
    const hasNotes = useMemo(() => Boolean(application.notes), [application.notes]);
    const hasAttachments = useMemo(() =>
        Boolean(application.attachments?.length), [application.attachments]
    );

    const toggleNotes = useCallback(() => {
        setPopupState(prev => ({ ...prev, showNotes: !prev.showNotes }));
    }, []);

    const toggleAttachments = useCallback(() => {
        setPopupState(prev => ({ ...prev, showAttachments: !prev.showAttachments }));
    }, []);

    return (
        <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
        }`}>
            <td>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggleSelection}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
            </td>
            <td className="text-sm text-gray-500 dark:text-gray-400">{index}</td>
            <td className="text-sm font-medium">
                {formatDate(application.dateApplied)}
            </td>
            <td className="font-medium">
                <SearchHighlight
                    text={application.company}
                    searchQuery={searchQuery}
                    className="text-gray-900 dark:text-gray-100"
                />
            </td>
            <td>
                <SearchHighlight
                    text={application.position}
                    searchQuery={searchQuery}
                    className="text-gray-900 dark:text-gray-100"
                />
            </td>
            <td>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    application.type === 'Remote'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : application.type === 'Hybrid'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
                    {application.type}
                </span>
            </td>
            <td className="hidden md:table-cell">
                <SearchHighlight
                    text={application.location || '-'}
                    searchQuery={searchQuery}
                    className="text-gray-600 dark:text-gray-400"
                />
            </td>
            <td className="hidden lg:table-cell text-sm text-gray-600 dark:text-gray-400">
                {application.salary || '-'}
            </td>
            <td className="hidden xl:table-cell text-sm text-gray-600 dark:text-gray-400">
                <SearchHighlight
                    text={application.jobSource || '-'}
                    searchQuery={searchQuery}
                />
            </td>
            <td>
                <span className={getStatusBadge(application.status)}>
                    {application.status}
                </span>
            </td>
            <td>
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
            </td>
            <td>
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
                        onClick={onEdit}
                        className="btn btn-sm btn-outline text-amber-600 hover:text-amber-700"
                        title="Edit application"
                    >
                        <Edit className="h-3 w-3"/>
                    </button>

                    <button
                        onClick={onDelete}
                        className="btn btn-sm btn-outline text-red-600 hover:text-red-700"
                        title="Delete application"
                    >
                        <Trash2 className="h-3 w-3"/>
                    </button>
                </div>

                {/* Optimized Popups */}
                {popupState.showNotes && hasNotes && (
                    <div className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-w-xs">
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
                    <div className="absolute z-10 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg min-w-48">
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
            </td>
        </tr>
    );
}, (prevProps, nextProps) => {
    // OPTIMIZATION: Custom comparison for better memoization
    return (
        prevProps.application.id === nextProps.application.id &&
        prevProps.application.updatedAt === nextProps.application.updatedAt &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.searchQuery === nextProps.searchQuery &&
        prevProps.index === nextProps.index
    );
});

ApplicationRow.displayName = 'ApplicationRow';

// Export memoized version
const MemoizedApplicationRow = memo(ApplicationRow);

export default ApplicationTable;