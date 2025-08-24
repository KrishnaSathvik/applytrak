import React, {useCallback, useEffect, useState} from 'react';
import {Check, Copy, FileText, MessageSquare, X} from 'lucide-react';

interface NotesPopupProps {
    isOpen: boolean;
    onClose: () => void;
    notes: string;
    companyName: string;
    position: string;
}

const COPY_SUCCESS_DURATION = 2000;

export const NotesPopup: React.FC<NotesPopupProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          notes,
                                                          companyName,
                                                          position,
                                                      }) => {
    const [copied, setCopied] = useState(false);

    // Handle escape key press
    useEffect(() => {
        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscapeKey);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const handleCopy = useCallback(async () => {
        if (!notes?.trim()) {
            console.warn('NotesPopup: No notes to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(notes);
            setCopied(true);

            // Reset copied state after duration
            setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION);
        } catch (error) {
            console.error('NotesPopup: Failed to copy notes', error);

            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = notes;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();

                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);

                if (successful) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), COPY_SUCCESS_DURATION);
                }
            } catch (fallbackError) {
                console.error('NotesPopup: Clipboard fallback failed', fallbackError);
            }
        }
    }, [notes]);

    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    }, [onClose]);

    const handleContentClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
    }, []);

    // Early return if not open
    if (!isOpen) {
        return null;
    }

    const hasNotes = notes && notes.trim();
    const copyButtonTitle = copied ? 'Copied!' : 'Copy notes';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-labelledby="notes-title"
            aria-describedby="notes-content"
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all duration-200 scale-100"
                onClick={handleContentClick}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <MessageSquare
                                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                                aria-hidden="true"
                            />
                        </div>
                        <div>
                            <h3
                                id="notes-title"
                                className="text-lg font-bold text-gray-900 dark:text-gray-100"
                            >
                                Notes
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {hasNotes && (
                            <button
                                onClick={handleCopy}
                                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                title={copyButtonTitle}
                                type="button"
                                disabled={copied}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4 text-green-600"/>
                                ) : (
                                    <Copy className="h-4 w-4"/>
                                )}
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Close notes popup"
                            type="button"
                        >
                            <X className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div
                    id="notes-content"
                    className="p-6 max-h-[60vh] overflow-y-auto"
                >
                    {hasNotes ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div
                                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed m-0">
                                    {notes}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText
                                className="h-12 w-12 text-gray-400 mx-auto mb-3"
                                aria-hidden="true"
                            />
                            <p className="text-gray-500 dark:text-gray-400">
                                No notes available for this application.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        type="button"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};