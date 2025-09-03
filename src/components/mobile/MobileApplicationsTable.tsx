import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Calendar, 
  MapPin, 
  DollarSign,
  FileText,
  MessageSquare,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Edit,
  Check,
  X,
  Copy,
  Download,
  Eye
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Application, Attachment } from '../../types';
import { Modal } from '../ui/Modal';



// Notes Modal Content Component
interface NotesModalContentProps {
  application: Application;
  onSaveNotes?: (notes: string) => Promise<void>;
}

const NotesModalContent: React.FC<NotesModalContentProps> = ({ application, onSaveNotes }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  const handleCopy = async () => {
    if (!application?.notes) return;

    try {
      await navigator.clipboard.writeText(application.notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy notes:', error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = application.notes;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackError) {
        console.error('Fallback copy also failed:', fallbackError);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedNotes(application?.notes || '');
  };

  const handleSave = async () => {
    if (onSaveNotes) {
      try {
        await onSaveNotes(editedNotes);
        setIsEditing(false);
      } catch (error) {
        console.error('Failed to save notes:', error);
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedNotes(application?.notes || '');
  };

  const hasNotes = application.notes && application.notes.trim();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
            Notes for {application.company}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
              >
                <Check className="h-3 w-3"/>
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <X className="h-3 w-3"/>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50"
              >
                <Edit className="h-3 w-3"/>
                Edit
              </button>
              {hasNotes && (
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    copied
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3"/>
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3"/>
                      Copy
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editedNotes}
            onChange={(e) => setEditedNotes(e.target.value)}
            placeholder="Enter your notes here..."
            className="w-full h-32 p-3 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            You can use markdown formatting for better organization.
          </p>
        </div>
      ) : hasNotes ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <div className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap font-medium">
              {application.notes}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <FileText className="h-8 w-8 text-gray-400"/>
          </div>
          <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            No notes yet
          </h5>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            No notes have been added for this application. You can add notes by editing the application.
          </p>
        </div>
      )}
    </div>
  );
};

// Resume Modal Content Component
interface ResumeModalContentProps {
  application: Application;
}

const ResumeModalContent: React.FC<ResumeModalContentProps> = ({ application }) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);



  const handleDownload = async (attachment: Attachment) => {
    try {
      setDownloadingId(attachment.id || attachment.name);
      
      if (attachment.storagePath) {
        // For cloud-stored attachments, we'd need to get a signed URL
        alert('Cloud-stored attachments download is not yet implemented in this view.');
        setDownloadingId(null);
        return;
      }
      
      if (attachment.data) {
        // If we already stored a Blob URL (blob:…), download directly
        if (attachment.data.startsWith('blob:')) {
          const link = document.createElement('a');
          link.href = attachment.data;
          link.download = attachment.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setDownloadingId(null);
          return;
        }

        // For data URLs, convert to blob and download
        const res = await fetch(attachment.data);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = attachment.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setDownloadingId(null);
        return;
      }
      
      alert('No file available to download.');
      setDownloadingId(null);
    } catch (error) {
      console.error('Failed to download attachment:', error);
      alert('Unable to download this attachment. Please try again.');
      setDownloadingId(null);
    }
  };

  const handleView = async (attachment: Attachment) => {
    try {
      if (attachment.storagePath) {
        // For cloud-stored attachments, we'd need to get a signed URL
        // For now, show a message that this needs to be implemented
        alert('Cloud-stored attachments viewing is not yet implemented in this view.');
        return;
      }
      
      if (attachment.data) {
        // If we already stored a Blob URL (blob:…), open directly
        if (attachment.data.startsWith('blob:')) {
          window.open(attachment.data, '_blank', 'noopener,noreferrer');
          return;
        }

        // For data URLs, convert to blob URL
        const res = await fetch(attachment.data);
        const blob = await res.blob();
        const objUrl = URL.createObjectURL(blob);
        window.open(objUrl, '_blank', 'noopener,noreferrer');
        // revoke after a minute to give the new tab time to load
        setTimeout(() => URL.revokeObjectURL(objUrl), 60000);
        return;
      }
      
      alert('No file available to view.');
    } catch (error) {
      console.error('Failed to view attachment:', error);
      alert('Unable to view this attachment. Please try downloading it instead.');
    }
  };

  const resumeAttachments = application.attachments?.filter(att => 
    att.type.toLowerCase().includes('pdf') || 
    att.name.toLowerCase().includes('resume') ||
    att.name.toLowerCase().includes('cv')
  ) || [];

  const otherAttachments = application.attachments?.filter(att => 
    !att.type.toLowerCase().includes('pdf') && 
    !att.name.toLowerCase().includes('resume') &&
    !att.name.toLowerCase().includes('cv')
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Paperclip className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Attachments for {application.company}
        </h4>
      </div>

      {application.attachments && application.attachments.length > 0 ? (
        <div className="space-y-4">
          {/* Resume Section */}
          {resumeAttachments.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Resume & CV
              </h5>
              <div className="space-y-3">
                {resumeAttachments.map((attachment, index) => (
                  <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3 mb-3">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {attachment.type} • {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleView(attachment)}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 flex-1"
                      >
                        <Eye className="h-4 w-4"/>
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(attachment)}
                        disabled={downloadingId === (attachment.id || attachment.name)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex-1 ${
                          downloadingId === (attachment.id || attachment.name)
                            ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        }`}
                      >
                        {downloadingId === (attachment.id || attachment.name) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4"/>
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Other Attachments Section */}
          {otherAttachments.length > 0 && (
            <div>
              <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Other Documents
              </h5>
              <div className="space-y-3">
                {otherAttachments.map((attachment, index) => (
                  <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-3 mb-3">
                      <FileText className="h-5 w-5 text-gray-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words">
                          {attachment.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {attachment.type} • {(attachment.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => handleView(attachment)}
                        className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 flex-1"
                      >
                        <Eye className="h-4 w-4"/>
                        View
                      </button>
                      <button
                        onClick={() => handleDownload(attachment)}
                        disabled={downloadingId === (attachment.id || attachment.name)}
                        className={`flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 flex-1 ${
                          downloadingId === (attachment.id || attachment.name)
                            ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
                            : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
                        }`}
                      >
                        {downloadingId === (attachment.id || attachment.name) ? (
                          <>
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
                            Downloading...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4"/>
                            Download
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Paperclip className="h-8 w-8 text-gray-400"/>
          </div>
          <h5 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
            No resume attached
          </h5>
          <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            No resume or attachments have been added for this application. You can add attachments by
            editing the application.
          </p>
        </div>
      )}
    </div>
  );
};

// Mobile Edit Modal Content Component
interface MobileEditModalContentProps {
  application: Application;
  onSave: (updates: Partial<Application>) => Promise<void>;
}

const MobileEditModalContent: React.FC<MobileEditModalContentProps> = ({ application, onSave }) => {
  const [editedData, setEditedData] = useState<Partial<Application>>({
    company: application.company,
    position: application.position,
    location: application.location || '',
    salary: application.salary || '',
    type: application.type,
    status: application.status,
    jobSource: application.jobSource || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(editedData);
    } catch (error) {
      console.error('Failed to save application:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof Application, value: string) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Edit className="h-5 w-5 text-blue-600 dark:text-blue-400"/>
        <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
          Edit Application
        </h4>
      </div>

      <div className="space-y-4">
        {/* Company */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Company *
          </label>
          <input
            type="text"
            value={editedData.company || ''}
            onChange={(e) => handleInputChange('company', e.target.value)}
            placeholder="Enter company name"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Position *
          </label>
          <input
            type="text"
            value={editedData.position || ''}
            onChange={(e) => handleInputChange('position', e.target.value)}
            placeholder="Enter job position"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Type *
          </label>
          <select
            value={editedData.type || 'Full-time'}
            onChange={(e) => handleInputChange('type', e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="Full-time">Full-time</option>
            <option value="Contract">Contract</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status *
          </label>
          <select
            value={editedData.status || 'Applied'}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Offer">Offer</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Location
          </label>
          <input
            type="text"
            value={editedData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter job location"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Salary */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Salary
          </label>
          <input
            type="text"
            value={editedData.salary || ''}
            onChange={(e) => handleInputChange('salary', e.target.value)}
            placeholder="Enter salary range"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Job Source */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Job Source
          </label>
          <input
            type="text"
            value={editedData.jobSource || ''}
            onChange={(e) => handleInputChange('jobSource', e.target.value)}
            placeholder="e.g., LinkedIn, Indeed, Company Website"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={isSaving || !editedData.company || !editedData.position}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
            isSaving || !editedData.company || !editedData.position
              ? "bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500 cursor-not-allowed"
              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"/>
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4"/>
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

const MobileApplicationsTable: React.FC = () => {
  const { 
    filteredApplications, 
    deleteApplication, 
    updateApplication
  } = useAppStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [notesModal, setNotesModal] = useState<{ isOpen: boolean; application: Application | null }>({
    isOpen: false,
    application: null
  });
  
  const [resumeModal, setResumeModal] = useState<{ isOpen: boolean; application: Application | null }>({
    isOpen: false,
    application: null
  });
  
  const [editModal, setEditModal] = useState<{ isOpen: boolean; application: Application | null }>({
    isOpen: false,
    application: null
  });
  
  // Pagination settings
  const ITEMS_PER_PAGE = 7; // Smaller page size for mobile

  // Use applications directly - modern React can handle large datasets
  const safeApplications = filteredApplications;

  // Filter and sort applications
  const processedApplications = useMemo(() => {
    let filtered = safeApplications;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (app.location && app.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter === 'rejected') {
      filtered = filtered.filter(app => app.status === 'Rejected');
    } else if (statusFilter === 'applied') {
      filtered = filtered.filter(app => app.status !== 'Rejected');
    } else if (!statusFilter) {
      // No status filter selected - show no applications
      filtered = [];
    }

    // Apply sorting - newest first
    filtered.sort((a, b) => {
      return new Date(b.dateApplied).getTime() - new Date(a.dateApplied).getTime();
    });

    return filtered;
  }, [safeApplications, searchTerm, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(processedApplications.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedApplications = processedApplications.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    const baseClasses = 'mobile-status-badge';
    switch (status) {
      case 'Applied':
        return `${baseClasses} mobile-status-applied`;
      case 'Interview':
        return `${baseClasses} mobile-status-interview`;
      case 'Offer':
        return `${baseClasses} mobile-status-offer`;
      case 'Rejected':
        return `${baseClasses} mobile-status-rejected`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const handleDelete = async (id: string, company: string) => {
    if (window.confirm(`Are you sure you want to delete the application for ${company}?`)) {
      try {
        await deleteApplication(id);
      } catch (error) {
        console.error('Failed to delete application:', error);
      }
    }
  };





  // Modal handlers
  const handleNotesClick = (app: Application) => {
    setNotesModal({ isOpen: true, application: app });
  };

  const handleResumeClick = (app: Application) => {
    setResumeModal({ isOpen: true, application: app });
  };

  const closeNotesModal = () => {
    setNotesModal({ isOpen: false, application: null });
  };

  const closeResumeModal = () => {
    setResumeModal({ isOpen: false, application: null });
  };

  const handleEditClick = (app: Application) => {
    setEditModal({ isOpen: true, application: app });
  };

  const closeEditModal = () => {
    setEditModal({ isOpen: false, application: null });
  };

  return (
    <div className="mobile-space-y-4">
      {/* Search and Filters */}
      <div className="card">
        <div className="mobile-space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mobile-form-input"
            />
          </div>

          {/* Status Tabs */}
          <div className="mobile-status-tabs">
            <button
              onClick={() => setStatusFilter('applied')}
              className={`mobile-status-tab ${statusFilter === 'applied' ? 'active' : ''}`}
            >
              Applied ({filteredApplications.filter(app => app.status !== 'Rejected').length})
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`mobile-status-tab ${statusFilter === 'rejected' ? 'active' : ''}`}
            >
              Rejected ({filteredApplications.filter(app => app.status === 'Rejected').length})
            </button>
          </div>
        </div>
      </div>

      {/* Applications List or Empty State */}
      {processedApplications.length === 0 ? (
        <div className="mobile-empty-state">
          <div className="mobile-empty-state-icon">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="mobile-empty-state-title">
            {!statusFilter 
              ? 'Select a tab to view applications'
              : searchTerm 
              ? 'No matching applications' 
              : `No ${statusFilter} applications`
            }
          </h3>
          <p className="mobile-empty-state-description">
            {!statusFilter
              ? 'Choose "Applied" to see your active applications or "Rejected" to see rejected ones.'
              : searchTerm 
              ? 'Try adjusting your search criteria'
              : statusFilter === 'rejected'
              ? 'Rejected applications will appear here when you mark them as rejected.'
              : 'Add your first job application to get started!'
            }
          </p>
        </div>
      ) : (
        <div className="mobile-space-y-3">
          {paginatedApplications.map((app) => (
          <div key={app.id} className="mobile-app-card">
            {/* Header */}
            <div className="mobile-app-header">
              <div className="mobile-app-title-section">
                <h3 className="mobile-app-company">{app.company}</h3>
                <p className="mobile-app-position">{app.position}</p>
              </div>
              <div className="mobile-app-actions">
                <span className={getStatusBadge(app.status)}>
                  {app.status}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="mobile-app-details">
              <div className="mobile-detail-row">
                <span className="mobile-detail-label">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Applied
                </span>
                <span className="mobile-detail-value">{formatDate(app.dateApplied)}</span>
              </div>

              {app.type && (
                <div className="mobile-detail-row">
                  <span className="mobile-detail-label">Type</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold tracking-wide uppercase whitespace-nowrap ${
                    app.type === 'Remote' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border border-green-200 dark:border-green-700' :
                      app.type === 'Onsite' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-700' :
                        app.type === 'Hybrid' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-700' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600'
                  }`}>
                    {app.type}
                  </span>
                </div>
              )}

              {app.location && (
                <div className="mobile-detail-row">
                  <span className="mobile-detail-label">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Location
                  </span>
                  <span className="mobile-detail-value">{app.location}</span>
                </div>
              )}

              {app.salary && (
                <div className="mobile-detail-row">
                  <span className="mobile-detail-label">
                    <DollarSign className="h-4 w-4 inline mr-1" />
                    Salary
                  </span>
                  <span className="mobile-detail-value">{app.salary}</span>
                </div>
              )}

              {app.jobSource && (
                <div className="mobile-detail-row">
                  <span className="mobile-detail-label">Source</span>
                  <span className="mobile-detail-value">{app.jobSource}</span>
                </div>
              )}
            </div>

            {/* Notes & Attachments */}
            <div className="mobile-app-notes-attachments">
              <div className="mobile-notes-section">
                <div className="mobile-notes-header">
                  <MessageSquare className="h-4 w-4" />
                  <span>Notes</span>
                  <button
                    onClick={() => handleNotesClick(app)}
                    className="mobile-notes-btn"
                    aria-label="Edit notes"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                </div>
                <div className="mobile-notes-content">
                  {app.notes ? (
                    <p className="mobile-notes-text">{app.notes}</p>
                  ) : (
                    <p className="mobile-notes-empty">No notes</p>
                  )}
                </div>
              </div>

              <div className="mobile-attachments-section">
                <div className="mobile-attachments-header">
                  <Paperclip className="h-4 w-4" />
                  <span>Attachments</span>
                  {app.attachments && app.attachments.length > 0 && (
                    <button
                      onClick={() => handleResumeClick(app)}
                      className="mobile-attachments-btn"
                      aria-label="View attachments"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="mobile-attachments-content">
                  {app.attachments && app.attachments.length > 0 ? (
                    <span className="mobile-attachments-count">
                      {app.attachments.length} file{app.attachments.length > 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="mobile-attachments-empty">No attachments</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mobile-app-actions">
              <div className="mobile-action-buttons">
                <button
                  onClick={() => handleEditClick(app)}
                  className="mobile-action-btn mobile-btn-edit"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                
                <button
                  onClick={() => handleDelete(app.id, app.company)}
                  className="mobile-action-btn mobile-btn-danger"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Simple Mobile Pagination */}
      {totalPages > 1 && (
        <div className="simple-pagination">
          <div className="pagination-info">
            <span className="pagination-text">
              {startIndex + 1}-{Math.min(endIndex, processedApplications.length)} of {processedApplications.length}
            </span>
          </div>
          
          <div className="pagination-controls">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="pagination-btn prev-btn"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="pagination-center">
              <span className="pagination-current">
                {currentPage} / {totalPages}
              </span>
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="pagination-btn next-btn"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}



      {/* Notes Modal */}
      <Modal
        isOpen={notesModal.isOpen}
        onClose={closeNotesModal}
        title="Application Notes"
        size="lg"
        variant="primary"
        className="notes-modal"
      >
        {notesModal.application && (
          <NotesModalContent 
            application={notesModal.application}
            onSaveNotes={async (notes: string) => {
              try {
                await updateApplication(notesModal.application!.id, { notes });
              } catch (error) {
                console.error('Failed to save notes:', error);
              }
            }}
          />
        )}
      </Modal>

      {/* Attachments Modal */}
      <Modal
        isOpen={resumeModal.isOpen}
        onClose={closeResumeModal}
        title="Attachments"
        size="lg"
        variant="primary"
        className="resume-modal"
      >
        {resumeModal.application && (
          <ResumeModalContent 
            application={resumeModal.application}
          />
        )}
      </Modal>

      {/* Edit Application Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        title="Edit Application"
        size="lg"
        variant="primary"
        className="edit-modal"
      >
        {editModal.application && (
          <MobileEditModalContent 
            application={editModal.application}
            onSave={async (updates: Partial<Application>) => {
              try {
                await updateApplication(editModal.application!.id, updates);
                closeEditModal();
              } catch (error) {
                console.error('Failed to update application:', error);
              }
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default MobileApplicationsTable;
