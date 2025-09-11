// src/utils/exportImport.ts - Production Ready Version
import {Application, ApplicationStatus, JobType, EmploymentType} from '../types';
import * as XLSX from 'xlsx';

// Types for better type safety
interface ExportMetadata {
    exportedAt: string;
    exportedBy: string;
    version: string;
    totalCount: number;
    format: string;
}

interface ExportSummary {
    totalApplications: number;
    statusBreakdown: Record<string, number>;
    jobTypeBreakdown: Record<string, number>;
    employmentTypeBreakdown: Record<string, number>;
}

interface ExportData {
    metadata: ExportMetadata;
    summary: ExportSummary;
    applications: Application[];
}

interface ImportResult {
    applications: Application[];
    warnings: string[];
    totalProcessed: number;
}

// Removed unused ValidationError interface

// Constants
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB
const VALID_STATUSES = ['Applied', 'Interview', 'Offer', 'Rejected'] as const;
const VALID_JOB_TYPES = ['Remote', 'Onsite', 'Hybrid'] as const;
const VALID_EMPLOYMENT_TYPES = ['Full-time', 'Contract', 'Part-time', 'Internship'] as const;

const CSV_COLUMN_MAPPING = {
    company: [
        'company', 'company name', 'employer', 'organization', 'firm', 
        'corporation', 'business', 'employer name', 'company name', 'corp',
        'employer', 'organization name', 'firm name', 'business name',
        'company', 'corp', 'inc', 'llc', 'ltd', 'enterprise'
    ],
    position: [
        'position', 'job title', 'title', 'role', 'job', 'position title',
        'job position', 'role title', 'job role', 'title', 'position name',
        'job title', 'role', 'job', 'position', 'title', 'job role',
        'job position', 'role title', 'position name', 'job name',
        'job description', 'role description', 'position description'
    ],
    dateApplied: [
        'date applied', 'application date', 'date', 'applied', 'date applied',
        'applied date', 'application date', 'date of application', 'apply date',
        'submission date', 'applied on', 'date', 'when applied', 'applied',
        'application date', 'date applied', 'submitted', 'submission date',
        'applied date', 'date of submission', 'when applied', 'apply date'
    ],
    status: [
        'status', 'application status', 'current status', 'job status',
        'application state', 'status', 'stage', 'phase', 'current stage',
        'application status', 'job status', 'status', 'stage', 'phase',
        'current status', 'application state', 'job state', 'status'
    ],
    type: [
        'type', 'job type', 'work type', 'worktype', 'work arrangement',
        'work model', 'employment type', 'work style', 'arrangement',
        'remote work', 'work location', 'location type', 'work type',
        'job type', 'type', 'work arrangement', 'work model', 'employment type',
        'work style', 'arrangement', 'remote work', 'work location', 'location type'
    ],
    employmentType: [
        'employment type', 'employment', 'job type', 'work type', 'type',
        'employment', 'employment type', 'job type', 'work type', 'type',
        'full time', 'full-time', 'part time', 'part-time', 'contract',
        'internship', 'temporary', 'permanent', 'freelance', 'consultant'
    ],
    location: [
        'location', 'city', 'address', 'place', 'work location',
        'job location', 'office location', 'city', 'state', 'country',
        'geographic location', 'workplace', 'office', 'location', 'city',
        'address', 'place', 'work location', 'job location', 'office location',
        'geographic location', 'workplace', 'office', 'state', 'country'
    ],
    salary: [
        'salary', 'compensation', 'pay', 'wage', 'income', 'remuneration',
        'package', 'total compensation', 'base salary', 'salary range',
        'compensation package', 'pay rate', 'wage', 'earnings', 'salary',
        'compensation', 'pay', 'wage', 'income', 'remuneration', 'package',
        'total compensation', 'base salary', 'salary range', 'compensation package',
        'pay rate', 'earnings', 'annual salary', 'hourly rate', 'bonus'
    ],
    jobSource: [
        'job source', 'source', 'found via', 'found through', 'discovered via',
        'application source', 'where found', 'job board', 'platform',
        'referral source', 'source of job', 'job site', 'recruitment source',
        'source', 'job source', 'found via', 'found through', 'discovered via',
        'application source', 'where found', 'job board', 'platform',
        'referral source', 'source of job', 'job site', 'recruitment source'
    ],
    jobUrl: [
        'job url', 'url', 'link', 'job link', 'application url',
        'job posting url', 'posting link', 'job posting link',
        'application link', 'job posting', 'posting url', 'link to job',
        'url', 'job url', 'link', 'job link', 'application url',
        'job posting url', 'posting link', 'job posting link',
        'application link', 'job posting', 'posting url', 'link to job'
    ],
    notes: [
        'notes', 'comments', 'description', 'job description', 'details',
        'additional notes', 'remarks', 'job details', 'description',
        'summary', 'job summary', 'additional information', 'memo',
        'notes', 'comments', 'description', 'job description', 'details',
        'additional notes', 'remarks', 'job details', 'summary',
        'job summary', 'additional information', 'memo', 'comments'
    ]
};

// Utility Functions
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            return dateString;
        }
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return dateString;
    }
};

// Enhanced date parsing for various formats
const parseDateString = (dateString: string): string => {
    if (!dateString || !dateString.trim()) {
        console.log('Empty date string, using today:', new Date().toISOString().split('T')[0]);
        return new Date().toISOString().split('T')[0];
    }

    const cleanDate = dateString.trim();
    console.log('Parsing date:', cleanDate);
    
    try {
        // Handle various date formats
        const dateFormats = [
            // ISO formats
            /^\d{4}-\d{2}-\d{2}$/, // 2025-09-05
            /^\d{2}\/\d{2}\/\d{4}$/, // 09/05/2025
            /^\d{2}-\d{2}-\d{4}$/, // 09-05-2025
            
            // Month name formats
            /^[A-Za-z]{3}\s+\d{1,2},\s+\d{4}$/, // Sep 05, 2025
            /^[A-Za-z]+\s+\d{1,2},\s+\d{4}$/, // September 05, 2025
            /^\d{1,2}\s+[A-Za-z]{3}\s+\d{4}$/, // 05 Sep 2025
            /^\d{1,2}\s+[A-Za-z]+\s+\d{4}$/, // 05 September 2025
            
            // Other common formats
            /^\d{1,2}\/\d{1,2}\/\d{2}$/, // 09/05/25
            /^\d{1,2}-\d{1,2}-\d{2}$/, // 09-05-25
        ];

        // Try parsing with different approaches
        for (const format of dateFormats) {
            if (format.test(cleanDate)) {
                const date = new Date(cleanDate);
                if (!isNaN(date.getTime())) {
                    console.log('Date parsed successfully:', date.toISOString().split('T')[0]);
                    return date.toISOString().split('T')[0];
                }
            }
        }
        
        // Try direct parsing
        const date = new Date(cleanDate);
        if (!isNaN(date.getTime())) {
            console.log('Date parsed directly:', date.toISOString().split('T')[0]);
            return date.toISOString().split('T')[0];
        }
        
        // If all else fails, return today's date
        console.log('Date parsing failed, using today:', new Date().toISOString().split('T')[0]);
        return new Date().toISOString().split('T')[0];
    } catch (error) {
        console.log('Date parsing error:', error, 'using today:', new Date().toISOString().split('T')[0]);
        return new Date().toISOString().split('T')[0];
    }
};

