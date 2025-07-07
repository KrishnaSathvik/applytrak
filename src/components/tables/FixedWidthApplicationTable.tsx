// src/components/tables/FixedWidthApplicationTable.tsx
import React, { useState, memo, useCallback, useMemo } from 'react';
import { Edit, ExternalLink, Paperclip, Search, StickyNote, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Application } from '../../types';
import SearchHighlight from '../ui/SearchHighlight';
import BulkOperations from './BulkOperations';

const ITEMS_PER_PAGE = 15;

const FixedWidthApplicationTable: React.FC = () => {
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
            year: '2-digit'
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

    // Truncate text function
    const truncateText = useCallback((text: string, maxLength: number) => {
        if (!text) return '-';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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
        <div className="space-y-6">
            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
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
            <div className="flex items-center justify-center text-sm text-gray-600 dark:text-gray-400">
                <div className="text-center">
                    Showing {showingFrom} to {showingTo} of {currentApplications.length} applications
                    {ui.searchQuery && (
                        <span className="ml-2 text-primary-600 dark:text-primary-400">
                            (filtered from {filteredApplications.length} total)
                        </span>
                    )}
                </div>
            </div>

            {/* Bulk Operations */}
            <BulkOperations
                applications={paginatedApplications}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
            />

            {/* FIXED WIDTH TABLE - No Horizontal Scroll */}
            <div className="table-container">
                <div className="w-full">
                    <table className="table w-full table-fixed">
                        <thead>
                        <tr>
                            <th className="w-12">#</th>
                            <th className="w-20">Date</th>
                            <th className="w-32">Company</th>
                            <th className="w-40">Position</th>
                            <th className="w-20">Type</th>
                            <th className="w-32">Location</th>
                            <th className="w-28">Salary</th>
                            <th className="w-24">Source</th>
                            <th className="w-24">Status</th>
                            <th className="w-16">URL</th>
                            <th className="w-32">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedApplications.length === 0 ? (
                            <tr>
                                <td colSpan={11} className="px-6 py-12 text-center">
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
                                <FixedApplicationRow
                                    key={app.id}
                                    application={app}
                                    index={startIndex + index + 1}
                                    isSelected={selectedIds.includes(app.id)}
                                    onToggleSelection={() => toggleRowSelection(app.id)}
                                    onEdit={() => openEditModal(app)}
                                    onDelete={() => handleDelete(app.id, app.company)}
                                    formatDate={formatDate}
                                    getStatusBadge={getStatusBadge}
                                    truncateText={truncateText}
                                    searchQuery={ui.searchQuery}
                                />
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CENTERED Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col items-center justify-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    {/* Results info - Centered */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Page {currentPage} of {totalPages} • {currentApplications.length} total applications
                    </div>

                    {/* Pagination controls - Centered */}
                    <div className="flex items-center justify-center gap-2">
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
                                        className="btn btn-secondary btn-sm"
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
                                        className="btn btn-secondary btn-sm"
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

// Fixed Width Application Row Component
interface FixedApplicationRowProps {
    application: Application;
    index: number;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    truncateText: (text: string, maxLength: number) => string;
    searchQuery: string;
}

const FixedApplicationRow: React.FC<FixedApplicationRowProps> = memo(({
                                                                          application,
                                                                          index,
                                                                          isSelected,
                                                                          onToggleSelection,
                                                                          onEdit,
                                                                          onDelete,
                                                                          formatDate,
                                                                          getStatusBadge,
                                                                          truncateText,
                                                                          searchQuery
                                                                      }) => {
    const [showTooltip, setShowTooltip] = useState<string | null>(null);

    const hasNotes = useMemo(() => Boolean(application.notes), [application.notes]);
    const hasAttachments = useMemo(() =>
        Boolean(application.attachments?.length), [application.attachments]
    );

    return (
        <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
            isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''
        }`}>
            <td className="text-sm text-gray-500 dark:text-gray-400 text-center">{index}</td>
            <td className="text-sm font-medium">
                {formatDate(application.dateApplied)}
            </td>
            <td className="font-medium">
                <div
                    className="truncate cursor-pointer"
                    title={application.company}
                >
                    <SearchHighlight
                        text={truncateText(application.company, 20)}
                        searchQuery={searchQuery}
                        className="text-gray-900 dark:text-gray-100"
                    />
                </div>
            </td>
            <td>
                <div
                    className="truncate cursor-pointer"
                    title={application.position}
                >
                    <SearchHighlight
                        text={truncateText(application.position, 25)}
                        searchQuery={searchQuery}
                        className="text-gray-900 dark:text-gray-100"
                    />
                </div>
            </td>
            <td>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    application.type === 'Remote'
                        ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : application.type === 'Hybrid'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
                    {application.type}
                </span>
            </td>
            <td>
                <div
                    className="text-sm text-gray-600 dark:text-gray-400 truncate cursor-pointer"
                    title={application.location || '-'}
                >
                    <SearchHighlight
                        text={truncateText(application.location || '-', 20)}
                        searchQuery={searchQuery}
                    />
                </div>
            </td>
            <td className="text-sm text-gray-600 dark:text-gray-400">
                <div
                    className="truncate cursor-pointer"
                    title={application.salary || '-'}
                >
                    {truncateText(application.salary || '-', 15)}
                </div>
            </td>
            <td className="text-sm text-gray-600 dark:text-gray-400">
                <div
                    className="truncate cursor-pointer"
                    title={application.jobSource || '-'}
                >
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
                    {/* Checkbox */}
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelection}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />

                    {hasNotes && (
                        <button
                            className="btn btn-sm btn-outline p-1"
                            title="View notes"
                            onClick={() => alert(`Notes: ${application.notes}`)}
                        >
                            <StickyNote className="h-3 w-3"/>
                        </button>
                    )}

                    {hasAttachments && (
                        <button
                            className="btn btn-sm btn-outline p-1"
                            title={`${application.attachments!.length} attachments`}
                            onClick={() => alert(`${application.attachments!.length} attachments available`)}
                        >
                            <Paperclip className="h-3 w-3"/>
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
            </td>
        </tr>
    );
});

FixedApplicationRow.displayName = 'FixedApplicationRow';

export default FixedWidthApplicationTable;