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

interface ValidationError {
    row: number;
    field: string;
    message: string;
}

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

// Enhanced JSON Import
export const importFromJSON = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                let applications: Application[];

                // Handle different JSON structures
                if (Array.isArray(data)) {
                    applications = data;
                } else if (data.applications && Array.isArray(data.applications)) {
                    applications = data.applications;
                } else if (data.data && Array.isArray(data.data)) {
                    applications = data.data;
                } else {
                    throw new Error('Invalid JSON format. Expected an array of applications or an object with an "applications" property.');
                }

                const result = validateApplications(applications);
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

// Validation Functions
const validateApplications = (applications: Partial<Application>[]): ImportResult => {
    const validApplications: Application[] = [];
    const warnings: string[] = [];

    applications.forEach((app, index) => {
        try {
            const validatedApp = validateAndCleanApplication(app, index);
            validApplications.push(validatedApp);
        } catch (error) {
            warnings.push(`Application ${index + 1}: ${(error as Error).message}`);
        }
    });

    if (validApplications.length === 0) {
        throw new Error('No valid applications found after validation.');
    }

    return {
        applications: validApplications,
        warnings,
        totalProcessed: applications.length
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
        company: app.company.trim(),
        position: app.position.trim(),
        dateApplied,
        status: status as any,
        type: type as any,
        location: app.location?.trim() || '',
        salary: app.salary?.trim() || '',
        jobSource: app.jobSource?.trim() || '',
        jobUrl: app.jobUrl?.trim() || '',
        notes: app.notes?.trim() || '',
        attachments: Array.isArray(app.attachments) ? app.attachments : [],
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

// Export all functions
export default {
    exportToPDF,
    exportToCSV,
    exportToJSON,
    importFromJSON,
    importFromCSV,
    importApplications
};