// Normalize work type to match expected values
const normalizeWorkType = (workType: string): string => {
    if (!workType || !workType.trim()) {
        return 'Remote';
    }

    const normalized = workType.toLowerCase().trim();
    
    // Map various work type formats to standard values
    if (normalized.includes('remote') || normalized.includes('work from home') || 
        normalized.includes('wfh') || normalized.includes('virtual')) {
        return 'Remote';
    } else if (normalized.includes('onsite') || normalized.includes('on-site') || 
               normalized.includes('office') || normalized.includes('in-person') ||
               normalized.includes('in office') || normalized.includes('on site')) {
        return 'Onsite';
    } else if (normalized.includes('hybrid') || normalized.includes('flexible') ||
               normalized.includes('part remote') || normalized.includes('part onsite') ||
               normalized.includes('mixed') || normalized.includes('combination')) {
        return 'Hybrid';
    }
    
    // Default to Remote if no match
    return 'Remote';
};

// Normalize status to match expected values
const normalizeStatus = (status: string): string => {
    if (!status || !status.trim()) {
        return 'Applied';
    }

    const normalized = status.toLowerCase().trim();
    
    // Map various status formats to standard values
    if (normalized.includes('applied') || normalized.includes('submitted') ||
        normalized.includes('pending') || normalized.includes('new')) {
        return 'Applied';
    } else if (normalized.includes('interview') || normalized.includes('interviewing') ||
               normalized.includes('phone screen') || normalized.includes('technical') ||
               normalized.includes('onsite') || normalized.includes('virtual interview')) {
        return 'Interview';
    } else if (normalized.includes('offer') || normalized.includes('accepted') ||
               normalized.includes('hired') || normalized.includes('selected')) {
        return 'Offer';
    } else if (normalized.includes('rejected') || normalized.includes('declined') ||
               normalized.includes('not selected') || normalized.includes('passed') ||
               normalized.includes('no thank') || normalized.includes('unsuccessful')) {
        return 'Rejected';
    }
    
    // Default to Applied if no match
    return 'Applied';
};

// Normalize employment type to match expected values
const normalizeEmploymentType = (employmentType: string): string => {
    if (!employmentType || !employmentType.trim()) {
        return 'Full-time';
    }

    const normalized = employmentType.toLowerCase().trim();
    
    // Map various employment type formats to standard values
    if (normalized.includes('full') && normalized.includes('time') || 
        normalized.includes('fulltime') || normalized.includes('full-time') ||
        normalized.includes('permanent') || normalized.includes('regular')) {
        return 'Full-time';
    } else if (normalized.includes('part') && normalized.includes('time') ||
               normalized.includes('parttime') || normalized.includes('part-time') ||
               normalized.includes('part time')) {
        return 'Part-time';
    } else if (normalized.includes('contract') || normalized.includes('contractor') ||
               normalized.includes('freelance') || normalized.includes('consultant') ||
               normalized.includes('temporary') || normalized.includes('temp')) {
        return 'Contract';
    } else if (normalized.includes('intern') || normalized.includes('internship') ||
               normalized.includes('co-op') || normalized.includes('coop') ||
               normalized.includes('student')) {
        return 'Internship';
    }
    
    // Default to Full-time if no match
    return 'Full-time';
};

