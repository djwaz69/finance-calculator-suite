/**
 * Shared utility functions for exporting charts, tables, and data to PDF and Excel.
 * Decouples export libraries (jspdf, html2canvas, xlsx) from the UI components.
 */

// Common watermark function
export function addWatermark(pdf) {
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.saveGraphicsState();
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 200, 200);
    pdf.text(
        'Illustration Purpose Only',
        pdfWidth / 2,
        pdfHeight * 0.76,
        { align: 'center', angle: 30 }
    );
    pdf.restoreGraphicsState();
}

/**
 * Reusable function to export a React ref container to a multi-page PDF.
 * @param {HTMLElement} domElement - The DOM node to capture
 * @param {String} fileName - Desired output filename
 * @param {Function} buildSummaryPage - Callback to build the first summary page
 */
export async function exportElementToPDF(domElement, fileName, buildSummaryPage) {
    if (!domElement) return;
    
    // We lazy-load these large libraries
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    // Attempt to temporarily expand any scrollable table containers inside the element
    // by looking for a specific class or just expanding the first immediate child if it has overflow.
    // A clean generic way: find elements with scroll height > client height
    const scrollables = Array.from(domElement.querySelectorAll('*')).filter(
        el => el.scrollHeight > el.clientHeight && el.tagName !== 'TR' && el.tagName !== 'TBODY'
    );
    
    const origStyles = scrollables.map(el => ({
        el,
        maxHeight: el.style.maxHeight,
        overflowY: el.style.overflowY
    }));

    scrollables.forEach(item => {
        item.el.style.maxHeight = 'none';
        item.el.style.overflowY = 'visible';
    });

    // Let the DOM repaint
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const canvas = await html2canvas(domElement, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
    });

    // Restore styles
    origStyles.forEach(item => {
        item.el.style.maxHeight = item.maxHeight;
        item.el.style.overflowY = item.overflowY;
    });

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Build the Summary Page
    if (buildSummaryPage) {
        buildSummaryPage(pdf, pdfWidth, pdfHeight);
    }
    addWatermark(pdf);

    // Build the Chart & Table Pages
    const imgData = canvas.toDataURL('image/png');
    const imgW = pdfWidth;
    const imgH = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgH;
    let position = 0;

    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
    addWatermark(pdf);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
        addWatermark(pdf);
        heightLeft -= pdfHeight;
    }

    pdf.save(fileName);
}

/**
 * Reusable function to export a table to PDF using jspdf-autotable.
 * @param {Array} columns - Array of column titles e.g. ["Month", "EMI"]
 * @param {Array} rows - Array of arrays for table data
 * @param {String} fileName - The desired PDF filename
 * @param {String} title - the title text for the pdf
 * @param {Array} summaryData - optional array of arrays for the top summary
 */
export async function exportDataToPDF(columns, rows, fileName, title = 'Report', summaryData = null) {
    try {
        const { jsPDF } = await import('jspdf');
        await import('jspdf-autotable');

        const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();

        // Add Title
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        pdf.text(title, pdfWidth / 2, 40, { align: 'center' });

        let startY = 60;

        // Add Summary List if provided
        if (summaryData) {
            pdf.autoTable({
                startY: startY,
                body: summaryData,
                theme: 'plain',
                styles: { fontSize: 11, cellPadding: 3 },
                columnStyles: {
                    0: { fontStyle: 'bold', halign: 'right', cellWidth: 150 },
                    1: { halign: 'left' }
                },
                margin: { left: pdfWidth / 2 - 120 }
            });
            startY = pdf.lastAutoTable.finalY + 20;
        }

        // Add Data Table
        if (rows && rows.length > 0) {
            pdf.autoTable({
                startY: startY,
                head: [columns],
                body: rows,
                theme: 'striped',
                headStyles: { fillColor: [0, 122, 255] },
                styles: { fontSize: 10, cellPadding: 5, halign: 'center' },
                didDrawPage: (data) => {
                    addWatermark(pdf);
                }
            });
        }

        pdf.save(fileName);
    } catch (err) {
        console.error('PDF table export failed:', err);
        alert('Failed to generate export: ' + err.message);
    }
}

/**
 * Reusable function to export a 2D array or array of objects to Excel.
 * @param {Array} data - Array of arrays OR array of objects
 * @param {String} fileName - Desired output filename
 * @param {String} sheetName - Name of the worksheet
 * @param {String} mode - 'aoa' (array of arrays) or 'json' (array of objects)
 */
export async function exportDataToExcel(data, fileName, sheetName, mode = 'aoa') {
    try {
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName);

        if (mode === 'json') {
            if (data && data.length > 0) {
                const keys = Object.keys(data[0]);
                worksheet.columns = keys.map(key => ({ header: key, key: key }));
                data.forEach(row => worksheet.addRow(row));
            }
        } else {
            // Mode aoa (Array of Arrays)
            data.forEach(row => worksheet.addRow(row));
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error('Excel export failed:', err);
        alert('Failed to export to Excel: ' + err.message);
    }
}
