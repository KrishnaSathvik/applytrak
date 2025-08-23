// src/index.tsx - Production Ready Application Entry Point
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorId: string;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);

        this.state = {
            hasError: false,
            error: null,
            errorId: ''
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
            errorId: `ERR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        const isDevelopment = process.env.NODE_ENV === 'development';
        const isProduction = process.env.NODE_ENV === 'production';

        if (isDevelopment) {
            console.group('Application Error');
            console.error('Error:', error);
            console.error('Error Info:', errorInfo);
            console.error('Component Stack:', errorInfo.componentStack);
            console.groupEnd();
        }

        // Report to error tracking service in production
        if (isProduction) {
            // Add your error reporting service here (e.g., Sentry, LogRocket, etc.)
            this.reportError(error, errorInfo);
        }
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div
                    className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-red-100 dark:from-red-950 dark:via-orange-950 dark:to-red-900 p-4">
                    <div
                        className="text-center max-w-lg w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-red-200/50 dark:border-red-700/50 p-8 space-y-6">
                        {/* Error Icon */}
                        <div className="relative">
                            <div className="text-red-500 text-8xl mb-2 animate-bounce-gentle filter drop-shadow-lg">💥
                            </div>
                            <div className="absolute inset-0 text-red-300 text-8xl mb-2 animate-ping opacity-20">💥</div>
                        </div>

                        {/* Error Title */}
                        <div className="space-y-2">
                            <h1 className="font-display text-3xl font-extrabold text-gradient-static tracking-tight text-shadow">
                                Application Crashed
                            </h1>
                            <p className="text-lg font-bold text-red-600 dark:text-red-400 tracking-wide">
                                Error ID: <span
                                className="font-mono text-sm bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                  {this.state.errorId}
                </span>
                            </p>
                        </div>

                        {/* Error Message */}
                        <div
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                            <h3 className="font-bold text-red-800 dark:text-red-200 mb-2 tracking-wide">Error
                                Details:</h3>
                            <p className="text-red-700 dark:text-red-300 text-sm font-medium leading-relaxed break-words">
                                {this.state.error?.message || 'An unexpected error occurred while loading the application'}
                            </p>
                        </div>

                        {/* Error Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={this.handleReload}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold tracking-wide rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <span className="text-lg">🔄</span>
                                <span>Reload Application</span>
                            </button>

                            <button
                                onClick={this.handleReportError}
                                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold tracking-wide rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                                <span className="text-lg">📋</span>
                                <span>Copy Error Details</span>
                            </button>
                        </div>

                        {/* Recovery Tips */}
                        <div
                            className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-left">
                            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 tracking-wide">💡 Quick
                                Recovery Tips:</h3>
                            <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 font-medium leading-relaxed">
                                <li>• Try refreshing the page (Ctrl+R or Cmd+R)</li>
                                <li>• Clear your browser cache and cookies</li>
                                <li>• Disable browser extensions temporarily</li>
                                <li>• Check your internet connection</li>
                            </ul>
                        </div>

                        {/* Technical Info */}
                        <details
                            className="text-left bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                            <summary
                                className="cursor-pointer p-4 font-bold text-gray-700 dark:text-gray-300 tracking-wide hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors">
                                🔧 Technical Details
                            </summary>
                            <div className="p-4 pt-0 space-y-2">
                                <div
                                    className="text-xs font-mono bg-gray-100 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div className="font-bold text-gray-600 dark:text-gray-400 mb-1">Error Stack:</div>
                                    <div
                                        className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                                        {this.state.error?.stack || 'No stack trace available'}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Browser: {navigator.userAgent}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                    Timestamp: {new Date().toLocaleString()}
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }

    private reportError = (error: Error, errorInfo: React.ErrorInfo): void => {
        // Implement your error reporting logic here
        try {
            // Example: Send to error tracking service
            // errorTrackingService.captureException(error, { extra: errorInfo });
            console.log('Error reported to tracking service');
        } catch (reportingError) {
            console.error('Failed to report error:', reportingError);
        }
    };

    private handleReload = (): void => {
        window.location.reload();
    };

    private handleReportError = async (): Promise<void> => {
        const errorDetails = {
            message: this.state.error?.message || 'Unknown error',
            stack: this.state.error?.stack || 'No stack trace',
            errorId: this.state.errorId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };

        try {
            await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
            alert('Error details copied to clipboard! Please send this to support.');
        } catch {
            console.log('Error details:', errorDetails);
            alert('Error details logged to console. Please check console and send to support.');
        }
    };
}

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

const registerServiceWorker = async (): Promise<void> => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    if (!('serviceWorker' in navigator) || !isProduction) {
        if (isDevelopment) {
            console.log('Service Worker not supported or in development mode');
        }
        return;
    }

    try {
        if (isDevelopment) {
            console.log('Registering Service Worker...');
        }

        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
        });

        if (isDevelopment) {
            console.log('Service Worker registered successfully:', registration);
        }

        // Handle updates
        registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
                if (isDevelopment) {
                    console.log('New Service Worker version available');
                }

                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        if (isDevelopment) {
                            console.log('New content available, please refresh');
                        }
                        // You could show a toast notification here for updates
                    }
                });
            }
        });

        // Check for updates periodically (only in production)
        if (isProduction) {
            setInterval(() => {
                registration.update();
            }, 60000); // Check every minute
        }

    } catch (error) {
        if (isDevelopment) {
            console.warn('Service Worker registration failed:', error);
        }
    }
};

// ============================================================================
// GLOBAL ERROR HANDLERS
// ============================================================================

const setupGlobalErrorHandlers = (): void => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    // Global error handler
    window.addEventListener('error', (event) => {
        if (isDevelopment) {
            console.error('Global Error:', event.error);
        }

        // Report to error tracking service in production
        if (isProduction) {
            // Add your error reporting logic here
        }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
        if (isDevelopment) {
            console.error('Unhandled Promise Rejection:', event.reason);
        }

        // Report to error tracking service in production
        if (isProduction) {
            // Add your error reporting logic here
        }
    });
};

// ============================================================================
// APPLICATION INITIALIZATION
// ============================================================================

const initializeApp = async (): Promise<void> => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    try {
        if (isDevelopment) {
            console.log('Initializing Job Application Tracker...');
        }

        // Setup global error handlers
        setupGlobalErrorHandlers();

        // Register service worker
        await registerServiceWorker();

        // Add performance monitoring in development
        if (isDevelopment) {
            console.log('Performance monitoring enabled');
        }

        if (isDevelopment) {
            console.log('Application initialized successfully');
        }

    } catch (error) {
        if (isDevelopment) {
            console.error('Application initialization failed:', error);
        }
    }
};

// ============================================================================
// ROOT RENDERING
// ============================================================================

const renderApp = (): void => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const rootElement = document.getElementById('root');

    if (!rootElement) {
        console.error('Root element not found! Make sure your HTML has <div id="root"></div>');
        return;
    }

    try {
        const root = ReactDOM.createRoot(rootElement);

        root.render(
            <React.StrictMode>
                <ErrorBoundary>
                    <App/>
                </ErrorBoundary>
            </React.StrictMode>
        );

        if (isDevelopment) {
            console.log('React application rendered successfully');
        }

    } catch (error) {
        if (isDevelopment) {
            console.error('Failed to render React application:', error);
        }

        // Fallback HTML error message
        if (rootElement) {
            rootElement.innerHTML = `
        <div style="
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          font-family: system-ui, -apple-system, sans-serif;
          padding: 1rem;
        ">
          <div style="
            text-align: center;
            max-width: 500px;
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
            border: 1px solid #fecaca;
          ">
            <div style="font-size: 4rem; margin-bottom: 1rem;">💥</div>
            <h1 style="
              font-size: 1.5rem;
              font-weight: bold;
              color: #991b1b;
              margin-bottom: 1rem;
            ">
              Critical Application Error
            </h1>
            <p style="
              color: #7f1d1d;
              margin-bottom: 1.5rem;
              line-height: 1.5;
            ">
              The application failed to start. Please refresh the page or contact support if the problem persists.
            </p>
            <button 
              onclick="window.location.reload()"
              style="
                background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
                color: white;
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 0.5rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
              "
              onmouseover="this.style.transform='scale(1.05)'"
              onmouseout="this.style.transform='scale(1)'"
            >
              🔄 Reload Application
            </button>
          </div>
        </div>
      `;
        }
    }
};

// ============================================================================
// APPLICATION STARTUP
// ============================================================================

(async (): Promise<void> => {
    await initializeApp();
    renderApp();
})();