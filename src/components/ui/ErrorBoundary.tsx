import React, {Component, ReactNode} from 'react';
import {AlertTriangle, Bug, Clipboard, Download, Home, RefreshCw} from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
    errorId: string;
    isReporting: boolean;
    reportSent: boolean;
}

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    enableReporting?: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private retryCount = 0;
    private maxRetries = 3;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
            isReporting: false,
            reportSent: false
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return {
            hasError: true,
            error,
            errorId
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        this.setState({
            errorInfo
        });

        // Call custom error handler
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // Log to console for development
        console.group('🚨 Error Boundary Caught Error');
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
        console.error('Component Stack:', errorInfo.componentStack);
        console.groupEnd();

        // Store error details for potential recovery
        this.storeErrorDetails(error, errorInfo);
    }

    render() {
        if (this.state.hasError && this.state.error) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            const severity = this.getErrorSeverity(this.state.error);
            const suggestions = this.getSuggestions(this.state.error);
            const canRetry = this.retryCount < this.maxRetries;

            return (
                <div
                    className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <div className="glass-card border-red-200 dark:border-red-800">
                            {/* Header */}
                            <div className="border-b border-red-200 dark:border-red-800 p-6">
                                <div className="flex items-center space-x-3">
                                    <div className={`p-3 rounded-full ${
                                        severity === 'critical' ? 'bg-red-100 dark:bg-red-900' :
                                            severity === 'high' ? 'bg-orange-100 dark:bg-orange-900' :
                                                severity === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900' :
                                                    'bg-blue-100 dark:bg-blue-900'
                                    }`}>
                                        <AlertTriangle className={`h-6 w-6 ${
                                            severity === 'critical' ? 'text-red-600 dark:text-red-400' :
                                                severity === 'high' ? 'text-orange-600 dark:text-orange-400' :
                                                    severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                                        'text-blue-600 dark:text-blue-400'
                                        }`}/>
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                            Oops! Something went wrong
                                        </h1>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Error ID: {this.state.errorId}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-6 space-y-6">
                                {/* Error Message */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Error Details
                                    </h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-mono break-words">
                                        {this.state.error.message}
                                    </p>
                                </div>

                                {/* Suggestions */}
                                {suggestions.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                            💡 Suggested Solutions
                                        </h3>
                                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                            {suggestions.map((suggestion, index) => (
                                                <li key={index} className="flex items-start">
                                                    <span className="mr-2">•</span>
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Action Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {canRetry && (
                                        <button
                                            onClick={this.handleRetry}
                                            className="btn btn-primary btn-md"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2"/>
                                            Try Again
                                        </button>
                                    )}

                                    <button
                                        onClick={this.handleReload}
                                        className="btn btn-secondary btn-md"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2"/>
                                        Reload Page
                                    </button>

                                    <button
                                        onClick={this.handleGoHome}
                                        className="btn btn-secondary btn-md"
                                    >
                                        <Home className="h-4 w-4 mr-2"/>
                                        Go Home
                                    </button>

                                    <button
                                        onClick={this.downloadErrorReport}
                                        className="btn btn-secondary btn-md"
                                    >
                                        <Download className="h-4 w-4 mr-2"/>
                                        Download Report
                                    </button>
                                </div>

                                {/* Advanced Actions */}
                                <details className="bg-gray-50 dark:bg-gray-800 rounded-lg">
                                    <summary
                                        className="p-4 cursor-pointer font-medium text-gray-900 dark:text-gray-100">
                                        <Bug className="h-4 w-4 inline mr-2"/>
                                        Advanced Options
                                    </summary>
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                id="copy-error-btn"
                                                onClick={this.copyErrorDetails}
                                                className="btn btn-sm btn-secondary"
                                            >
                                                <Clipboard className="h-3 w-3 mr-1"/>
                                                Copy Error Details
                                            </button>

                                            {this.props.enableReporting && (
                                                <button
                                                    onClick={this.reportError}
                                                    disabled={this.state.isReporting || this.state.reportSent}
                                                    className="btn btn-sm btn-secondary disabled:opacity-50"
                                                >
                                                    {this.state.isReporting ? (
                                                        <>
                                                            <RefreshCw className="h-3 w-3 mr-1 animate-spin"/>
                                                            Reporting...
                                                        </>
                                                    ) : this.state.reportSent ? (
                                                        '✓ Reported'
                                                    ) : (
                                                        <>
                                                            <Bug className="h-3 w-3 mr-1"/>
                                                            Report Error
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {this.retryCount > 0 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Retry attempts: {this.retryCount}/{this.maxRetries}
                                            </p>
                                        )}
                                    </div>
                                </details>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }

    private storeErrorDetails = (error: Error, errorInfo: React.ErrorInfo) => {
        try {
            const errorDetails = {
                timestamp: new Date().toISOString(),
                errorId: this.state.errorId,
                message: error.message,
                stack: error.stack,
                componentStack: errorInfo.componentStack,
                userAgent: navigator.userAgent,
                url: window.location.href,
                retryCount: this.retryCount
            };

            localStorage.setItem(`error_${this.state.errorId}`, JSON.stringify(errorDetails));
        } catch (storageError) {
            console.error('Failed to store error details:', storageError);
        }
    };

    private handleRetry = () => {
        this.retryCount++;
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
            isReporting: false,
            reportSent: false
        });
    };

    private handleReload = () => {
        // Clear error state and reload
        localStorage.removeItem('lastError');
        window.location.reload();
    };

    private handleGoHome = () => {
        // Clear error state and navigate to home
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: '',
            isReporting: false,
            reportSent: false
        });
        // Reset URL to home if using routing
        window.history.replaceState({}, '', '/');
    };

    private copyErrorDetails = async () => {
        try {
            const errorDetails = {
                errorId: this.state.errorId,
                timestamp: new Date().toISOString(),
                message: this.state.error?.message,
                stack: this.state.error?.stack,
                componentStack: this.state.errorInfo?.componentStack,
                userAgent: navigator.userAgent,
                url: window.location.href
            };

            await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));

            // Show temporary feedback
            const button = document.getElementById('copy-error-btn');
            if (button) {
                const originalText = button.textContent;
                button.textContent = 'Copied!';
                setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to copy error details:', err);
        }
    };

    private downloadErrorReport = () => {
        try {
            const errorReport = {
                errorId: this.state.errorId,
                timestamp: new Date().toISOString(),
                message: this.state.error?.message,
                stack: this.state.error?.stack,
                componentStack: this.state.errorInfo?.componentStack,
                userAgent: navigator.userAgent,
                url: window.location.href,
                retryCount: this.retryCount,
                appVersion: process.env.REACT_APP_VERSION || '1.0.0'
            };

            const blob = new Blob([JSON.stringify(errorReport, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `error-report-${this.state.errorId}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download error report:', err);
        }
    };

    private reportError = async () => {
        this.setState({isReporting: true});

        try {
            // Simulate error reporting (replace with actual reporting service)
            await new Promise(resolve => setTimeout(resolve, 2000));

            this.setState({
                isReporting: false,
                reportSent: true
            });
        } catch (err) {
            this.setState({isReporting: false});
            console.error('Failed to report error:', err);
        }
    };

    private getErrorSeverity = (error: Error): 'low' | 'medium' | 'high' | 'critical' => {
        const message = error.message.toLowerCase();

        if (message.includes('chunkloaderror') || message.includes('loading chunk')) {
            return 'low'; // Usually network/caching issues
        }
        if (message.includes('network') || message.includes('fetch')) {
            return 'medium'; // Network issues
        }
        if (message.includes('typeerror') || message.includes('referenceerror')) {
            return 'high'; // Code issues
        }
        return 'critical'; // Unknown errors
    };

    private getSuggestions = (error: Error): string[] => {
        const message = error.message.toLowerCase();
        const suggestions: string[] = [];

        if (message.includes('chunkloaderror') || message.includes('loading chunk')) {
            suggestions.push('Try refreshing the page');
            suggestions.push('Clear your browser cache');
            suggestions.push('Check your internet connection');
        } else if (message.includes('network') || message.includes('fetch')) {
            suggestions.push('Check your internet connection');
            suggestions.push('Try again in a few moments');
        } else {
            suggestions.push('Try refreshing the page');
            suggestions.push('Contact support if the problem persists');
        }

        return suggestions;
    };
}

export default ErrorBoundary;