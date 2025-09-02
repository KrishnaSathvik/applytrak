import React from 'react';
import { 
    CheckCircle, 
    Star, 
    Zap, 
    Database, 
    BarChart3, 
    Target, 
    Upload, 
    Users
} from 'lucide-react';

const MobileFeaturesTab: React.FC = () => {

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30">
                <div className="text-center py-8">
                    <Star className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Features
                    </h1>
                    <p className="text-gray-600 text-lg mb-4">
                        Discover powerful features for your job search
                    </p>
                </div>
            </div>

            {/* Features Content */}
            <div className="space-y-6">
                {/* Hero Section */}
                <div className="glass-card">
                    <div className="text-center py-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">
                            Powerful Features for Your Job Search
                        </h2>
                        <p className="text-sm text-gray-600 max-w-2xl mx-auto mb-6">
                            Everything you need to track applications, set goals, and land your dream job.
                        </p>
                        
                        {/* Why Choose ApplyTrak Text */}
                        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-6 max-w-4xl mx-auto text-left">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                                Why ApplyTrak Beats Excel & Other Job Apps
                            </h3>
                            <div className="space-y-4 text-sm leading-relaxed">
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong>Stop struggling with Excel spreadsheets</strong> that weren't designed for job tracking. 
                                    While other apps force you into rigid templates or overwhelm you with unnecessary features, 
                                    ApplyTrak gives you exactly what you need: a clean, intuitive interface that makes job 
                                    tracking effortless.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong>Unlike generic productivity tools</strong>, ApplyTrak is built specifically for job seekers. 
                                    You get pre-configured fields for company names, positions, application dates, and status tracking. 
                                    No more creating custom formulas, setting up conditional formatting, or worrying about data 
                                    corruption. Everything is designed to help you focus on what matters most - landing your dream job.
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                    <strong>While other job tracking apps</strong> bury features behind paywalls or bombard you with 
                                    notifications, ApplyTrak keeps it simple. Track applications, set meaningful goals, and get 
                                    insights that actually help you improve your job search strategy. It's the difference between 
                                    using a tool that works for you versus fighting against one that works against you.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Text Section */}
                <div className="glass-card">
                    <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">
                        Core Features That Make Job Tracking Effortless
                    </h3>
                    <div className="space-y-6 text-sm leading-relaxed">
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <Database className="h-5 w-5 text-blue-600" />
                                Application Tracking
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Organize all your job applications with comprehensive status tracking, detailed notes, and file attachments. 
                                Track everything from initial application to final outcome with a clean, organized interface.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Unlimited applications
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Status tracking
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <Target className="h-5 w-5 text-purple-600" />
                                Goal Setting & Progress Tracking
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Set meaningful weekly, monthly, and total application goals with visual progress indicators. 
                                Track your momentum with streak counters and celebrate achievements that keep you motivated.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Visual progress bars
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Streak tracking
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-green-600" />
                                Analytics & Insights
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Get powerful insights into your job search performance with automatic success rate calculations, 
                                application trends, and data visualization that helps you optimize your strategy.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Success rate tracking
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Trend analysis
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <Upload className="h-5 w-5 text-orange-600" />
                                Import & Export System
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Seamlessly import your existing job data from JSON or CSV files, and export your information 
                                in multiple formats including PDF reports for sharing with career coaches or mentors.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    JSON & CSV support
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    PDF reports
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <Zap className="h-5 w-5 text-indigo-600" />
                                Advanced Search & Filtering
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Find applications instantly with real-time search across all fields, and use powerful filtering 
                                options to organize your data. Perform bulk operations to manage multiple applications efficiently.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Real-time search
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Bulk operations
                                </span>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                                <Users className="h-5 w-5 text-pink-600" />
                                Mobile-First Design
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                                Access your job applications from any device with our responsive design. Whether you're on your 
                                phone, tablet, or desktop, ApplyTrak provides the same powerful experience with offline support.
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Works on all devices
                                </span>
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3 text-green-500" />
                                    Offline support
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileFeaturesTab;