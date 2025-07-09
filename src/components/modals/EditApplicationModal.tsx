// src/components/modals/EditApplicationModal.tsx - Enhanced Spacious Version
import React, {useCallback, useEffect, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {Edit, ExternalLink, FileText, Trash2, Upload, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {Attachment, EditFormData} from '../../types';
import {editApplicationFormSchema} from '../../utils/validation';

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
        formState: {errors, isSubmitting}
    } = useForm<EditFormData>({
        resolver: yupResolver(editApplicationFormSchema) as any,
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
            // Clean up empty strings to undefined for optional fields
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
                notes: data.notes || undefined, // NO CHARACTER LIMIT
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
                {/* Enhanced Backdrop with Glassmorphism */}
                <div
                    className="fixed inset-0 transition-all duration-300 bg-black/40 backdrop-blur-sm"
                    onClick={handleClose}
                />

                {/* ENHANCED SPACIOUS MODAL */}
                <div
                    className="inline-block w-full max-w-6xl px-8 py-8 my-8 overflow-hidden text-left align-middle transition-all transform bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl rounded-3xl border border-white/20">

                    {/* SPACIOUS HEADER */}
                    <div
                        className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600">
                                <Edit className="h-6 w-6 text-white"/>
                            </div>
                            <div>
                                <h3 className="text-2xl font-extrabold text-gradient-static tracking-tight">
                                    Edit Application
                                </h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">
                                    Update your job application details
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-xl hover:bg-gray-100/80 dark:hover:bg-gray-700/80 transition-all duration-200 hover:scale-105"
                        >
                            <X className="h-6 w-6"/>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                        {/* SECTION 1: BASIC INFORMATION */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-2 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                <h4 className="text-lg font-bold text-gradient-blue tracking-wide">Basic
                                    Information</h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Company *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('company')}
                                        className={`form-input-enhanced h-12 text-base ${errors.company ? 'border-red-500' : ''}`}
                                        placeholder="e.g. Google, Apple, Microsoft"
                                    />
                                    {errors.company && (
                                        <p className="form-error">{errors.company.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Position *
                                    </label>
                                    <input
                                        type="text"
                                        {...register('position')}
                                        className={`form-input-enhanced h-12 text-base ${errors.position ? 'border-red-500' : ''}`}
                                        placeholder="e.g. Senior Software Engineer"
                                    />
                                    {errors.position && (
                                        <p className="form-error">{errors.position.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Date Applied *
                                    </label>
                                    <input
                                        type="date"
                                        {...register('dateApplied')}
                                        className={`form-input-enhanced h-12 text-base ${errors.dateApplied ? 'border-red-500' : ''}`}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                    {errors.dateApplied && (
                                        <p className="form-error">{errors.dateApplied.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: JOB DETAILS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-2 h-8 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                                <h4 className="text-lg font-bold text-gradient-purple tracking-wide">Job Details &
                                    Status</h4>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Job Type *
                                    </label>
                                    <select
                                        {...register('type')}
                                        className={`form-input-enhanced h-12 text-base ${errors.type ? 'border-red-500' : ''}`}
                                    >
                                        <option value="Remote">🏠 Remote</option>
                                        <option value="Hybrid">🔄 Hybrid</option>
                                        <option value="Onsite">🏢 Onsite</option>
                                    </select>
                                    {errors.type && (
                                        <p className="form-error">{errors.type.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Status *
                                    </label>
                                    <select
                                        {...register('status')}
                                        className={`form-input-enhanced h-12 text-base ${errors.status ? 'border-red-500' : ''}`}
                                    >
                                        <option value="Applied">📝 Applied</option>
                                        <option value="Interview">💬 Interview</option>
                                        <option value="Offer">🎉 Offer</option>
                                        <option value="Rejected">❌ Rejected</option>
                                    </select>
                                    {errors.status && (
                                        <p className="form-error">{errors.status.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        {...register('location')}
                                        className={`form-input-enhanced h-12 text-base ${errors.location ? 'border-red-500' : ''}`}
                                        placeholder="e.g. San Francisco, CA"
                                    />
                                    {errors.location && (
                                        <p className="form-error">{errors.location.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Salary Range
                                    </label>
                                    <input
                                        type="text"
                                        {...register('salary')}
                                        className={`form-input-enhanced h-12 text-base ${errors.salary ? 'border-red-500' : ''}`}
                                        placeholder="e.g. $120,000 - $150,000"
                                    />
                                    {errors.salary && (
                                        <p className="form-error">{errors.salary.message}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="form-label-enhanced">
                                        Job Source
                                    </label>
                                    <input
                                        type="text"
                                        {...register('jobSource')}
                                        list="editJobSources"
                                        className={`form-input-enhanced h-12 text-base ${errors.jobSource ? 'border-red-500' : ''}`}
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
                                        <p className="form-error">{errors.jobSource.message}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: JOB URL */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-2 h-8 bg-gradient-to-b from-green-500 to-emerald-600 rounded-full"></div>
                                <h4 className="text-lg font-bold text-gradient-static tracking-wide">Job Posting</h4>
                            </div>

                            <div className="space-y-2">
                                <label className="form-label-enhanced">
                                    Job Posting URL
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="url"
                                        {...register('jobUrl')}
                                        className={`form-input-enhanced h-12 text-base flex-1 ${errors.jobUrl ? 'border-red-500' : ''}`}
                                        placeholder="https://company.com/careers/job-id"
                                    />
                                    {jobUrl && jobUrl.trim() !== '' && (
                                        <button
                                            type="button"
                                            onClick={() => window.open(jobUrl, '_blank')}
                                            className="btn btn-outline h-12 px-4 font-bold tracking-wide hover:scale-105 transition-transform"
                                            title="Open job posting"
                                        >
                                            <ExternalLink className="h-5 w-5"/>
                                        </button>
                                    )}
                                </div>
                                {errors.jobUrl && (
                                    <p className="form-error">{errors.jobUrl.message}</p>
                                )}
                            </div>
                        </div>

                        {/* SECTION 4: NOTES - UNLIMITED CHARACTER COUNT */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div
                                    className="w-2 h-8 bg-gradient-to-b from-amber-500 to-orange-600 rounded-full"></div>
                                <h4 className="text-lg font-bold text-gradient-static tracking-wide">Additional
                                    Notes</h4>
                                <span
                                    className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
                                    ∞ Unlimited
                                </span>
                            </div>

                            <div className="space-y-2">
                                <label className="form-label-enhanced">
                                    Notes & Details
                                </label>
                                <textarea
                                    {...register('notes')}
                                    rows={6}
                                    className={`form-input-enhanced text-base resize-none ${errors.notes ? 'border-red-500' : ''}`}
                                    placeholder="Add any additional details about this application:
• Interview experience
• Company culture notes
• Salary negotiation details
• Follow-up reminders
• Personal impressions
• Contact information

Write as much as you need - no character limits!"
                                />
                                {errors.notes && (
                                    <p className="form-error">{errors.notes.message}</p>
                                )}
                            </div>
                        </div>

                        {/* SECTION 5: ATTACHMENTS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-rose-600 rounded-full"></div>
                                <h4 className="text-lg font-bold text-gradient-static tracking-wide">File
                                    Attachments</h4>
                            </div>

                            {/* Existing attachments */}
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
                                                        {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <a
                                                    href={attachment.data}
                                                    download={attachment.name}
                                                    className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 hover:scale-105"
                                                    title="Download"
                                                >
                                                    <ExternalLink className="h-4 w-4"/>
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(index)}
                                                    className="p-2 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 hover:scale-105"
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
                                    isDragOver
                                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20 scale-105'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50/50 dark:hover:bg-gray-800/50'
                                }`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <div
                                    className="p-4 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 w-fit mx-auto mb-4">
                                    <Upload className="h-8 w-8 text-white"/>
                                </div>
                                <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    Drag and drop files here, or{' '}
                                    <label
                                        className="text-blue-600 hover:text-blue-700 cursor-pointer font-extrabold text-gradient-blue">
                                        browse files
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileSelect(e.target.files)}
                                            className="hidden"
                                        />
                                    </label>
                                </p>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Supports PDF, DOC, DOCX, TXT, JPG, PNG • Max 10MB each
                                </p>
                            </div>
                        </div>

                        {/* SPACIOUS FOOTER */}
                        <div
                            className="flex justify-end gap-4 pt-8 border-t border-gray-200/50 dark:border-gray-700/50">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="btn btn-secondary px-8 py-3 text-base font-bold tracking-wide hover:scale-105 transition-transform"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="btn btn-primary px-8 py-3 text-base font-bold tracking-wide hover:scale-105 transition-transform"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div
                                            className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
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
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditApplicationModal;