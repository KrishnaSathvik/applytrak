// src/components/admin/FeedbackManagement.tsx - FIXED TypeScript Errors
import React, {useMemo, useState} from 'react';
import {
    Bug,
    Clock,
    Download,
    Eye,
    Globe,
    Heart,
    Lightbulb,
    Mail,
    MessageSquare,
    Monitor,
    RefreshCw,
    Search,
    Smartphone,
    Star
} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

type FeedbackFilter = 'all' | 'love' | 'bug' | 'feature' | 'general';
type SortBy = 'newest' | 'oldest' | 'rating-high' | 'rating-low';
type StatusFilter = 'all' | 'unread' | 'read' | 'flagged';

export const FeedbackManagement: React.FC = () => {
    const {adminFeedback, loadAdminFeedback, showToast} = useAppStore();

    // Filters and search
    const [typeFilter, setTypeFilter] = useState<FeedbackFilter>('all');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<SortBy>('newest');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // UI state
    const [selectedFeedback, setSelectedFeedback] = useState<string[]>([]);
    const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await loadAdminFeedback();
            showToast({
                type: 'success',
                message: 'Feedback data refreshed',
                duration: 2000
            });
        } catch (error) {
            showToast({
                type: 'error',
                message: 'Failed to refresh feedback data'
            });
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleExportFeedback = () => {
        if (!adminFeedback?.recentFeedback) return;

        const exportData = {
            exportDate: new Date().toISOString(),
            totalFeedback: adminFeedback.totalFeedback,
            averageRating: adminFeedback.averageRating,
            feedbackTrends: adminFeedback.feedbackTrends,
            feedback: filteredAndSortedFeedback.map(fb => ({
                id: fb.id,
                type: fb.type,
                rating: fb.rating,
                message: fb.message,
                email: fb.email,
                url: fb.url,
                timestamp: fb.timestamp,
                deviceType: fb.metadata?.deviceType,
                userAgent: fb.userAgent // 🔧 FIXED: Access userAgent from root level
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `applytrak-feedback-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast({
            type: 'success',
            message: 'Feedback exported successfully!',
            duration: 3000
        });
    };

    // Filter and sort feedback
    const filteredAndSortedFeedback = useMemo(() => {
        if (!adminFeedback?.recentFeedback) return [];

        let filtered = adminFeedback.recentFeedback.filter(feedback => {
            // Type filter
            if (typeFilter !== 'all' && feedback.type !== typeFilter) return false;

            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const searchableText = `${feedback.message} ${feedback.email || ''} ${feedback.type}`.toLowerCase();
                if (!searchableText.includes(query)) return false;
            }

            return true;
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                case 'oldest':
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                case 'rating-high':
                    return b.rating - a.rating;
                case 'rating-low':
                    return a.rating - b.rating;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [adminFeedback?.recentFeedback, typeFilter, statusFilter, sortBy, searchQuery]);

    const getFeedbackTypeIcon = (type: string) => {
        switch (type) {
            case 'love':
                return Heart;
            case 'bug':
                return Bug;
            case 'feature':
                return Lightbulb;
            default:
                return MessageSquare;
        }
    };

    const getFeedbackTypeColor = (type: string) => {
        switch (type) {
            case 'love':
                return 'text-red-500 bg-red-50 dark:bg-red-900/20';
            case 'bug':
                return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            case 'feature':
                return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
            default:
                return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
        }
    };

    const toggleFeedbackSelection = (id: string) => {
        setSelectedFeedback(prev =>
            prev.includes(id)
                ? prev.filter(fId => fId !== id)
                : [...prev, id]
        );
    };

    const selectAllFeedback = () => {
        setSelectedFeedback(
            selectedFeedback.length === filteredAndSortedFeedback.length
                ? []
                : filteredAndSortedFeedback.map(fb => fb.id)
        );
    };

    if (!adminFeedback) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading feedback data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <MessageSquare className="h-6 w-6 text-blue-600 dark:text-blue-400"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Feedback</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.totalFeedback}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                            <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rating</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.averageRating?.toFixed(1) || '0.0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <Heart className="h-6 w-6 text-red-600 dark:text-red-400"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Love Feedback</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.feedbackTrends.love || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                            <Bug className="h-6 w-6 text-red-600 dark:text-red-400"/>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Bug Reports</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.feedbackTrends.bugs || 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                        <input
                            type="text"
                            placeholder="Search feedback..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex items-center gap-3">
                        {/* Type Filter */}
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as FeedbackFilter)}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="all">All Types</option>
                            <option value="love">❤️ Love</option>
                            <option value="feature">💡 Feature</option>
                            <option value="bug">🐛 Bug</option>
                            <option value="general">💬 General</option>
                        </select>

                        {/* Sort By */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortBy)}
                            className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="rating-high">Highest Rating</option>
                            <option value="rating-low">Lowest Rating</option>
                        </select>

                        {/* Actions */}
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}/>
                        </button>

                        <button
                            onClick={handleExportFeedback}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            <Download className="h-5 w-5"/>
                        </button>
                    </div>
                </div>

                {/* Results Info */}
                <div
                    className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {filteredAndSortedFeedback.length} of {adminFeedback.totalFeedback} feedback items
                    </p>

                    {selectedFeedback.length > 0 && (
                        <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFeedback.length} selected
              </span>
                            <button
                                onClick={() => setSelectedFeedback([])}
                                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Feedback List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {filteredAndSortedFeedback.length === 0 ? (
                    <div className="text-center py-12">
                        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                            No feedback found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchQuery || typeFilter !== 'all'
                                ? 'Try adjusting your filters or search query'
                                : 'No feedback has been received yet'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {/* Header */}
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedFeedback.length === filteredAndSortedFeedback.length && filteredAndSortedFeedback.length > 0}
                                    onChange={selectAllFeedback}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Select All
                </span>
                            </div>
                        </div>

                        {/* Feedback Items */}
                        {filteredAndSortedFeedback.map((feedback) => {
                            const TypeIcon = getFeedbackTypeIcon(feedback.type);
                            const isExpanded = expandedFeedback === feedback.id;
                            const isSelected = selectedFeedback.includes(feedback.id);

                            return (
                                <div key={feedback.id}
                                     className={`p-6 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                                    <div className="flex items-start gap-4">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => toggleFeedbackSelection(feedback.id)}
                                            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />

                                        <div
                                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${getFeedbackTypeColor(feedback.type)}`}>
                                            <TypeIcon className="h-6 w-6"/>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {/* Header */}
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {feedback.type} Feedback
                          </span>
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                className={`h-4 w-4 ${
                                                                    i < feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                                                                }`}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="h-3 w-3"/>
                              {new Date(feedback.timestamp).toLocaleString()}
                          </span>
                                                    <button
                                                        onClick={() => setExpandedFeedback(isExpanded ? null : feedback.id)}
                                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Message */}
                                            <p className={`text-gray-700 dark:text-gray-300 leading-relaxed ${!isExpanded && feedback.message.length > 200 ? 'line-clamp-2' : ''}`}>
                                                {feedback.message}
                                            </p>

                                            {/* Metadata */}
                                            <div
                                                className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                                                {feedback.email && (
                                                    <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3"/>
                                                        {feedback.email}
                          </span>
                                                )}
                                                <span className="flex items-center gap-1">
                          <Globe className="h-3 w-3"/>
                                                    {feedback.url}
                        </span>
                                                <span className="flex items-center gap-1">
                          {feedback.metadata?.deviceType === 'mobile' ? (
                              <Smartphone className="h-3 w-3"/>
                          ) : (
                              <Monitor className="h-3 w-3"/>
                          )}
                                                    {feedback.metadata?.deviceType || 'Unknown'}
                        </span>
                                            </div>

                                            {/* Expanded Details */}
                                            {isExpanded && (
                                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                                        Technical Details
                                                    </h4>
                                                    <div
                                                        className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
                                                        <div>
                                                            <span className="font-medium">User Agent:</span>
                                                            <br/>
                                                            {/* 🔧 FIXED: Access userAgent from root level */}
                                                            <span
                                                                className="break-all">{feedback.userAgent || 'Not available'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Screen Resolution:</span>
                                                            <br/>
                                                            <span>{feedback.metadata?.screenResolution || 'Not available'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Timezone:</span>
                                                            <br/>
                                                            <span>{feedback.metadata?.timezone || 'Not available'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Language:</span>
                                                            <br/>
                                                            <span>{feedback.metadata?.language || 'Not available'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Session Duration:</span>
                                                            <br/>
                                                            <span>
                                {feedback.metadata?.sessionDuration
                                    ? `${Math.round(feedback.metadata.sessionDuration / 1000 / 60)}m`
                                    : 'Not available'
                                }
                              </span>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Applications Count:</span>
                                                            <br/>
                                                            <span>{feedback.metadata?.applicationsCount || 'Not available'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Feedback Trends */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Feedback Trends</h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div
                                className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Heart className="h-8 w-8 text-red-500"/>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.feedbackTrends.love || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Love</p>
                        </div>

                        <div className="text-center">
                            <div
                                className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Lightbulb className="h-8 w-8 text-yellow-500"/>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.feedbackTrends.features || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Features</p>
                        </div>

                        <div className="text-center">
                            <div
                                className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Bug className="h-8 w-8 text-red-600"/>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.feedbackTrends.bugs || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Bugs</p>
                        </div>

                        <div className="text-center">
                            <div
                                className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <MessageSquare className="h-8 w-8 text-blue-500"/>
                            </div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {adminFeedback.feedbackTrends.general || 0}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">General</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};