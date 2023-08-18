import * as ExcelJS from 'exceljs';


const now = new Date()

async function exportToExcel(filename: string, data: any) {

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');

  // Set headers
  const headers = Object.keys(data[0]);
  worksheet.getRow(1).values = headers;

  // Add data rows
  data.forEach((item: any, index: any) => {
    const row = worksheet.addRow(Object.values(item));
    row.font = { bold: false };
  });

  // Auto fit columns
  worksheet.columns.forEach((column) => {
    const header = column.header as string | undefined;
    if (header) {
      column.width = header.length < 12 ? 12 : header.length;
    }
  });

  // Save workbook to file
  await workbook.xlsx.writeFile(filename);
  console.log('Excel file exported successfully.');
}