const sanitizeCSVValue = (value: string | undefined | null): string => {
    if (!value) return '';

    const cleaned = String(value).replace(/"/g, '""');
    const needsQuotes = cleaned.includes(',') ||
        cleaned.includes('"') ||
        cleaned.includes('\n') ||
        cleaned.includes('\r');

    return needsQuotes ? `"${cleaned}"` : cleaned;
};

const generateFileName = (prefix: string, extension: string): string => {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}-${timestamp}.${extension}`;
};

const downloadFile = (blob: Blob, filename: string): void => {
    try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = filename;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Cleanup with slight delay to ensure download starts
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
        console.error('Download failed:', error);
        throw new Error('Failed to download file. Please try again.');
    }
};

const calculateSummary = (applications: Application[]): ExportSummary => {
    const statusBreakdown = VALID_STATUSES.reduce((acc, status) => {
        acc[status] = applications.filter(app => app.status === status).length;
        return acc;
    }, {} as Record<string, number>);

    const jobTypeBreakdown = VALID_JOB_TYPES.reduce((acc, type) => {
        acc[type] = applications.filter(app => app.type === type).length;
        return acc;
    }, {} as Record<string, number>);

    const employmentTypeBreakdown = VALID_EMPLOYMENT_TYPES.reduce((acc, type) => {
        acc[type] = applications.filter(app => app.employmentType === type).length;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalApplications: applications.length,
        statusBreakdown,
        jobTypeBreakdown,
        employmentTypeBreakdown
    };
};

// Enhanced JSON Export
export const exportToJSON = async (applications: Application[]): Promise<void> => {
    if (!applications.length) {
        throw new Error('No applications to export');
    }

    try {
        const exportData: ExportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                exportedBy: 'ApplyTrak',
                version: '1.0.0',
                totalCount: applications.length,
                format: 'json'
            },
            summary: calculateSummary(applications),
            applications
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json;charset=utf-8'});

        downloadFile(blob, generateFileName('applytrak-export', 'json'));
    } catch (error) {
        console.error('JSON export failed:', error);
        throw new Error(`Failed to export JSON: ${(error as Error).message}`);
    }
};

// Enhanced CSV Export
export const exportToCSV = async (applications: Application[]): Promise<void> => {
    if (!applications.length) {
        throw new Error('No applications to export');
    }

    try {
        const headers = [
            'Company', 'Position', 'Date Applied', 'Status', 'Type',
            'Location', 'Salary', 'Job Source', 'Job URL', 'Notes',
            'Created At', 'Updated At'
        ];

        const csvRows = applications.map(app => [
            sanitizeCSVValue(app.company),
            sanitizeCSVValue(app.position),
            sanitizeCSVValue(formatDate(app.dateApplied)),
            sanitizeCSVValue(app.status),
            sanitizeCSVValue(app.type),
            sanitizeCSVValue(app.location),
            sanitizeCSVValue(app.salary),
            sanitizeCSVValue(app.jobSource),
            sanitizeCSVValue(app.jobUrl),
            sanitizeCSVValue(app.notes),
            sanitizeCSVValue(formatDate(app.createdAt)),
            sanitizeCSVValue(formatDate(app.updatedAt))
        ]);

        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8'});

        downloadFile(blob, generateFileName('applytrak-export', 'csv'));
    } catch (error) {
        console.error('CSV export failed:', error);
        throw new Error(`Failed to export CSV: ${(error as Error).message}`);
    }
};

// Enhanced PDF Export
export const exportToPDF = async (applications: Application[]): Promise<void> => {
    if (!applications.length) {
        throw new Error('No applications to export');
    }

    try {
        // Dynamic import for better bundle splitting
        const {default: jsPDF} = await import('jspdf');

        // Try to load autoTable plugin
        let hasAutoTable = false;
        try {
            await import('jspdf-autotable');
            hasAutoTable = true;
        } catch {
            console.warn('jspdf-autotable not available, using fallback format');
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 20;

        // Document Header
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('ApplyTrak', pageWidth / 2, yPosition, {align: 'center'});

        yPosition += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Job Applications Report', pageWidth / 2, yPosition, {align: 'center'});

        yPosition += 8;
        doc.text(`Generated on ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPosition, {align: 'center'});

        yPosition += 8;
        doc.text(`Total Applications: ${applications.length}`, pageWidth / 2, yPosition, {align: 'center'});

        yPosition += 15;

        if (hasAutoTable && (doc as any).autoTable) {
            // Enhanced table with autoTable
            const headers = ['#', 'Date', 'Company', 'Position', 'Type', 'Location', 'Salary', 'Source', 'Status'];

            const tableData = applications.map((app, index) => [
                index + 1,
                formatDate(app.dateApplied),
                app.company || '-',
                app.position || '-',
                app.type || '-',
                app.location || '-',
                app.salary || '-',
                app.jobSource || '-',
                app.status || '-'
            ]);

            (doc as any).autoTable({
                head: [headers],
                body: tableData,
                startY: yPosition,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                    overflow: 'linebreak',
                    valign: 'top'
                },
                headStyles: {
                    fillColor: [74, 94, 84],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 250, 251]
                },
                columnStyles: {
                    0: {cellWidth: 10},  // #
                    1: {cellWidth: 20},  // Date
                    2: {cellWidth: 25},  // Company
                    3: {cellWidth: 25},  // Position
                    4: {cellWidth: 15},  // Type
                    5: {cellWidth: 20},  // Location
                    6: {cellWidth: 18},  // Salary
                    7: {cellWidth: 18},  // Source
                    8: {cellWidth: 15}   // Status
                },
                margin: {top: 40, right: 14, bottom: 20, left: 14},
                didDrawPage: (data: any) => {
                    // Page footer
                    doc.setFontSize(8);
                    doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10);
                }
            });
        } else {
            // Fallback text format
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            for (let i = 0; i < applications.length; i++) {
                const app = applications[i];

                // Check if we need a new page
                if (yPosition > pageHeight - 60) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Application entry
                doc.setFont('helvetica', 'bold');
                doc.text(`${i + 1}. ${app.company} - ${app.position}`, 14, yPosition);
                yPosition += 6;

                doc.setFont('helvetica', 'normal');
                doc.text(`Date Applied: ${formatDate(app.dateApplied)}`, 20, yPosition);
                yPosition += 5;

                doc.text(`Status: ${app.status} | Type: ${app.type}`, 20, yPosition);
                yPosition += 5;

                if (app.location) {
                    doc.text(`Location: ${app.location}`, 20, yPosition);
                    yPosition += 5;
                }

                if (app.salary) {
                    doc.text(`Salary: ${app.salary}`, 20, yPosition);
                    yPosition += 5;
                }

                if (app.jobSource) {
                    doc.text(`Source: ${app.jobSource}`, 20, yPosition);
                    yPosition += 5;
                }

                if (app.notes?.trim()) {
                    const truncatedNotes = app.notes.length > 100
                        ? `${app.notes.substring(0, 100)}...`
                        : app.notes;
                    doc.text(`Notes: ${truncatedNotes}`, 20, yPosition);
                    yPosition += 5;
                }

                yPosition += 8; // Space between entries
            }
        }

        doc.save(generateFileName('applytrak-export', 'pdf'));
    } catch (error) {
        console.error('PDF export failed:', error);
        throw new Error(`Failed to export PDF: ${(error as Error).message}`);
    }
};

// --- helpers for JSON import ---
const sanitizeAttachment = (att: any) => ({
    // keep ONLY metadata; drop huge base64 "data"
    id: String(att?.id ?? ''),
    name: att?.name != null ? String(att.name) : '',
    size: typeof att?.size === 'number' ? att.size : Number(att?.size ?? 0) || 0,
    type: att?.type != null ? String(att.type) : undefined,
    uploadedAt: att?.uploadedAt != null ? String(att.uploadedAt) : undefined,
    ...(att?.storagePath ? {storagePath: String(att.storagePath)} : {})
});

