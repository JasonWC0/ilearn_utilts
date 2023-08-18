import * as request from 'request'

import { MongoClient } from 'mongodb';
const fs = require('fs');
const test = false
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

async function _fixOrder(serial: string, account: string) {
  await client.connect();
  const courseUserC = await getCollection('courseusers')
  const ordersC = await getCollection('orders')
  const orderDetailC = await getCollection('orderdetails')
  const courseC = await getCollection('courses')

  const user = await courseUserC.findOne({ account: account })
  const course = await courseC.findOne({ serial: serial })
  // const order = await ordersC
  const order = await ordersC.findOne({ userId: user._id, course: course._id })
  if (!order) {
    console.error(`沒有該筆訂單: serial: ${serial}, account: ${account}`)
    return
 }
  const orderDetaik = await orderDetailC.findOne({ orderId: order._id })
  await orderDetailC.updateOne({ orderId: order._id }, { $set: { specialOffer: 53, checkoutPrice: 53 } })
  await ordersC.updateOne({ _id: order._id }, { $set: { "payment.invoiceItemPrice": 53, "coursebk.0.price": 53, "payment.totalAmount": 53 } })

  // await client.close()
  // console.log(orderDetaik)

}

const users = [
  '0937686831'
]

const serials = [
  'NC220375','NC220377'
]

async function fixOrder(users: Array<string>, serials: Array<string>) {
  
  for(const user of users){
    console.log(user)
    for (const serial of serials) {
      //console.log(serial)
      await _fixOrder(serial, user)
    }
  }
  //await client.close()
  console.log('end')
  
}

fixOrder(users, serials)
