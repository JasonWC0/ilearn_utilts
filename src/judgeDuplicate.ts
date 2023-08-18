import * as request from 'request'

import { MongoClient } from 'mongodb';
const fs = require('fs');
//const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
//const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });

const url = 'mongodb://34.80.83.237:32018/icare_elearning';
const client = new MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });

export const serials = [
  'NC220577','NC230055'
]
	
const user = '0919762792'
async function getCollection(collection: string) {
  // const db = client.db('icare_elearning_v15');
  const db = client.db('icare_elearning');

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

export async function judge(serials: string[]) {
  await client.connect();
  const courseUserC = await getCollection('courseusers')
  const courseC = await getCollection('courses')
  const studiesC = await getCollection('studies')
  const creditAppliesC = await getCollection('creditapplies')
  const now = new Date()
  const importelement: any[] = []
  const canntimport: any[] = []

  for (const i in serials) {
    const CreditSerial = await courseC.findOne({ serial: serials[i] }, { projection: { creditSerial: 1, _id: 0 } })
    // const CreditSerialClass = await courseC.find(CreditSerial, { projection: { creditSerial: 1, serial: 1 } }).toArray()
    const CreditSerialIds = await courseC.find(CreditSerial, { projection: { _id: 1 } }).toArray().then((results) => results.map((doc) => doc._id))
    const userId = await courseUserC.findOne({ account: user }, { projection: { _id: 1 } })
    const conflictStudies = await studiesC.find({ userId: userId._id, course: { $in: CreditSerialIds } }).toArray()
    const conflictCreditApplies = await creditAppliesC.find({ study: conflictStudies[0]._id }).toArray().then((results) => results.map((doc) => doc.status))
    const isAllFail = conflictCreditApplies.every((element) => element === "FAIL");
    const conflictCourse = await courseC.findOne({ _id: conflictStudies[0].course })
    // console.log(conflictStudies[0]._id)


    // let ableImport = true
    // let reason = 'no'
    if (conflictCourse.type == 'ONLINE') {

      // console.log(i, 'ONLINE')

    }
    if (conflictCourse.type == 'LIVE') {
      // console.log(i, 'Live')

      if (conflictStudies[0].finished) {

        if (conflictCourse.creditPointEndAt < now) {
          if (!conflictCreditApplies || isAllFail) {
            importelement.push({ canImport: true, importclass: serials[i], conflictSerial: conflictCourse.serial, type: conflictCourse.type, finish: conflictStudies[0].finished, creditApllies: conflictCreditApplies, canimport: true, creditPointEndAt: conflictCourse.creditPointEndAt, reason: '直播課沒在時間內申請' })
            continue

          }
        }
      }
      if (conflictStudies[0].finished == false) {
        importelement.push({ canImport: true, importclass: serials[i], conflictSerial: conflictCourse.serial, type: conflictCourse.type, finish: conflictStudies[0].finished, creditApllies: conflictCreditApplies, canimport: true, creditPointEndAt: conflictCourse.creditPointEndAt, reason: '直播課沒看完' })
        continue

      }
    }
    importelement.push({ canImport: false, importclass: serials[i], conflictSerial: conflictCourse.serial, type: conflictCourse.type, finish: conflictStudies[0].finished, creditApllies: conflictCreditApplies, canimport: true, creditPointEndAt: conflictCourse.creditPointEndAt, reason: '不能匯' })

  }

  await client.close();

  return importelement

}

judge(serials)