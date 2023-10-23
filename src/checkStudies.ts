
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

const changeMembers = [
  '0987361767',
  '0987361767',
  '0987361767',
  '0987361767',
  '0978397807',
  '0952425202',
  '0933792729',
  '0930805460',
  '0930805460',
  '0930805460',
  '0930805460',
  '0930805460',
  '0930805460',
  '0929281295',
  '0929281295',
  '0929281295',
  '0929281295',
  '0929281295',
  '0929281295',
  '0919706600',

]

const orignSerials = [
  'NC220538',
  'NC220540',
  'NC220543',
  'NC220548',
  'NC220546',
  'NC220548',
  'NC220541',
  'NC230007',
  'NC230008',
  'NC220404',
  'NC220405',
  'NC220406',
  'NC220408',
  'NC220579',
  'NC220538',
  'NC220541',
  'NC220544',
  'NC220545',
  'NC220540',
  'NC220575',
]
const changeSerials = [
  'NC220375',
  'NC220377',
  'NC220379',
  'NC220369',
  'NC220375',
  'NC220375',
  'NC220375',
  'NC220375',
  'NC220377',
  'NC220379',
  'NC220369',
  'NC220372',
  'NC220374',
  'NC220375',
  'NC220377',
  'NC220379',
  'NC220369',
  'NC220372',
  'NC220374',
  'NC220375',

]

async function getCollection(collection: string) {
  // const db = client.db('icare_elearning_v15');
  const db = client.db(dbname);

  const licenseCol = db.collection(collection);
  return licenseCol
}

async function checkStudies(account: string, serial: string) {
  await client.connect();
  const courseC = await getCollection('courses')
  const ordersC = await getCollection('orders')
  const studiesC = await getCollection('studies')
  const courseUserC = await getCollection('courseusers')
  const user = await courseUserC.findOne({ account })


  console.log('serial', serial, 'account', account)
  const courses = await courseC.find({ serial }).thren()
  const courseUser = await courseUserC.findOne({ account })

  const studies = await studiesC.findOne({ userId: courseUser._id, course: courses._id }, { finished: 1, quizStatus: 1 })

  const accounts = await courseUser.aggregation([
    {
      $match: {
        account: account
      },

    },
    {
      $lookup: {
        from: 'courseusers',
        localField: '_id',
        foreignField: 'userId',
        as: 'user'
      }
    },

  ])

  return studies

}

async function loop(members: string[], serials: string[]) {

  let status
  for (const i of members) {
    for (const j of serials) {
      // console.log(i)
      const replaceC = changeCourse(changeMembers, changeSerials, orignSerials, i, j)
      if (replaceC) {
        status = await checkStudies(i, j)
      } else {
        status = await checkStudies(i, j)

      }
      if (status) {
        result.push(status)
      }
    }
  }
  console.log('end')
  console.log('result')
  exportToExcel(filename, result);

}

const members = [
  '0928203845',
  '0928741585',
  '0988247098',
  '0933792729',
  '0988785261',
  '0966214588',
  '0976164856',
  '0910175688',
  '0929281295',
  '0955309722',
  '0975456094',
  '0986706258',
  '0987361767',
  '0952425202',
  '0919706600',
  '0913538995',
  '0981807733',
  '0932178647',
  '0915996770',
  '0968565258',
  '0968285258',
  '0939826301',
  '0930805460',
  '0911866137',
  '0978397807',
]

const serial = [
  'NC220375',
  'NC220377',
  'NC220379',
  'NC220369',
  'NC220375',
  'NC220375',
  'NC220375',
  'NC220375',
  'NC220377',
  'NC220379',
  'NC220369',
  'NC220372',
  'NC220374',
  'NC220375',
  'NC220377',
  'NC220379',
  'NC220369',
  'NC220372',
  'NC220374',
  'NC220375',
]
loop(members, serial)


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


function changeCourse(changeMembers: string[], changeSerials: string[], orignSerials: string[], member: string, course: string) {

  let index = changeMembers.indexOf(member);

  if (index !== -1) {
    return false
  } else {

    const replacement = findAllIndices(changeMembers, changeSerials, orignSerials, member, course)
    if (replacement) {

      return replacement
    } else {
      return course
    }

  }


}


function findAllIndices(changeMembers: string[], changeSerials: string[], orignSerials: string[], member: string, course: string): string {
  let indices: number[] = [];
  let replaceCourse: any = false
  changeMembers.forEach((element, index) => {
    if (element === member) {
      if (orignSerials[index] === course) {
        replaceCourse = changeSerials[index]
      }
      // indices.push(index);
    }
  });
  return replaceCourse;
}
const filename = `studies_${now.getMilliseconds()}.xlsx`;


