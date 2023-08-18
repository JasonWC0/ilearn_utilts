import * as request from 'request'

import { MongoClient } from 'mongodb';
const fs = require('fs');
const test = true
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

async function finbdWrongOrder() {
  let result: any[] = []
  await client.connect();
  const courseUserC = await getCollection('courseusers')
  const courseC = await getCollection('courses')
  const studiesC = await getCollection('studies')
  const ordersC = await getCollection('orders')
  const creditappliesC = await getCollection('creditapplies')
  const creditApplies = await creditappliesC.find(
    { orderId: { $exists: true, $ne: null } },
    { projection: { _id: 1, study: 1, course: 1 } }
  ).toArray()

  for (let creditApplie of creditApplies) {
    // console.log(creditApplie)
    const studiesApply = await studiesC.findOne({ _id: creditApplie.study })
    const courseApply = await courseC.findOne({ _id: creditApplie.study })

  }
  console.log('creditapplies', creditApplies)
  await client.close()

}

finbdWrongOrder()