import * as request from 'request'
import { MongoClient, ObjectId } from 'mongodb';
import { addFrozenPanesAndHeaderWithFilter, csvToExcel, deleteCSVFile, deleteXLSXFile } from './excel';
const { DataFrame, replace } = require('dataframe-js');
const fs = require('fs');
// const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
// const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });

const url = 'mongodb://34.80.83.237:32018/icare_elearning';
const client = new MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });

// 課程編號
const serials = [
    'NC220404', 'NC220405', 'NC220406'
]

// 學員帳號
const user = [
    '0958898145', '0973310439', '0906995914', '0922690633', '0986384825', '0985806020', '0908656819'
    , '0966163510', '0977420292', '0982763589', '0906501896', '0987106398', '0972188282', '0975258852'
    , '0937197029', '0920431100', '0985150572', '0985678990', '0955596901', '0933442922', '0989667238'
]
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

// 資料庫讀取跟產生報表
async function creditApllieStatus(serials: string[]) {
    await client.connect();
    const courseUserC = await getCollection('courseusers')
    const courseC = await getCollection('courses')
    const creditAppliesC = await getCollection('creditapplies')

    const now = new Date()
    const importelement: any[] = []
    const canntimport: any[] = []
    let twoDimensionalArray: number[][] = []; // Dataframe所需陣列

    for (const i in serials) {
        let CreditSerial = await courseC.findOne({ serial: serials[i] }, { projection: { _id: 1, name: 1, creditSerialEndAt: 1 } })
        //期限寫法 creditSeriaEndAt: { $lt: new Date('2023-07-26') }
        for (const j in user) {
            let userId = await courseUserC.findOne({ account: user[j] }, { projection: { _id: 1 } })
            // const CreditSerialClass = await courseC.find(CreditSerial, { projection: { creditSerial: 1, serial: 1 } }).toArray()
            //const CreditSerialIds = await courseC.find(CreditSerial, { projection: { _id: 1 } }).toArray().then((results) => results.map((doc) => doc._id))
            let creditApplies = await creditAppliesC.findOne({ userId: new ObjectId(userId._id), course: new ObjectId(CreditSerial._id) }, { projection: { _id: 0, status: 1 } })
            //importelement.push({ canImport: false, importclass: serials[i], conflictSerial: conflictCourse.serial, type: conflictCourse.type, finish: conflictStudies[0].finished, creditApllies: conflictCreditApplies, canimport: true, creditPointEndAt: conflictCourse.creditPointEndAt, reason: '不能匯' })
            // 資料陣列產生
            let row: any[] = [];
            let newCreditApplies = creditApplies || "Default Value"
            row.push(user[j], CreditSerial.name, newCreditApplies.status, CreditSerial.creditSerialEndAt.toISOString());
            twoDimensionalArray.push(row);
        }
    }
    // 設定陣列名稱
    const df1 = new DataFrame(twoDimensionalArray
        , ['仁寶i學習帳號', '課程', '狀態', '期限']);
    // 替換陣列內容    
    const df2 = df1.replace(undefined, '無積分申請').replace('VERIFYING', '送審中').replace('APPROVED', '已通過').replace('UNPAID', '申請積分-未付款').replace('APPLYING', '申請審核中')
    //df2.show() 檢查dataframe

    // 轉成 csv檔
    df2.toCSV(true, 'creditAppliesreport.csv')
    // 轉成 xlsx檔
    const csvFilePathone = 'creditAppliesreport.csv';
    const outputFilePathone = 'creditAppliesreport.xlsx';
    await csvToExcel(csvFilePathone, outputFilePathone)
        .then(() => {
            console.log('CSV data has been converted to Excel successfully!');
        })
        .catch((error) => {
            console.error('Error converting CSV to Excel:', error);
        });
    // 轉成所需格式
    await addFrozenPanesAndHeaderWithFilter('creditAppliesreport.xlsx', '積分申請清單.xlsx')

    // csv,xlsx檔刪除
    await deleteCSVFile('creditAppliesreport.csv')
    await deleteXLSXFile('creditAppliesreport.xlsx')
    await client.close();
    //return importelement
}
creditApllieStatus(serials)