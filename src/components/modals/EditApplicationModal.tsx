import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {AlertTriangle, CheckCircle, Edit, ExternalLink, FileText, Trash2, Upload, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {Attachment, EditFormData} from '../../types';
import {editApplicationFormSchema} from '../../utils/validation';

// Enhanced interfaces for better type safety
interface FileValidationResult {
    isValid: boolean;
    error?: string;
    warning?: string;
}

interface DragState {
    isDragOver: boolean;
    dragCounter: number;
}

const EditApplicationModal: React.FC = () => {
    const {
        modals,
        updateApplication,
        closeEditModal,
        showToast
    } = useAppStore();

    // State management
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [dragState, setDragState] = useState<DragState>({isDragOver: false, dragCounter: 0});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isPreviewMode, setIsPreviewMode] = useState(false);

    // Refs for focus management
    const firstInputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isOpen = modals.editApplication.isOpen;
    const application = modals.editApplication.application;

    // Memoized allowed file types for better performance
    const allowedFileTypes = useMemo(() => [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png'
    ], []);

    const fileTypeLabels = useMemo(() => ({
        'application/pdf': 'PDF',
        'application/msword': 'DOC',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
        'text/plain': 'TXT',
        'image/jpeg': 'JPG',
        'image/png': 'PNG'
    }), []);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: {errors, isSubmitting, isDirty},
        trigger,
        setValue
    } = useForm<EditFormData>({
        resolver: yupResolver(editApplicationFormSchema) as any,
        mode: 'onChange'
    });

    const watchedValues = watch();
    const {jobUrl, notes} = watchedValues;

    // Track unsaved changes
    useEffect(() => {
        setHasUnsavedChanges(isDirty);
    }, [isDirty]);

    // Enhanced form reset with better data handling
    useEffect(() => {
        if (isOpen && application) {
            const formData: EditFormData = {
                company: application.company,
                position: application.position,
                dateApplied: application.dateApplied,
                type: application.type,
                status: application.status,
                location: application.location || '',
                salary: application.salary || '',
                jobSource: application.jobSource || '',
                jobUrl: application.jobUrl || '',
                notes: application.notes || ''
            };

            reset(formData);
            setAttachments(application.attachments || []);
            setHasUnsavedChanges(false);
            setIsPreviewMode(false);

            // Focus management
            setTimeout(() => {
                firstInputRef.current?.focus();
            }, 100);
        } else if (!isOpen) {
            // Reset everything when modal closes
            reset({
                company: '',
                position: '',
                dateApplied: new Date().toISOString().split('T')[0],
                type: 'Remote',
                status: 'Applied',
                location: '',
                salary: '',
                jobSource: '',
                jobUrl: '',
                notes: ''
            });
            setAttachments([]);
            setHasUnsavedChanges(false);
            setIsPreviewMode(false);
            setDragState({isDragOver: false, dragCounter: 0});
        }
    }, [isOpen, application, reset]);

    // Enhanced file validation
    const validateFile = useCallback((file: File): FileValidationResult => {
        // Check file type
        if (!allowedFileTypes.includes(file.type)) {
            return {
                isValid: false,
                error: `File type "${fileTypeLabels[file.type as keyof typeof fileTypeLabels] || file.type}" is not supported. Please use PDF, DOC, DOCX, TXT, JPG, or PNG files.`
            };
        }

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            return {
                isValid: false,
                error: `File "${file.name}" is too large. Maximum size is 10MB.`
            };
        }

        // Check for large files (warn but allow)
        if (file.size > 5 * 1024 * 1024) {
            return {
                isValid: true,
                warning: `File "${file.name}" is quite large (${(file.size / 1024 / 1024).toFixed(1)}MB). Consider compressing it for better performance.`
            };
        }

        // Check for duplicates
        if (attachments.some(att => att.name === file.name && att.size === file.size)) {
            return {
                isValid: false,
                error: `File "${file.name}" appears to already be attached.`
            };
        }

        return {isValid: true};
    }, [allowedFileTypes, fileTypeLabels, attachments]);

    // Enhanced form submission — normalize first, then validate, then save
    const onSubmit: SubmitHandler<EditFormData> = useCallback(async (data) => {
        if (!application) return;

        try {
            // 1) Normalize first
            const normalizedCompany = (data.company ?? '').trim();
            const normalizedPosition = (data.position ?? '').trim();

            // Push normalized values into RHF so validation checks the real values
            setValue('company', normalizedCompany, {shouldValidate: true, shouldDirty: true});
            setValue('position', normalizedPosition, {shouldValidate: true, shouldDirty: true});

            // 2) Validate AFTER normalization
            const isValid = await trigger();
            if (!isValid) {
                showToast({
                    type: 'error',
                    message: 'Please fix the validation errors before saving.',
                    duration: 4000
                });
                return;
            }

            // 3) Build cleaned payload from normalized values
            const cleanedData = {
                company: normalizedCompany,
                position: normalizedPosition,
                dateApplied: data.dateApplied,
                type: data.type,
                status: data.status,
                location: data.location?.trim() || undefined,
                salary: data.salary?.trim() || undefined,
                jobSource: data.jobSource?.trim() || undefined,
                jobUrl: data.jobUrl?.trim() || undefined,
                notes: data.notes?.trim() || undefined,
                attachments: attachments.length > 0 ? attachments : undefined
            };

            await updateApplication(application.id, cleanedData);
            closeEditModal();

            showToast({
                type: 'success',
                message: 'Application updated successfully!',
                duration: 3000
            });
        } catch (error) {
            console.error('Error updating application:', error);
            showToast({
                type: 'error',
                message: 'Failed to update application. Please try again.',
                duration: 5000
            });
        }
    }, [application, attachments, updateApplication, closeEditModal, showToast, trigger, setValue]);

    // Enhanced file handling
    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files) return;

        const validFiles: File[] = [];
        const errors: string[] = [];
        const warnings: string[] = [];

        Array.from(files).forEach(file => {
            const validation = validateFile(file);

            if (validation.isValid) {
                validFiles.push(file);
                if (validation.warning) {
                    warnings.push(validation.warning);
                }
            } else if (validation.error) {
                errors.push(validation.error);
            }
        });

        // Show validation messages
        if (errors.length > 0) {
            showToast({
                type: 'error',
                message: errors.join(' '),
                duration: 6000
            });
        }

        if (warnings.length > 0) {
            showToast({
                type: 'warning',
                message: warnings.join(' '),
                duration: 4000
            });
        }

        // Process valid files
        validFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const attachment: Attachment = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target?.result as string,
                    uploadedAt: new Date().toISOString()
                };

                setAttachments(prev => [...prev, attachment]);
                setHasUnsavedChanges(true);
            };
            reader.onerror = () => {
                showToast({
                    type: 'error',
                    message: `Failed to read file "${file.name}". Please try again.`,
                    duration: 4000
                });
            };
            reader.readAsDataURL(file);
        });

        if (validFiles.length > 0) {
            showToast({
                type: 'success',
                message: `${validFiles.length} file${validFiles.length > 1 ? 's' : ''} added successfully!`,
                duration: 3000
            });
        }
    }, [validateFile, showToast]);

    const removeAttachment = useCallback((index: number) => {
        const attachment = attachments[index];
        setAttachments(prev => prev.filter((_, i) => i !== index));
        setHasUnsavedChanges(true);

        showToast({
            type: 'info',
            message: `Removed "${attachment.name}"`,
            duration: 2000
        });
    }, [attachments, showToast]);

    // Enhanced drag and drop handling
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragState(prev => ({
            isDragOver: true,
            dragCounter: prev.dragCounter + 1
        }));
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragState(prev => {
            const newCounter = prev.dragCounter - 1;
            return {
                isDragOver: newCounter > 0,
                dragCounter: newCounter
            };
        });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        setDragState({isDragOver: false, dragCounter: 0});
        handleFileSelect(e.dataTransfer.files);
    }, [handleFileSelect]);

    // Enhanced close handler with unsaved changes warning
    const handleClose = useCallback(() => {
        if (hasUnsavedChanges) {
            const confirmClose = window.confirm(
                'You have unsaved changes. Are you sure you want to close without saving?'
            );
            if (!confirmClose) return;
        }

        closeEditModal();
    }, [hasUnsavedChanges, closeEditModal]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                handleClose();
            } else if (event.key === 's' && (event.ctrlKey || event.metaKey)) {
                event.preventDefault();
                if (!isSubmitting && hasUnsavedChanges) {
                    handleSubmit(onSubmit)();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, handleClose, handleSubmit, onSubmit, isSubmitting, hasUnsavedChanges]);

    // Auto-save functionality (optional)
    const triggerAutoSave = useCallback(() => {
        if (hasUnsavedChanges && !isSubmitting) {
            const currentValues = watchedValues;
            localStorage.setItem('editApplication_draft', JSON.stringify({
                ...currentValues,
                attachments,
                timestamp: Date.now()
            }));
        }
    }, [hasUnsavedChanges, isSubmitting, watchedValues, attachments]);

    useEffect(() => {
        const autoSaveInterval = setInterval(triggerAutoSave, 30000); // Auto-save every 30 seconds
        return () => clearInterval(autoSaveInterval);
    }, [triggerAutoSave]);

    // Format file size helper
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true"
             aria-labelledby="edit-modal-title">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Enhanced Backdrop */}
                <div
                    className="fixed inset-0 transition-all duration-300 bg-black/40 backdrop-blur-sm"
                    onClick={handleClose}
                    aria-hidden="true"
                />

                {/* Enhanced Modal */}
                <div
                    className="inline-block w-full max-w-6xl px-8 py-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Enhanced Header */}
                    <div
                        className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600">
                                <Edit className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <h3 id="edit-modal-title"
                                    className="text-2xl font-extrabold text-gradient-static tracking-tight">
                                    Edit Application
                                </h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                                    Update your job application details
                                    {hasUnsavedChanges && (
                                        <span
                                            className="ml-2 inline-flex items-center text-amber-600 dark:text-amber-400">
                      <span className="w-2 h-2 bg-amber-500 rounded-full mr-1 animate-pulse"/>
                      Unsaved changes
                    </span>
                                    )}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            aria-label="Close modal"
                            type="button"
                        >
                            <X className="h-6 w-6"/>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Section 1: Basic Information */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"/>
                                <h4 className="text-lg font-bold text-gradient-blue tracking-wide">Basic
                                    Information</h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Company <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('company')}
                                        autoFocus
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.company ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        placeholder="e.g. Google, Apple, Microsoft"
                                        aria-describedby={errors.company ? 'company-error' : undefined}
                                    />
                                    {errors.company && (
                                        <p id="company-error" className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.company.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Position <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        {...register('position')}
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.position ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        placeholder="e.g. Senior Software Engineer"
                                        aria-describedby={errors.position ? 'position-error' : undefined}
                                    />
                                    {errors.position && (
                                        <p id="position-error" className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.position.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Date Applied <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        {...register('dateApplied')}
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.dateApplied ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        max={new Date().toISOString().split('T')[0]}
                                        aria-describedby={errors.dateApplied ? 'date-error' : undefined}
                                    />
                                    {errors.dateApplied && (
                                        <p id="date-error" className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.dateApplied.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Job Details */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"/>
                                <h4 className="text-lg font-bold text-gradient-purple tracking-wide">Job Details &
                                    Status</h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Job Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('type')}
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.type ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        aria-describedby={errors.type ? 'type-error' : undefined}
                                    >
                                        <option value="Remote">🏠 Remote</option>
                                        <option value="Hybrid">🔄 Hybrid</option>
                                        <option value="Onsite">🏢 Onsite</option>
                                    </select>
                                    {errors.type && (
                                        <p id="type-error" className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.type.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Status <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        {...register('status')}
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.status ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        aria-describedby={errors.status ? 'status-error' : undefined}
                                    >
                                        <option value="Applied">📝 Applied</option>
                                        <option value="Interview">💬 Interview</option>
                                        <option value="Offer">🎉 Offer</option>
                                        <option value="Rejected">❌ Rejected</option>
                                    </select>
                                    {errors.status && (
                                        <p id="status-error" className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.status.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">Location</label>
                                    <input
                                        type="text"
                                        {...register('location')}
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.location ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        placeholder="e.g. San Francisco, CA"
                                    />
                                    {errors.location && (
                                        <p className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.location.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">Salary Range</label>
                                    <input
                                        type="text"
                                        {...register('salary')}
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.salary ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        placeholder="e.g. $120,000 - $150,000"
                                    />
                                    {errors.salary && (
                                        <p className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.salary.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">Job Source</label>
                                    <input
                                        type="text"
                                        {...register('jobSource')}
                                        list="editJobSources"
                                        className={`form-input-enhanced h-12 text-base transition-all duration-200 ${errors.jobSource ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        placeholder="e.g. LinkedIn"
                                    />
                                    <datalist id="editJobSources">
                                        <option value="LinkedIn"/>
                                        <option value="Indeed"/>
                                        <option value="Glassdoor"/>
                                        <option value="Company Website"/>
                                        <option value="AngelList"/>
                                        <option value="Stack Overflow Jobs"/>
                                        <option value="Referral"/>
                                        <option value="Recruiter"/>
                                    </datalist>
                                    {errors.jobSource && (
                                        <p className="form-error flex items-center">
                                            <AlertTriangle className="h-3 w-3 mr-1"/>
                                            {errors.jobSource.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Job URL */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"/>
                                <h4 className="text-lg font-bold text-gradient-static tracking-wide">Job Posting</h4>
                            </div>

                            <div className="space-y-2">
                                <label className="form-label-enhanced">Job Posting URL</label>
                                <div className="flex gap-3">
                                    <input
                                        type="url"
                                        {...register('jobUrl')}
                                        className={`form-input-enhanced h-12 text-base flex-1 transition-all duration-200 ${errors.jobUrl ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                        placeholder="https://company.com/careers/job-id"
                                    />
                                    {jobUrl && jobUrl.trim() !== '' && (
                                        <button
                                            type="button"
                                            onClick={() => window.open(jobUrl, '_blank', 'noopener,noreferrer')}
                                            className="btn btn-outline h-12 px-4 font-bold tracking-wide hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-green-500/20"
                                            title="Open job posting in new tab"
                                        >
                                            <ExternalLink className="h-5 w-5"/>
                                        </button>
                                    )}
                                </div>
                                {errors.jobUrl && (
                                    <p className="form-error flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-1"/>
                                        {errors.jobUrl.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Section 4: Notes */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"/>
                                <h4 className="text-lg font-bold text-gradient-static tracking-wide">Additional
                                    Notes</h4>
                                <span
                                    className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                  ∞ Unlimited
                </span>
                            </div>

                            <div className="space-y-2">
                                <label className="form-label-enhanced">Notes & Details</label>
                                <textarea
                                    {...register('notes')}
                                    rows={6}
                                    className={`form-input-enhanced text-base resize-none transition-all duration-200 ${errors.notes ? 'border-red-500 ring-1 ring-red-500/20' : ''}`}
                                    placeholder="Add any additional details about this application:
• Interview experience
• Company culture notes
• Salary negotiation details
• Follow-up reminders
• Personal impressions
• Contact information

Write as much as you need - no character limits!"
                                />
                                {notes && notes.length > 500 && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                                        <CheckCircle className="h-3 w-3 mr-1 text-green-500"/>
                                        Detailed notes ({notes.length} characters)
                                    </p>
                                )}
                                {errors.notes && (
                                    <p className="form-error flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-1"/>
                                        {errors.notes.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Section 5: Enhanced Attachments */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"/>
                                <h4 className="text-lg font-bold text-gradient-static tracking-wide">File
                                    Attachments</h4>
                                {attachments.length > 0 && (
                                    <span
                                        className="text-sm font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    {attachments.length} file{attachments.length > 1 ? 's' : ''}
                  </span>
                                )}
                            </div>

                            {/* Existing attachments with enhanced UI */}
                            {attachments.length > 0 && (
                                <div className="space-y-3 mb-6">
                                    {attachments.map((attachment, index) => (
                                        <div
                                            key={attachment.id || index}
                                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-md transition-all duration-200"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                                                    <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900 dark:text-gray-100 tracking-tight">
                                                        {attachment.name}
                                                    </p>
                                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 tracking-wider">
                                                        {formatFileSize(attachment.size)} • {fileTypeLabels[attachment.type as keyof typeof fileTypeLabels] || 'Unknown'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (attachment.data) {
                                                            (async () => {
                                                                const res = await fetch(attachment.data);
                                                                const blob = await res.blob();
                                                                const objUrl = URL.createObjectURL(blob);
                                                                window.open(objUrl, '_blank', 'noopener,noreferrer');
                                                                setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
                                                            })();
                                                        } else if ((attachment as any).storagePath) {
                                                            // getAttachmentSignedUrl(...).then(u => window.open(u, '_blank', 'noopener,noreferrer'));
                                                        }
                                                    }}
                                                    title="View file"
                                                >
                                                    <ExternalLink className="h-4 w-4"/>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                                                    title="Remove attachment"
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Enhanced Drop zone */}
                            <div
                                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                                    dragState.isDragOver
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105 shadow-lg'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                                }`}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                            >
                                <div
                                    className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 w-fit mx-auto mb-4">
                                    <Upload
                                        className={`h-8 w-8 text-white transition-transform duration-300 ${dragState.isDragOver ? 'scale-110' : ''}`}/>
                                </div>
                                <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    {dragState.isDragOver ? 'Drop files here!' : 'Drag and drop files here, or'}{' '}
                                    <label
                                        className="text-blue-600 hover:text-blue-700 cursor-pointer font-extrabold text-gradient-blue">
                                        browse files
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileSelect(e.target.files)}
                                            className="hidden"
                                            aria-label="Upload files"
                                        />
                                    </label>
                                </p>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Supports PDF, DOC, DOCX, TXT, JPG, PNG • Max 10MB each
                                </p>
                            </div>
                        </div>

                        {/* Enhanced Footer */}
                        <div
                            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                                <p>Press Ctrl+S (Cmd+S) to save quickly</p>
                                {hasUnsavedChanges && (
                                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                                        Auto-save active • Changes saved every 30 seconds
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="btn btn-secondary px-8 py-3 text-base font-bold tracking-wide hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-gray-500/20"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary px-8 py-3 text-base font-bold tracking-wide hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div
                                                className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"/>
                                            <span className="font-medium">Updating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Edit className="h-5 w-5 mr-3"/>
                                            Update Application
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditApplicationModal;