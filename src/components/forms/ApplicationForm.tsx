// src/components/forms/ApplicationForm.tsx
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {SubmitHandler, useForm} from 'react-hook-form';
import {yupResolver} from '@hookform/resolvers/yup';
import {ExternalLink, Plus, Sparkles, Upload, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';
import {ApplicationFormData, Attachment} from '../../types';
import {applicationFormSchema} from '../../utils/validation';

// Constants
const FORM_STORAGE_KEY = 'applytrak_draft_application';
const ATTACHMENTS_STORAGE_KEY = 'applytrak_draft_attachments';
const AUTO_SAVE_DELAY = 2000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_NOTES_LENGTH = 2000;

const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png'
];

const JOB_SOURCES = [
    'LinkedIn',
    'Company Website',
    'Indeed',
    'Glassdoor',
    'Dice',
    'ZipRecruiter',
    'AngelList',
    'Stack Overflow Jobs',
    'Referral'
];

const ApplicationForm: React.FC = () => {
    const {addApplication, showToast} = useAppStore();
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isDraftLoaded, setIsDraftLoaded] = useState(false);

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Helper function to get today's date in user's local timezone
    const getTodayLocalDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Get today's date once and reuse it
    const todayLocal = getTodayLocalDate();

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        getValues,
        formState: {errors, isSubmitting}
    } = useForm<ApplicationFormData>({
        resolver: yupResolver(applicationFormSchema) as any,
        defaultValues: {
            company: '',
            position: '',
            dateApplied: todayLocal,
            type: 'Remote',
            location: '',
            salary: '',
            jobSource: '',
            jobUrl: '',
            notes: ''
        }
    });

    // Force the date input to use the correct value by setting it explicitly
    useEffect(() => {
        // Small delay to ensure DOM is ready, then force the correct date
        const timer = setTimeout(() => {
            setValue('dateApplied', todayLocal, {shouldValidate: false, shouldDirty: false});
        }, 100);

        return () => clearTimeout(timer);
    }, [setValue, todayLocal]);

    const watchedValues = watch();
    const jobUrl = watch('jobUrl');
    const notesValue = watch('notes') || '';

    // Load draft data on mount
    useEffect(() => {
        const loadDraft = () => {
            try {
                const savedFormData = localStorage.getItem(FORM_STORAGE_KEY);
                if (savedFormData) {
                    const parsedData = JSON.parse(savedFormData);

                    Object.keys(parsedData).forEach(key => {
                        if (parsedData[key] !== undefined && parsedData[key] !== '') {
                            setValue(key as keyof ApplicationFormData, parsedData[key], { shouldDirty: true });
                        }
                    });

                    setLastSaved(new Date(parsedData._savedAt || Date.now()));
                }

                const savedAttachments = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
                if (savedAttachments) {
                    const parsedAttachments = JSON.parse(savedAttachments);
                    setAttachments(parsedAttachments);
                }

                setIsDraftLoaded(true);

                if (savedFormData || savedAttachments) {
                    showToast({
                        type: 'info',
                        message: 'Draft application restored!',
                        duration: 3000
                    });
                }
            } catch (error) {
                console.error('Error loading draft:', error);
                setIsDraftLoaded(true);
            }
        };

        loadDraft();
    }, [setValue, showToast]);

    // Auto-save functionality
    const saveDraft = useCallback(() => {
        if (!isDraftLoaded) return;

        try {
            const currentValues = getValues();
            const hasData = Object.values(currentValues).some(value =>
                value && value.toString().trim() !== '' &&
                value !== todayLocal // Use cached local date
            ) || attachments.length > 0;

            if (hasData) {
                const dataToSave = {
                    ...currentValues,
                    _savedAt: new Date().toISOString()
                };

                localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(dataToSave));

                if (attachments.length > 0) {
                    localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(attachments));
                } else {
                    localStorage.removeItem(ATTACHMENTS_STORAGE_KEY);
                }

                setLastSaved(new Date());
            }
        } catch (error) {
            console.error('Error saving draft:', error);
        }
    }, [getValues, attachments, isDraftLoaded]);

    // Auto-save on form changes
    useEffect(() => {
        if (!isDraftLoaded) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            saveDraft();
        }, AUTO_SAVE_DELAY);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [watchedValues, attachments, saveDraft, isDraftLoaded]);

    const clearDraft = useCallback(() => {
        try {
            localStorage.removeItem(FORM_STORAGE_KEY);
            localStorage.removeItem(ATTACHMENTS_STORAGE_KEY);
            setLastSaved(null);
        } catch (error) {
            console.error('Error clearing draft:', error);
        }
    }, []);

    const manualSave = useCallback(() => {
        saveDraft();
        showToast({
            type: 'success',
            message: 'Draft saved successfully!',
            duration: 2000
        });
    }, [saveDraft, showToast]);

    const validateFile = (file: File): boolean => {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            showToast({
                type: 'error',
                message: `File type not allowed: ${file.name}. Use PDF, DOC, DOCX, TXT, JPG, or PNG.`
            });
            return false;
        }

        if (file.size > MAX_FILE_SIZE) {
            showToast({
                type: 'error',
                message: `File too large: ${file.name}. Maximum size is 10MB.`
            });
            return false;
        }

        return true;
    };

    const processFile = (file: File, fileIndex: number): Promise<Attachment> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const result = e.target?.result;
                if (!result) {
                    reject(new Error('Failed to read file'));
                    return;
                }

                const attachment: Attachment = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${fileIndex}`,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: result as string,
                    uploadedAt: new Date().toISOString()
                };

                resolve(attachment);
            };

            reader.onerror = () => {
                reject(new Error(`Failed to read file: ${file.name}`));
            };

            reader.readAsDataURL(file);
        });
    };

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const validFiles = Array.from(files).filter(validateFile);
        if (validFiles.length === 0) return;

        try {
            const newAttachments = await Promise.all(
                validFiles.map((file, index) => processFile(file, index))
            );

            setAttachments(prev => [...prev, ...newAttachments]);

            showToast({
                type: 'success',
                message: `${newAttachments.length} file(s) attached successfully!`,
                duration: 2000
            });
        } catch (error) {
            console.error('Error processing files:', error);
            showToast({
                type: 'error',
                message: 'Failed to process some files. Please try again.'
            });
        }
    }, [showToast]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files);
        }
        e.target.value = '';
    }, [handleFileSelect]);

    const removeAttachment = useCallback((index: number) => {
        setAttachments(current => {
            if (index < 0 || index >= current.length) {
                console.error('Invalid attachment index:', index);
                return current;
            }
            return current.filter((_, i) => i !== index);
        });
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) {
            setIsDragOver(true);
        }
    }, [isDragOver]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const rect = e.currentTarget.getBoundingClientRect();
        const {clientX: x, clientY: y} = e;

        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const droppedFiles = e.dataTransfer.files;
        setIsDragOver(false);

        if (droppedFiles.length > 0) {
            handleFileSelect(droppedFiles);
        }
    }, [handleFileSelect]);

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

            clearDraft();

            reset({
                company: '',
                position: '',
                dateApplied: todayLocal,
                type: 'Remote',
                location: '',
                salary: '',
                jobSource: '',
                jobUrl: '',
                notes: ''
            });

            setAttachments([]);

            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

        } catch (error) {
            console.error('Error submitting application:', error);
            showToast({
                type: 'error',
                message: 'Failed to add application. Please try again.'
            });
        }
    };

    const getCharacterCountStyle = (length: number) => {
        if (length > 1800) return 'bg-red-500';
        if (length > 1500) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    const getCharacterCountTextStyle = (length: number) => {
        if (length > 1800) {
            return 'bg-red-100/90 text-red-700 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700';
        }
        if (length > 1500) {
            return 'bg-yellow-100/90 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700';
        }
        return 'bg-blue-100/90 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700';
    };

    return (
        <div className="glass-card bg-gradient-to-br from-green-500/5 via-blue-500/5 to-purple-500/5 border-2 border-green-200/30 dark:border-green-700/30">
            {/* Header with Auto-Save Status */}
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

                {/* Auto-Save Status */}
                {lastSaved && (
                    <div
                        className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/>
                        Auto-saved at {lastSaved.toLocaleTimeString()}
                    </div>
                )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8">
                {/* Basic Information */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-6">
                    <div className="space-y-3">
                        <label className="form-label-enhanced">Company Name*</label>
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
                            <p className="form-error">⚠️ {errors.company.message}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">Position*</label>
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
                            <p className="form-error">⚠️ {errors.position.message}</p>
                        )}
                    </div>

                    <div className="space-y-3 sm:col-span-2 lg:col-span-1">
                        <label className="form-label-enhanced">Date Applied*</label>
                        <input
                            type="date"
                            {...register('dateApplied')}
                            className={`form-input-enhanced ${
                                errors.dateApplied
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                    : 'focus:border-purple-500 focus:ring-purple-500/20'
                            }`}
                            max={todayLocal}
                        />
                        {errors.dateApplied && (
                            <p className="form-error">⚠️ {errors.dateApplied.message}</p>
                        )}
                    </div>
                </div>

                {/* Job Details */}
                <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
                    <div className="space-y-3">
                        <label className="form-label-enhanced">Job Type*</label>
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
                            <p className="form-error">⚠️ {errors.type.message}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">Location</label>
                        <input
                            type="text"
                            {...register('location')}
                            className="form-input-enhanced focus:border-teal-500 focus:ring-teal-500/20"
                            placeholder="e.g. San Francisco, CA"
                        />
                        {errors.location && (
                            <p className="form-error">⚠️ {errors.location.message}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">Salary</label>
                        <input
                            type="text"
                            {...register('salary')}
                            className="form-input-enhanced focus:border-green-500 focus:ring-green-500/20"
                            placeholder="e.g. $120,000/year"
                            inputMode="numeric"
                        />
                        {errors.salary && (
                            <p className="form-error">⚠️ {errors.salary.message}</p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="form-label-enhanced">Job Source</label>
                        <input
                            type="text"
                            {...register('jobSource')}
                            list="jobSources"
                            className="form-input-enhanced focus:border-blue-500 focus:ring-blue-500/20"
                            placeholder="e.g. LinkedIn"
                        />
                        <datalist id="jobSources">
                            {JOB_SOURCES.map(source => (
                                <option key={source} value={source}/>
                            ))}
                        </datalist>
                        {errors.jobSource && (
                            <p className="form-error">⚠️ {errors.jobSource.message}</p>
                        )}
                    </div>
                </div>

                {/* Job URL */}
                <div className="space-y-3">
                    <label className="form-label-enhanced">Job Posting URL</label>
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
                        <p className="form-error">⚠️ {errors.jobUrl.message}</p>
                    )}
                </div>

                {/* Notes Section */}
                <div className="space-y-4 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border border-blue-200/30 dark:border-blue-700/30">
                    <div className="flex items-center justify-between">
                        <label className="form-label-enhanced text-lg font-bold text-blue-900 dark:text-blue-100 mb-0">
                            📝 Notes
                        </label>
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {notesValue.length} / {MAX_NOTES_LENGTH} characters
                        </div>
                    </div>

                    <div className="relative">
            <textarea
                {...register('notes')}
                rows={10}
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
              `}
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
                    lineHeight: '1.7',
                    fontSize: '16px',
                    fontFamily: 'var(--font-family-primary)'
                }}
                maxLength={MAX_NOTES_LENGTH}
            />

                        <div className="absolute bottom-4 right-4 flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-300 ${getCharacterCountStyle(notesValue.length)}`}
                                        style={{width: `${(notesValue.length / MAX_NOTES_LENGTH) * 100}%`}}
                                    />
                                </div>
                            </div>

                            <div className={`
                px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm border
                ${getCharacterCountTextStyle(notesValue.length)}
              `}>
                                {notesValue.length} / {MAX_NOTES_LENGTH}
                            </div>
                        </div>
                    </div>

                    {errors.notes && (
                        <p className="form-error mt-2">⚠️ {errors.notes.message}</p>
                    )}
                </div>

                {/* Attachments */}
                <div className="space-y-4">
                    <label className="form-label-enhanced">Resume & Documents</label>

                    {attachments.length > 0 && (
                        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-4 mb-4">
                            {attachments.map((attachment, index) => (
                                <div
                                    key={attachment.id || index}
                                    className="glass rounded-xl p-4 hover:bg-white/30 dark:hover:bg-black/30 transition-all duration-300 group border border-gray-200/50 dark:border-gray-700/50"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="glass rounded-lg p-2 flex-shrink-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
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

                    {/* Drop zone */}
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
                                            ref={fileInputRef}
                                            type="file"
                                            multiple
                                            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                                            onChange={handleFileInputChange}
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

                {/* Submit Button */}
                <div className="flex justify-end pt-4 sm:pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn btn-primary form-btn w-full sm:w-auto group relative overflow-hidden font-bold tracking-wide shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"/>
                                <span className="hidden sm:inline font-bold tracking-wide">Adding Application...</span>
                                <span className="sm:hidden font-bold">Adding...</span>
                            </>
                        ) : (
                            <>
                                <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300"/>
                                <span className="hidden sm:inline font-bold tracking-wide">Add Application</span>
                                <span className="sm:hidden font-bold">Add Application</span>
                                <Sparkles
                                    className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform duration-300"/>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ApplicationForm;