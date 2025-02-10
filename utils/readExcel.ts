import XLSX from 'xlsx';
import fs from 'fs';

/**
 * 讀取 Excel 檔案
 * @param {binaryFile} inputFile 匯入檔案
 * @returns {object[]} 發票資料
 */
const EMPTY_CELL = '';
const FIRST_INDEX = 0;
/**
 * 讀取 Excel 檔案
 * @param filePath 匯入檔案路徑
 * @param headerRow 標題在第幾列
 * @returns
 */
export async function readExcel(filePath: string, headerRow = 0): Promise<any[]> {
  try {
    // STEP_01.03: 讀取匯入報表
    const inputFile = fs.readFileSync(filePath);
    const workbook = XLSX.read(inputFile, { type: 'buffer' });
    // STEP_01.02: 取得第一個工作表名稱
    const sheetName = workbook.SheetNames[FIRST_INDEX];
    // STEP_01.03: 將資料轉換為 JSON 格式
    const excelInfos = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: EMPTY_CELL });
    // STEP_02.01: 取得報表標題
    const header: any = excelInfos[headerRow];
    const newHeaders = header.map((cell: any) => {
      return cell.toString().trim();
    });
    // STEP_03.01: 以新標題重新轉換資料
    const excelInfosWithNewHeader = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: newHeaders,
      defval: EMPTY_CELL,
    });

    excelInfosWithNewHeader.shift();
    return excelInfosWithNewHeader;
  } catch (err: any) {
    throw new Error(err);
  }
}
