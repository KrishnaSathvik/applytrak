// src/components/tables/PaginatedApplicationTable.tsx - FIXED: Remove double pagination
import React, { useState, memo, useCallback, useMemo } from 'react';
import { Edit, ExternalLink, Paperclip, Search, StickyNote, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Application } from '../../types';
import SearchHighlight from '../ui/SearchHighlight';
import BulkOperations from './BulkOperations';

const ITEMS_PER_PAGE = 15;

const PaginatedApplicationTable: React.FC = () => {
    const {
        filteredApplications,
        ui,
        setSearchQuery,
        openEditModal,
        deleteApplication
    } = useAppStore();

    const [showRejected, setShowRejected] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);

    // Memoize filtered data
    const { activeApplications, rejectedApplications } = useMemo(() => ({
        activeApplications: filteredApplications.filter(app => app.status !== 'Rejected'),
        rejectedApplications: filteredApplications.filter(app => app.status === 'Rejected')
    }), [filteredApplications]);

    const currentApplications = showRejected ? rejectedApplications : activeApplications;

    // Pagination calculations
    const { paginatedApplications, totalPages, startIndex, endIndex, showingFrom, showingTo } = useMemo(() => {
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
            case 'Applied': return `${baseClasses} status-applied`;
            case 'Interview': return `${baseClasses} status-interview`;
            case 'Offer': return `${baseClasses} status-offer`;
            case 'Rejected': return `${baseClasses} status-rejected`;
            default: return `${baseClasses} status-applied`;
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
        const query = e.target.value;
        debouncedSearch(query);
        setCurrentPage(1);
    }, [debouncedSearch]);

    // Tab switching handler
    const handleTabSwitch = useCallback((rejected: boolean) => {
        setShowRejected(rejected);
        setCurrentPage(1);
        setSelectedIds([]);
    }, []);

    // Pagination handlers
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setSelectedIds([]);
        }
    }, [totalPages]);

    const goToPrevious = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    const goToNext = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    // Generate page numbers for pagination
    const pageNumbers = useMemo(() => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                }
            } else if (currentPage >= totalPages - 2) {
                for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                for (let i = currentPage - 2; i <= currentPage + 2; i++) {
                    pages.push(i);
                }
            }
        }

        return pages;
    }, [currentPage, totalPages]);

    return (
        <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                {/* Search */}
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

                {/* Tab Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                    <button
                        onClick={() => handleTabSwitch(false)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            !showRejected
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        Active ({activeApplications.length})
                    </button>
                    <button
                        onClick={() => handleTabSwitch(true)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            showRejected
                                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        Rejected ({rejectedApplications.length})
                    </button>
                </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <div>
                    Showing {showingFrom} to {showingTo} of {currentApplications.length} applications
                    {ui.searchQuery && (
                        <span className="ml-2 text-primary-600 dark:text-primary-400">
                            (filtered from {filteredApplications.length} total)
                        </span>
                    )}
                </div>
                <div className="text-xs">
                    {ITEMS_PER_PAGE} per page • Page {currentPage} of {totalPages}
                </div>
            </div>

            {/* Bulk Operations */}
            <BulkOperations
                applications={paginatedApplications}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
            />

            {/* FIXED TABLE - No Horizontal Scroll */}
            <div className="table-container">
                <div className="w-full">
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
                            <th className="w-24">Date</th>
                            <th className="w-32">Company</th>
                            <th className="w-40">Position</th>
                            <th className="w-20">Type</th>
                            <th className="w-28 optional-column">Location</th>
                            <th className="w-24 salary-column lg-hidden">Salary</th>
                            <th className="w-20 xl-hidden">Source</th>
                            <th className="w-20">Status</th>
                            <th className="w-16">URL</th>
                            <th className="w-32">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
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
                            paginatedApplications.map((app, index) => (
                                <ApplicationRow
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

            {/* SINGLE CENTERED Pagination Controls - FIXED: Only one pagination section */}
            {totalPages > 1 && (
                <div className="pagination-centered">
                    {/* Results info - Centered */}
                    <div className="pagination-info">
                        Page {currentPage} of {totalPages} • {currentApplications.length} total applications
                    </div>

                    {/* Pagination controls - Centered */}
                    <div className="pagination-controls">
                        {/* Previous button */}
                        <button
                            onClick={goToPrevious}
                            disabled={currentPage === 1}
                            className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </button>

                        {/* Page numbers */}
                        <div className="flex items-center gap-1">
                            {currentPage > 3 && totalPages > 5 && (
                                <>
                                    <button
                                        onClick={() => goToPage(1)}
                                        className="btn btn-secondary btn-sm min-w-[2.5rem]"
                                    >
                                        1
                                    </button>
                                    {currentPage > 4 && <span className="px-2 text-gray-400">...</span>}
                                </>
                            )}

                            {pageNumbers.map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`btn btn-sm min-w-[2.5rem] ${
                                        page === currentPage
                                            ? 'btn-primary'
                                            : 'btn-secondary'
                                    }`}
                                >
                                    {page}
                                </button>
                            ))}

                            {currentPage < totalPages - 2 && totalPages > 5 && (
                                <>
                                    {currentPage < totalPages - 3 && <span className="px-2 text-gray-400">...</span>}
                                    <button
                                        onClick={() => goToPage(totalPages)}
                                        className="btn btn-secondary btn-sm min-w-[2.5rem]"
                                    >
                                        {totalPages}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Next button */}
                        <button
                            onClick={goToNext}
                            disabled={currentPage === totalPages}
                            className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Application Row Component (unchanged)
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
    const [popupState, setPopupState] = useState<{
        showNotes: boolean;
        showAttachments: boolean;
    }>({ showNotes: false, showAttachments: false });

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

    // Truncate text for fixed width cells
    const truncateText = (text: string, maxLength: number) => {
        if (!text) return '-';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

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
            <td className="text-sm text-gray-500 dark:text-gray-400 text-center">{index}</td>
            <td className="text-sm font-medium">
                {formatDate(application.dateApplied)}
            </td>
            <td className="font-medium">
                <div className="truncate" title={application.company}>
                    <SearchHighlight
                        text={truncateText(application.company, 20)}
                        searchQuery={searchQuery}
                        className="text-gray-900 dark:text-gray-100"
                    />
                </div>
            </td>
            <td>
                <div className="truncate" title={application.position}>
                    <SearchHighlight
                        text={truncateText(application.position, 25)}
                        searchQuery={searchQuery}
                        className="text-gray-900 dark:text-gray-100"
                    />
                </div>
            </td>
            <td>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    application.type === 'Remote'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : application.type === 'Hybrid'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
                    {application.type}
                </span>
            </td>
            <td className="optional-column">
                <div className="truncate text-sm text-gray-600 dark:text-gray-400" title={application.location || '-'}>
                    <SearchHighlight
                        text={truncateText(application.location || '-', 18)}
                        searchQuery={searchQuery}
                    />
                </div>
            </td>
            <td className="salary-column lg-hidden text-sm text-gray-600 dark:text-gray-400">
                <div className="truncate" title={application.salary || '-'}>
                    {truncateText(application.salary || '-', 15)}
                </div>
            </td>
            <td className="xl-hidden text-sm text-gray-600 dark:text-gray-400">
                <div className="truncate" title={application.jobSource || '-'}>
                    <SearchHighlight
                        text={truncateText(application.jobSource || '-', 12)}
                        searchQuery={searchQuery}
                    />
                </div>
            </td>
            <td>
                <span className={getStatusBadge(application.status)}>
                    {application.status}
                </span>
            </td>
            <td className="text-center">
                {application.jobUrl ? (
                    <button
                        onClick={() => window.open(application.jobUrl, '_blank')}
                        className="btn btn-sm btn-outline p-1"
                        title="Open job posting"
                    >
                        <ExternalLink className="h-3 w-3"/>
                    </button>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td>
                <div className="flex items-center justify-center space-x-1">
                    {hasNotes && (
                        <button
                            onClick={toggleNotes}
                            className="btn btn-sm btn-outline p-1"
                            title="View notes"
                        >
                            <StickyNote className="h-3 w-3"/>
                        </button>
                    )}

                    {hasAttachments && (
                        <button
                            onClick={toggleAttachments}
                            className="btn btn-sm btn-outline p-1"
                            title={`${application.attachments!.length} attachments`}
                        >
                            <Paperclip className="h-3 w-3"/>
                            <span className="ml-1 text-xs">{application.attachments!.length}</span>
                        </button>
                    )}

                    <button
                        onClick={onEdit}
                        className="btn btn-sm btn-outline text-amber-600 hover:text-amber-700 p-1"
                        title="Edit application"
                    >
                        <Edit className="h-3 w-3"/>
                    </button>

                    <button
                        onClick={onDelete}
                        className="btn btn-sm btn-outline text-red-600 hover:text-red-700 p-1"
                        title="Delete application"
                    >
                        <Trash2 className="h-3 w-3"/>
                    </button>
                </div>

                {/* Popups */}
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
});

ApplicationRow.displayName = 'ApplicationRow';

export default PaginatedApplicationTable;