import * as request from 'request'
import { MongoClient, ObjectId } from 'mongodb';
import { addFrozenPanesAndHeaderWithFilter, csvToExcel, deleteCSVFile, deleteXLSXFile } from './excel';
const { DataFrame, replace } = require('dataframe-js');
const fs = require('fs');
// const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
// const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });

const url = 'mongodb://34.80.83.237:32018/icare_elearning';
const client = new MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });

const serials = [
    'NC210151', 'NC210074', 'NC210116', 'NC220031'
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

async function creditApllieStatus(serials: string[]) {
    await client.connect();

    const courseUserC = await getCollection('courseusers')

    const courseC = await getCollection('courses')

    const studiesC = await getCollection('studies')

    let twoDimensionalArray: number[][] = [];
    for (const i in serials) {
        // 從資料庫抓資料
        let CreditSerial = await courseC.findOne({ serial: serials[i] }, { projection: { _id: 1, name: 1, creditSerialEndAt: 1 } })
        let Studies = await studiesC.find({ course: new ObjectId(CreditSerial._id), startDate: { $gt: new Date('2022-06-30') }, endDate: { $lt: new Date('2023-07-12') }, finished: true }, { projection: { userId: 1, quizStatus: 1, startDate: 1, endDate: 1, finished: 1 } }).toArray()
        // 個別取出Studies的userId 帶入courseUser找姓名跟電話
        for (const i in Studies) {
            let courseUser = await courseUserC.findOne({ _id: new ObjectId(Studies[i].userId) }, { projection: { name: 1, account: 1, personalId: 1 } })
            let row: any[] = [];
            // 消除null情況
            let newcreditSerialEndAt = CreditSerial || "Default Value"
            // 將抓取的資料排成陣列
            row.push(courseUser.name, courseUser.account, courseUser.personalId, CreditSerial.name, Studies[i].quizStatus, newcreditSerialEndAt.creditSerialEndAt);
            twoDimensionalArray.push(row);
        }
    }
    // 設定陣列名稱
    const df1 = new DataFrame(twoDimensionalArray
        , ['學員姓名', '手機', '身分證字號', '課程', '考試狀況', '期限']);
    // 設定通過跟未通過    
    const df2 = df1.replace(undefined, ' ').replace('VERIFYING', '已通過').replace('APPROVED', '已通過').replace('NOT', '未通過').replace('PASS', '已通過').replace('APPLYING', '已通過')
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
    await addFrozenPanesAndHeaderWithFilter('creditAppliesreport.xlsx', '高齡積分申請清單.xlsx')

    // 刪除csv跟xlsx檔
    await deleteCSVFile('creditAppliesreport.csv')
    await deleteXLSXFile('creditAppliesreport.xlsx')
    await client.close();
    //return importelement
}
creditApllieStatus(serials)