const sanitizeIncomingApplication = (a: any): Partial<Application> => {
    // normalize attachments: drop base64 "data", keep metadata
    const attachments = Array.isArray(a?.attachments)
        ? a.attachments.map(sanitizeAttachment)
        : [];

    // company variants we’ve seen in the wild
    const company =
        (typeof a?.company === 'string' && a.company) ||
        (typeof a?.companyName === 'string' && a.companyName) ||
        (typeof a?.employer === 'string' && a.employer) ||
        (typeof a?.organization === 'string' && a.organization) ||
        (typeof a?.org === 'string' && a.org) ||
        (typeof a?.company_name === 'string' && a.company_name) ||
        '';

    // position / title variants
    const position =
        (typeof a?.position === 'string' && a.position) ||
        (typeof a?.role === 'string' && a.role) ||
        (typeof a?.jobTitle === 'string' && a.jobTitle) ||
        (typeof a?.title === 'string' && a.title) ||
        (typeof a?.job === 'string' && a.job) ||
        (typeof a?.job_position === 'string' && a.job_position) ||
        '';

    // dates / status / type variants
    const dateAppliedRaw =
        a?.dateApplied ??
        a?.appliedDate ??
        a?.applicationDate ??
        a?.applied_on ??
        a?.date;

    const statusRaw = a?.status ?? a?.applicationStatus;
    const typeRaw = a?.type ?? a?.jobType ?? a?.workType;

    return {
        id:
            a?.id != null
                ? String(a.id)
                : `imported-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        company: String(company).trim(),
        position: String(position).trim(),
        dateApplied: dateAppliedRaw != null ? String(dateAppliedRaw) : '',
        // cast as any; validator clamps to VALID_* lists
        status: (statusRaw != null ? String(statusRaw) : '') as any,
        type: (typeRaw != null ? String(typeRaw) : '') as any,
        location: a?.location == null ? '' : String(a.location),
        salary: a?.salary == null ? '' : String(a.salary),
        jobSource: a?.jobSource == null ? '' : String(a.jobSource ?? a?.source),
        jobUrl: a?.jobUrl == null ? '' : String(a.jobUrl ?? a?.url ?? a?.link),
        notes: a?.notes == null ? '' : String(a.notes),
        attachments,
        ...(a?.createdAt && { createdAt: String(a.createdAt) }),
        ...(a?.updatedAt && { updatedAt: String(a.updatedAt) }),
    };
};

// Find an applications array regardless of wrapper key
const extractApplicationsArray = (data: any): any[] => {
    if (Array.isArray(data)) return data;

    // Common wrappers we see in the wild
    const candidates = [
        'applications', 'data', 'records', 'items', 'rows', 'results', 'apps'
    ];

    for (const key of candidates) {
        const arr = (data as any)?.[key];
        if (Array.isArray(arr)) return arr;
    }

    // Last-ditch: if the object has exactly one array value, use it
    if (data && typeof data === 'object') {
        const arrays = Object.values(data).filter(v => Array.isArray(v)) as any[];
        if (arrays.length === 1) return arrays[0];
    }

    return [];
};

const validateApplications = (applications: any[]): ImportResult => {
    console.log(`[Validation] Starting validation of ${applications.length} applications`);
    const validApplications: Application[] = [];
    const warnings: string[] = [];
    const reasons: Record<string, number> = {};

    applications.forEach((app, index) => {
        try {
            const validatedApp = validateAndCleanApplication(app, index);
            validApplications.push(validatedApp);
        } catch (error) {
            const msg = (error as Error).message || 'Unknown validation error';
            console.warn(`[Validation] Application ${index + 1} failed:`, msg, app);
            warnings.push(`Application ${index + 1}: ${msg}`);
            reasons[msg] = (reasons[msg] || 0) + 1;
        }
    });
    
    console.log(`[Validation] Results: ${validApplications.length} valid, ${warnings.length} warnings`);

    if (validApplications.length === 0) {
        const topReasons = Object.entries(reasons)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([msg, count]) => `• ${msg} (x${count})`)
            .join('\n');
        throw new Error(
            `No valid applications found after validation.\nMost common issues:\n${topReasons || 'No reasons captured.'}`
        );
    }

    return {
        applications: validApplications,
        warnings,
        totalProcessed: applications.length,
    };
};

export const importFromJSON = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                // 1) Find apps array regardless of wrapper key
                const rawApps = extractApplicationsArray(data);

                // ---- DIAGNOSTICS ----
                const rootKeys = data && typeof data === 'object' ? Object.keys(data) : [];
                console.log('[Import] root keys:', rootKeys.length ? rootKeys : '(not object)');
                console.log('[Import] detected apps length:', rawApps.length);
                console.log('[Import] first raw keys:', rawApps[0] ? Object.keys(rawApps[0]) : '(none)');

                if (!rawApps.length) {
                    console.error('[Import] No applications found in file. Data structure:', data);
                    throw new Error(
                        'Invalid JSON format. Expected an array of applications or an object containing one (e.g., "applications").'
                    );
                }

                // 2) Sanitize (drops attachments.data; coerces types/strings; maps alt keys)
                const sanitized = rawApps.map(sanitizeIncomingApplication);

                // More DIAGNOSTICS
                const countNonEmpty = (k: 'company' | 'position') =>
                    sanitized.reduce((n, a) => n + (a?.[k] ? 1 : 0), 0);

                console.log('[Import] sanitized counts:', {
                    companyNonEmpty: countNonEmpty('company'),
                    positionNonEmpty: countNonEmpty('position'),
                });
                if (sanitized[0]) {
                    // print a trimmed sample (avoid huge logs)
                    const {attachments, notes, ...rest} = sanitized[0];
                    console.log('[Import] sample sanitized (trimmed):', {
                        ...rest,
                        attachmentsCount: Array.isArray(attachments) ? attachments.length : 0,
                        notesLen: typeof notes === 'string' ? notes.length : 0,
                    });
                }

                // 3) Quick guard: keep only objects
                const prefiltered = sanitized.filter(a => a && typeof a === 'object');
                console.log('[Import] prefiltered length:', prefiltered.length);

                // 4) Validate & return (cast to satisfy TS unions; validator enforces actual values)
                let result: ImportResult;
                try {
                    result = validateApplications(prefiltered as unknown as Partial<Application>[]);
                } catch (e: any) {
                    console.error('[Import] validateApplications threw:', e?.message || e);
                    // Surface a concise error up to UI
                    throw new Error(e?.message || 'Validation failed');
                }

                console.log('[Import] validation passed:', {
                    totalProcessed: result.totalProcessed,
                    validCount: result.applications.length,
                    warnings: result.warnings?.length || 0,
                });

                resolve(result);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                reject(new Error(`Failed to parse JSON file: ${message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file. Please try again.'));
        };

        reader.readAsText(file);
    });
};

