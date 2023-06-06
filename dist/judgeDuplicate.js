"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.judge = exports.serials = void 0;
const mongodb_1 = require("mongodb");
const fs = require('fs');
// const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
// const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });
const url = 'mongodb://34.80.83.237:32018/icare_elearning';
const client = new mongodb_1.MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });
exports.serials = [
    'NC230045', 'NC230046', 'NC230047', 'NC230048', 'NC230049', 'NC230051', 'NC230050', 'NC230076', 'NC230081',
    'NC220574', 'NC220576', 'NC220578', 'NC220575', 'NC220577', 'NC220579', 'NC230007', 'NC230008', 'NC230009',
    'NC220404', 'NC220405', 'NC220406', 'NC220408', 'NC220538', 'NC220541', 'NC220544', 'NC220545', 'NC220540',
    'NC220543', 'NC220546', 'NC220548', 'NC220539', 'NC220542', 'NC220550', 'NC220549'
];
const user = '0923334205';
async function getCollection(collection) {
    // const db = client.db('icare_elearning_v15');
    const db = client.db('icare_elearning');
    const licenseCol = db.collection(collection);
    return licenseCol;
}
function logMessage(message) {
    const timestamp = new Date().toISOString();
    const log = `${timestamp} - ${message}`;
    console.log(log);
    // 將log寫入檔案或其他目的地
    fs.appendFileSync('logs.log', log + '\n');
}
async function judge(serials) {
    await client.connect();
    const courseUserC = await getCollection('courseusers');
    const courseC = await getCollection('courses');
    const studiesC = await getCollection('studies');
    const creditAppliesC = await getCollection('creditapplies');
    const now = new Date();
    const importelement = [];
    const canntimport = [];
    for (const i in serials) {
        const CreditSerial = await courseC.findOne({ serial: serials[i] }, { projection: { creditSerial: 1, _id: 0 } });
        // const CreditSerialClass = await courseC.find(CreditSerial, { projection: { creditSerial: 1, serial: 1 } }).toArray()
        const CreditSerialIds = await courseC.find(CreditSerial, { projection: { _id: 1 } }).toArray().then((results) => results.map((doc) => doc._id));
        const userId = await courseUserC.findOne({ account: user }, { projection: { _id: 1 } });
        const conflictStudies = await studiesC.find({ userId: userId._id, course: { $in: CreditSerialIds } }).toArray();
        const conflictCreditApplies = await creditAppliesC.find({ study: conflictStudies[0]._id }).toArray().then((results) => results.map((doc) => doc.status));
        const isAllFail = conflictCreditApplies.every((element) => element === "FAIL");
        const conflictCourse = await courseC.findOne({ _id: conflictStudies[0].course });
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
                    if (!conflictCreditApplies || !isAllFail) {
                        importelement.push({ canImport: true, importclass: serials[i], conflictSerial: conflictCourse.serial, type: conflictCourse.type, finish: conflictStudies[0].finished, creditApllies: conflictCreditApplies, canimport: true, creditPointEndAt: conflictCourse.creditPointEndAt, reason: '直播課沒在時間內申請' });
                        continue;
                    }
                }
            }
            if (conflictStudies[0].finished == false) {
                importelement.push({ canImport: true, importclass: serials[i], conflictSerial: conflictCourse.serial, type: conflictCourse.type, finish: conflictStudies[0].finished, creditApllies: conflictCreditApplies, canimport: true, creditPointEndAt: conflictCourse.creditPointEndAt, reason: '直播課沒看完' });
                continue;
            }
        }
        importelement.push({ canImport: false, importclass: serials[i], conflictSerial: conflictCourse.serial, type: conflictCourse.type, finish: conflictStudies[0].finished, creditApllies: conflictCreditApplies, canimport: true, creditPointEndAt: conflictCourse.creditPointEndAt, reason: '不能匯' });
    }
    await client.close();
    return importelement;
}
exports.judge = judge;
judge(exports.serials);
