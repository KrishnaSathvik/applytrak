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
        // Parse the date string as local date to avoid timezone issues
        const [year, month, day] = dateString.split('-').map(Number);
        const date = new Date(year, month - 1, day); // month is 0-indexed

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: isMobile ? '2-digit' : 'numeric'
        });
    }, [isMobile]);

    const getStatusBadge = useCallback((status: string) => {
        const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-bold tracking-wider uppercase';
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
                        className="w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 dark:placeholder-gray-400 font-medium text-base placeholder:font-normal"
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
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-colors ${
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
                        className={`flex-1 px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-colors ${
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

                {/* Results Summary - Mobile responsive */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <div>
                        <span className="font-semibold">Showing {showingFrom} to {showingTo}</span> of <span className="font-bold">{currentApplications.length}</span> applications
                        {ui.searchQuery && (
                            <div className="text-sm font-semibold text-gradient-blue mt-1 sm:mt-0 sm:ml-2 sm:inline">
                                (filtered from {filteredApplications.length} total)
                            </div>
                        )}
                    </div>
                    <div className="text-xs font-medium opacity-75">
                        {ITEMS_PER_PAGE} per page • Page <span className="font-bold">{currentPage}</span> of <span className="font-bold">{totalPages}</span>
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
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400 text-center">
                        Page <span className="font-bold text-gradient-blue">{currentPage}</span> of <span className="font-bold">{totalPages}</span> • <span className="font-bold">{currentApplications.length}</span> total applications
                    </div>

                    {/* Pagination controls */}
                    <div className="flex items-center gap-2">
                        {/* Previous button */}
                        <button
                            onClick={goToPrevious}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 px-3 py-2 text-sm font-bold tracking-wide text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Previous</span>
                            <span className="sm:hidden">Prev</span>
                        </button>

                        {/* Page numbers - Mobile optimized */}
                        {isMobile ? (
                            <span className="px-3 py-2 text-sm font-bold text-gray-600 dark:text-gray-400">
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
                                            className={`px-3 py-2 text-sm font-bold tracking-wide rounded-md ${
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
                            className="flex items-center gap-1 px-3 py-2 text-sm font-bold tracking-wide text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                            <p className="text-lg font-bold text-gradient-static">No results found</p>
                            <p className="text-sm font-medium leading-relaxed">No applications match "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Paperclip className="h-12 w-12 mx-auto opacity-30"/>
                            <p className="text-lg font-bold text-gradient-static">No {showRejected ? 'rejected' : 'active'} applications</p>
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
                                className="font-extrabold text-lg text-gradient-static truncate"
                                dangerouslySetInnerHTML={{ __html: highlightText(application.company) }}/>
                            <p
                                className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate"
                                dangerouslySetInnerHTML={{ __html: highlightText(application.position) }}/>
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
                        <span className="text-gray-600 dark:text-gray-400 truncate font-semibold">
                            {formatDate(application.dateApplied)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
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
                                className="text-gray-600 dark:text-gray-400 truncate font-medium"
                                dangerouslySetInnerHTML={{ __html: highlightText(application.location) }}/>
                        </div>
                    )}
                    {application.salary && application.salary !== '-' && (
                        <div className="flex items-center space-x-2 col-span-2">
                            <DollarSign className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 truncate font-semibold">
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
                                    className="text-gray-600 dark:text-gray-400 font-medium"
                                    dangerouslySetInnerHTML={{ __html: `Source: ${highlightText(application.jobSource)}` }}/>
                            </div>
                        )}
                        {application.notes && (
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                                <p
                                    className="text-gray-700 dark:text-gray-300 text-xs font-medium leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: highlightText(application.notes) }}/>
                            </div>
                        )}
                        {application.attachments && application.attachments.length > 0 && (
                            <div>
                                <p className="text-gray-600 dark:text-gray-400 mb-1 font-semibold">
                                    Attachments ({application.attachments.length}):
                                </p>
                                <div className="space-y-1">
                                    {application.attachments.map((attachment, idx) => (
                                        <div key={idx} className="flex items-center justify-between text-xs">
                                            <span className="text-gray-700 dark:text-gray-300 truncate flex-1 font-medium">
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
                                <span className="text-xs text-gray-500 font-bold">{application.attachments.length}</span>
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

// Enhanced DesktopTableView with better text alignment and styling
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
    const highlightText = (text: string) => {
        if (!searchQuery) return text;
        const regex = new RegExp(`(${searchQuery})`, 'gi');
        return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>');
    };

    if (applications.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="text-center py-16 px-6">
                    <div className="space-y-4">
                        <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <Search className="h-8 w-8 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-bold text-gradient-static">
                                {searchQuery ? 'No results found' : `No ${showRejected ? 'rejected' : 'active'} applications`}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto font-medium leading-relaxed">
                                {searchQuery
                                    ? `No applications match "${searchQuery}". Try adjusting your search terms.`
                                    : showRejected
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

    const handleSelectAll = () => {
        const allSelected = selectedIds.length === applications.length;
        applications.forEach(app => {
            const isSelected = selectedIds.includes(app.id);
            if (allSelected && isSelected) {
                onToggleSelection(app.id); // Deselect
            } else if (!allSelected && !isSelected) {
                onToggleSelection(app.id); // Select
            }
        });
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                        {/* Select All Checkbox */}
                        <th className="w-12 px-4 py-4 text-center">
                            <input
                                type="checkbox"
                                checked={applications.length > 0 && selectedIds.length === applications.length}
                                onChange={handleSelectAll}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                            />
                        </th>

                        {/* Column Headers with enhanced typography */}
                        <th className="w-16 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            #
                        </th>
                        <th className="w-24 px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Date
                        </th>
                        <th className="px-4 py-4 text-left text-xs font-extrabold text-white uppercase tracking-widest text-shadow">
                            Company
                        </th>
                        <th className="min-w-[140px] px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Position
                        </th>
                        <th className="w-20 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Type
                        </th>
                        <th className="min-w-[100px] px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Location
                        </th>
                        <th className="w-24 px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Salary
                        </th>
                        <th className="w-20 px-4 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Source
                        </th>
                        <th className="w-24 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Status
                        </th>
                        <th className="w-16 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            URL
                        </th>
                        <th className="w-24 px-4 py-4 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {applications.map((app, index) => (
                        <tr
                            key={app.id}
                            className={`
                                    transition-colors duration-150
                                    ${selectedIds.includes(app.id)
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            }
                                `}
                        >
                            {/* Checkbox */}
                            <td className="w-12 px-4 py-4 text-center">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(app.id)}
                                    onChange={() => onToggleSelection(app.id)}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                                />
                            </td>

                            {/* Row Number */}
                            <td className="w-16 px-4 py-4 text-center text-sm text-gray-500 dark:text-gray-400 font-bold">
                                {startIndex + index + 1}
                            </td>

                            {/* Date */}
                            <td className="w-24 px-4 py-4 text-left">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                    {formatDate(app.dateApplied)}
                                </div>
                            </td>

                            {/* Company */}
                            <td className="min-w-[140px] px-4 py-4 text-left">
                                <div
                                    className="text-sm font-extrabold text-gradient-static truncate max-w-[140px]"
                                    dangerouslySetInnerHTML={{ __html: highlightText(app.company) }}
                                    title={app.company}
                                />
                            </td>

                            {/* Position */}
                            <td className="min-w-[140px] px-4 py-4 text-left">
                                <div
                                    className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate max-w-[140px]"
                                    dangerouslySetInnerHTML={{ __html: highlightText(app.position) }}
                                    title={app.position}
                                />
                            </td>

                            {/* Type */}
                            <td className="w-20 px-4 py-4 text-center">
                                    <span className={`
                                        inline-flex items-center px-2 py-1 rounded-full text-xs font-bold tracking-wide uppercase
                                        ${app.type === 'Remote'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-400'
                                        : app.type === 'Hybrid'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                    }
                                    `}>
                                        {app.type}
                                    </span>
                            </td>

                            {/* Location */}
                            <td className="min-w-[100px] px-4 py-4 text-left">
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[100px] font-medium" title={app.location || ''}>
                                    {app.location ? (
                                        <span dangerouslySetInnerHTML={{ __html: highlightText(app.location) }} />
                                    ) : (
                                        <span className="text-gray-400 italic font-normal">-</span>
                                    )}
                                </div>
                            </td>

                            {/* Salary */}
                            <td className="w-24 px-4 py-4 text-left">
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[80px] font-semibold" title={app.salary || ''}>
                                    {app.salary && app.salary !== '-' ? app.salary : <span className="text-gray-400 italic font-normal">-</span>}
                                </div>
                            </td>

                            {/* Source */}
                            <td className="w-20 px-4 py-4 text-left">
                                <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-[60px] font-medium" title={app.jobSource || ''}>
                                    {app.jobSource ? (
                                        <span dangerouslySetInnerHTML={{ __html: highlightText(app.jobSource) }} />
                                    ) : (
                                        <span className="text-gray-400 italic font-normal">-</span>
                                    )}
                                </div>
                            </td>

                            {/* Status */}
                            <td className="w-24 px-4 py-4 text-center">
                                    <span className={getStatusBadge(app.status)}>
                                        {app.status}
                                    </span>
                            </td>

                            {/* URL */}
                            <td className="w-16 px-4 py-4 text-center">
                                {app.jobUrl ? (
                                    <button
                                        onClick={() => window.open(app.jobUrl, '_blank')}
                                        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                                        title="Open job posting"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <span className="text-gray-400 italic font-normal">-</span>
                                )}
                            </td>

                            {/* Actions */}
                            <td className="w-24 px-4 py-4 text-center">
                                <div className="flex items-center justify-center space-x-1">
                                    {/* Notes indicator */}
                                    {app.notes && (
                                        <button
                                            onClick={() => alert(`Notes:\n\n${app.notes}`)}
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            title="View notes"
                                        >
                                            <StickyNote className="h-3.5 w-3.5" />
                                        </button>
                                    )}

                                    {/* Attachments indicator */}
                                    {app.attachments && app.attachments.length > 0 && (
                                        <button
                                            className="inline-flex items-center justify-center w-7 h-7 rounded-full text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors relative"
                                            title={`${app.attachments.length} attachment(s)`}
                                        >
                                            <Paperclip className="h-3.5 w-3.5" />
                                            <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                                    {app.attachments.length}
                                                </span>
                                        </button>
                                    )}

                                    {/* Edit button */}
                                    <button
                                        onClick={() => onEdit(app)}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                                        title="Edit application"
                                    >
                                        <Edit className="h-3.5 w-3.5" />
                                    </button>

                                    {/* Delete button */}
                                    <button
                                        onClick={() => onDelete(app.id, app.company)}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                        title="Delete application"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
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