// Enhanced CSV Import
export const importFromCSV = async (file: File): Promise<ImportResult> => {
    console.log('🚀 CSV IMPORT STARTED - File:', file.name);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const lines = content.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    throw new Error('CSV file must contain at least a header row and one data row.');
                }

                const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
                
                // Get sample data for intelligent detection
                const sampleData = lines.slice(1, 6).map(line => parseCSVLine(line));
                
                console.log('🔍 DEBUG: About to map CSV columns');
                console.log('🔍 DEBUG: Original headers:', parseCSVLine(lines[0]));
                console.log('🔍 DEBUG: Lowercase headers:', headers);
                console.log('🔍 DEBUG: Sample data:', sampleData[0]);
                
                const columnIndexes = mapCSVColumns(headers, sampleData);

                if (columnIndexes.company === -1 || columnIndexes.position === -1) {
                    throw new Error('CSV must include at least "Company" and "Position" columns.');
                }

                const applications: Partial<Application>[] = [];
                const warnings: string[] = [];

                for (let i = 1; i < lines.length; i++) {
                    try {
                        const values = parseCSVLine(lines[i]);

                        if (values.length === 0 || values.every(v => !v.trim())) {
                            continue; // Skip empty rows
                        }

                        const app = createApplicationFromCSVRow(values, columnIndexes, i);
                        applications.push(app);
                    } catch (error) {
                        warnings.push(`Row ${i + 1}: ${(error as Error).message}`);
                    }
                }

                if (applications.length === 0) {
                    throw new Error('No valid applications found in the CSV file.');
                }

                const result = validateApplications(applications);
                result.warnings.push(...warnings);

                resolve(result);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                reject(new Error(`Failed to parse CSV file: ${message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file. Please try again.'));
        };

        reader.readAsText(file);
    });
};

// CSV Parsing Utilities
const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i += 2;
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
                i++;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
            i++;
        } else {
            current += char;
            i++;
        }
    }

    result.push(current.trim());
    return result;
};

const mapCSVColumns = (headers: string[], sampleData?: string[][]): Record<keyof typeof CSV_COLUMN_MAPPING, number> => {
    const result = {} as Record<keyof typeof CSV_COLUMN_MAPPING, number>;

    // Debug logging
    console.log('CSV Headers:', headers);
    console.log('Sample Data:', sampleData?.[0]);

    // First try exact/fuzzy matching
    for (const [key, possibleNames] of Object.entries(CSV_COLUMN_MAPPING)) {
        result[key as keyof typeof CSV_COLUMN_MAPPING] = findColumnIndex(headers, possibleNames);
        if (result[key as keyof typeof CSV_COLUMN_MAPPING] !== -1) {
            console.log(`Mapped "${headers[result[key as keyof typeof CSV_COLUMN_MAPPING]]}" to ${key} (index ${result[key as keyof typeof CSV_COLUMN_MAPPING]})`);
        }
    }

    // If we have sample data, use intelligent detection for missing columns
    if (sampleData && sampleData.length > 0) {
        const intelligentMapping = detectColumnsIntelligently(headers, sampleData);
        
        // Fill in missing mappings with intelligent detection
        for (const [key, index] of Object.entries(intelligentMapping)) {
            if (result[key as keyof typeof CSV_COLUMN_MAPPING] === -1 && index !== -1) {
                result[key as keyof typeof CSV_COLUMN_MAPPING] = index;
                console.log(`Intelligently mapped "${headers[index]}" to ${key} (index ${index})`);
            }
        }
    }

    console.log('Final mapping:', result);
    return result;
};

// Intelligent column detection based on data content
const detectColumnsIntelligently = (headers: string[], sampleData: string[][]): Record<string, number> => {
    const mapping: Record<string, number> = {};
    
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].toLowerCase().trim();
        const sampleValues = sampleData.slice(0, 5).map(row => row[i] || '').filter(v => v.trim());
        
        // Detect company column
        if (!mapping.company && (
            header.includes('company') || header.includes('employer') || 
            header.includes('organization') || header.includes('firm') ||
            sampleValues.some(v => v.length > 2 && !v.match(/^\d/) && !v.includes('@'))
        )) {
            mapping.company = i;
        }
        
        // Detect position column
        if (!mapping.position && (
            header.includes('position') || header.includes('title') || 
            header.includes('role') || header.includes('job') ||
            sampleValues.some(v => v.toLowerCase().includes('engineer') || 
                                  v.toLowerCase().includes('developer') ||
                                  v.toLowerCase().includes('analyst') ||
                                  v.toLowerCase().includes('manager'))
        )) {
            mapping.position = i;
        }
        
        // Detect date column
        if (!mapping.dateApplied && (
            header.includes('date') || header.includes('applied') ||
            sampleValues.some(v => {
                const date = new Date(v);
                return !isNaN(date.getTime()) && date.getFullYear() > 2020;
            })
        )) {
            mapping.dateApplied = i;
        }
        
        // Detect location column
        if (!mapping.location && (
            header.includes('location') || header.includes('city') || 
            header.includes('address') || header.includes('place') ||
            sampleValues.some(v => v.includes(',') || v.includes('CA') || 
                                  v.includes('NY') || v.includes('TX'))
        )) {
            mapping.location = i;
        }
        
        // Detect salary column
        if (!mapping.salary && (
            header.includes('salary') || header.includes('pay') || 
            header.includes('compensation') || header.includes('wage') ||
            sampleValues.some(v => v.includes('$') || v.includes('k') || 
                                  v.includes('USD') || v.match(/\d+,\d+/))
        )) {
            mapping.salary = i;
        }
        
        // Detect employment type column
        if (!mapping.employmentType && (
            header.includes('employment') || header.includes('job type') || 
            header.includes('work type') || header.includes('type') ||
            sampleValues.some(v => {
                const lower = v.toLowerCase();
                return lower.includes('full') || lower.includes('part') || 
                       lower.includes('contract') || lower.includes('intern') ||
                       lower.includes('temporary') || lower.includes('permanent');
            })
        )) {
            mapping.employmentType = i;
        }
        
        // Detect notes column (usually the longest text)
        if (!mapping.notes && (
            header.includes('note') || header.includes('comment') || 
            header.includes('description') || header.includes('detail') ||
            sampleValues.some(v => v.length > 50)
        )) {
            mapping.notes = i;
        }
    }
    
    return mapping;
};

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    // First try exact match
    for (const name of possibleNames) {
        const index = headers.indexOf(name);
        if (index !== -1) return index;
    }
    
    // Then try case-insensitive match
    for (const name of possibleNames) {
        const index = headers.findIndex(header => 
            header.toLowerCase().trim() === name.toLowerCase().trim()
        );
        if (index !== -1) return index;
    }
    
    // Then try fuzzy matching (contains)
    for (const name of possibleNames) {
        const index = headers.findIndex(header => 
            header.toLowerCase().trim().includes(name.toLowerCase().trim()) ||
            name.toLowerCase().trim().includes(header.toLowerCase().trim())
        );
        if (index !== -1) return index;
    }
    
    return -1;
};

const createApplicationFromCSVRow = (
    values: string[],
    columnIndexes: Record<keyof typeof CSV_COLUMN_MAPPING, number>,
    rowIndex: number
): Partial<Application> => {
    const getValue = (key: keyof typeof CSV_COLUMN_MAPPING): string => {
        const index = columnIndexes[key];
        return index !== -1 ? (values[index]?.trim() || '') : '';
    };

    // Debug logging
    if (rowIndex <= 2) { // Log first 3 rows for debugging
        console.log(`Row ${rowIndex} Debug:`, {
            values: values,
            columnIndexes: columnIndexes,
            positionValue: getValue('position'),
            dateValue: getValue('dateApplied'),
            companyValue: getValue('company'),
            jobUrlValue: getValue('jobUrl'),
            jobSourceValue: getValue('jobSource'),
            salaryValue: getValue('salary')
        });
    }

    return {
        id: `imported-${Date.now()}-${rowIndex}`,
        company: getValue('company'),
        position: getValue('position'),
        dateApplied: parseDateString(getValue('dateApplied')),
        status: (normalizeStatus(getValue('status')) || 'Applied') as ApplicationStatus,
        type: (normalizeWorkType(getValue('type')) || 'Remote') as JobType,
        employmentType: (normalizeEmploymentType(getValue('employmentType')) || 'Full-time') as EmploymentType,
        location: getValue('location'),
        salary: getValue('salary'),
        jobSource: getValue('jobSource'),
        jobUrl: getValue('jobUrl'),
        notes: getValue('notes'),
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
};

const validateAndCleanApplication = (app: any, index: number): Application => {
    if (!app || typeof app !== 'object') {
        throw new Error('Invalid application data');
    }

    // Required field validation
    if (!app.company?.trim()) {
        throw new Error('Company name is required');
    }

    if (!app.position?.trim()) {
        throw new Error('Position is required');
    }

    // Date validation and normalization
    const dateApplied = validateAndNormalizeDate(app.dateApplied);

    // Status validation
    const status = VALID_STATUSES.includes(app.status) ? app.status : 'Applied';

    // Job type validation
    const type = VALID_JOB_TYPES.includes(app.type) ? app.type : 'Remote';
    
    // Employment type validation (default to '-' if not provided)
    const employmentType = VALID_EMPLOYMENT_TYPES.includes(app.employmentType) ? app.employmentType : '-';

    return {
        id: app.id || `imported-${Date.now()}-${index}`,
        company: String(app.company).trim() || '-',
        position: String(app.position).trim() || '-',
        dateApplied,
        status: status as any,
        type: type as any,
        employmentType: employmentType as any,
        location: app.location?.trim?.() || '-',
        salary: app.salary?.trim?.() || '-',
        jobSource: app.jobSource?.trim?.() || '-',
        jobUrl: app.jobUrl?.trim?.() || '-',
        notes: app.notes?.trim?.() || '-',
        // ensure attachments are metadata-only
        attachments: Array.isArray(app.attachments)
            ? app.attachments.map(sanitizeAttachment)
            : [],
        createdAt: app.createdAt || new Date().toISOString(),
        updatedAt: app.updatedAt || new Date().toISOString()
    };
};

const validateAndNormalizeDate = (dateString: string): string => {
    if (!dateString) {
        return new Date().toISOString().split('T')[0];
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
    }

    return date.toISOString().split('T')[0];
};

// Universal Excel Import Function
export const importFromExcel = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    throw new Error('Excel file must have at least a header row and one data row');
                }
                
                const headers = (jsonData[0] as string[]).map(h => h?.toString().toLowerCase().trim() || '');
                const dataRows = jsonData.slice(1) as any[][];
                
                // Convert Excel data to string format for intelligent detection
                const sampleData = dataRows.slice(0, 5).map(row => 
                    row.map(cell => cell?.toString() || '')
                );
                
                // Use the same intelligent column mapping as CSV
                const columnIndexes = mapCSVColumns(headers, sampleData);
                
                if (columnIndexes.company === -1 || columnIndexes.position === -1) {
                    throw new Error('Excel file must include at least "Company" and "Position" columns.');
                }
                
                const applications: Partial<Application>[] = [];
                const warnings: string[] = [];
                
                for (let i = 0; i < dataRows.length; i++) {
                    try {
                        const row = dataRows[i];
                        if (!row || row.every(cell => !cell)) continue; // Skip empty rows
                        
                        const values = row.map(cell => cell?.toString() || '');
                        const app = createApplicationFromCSVRow(values, columnIndexes, i);
                        applications.push(app);
                    } catch (error) {
                        warnings.push(`Row ${i + 2}: ${(error as Error).message}`);
                    }
                }
                
                if (applications.length === 0) {
                    throw new Error('No valid applications found in the Excel file.');
                }
                
                resolve({
                    applications: applications as Application[],
                    warnings,
                    totalProcessed: applications.length
                });
                
            } catch (error) {
                reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Failed to read Excel file. Please try again.'));
        };
        
        reader.readAsArrayBuffer(file);
    });
};

// Enhanced JSON Import Function
export const importFromJSONEnhanced = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                // Extract applications array using intelligent detection
                const rawApps = extractApplicationsArray(data);
                
                if (!Array.isArray(rawApps) || rawApps.length === 0) {
                    throw new Error('No applications array found in JSON file');
                }

                // Use intelligent field mapping for JSON
                const applications: Partial<Application>[] = [];
                const warnings: string[] = [];

                rawApps.forEach((app, index) => {
                    try {
                        const mappedApp = mapJSONApplicationFields(app, index);
                        applications.push(mappedApp);
                    } catch (error) {
                        warnings.push(`Application ${index + 1}: ${(error as Error).message}`);
                    }
                });

                if (applications.length === 0) {
                    throw new Error('No valid applications found in JSON file.');
                }

                resolve({
                    applications: applications as Application[],
                    warnings,
                    totalProcessed: applications.length
                });

            } catch (error) {
                reject(new Error(`Failed to parse JSON file: ${(error as Error).message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read JSON file. Please try again.'));
        };

        reader.readAsText(file);
    });
};

