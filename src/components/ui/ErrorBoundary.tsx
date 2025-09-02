import React, {Component, ReactNode} from 'react';
import {AlertTriangle, Bug, Clipboard, Download, Home, RefreshCw} from 'lucide-react';

// Constants for better maintainability
const ERROR_SEVERITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
} as const;

const RETRY_CONSTRAINTS = {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000,
} as const;

const FEEDBACK_DURATION = {
    COPY_SUCCESS: 2000,
    REPORT_TIMEOUT: 10000,
} as const;

const STORAGE_KEYS = {
    ERROR_PREFIX: 'error_',
    LAST_ERROR: 'lastError',
} as const;

// Type definitions for better type safety
type ErrorSeverity = typeof ERROR_SEVERITY_LEVELS[keyof typeof ERROR_SEVERITY_LEVELS];

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    errorId: string;
    isReporting: boolean;
    reportSent: boolean;
    isCopying: boolean;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    enableReporting?: boolean;
    maxRetries?: number;
    reportingService?: (errorData: ErrorReport) => Promise<void>;
    debugMode?: boolean;
}

interface ErrorReport {
    errorId: string;
    timestamp: string;
    message: string;
    stack: string;
    componentStack: string;
    userAgent: string;
    url: string;
    retryCount: number;
    appVersion: string;
    severity: ErrorSeverity;
    context?: Record<string, any>;
}

interface ErrorClassification {
    severity: ErrorSeverity;
    category: string;
    suggestions: string[];
    recoverable: boolean;
}

// Error classification patterns
const ERROR_PATTERNS: Record<string, Partial<ErrorClassification>> = {
    chunk: {
        severity: ERROR_SEVERITY_LEVELS.LOW,
        category: 'Network/Caching',
        suggestions: [
            'Try refreshing the page',
            'Clear your browser cache and cookies',
            'Check your internet connection',
            'Disable browser extensions temporarily'
        ],
        recoverable: true
    },
    network: {
        severity: ERROR_SEVERITY_LEVELS.MEDIUM,
        category: 'Network',
        suggestions: [
            'Check your internet connection',
            'Try again in a few moments',
            'Contact your network administrator if on corporate network'
        ],
        recoverable: true
    },
    typescript: {
        severity: ERROR_SEVERITY_LEVELS.HIGH,
        category: 'Code Error',
        suggestions: [
            'This appears to be a code-related issue',
            'Try refreshing the page',
            'Contact support with the error details'
        ],
        recoverable: false
    },
    permission: {
        severity: ERROR_SEVERITY_LEVELS.MEDIUM,
        category: 'Permission',
        suggestions: [
            'Check browser permissions for this site',
            'Try using an incognito/private browsing window',
            'Clear site data and refresh'
        ],
        recoverable: true
    }
};

