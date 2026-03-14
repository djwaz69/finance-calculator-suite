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
 * Reusable function to export a 2D array or array of objects to Excel.
 * @param {Array} data - Array of arrays OR array of objects
 * @param {String} fileName - Desired output filename
 * @param {String} sheetName - Name of the worksheet
 * @param {String} mode - 'aoa' (array of arrays) or 'json' (array of objects)
 */
export async function exportDataToExcel(data, fileName, sheetName, mode = 'aoa') {
    const XLSX = await import('xlsx');
    
    let ws;
    if (mode === 'json') {
        ws = XLSX.utils.json_to_sheet(data);
    } else {
        ws = XLSX.utils.aoa_to_sheet(data);
    }
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, fileName);
}
