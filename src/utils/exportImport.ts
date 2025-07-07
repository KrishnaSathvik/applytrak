// src/utils/exportImport.ts - FIXED VERSION
import {Application} from '../types';

// Helper function to format dates
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// PDF Export using jsPDF - FIXED IMPORT
export const exportToPDF = async (applications: Application[]): Promise<void> => {
    try {
        // FIXED: Correct jsPDF import structure
        const jsPDF = (await import('jspdf')).default;
        await import('jspdf-autotable');

        const doc = new jsPDF();

        // Title
        doc.setFontSize(20);
        doc.text('ApplyTrak', 105, 15, {align: 'center'});

        // Subtitle
        doc.setFontSize(12);
        doc.text(`Generated on ${formatDate(new Date().toISOString())}`, 105, 25, {align: 'center'});
        doc.text(`Total Applications: ${applications.length}`, 105, 32, {align: 'center'});

        // Table headers
        const headers = [
            '#', 'Date', 'Company', 'Position', 'Type', 'Location',
            'Salary', 'Source', 'Status', 'Notes'
        ];

        // Table data
        const data = applications.map((app, index) => [
            index + 1,
            formatDate(app.dateApplied),
            app.company || '-',
            app.position || '-',
            app.type || '-',
            app.location || '-',
            app.salary || '-',
            app.jobSource || '-',
            app.status || '-',
            app.notes ? (app.notes.length > 50 ? app.notes.substring(0, 50) + '...' : app.notes) : '-'
        ]);

        // Add table to PDF
        (doc as any).autoTable({
            head: [headers],
            body: data,
            startY: 40,
            styles: {
                fontSize: 8,
                cellPadding: 2,
                overflow: 'linebreak',
                valign: 'top'
            },
            headStyles: {
                fillColor: [74, 94, 84], // Primary color
                textColor: 255,
                fontStyle: 'bold'
            },
            alternateRowStyles: {
                fillColor: [245, 250, 251]
            },
            columnStyles: {
                0: {cellWidth: 10}, // #
                1: {cellWidth: 20}, // Date
                2: {cellWidth: 25}, // Company
                3: {cellWidth: 25}, // Position
                4: {cellWidth: 15}, // Type
                5: {cellWidth: 20}, // Location
                6: {cellWidth: 18}, // Salary
                7: {cellWidth: 18}, // Source
                8: {cellWidth: 15}, // Status
                9: {cellWidth: 30}  // Notes
            },
            margin: {top: 40, right: 14, bottom: 20, left: 14},
            didDrawPage: function (data: any) {
                // Footer
                doc.setFontSize(8);
                doc.text(`Page ${data.pageNumber}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // Save the PDF
        doc.save(`job-applications-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error('PDF export error:', error);
        throw new Error('Failed to export PDF: ' + (error as Error).message);
    }
};

// CSV Export
export const exportToCSV = (applications: Application[]): void => {
    try {
        const headers = [
            'Company', 'Position', 'Date Applied', 'Status', 'Type',
            'Location', 'Salary', 'Job Source', 'Job URL', 'Notes', 'Created At', 'Updated At'
        ];

        const csvContent = [
            headers.join(','),
            ...applications.map(app => [
                `"${(app.company || '').replace(/"/g, '""')}"`,
                `"${(app.position || '').replace(/"/g, '""')}"`,
                `"${formatDate(app.dateApplied)}"`,
                `"${app.status || ''}"`,
                `"${app.type || ''}"`,
                `"${(app.location || '').replace(/"/g, '""')}"`,
                `"${(app.salary || '').replace(/"/g, '""')}"`,
                `"${(app.jobSource || '').replace(/"/g, '""')}"`,
                `"${(app.jobUrl || '').replace(/"/g, '""')}"`,
                `"${(app.notes || '').replace(/"/g, '""')}"`,
                `"${formatDate(app.createdAt)}"`,
                `"${formatDate(app.updatedAt)}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `job-applications-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('CSV export error:', error);
        throw new Error('Failed to export CSV: ' + (error as Error).message);
    }
};

// JSON Export
export const exportToJSON = (applications: Application[]): void => {
    try {
        const exportData = {
            applications,
            exportDate: new Date().toISOString(),
            version: '1.0.0',
            totalCount: applications.length
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `job-applications-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('JSON export error:', error);
        throw new Error('Failed to export JSON: ' + (error as Error).message);
    }
};

// Import from JSON
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
                    applications = data;
                } else if (data.applications && Array.isArray(data.applications)) {
                    applications = data.applications;
                } else {
                    throw new Error('Invalid JSON format: Expected array of applications');
                }

                // Validate applications
                const validApplications = applications.map((app, index) => {
                    if (!app.company || !app.position || !app.dateApplied) {
                        throw new Error(`Invalid application data at index ${index}: Missing required fields`);
                    }

                    return {
                        ...app,
                        id: app.id || `imported-${Date.now()}-${index}`,
                        createdAt: app.createdAt || new Date().toISOString(),
                        updatedAt: app.updatedAt || new Date().toISOString(),
                        status: app.status || 'Applied',
                        type: app.type || 'Remote'
                    } as Application;
                });

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

// Auto-detect file format and import
export const importApplications = async (file: File): Promise<Application[]> => {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.json')) {
        return importFromJSON(file);
    } else {
        throw new Error('Unsupported file format. Please upload a JSON file.');
    }
};

export default {
    exportToPDF,
    exportToCSV,
    exportToJSON,
    importFromJSON,
    importApplications
};