// Utility functions for styling
const getSeverityStyles = (severity: ErrorSeverity) => {
    const styles = {
        [ERROR_SEVERITY_LEVELS.CRITICAL]: {
            background: 'bg-red-100 dark:bg-red-900',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-200 dark:border-red-800'
        },
        [ERROR_SEVERITY_LEVELS.HIGH]: {
            background: 'bg-orange-100 dark:bg-orange-900',
            text: 'text-orange-600 dark:text-orange-400',
            border: 'border-orange-200 dark:border-orange-800'
        },
        [ERROR_SEVERITY_LEVELS.MEDIUM]: {
            background: 'bg-yellow-100 dark:bg-yellow-900',
            text: 'text-yellow-600 dark:text-yellow-400',
            border: 'border-yellow-200 dark:border-yellow-800'
        },
        [ERROR_SEVERITY_LEVELS.LOW]: {
            background: 'bg-blue-100 dark:bg-blue-900',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-200 dark:border-blue-800'
        }
    };
    return styles[severity] || styles[ERROR_SEVERITY_LEVELS.CRITICAL];
};

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private retryCount = 0;
    private maxRetries: number;
    private retryTimeouts: NodeJS.Timeout[] = [];
    private abortController: AbortController | null = null;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.maxRetries = props.maxRetries || RETRY_CONSTRAINTS.MAX_RETRIES;
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
            isReporting: false,
            reportSent: false,
            isCopying: false
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        const errorId = `err_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        return {
            hasError: true,
            error,
            errorId,
            isReporting: false,
            reportSent: false,
            isCopying: false
        };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({errorInfo});

        // Call custom error handler
        if (this.props.onError) {
            try {
                this.props.onError(error, errorInfo);
            } catch (handlerError) {
                console.error('Error in custom error handler:', handlerError);
            }
        }

        // Enhanced logging
        this.logError(error, errorInfo);

        // Store error details for recovery and reporting
        this.storeErrorDetails(error, errorInfo);

        // Auto-report if enabled and not in development
        if (this.props.enableReporting && !this.props.debugMode) {
            this.scheduleAutoReport();
        }
    }

    override componentWillUnmount() {
        // Cleanup timeouts and abort ongoing operations
        this.retryTimeouts.forEach(clearTimeout);
        if (this.abortController) {
            this.abortController.abort();
        }
    }

    override render() {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const classification = this.classifyError(this.state.error);
            const canRetry = this.retryCount < this.maxRetries && classification.recoverable;
            const severityStyles = getSeverityStyles(classification.severity);

            return (
                <div
                    className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <div className={`glass-card ${severityStyles.border}`}>
                            {/* Header */}
                            <header className={`border-b ${severityStyles.border} p-6`}>
                                <div className="flex items-center space-x-3">
                                    <div className={`p-3 rounded-full ${severityStyles.background}`}>
                                        <AlertTriangle className={`h-6 w-6 ${severityStyles.text}`}/>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-extrabold text-gradient-static tracking-tight">
                                            Oops! Something went wrong
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium tracking-wide">
                                            Error ID: <span
                                            className="font-bold text-gradient-purple">{this.state.errorId}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Severity: <span className={`font-bold ${severityStyles.text}`}>
                        {classification.severity.toUpperCase()}
                      </span> • Category: {classification.category}
                                        </p>
                                    </div>
                                </div>
                            </header>

                            {/* Content */}
                            <main className="p-6 space-y-6">
                                {/* Error Message */}
                                <section className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <h2 className="font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-wide">
                                        Error Details
                                    </h2>
                                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 font-mono break-words tracking-tight leading-relaxed">
                                        {this.state.error.message}
                                    </p>
                                    {this.props.debugMode && this.state.error.stack && (
                                        <details className="mt-3">
                                            <summary
                                                className="cursor-pointer text-xs font-bold text-gray-600 dark:text-gray-400">
                                                Stack Trace (Debug Mode)
                                            </summary>
                                            <pre
                                                className="mt-2 text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                                        </details>
                                    )}
                                </section>

                                {/* Suggestions */}
                                {classification.suggestions.length > 0 && (
                                    <section className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <h2 className="font-bold text-blue-900 dark:text-blue-100 mb-2 tracking-wide">
                                            Suggested Solutions
                                        </h2>
                                        <ul className="text-sm font-medium text-blue-800 dark:text-blue-200 space-y-1">
                                            {classification.suggestions.map((suggestion, index) => (
                                                <li key={index}
                                                    className="flex items-start tracking-normal leading-relaxed">
                                                    <span className="mr-2 font-bold">•</span>
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </section>
                                )}

                                {/* Recovery Actions */}
                                <section className="space-y-4">
                                    <h2 className="font-bold text-gray-900 dark:text-gray-100 tracking-wide">
                                        Recovery Options
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {canRetry && (
                                            <button
                                                onClick={this.handleRetry}
                                                className="btn btn-primary btn-md font-bold tracking-wide"
                                                aria-label={`Retry (${this.maxRetries - this.retryCount} attempts remaining)`}
                                            >
                                                <RefreshCw className="h-4 w-4 mr-2"/>
                                                Try Again
                                            </button>
                                        )}

                                        <button
                                            onClick={this.handleReload}
                                            className="btn btn-secondary btn-md font-bold tracking-wide"
                                            aria-label="Reload the entire page"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2"/>
                                            Reload Page
                                        </button>

                                        <button
                                            onClick={this.handleGoHome}
                                            className="btn btn-secondary btn-md font-bold tracking-wide"
                                            aria-label="Navigate to home page"
                                        >
                                            <Home className="h-4 w-4 mr-2"/>
                                            Go Home
                                        </button>

                                        <button
                                            onClick={this.downloadErrorReport}
                                            className="btn btn-secondary btn-md font-bold tracking-wide"
                                            aria-label="Download detailed error report"
                                        >
                                            <Download className="h-4 w-4 mr-2"/>
                                            Download Report
                                        </button>
                                    </div>
                                </section>

                                {/* Advanced Options */}
                                <details className="bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <summary
                                        className="p-4 cursor-pointer font-bold text-gray-900 dark:text-gray-100 tracking-wide hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                                        <Bug className="h-4 w-4 inline mr-2"/>
                                        Advanced Options
                                    </summary>
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={this.copyErrorDetails}
                                                disabled={this.state.isCopying}
                                                className="btn btn-sm btn-secondary font-bold tracking-wide disabled:opacity-50"
                                                aria-label="Copy error details to clipboard"
                                            >
                                                <Clipboard className="h-3 w-3 mr-1"/>
                                                {this.state.isCopying ? 'Copying...' : 'Copy Error Details'}
                                            </button>

                                            {this.props.enableReporting && (
                                                <button
                                                    onClick={this.reportError}
                                                    disabled={this.state.isReporting || this.state.reportSent}
                                                    className="btn btn-sm btn-secondary disabled:opacity-50 font-bold tracking-wide"
                                                    aria-label="Send error report to developers"
                                                >
                                                    {this.state.isReporting ? (
                                                        <>
                                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin"/>
                                                            Reporting...
                                                        </>
                                                    ) : this.state.reportSent ? (
                                                        <span className="text-gradient-blue">✓ Reported</span>
                                                    ) : (
                                                        <>
                                                            <Bug className="h-3 w-3 mr-1"/>
                                                            Report Error
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Retry Information */}
                                        {this.retryCount > 0 && (
                                            <div
                                                className="text-xs font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                                                Retry attempts: <span
                                                className="font-bold text-gradient-purple">{this.retryCount}</span>/<span
                                                className="font-bold text-gradient-blue">{this.maxRetries}</span>
                                                {!classification.recoverable && (
                                                    <span className="ml-2 text-orange-600 dark:text-orange-400">
                            (Auto-retry disabled for this error type)
                          </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Additional Context */}
                                        {this.props.debugMode && (
                                            <div
                                                className="text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3">
                                                <p><strong>User Agent:</strong> {navigator.userAgent}</p>
                                                <p><strong>URL:</strong> {window.location.href}</p>
                                                <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                                            </div>
                                        )}
                                    </div>
                                </details>
                            </main>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }

    // Enhanced error classification
    private classifyError = (error: Error): ErrorClassification => {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';

        // Check error patterns
        for (const [pattern, classification] of Object.entries(ERROR_PATTERNS)) {
            if (message.includes(pattern) || stack.includes(pattern)) {
                return {
                    severity: ERROR_SEVERITY_LEVELS.MEDIUM,
                    category: 'Unknown',
                    suggestions: ['Try refreshing the page', 'Contact support if the problem persists'],
                    recoverable: true,
                    ...classification
                } as ErrorClassification;
            }
        }

        // Check for specific error types
        if (message.includes('chunkloaderror') || message.includes('loading chunk')) {
            return ERROR_PATTERNS.chunk as ErrorClassification;
        }

        if (message.includes('network') || message.includes('fetch') || message.includes('cors')) {
            return ERROR_PATTERNS.network as ErrorClassification;
        }

        if (message.includes('typeerror') || message.includes('referenceerror') || message.includes('syntaxerror')) {
            return ERROR_PATTERNS.typescript as ErrorClassification;
        }

        if (message.includes('permission') || message.includes('denied') || message.includes('blocked')) {
            return ERROR_PATTERNS.permission as ErrorClassification;
        }

        // Default classification for unknown errors
        return {
            severity: ERROR_SEVERITY_LEVELS.CRITICAL,
            category: 'Unknown',
            suggestions: [
                'Try refreshing the page',
                'Clear your browser cache',
                'Contact support with the error details'
            ],
            recoverable: true
        };
    };

    // Enhanced error logging
    private logError = (error: Error, errorInfo: React.ErrorInfo) => {
        const logLevel = this.props.debugMode ? 'group' : 'error';

        if (logLevel === 'group') {
            console.group('🚨 Error Boundary Caught Error');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Component Stack:', errorInfo.componentStack);
            console.error('Props:', this.props);
            console.error('State:', this.state);
            console.groupEnd();
        } else {
            console.error('Error Boundary:', error.message, error);
        }
    };

    // Enhanced error storage with cleanup
    private storeErrorDetails = (error: Error, errorInfo: React.ErrorInfo) => {
        try {
            const errorDetails: ErrorReport = {
                timestamp: new Date().toISOString(),
                errorId: this.state.errorId,
                message: error.message,
                stack: error.stack || '',
                componentStack: errorInfo.componentStack || '',
                userAgent: navigator.userAgent,
                url: window.location.href,
                retryCount: this.retryCount,
                appVersion: process.env.REACT_APP_VERSION || '1.0.0',
                severity: this.classifyError(error).severity
            };

            const storageKey = `${STORAGE_KEYS.ERROR_PREFIX}${this.state.errorId}`;
            localStorage.setItem(storageKey, JSON.stringify(errorDetails));
            localStorage.setItem(STORAGE_KEYS.LAST_ERROR, this.state.errorId);

            // Cleanup old error records (keep only last 10)
            this.cleanupOldErrors();
        } catch (storageError) {
            console.error('Failed to store error details:', storageError);
        }
    };

    // Cleanup old error records
    private cleanupOldErrors = () => {
        try {
            const errorKeys = Object.keys(localStorage)
                .filter(key => key.startsWith(STORAGE_KEYS.ERROR_PREFIX))
                .sort()
                .reverse();

            // Keep only the 10 most recent errors
            errorKeys.slice(10).forEach(key => {
                localStorage.removeItem(key);
            });
        } catch (error) {
            console.error('Failed to cleanup old errors:', error);
        }
    };

    // Enhanced retry with exponential backoff
    private handleRetry = () => {
        this.retryCount++;

        const delay = RETRY_CONSTRAINTS.RETRY_DELAY * Math.pow(2, this.retryCount - 1);

        const timeout = setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                errorId: '',
                isReporting: false,
                reportSent: false,
                isCopying: false
            });
        }, delay);

        this.retryTimeouts.push(timeout);
    };

    private handleReload = () => {
        try {
            // Store reload intent for recovery
            sessionStorage.setItem('errorBoundaryReload', 'true');
            localStorage.removeItem(STORAGE_KEYS.LAST_ERROR);
            window.location.reload();
        } catch (error) {
            console.error('Failed to reload:', error);
            // Force reload as fallback
            window.location.href = window.location.href;
        }
    };

    private handleGoHome = () => {
        try {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                errorId: '',
                isReporting: false,
                reportSent: false,
                isCopying: false
            });

            // Navigate to home with proper cleanup
            window.history.replaceState({}, '', '/');

            // If using React Router, you might want to integrate with it here
            // Example: if (window.ReactRouter) window.ReactRouter.push('/');
        } catch (error) {
            console.error('Failed to navigate home:', error);
            this.handleReload();
        }
    };

    // Enhanced clipboard operation
    private copyErrorDetails = async () => {
        if (this.state.isCopying) return;

        this.setState({isCopying: true});

        try {
            const errorDetails: ErrorReport = {
                errorId: this.state.errorId,
                timestamp: new Date().toISOString(),
                message: this.state.error?.message || 'Unknown error',
                stack: this.state.error?.stack || '',
                componentStack: this.state.errorInfo?.componentStack || '',
                userAgent: navigator.userAgent,
                url: window.location.href,
                retryCount: this.retryCount,
                appVersion: process.env.REACT_APP_VERSION || '1.0.0',
                severity: this.classifyError(this.state.error!).severity
            };

            await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));

            // Brief success indication
            setTimeout(() => {
                this.setState({isCopying: false});
            }, FEEDBACK_DURATION.COPY_SUCCESS);

        } catch (err) {
            console.error('Failed to copy error details:', err);
            this.setState({isCopying: false});

            // Fallback: try to create a downloadable file
            this.downloadErrorReport();
        }
    };

    // Enhanced download with better error handling
    private downloadErrorReport = () => {
        try {
            const errorReport: ErrorReport = {
                errorId: this.state.errorId,
                timestamp: new Date().toISOString(),
                message: this.state.error?.message || 'Unknown error',
                stack: this.state.error?.stack || '',
                componentStack: this.state.errorInfo?.componentStack || '',
                userAgent: navigator.userAgent,
                url: window.location.href,
                retryCount: this.retryCount,
                appVersion: process.env.REACT_APP_VERSION || '1.0.0',
                severity: this.classifyError(this.state.error!).severity
            };

            const blob = new Blob([JSON.stringify(errorReport, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `error-report-${this.state.errorId}.json`;
            link.setAttribute('aria-label', 'Download error report file');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download error report:', err);
        }
    };

    // Enhanced error reporting with timeout
    private reportError = async () => {
        if (this.state.isReporting || this.state.reportSent) return;

        this.setState({isReporting: true});
        this.abortController = new AbortController();

        try {
            const errorReport: ErrorReport = {
                errorId: this.state.errorId,
                timestamp: new Date().toISOString(),
                message: this.state.error?.message || 'Unknown error',
                stack: this.state.error?.stack || '',
                componentStack: this.state.errorInfo?.componentStack || '',
                userAgent: navigator.userAgent,
                url: window.location.href,
                retryCount: this.retryCount,
                appVersion: process.env.REACT_APP_VERSION || '1.0.0',
                severity: this.classifyError(this.state.error!).severity
            };

            // Use custom reporting service if provided
            if (this.props.reportingService) {
                await Promise.race([
                    this.props.reportingService(errorReport),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Reporting timeout')), FEEDBACK_DURATION.REPORT_TIMEOUT)
                    )
                ]);
            } else {
                // Default mock reporting
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            this.setState({
                isReporting: false,
                reportSent: true
            });
        } catch (err) {
            console.error('Failed to report error:', err);
            this.setState({isReporting: false});
        } finally {
            this.abortController = null;
        }
    };

    // Auto-report scheduling
    private scheduleAutoReport = () => {
        const timeout = setTimeout(() => {
            if (!this.state.reportSent && this.props.enableReporting) {
                this.reportError();
            }
        }, 5000); // Auto-report after 5 seconds

        this.retryTimeouts.push(timeout);
    };
}

export default ErrorBoundary;