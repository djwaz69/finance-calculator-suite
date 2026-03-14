import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Exports the given HTML element (by ID) to a PDF
 * with a permanent watermark on all pages.
 */
const exportPDFWithWatermark = async (elementId = "pdf-content") => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error(`Element with ID "${elementId}" not found.`);
    return;
  }

  const canvas = await html2canvas(input, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgProps = pdf.getImageProperties(imgData);
  const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  while (heightLeft > 0) {
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);

    // Watermark
    pdf.setTextColor(150, 150, 150); // Simulated 40% opacity
    pdf.setFontSize(32);
    pdf.setFont("helvetica", "bold");
    pdf.text("Illustration Purpose Only", pageWidth / 2, pageHeight / 2, {
      align: "center",
      angle: 45,
    });

    heightLeft -= pageHeight;
    if (heightLeft > 0) {
      pdf.addPage();
      position = position - pageHeight;
    }
  }

  pdf.save("Loan_Amortization.pdf");
};

export default exportPDFWithWatermark;
