// 建立預設推薦課程，預設為線上最新課程

import moment from 'moment'
import { MongoClient, ObjectId } from 'mongodb'

interface Model extends Document {
  userName: string
  account: string
  signInTime: Date
  signOutTime: Date
  finished: boolean
}

const isUat = false

let uri = 'mongodb://34.80.83.237:32018/icare_elearning'
let client = new MongoClient(uri, { auth: { user: 'icare', password: 'iLearning0Care' } })

if (isUat) {
  uri = 'mongodb://104.199.235.97:32018/icare_elearning_v15'
  client = new MongoClient(uri, { auth: { user: 'icare', password: 'UATg0Icare' } })
}

const startDate = new Date('2023-10-12T00:00:00.000Z')
const endDate = new Date('2024-01-30T00:00:00.000Z')

async function getDb() {
  try {
    await getData()
  } catch (error) {
    console.error("Error occurred:", error)
  } finally {
    await client.close()
    console.log('Db Offline')
  }
}

async function getData() {
  await client.connect()

  const recommendsDb = await getCollection('recommends')
  const coursesDb = await getCollection('courses')

  const courses = await coursesDb.find({type:'ONLINE'}).sort({createdAt:-1}).toArray()

  const course = courses[0]
  while(startDate < endDate){
    
    if(startDate.getDay() >= 1 && startDate.getDay() <=4 ){
      const date = moment(startDate).format('YYYY/MM/DD')

      if(await recommendsDb.findOne({ name: date+'推薦課程清單' })){
        console.log('find', date)
      } 
      else{
        console.log('create', date)
        await recommendsDb.insertOne({
          name: date+'推薦課程清單',
          recommends: {
            courseId: course._id,
            serial: course.serial,
            name: course.name,
            description: '預建推薦清單'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        })
      }
    }
    startDate.setDate( startDate.getDate() +1 )
  }
}

async function getCollection(collection: string) {
  let db = client.db('icare_elearning')
  if (isUat) {
    db = client.db('icare_elearning_v15')
  }
  return db.collection(collection)
}

getDb()