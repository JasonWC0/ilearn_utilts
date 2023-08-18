import puppeteer from 'puppeteer'
import { MongoClient, ObjectID } from 'mongodb'

const isUat = false

let uri = 'mongodb://34.80.83.237:32018/icare_elearning' 
let client = new MongoClient(uri, { auth: { user: 'icare', password: 'iLearning0Care' } })

if(isUat){
  uri = 'mongodb://104.199.235.97:32018/icare_elearning_v15'
  client = new MongoClient(uri, { auth: { user: 'icare', password: 'UATg0Icare' } })
}

const date = new Date('2025-01-01T00:00:00.000Z')

//---------------------modify here---------------------
const account= '0923883922' //user account
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' //path of chrome.exe
//---------------------modify here---------------------

const setSession = (async (chromePath: string) => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--start-maximized'],
    defaultViewport: null,
    headless:false
  })
  const page = await browser.newPage()
  let session = ''
  if(isUat){
    await page.goto('https://icareuat115.compal-health.com/')
    const cookies = await page.cookies()
    session = cookies.find( cookie => cookie.name === 'icareuat.sessionId')!.value.slice(4).split('.')[0]
  }
  else{
    await page.goto('https://ilearning.compal-health.com/')
    const cookies = await page.cookies()
    session = cookies.find( cookie => cookie.name === 'clcare.sessionId')!.value.slice(4).split('.')[0]
  }
  
  console.log(session)
  await getDb(session)
  await page.reload()
  //await browser.close()
})

async function getDb(session: string) {
    try {
      await getData(session)
    } catch (error) {
      console.error("Error occurred:", error)
    } finally {
      await client.close()
      console.log('Db Offline')
    }
  }
  
  async function getData(session: string) {
    await client.connect()
    console.log('getUser')
    
    const courseusersDb = await getCollection('courseusers')
    const courseuser= await courseusersDb.findOne({account:account})
    const sessionsDb = await getCollection('sessions')
    await sessionsDb.findOneAndUpdate({_id:session},{$set:{expires: date,
      session: `{"cookie":{"originalMaxAge":345600000,"expires":${JSON.stringify(date)},"secure":false,"httpOnly":true,"domain":".compal-health.com","path":"/"},"user":{"account":${JSON.stringify(courseuser.account)},"nickname":${JSON.stringify(courseuser.nickname)},"email":${JSON.stringify(courseuser.email)},"name":${JSON.stringify(courseuser.name)},"personalId":${JSON.stringify(courseuser.personalId)},"eLearnIdentityType":null,"companies":[],"gender":null,"accountId":${JSON.stringify(courseuser.accountId)},"phone":${JSON.stringify(courseuser.phone)},"lunaPath":"","token":"","role":"","roleName":"","companyType":0,"companySystem":"","isLuna":false,"lunaHost":""}}`}})
    const newSession = await sessionsDb.findOne({_id:session})
    //console.log(newSession)
  
  }
  
  async function getCollection(collection: string) {
    let db = client.db('icare_elearning')
    if(isUat){
      db = client.db('icare_elearning_v15')
    }
    return db.collection(collection)
  }
  
  setSession(chromePath)