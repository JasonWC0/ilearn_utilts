import * as request from 'request'

import { MongoClient } from 'mongodb';
const fs = require('fs');
const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });
const endPoint = `https://icarechat.compal-health.com/api/v1/chat-rooms`


async function getCollection(collection: string) {
  const db = client.db('icare_elearning_v15');
  // const db = client.db('icare_elearning');
  const licenseCol = db.collection(collection);
  return licenseCol
}

function logMessage(message: string): void {
  const timestamp = new Date().toISOString();
  const log = `${timestamp} - ${message}`;

  console.log(log);

  // 將log寫入檔案或其他目的地
  fs.appendFileSync('logs.log', log + '\n');
}

export const closeChatRoom = async (chatRoomId: string): Promise<any> => {

  console.log(`${endPoint}/${chatRoomId}/status/close`)
  return new Promise((resolve, reject) => {
    return request.patch(`${endPoint}/${chatRoomId}/status/close`, (err: any, res: any, body: any) => {
      if (err) { reject(err) }

      try {
        const { code, message, result } = JSON.parse(body)
        console.log('closeChatRoom')
        if (code && message) { throw new Error(message) }

        return resolve(result)
      } catch (err) {
        console.error('closeChatRoom catch err', err)
        return reject('err')
      }
    })
  })
}

function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(date.getDate() - days);
  return result;
}

export async function offline() {
  try {
    await client.connect();

    const courssesC = await getCollection("courses")
    const courseplanC = await getCollection('courseplans')
    const productC = await getCollection('products')
    const currentDate = new Date();
    const threeDaysAfter = new Date(currentDate.getTime() + (3 * 24 * 60 * 60 * 1000));
    const OneDaysAgo = new Date(currentDate.getTime() - (1 * 24 * 60 * 60 * 1000));


    const query = { 'creditSerialEndAt': { $gte: OneDaysAgo, $lt: threeDaysAfter } };
    console.log(query)
    const overedueCourses = await courssesC.find(query).toArray();

    const overeSerials = overedueCourses.map((x: { serial: any; }) => x.serial)
    const overdueCoursePlan = await courseplanC.find({ serial: { $in: overeSerials } }).toArray()
    const now = new Date()
    const packages: string[] = []
    const productId: any[] = []
    const allOverdue: any[] = []
    const overduelSerial = await Promise.all(overdueCoursePlan.map(async (coursePlan: any) => {

      if (coursePlan.type === "LIVE") {
        // if (new Date(coursePlan.liveInfo.startAt).getTime() < now)
        allOverdue.push({ serial: coursePlan.serial, type: 'LIIVE' })
        return 'LIVE'
      }

      if (coursePlan.status == 'OFFLINE') {
        allOverdue.push({ serial: coursePlan.serial, type: 'OFFLINE' })
        return 'offline'

      }
      // if (coursePlan.type === "LIVE") {
      //   const closeChatRoomRes = await closeChatRoom((coursePlan.liveInfo.chatRoomId as Types.ObjectId).toString())
      //   console.log(closeChatRoomRes)
      // }
      const course = await courssesC.findOne({ serial: coursePlan.serial })
      productId.push(course.productId)
      const coursePackge = await courssesC.find({ type: 'PACKAGE', packages: course._id }).toArray()

      for (let i in coursePackge) {
        if (coursePackge) {
          console.log(coursePackge)
          packages.push(coursePackge[i].serial)
        }
      }

      return coursePlan.serial;
    }));

    console.log('productId', productId)
    console.log('overeserial', overduelSerial)
    console.log('packages', packages)
    console.log('all', allOverdue)
    const rr = await courseplanC.find({ serial: { $in: overduelSerial } }).toArray()

    await courseplanC.updateMany({ serial: { $in: overduelSerial } }, { $set: { status: "OFFLINE" } })
    await courssesC.updateMany({ serial: { $in: overduelSerial } }, { $set: { offlineTime: now, online: false } })
    await courseplanC.updateMany({ serial: { $in: packages } }, { $set: { status: "OFFLINE" } })
    await courssesC.updateMany({ serial: { $in: packages } }, { $set: { offlineTime: now, online: false } })
    await productC.updateMany({ _id: { $in: productId } }, { $set: { status: 'OFFLINE' } })

    await client.close();
  }

  catch (err) {
    console.log(err)
  }


}

offline()