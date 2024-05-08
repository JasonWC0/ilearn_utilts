import { MongoClient } from 'mongodb';
import puppeteer from 'puppeteer';

const isUat = false;

let uri = 'mongodb://34.80.83.237:32018/icare_elearning';
let client = new MongoClient(uri, { auth: { user: 'icare', password: 'iLearning0Care' } });

if (isUat) {
  uri = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
  client = new MongoClient(uri, { auth: { user: 'icare', password: 'UATg0Icare' } });
}

const date = new Date('2025-01-01T00:00:00.000Z');

//---------------------modify here---------------------
const account = '0985728807'; //user account
const objId = '62623c66e3846d0a4d2de7f0';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'; //path of chrome.exe
//---------------------modify here---------------------

interface Session {
  _id: string;
  expires: Date;
  session: string;
}
const setSession = async (chromePath: string) => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ['--start-maximized'],
    defaultViewport: null,
    headless: false,
  });
  const page = await browser.newPage();
  let session = '';
  if (isUat) {
    await page.goto('https://icareuat115.compal-health.com/');
    const cookies = await page.cookies();
    session = cookies
      .find(cookie => cookie.name === 'icareuat.sessionId')!
      .value.slice(4)
      .split('.')[0];
  } else {
    await page.goto('https://ilearning.compal-health.com/');
    const cookies = await page.cookies();
    session = cookies
      .find(cookie => cookie.name === 'clcare.sessionId')!
      .value.slice(4)
      .split('.')[0];
  }

  console.log(session);
  await getDb(session);
  await page.reload();
  //await browser.close()
};

async function getDb(session: string) {
  try {
    await getData(session);
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await client.close();
    console.log('Db Offline');
  }
}

async function getData(session: string) {
  await client.connect();
  console.log('getUser');
  const db = isUat ? client.db('icare_elearning_v15') : client.db('icare_elearning');
  const courseusersDb = db.collection('courseusers');
  //const courseuser= await courseusersDb.findOne({account:account})
  const courseuser = await courseusersDb.findOne({ account: account });
  if (!courseuser) {
    console.log('user not found');
    return;
  }
  const { account: userAccount, nickname, email, name, personalId, accountId, phone } = courseuser;
  console.log('account', userAccount, 'nickname:', nickname, 'email:', email, 'name:', name, 'personalId:', personalId, 'accountId:', courseuser.accountId, 'phone:', phone);
  const sessionsDb = db.collection<Session>('sessions');
  await sessionsDb.findOneAndUpdate(
    { _id: session },
    {
      $set: {
        expires: date,
        session: `{"cookie":{"originalMaxAge":345600000,"expires":${JSON.stringify(
          date
        )},"secure":false,"httpOnly":true,"domain":".compal-health.com","path":"/"},"user":{"account":${JSON.stringify(userAccount)},"nickname":${JSON.stringify(
          nickname
        )},"email":${JSON.stringify(email) || null},"name":${JSON.stringify(name)},"personalId":${JSON.stringify(
          personalId
        )},"eLearnIdentityType":null,"companies":[],"gender":null,"accountId":${JSON.stringify(accountId)},"phone":${JSON.stringify(
          phone ?? ''
        )},"lunaPath":"","token":"","role":"","roleName":"","companyType":0,"companySystem":"","isLuna":false,"lunaHost":""}}`,
      },
    }
  );
  const newSession = await sessionsDb.findOne({ _id: session });
  //console.log(newSession)
}

setSession(chromePath);
