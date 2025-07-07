// src/components/tables/ApplicationTable.tsx - MOBILE-OPTIMIZED VERSION
import React, { useState, memo, useCallback, useMemo } from 'react';
import { Edit, ExternalLink, Paperclip, Search, StickyNote, Trash2, X, Calendar, MapPin, DollarSign, Building2, ChevronDown, ChevronUp } from 'lucide-react';
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
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

    // Auto-switch to cards on mobile
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const effectiveViewMode = isMobile ? 'cards' : viewMode;

    // Memoize filtered data
    const { activeApplications, rejectedApplications } = useMemo(() => ({
        activeApplications: filteredApplications.filter(app => app.status !== 'Rejected'),
        rejectedApplications: filteredApplications.filter(app => app.status === 'Rejected')
    }), [filteredApplications]);

    const currentApplications = showRejected ? rejectedApplications : activeApplications;

    // Memoize pagination calculations
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

    // Utility functions
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
    }, [debouncedSearch]);

    return (
        <div className="space-y-4">
            {/* Mobile-Optimized Search and Controls */}
            <div className="flex flex-col space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"/>
                    <input
                        type="text"
                        placeholder="Search applications..."
                        onChange={handleSearchChange}
                        className="form-input pl-10 pr-10 w-full"
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

                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    {/* Status Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setShowRejected(false)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-initial ${
                                !showRejected
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            Active ({activeApplications.length})
                        </button>
                        <button
                            onClick={() => setShowRejected(true)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex-1 sm:flex-initial ${
                                showRejected
                                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                        >
                            Rejected ({rejectedApplications.length})
                        </button>
                    </div>

                    {/* View Mode Toggle (Desktop only) */}
                    {!isMobile && (
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode('table')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'table'
                                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Table
                            </button>
                            <button
                                onClick={() => setViewMode('cards')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    viewMode === 'cards'
                                        ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                Cards
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Operations */}
            <BulkOperations
                applications={paginatedApplications}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
            />

            {/* Content based on view mode */}
            {effectiveViewMode === 'cards' ? (
                <MobileCardView
                    applications={paginatedApplications}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleRowSelection}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    searchQuery={ui.searchQuery}
                    showRejected={showRejected}
                />
            ) : (
                <DesktopTableView
                    applications={paginatedApplications}
                    selectedIds={selectedIds}
                    onToggleSelection={toggleRowSelection}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    searchQuery={ui.searchQuery}
                    showRejected={showRejected}
                    startIndex={startIndex}
                />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
                        Showing {startIndex + 1} to {Math.min(endIndex, currentApplications.length)} of{' '}
                        {currentApplications.length} applications
                    </div>
                    <div className="flex space-x-1 order-1 sm:order-2">
                        <button
                            onClick={() => setCurrentPage(ui.currentPage - 1)}
                            disabled={ui.currentPage === 1}
                            className="btn btn-secondary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {/* Mobile: Show fewer page numbers */}
                        {isMobile ? (
                            <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
                                {ui.currentPage} of {totalPages}
                            </span>
                        ) : (
                            Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                                const page = i + 1;
                                return (
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
                                );
                            })
                        )}
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

// Mobile Card View Component
interface ViewProps {
    applications: Application[];
    selectedIds: string[];
    onToggleSelection: (id: string) => void;
    onEdit: (app: Application) => void;
    onDelete: (id: string, company: string) => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    searchQuery: string;
    showRejected: boolean;
}

const MobileCardView: React.FC<ViewProps> = memo(({
                                                      applications,
                                                      selectedIds,
                                                      onToggleSelection,
                                                      onEdit,
                                                      onDelete,
                                                      formatDate,
                                                      getStatusBadge,
                                                      searchQuery,
                                                      showRejected
                                                  }) => {
    if (applications.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? (
                        <>
                            <Search className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                            <p>No applications found matching "{searchQuery}"</p>
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
        );
    }

    return (
        <div className="grid gap-4">
            {applications.map((app) => (
                <ApplicationCard
                    key={app.id}
                    application={app}
                    isSelected={selectedIds.includes(app.id)}
                    onToggleSelection={() => onToggleSelection(app.id)}
                    onEdit={() => onEdit(app)}
                    onDelete={() => onDelete(app.id, app.company)}
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    searchQuery={searchQuery}
                />
            ))}
        </div>
    );
});

// Desktop Table View Component
const DesktopTableView: React.FC<ViewProps & { startIndex: number }> = memo(({
                                                                                 applications,
                                                                                 selectedIds,
                                                                                 onToggleSelection,
                                                                                 onEdit,
                                                                                 onDelete,
                                                                                 formatDate,
                                                                                 getStatusBadge,
                                                                                 searchQuery,
                                                                                 showRejected,
                                                                                 startIndex
                                                                             }) => {
    if (applications.length === 0) {
        return (
            <div className="card overflow-hidden">
                <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">
                        {searchQuery ? (
                            <>
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                                <p>No applications found matching "{searchQuery}"</p>
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
            </div>
        );
    }

    return (
        <div className="card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="table">
                    <thead>
                    <tr>
                        <th className="w-12">
                            <input
                                type="checkbox"
                                checked={applications.length > 0 && selectedIds.length === applications.length}
                                onChange={() => {
                                    if (selectedIds.length === applications.length) {
                                        // Clear selection
                                        applications.forEach(app => onToggleSelection(app.id));
                                    } else {
                                        // Select all
                                        applications.forEach(app => {
                                            if (!selectedIds.includes(app.id)) {
                                                onToggleSelection(app.id);
                                            }
                                        });
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
                        <th className="min-w-24 hidden lg:table-cell">Location</th>
                        <th className="min-w-24 hidden xl:table-cell">Salary</th>
                        <th className="min-w-20 hidden xl:table-cell">Source</th>
                        <th className="min-w-20">Status</th>
                        <th className="min-w-16">URL</th>
                        <th className="min-w-32">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {applications.map((app, index) => (
                        <DesktopTableRow
                            key={app.id}
                            application={app}
                            index={startIndex + index + 1}
                            isSelected={selectedIds.includes(app.id)}
                            onToggleSelection={() => onToggleSelection(app.id)}
                            onEdit={() => onEdit(app)}
                            onDelete={() => onDelete(app.id, app.company)}
                            formatDate={formatDate}
                            getStatusBadge={getStatusBadge}
                            searchQuery={searchQuery}
                        />
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

// Mobile Application Card Component
interface CardProps {
    application: Application;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    searchQuery: string;
}

const ApplicationCard: React.FC<CardProps> = memo(({
                                                       application,
                                                       isSelected,
                                                       onToggleSelection,
                                                       onEdit,
                                                       onDelete,
                                                       formatDate,
                                                       getStatusBadge,
                                                       searchQuery
                                                   }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={`card border transition-all duration-200 ${
            isSelected ? 'ring-2 ring-primary-500 border-primary-500' : 'hover:shadow-md'
        }`}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelection}
                            className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                                <SearchHighlight text={application.company} searchQuery={searchQuery} />
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                <SearchHighlight text={application.position} searchQuery={searchQuery} />
                            </p>
                        </div>
                    </div>
                    <span className={getStatusBadge(application.status)}>
                        {application.status}
                    </span>
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                            {formatDate(application.dateApplied)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
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
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">
                                <SearchHighlight text={application.location} searchQuery={searchQuery} />
                            </span>
                        </div>
                    )}
                    {application.salary && application.salary !== '-' && (
                        <div className="flex items-center space-x-2 col-span-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">
                                {application.salary}
                            </span>
                        </div>
                    )}
                </div>

                {/* Expandable Details */}
                {isExpanded && (
                    <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
                        {application.jobSource && (
                            <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600 dark:text-gray-400">
                                    Source: <SearchHighlight text={application.jobSource} searchQuery={searchQuery} />
                                </span>
                            </div>
                        )}
                        {application.notes && (
                            <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                <p className="text-gray-700 dark:text-gray-300 text-xs">
                                    <SearchHighlight text={application.notes} searchQuery={searchQuery} />
                                </p>
                            </div>
                        )}
                        {application.attachments && application.attachments.length > 0 && (
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 mb-1">
                                    Attachments ({application.attachments.length}):
                                </p>
                                <div className="space-y-1">
                                    {application.attachments.map((attachment, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                                                {attachment.name}
                                            </span>
                                            <a
                                                href={attachment.data}
                                                download={attachment.name}
                                                className="ml-2 text-primary-600 hover:text-primary-700"
                                            >
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2">
                        {/* Expand/Collapse button */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="btn btn-sm btn-outline"
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                            ) : (
                                <ChevronDown className="h-3 w-3" />
                            )}
                        </button>

                        {/* Quick indicators */}
                        {application.notes && (
                            <StickyNote className="h-4 w-4 text-gray-400" />
                        )}
                        {application.attachments && application.attachments.length > 0 && (
                            <div className="flex items-center space-x-1">
                                <Paperclip className="h-4 w-4 text-gray-400" />
                                <span className="text-xs text-gray-500">{application.attachments.length}</span>
                            </div>
                        )}
                        {application.jobUrl && (
                            <button
                                onClick={() => window.open(application.jobUrl, '_blank')}
                                className="text-gray-400 hover:text-primary-600"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onEdit}
                            className="btn btn-sm btn-outline text-amber-600 hover:text-amber-700"
                        >
                            <Edit className="h-3 w-3" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="btn btn-sm btn-outline text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Desktop Table Row Component (simplified for space)
const DesktopTableRow: React.FC<{
    application: Application;
    index: number;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onDelete: () => void;
    formatDate: (date: string) => string;
    getStatusBadge: (status: string) => string;
    searchQuery: string;
}> = memo(({ application, index, isSelected, onToggleSelection, onEdit, onDelete, formatDate, getStatusBadge, searchQuery }) => {
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
            <td className="text-sm font-medium">{formatDate(application.dateApplied)}</td>
            <td className="font-medium">
                <SearchHighlight text={application.company} searchQuery={searchQuery} className="text-gray-900 dark:text-gray-100" />
            </td>
            <td>
                <SearchHighlight text={application.position} searchQuery={searchQuery} className="text-gray-900 dark:text-gray-100" />
            </td>
            <td>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    application.type === 'Remote' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                        : application.type === 'Hybrid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                }`}>
                    {application.type}
                </span>
            </td>
            <td className="hidden lg:table-cell">
                <SearchHighlight text={application.location || '-'} searchQuery={searchQuery} className="text-gray-600 dark:text-gray-400" />
            </td>
            <td className="hidden xl:table-cell text-sm text-gray-600 dark:text-gray-400">
                {application.salary || '-'}
            </td>
            <td className="hidden xl:table-cell text-sm text-gray-600 dark:text-gray-400">
                <SearchHighlight text={application.jobSource || '-'} searchQuery={searchQuery} />
            </td>
            <td>
                <span className={getStatusBadge(application.status)}>{application.status}</span>
            </td>
            <td>
                {application.jobUrl ? (
                    <button onClick={() => window.open(application.jobUrl, '_blank')} className="btn btn-sm btn-outline" title="Open job posting">
                        <ExternalLink className="h-3 w-3"/>
                    </button>
                ) : (
                    <span className="text-gray-400">-</span>
                )}
            </td>
            <td>
                <div className="flex items-center space-x-1">
                    {application.notes && (
                        <button className="btn btn-sm btn-outline" title="Has notes">
                            <StickyNote className="h-3 w-3"/>
                        </button>
                    )}
                    {application.attachments && application.attachments.length > 0 && (
                        <button className="btn btn-sm btn-outline" title={`${application.attachments.length} attachments`}>
                            <Paperclip className="h-3 w-3"/>
                            <span className="ml-1 text-xs">{application.attachments.length}</span>
                        </button>
                    )}
                    <button onClick={onEdit} className="btn btn-sm btn-outline text-amber-600 hover:text-amber-700" title="Edit application">
                        <Edit className="h-3 w-3"/>
                    </button>
                    <button onClick={onDelete} className="btn btn-sm btn-outline text-red-600 hover:text-red-700" title="Delete application">
                        <Trash2 className="h-3 w-3"/>
                    </button>
                </div>
            </td>
        </tr>
    );
});

export default ApplicationTable;