// Intelligent JSON field mapping
const mapJSONApplicationFields = (app: any, index: number): Partial<Application> => {
    if (!app || typeof app !== 'object') {
        throw new Error('Invalid application data');
    }

    // Intelligent field detection
    const company = findFieldValue(app, ['company', 'companyName', 'employer', 'organization', 'firm', 'corporation', 'business']);
    const position = findFieldValue(app, ['position', 'jobTitle', 'title', 'role', 'job', 'positionTitle', 'jobPosition']);
    const dateApplied = findFieldValue(app, ['dateApplied', 'applicationDate', 'date', 'applied', 'appliedDate', 'submissionDate']);
    const status = findFieldValue(app, ['status', 'applicationStatus', 'currentStatus', 'jobStatus', 'stage', 'phase']);
    const type = findFieldValue(app, ['type', 'jobType', 'workType', 'workArrangement', 'workModel']);
    const employmentType = findFieldValue(app, ['employmentType', 'employment', 'jobType', 'workType', 'type', 'fullTime', 'partTime', 'contract', 'internship']);
    const location = findFieldValue(app, ['location', 'city', 'address', 'place', 'workLocation', 'jobLocation', 'officeLocation']);
    const salary = findFieldValue(app, ['salary', 'compensation', 'pay', 'wage', 'income', 'remuneration', 'package', 'totalCompensation']);
    const jobSource = findFieldValue(app, ['jobSource', 'source', 'foundVia', 'foundThrough', 'discoveredVia', 'applicationSource', 'whereFound']);
    const jobUrl = findFieldValue(app, ['jobUrl', 'url', 'link', 'jobLink', 'applicationUrl', 'jobPostingUrl', 'postingLink']);
    const notes = findFieldValue(app, ['notes', 'comments', 'description', 'jobDescription', 'details', 'additionalNotes', 'remarks']);

    return {
        id: app.id || `imported-${Date.now()}-${index}`,
        company: company || '',
        position: position || '',
        dateApplied: parseDateString(dateApplied),
        status: (normalizeStatus(status) || 'Applied') as ApplicationStatus,
        type: (normalizeWorkType(type) || 'Remote') as JobType,
        employmentType: (normalizeEmploymentType(employmentType) || 'Full-time') as EmploymentType,
        location: location || '',
        salary: salary || '',
        jobSource: jobSource || '',
        jobUrl: jobUrl || '',
        notes: notes || '',
        attachments: Array.isArray(app.attachments) ? app.attachments : [],
        createdAt: app.createdAt || new Date().toISOString(),
        updatedAt: app.updatedAt || new Date().toISOString()
    };
};

