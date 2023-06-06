"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const fs = require('fs');
const test = true;
let url;
let client;
let dbname;
if (test) {
    url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
    dbname = 'icare_elearning_v15';
    client = new mongodb_1.MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });
}
else {
    const url = 'mongodb://34.80.83.237:32018/icare_elearning';
    client = new mongodb_1.MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });
    dbname = 'icare_elearning';
}
// export const serials = [
//   'NC230045', 'NC230046', 'NC230047', 'NC230048', 'NC230049', 'NC230051', 'NC230050', 'NC230076', 'NC230081',
//   'NC220574', 'NC220576', 'NC220578', 'NC220575', 'NC220577', 'NC220579', 'NC230007', 'NC230008', 'NC230009',
//   'NC220404', 'NC220405', 'NC220406', 'NC220408', 'NC220538', 'NC220541', 'NC220544', 'NC220545', 'NC220540',
//   'NC220543', 'NC220546', 'NC220548', 'NC220539', 'NC220542', 'NC220550', 'NC220549'
// ]
// const serials = ["NC220538"]
async function getCollection(collection) {
    // const db = client.db('icare_elearning_v15');
    const db = client.db(dbname);
    const licenseCol = db.collection(collection);
    return licenseCol;
}
async function fixOrder(serial, account) {
    await client.connect();
    const courseUserC = await getCollection('courseusers');
    const ordersC = await getCollection('orders');
    const orderDetailC = await getCollection('orderdetails');
    const courseC = await getCollection('courses');
    const user = await courseUserC.findOne({ account: account });
    const course = await courseC.findOne({ serial: serial });
    // const order = await ordersC
    const order = await ordersC.findOne({ userId: user._id, course: course._id });
    if (!order) {
        throw console.error('沒有該筆訂單');
    }
    const orderDetaik = await orderDetailC.findOne({ orderId: order._id });
    await orderDetailC.updateOne({ orderId: order._id }, { $set: { specialOffer: 53, checkoutPrice: 53 } });
    await ordersC.updateOne({ _id: order._id }, { $set: { "payment.invoiceItemPrice": 53, "coursebk.0.price": 53, "payment.totalAmount": 53 } });
    // await client.close()
    // console.log(orderDetaik)
}
// fixOrder('NC220546', '0905323703')
const serialss = [
    // 'NC220549', 'NC220550', 'NC220542', 'NC220539', 'NC220548', 'NC220546', 'NC220543', 'NC220540', 'NC220545', 'NC220544', 'NC220375', 'NC220541', 'NC220574', 'NC220576', 'NC220377', 'NC220575', 'NC220577', 'NC220579'
    // 'NC220574', 'NC220576', 'NC220575', 'NC220577', 'NC220579', 'NC220550', 'NC220549', 'NC220578'
    // 'NC220574', 'NC220576', 'NC220578', 'NC220575', 'NC220577', 'NC220579', 'NC220538', 'NC220541', 'NC220544', 'NC220545', 'NC220540', 'NC220543', 'NC220546', 'NC220548', 'NC220539', 'NC220542', 'NC220550', 'NC220549'
    'NC220549', 'NC220550'
];
async function loop(serialss) {
    for (const i of serialss) {
        console.log(i);
        await fixOrder(i, '0923334205');
    }
    console.log('end');
}
loop(serialss);
