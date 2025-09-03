import React, { useState, useRef } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Plus, Upload, X, FileText } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Application, ApplicationFormData, Attachment } from '../../types';
import { applicationFormSchema } from '../../utils/validation';
import { uploadAttachment, deleteAttachment, getCurrentUserId } from '../../services/databaseService';

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

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface MobileApplicationFormProps {
  onSuccess?: () => void;
}

const MobileApplicationForm: React.FC<MobileApplicationFormProps> = ({ onSuccess }) => {
  const { addApplication, showToast, applications, auth } = useAppStore();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tempApplicationId] = useState(() => `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`);

  // Get today's date in user's local timezone
  const getTodayLocalDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ApplicationFormData>({
    resolver: yupResolver(applicationFormSchema as any),
    defaultValues: {
      company: '',
      position: '',
      dateApplied: getTodayLocalDate(),
      type: 'Remote',
      employmentType: 'Full-time',
      location: '',
      salary: '',
      jobSource: '',
      jobUrl: '',
      notes: ''
    }
  });

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        showToast({
          type: 'error',
          message: `File type ${file.type} is not supported`,
          duration: 3000
        });
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast({
          type: 'error',
          message: `File ${file.name} is too large (max 50MB)`,
          duration: 3000
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    try {
      const userId = await getCurrentUserId();
      const uploadPromises = validFiles.map(async (file, index) => {
        const uploadedAttachment = await uploadAttachment(userId || 0, file, tempApplicationId, index);
        return uploadedAttachment;
      });

      const uploadedAttachments = await Promise.all(uploadPromises);
      setAttachments(prev => [...prev, ...uploadedAttachments]);

      showToast({
        type: 'success',
        message: `${uploadedAttachments.length} file${uploadedAttachments.length > 1 ? 's' : ''} uploaded successfully!`,
        duration: 3000
      });
    } catch (error) {
      console.error('File upload error:', error);
      showToast({
        type: 'error',
        message: 'Failed to upload files',
        duration: 3000
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const removeAttachment = async (attachmentId: string) => {
    try {
      await deleteAttachment(attachmentId);
      setAttachments(prev => prev.filter(att => att.id !== attachmentId));
      showToast({
        type: 'success',
        message: 'File removed successfully',
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to remove attachment:', error);
      showToast({
        type: 'error',
        message: 'Failed to remove file',
        duration: 3000
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const onSubmit: SubmitHandler<ApplicationFormData> = async (data) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      // Check free tier limit for unauthenticated users
      if (!auth.isAuthenticated && applications.length >= 50) {
        showToast({
          type: 'error',
          message: 'Free tier limit reached. Please sign up to add more applications.',
          duration: 5000
        });
        return;
      }

      const applicationData: Omit<Application, 'id' | 'createdAt' | 'updatedAt'> = {
        company: data.company,
        position: data.position,
        dateApplied: data.dateApplied,
        type: data.type,
        employmentType: data.employmentType,
        status: 'Applied' as const,
        ...(data.location && { location: data.location }),
        ...(data.salary && { salary: data.salary }),
        ...(data.jobSource && { jobSource: data.jobSource }),
        ...(data.jobUrl && { jobUrl: data.jobUrl }),
        ...(data.notes && { notes: data.notes }),
        attachments: attachments.length > 0 ? attachments : []
      };

      await addApplication(applicationData);
      
      // Reset form
      reset();
      setAttachments([]);
      
      // Success toast is handled by the main store addApplication function
      onSuccess?.();
    } catch (error) {
      console.error('Failed to add application:', error);
      showToast({
        type: 'error',
        message: 'Failed to add application. Please try again.',
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit as any)} className="mobile-space-y-6">
      {/* Company and Position */}
      <div className="mobile-grid-2">
        <div className="mobile-form-group">
          <label className="mobile-form-label">Company *</label>
          <input
            {...register('company')}
            className="mobile-form-input"
            placeholder="e.g., Google"
          />
          {errors.company && (
            <p className="mobile-text-sm text-red-600 mt-1">{errors.company.message}</p>
          )}
        </div>

        <div className="mobile-form-group">
          <label className="mobile-form-label">Position *</label>
          <input
            {...register('position')}
            className="mobile-form-input"
            placeholder="e.g., Software Engineer"
          />
          {errors.position && (
            <p className="mobile-text-sm text-red-600 mt-1">{errors.position.message}</p>
          )}
        </div>
      </div>

      {/* Date Applied and Job Type */}
      <div className="mobile-grid-2">
        <div className="mobile-form-group">
          <label className="mobile-form-label">Date Applied *</label>
          <input
            {...register('dateApplied')}
            type="date"
            className="mobile-form-input"
          />
          {errors.dateApplied && (
            <p className="mobile-text-sm text-red-600 mt-1">{errors.dateApplied.message}</p>
          )}
        </div>

        <div className="mobile-form-group">
          <label className="mobile-form-label">Job Type</label>
          <select {...register('type')} className="mobile-form-select">
            <option value="Remote">Remote</option>
            <option value="Onsite">Onsite</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      {/* Employment Type */}
      <div className="mobile-form-group">
        <label className="mobile-form-label">Employment Type</label>
        <select {...register('employmentType')} className="mobile-form-select">
          <option value="Full-time">Full-time</option>
          <option value="Contract">Contract</option>
          <option value="Part-time">Part-time</option>
          <option value="Internship">Internship</option>
        </select>
      </div>

      {/* Location and Salary */}
      <div className="mobile-grid-2">
        <div className="mobile-form-group">
          <label className="mobile-form-label">Location</label>
          <input
            {...register('location')}
            className="mobile-form-input"
            placeholder="e.g., San Francisco, CA"
          />
        </div>

        <div className="mobile-form-group">
          <label className="mobile-form-label">Salary</label>
          <input
            {...register('salary')}
            className="mobile-form-input"
            placeholder="e.g., $120,000"
          />
        </div>
      </div>

      {/* Job Source and URL */}
      <div className="mobile-form-group">
        <label className="mobile-form-label">Job Source</label>
        <select {...register('jobSource')} className="mobile-form-select">
          <option value="">Select source</option>
          {JOB_SOURCES.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>
      </div>

      <div className="mobile-form-group">
        <label className="mobile-form-label">Job URL</label>
        <input
          {...register('jobUrl')}
          type="url"
          className="mobile-form-input"
          placeholder="https://company.com/job-posting"
        />
        {errors.jobUrl && (
          <p className="mobile-text-sm text-red-600 mt-1">{errors.jobUrl.message}</p>
        )}
      </div>

      {/* Notes */}
      <div className="mobile-form-group">
        <label className="mobile-form-label">Notes</label>
        <textarea
          {...register('notes')}
          className="mobile-form-textarea"
          placeholder="Add any notes about this application..."
          rows={4}
        />
        {errors.notes && (
          <p className="mobile-text-sm text-red-600 mt-1">{errors.notes.message}</p>
        )}
      </div>

      {/* File Upload */}
      <div className="mobile-form-group">
        <label className="mobile-form-label">Attachments</label>
        
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="mobile-text-sm text-gray-600 dark:text-gray-400 mb-2">
            Drag and drop files here, or click to browse
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-secondary mobile-text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
            accept={ALLOWED_FILE_TYPES.join(',')}
          />
          <p className="mobile-text-xs text-gray-500 mt-2">
            PDF, DOC, DOCX, TXT, JPG, PNG, GIF, WEBP (max 50MB each)
          </p>
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="mt-4 mobile-space-y-2">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="mobile-flex mobile-items-center mobile-justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="mobile-flex mobile-items-center mobile-gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="mobile-text-sm mobile-font-medium text-gray-900 dark:text-gray-100">
                      {attachment.name}
                    </p>
                    <p className="mobile-text-xs text-gray-500">
                      {formatFileSize(attachment.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachment.id || '')}
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="mobile-form-group">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn btn-primary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="mobile-spinner" />
              Adding...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Add Application
            </>
          )}
        </button>
      </div>


    </form>
  );
};

export default MobileApplicationForm;
