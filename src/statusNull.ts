//檢查有成功付款但creditapplies的status為空的筆數

import { MongoClient } from 'mongodb'
import * as ExcelJS from 'exceljs'
import moment from 'moment'
interface Model extends Document {
    name:string
    identity:string
    _id:string
    courseusers:{
      account:string
    }
    courses:{
        name:string,
        creditSerial:string,
        serial:string,
        creditSerialEndAt:Date
    }
    applyAt:Date
    idclasses:{
      name:string
    }
    studies:{
      totalProgress:number,
      startDate:Date,
      endDate:Date,
      quizScore:number
    }
  }

const isUat = false
//const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15'
//const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } })

const uri = 'mongodb://34.80.83.237:32018/icare_elearning' 
const client = new MongoClient(uri, { auth: { user: 'icare', password: 'iLearning0Care' } })

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
  const lastDay = new Date('2023-07-01T00:00:00.000Z')
  console.log(lastDay)
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
      $match: {
        'courses.creditSerialEndAt': {$lt: lastDay}
      }
    },
    {
    $lookup: {
      from: 'studies', // 另一個集合的名稱
      localField: 'study', // collection1 中用於關聯的欄位
      foreignField: '_id', // collection2 中用於關聯的欄位
      as: 'studies', // 新增的欄位名稱，將 collection2 的資料作為陣列加入此欄位
      }
    },
    {
      $unwind: '$studies'
    },
    {
      $lookup:{
        from:'courseusers',
        localField:'userId',
        foreignField: '_id',
        as:'courseusers',
      }
    },
    {
      $unwind: '$courseusers'
    },
    {
      $lookup:{
        from:'idclasses',
        localField:'idClass',
        foreignField: '_id',
        as:'idclasses',
      }
    },
    {
      $unwind: '$idclasses'
    },
    {
      $project: {
        applyAt:1,
        'courseusers.account':1,
        identity:1,
        name:1,
        'idclasses.name':1,
        'courses.creditSerial':1,
        'courses.name':1,
        'courses.creditSerialEndAt':1,
        'studies.totalProgress':1,
        'studies.startDate':1,
        'studies.endDate':1,
        'studies.quizScore':1,
      }
    }
    ]
    const statusNulls = await creditappliesDb.aggregate(pipeline).toArray()
    //console.log(statusNulls)
    //await exportToExcel(statusNulls)

    for(const statusNull of statusNulls) {
      await creditappliesDb.findOneAndUpdate({_id:statusNull._id},{$set:{status:'APPLYING'}})
      const creditApply = await creditappliesDb.findOne({_id:statusNull._id})
      console.log(creditApply)
    }
}

async function exportToExcel(applies:Array<Model>) {
  
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('courseUpdated');
    // Set headers
    const headers = ['申請狀態\n(請填上『數字』0.申請中、1.送審中、2.已通過、3.未通過)','申請日期','會員帳號','身分證字號','真實姓名','課程人員類別','課程字號','課程名稱','開始上課時間','結束上課時間','總上課時數(分)','課後測驗分數']
    worksheet.getRow(1).values = headers;
    
    // Add data rows
    for(const apply of applies){
      const applyAt = moment(apply.applyAt).format('YYYY-MM-DD')
      const startDate = moment(apply.studies.startDate).add(8,'hours').format('YYYY-MM-DD hh:mm:ss')
      const endDate = moment(apply.studies.endDate).add(8,'hours').format('YYYY-MM-DD hh:mm:ss')
      const totalProgress = (apply.studies.totalProgress/60).toFixed(2)
      const row = worksheet.addRow([1,applyAt,apply.courseusers.account,apply.identity,apply.name,apply.idclasses.name,apply.courses.creditSerial,apply.courses.name,startDate,endDate,totalProgress,apply.studies.quizScore])
      row.font = { bold: false }
    }
  
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