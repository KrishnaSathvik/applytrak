// src/utils/exportImport.ts - ENHANCED AND FIXED VERSION
import { Application } from '../types/application.types';

// Helper function to format dates consistently
const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch (error) {
        return dateString; // Return original if parsing fails
    }
};

// Helper function to sanitize CSV values
const sanitizeCSVValue = (value: string | undefined | null): string => {
    if (!value) return '';
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    const cleaned = String(value).replace(/"/g, '""');
    return cleaned.includes(',') || cleaned.includes('"') || cleaned.includes('\n')
        ? `"${cleaned}"`
        : cleaned;
};

// Enhanced JSON Export with metadata
export const exportToJSON = async (applications: Application[]): Promise<void> => {
    try {
        const exportData = {
            metadata: {
                exportedAt: new Date().toISOString(),
                exportedBy: 'ApplyTrak',
                version: '1.0.0',
                totalCount: applications.length,
                format: 'json'
            },
            summary: {
                totalApplications: applications.length,
                statusBreakdown: {
                    applied: applications.filter(app => app.status === 'Applied').length,
                    interview: applications.filter(app => app.status === 'Interview').length,
                    offer: applications.filter(app => app.status === 'Offer').length,
                    rejected: applications.filter(app => app.status === 'Rejected').length
                },
                typeBreakdown: {
                    remote: applications.filter(app => app.type === 'Remote').length,
                    hybrid: applications.filter(app => app.type === 'Hybrid').length,
                    onsite: applications.filter(app => app.type === 'Onsite').length
                }
            },
            applications
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });

        downloadFile(
            blob,
            `applytrak-export-${new Date().toISOString().split('T')[0]}.json`
        );
    } catch (error) {
        console.error('JSON export error:', error);
        throw new Error('Failed to export JSON: ' + (error as Error).message);
    }
};

