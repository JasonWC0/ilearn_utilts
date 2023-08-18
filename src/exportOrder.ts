
import { MongoClient } from 'mongodb';
const fs = require('fs');
const test = false
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

async function checkOrder(tradeNo: string) {
  await client.connect();
  const orderC = await getCollection('orders')
  const orders = await orderC.aggregate([{
    $match: {
      tradeNo: tradeNo
    }
  },
  {
    $lookup: {
      from: 'courses',
      localField: 'course',
      foreignField: '_id',
      as: 'course'
    }
  },
  {
    $unwind: "$course"
  },
  {
    $lookup: {
      from: 'courseusers',
      localField: 'userId',
      foreignField: '_id',
      as: 'user'
    }
  },
  {
    $unwind: "$user"
  },
  {
    $project: {
      使用者帳號: '$user.account',
      使用者姓名: '$user.name',
      訂單序號: '$tradeNo',
      課程字號: '$course.creditSerial',
      課程字號到期日: '$course.creditSerialEndAt',
      課程序號: '$course.serial',

    }
  }
  ]).toArray()
  console.log('orders', orders)
  result.push(...orders)


}


async function work() {
  await checkOrder('L202301120273H91')
  await checkOrder('L202301140032H11')
  await exportToExcel(filename, result)
}
import * as ExcelJS from 'exceljs';
import { judge, serials } from './judgeDuplicate';


const now = new Date()

async function exportToExcel(filename: string, data: any) {
  if (data.length === 0) {
    console.error('Data array is empty.');
    return;
  }

  // Get all unique properties from the objects
  const allProperties = [...new Set(data.flatMap((item: any) => Object.keys(item)))];

  // Fill missing properties with ' ' for each object
  data.forEach((item: any) => {
    allProperties.forEach((prop: any) => {
      if (!item.hasOwnProperty(prop)) {
        item[prop] = ' ';
      }
    });
  });

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');

  // Set headers
  worksheet.getRow(1).values = allProperties as ExcelJS.CellValue[];


  // Add data rows
  data.forEach((item: any) => {
    const row = worksheet.addRow(allProperties.map((prop: any) => item[prop]));
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

const filename = `order${now.getMilliseconds()}.xlsx`;
work()