// Helper function to find field value using multiple possible keys
const findFieldValue = (obj: any, possibleKeys: string[]): string => {
    for (const key of possibleKeys) {
        // Try exact match
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
            return String(obj[key]);
        }
        
        // Try case-insensitive match
        const lowerKey = key.toLowerCase();
        for (const objKey of Object.keys(obj)) {
            if (objKey.toLowerCase() === lowerKey && obj[objKey] !== undefined && obj[objKey] !== null && obj[objKey] !== '') {
                return String(obj[objKey]);
            }
        }
        
        // Try fuzzy match (contains)
        for (const objKey of Object.keys(obj)) {
            if (objKey.toLowerCase().includes(lowerKey) || lowerKey.includes(objKey.toLowerCase())) {
                if (obj[objKey] !== undefined && obj[objKey] !== null && obj[objKey] !== '') {
                    return String(obj[objKey]);
                }
            }
        }
    }
    return '';
};

// Main Import Function
export const importApplications = async (file: File): Promise<ImportResult> => {
    // File validation
    if (!file) {
        throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
        return importFromJSONEnhanced(file);
    } else if (fileName.endsWith('.csv')) {
        return importFromCSV(file);
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return importFromExcel(file);
    } else {
        throw new Error('Unsupported file format. Please upload a JSON, CSV, or Excel file.');
    }
};

// Enhanced import with progress tracking and memory management
export const importApplicationsWithProgress = async (
    file: File,
    onProgress?: (progress: {
        stage: 'parsing' | 'validating' | 'importing' | 'syncing' | 'complete';
        current: number;
        total: number;
        percentage: number;
        message: string;
    }) => void,
    options?: {
        generateNewIds?: boolean; // Generate new IDs to prevent duplicates
        skipDuplicates?: boolean;  // Skip duplicate applications
    }
): Promise<ImportResult> => {
    // File validation
    if (!file) {
        throw new Error('No file provided');
    }

    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    }

    const fileName = file.name.toLowerCase();
    let totalApplications = 0;

    try {
        // Stage 1: Parsing
        onProgress?.({
            stage: 'parsing',
            current: 0,
            total: 100,
            percentage: 0,
            message: 'Parsing file...'
        });

        let applications: Partial<Application>[];
        
        if (fileName.endsWith('.json')) {
            applications = await parseJSONWithProgress(file, onProgress);
        } else if (fileName.endsWith('.csv')) {
            applications = await parseCSVWithProgress(file, onProgress);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            applications = await parseExcelWithProgress(file, onProgress);
        } else {
            throw new Error('Unsupported file format. Please upload a JSON, CSV, or Excel file.');
        }

        totalApplications = applications.length;

        // Stage 2: Pre-processing (ID generation if needed)
        if (options?.generateNewIds) {
            onProgress?.({
                stage: 'parsing',
                current: 50,
                total: 100,
                percentage: 75,
                message: 'Generating new IDs...'
            });

            applications = applications.map(app => ({
                ...app,
                id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }));

            console.log('🆔 Generated new IDs for all applications to prevent duplicates');
        }

        // Stage 3: Validation with streaming
        onProgress?.({
            stage: 'validating',
            current: 0,
            total: totalApplications,
            percentage: 0,
            message: 'Validating applications...'
        });

        const validationResult = await validateApplicationsWithProgress(applications, onProgress);

        // Stage 4: Import preparation
        onProgress?.({
            stage: 'importing',
            current: totalApplications,
            total: totalApplications,
            percentage: 100,
            message: 'Import ready for confirmation'
        });

        return validationResult;

    } catch (error) {
        onProgress?.({
            stage: 'complete',
            current: 0,
            total: totalApplications,
            percentage: 0,
            message: `Import failed: ${(error as Error).message}`
        });
        throw error;
    }
};

