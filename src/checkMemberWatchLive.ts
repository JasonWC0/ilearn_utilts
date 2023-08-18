// 確認有沒有上直播課並開啟
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

async function checkWatchLive(account: string, serial: string) {
  await client.connect();
  const courseUserC = await getCollection('courseusers')
  const courseC = await getCollection('courses')
  const ChatRoomUsersC = await getCollection('ChatRoomUsers')
  const studies = await getCollection('studies')
  const fiveMinutes = 5 * 60 * 1000
  const user = await courseUserC.findOne({ account })
  const course = await courseC.findOne({ serial })
  // console.log('course.chatRoomId', course.liveInfo.chatRoomId)
  const chatRoomCheckin = await ChatRoomUsersC.find({ userId: user._id, chatRoomId: course.liveInfo.chatRoomId }).sort({ joinedAt: 1 }).toArray()

  if (chatRoomCheckin.length === 0) {
    return {
      finished: false,
      account: user.account,
      course: course.serial,
      joinedAt: null,
      leftAt: null
    }
  }
  const chatRoomCheckout = await ChatRoomUsersC.find({
    userId: user._id, chatRoomId: course.liveInfo.chatRoomId
  }).sort({ leftAt: - 1 }).toArray()
  // const chatRoomValidCheckin = await ChatRoomUsersC.find({ userId: user._id, chatRoomId: course.liveInfo.chatRoomId, joinedAt: { $lt: new Date(course.liveInfo.courseStartAt.getTime() - 10 * 60 * 1000) } }).sort({ joinedAt: 1 }).toArray()
  const chatRoomValidCheckin = await ChatRoomUsersC.find({
    userId: user._id,
    chatRoomId: course.liveInfo.chatRoomId,
    joinedAt: { $lt: new Date(course.liveInfo.courseStartAt.getTime() + fiveMinutes) },
    leftAt: { $gt: course.liveInfo.courseStartAt }
  }).toArray();

  if (chatRoomValidCheckin.length === 0) {
    let joinedAt = null;
    let leftAt = null;
    console.log('bugIn', chatRoomCheckin[0]);

    if (chatRoomCheckin[0]) {
      joinedAt = new Date(chatRoomCheckin[0].joinedAt);
      leftAt = new Date(chatRoomCheckout[0].leftAt);
    }

    return {
      finished: false,
      account: user.account,
      course: course.serial,
      joinedAt: joinedAt,
      leftAt: leftAt
    }
  }


  const chatRoomValidCheckout = await ChatRoomUsersC.find({
    userId: user._id,
    chatRoomId: course.liveInfo.chatRoomId,
    joinedAt: { $lt: course.liveInfo.courseEndAt },
    leftAt: { $gt: new Date(course.liveInfo.courseEndAt.getTime() - fiveMinutes) }
  }).toArray();

  if (chatRoomValidCheckout.length === 0) {
    let joinedAt = null;
    let leftAt = null;

    if (chatRoomCheckin[0]) {
      joinedAt = new Date(chatRoomCheckin[0].joinedAt);
      leftAt = new Date(chatRoomCheckout[0].leftAt);
    }

    console.log('bugOut', chatRoomCheckin[0]);
    return {
      finished: false,
      account: user.account,
      course: course.serial,
      joinedAt: joinedAt,
      leftAt: leftAt
    }
  }


  // console.log('chatRoomJion', 'chatRoomLeft', chatRoomValidCheckin[0].joinedAt, chatRoomValidCheckout[0].leftAt, {
  //   finished: true,
  //   account: user.account,
  //   course: course.serial,
  //   joinedAt: new Date(chatRoomCheckin[0].joinedAt.getTime() + 8 * 60 * 60 * 1000 - chatRoomCheckin[0].joinedAt.getTimezoneOffset() * 60 * 1000),
  //   leftAt: new Date(chatRoomCheckout[0].leftAt.getTime() + 8 * 60 * 60 * 1000 - chatRoomCheckout[0].leftAt.getTimezoneOffset() * 60 * 1000)
  // }
  // )

  const study = await studies.findOne({ userId: user._id, course: course._id })

  console.log('study', study)
  if (!study.finished) {
    await studies.updateOne(
      { userId: user._id, course: course._id },
      {
        $set: {
          "finished": true,
          "startDate": course.liveInfo.courseStartAt,
          "endDate": course.liveInfo.courseEndAt,
          "totalProgress": course.liveInfo.duration,
          "quizStatus": "NOT",
        }
      }
    )

    console.log('符合')
  }


  return {
    finished: true,
    account: user.account,
    course: course.serial,
    joinedAt: new Date(chatRoomCheckin[0].joinedAt.getTime() + 8 * 60 * 60 * 1000 - chatRoomCheckin[0].joinedAt.getTimezoneOffset() * 60 * 1000),
    leftAt: new Date(chatRoomCheckout[0].leftAt.getTime() + 8 * 60 * 60 * 1000 - chatRoomCheckout[0].leftAt.getTimezoneOffset() * 60 * 1000)
  }

  await client.close()

}

checkWatchLive('0906127698', 'NC230128')
// loop('NC230100')

async function loop(serial: string) {
  await client.connect();
  const courseC = await getCollection('courses')
  const studiesC = await getCollection('studies')
  const courseUserC = await getCollection('courseusers')

  const course = await courseC.findOne({ serial })

  const studies = await studiesC.find({ course: course._id }).toArray()
  for (const i of studies) {
    // console.log(i)
    if (i.finished == false && i.quizStatus != 'APPLYING' && i.quizStatus != 'PASS') {
      const user = await courseUserC.findOne({ _id: i.userId })
      const re = await checkWatchLive(user.account, serial)
      result.push(re)
    }

  }
  console.log('end')
  // console.log('result', result)
  exportToExcel(filename, result);
}
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
const filename = `studies${now.getMilliseconds()}.xlsx`;
