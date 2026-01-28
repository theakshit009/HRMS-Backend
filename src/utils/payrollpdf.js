import PDFDocument from "pdfkit";

export const generatePayrollPDF = (payroll, month, year, res) => {
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payroll-${month}-${year}.pdf`
  );

  doc.pipe(res);

  doc.fontSize(18).text(`Payroll Report - ${month}/${year}`, {
    align: "center",
  });

  doc.moveDown();

  payroll.forEach(emp => {
    doc
      .fontSize(12)
      .text(`Employee: ${emp.name}`)
      .text(`Present: ${emp.present}`)
      .text(`Absent: ${emp.absent}`)
      .text(`Unpaid Leaves: ${emp.unpaidLeaves}`)
      .text(`Salary: ₹${emp.salary}`)
      .moveDown();
  });

  doc.end();
};
