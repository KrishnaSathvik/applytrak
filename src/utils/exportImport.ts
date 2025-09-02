// src/utils/exportImport.ts - Production Ready Version
import {Application} from '../types';

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
    typeBreakdown: Record<string, number>;
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
const VALID_TYPES = ['Remote', 'Hybrid', 'Onsite'] as const;

const CSV_COLUMN_MAPPING = {
    company: ['company', 'company name', 'employer'],
    position: ['position', 'job title', 'title', 'role'],
    dateApplied: ['date applied', 'application date', 'date', 'applied'],
    status: ['status', 'application status'],
    type: ['type', 'job type', 'work type'],
    location: ['location', 'city', 'address'],
    salary: ['salary', 'compensation', 'pay'],
    jobSource: ['job source', 'source', 'found via'],
    jobUrl: ['job url', 'url', 'link', 'job link'],
    notes: ['notes', 'comments', 'description']
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

    const typeBreakdown = VALID_TYPES.reduce((acc, type) => {
        acc[type] = applications.filter(app => app.type === type).length;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalApplications: applications.length,
        statusBreakdown,
        typeBreakdown
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
    const validApplications: Application[] = [];
    const warnings: string[] = [];
    const reasons: Record<string, number> = {};

    applications.forEach((app, index) => {
        try {
            const validatedApp = validateAndCleanApplication(app, index);
            validApplications.push(validatedApp);
        } catch (error) {
            const msg = (error as Error).message || 'Unknown validation error';
            warnings.push(`Application ${index + 1}: ${msg}`);
            reasons[msg] = (reasons[msg] || 0) + 1;
        }
    });

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
                const columnIndexes = mapCSVColumns(headers);

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

const mapCSVColumns = (headers: string[]): Record<keyof typeof CSV_COLUMN_MAPPING, number> => {
    const result = {} as Record<keyof typeof CSV_COLUMN_MAPPING, number>;

    for (const [key, possibleNames] of Object.entries(CSV_COLUMN_MAPPING)) {
        result[key as keyof typeof CSV_COLUMN_MAPPING] = findColumnIndex(headers, possibleNames);
    }

    return result;
};

const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
        const index = headers.indexOf(name);
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

    return {
        id: `imported-${Date.now()}-${rowIndex}`,
        company: getValue('company'),
        position: getValue('position'),
        dateApplied: getValue('dateApplied') || new Date().toISOString().split('T')[0],
        status: getValue('status') as any || 'Applied',
        type: getValue('type') as any || 'Remote',
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

    // Type validation
    const type = VALID_TYPES.includes(app.type) ? app.type : 'Remote';

    return {
        id: app.id || `imported-${Date.now()}-${index}`,
        company: String(app.company).trim(),
        position: String(app.position).trim(),
        dateApplied,
        status: status as any,
        type: type as any,
        location: app.location?.trim?.() || '',
        salary: app.salary?.trim?.() || '',
        jobSource: app.jobSource?.trim?.() || '',
        jobUrl: app.jobUrl?.trim?.() || '',
        notes: app.notes?.trim?.() || '',
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
        return importFromJSON(file);
    } else if (fileName.endsWith('.csv')) {
        return importFromCSV(file);
    } else {
        throw new Error('Unsupported file format. Please upload a JSON or CSV file.');
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
        } else {
            throw new Error('Unsupported file format. Please upload a JSON or CSV file.');
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
                const columnIndexes = mapCSVColumns(headers);

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