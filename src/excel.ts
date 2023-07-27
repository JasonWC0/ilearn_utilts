import * as fs from "fs"
import Papa from 'papaparse';
import ExcelJS from 'exceljs';

interface RowData {
    [key: string]: string | number;
}

// CSV檔轉成Xlsx
export async function csvToExcel(csvFilePath: string, outputFilePath: string) {
    // 读取CSV文件内容
    const csvData = fs.readFileSync(csvFilePath, 'utf-8');

    // 解析CSV数据
    const parsedData = Papa.parse<RowData>(csvData, {
        header: true, // 第一行为标题
    });

    // 创建Excel工作簿和工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 将CSV标题行写入工作表
    const headerRow = worksheet.addRow(Object.keys(parsedData.data[0]));

    // 设置标题行样式
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
    });

    // 将CSV数据写入工作表
    parsedData.data.forEach((row) => {
        worksheet.addRow(Object.values(row));
    });

    // 将数据写入文件
    await workbook.xlsx.writeFile(outputFilePath);
}



//增加標頭灰底白字、篩選功能、凍結表格跟欄位長度(單個excel檔)
export async function addFrozenPanesAndHeaderWithFilter(inputFilePath: string, outputFilePath: string) {
    // Load the existing Excel workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputFilePath);

    // Get the first worksheet
    const worksheet = workbook.getWorksheet(1);

    // Set frozen panes
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Add header row and set style
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; // White font color and bold text
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } }; // Gray background color
    });

    // Determine the data range (excluding the header row)
    const startCell = worksheet.getCell('A1');
    const endCell = worksheet.getCell(worksheet.rowCount, worksheet.columnCount);
    const dataRange = startCell.address + ':' + endCell.address;

    // Enable autoFilter on the entire data range
    worksheet.autoFilter = dataRange;
    worksheet.columns.forEach((column) => {

        column.width = 25; // Set the column width, adding some extra space (2) and limiting it to a maximum width of 50
    });
    // Save the updated workbook to the output file
    await workbook.xlsx.writeFile(outputFilePath);
}


// 刪除csv檔

export async function deleteCSVFile(filePath: string) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting the CSV file:', err);
        } else {
            console.log('CSV file deleted successfully!');
        }
    });
}

// 刪除xlsx檔
export async function deleteXLSXFile(filePath: string) {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error('Error deleting the XLSX file:', err);
        } else {
            console.log('XLSX file deleted successfully!');
        }
    });
}