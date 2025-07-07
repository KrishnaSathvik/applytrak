// src/components/tables/MobileResponsiveApplicationTable.tsx
import React, { useState, memo, useCallback, useMemo } from 'react';
import { Edit, ExternalLink, Paperclip, Search, StickyNote, Trash2, X, ChevronLeft, ChevronRight, Filter, Calendar, MapPin, DollarSign, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Application } from '../../types';

const ITEMS_PER_PAGE = 15;

const MobileResponsiveApplicationTable: React.FC = () => {
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Listen for window resize
    React.useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            year: isMobile ? '2-digit' : 'numeric'
        });
    }, [isMobile]);

    const getStatusBadge = useCallback((status: string) => {
        const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
        switch (status) {
            case 'Applied': return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100`;
            case 'Interview': return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100`;
            case 'Offer': return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100`;
            case 'Rejected': return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100`;
            default: return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100`;
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

    return (
        <div className="space-y-4">
            {/* MOBILE-FIRST Search and Controls */}
            <div className="space-y-4">
                {/* Search - Full width on mobile */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10"/>
                    <input
                        type="text"
                        placeholder="Search applications..."
                        onChange={handleSearchChange}
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {ui.searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    )}
                </div>

                {/* Tab Toggle - Mobile responsive */}
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => handleTabSwitch(false)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            !showRejected
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="hidden sm:inline">Active</span>
                        <span className="sm:hidden">Active</span>
                        <span className="ml-1">({activeApplications.length})</span>
                    </button>
                    <button
                        onClick={() => handleTabSwitch(true)}
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            showRejected
                                ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                        }`}
                    >
                        <span className="hidden sm:inline">Rejected</span>
                        <span className="sm:hidden">Rejected</span>
                        <span className="ml-1">({rejectedApplications.length})</span>
                    </button>
                </div>

                {/* Results Summary - Mobile responsive */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div>
                        Showing {showingFrom} to {showingTo} of {currentApplications.length} applications
                        {ui.searchQuery && (
                            <div className="text-blue-600 dark:text-blue-400 mt-1 sm:mt-0 sm:ml-2 sm:inline">
                                (filtered from {filteredApplications.length} total)
                            </div>
                        )}
                    </div>
                    <div className="text-xs opacity-75">
                        {ITEMS_PER_PAGE} per page • Page {currentPage} of {totalPages}
                    </div>
                </div>
            </div>

            {/* Content - Mobile Cards or Desktop Table */}
            {isMobile ? (
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

            {/* MOBILE-RESPONSIVE Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {/* Results info */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        Page {currentPage} of {totalPages} • {currentApplications.length} total applications
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-2">
                        {/* Previous button */}
                        <button
                            onClick={goToPrevious}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                        </button>

                        {/* Page numbers - Mobile optimized */}
                        {isMobile ? (
                            <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                                {currentPage} of {totalPages}
                            </span>
                        ) : (
                            <div className="flex gap-1">
                                {Array.from({length: Math.min(totalPages, 5)}, (_, i) => {
                                    const page = i + 1;
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md ${
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

                        {/* Next button */}
                        <button
                            onClick={goToNext}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <span className="sm:hidden">Next</span>
                            <ChevronRight className="h-4 w-4" />
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
            <div className="text-center py-12 px-4">
                <div className="text-gray-500 dark:text-gray-400">
                    {searchQuery ? (
                        <div className="space-y-2">
                            <Search className="h-12 w-12 mx-auto opacity-30"/>
                            <p className="text-lg font-medium">No results found</p>
                            <p className="text-sm">No applications match "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Paperclip className="h-12 w-12 mx-auto opacity-30"/>
                            <p className="text-lg font-medium">No {showRejected ? 'rejected' : 'active'} applications</p>
                            {!showRejected && (
                                <p className="text-sm">Add your first application above!</p>
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
                    formatDate={formatDate}
                    getStatusBadge={getStatusBadge}
                    searchQuery={searchQuery}
                />
            ))}
        </div>
    );
});

// Individual Mobile Application Card
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

    const highlightText = (text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all duration-200 ${
            isSelected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}>
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelection}
                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                            <h3
                                className="font-semibold text-gray-900 dark:text-gray-100 truncate"
                                dangerouslySetInnerHTML={{ __html: highlightText(application.company) }}
                            />
                            <p
                                className="text-sm text-gray-600 dark:text-gray-400 truncate"
                                dangerouslySetInnerHTML={{ __html: highlightText(application.position) }}
                            />
                        </div>
                    </div>
                    <span className={getStatusBadge(application.status)}>
                        {application.status}
                    </span>
                </div>

                {/* Key Info */}
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600 dark:text-gray-400 truncate">
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
                            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span
                                className="text-gray-600 dark:text-gray-400 truncate"
                                dangerouslySetInnerHTML={{ __html: highlightText(application.location) }}
                            />
                        </div>
                    )}
                    {application.salary && application.salary !== '-' && (
                        <div className="flex items-center space-x-2 col-span-2">
                            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 truncate">
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
                                <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                <span
                                    className="text-gray-600 dark:text-gray-400"
                                    dangerouslySetInnerHTML={{ __html: `Source: ${highlightText(application.jobSource)}` }}
                                />
                            </div>
                        )}
                        {application.notes && (
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                <p
                                    className="text-gray-700 dark:text-gray-300 text-xs"
                                    dangerouslySetInnerHTML={{ __html: highlightText(application.notes) }}
                                />
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
                                                className="ml-2 text-blue-600 hover:text-blue-700"
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
                            className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                            ) : (
                                <ChevronDown className="h-4 w-4" />
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
                                className="text-gray-400 hover:text-blue-600"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center space-x-2">
                        <button
                            onClick={onEdit}
                            className="p-2 rounded-md text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={onDelete}
                            className="p-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
});

// Desktop Table View (simplified for space)
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
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="text-center py-12">
                    <div className="text-gray-500 dark:text-gray-400">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                        <p>No applications found</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            <input
                                type="checkbox"
                                checked={applications.length > 0 && selectedIds.length === applications.length}
                                onChange={() => {
                                    if (selectedIds.length === applications.length) {
                                        applications.forEach(app => onToggleSelection(app.id));
                                    } else {
                                        applications.forEach(app => {
                                            if (!selectedIds.includes(app.id)) {
                                                onToggleSelection(app.id);
                                            }
                                        });
                                    }
                                }}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">#</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {applications.map((app, index) => (
                        <tr key={app.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                            selectedIds.includes(app.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(app.id)}
                                    onChange={() => onToggleSelection(app.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                {startIndex + index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                {formatDate(app.dateApplied)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                    {app.company}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-gray-100 truncate max-w-xs">
                                    {app.position}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        app.type === 'Remote' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                                            : app.type === 'Hybrid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                                    }`}>
                                        {app.type}
                                    </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <span className={getStatusBadge(app.status)}>{app.status}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center space-x-2">
                                    <button
                                        onClick={() => onEdit(app)}
                                        className="text-yellow-600 hover:text-yellow-900 dark:hover:text-yellow-400"
                                    >
                                        <Edit className="h-4 w-4"/>
                                    </button>
                                    <button
                                        onClick={() => onDelete(app.id, app.company)}
                                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4"/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default MobileResponsiveApplicationTable;