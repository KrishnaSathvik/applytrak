// src/components/ui/NotesPopup.tsx - New Notes Popup Component
import React, { useState } from 'react';
import { X, FileText, MessageSquare, Copy, Check } from 'lucide-react';

interface NotesPopupProps {
    isOpen: boolean;
    onClose: () => void;
    notes: string;
    companyName: string;
    position: string;
}

export const NotesPopup: React.FC<NotesPopupProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          notes,
                                                          companyName,
                                                          position
                                                      }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(notes);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy notes:', err);
        }
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-gray-200 dark:border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                Notes
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {companyName} • {position}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Copy notes"
                        >
                            {copied ? (
                                <Check className="h-4 w-4 text-green-600" />
                            ) : (
                                <Copy className="h-4 w-4" />
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {notes && notes.trim() ? (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed">
                                    {notes}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No notes available for this application.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};