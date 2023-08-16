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
    //const courseC = await getCollection('courses')
    const studiesC = await getCollection('orderdetails')
    let twoDimensionalArray: number[][] = [];
    // 從資料庫抓資料

    const pipeline = [
        {
            $match: {
                type: "ONLINE"
            }
        },
        {
            $project: {
                productId: 1,

            },
        },
    ];
    const courseC = await getCollection("courses")
    console.log(courseC)


}
creditApllieStatus(serials)