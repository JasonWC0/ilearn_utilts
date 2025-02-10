import { DB } from './shane/database';
import ExcelJS from 'exceljs';
import moment from 'moment';

/**
 * 找出研究開始日
 * @param {string} filePath 匯入檔案路徑
 * @returns {string} 研究開始日
 */

export async function findStudyStartDay() {
  try {
    const result = [];
    const ecDbClient = new DB(true, false);
    const ecDb = await ecDbClient.dbConnect();
    const ordersDB = ecDb.collection('orders');
    //const courses = ecDb.collection('courses');
    //const studies = ecDb.collection('studies');
    //const excelInfos = await readExcel('test.xlsx', 0);
    const validExpressTickets = await ordersDB
      .aggregate([
        {
          $match: {
            paid: true,
            status: 1,
            'invoice.iis_number': { $ne: '', $exists: true },
          },
        },
        {
          $lookup: {
            from: 'courseusers',
            localField: 'userId',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: '$user',
        },
        {
          $project: {
            購買人: '$user.name',
            帳號: '$user.account',
            發票號碼: '$invoice.iis_number',
            '收費總額(含稅)': { $ifNull: ['$paymentRes.amount', '$payment.totalAmount'] },
            '收費總額(未稅)': '',
            '收費總額(稅金)': '',
            發票開立日: '$invoice.iis_create_date',
            開立公司: '$payeeCompany',
          },
        },
      ])
      .toArray();

    let res = validExpressTickets.map((item: any) => {
      const issuedDate = moment(item['發票開立日']).toDate();
      if (issuedDate < new Date('2023-01-01')) {
        return null;
      }
      const amount = Number(item['收費總額(含稅)']);
      return {
        購買人: item['購買人'],
        帳號: item['帳號'],
        發票號碼: item['發票號碼'],
        '收費總額(含稅)': amount,
        '收費總額(未稅)': Math.floor(amount * 0.95),
        '收費總額(稅金)': amount - Math.floor(amount * 0.95),
        發票開立日: moment(item['發票開立日']).toDate(),
        開立公司: item['開立公司'] || '仁寶',
      };
    });

    res = res.filter((item: any) => item !== null);

    await exportToExcel('ILearn發票清單-20241115-jason.xlsx', res);
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
findStudyStartDay();