// Parse JSON with progress updates
const parseJSONWithProgress = async (
    file: File,
    onProgress?: (progress: any) => void
): Promise<Partial<Application>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                
                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 50,
                    total: 100,
                    percentage: 50,
                    message: 'Parsing JSON content...'
                });

                const data = JSON.parse(content);
                const rawApps = extractApplicationsArray(data);

                if (!rawApps.length) {
                    throw new Error(
                        'Invalid JSON format. Expected an array of applications or an object containing one (e.g., "applications").'
                    );
                }

                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 75,
                    total: 100,
                    percentage: 75,
                    message: 'Sanitizing data...'
                });

                const sanitized = rawApps.map(sanitizeIncomingApplication);
                const prefiltered = sanitized.filter(a => a && typeof a === 'object');

                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 100,
                    total: 100,
                    percentage: 100,
                    message: 'JSON parsing complete'
                });

                resolve(prefiltered as Partial<Application>[]);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                reject(new Error(`Failed to parse JSON file: ${message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file. Please try again.'));
        };

        reader.readAsText(file);
    });
};

// Parse Excel with progress updates
const parseExcelWithProgress = async (
    file: File,
    onProgress?: (progress: any) => void
): Promise<Partial<Application>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const arrayBuffer = event.target?.result as ArrayBuffer;
                
                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 25,
                    total: 100,
                    percentage: 25,
                    message: 'Reading Excel file...'
                });

                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (jsonData.length < 2) {
                    throw new Error('Excel file must have at least a header row and one data row');
                }
                
                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 50,
                    total: 100,
                    percentage: 50,
                    message: 'Processing Excel headers...'
                });

                const headers = (jsonData[0] as string[]).map(h => h?.toString().toLowerCase().trim() || '');
                const dataRows = jsonData.slice(1) as any[][];
                
                // Convert Excel data to string format for intelligent detection
                const sampleData = dataRows.slice(0, 5).map(row => 
                    row.map(cell => cell?.toString() || '')
                );
                
                // Use the same intelligent column mapping as CSV
                const columnIndexes = mapCSVColumns(headers, sampleData);
                
                if (columnIndexes.company === -1 || columnIndexes.position === -1) {
                    throw new Error('Excel file must include at least "Company" and "Position" columns.');
                }
                
                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 75,
                    total: 100,
                    percentage: 75,
                    message: 'Processing Excel rows...'
                });

                const applications: Partial<Application>[] = [];
                const warnings: string[] = [];
                const totalRows = dataRows.length;

                for (let i = 0; i < dataRows.length; i++) {
                    try {
                        const row = dataRows[i];
                        if (!row || row.every(cell => !cell)) continue; // Skip empty rows
                        
                        const values = row.map(cell => cell?.toString() || '');
                        const app = createApplicationFromCSVRow(values, columnIndexes, i);
                        applications.push(app);

                        // Update progress every 10 rows
                        if (i % 10 === 0) {
                            onProgress?.({
                                stage: 'parsing',
                                current: 75 + Math.round((i / totalRows) * 25),
                                total: 100,
                                percentage: 75 + Math.round((i / totalRows) * 25),
                                message: `Processed ${i} of ${totalRows} Excel rows...`
                            });
                        }
                    } catch (error) {
                        warnings.push(`Row ${i + 2}: ${(error as Error).message}`);
                    }
                }
                
                if (applications.length === 0) {
                    throw new Error('No valid applications found in the Excel file.');
                }

                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 100,
                    total: 100,
                    percentage: 100,
                    message: 'Excel parsing complete'
                });

                resolve(applications);
            } catch (error) {
                reject(new Error(`Failed to parse Excel file: ${(error as Error).message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read Excel file. Please try again.'));
        };

        reader.readAsArrayBuffer(file);
    });
};

// Parse CSV with progress updates
const parseCSVWithProgress = async (
    file: File,
    onProgress?: (progress: any) => void
): Promise<Partial<Application>[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const lines = content.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    throw new Error('CSV file must contain at least a header row and one data row.');
                }

                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 25,
                    total: 100,
                    percentage: 25,
                    message: 'Processing CSV headers...'
                });

                const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
                
                // Get sample data for intelligent detection
                const sampleData = lines.slice(1, 6).map(line => parseCSVLine(line));
                const columnIndexes = mapCSVColumns(headers, sampleData);

                if (columnIndexes.company === -1 || columnIndexes.position === -1) {
                    throw new Error('CSV must include at least "Company" and "Position" columns.');
                }

                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 50,
                    total: 100,
                    percentage: 50,
                    message: 'Processing CSV rows...'
                });

                const applications: Partial<Application>[] = [];
                const warnings: string[] = [];
                const totalRows = lines.length - 1;

                for (let i = 1; i < lines.length; i++) {
                    try {
                        const values = parseCSVLine(lines[i]);

                        if (values.length === 0 || values.every(v => !v.trim())) {
                            continue; // Skip empty rows
                        }

                        const app = createApplicationFromCSVRow(values, columnIndexes, i);
                        applications.push(app);

                        // Update progress every 10 rows
                        if (i % 10 === 0) {
                            onProgress?.({
                                stage: 'parsing',
                                current: 50 + Math.round((i / totalRows) * 50),
                                total: 100,
                                percentage: 50 + Math.round((i / totalRows) * 50),
                                message: `Processed ${i} of ${totalRows} rows...`
                            });
                        }
                    } catch (error) {
                        warnings.push(`Row ${i + 1}: ${(error as Error).message}`);
                    }
                }

                // Update progress
                onProgress?.({
                    stage: 'parsing',
                    current: 100,
                    total: 100,
                    percentage: 100,
                    message: 'CSV parsing complete'
                });

                if (applications.length === 0) {
                    throw new Error('No valid applications found in the CSV file.');
                }

                resolve(applications);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error occurred';
                reject(new Error(`Failed to parse CSV file: ${message}`));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file. Please try again.'));
        };

        reader.readAsText(file);
    });
};

// Validate applications with streaming progress
const validateApplicationsWithProgress = async (
    applications: Partial<Application>[],
    onProgress?: (progress: any) => void
): Promise<ImportResult> => {
    const validApplications: Application[] = [];
    const warnings: string[] = [];
    const reasons: Record<string, number> = {};
    const total = applications.length;
    const chunkSize = 25; // Process in smaller chunks for better UI responsiveness

    for (let i = 0; i < total; i += chunkSize) {
        const chunk = applications.slice(i, i + chunkSize);
        
        // Process chunk
        chunk.forEach((app, index) => {
            try {
                const validatedApp = validateAndCleanApplication(app, i + index);
                validApplications.push(validatedApp);
            } catch (error) {
                const msg = (error as Error).message || 'Unknown validation error';
                warnings.push(`Application ${i + index + 1}: ${msg}`);
                reasons[msg] = (reasons[msg] || 0) + 1;
            }
        });

        // Update progress
        const current = Math.min(i + chunkSize, total);
        const percentage = Math.round((current / total) * 100);
        
        onProgress?.({
            stage: 'validating',
            current,
            total,
            percentage,
            message: `Validated ${current} of ${total} applications...`
        });

        // Allow UI to update
        await new Promise(resolve => setTimeout(resolve, 0));
    }

    if (validApplications.length === 0) {
        const topReasons = Object.entries(reasons)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([msg, count]) => `• ${msg} (x${count})`)
            .join('\n');
        throw new Error(
            `No valid applications found after validation.\nMost common issues:\n${topReasons || 'No reasons captured.'}`
        );
    }

    return {
        applications: validApplications,
        warnings,
        totalProcessed: applications.length,
    };
};

// Export all functions
export default {
    exportToPDF,
    exportToCSV,
    exportToJSON,
    importFromJSON,
    importFromCSV,
    importApplications,
    importApplicationsWithProgress
};