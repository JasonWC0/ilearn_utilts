import XlsxPopulate from 'xlsx-populate';
import { DB } from './database';

async function main() {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0);
  const ecDbClient = new DB(false, false);
  const ecDb = await ecDbClient.dbConnect();
  const orderdetailDb = ecDb.collection('orderdetails');
  const onlineAndLiveOrders = await orderdetailDb
    .aggregate([
      {
        $match: {
          $or: [{ description: /線上課程/ }, { description: /申請積分手續費/ }],
          checkoutPrice: { $ne: 0 },
        },
      },
      {
        $lookup: {
          from: 'orders',
          localField: 'orderId', // orderdetails 集合中的欄位
          foreignField: '_id', // orders 集合中的對應欄位
          as: 'orders',
        },
      },
      { $unwind: '$orders' },
      { $match: { 'orders.status': 1 } },
    ])
    .toArray();

  //  writeRowBasedReport(workbook, excelArray, columnIdxTable, 1, 0);

  workbook.toFileAsync('受害者名單.xlsx');
  await ecDbClient.dbClose();
}

main();

const columnIdxTable = {
  account: 1,
  name: 2,
  phone: 3,
  email: 4,
  courseName: 5,
  creditPointEndAt: 6,
  type: 7,
  quizStatus: 8,
  checkOutPrice: 9,
};

async function writeRowBasedReport(workbook: any, excelArray: Array<any>, columnIdxTable: any, startRow: number, sheetIdx: number = 1) {
  // STEP_01 讀取Excel template
  const sheet: any = workbook.sheet(sheetIdx);

  // STEP_02.01 將所有資料依序填入報表
  for (const idx in excelArray) {
    const item: any = excelArray[idx];
    const rowIdx: number = parseInt(idx) + startRow;
    // STEP_02.02 將一筆資料中各項數值填入對應欄位
    for (const [key, value] of Object.entries(item)) {
      // STEP_02.03 檢查欄位是否存在於報表中
      if (!columnIdxTable[key]) {
        continue;
      }
      sheet
        .row(rowIdx)
        .cell(columnIdxTable[key])
        .value(value as any);
    }
  }

  // STEP_05 匯出報表
  return;
}
