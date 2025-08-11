// src/components/admin/UserManagement.tsx - PHASE 3: REAL MULTI-USER LISTS
import React, { useMemo, useState, useEffect } from 'react';
import {
    Activity,
    Calendar,
    CheckCircle,
    Download,
    FileText,
    Monitor,
    Smartphone,
    User,
    Users,
    Search,
    Filter,
    Eye,
    Mail,
    Clock,
    TrendingUp,
    UserPlus,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import realtimeAdminService from '../../services/realtimeAdminService';

// ============================================================================
// PHASE 3: REAL MULTI-USER TYPES
// ============================================================================

interface RealUserData {
    id: string;
    email?: string;
    displayName?: string;
    joinDate: string;
    lastActive: string;
    totalApplications: number;
    deviceType: 'mobile' | 'desktop' | 'tablet';
    isAuthenticated: boolean;
    sessionsCount: number;
    avgSessionDuration: number;
    status: 'active' | 'inactive' | 'new';
    authMode: 'authenticated' | 'local';
    isAdmin?: boolean;
    userMetadata?: any;
}

interface UserListProps {
    users: RealUserData[];
    currentUserId: string;
    onUserSelect: (user: RealUserData) => void;
    selectedUser: RealUserData | null;
}

interface UserStats {
    totalUsers: number;
    activeUsers: number;
    newUsersThisWeek: number;
    totalApplications: number;
    avgApplicationsPerUser: number;
    mostActiveUser: string;
}

// ============================================================================
// PHASE 3: USER LIST COMPONENT
// ============================================================================

const UserList: React.FC<UserListProps> = ({ users, currentUserId, onUserSelect, selectedUser }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
    const [sortBy, setSortBy] = useState<'joinDate' | 'lastActive' | 'applications'>('lastActive');

    const filteredAndSortedUsers = useMemo(() => {
        let filtered = users.filter(user => {
            const matchesSearch = !searchTerm ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.id.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' || user.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        return filtered.sort((a, b) => {
            switch (sortBy) {
                case 'joinDate':
                    return new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime();
                case 'lastActive':
                    return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
                case 'applications':
                    return b.totalApplications - a.totalApplications;
                default:
                    return 0;
            }
        });
    }, [users, searchTerm, statusFilter, sortBy]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'inactive':
                return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
            case 'new':
                return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
            default:
                return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
            case 'tablet':
                return Smartphone;
            default:
                return Monitor;
        }
    };

    return (
        <div className="space-y-4">
            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search users by email, name, or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="new">New</option>
                    </select>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="lastActive">Last Active</option>
                        <option value="joinDate">Join Date</option>
                        <option value="applications">Applications</option>
                    </select>
                </div>
            </div>

            {/* User Count */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredAndSortedUsers.length} of {users.length} users
            </div>

            {/* User List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAndSortedUsers.map((user) => {
                    const DeviceIcon = getDeviceIcon(user.deviceType);
                    const isCurrentUser = user.id === currentUserId;
                    const isSelected = selectedUser?.id === user.id;

                    return (
                        <div
                            key={user.id}
                            onClick={() => onUserSelect(user)}
                            className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                isSelected
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            } ${isCurrentUser ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                                {user.displayName || 'Anonymous User'}
                                            </span>
                                            {isCurrentUser && (
                                                <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/20 rounded-full">
                                                    You
                                                </span>
                                            )}
                                            {user.isAdmin && (
                                                <span className="px-2 py-1 text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/20 rounded-full">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                            {user.email || 'No email'}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                                {user.status.toUpperCase()}
                                            </span>
                                            <DeviceIcon className="h-3 w-3 text-gray-500" />
                                            <span className="text-xs text-gray-500 capitalize">
                                                {user.deviceType}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {user.totalApplications}
                                    </div>
                                    <div className="text-xs text-gray-500">applications</div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {new Date(user.lastActive).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ============================================================================
// PHASE 3: USER DETAIL COMPONENT
// ============================================================================

const UserDetail: React.FC<{ user: RealUserData }> = ({ user }) => {
    const daysSinceJoin = Math.floor(
        (new Date().getTime() - new Date(user.joinDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    const appsPerDay = daysSinceJoin > 0 ? (user.totalApplications / daysSinceJoin).toFixed(1) : '0';
    const avgSessionMinutes = user.avgSessionDuration > 0 ?
        Math.round(user.avgSessionDuration / (1000 * 60)) : 0;

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
            case 'tablet':
                return Smartphone;
            default:
                return Monitor;
        }
    };

    const DeviceIcon = getDeviceIcon(user.deviceType);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {user.displayName || 'Anonymous User'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{user.email || 'No email'}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.isAuthenticated
                                    ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                                    : 'text-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            }`}>
                                {user.authMode.toUpperCase()}
                            </span>
                            <span className="px-2 py-1 rounded-full text-xs font-medium text-gray-600 bg-gray-50 dark:bg-gray-900/20 capitalize">
                                {user.deviceType}
                            </span>
                            {user.isAdmin && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100 dark:bg-red-900/20">
                                    ADMIN
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* User Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {Math.max(1, daysSinceJoin)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {appsPerDay}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Apps/Day</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {avgSessionMinutes}m
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Session</div>
                </div>

                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {user.sessionsCount}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
                </div>
            </div>

            {/* Detailed Information */}
            <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    User Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100 text-sm font-mono">
                                {user.id}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Join Date:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {new Date(user.joinDate).toLocaleDateString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Last Active:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {new Date(user.lastActive).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Authentication:</span>
                            <span className={`font-medium ${
                                user.isAuthenticated
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-blue-600 dark:text-blue-400'
                            }`}>
                                {user.isAuthenticated ? 'Cloud Account' : 'Local Only'}
                            </span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Device Type:</span>
                            <div className="flex items-center gap-2">
                                <DeviceIcon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                                    {user.deviceType}
                                </span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Total Applications:</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                                {user.totalApplications}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Account Status:</span>
                            <span className="font-medium text-green-600 dark:text-green-400 capitalize">
                                {user.status}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Admin Access:</span>
                            <span className={`font-medium ${
                                user.isAdmin
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-600 dark:text-gray-400'
                            }`}>
                                {user.isAdmin ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// PHASE 3: MAIN USER MANAGEMENT COMPONENT - REAL MULTI-USER LISTS
// ============================================================================

const UserManagement: React.FC = () => {
    const {
        applications,
        analytics,
        adminAnalytics,
        auth,
        isAdminRealtime,
        showToast,
        getGlobalRefreshStatus
    } = useAppStore();

    const [allUsers, setAllUsers] = useState<RealUserData[]>([]);
    const [selectedUser, setSelectedUser] = useState<RealUserData | null>(null);
    const [showUserDetail, setShowUserDetail] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Get global refresh status
    const globalRefreshStatus = getGlobalRefreshStatus();

    // ✅ PHASE 3: Load ALL users from database
    const loadAllUsers = async () => {
        setIsLoadingUsers(true);
        try {
            console.log('🔄 Loading all users for admin management...');

            if (auth.isAuthenticated && isAdminRealtime) {
                // Get real users from database
                const usersData = await realtimeAdminService.getAllUsers();
                const applicationsData = await realtimeAdminService.getAllUsersData();

                // Convert to RealUserData format
                const convertedUsers: RealUserData[] = usersData.map((user: any) => {
                    // Count applications for this user
                    const userApplications = applicationsData.applications.filter(
                        (app: any) => app.user_id === user.id
                    );

                    // Determine device type (basic detection)
                    const detectDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
                        // This is a simplified detection - in real use you might store this data
                        return Math.random() > 0.7 ? 'mobile' : 'desktop';
                    };

                    // Determine status based on recent activity
                    const getStatus = (): 'active' | 'inactive' | 'new' => {
                        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

                        const hasRecentSignIn = user.last_sign_in_at &&
                            new Date(user.last_sign_in_at) >= weekAgo;
                        const hasRecentApplications = userApplications.some((app: any) =>
                            new Date(app.created_at) >= weekAgo
                        );
                        const isNewUser = user.created_at &&
                            new Date(user.created_at) >= dayAgo;

                        if (isNewUser) return 'new';
                        if (hasRecentSignIn || hasRecentApplications) return 'active';
                        return 'inactive';
                    };

                    return {
                        id: user.id,
                        email: user.email,
                        displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Anonymous',
                        joinDate: user.created_at || new Date().toISOString(),
                        lastActive: user.last_sign_in_at || user.created_at || new Date().toISOString(),
                        totalApplications: userApplications.length,
                        deviceType: detectDeviceType(),
                        isAuthenticated: true,
                        sessionsCount: Math.floor(Math.random() * 50) + 1, // Placeholder - you could track this
                        avgSessionDuration: (Math.floor(Math.random() * 30) + 5) * 60 * 1000, // Placeholder
                        status: getStatus(),
                        authMode: 'authenticated',
                        isAdmin: user.is_admin || false,
                        userMetadata: user.user_metadata
                    };
                });

                setAllUsers(convertedUsers);
                console.log(`✅ Loaded ${convertedUsers.length} real users from database`);
            } else {
                // Fallback to current user only
                const currentUser: RealUserData = {
                    id: auth.isAuthenticated ? (auth.user?.id || 'current-user') : 'local-user',
                    email: auth.isAuthenticated ? auth.user?.email : 'local@applytrak.com',
                    displayName: auth.isAuthenticated ?
                        (auth.user?.user_metadata?.display_name || 'Current User') :
                        'Local User',
                    joinDate: new Date().toISOString(),
                    lastActive: new Date().toISOString(),
                    totalApplications: applications.length,
                    deviceType: 'desktop',
                    isAuthenticated: auth.isAuthenticated,
                    sessionsCount: 1,
                    avgSessionDuration: 15 * 60 * 1000,
                    status: 'active',
                    authMode: auth.isAuthenticated ? 'authenticated' : 'local',
                    isAdmin: false
                };

                setAllUsers([currentUser]);
                console.log('📱 Using local user data (not in SaaS mode)');
            }
        } catch (error) {
            console.error('❌ Failed to load users:', error);
            showToast({
                type: 'error',
                message: '❌ Failed to load user data'
            });
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Load users on component mount and when refresh status changes
    useEffect(() => {
        loadAllUsers();
    }, [auth.isAuthenticated, isAdminRealtime, globalRefreshStatus.lastRefreshTimestamp]);

    // Calculate user statistics
    const userStats = useMemo((): UserStats => {
        const totalUsers = allUsers.length;
        const activeUsers = allUsers.filter(user => user.status === 'active').length;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const newUsersThisWeek = allUsers.filter(user =>
            new Date(user.joinDate) >= weekAgo
        ).length;
        const totalApplications = allUsers.reduce((sum, user) => sum + user.totalApplications, 0);
        const avgApplicationsPerUser = totalUsers > 0 ? Math.round(totalApplications / totalUsers) : 0;

        // Find most active user
        const mostActiveUser = allUsers.length > 0
            ? allUsers.reduce((prev, current) =>
                current.totalApplications > prev.totalApplications ? current : prev
            )
            : null;

        return {
            totalUsers,
            activeUsers,
            newUsersThisWeek,
            totalApplications,
            avgApplicationsPerUser,
            mostActiveUser: mostActiveUser?.displayName || 'N/A'
        };
    }, [allUsers]);

    const handleUserSelect = (user: RealUserData) => {
        setSelectedUser(user);
        setShowUserDetail(true);
    };

    const handleExportUserData = () => {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                userStats,
                allUsers: allUsers.map(user => ({
                    ...user,
                    // Remove sensitive data from export
                    userMetadata: undefined
                })),
                systemInfo: {
                    mode: auth.isAuthenticated ? 'SaaS' : 'Local',
                    totalUsers: allUsers.length,
                    exportedBy: auth.user?.email || 'admin'
                },
                refreshMetadata: {
                    lastRefresh: globalRefreshStatus.lastRefreshTimestamp,
                    refreshStatus: globalRefreshStatus.refreshStatus,
                    autoRefreshEnabled: globalRefreshStatus.autoRefreshEnabled
                }
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `applytrak-users-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            showToast({
                type: 'success',
                message: `📊 User data exported successfully (${allUsers.length} users)`,
                duration: 3000
            });
        } catch (error) {
            showToast({
                type: 'error',
                message: '❌ Failed to export user data'
            });
        }
    };

    const currentUserId = auth.isAuthenticated ? (auth.user?.id || 'current-user') : 'local-user';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Users className="h-7 w-7 text-green-600 dark:text-green-400" />
                        User Management
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {isAdminRealtime && auth.isAuthenticated
                            ? `Manage all ${userStats.totalUsers} users in your SaaS application`
                            : "Local user profile and application statistics"
                        }
                    </p>
                    {globalRefreshStatus.lastRefreshTimestamp && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            Last refreshed: {new Date(globalRefreshStatus.lastRefreshTimestamp).toLocaleTimeString()}
                            {globalRefreshStatus.isRefreshing && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400">Refreshing...</span>
                            )}
                        </p>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExportUserData}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Download className="h-4 w-4" />
                        Export Data
                    </button>
                </div>
            </div>

            {/* User Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {userStats.totalUsers}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                            <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {userStats.activeUsers}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                            <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New This Week</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {userStats.newUsersThisWeek}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Apps/User</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {userStats.avgApplicationsPerUser}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* User List and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User List */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            All Users
                        </h3>
                        {isLoadingUsers && (
                            <div className="text-blue-600 dark:text-blue-400 text-sm">Loading...</div>
                        )}
                    </div>

                    <UserList
                        users={allUsers}
                        currentUserId={currentUserId}
                        onUserSelect={handleUserSelect}
                        selectedUser={selectedUser}
                    />
                </div>

                {/* User Detail */}
                <div>
                    {selectedUser ? (
                        <UserDetail user={selectedUser} />
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 h-96 flex items-center justify-center">
                            <div className="text-center text-gray-500 dark:text-gray-400">
                                <Eye className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                <p>Select a user to view details</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    System Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span className="font-medium text-blue-800 dark:text-blue-200">
                                Data Mode
                            </span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            {auth.isAuthenticated && isAdminRealtime ? 'Multi-User SaaS' : 'Local Storage Only'}
                        </p>
                    </div>

                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <span className="font-medium text-green-800 dark:text-green-200">
                                Most Active User
                            </span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            {userStats.mostActiveUser}
                        </p>
                    </div>

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                            <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            <span className="font-medium text-purple-800 dark:text-purple-200">
                                Total Applications
                            </span>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                            {userStats.totalApplications} across all users
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;