// Enhanced CSV Export with better formatting
export const exportToCSV = async (applications: Application[]): Promise<void> => {
    try {
        const headers = [
            'Company', 'Position', 'Date Applied', 'Status', 'Type',
            'Location', 'Salary', 'Job Source', 'Job URL', 'Notes',
            'Created At', 'Updated At'
        ];

        const csvContent = [
            headers.join(','),
            ...applications.map(app => [
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
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

        downloadFile(
            blob,
            `applytrak-export-${new Date().toISOString().split('T')[0]}.csv`
        );
    } catch (error) {
        console.error('CSV export error:', error);
        throw new Error('Failed to export CSV: ' + (error as Error).message);
    }
};

// Enhanced PDF Export using dynamic import for jsPDF
export const exportToPDF = async (applications: Application[]): Promise<void> => {
    try {
        // Dynamic import to reduce bundle size
        const jsPDF = (await import('jspdf')).default;

        // Try to import jspdf-autotable, but fallback to simple text if not available
        try {
            await import('jspdf-autotable');
        } catch (autoTableError) {
            console.warn('jspdf-autotable not available, using simple text format');
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 20;

        // Header
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('ApplyTrak', pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Job Applications Report`, pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 8;
        doc.text(`Generated on ${formatDate(new Date().toISOString())}`, pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 8;
        doc.text(`Total Applications: ${applications.length}`, pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 15;

        // Check if autoTable is available
        if ((doc as any).autoTable) {
            // Use autoTable for better formatting
            const headers = [
                '#', 'Date', 'Company', 'Position', 'Type', 'Location',
                'Salary', 'Source', 'Status'
            ];

            const data = applications.map((app, index) => [
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
                body: data,
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
                    0: { cellWidth: 10 }, // #
                    1: { cellWidth: 20 }, // Date
                    2: { cellWidth: 25 }, // Company
                    3: { cellWidth: 25 }, // Position
                    4: { cellWidth: 15 }, // Type
                    5: { cellWidth: 20 }, // Location
                    6: { cellWidth: 18 }, // Salary
                    7: { cellWidth: 18 }, // Source
                    8: { cellWidth: 15 }  // Status
                },
                margin: { top: 40, right: 14, bottom: 20, left: 14 },
                didDrawPage: function (data: any) {
                    // Footer
                    doc.setFontSize(8);
                    doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, pageHeight - 10);
                }
            });
        } else {
            // Fallback to simple text format
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            applications.forEach((app, index) => {
                if (yPosition > pageHeight - 40) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFont('helvetica', 'bold');
                doc.text(`${index + 1}. ${app.company} - ${app.position}`, 14, yPosition);
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

                if (app.notes && app.notes.trim()) {
                    const notes = app.notes.length > 100 ? app.notes.substring(0, 100) + '...' : app.notes;
                    doc.text(`Notes: ${notes}`, 20, yPosition);
                    yPosition += 5;
                }

                yPosition += 5; // Extra space between applications
            });
        }

        // Save the PDF
        doc.save(`applytrak-export-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error('PDF export error:', error);
        throw new Error('Failed to export PDF: ' + (error as Error).message);
    }
};

// Enhanced file download helper
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

        // Clean up the URL object
        setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
        console.error('Download error:', error);
        throw new Error('Failed to download file');
    }
};

// Enhanced JSON Import with validation
export const importFromJSON = async (file: File): Promise<Application[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const data = JSON.parse(content);

                let applications: Application[];

                // Handle different JSON formats
                if (Array.isArray(data)) {
                    // Direct array of applications
                    applications = data;
                } else if (data.applications && Array.isArray(data.applications)) {
                    // Wrapped format with metadata
                    applications = data.applications;
                } else if (data.data && Array.isArray(data.data)) {
                    // Alternative wrapped format
                    applications = data.data;
                } else {
                    throw new Error('Invalid JSON format: Expected array of applications or object with applications property');
                }

                // Validate and clean applications
                const validApplications: Application[] = [];
                const errors: string[] = [];

                applications.forEach((app, index) => {
                    try {
                        const validatedApp = validateAndCleanApplication(app, index);
                        validApplications.push(validatedApp);
                    } catch (error) {
                        errors.push(`Row ${index + 1}: ${(error as Error).message}`);
                    }
                });

                if (validApplications.length === 0) {
                    throw new Error('No valid applications found in the file');
                }

                if (errors.length > 0 && errors.length < applications.length) {
                    console.warn('Some applications had issues:', errors);
                }

                resolve(validApplications);
            } catch (error) {
                reject(new Error('Failed to parse JSON: ' + (error as Error).message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
};

// Enhanced CSV Import with better parsing
export const importFromCSV = async (file: File): Promise<Application[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                const lines = content.split('\n').filter(line => line.trim());

                if (lines.length < 2) {
                    throw new Error('CSV file must have at least a header row and one data row');
                }

                // Parse headers
                const headerLine = lines[0];
                const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().trim());

                // Required columns mapping
                const columnMapping = {
                    company: findColumnIndex(headers, ['company', 'company name', 'employer']),
                    position: findColumnIndex(headers, ['position', 'job title', 'title', 'role']),
                    dateApplied: findColumnIndex(headers, ['date applied', 'application date', 'date', 'applied']),
                    status: findColumnIndex(headers, ['status', 'application status']),
                    type: findColumnIndex(headers, ['type', 'job type', 'work type']),
                    location: findColumnIndex(headers, ['location', 'city', 'address']),
                    salary: findColumnIndex(headers, ['salary', 'compensation', 'pay']),
                    jobSource: findColumnIndex(headers, ['job source', 'source', 'found via']),
                    jobUrl: findColumnIndex(headers, ['job url', 'url', 'link', 'job link']),
                    notes: findColumnIndex(headers, ['notes', 'comments', 'description'])
                };

                if (columnMapping.company === -1 || columnMapping.position === -1) {
                    throw new Error('CSV must include at least Company and Position columns');
                }

                // Parse data rows
                const applications: Application[] = [];
                const errors: string[] = [];

                for (let i = 1; i < lines.length; i++) {
                    try {
                        const values = parseCSVLine(lines[i]);

                        if (values.length < Math.max(columnMapping.company, columnMapping.position) + 1) {
                            continue; // Skip incomplete rows
                        }

                        const app: Partial<Application> = {
                            id: `imported-${Date.now()}-${i}`,
                            company: values[columnMapping.company]?.trim() || '',
                            position: values[columnMapping.position]?.trim() || '',
                            dateApplied: values[columnMapping.dateApplied]?.trim() || new Date().toISOString().split('T')[0],
                            status: (values[columnMapping.status]?.trim() as any) || 'Applied',
                            type: (values[columnMapping.type]?.trim() as any) || 'Remote',
                            location: values[columnMapping.location]?.trim() || '',
                            salary: values[columnMapping.salary]?.trim() || '',
                            jobSource: values[columnMapping.jobSource]?.trim() || '',
                            jobUrl: values[columnMapping.jobUrl]?.trim() || '',
                            notes: values[columnMapping.notes]?.trim() || '',
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        const validatedApp = validateAndCleanApplication(app, i);
                        applications.push(validatedApp);
                    } catch (error) {
                        errors.push(`Row ${i + 1}: ${(error as Error).message}`);
                    }
                }

                if (applications.length === 0) {
                    throw new Error('No valid applications found in CSV file');
                }

                if (errors.length > 0) {
                    console.warn('CSV import warnings:', errors);
                }

                resolve(applications);
            } catch (error) {
                reject(new Error('Failed to parse CSV: ' + (error as Error).message));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
};

// Helper function to parse CSV line properly handling quotes
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

// Helper function to find column index by possible names
const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    for (const name of possibleNames) {
        const index = headers.indexOf(name);
        if (index !== -1) return index;
    }
    return -1;
};

// Enhanced application validation and cleaning
const validateAndCleanApplication = (app: any, index: number): Application => {
    if (!app || typeof app !== 'object') {
        throw new Error('Invalid application data');
    }

    if (!app.company || !app.company.trim()) {
        throw new Error('Company name is required');
    }

    if (!app.position || !app.position.trim()) {
        throw new Error('Position is required');
    }

    // Validate and normalize date
    let dateApplied = app.dateApplied;
    if (dateApplied) {
        const date = new Date(dateApplied);
        if (isNaN(date.getTime())) {
            dateApplied = new Date().toISOString().split('T')[0];
        } else {
            dateApplied = date.toISOString().split('T')[0];
        }
    } else {
        dateApplied = new Date().toISOString().split('T')[0];
    }

    // Validate status
    const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
    const status = validStatuses.includes(app.status) ? app.status : 'Applied';

    // Validate type
    const validTypes = ['Remote', 'Hybrid', 'Onsite'];
    const type = validTypes.includes(app.type) ? app.type : 'Remote';

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
        attachments: app.attachments || [],
        createdAt: app.createdAt || new Date().toISOString(),
        updatedAt: app.updatedAt || new Date().toISOString()
    };
};

// Main import function with auto-detection
export const importApplications = async (file: File): Promise<Application[]> => {
    const fileName = file.name.toLowerCase();
    const fileSize = file.size;

    // Validate file size (100MB limit)
    if (fileSize > 100 * 1024 * 1024) {
        throw new Error('File size too large. Maximum size is 100MB.');
    }

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