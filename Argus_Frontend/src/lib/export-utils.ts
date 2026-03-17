import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

/** Escape a value for CSV: quote it, double internal quotes, and neutralize formula injection */
function csvSafe(value: string): string {
  const escaped = value.replace(/"/g, '""');
  // Prefix formula-triggering characters to prevent CSV injection in spreadsheets
  if (/^[=+\-@\t\r]/.test(escaped)) {
    return `"'${escaped}"`;
  }
  return `"${escaped}"`;
}

/**
 * Export chart element as an image (PNG or JPG)
 */
export const exportChartAsImage = async (
    element: HTMLElement,
    filename: string,
    format: 'png' | 'jpg' = 'png'
): Promise<void> => {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
        });

        const link = document.createElement('a');
        link.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.${format}`;
        link.href = canvas.toDataURL(`image/${format === 'jpg' ? 'jpeg' : 'png'}`, 0.95);
        link.click();
    } catch (error) {
        console.error('Error exporting chart as image:', error);
        throw new Error('Failed to export chart as image');
    }
};

/**
 * Export chart and statistics as PDF
 */
export const exportChartAsPDF = async (
    element: HTMLElement,
    stats: {
        current: string;
        avg: string;
        max: string;
        min: string;
    },
    metadata: {
        metricName: string;
        timeFrame: string;
        serverSelection: string;
        timestamp: string;
    },
    filename: string
): Promise<void> => {
    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false,
            useCORS: true,
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // Add header
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('System History Report', 15, 20);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Generated: ${metadata.timestamp}`, 15, 27);

        // Add chart image
        const imgWidth = 180;
        const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 200);
        pdf.addImage(imgData, 'PNG', 15, 35, imgWidth, imgHeight);

        // Add statistics table
        let tableY = 35 + imgHeight + 10;
        if (tableY > 260) { pdf.addPage(); tableY = 20; }
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Statistics', 15, tableY);

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const statsData = [
            ['Current', stats.current],
            ['Average', stats.avg],
            ['Maximum', stats.max],
            ['Minimum', stats.min],
        ];

        let currentY = tableY + 7;
        statsData.forEach(([label, value]) => {
            pdf.text(`${label}:`, 20, currentY);
            pdf.text(value, 60, currentY);
            currentY += 6;
        });

        // Add metadata footer
        const footerY = currentY + 10;
        pdf.setFontSize(9);
        pdf.setTextColor(100);
        pdf.text(`Metric: ${metadata.metricName}`, 15, footerY);
        pdf.text(`Time Frame: ${metadata.timeFrame}`, 15, footerY + 5);
        pdf.text(`Server: ${metadata.serverSelection}`, 15, footerY + 10);

        pdf.save(`${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`);
    } catch (error) {
        console.error('Error exporting as PDF:', error);
        throw new Error('Failed to export as PDF');
    }
};

/**
 * Export data as Excel file
 */
export const exportDataAsExcel = (
    data: Array<{ time: string; value: number }>,
    metadata: {
        metricName: string;
        metricUnit: string;
        timeFrame: string;
        serverSelection: string;
        timestamp: string;
    },
    stats: {
        current: string;
        avg: string;
        max: string;
        min: string;
    },
    filename: string
): void => {
    try {
        const workbook = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            ['System History Export'],
            ['Generated:', metadata.timestamp],
            [''],
            ['Metric:', metadata.metricName],
            ['Time Frame:', metadata.timeFrame],
            ['Server Selection:', metadata.serverSelection],
            [''],
            ['Statistics'],
            ['Current:', stats.current],
            ['Average:', stats.avg],
            ['Maximum:', stats.max],
            ['Minimum:', stats.min],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

        // Data sheet
        const dataForExcel = [
            ['Time', 'Value', 'Metric'],
            ...data.map((d) => [d.time, d.value, metadata.metricName]),
        ];
        const dataSheet = XLSX.utils.aoa_to_sheet(dataForExcel);
        XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data');

        XLSX.writeFile(workbook, `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.xlsx`);
    } catch (error) {
        console.error('Error exporting as Excel:', error);
        throw new Error('Failed to export as Excel');
    }
};

/**
 * Export data as CSV file
 */
export const exportDataAsCSV = (
    data: Array<{ time: string; value: number }>,
    metadata: {
        metricName: string;
        timeFrame: string;
        serverSelection: string;
        timestamp: string;
    },
    filename: string
): void => {
    try {
        const headers = ['Time', 'Value', 'Metric'];
        const rows = data.map((d) => [d.time, d.value.toString(), metadata.metricName]);

        const csvContent = [
            `# System History Export`,
            `# Generated: ${metadata.timestamp}`,
            `# Metric: ${metadata.metricName}`,
            `# Time Frame: ${metadata.timeFrame}`,
            `# Server: ${metadata.serverSelection}`,
            '',
            headers.map(h => csvSafe(h)).join(','),
            ...rows.map((row) => row.map(cell => csvSafe(cell)).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error exporting as CSV:', error);
        throw new Error('Failed to export as CSV');
    }
};

/**
 * Export data as JSON file
 */
export const exportDataAsJSON = (
    data: Array<{ time: string; value: number }>,
    metadata: {
        metricName: string;
        metricUnit: string;
        timeFrame: string;
        serverSelection: string;
        timestamp: string;
    },
    stats: {
        current: string;
        avg: string;
        max: string;
        min: string;
    },
    filename: string
): void => {
    try {
        const jsonData = {
            export_info: {
                generated_at: metadata.timestamp,
                tool: 'Argus System Monitor',
            },
            metadata: {
                metric: metadata.metricName,
                unit: metadata.metricUnit,
                time_frame: metadata.timeFrame,
                server_selection: metadata.serverSelection,
            },
            statistics: {
                current: parseFloat(stats.current),
                average: parseFloat(stats.avg),
                maximum: parseFloat(stats.max),
                minimum: parseFloat(stats.min),
            },
            data: data,
            total_records: data.length,
        };

        const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
            type: 'application/json',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`;
        link.click();
        URL.revokeObjectURL(link.href);
    } catch (error) {
        console.error('Error exporting as JSON:', error);
        throw new Error('Failed to export as JSON');
    }
};
