import XlsxPopulate from 'xlsx-populate';
import { DB } from './database';

async function main() {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0);
  const ecDbClient = new DB(true, false);
  const ecDb = await ecDbClient.dbConnect();
  const orderdetailDb = ecDb.collection('orderdetails');

  const orderdetails = await orderdetailDb.find({ checkoutPrice: { $gt: 0 } }).toArray();

  const studyPairs: any = orderdetails.map((orderdetail: any) => {
    return {
      userId: orderdetail.userId,
      courseId: orderdetail.sourceCourseId,
      checkoutPrice: orderdetail.checkoutPrice,
    };
  });
  const usersDb = ecDb.collection('courseusers');
  const users = await usersDb.find({ _id: { $in: studyPairs.map((studyPair: any) => studyPair.userId) } }, { projection: { name: 1, phone: 1, account: 1, email: 1 } }).toArray();
  const courseIds = studyPairs.map((studyPair: any) => studyPair.courseId);
  const courseDb = ecDb.collection('courses');
  const courses = await courseDb.find({ _id: { $in: courseIds } }, { projection: { serial: 1, name: 1, creditPointEndAt: 1, type: 1 } }).toArray();
  const studyDb = ecDb.collection('studies');
  for (const studyPair of studyPairs) {
    const study = await studyDb.findOne({ userId: studyPair.userId, course: studyPair.courseId });
    const course = courses.find((course: any) => course._id.equals(studyPair.courseId));
    const user = users.find((user: any) => user._id.equals(studyPair.userId));

    if (!study || !course || !user) {
      continue;
    }
    if (course.type === 'LIVE') {
      if (['APPLYING', 'VERIFYING'].includes(study.quizStatus)) {
        studyPair.quizStatus = study.quizStatus;
        studyPair.creditPointEndAt = course.creditPointEndAt;
        studyPair.type = course.type;
        studyPair.name = user.name;
        studyPair.phone = user.phone;
        studyPair.account = user.account;
        studyPair.email = user.email;
        studyPair.courseName = course.name;
      }
    } else if (course.type === 'ONLINE') {
      if (study.quizStatus !== 'APPROVED') {
        studyPair.quizStatus = study.quizStatus;
        studyPair.creditPointEndAt = course.creditPointEndAt;
        studyPair.type = course.type;
        studyPair.name = user.name;
        studyPair.phone = user.phone;
        studyPair.account = user.account;
        studyPair.email = user.email;
        studyPair.courseName = course.name;
      }
    }
  }

  const excelArray: any[] = [];

  for (const studyPair of studyPairs) {
    if (studyPair.quizStatus) {
      excelArray.push(studyPair);
    }
  }
  writeRowBasedReport(workbook, excelArray, columnIdxTable, 1, 0);

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
