import { readExcel } from '../utils/readExcel';
import { DB } from './shane/database';
import ExcelJS from 'exceljs';

/**
 * 找出研究開始日
 * @param {string} filePath 匯入檔案路徑
 * @returns {string} 研究開始日
 */

export async function findStudyStartDay(filePath: string) {
  try {
    const result = [];
    const ecDbClient = new DB(true, false);
    const ecDb = await ecDbClient.dbConnect();
    const expresstickets = ecDb.collection('expresstickets');
    //const courses = ecDb.collection('courses');
    //const studies = ecDb.collection('studies');
    //const excelInfos = await readExcel('test.xlsx', 0);
    const validExpressTickets = await expresstickets.find({ status: 1 }).toArray();
    //for (const excelInfo of excelInfos) {
    //  const id = excelInfo['身分證字號'].trim();
    //  const userInfo = await courseusers.findOne({ personalId: id, account: /09/ }, { sort: { _id: -1 } });
    //  const studieInfo = await studies.findOne({ userId: userInfo._id, quizStatus: 'VERIFYING', creditSerial: excelInfo['課程字號'].trim() });
    //  //  console.log(userInfo.account);
    //  if (!studieInfo) {
    //    //console.log(studieInfo.startDate);
    //    console.log(id, excelInfo['課程字號'], userInfo.account, userInfo._id.toString());
    //    result.push({ ...excelInfo, 開始日期: '查無資料' });
    //    continue;
    //  }

    //  console.log(studieInfo.startDate);
    //  result.push({ ...excelInfo, 開始日期: studieInfo.startDate });
    //}

    await exportToExcel('可用即享券清單-20240911-jason.xlsx', validExpressTickets);
  } catch (err: any) {
    throw new Error(err);
  }
}

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
  worksheet.columns.forEach(column => {
    const header = column.header as string | undefined;
    if (header) {
      column.width = header.length < 12 ? 12 : header.length;
    }
  });

  // Save workbook to file
  await workbook.xlsx.writeFile(filename);
  console.log('Excel file exported successfully.');
}
findStudyStartDay('test.xlsx');
