//檢查有成功付款但creditapplies的status為空的筆數

import { MongoClient, ObjectID } from 'mongodb'
import * as ExcelJS from 'exceljs'

interface Model extends Document {
    name:string
    identity:string
    _id:string
    courses:{
        name:string,
        creditSerial:string,
        serial:string,
        creditSerialEndAt:Date
    }
    applyAt:Date
  }

const isUat = false
//const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15'
//const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } })

const uri = 'mongodb://34.80.83.237:32018/icare_elearning' 
const client = new MongoClient(uri, { auth: { user: 'icare', password: 'iLearning0Care' } })

const phone = '0918808418'

async function getDb() {
  try {
    await getData()
  } catch (error) {
    console.error("Error occurred:", error)
  } finally {
    await client.close()
    console.log('Offline')
  }
}

async function getData() {
  await client.connect()
  console.log('getUser')
  
  const creditappliesDb = await getCollection('creditapplies')
  const pipeline = [
    {
      $match: {
        status: "",
      }
    },
    {
      $lookup: {
        from: 'orders', // 另一個集合的名稱
        localField: 'orderId', // collection1 中用於關聯的欄位
        foreignField: '_id', // collection2 中用於關聯的欄位
        as: 'orders', // 新增的欄位名稱，將 collection2 的資料作為陣列加入此欄位
      }
    },
    {
      $unwind: '$orders'
    },
    {
        $match: {
          'orders.paid': true,
        }
      },
    {
    $lookup: {
        from: 'courses', // 另一個集合的名稱
        localField: 'course', // collection1 中用於關聯的欄位
        foreignField: '_id', // collection2 中用於關聯的欄位
        as: 'courses', // 新增的欄位名稱，將 collection2 的資料作為陣列加入此欄位
        }
    },
    {
        $unwind: '$courses'
    },
    {
      $project: {
        name:1,
        identity:1,
        'courses.creditSerial':1,
        'courses.name':1,
        'courses.serial':1,
        'courses.creditSerialEndAt':1,
        applyAt:1
      }
    }
    ]
    const nulls = await creditappliesDb.aggregate(pipeline).toArray()
    console.log(nulls)
    exportToExcel(nulls)
}

async function exportToExcel(applies:Array<Model>) {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('courseUpdated');
    // Set headers
    const headers = ['姓名','身份證字號','課程','課程字號','課程ID','積分申請日期','積分到期日','ID']
    worksheet.getRow(1).values = headers;
  
    // Add data rows
    for(const apply of applies){
      const row = worksheet.addRow([apply.name, apply.identity, apply.courses.name, apply.courses.creditSerial, apply.courses.serial, apply.applyAt, apply.courses.creditSerialEndAt,apply._id])
      row.font = { bold: false }
    };
  
    // Save workbook to file
    await workbook.xlsx.writeFile('status-null.xlsx');
    console.log('Excel file exported successfully.');
  }

async function getCollection(collection: string) {
  let db = client.db('icare_elearning')
  if(isUat){
    db = client.db('icare_elearning_v15')
  }
  return db.collection(collection)
}

getDb()