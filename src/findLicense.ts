
import { MongoClient } from 'mongodb';
const fs = require('fs');
const test = true
let result: any[] = []
let url
let client: any
let dbname: any
if (test) {
  url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
  dbname = 'icare_elearning_v15'

  client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });
}
else {
  const url = 'mongodb://34.80.83.237:32018/icare_elearning';
  client = new MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });
  dbname = 'icare_elearning'

}


async function getCollection(collection: string) {
  // const db = client.db('icare_elearning_v15');
  const db = client.db(dbname);

  const licenseCol = db.collection(collection);
  return licenseCol
}

async function findLicense(account: string) {
  await client.connect();
  const licensesC = await getCollection('licenses')
  const ordersC = await getCollection('orders')
  const orderDetailC = await getCollection('orderdetails')
  const courseUserC = await getCollection('courseusers')
  const user = await courseUserC.findOne({ account })
  const licensesResult = await courseUserC.aggregate([
    {
      $match: {
        account: account
      }
    },
    {
      $lookup: {
        from: 'licenses',
        localField: '_id',
        foreignField: 'userId',
        as: 'licensesC'
      },
    },
    {
      $project: {
        name: 1,
        account: 1,
        status: '$licensesC.status',
        createdAt: '$licensesC.createdAt'
      }
    }
  ]).toArray();
  const LicenseStatus = {
    VERIFYING: 1,
    PASS: 2,
    UNPASS: 3
  };

  licensesResult.forEach((doc: any) => {
    if (doc.licensesC) {
      doc.licensesC.forEach((license: any) => {
        license.status[0] = Object.keys(LicenseStatus)[license.status - 1];
      });
    }
  });
  if (licensesResult.length != 0) {
    result.push(...licensesResult)
  }
  // await client.close()

}

async function loop(members: string[]) {
  for (const i of members) {
    console.log(i)
    await findLicense(i)
  }
  console.log('end')
  console.log('result', result)
  exportToExcel(filename, result);
}

const members = [
  '0936522227',
  '0933358895',
  '0926363303',
  '0937544383',
  '0965808266',
  '0932074794',
  '0955559904',
  '0953950718',
  '0958102766',
  '0936696739',
  '0937912824',
  '0920177255',
  '0982710502',
  '0911265684',
  '0933124874',
  '0983449905',
]
loop(members)


import * as ExcelJS from 'exceljs';
import { judge, serials } from './judgeDuplicate';


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
const filename = `license_${now.getMilliseconds()}.xlsx`;
