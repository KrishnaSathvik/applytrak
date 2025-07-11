// src/components/forms/ApplicationForm.tsx - FIXED VERSION WITH ALL STYLING IMPROVEMENTS
import React, {useCallback, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {ExternalLink, Plus, Sparkles, Upload, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {ApplicationFormData, Attachment} from '../../types/application.types';
import {applicationFormSchema} from '../../utils/validation';

const ApplicationForm: React.FC = () => {
    const {addApplication, showToast} = useAppStore();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: {errors, isSubmitting}
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
    const notesValue = watch('notes') || '';

    // 🔧 FIXED: Remove duplicate toast - let store handle all notifications
    const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
        try {
            // ✅ Only call addApplication - store handles the toast notification
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

            // 🔧 REMOVED: Duplicate toast call - store already shows success message
            // The store's addApplication method handles the success notification

        } catch (error) {
            console.error('Error adding application:', error);
            // ✅ KEEP: Form-specific error handling
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
            {/* 🔧 FIXED: Enhanced Header - Better Responsive Design */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="glass rounded-lg sm:rounded-xl p-2 sm:p-3 bg-gradient-to-br from-green-500/20 to-blue-500/20 flex-shrink-0">
                        <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400"/>
                    </div>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-gradient-static tracking-tight flex items-center gap-2">
                            Add New Application
                            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500"/>
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 text-base font-medium leading-relaxed">
                            <span className="hidden sm:inline">Fill out the details for your new job application</span>
                            <span className="sm:hidden">Add job application details</span>
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
                {/* 🔧 FIXED: Row 1 - Basic Information with Enhanced Styling */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                    <div className="space-y-3">
                        <label className="form-label-enhanced">
                            Company Name*
                        </label>
                        <input
                            type="text"
                            {...register('company')}
                            className={`form-input-enhanced ${
                                errors.company
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-green-500 focus:ring-green-500/20'
                            }`}
                            placeholder="e.g. Google, Microsoft"
                            autoComplete="organization"
                        />
                        {errors.company && (
                            <p className="form-error">
                                ⚠️ {errors.company.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">
                            Position*
                        </label>
                        <input
                            type="text"
                            {...register('position')}
                            className={`form-input-enhanced ${
                                errors.position
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-blue-500 focus:ring-blue-500/20'
                            }`}
                            placeholder="e.g. Senior Software Engineer"
                            autoComplete="organization-title"
                        />
                        {errors.position && (
                            <p className="form-error">
                                ⚠️ {errors.position.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                        <label className="form-label-enhanced">
                            Date Applied*
                        </label>
                        <input
                            type="date"
                            {...register('dateApplied')}
                            className={`form-input-enhanced ${
                                errors.dateApplied
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-purple-500 focus:ring-purple-500/20'
                            }`}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        {errors.dateApplied && (
                            <p className="form-error">
                                ⚠️ {errors.dateApplied.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* 🔧 FIXED: Row 2 - Job Details with Enhanced Styling */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <div className="space-y-3">
                        <label className="form-label-enhanced">
                            Job Type*
                        </label>
                        <select
                            {...register('type')}
                            className={`form-input-enhanced ${
                                errors.type
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-indigo-500 focus:ring-indigo-500/20'
                            }`}
                        >
                            <option value="Remote" className="font-medium">🏠 Remote</option>
                            <option value="Hybrid" className="font-medium">🔄 Hybrid</option>
                            <option value="Onsite" className="font-medium">🏢 Onsite</option>
                        </select>
                        {errors.type && (
                            <p className="form-error">
                                ⚠️ {errors.type.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">
                            Location
                        </label>
                        <input
                            type="text"
                            {...register('location')}
                            className="form-input-enhanced focus:border-teal-500 focus:ring-teal-500/20"
                            placeholder="e.g. San Francisco, CA"
                        />
                        {errors.location && (
                            <p className="form-error">
                                ⚠️ {errors.location.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">
                            Salary
                        </label>
                        <input
                            type="text"
                            {...register('salary')}
                            className="form-input-enhanced focus:border-green-500 focus:ring-green-500/20"
                            placeholder="e.g. $120,000/year"
                            inputMode="numeric"
                        />
                        {errors.salary && (
                            <p className="form-error">
                                ⚠️ {errors.salary.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">
                            Job Source
                        </label>
                        <input
                            type="text"
                            {...register('jobSource')}
                            list="jobSources"
                            className="form-input-enhanced focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="e.g. LinkedIn"
                        />
                        <datalist id="jobSources">
                            <option value="LinkedIn"/>
                            <option value="Company Website"/>
                            <option value="Indeed"/>
                            <option value="Glassdoor"/>
                            <option value="Dice"/>
                            <option value="ZipRecruiter"/>
                            <option value="AngelList"/>
                            <option value="Stack Overflow Jobs"/>
                            <option value="Referral"/>
                        </datalist>
                        {errors.jobSource && (
                            <p className="form-error">
                                ⚠️ {errors.jobSource.message}
                            </p>
                        )}
                    </div>
                </div>

                {/* 🔧 FIXED: Row 3 - Job URL with Enhanced Responsive Design */}
                <div className="space-y-3">
                    <label className="form-label-enhanced">
                        Job Posting URL
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="url"
                            {...register('jobUrl')}
                            className="form-input-enhanced flex-1 focus:border-purple-500 focus:ring-purple-500/20"
                            placeholder="https://company.com/jobs/position"
                            inputMode="url"
                        />
                        {jobUrl && jobUrl.trim() !== '' && (
                            <button
                                type="button"
                                onClick={() => window.open(jobUrl, '_blank')}
                                className="btn btn-secondary w-full sm:w-auto form-btn hover:scale-105 transition-all duration-200 font-bold tracking-wide"
                                title="Open job posting"
                            >
                                <ExternalLink className="h-4 w-4 mr-2 sm:mr-0"/>
                                <span className="sm:hidden">Open Link</span>
                            </button>
                        )}
                    </div>
                    {errors.jobUrl && (
                        <p className="form-error">
                            ⚠️ {errors.jobUrl.message}
                        </p>
                    )}
                </div>

                {/* 🔧 MASSIVELY ENHANCED: Notes Section with Better Proportions */}
                <div className="space-y-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-700/30">
                    <div className="flex items-center justify-between">
                        <label className="form-label-enhanced text-lg font-bold text-blue-900 dark:text-blue-100 mb-0">
                            📝 Notes
                        </label>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {notesValue.length} / 2000 characters
                        </div>
                    </div>

                    <div className="relative">
                        <textarea
                            {...register('notes')}
                            rows={10} // 🔧 INCREASED: More visible area
                            className={`
                                w-full px-6 py-4 text-base font-medium 
                                bg-white/90 dark:bg-gray-800/90 
                                border-2 border-blue-200 dark:border-blue-700 
                                rounded-xl 
                                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 
                                transition-all duration-300 
                                resize-y 
                                min-h-[320px] max-h-[600px]
                                placeholder:text-gray-500 dark:placeholder:text-gray-400
                                backdrop-blur-sm
                                shadow-sm hover:shadow-md focus:shadow-lg
                                leading-relaxed
                                ${errors.notes ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
                            `} // 🔧 ENHANCED: min-height increased to 320px, better line-height
                            placeholder="Add any additional notes about this application...

• Interview details and feedback
• Salary negotiation notes
• Follow-up reminders and dates
• Contact information
• Company culture insights
• Technical requirements discussed
• Next steps and action items

Feel free to include any relevant information that will help you track this opportunity!"
                            style={{
                                lineHeight: '1.7', // 🔧 Enhanced readability
                                fontSize: '16px',   // 🔧 Consistent size
                                fontFamily: 'var(--font-family-primary)' // 🔧 Consistent font
                            }}
                            maxLength={2000}
                        />

                        {/* 🔧 ENHANCED: Character count with better progress indicator */}
                        <div className="absolute bottom-4 right-4 flex items-center gap-3">
                            {/* Progress indicator */}
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${
                                            notesValue.length > 1800 ? 'bg-red-500' :
                                                notesValue.length > 1500 ? 'bg-yellow-500' :
                                                    'bg-blue-500'
                                        }`}
                                        style={{width: `${(notesValue.length / 2000) * 100}%`}}
                                    />
                                </div>
                            </div>

                            {/* Character count badge */}
                            <div className={`
                                px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm border
                                ${notesValue.length > 1800
                                ? 'bg-red-100/90 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700'
                                : notesValue.length > 1500
                                    ? 'bg-yellow-100/90 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700'
                                    : 'bg-blue-100/90 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700'
                            }
                            `}>
                                {notesValue.length} / 2000
                            </div>
                        </div>
                    </div>

                    {errors.notes && (
                        <p className="form-error mt-2">
                            ⚠️ {errors.notes.message}
                        </p>
                    )}
                </div>

                {/* 🔧 FIXED: Row 5 - Attachments with Enhanced Mobile Design */}
                <div className="space-y-4">
                    <label className="form-label-enhanced">
                        Resume & Documents
                    </label>

                    {/* Existing attachments - Enhanced Mobile Stack */}
                    {attachments.length > 0 && (
                        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4 mb-4">
                            {attachments.map((attachment, index) => (
                                <div
                                    key={attachment.id || index}
                                    className="glass rounded-xl p-4 hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300 group border border-gray-200/50 dark:border-gray-700/50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div
                                                className="glass rounded-lg p-2 flex-shrink-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
                                                <Upload className="h-4 w-4 text-purple-600 dark:text-purple-400"/>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate tracking-tight">
                                                    {attachment.name}
                                                </p>
                                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 tracking-wider">
                                                    {(attachment.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeAttachment(index)}
                                            className="opacity-70 sm:opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200 p-2 flex-shrink-0 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Remove attachment"
                                        >
                                            <X className="h-4 w-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* 🔧 ENHANCED: Drop zone with better mobile design */}
                    <div
                        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 ${
                            isDragOver
                                ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 scale-[1.02]'
                                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 dark:hover:from-gray-800/50 dark:hover:to-blue-900/20'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex justify-center">
                                <div className="glass rounded-full p-3 sm:p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                                    <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 dark:text-blue-400"/>
                                </div>
                            </div>

                            <div>
                                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-tight">
                                    <span className="hidden sm:inline">Drop files here, or </span>
                                    <label className="text-primary-600 hover:text-primary-700 cursor-pointer font-extrabold text-gradient-blue underline decoration-primary-500/30 hover:decoration-primary-500 transition-all duration-200 tracking-tight">
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
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide">
                                    <span className="hidden sm:inline">Supports PDF, DOC, DOCX, TXT, JPG, PNG (max 10MB each)</span>
                                    <span className="sm:hidden">PDF, DOC, JPG, PNG • Max 10MB</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 🔧 ENHANCED: Submit Button with Better Styling */}
                <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary form-btn w-full sm:w-auto group relative overflow-hidden font-bold tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                <span className="hidden sm:inline font-bold tracking-wide">Adding Application...</span>
                                <span className="sm:hidden font-bold">Adding...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300"/>
                                <span className="hidden sm:inline font-bold tracking-wide">Add Application</span>
                                <span className="sm:hidden font-bold">Add Application</span>
                                <Sparkles className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300"/>
                            </>
                        )}
                    </button>
                </div>
            </form>


        </div>
    );
};

export default ApplicationForm;