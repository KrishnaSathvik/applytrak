// src/components/forms/ApplicationForm.tsx - MOBILE RESPONSIVE FIXED
import React, { useState, useCallback } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Upload, X, ExternalLink, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ApplicationFormData, Attachment } from '../../types';
import { applicationFormSchema } from '../../utils/validation';

const ApplicationForm: React.FC = () => {
    const { addApplication, showToast } = useAppStore();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { errors, isSubmitting }
    } = useForm<ApplicationFormData>({
        resolver: yupResolver(applicationFormSchema) as any,
        defaultValues: {
            company: '',
            position: '',
            dateApplied: new Date().toISOString().split('T')[0],
            type: 'Remote',
            location: '',
            salary: '',
            jobSource: '',
            jobUrl: '',
            notes: ''
        }
    });

    const jobUrl = watch('jobUrl');

    const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
        try {
            await addApplication({
                company: data.company,
                position: data.position,
                dateApplied: data.dateApplied,
                type: data.type,
                status: 'Applied',
                location: data.location || undefined,
                salary: data.salary || undefined,
                jobSource: data.jobSource || undefined,
                jobUrl: data.jobUrl || undefined,
                notes: data.notes || undefined,
                attachments: attachments.length > 0 ? attachments : undefined
            });

            // Reset form and attachments
            reset({
                company: '',
                position: '',
                dateApplied: new Date().toISOString().split('T')[0],
                type: 'Remote',
                location: '',
                salary: '',
                jobSource: '',
                jobUrl: '',
                notes: ''
            });
            setAttachments([]);

            showToast({
                type: 'success',
                message: '🎉 Application added successfully!'
            });
        } catch (error) {
            console.error('Error adding application:', error);
            showToast({
                type: 'error',
                message: 'Failed to add application. Please try again.'
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

    return (
        <div className="glass-card bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 border-2 border-green-200/30 dark:border-green-700/30">
            {/* Header - MOBILE RESPONSIVE */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="glass rounded-lg sm:rounded-xl p-2 sm:p-3 bg-gradient-to-br from-green-500/20 to-blue-500/20 flex-shrink-0">
                        <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gradient flex items-center gap-2">
                            Add New Application
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <span className="hidden sm:inline">Fill out the details for your new job application</span>
                            <span className="sm:hidden">Add job application details</span>
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
                {/* Row 1: Basic Information - MOBILE STACK */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                    <div className="space-y-2">
                        <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                            Company *
                        </label>
                        <input
                            type="text"
                            {...register('company')}
                            className={`form-input h-12 sm:h-auto text-base transition-all duration-300 ${
                                errors.company
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-green-500 focus:ring-green-500/20'
                            }`}
                            placeholder="e.g. Google, Microsoft"
                            autoComplete="organization"
                        />
                        {errors.company && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                ⚠️ {errors.company.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                            Position *
                        </label>
                        <input
                            type="text"
                            {...register('position')}
                            className={`form-input h-12 sm:h-auto text-base transition-all duration-300 ${
                                errors.position
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-blue-500 focus:ring-blue-500/20'
                            }`}
                            placeholder="e.g. Senior Software Engineer"
                            autoComplete="organization-title"
                        />
                        {errors.position && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                ⚠️ {errors.position.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                        <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                            Date Applied *
                        </label>
                        <input
                            type="date"
                            {...register('dateApplied')}
                            className={`form-input h-12 sm:h-auto text-base transition-all duration-300 ${
                                errors.dateApplied
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-purple-500 focus:ring-purple-500/20'
                            }`}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        {errors.dateApplied && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                ⚠️ {errors.dateApplied.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Row 2: Job Details - MOBILE RESPONSIVE GRID */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                            Job Type *
                        </label>
                        <select
                            {...register('type')}
                            className={`form-input h-12 sm:h-auto text-base transition-all duration-300 ${
                                errors.type
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-indigo-500 focus:ring-indigo-500/20'
                            }`}
                        >
                            <option value="Remote">🏠 Remote</option>
                            <option value="Hybrid">🔄 Hybrid</option>
                            <option value="Onsite">🏢 Onsite</option>
                        </select>
                        {errors.type && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                ⚠️ {errors.type.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                            Location
                        </label>
                        <input
                            type="text"
                            {...register('location')}
                            className="form-input h-12 sm:h-auto text-base focus:border-teal-500 focus:ring-teal-500/20 transition-all duration-300"
                            placeholder="e.g. San Francisco, CA"
                        />
                        {errors.location && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                ⚠️ {errors.location.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                            Salary
                        </label>
                        <input
                            type="text"
                            {...register('salary')}
                            className="form-input h-12 sm:h-auto text-base focus:border-green-500 focus:ring-green-500/20 transition-all duration-300"
                            placeholder="e.g. $120,000/year"
                            inputMode="numeric"
                        />
                        {errors.salary && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                ⚠️ {errors.salary.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                            Job Source
                        </label>
                        <input
                            type="text"
                            {...register('jobSource')}
                            list="jobSources"
                            className="form-input h-12 sm:h-auto text-base focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-300"
                            placeholder="e.g. LinkedIn"
                        />
                        <datalist id="jobSources">
                            <option value="LinkedIn" />
                            <option value="Indeed" />
                            <option value="Glassdoor" />
                            <option value="Company Website" />
                            <option value="AngelList" />
                            <option value="Stack Overflow Jobs" />
                            <option value="Referral" />
                        </datalist>
                        {errors.jobSource && (
                            <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                ⚠️ {errors.jobSource.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* Row 3: Job URL - MOBILE RESPONSIVE */}
                <div className="space-y-2">
                    <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                        Job Posting URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="url"
                            {...register('jobUrl')}
                            className="form-input h-12 sm:h-auto text-base flex-1 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-300"
                            placeholder="https://company.com/jobs/position"
                            inputMode="url"
                        />
                        {jobUrl && jobUrl.trim() !== '' && (
                            <button
                                type="button"
                                onClick={() => window.open(jobUrl, '_blank')}
                                className="btn btn-secondary w-full sm:w-auto h-12 sm:h-auto px-4 hover:scale-105 transition-all duration-200"
                                title="Open job posting"
                            >
                                <ExternalLink className="h-4 w-4 mr-2 sm:mr-0" />
                                <span className="sm:hidden">Open Link</span>
                            </button>
                        )}
                    </div>
                    {errors.jobUrl && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            ⚠️ {errors.jobUrl.message}
                        </p>
                    )}
                </div>

                {/* Row 4: Notes - MOBILE OPTIMIZED */}
                <div className="space-y-2">
                    <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                        Notes
                    </label>
                    <textarea
                        {...register('notes')}
                        rows={4}
                        className="form-input text-base focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-300 resize-none"
                        placeholder="Add any additional notes about this application..."
                    />
                    {errors.notes && (
                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                            ⚠️ {errors.notes.message}
                        </p>
                    )}
                </div>

                {/* Row 5: Attachments - MOBILE RESPONSIVE */}
                <div className="space-y-4">
                    <label className="form-label text-gray-700 dark:text-gray-300 font-semibold">
                        Attachments
                    </label>

                    {/* Existing attachments - MOBILE STACK */}
                    {attachments.length > 0 && (
                        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4 mb-4">
                            {attachments.map((attachment, index) => (
                                <div
                                    key={attachment.id || index}
                                    className="glass rounded-xl p-4 hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300 group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="glass rounded-lg p-2 flex-shrink-0">
                                                <Upload className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                    {attachment.name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="opacity-70 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200 p-2 flex-shrink-0"
                                            title="Remove attachment"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Drop zone - MOBILE OPTIMIZED */}
                    <div
                        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 ${
                            isDragOver
                                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 scale-105'
                                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-center">
                                <div className="glass rounded-full p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>

                            <div>
                                <p className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    <span className="hidden sm:inline">Drop files here, or </span>
                                    <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-semibold underline decoration-primary-500/30 hover:decoration-primary-500 transition-all duration-200">
                                        <span className="sm:hidden">Tap to </span>browse
                                        <input
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            onChange={(e) => handleFileSelect(e.target.files)}
                                            className="hidden"
                                        />
                                    </label>
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                    <span className="hidden sm:inline">Supports PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB each)</span>
                                    <span className="sm:hidden">PDF, DOC, JPG, PNG • Max 10MB</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button - MOBILE RESPONSIVE */}
                <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary w-full sm:w-auto h-12 sm:h-auto group relative overflow-hidden"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                <span className="hidden sm:inline">Adding Application...</span>
                                <span className="sm:hidden">Adding...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                                <span className="hidden sm:inline">Add Application</span>
                                <span className="sm:hidden">Add Application</span>
                                <Sparkles className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ApplicationForm;