// src/components/modals/EditApplicationModal.tsx - Enhanced Typography Version
import React, { useState, useCallback, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Edit, Upload, X, ExternalLink } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { EditFormData, Attachment } from '../../types';
import { editApplicationFormSchema } from '../../utils/validation';

const EditApplicationModal: React.FC = () => {
    const {
        modals,
        updateApplication,
        closeEditModal,
        showToast
    } = useAppStore();

    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const isOpen = modals.editApplication.isOpen;
    const application = modals.editApplication.application;

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<EditFormData>({
        resolver: yupResolver(editApplicationFormSchema) as any, // FIXED: Added type assertion
    });

    const jobUrl = watch('jobUrl');

    // Reset form when modal opens/closes or application changes
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
        } else {
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
        }
    }, [isOpen, application, reset]);

    const onSubmit: SubmitHandler<EditFormData> = async (data) => {
        if (!application) return;

        try {
            // FIXED: Clean up empty strings to undefined for optional fields
            const cleanedData = {
                company: data.company,
                position: data.position,
                dateApplied: data.dateApplied,
                type: data.type,
                status: data.status,
                location: data.location || undefined,
                salary: data.salary || undefined,
                jobSource: data.jobSource || undefined,
                jobUrl: data.jobUrl || undefined,
                notes: data.notes || undefined,
                attachments: attachments.length > 0 ? attachments : undefined
            };

            await updateApplication(application.id, cleanedData);

            closeEditModal();

            showToast({
                type: 'success',
                message: 'Application updated successfully!'
            });
        } catch (error) {
            console.error('Error updating application:', error);
            showToast({
                type: 'error',
                message: 'Failed to update application. Please try again.'
            });
        }
    };

    const handleFileSelect = useCallback((files: FileList | null) => {
        if (!files) return;

        Array.from(files).forEach(file => {
            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain',
                'image/jpeg',
                'image/png'
            ];

            if (!allowedTypes.includes(file.type)) {
                showToast({
                    type: 'error',
                    message: `File type ${file.type} is not allowed. Please use PDF, DOC, DOCX, TXT, JPG, or PNG files.`
                });
                return;
            }

            // Validate file size (10MB limit)
            if (file.size > 10 * 1024 * 1024) {
                showToast({
                    type: 'error',
                    message: `File ${file.name} is too large. Maximum size is 10MB.`
                });
                return;
            }

            // Check for duplicates
            if (attachments.some(att => att.name === file.name)) {
                showToast({
                    type: 'warning',
                    message: `File ${file.name} is already attached.`
                });
                return;
            }

            // Convert to base64
            const reader = new FileReader();
            reader.onload = (e) => {
                const attachment: Attachment = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: e.target?.result as string,
                    uploadedAt: new Date().toISOString()
                };

                setAttachments(prev => [...prev, attachment]);
            };
            reader.readAsDataURL(file);
        });
    }, [attachments, showToast]);

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileSelect(e.dataTransfer.files);
    };

    const handleClose = () => {
        closeEditModal();
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
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={handleClose}
                />

                {/* Modal with Enhanced Typography */}
                <div className="inline-block w-full max-w-4xl px-6 py-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
                    {/* Header with Enhanced Typography */}
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-gradient-static flex items-center gap-2 tracking-tight">
                            <Edit className="h-6 w-6" />
                            Edit Application
                        </h3>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Row 1: Basic Information with Enhanced Typography */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="form-label-enhanced">
                                    Company *
                                </label>
                                <input
                                    type="text"
                                    {...register('company')}
                                    className={`form-input-enhanced ${errors.company ? 'border-red-500' : ''}`}
                                    placeholder="e.g. Google"
                                />
                                {errors.company && (
                                    <p className="form-error">{errors.company.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label-enhanced">
                                    Position *
                                </label>
                                <input
                                    type="text"
                                    {...register('position')}
                                    className={`form-input-enhanced ${errors.position ? 'border-red-500' : ''}`}
                                    placeholder="e.g. Software Engineer"
                                />
                                {errors.position && (
                                    <p className="form-error">{errors.position.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label-enhanced">
                                    Date Applied *
                                </label>
                                <input
                                    type="date"
                                    {...register('dateApplied')}
                                    className={`form-input-enhanced ${errors.dateApplied ? 'border-red-500' : ''}`}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                                {errors.dateApplied && (
                                    <p className="form-error">{errors.dateApplied.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 2: Job Details and Status with Enhanced Typography */}
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="form-label-enhanced">
                                    Job Type *
                                </label>
                                <select
                                    {...register('type')}
                                    className={`form-input-enhanced ${errors.type ? 'border-red-500' : ''}`}
                                >
                                    <option value="Remote">Remote</option>
                                    <option value="Hybrid">Hybrid</option>
                                    <option value="Onsite">Onsite</option>
                                </select>
                                {errors.type && (
                                    <p className="form-error">{errors.type.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label-enhanced">
                                    Status *
                                </label>
                                <select
                                    {...register('status')}
                                    className={`form-input-enhanced ${errors.status ? 'border-red-500' : ''}`}
                                >
                                    <option value="Applied">Applied</option>
                                    <option value="Interview">Interview</option>
                                    <option value="Offer">Offer</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                                {errors.status && (
                                    <p className="form-error">{errors.status.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label-enhanced">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    {...register('location')}
                                    className={`form-input-enhanced ${errors.location ? 'border-red-500' : ''}`}
                                    placeholder="e.g. San Francisco, CA"
                                />
                                {errors.location && (
                                    <p className="form-error">{errors.location.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label-enhanced">
                                    Salary
                                </label>
                                <input
                                    type="text"
                                    {...register('salary')}
                                    className={`form-input-enhanced ${errors.salary ? 'border-red-500' : ''}`}
                                    placeholder="e.g. $120,000/year"
                                />
                                {errors.salary && (
                                    <p className="form-error">{errors.salary.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label-enhanced">
                                    Job Source
                                </label>
                                <input
                                    type="text"
                                    {...register('jobSource')}
                                    list="editJobSources"
                                    className={`form-input-enhanced ${errors.jobSource ? 'border-red-500' : ''}`}
                                    placeholder="e.g. LinkedIn"
                                />
                                <datalist id="editJobSources">
                                    <option value="LinkedIn" />
                                    <option value="Indeed" />
                                    <option value="Glassdoor" />
                                    <option value="Company Website" />
                                    <option value="AngelList" />
                                    <option value="Stack Overflow Jobs" />
                                    <option value="Referral" />
                                </datalist>
                                {errors.jobSource && (
                                    <p className="form-error">{errors.jobSource.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Row 3: Job URL with Enhanced Typography */}
                        <div>
                            <label className="form-label-enhanced">
                                Job Posting URL
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="url"
                                    {...register('jobUrl')}
                                    className={`form-input-enhanced flex-1 ${errors.jobUrl ? 'border-red-500' : ''}`}
                                    placeholder="https://company.com/jobs/position"
                                />
                                {jobUrl && jobUrl.trim() !== '' && (
                                    <button
                                        type="button"
                                        onClick={() => window.open(jobUrl, '_blank')}
                                        className="btn btn-outline font-bold tracking-wide"
                                        title="Open job posting"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            {errors.jobUrl && (
                                <p className="form-error">{errors.jobUrl.message}</p>
                            )}
                        </div>

                        {/* Row 4: Notes with Enhanced Typography */}
                        <div>
                            <label className="form-label-enhanced">
                                Notes
                            </label>
                            <textarea
                                {...register('notes')}
                                rows={4}
                                className={`form-input-enhanced ${errors.notes ? 'border-red-500' : ''}`}
                                placeholder="Add any additional notes about this application..."
                            />
                            {errors.notes && (
                                <p className="form-error">{errors.notes.message}</p>
                            )}
                        </div>

                        {/* Row 5: Attachments with Enhanced Typography */}
                        <div>
                            <label className="form-label-enhanced">
                                Attachments
                            </label>

                            {/* Existing attachments with Enhanced Typography */}
                            {attachments.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    {attachments.map((attachment, index) => (
                                        <div
                                            key={attachment.id || index}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Upload className="h-4 w-4 text-gray-500" />
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                        {attachment.name}
                                                    </p>
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={attachment.data}
                                                    download={attachment.name}
                                                    className="text-primary-600 hover:text-primary-700 p-1 rounded hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                                    title="Download"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Remove attachment"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Drop zone with Enhanced Typography */}
                            <div
                                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                    isDragOver
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    Drag and drop files here, or{' '}
                                    <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-bold">
                                        browse
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileSelect(e.target.files)}
                                            className="hidden"
                                        />
                                    </label>
                                </p>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                    Supports PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB each)
                                </p>
                            </div>
                        </div>

                        {/* Footer with Enhanced Typography */}
                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="btn btn-secondary font-bold tracking-wide"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary font-bold tracking-wide"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        <span className="font-medium">Updating...</span>
                                    </>
                                ) : (
                                    <>
                                        <Edit className="h-4 w-4 mr-2" />
                                        Update Application
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditApplicationModal;