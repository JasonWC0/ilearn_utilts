import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DB } from './database';

// 更新線上課程
// 1. 更新產品原價300元，特價0元
// 2. 更新積分申請費用為75元
// 3. 更新courseplan課程價格為300元
// 4. 更新course課程價格為300元且最後購買時間為直播開始前一小時
// 5. 更新推薦課程清單

dayjs.extend(utc);

const serials = [
  'NC240332',
  'NC240333',
  'NC240334',
  'NC240335',
  'NC240336',
  'NC240337',
  'NC240338',
  'NC240339',
  'NC240340',
  'NC240341',
  'NC240342',
  'NC240343',
  'NC240344',
  'NC240345',
  'NC240346',
];

async function getData() {
  const dbClient = new DB(true);
  const db = await dbClient.dbConnect();

  const courses = await db
    .collection('courses')
    .find({ serial: { $in: serials } })
    .toArray();
  const courseplans = await db
    .collection('courseplans')
    .find({ serial: { $in: serials } })
    .toArray();

  for (const course of courses) {
    const courseplan = courseplans.find(cp => cp._id.equals(course.plan));
    // 更新產品原價300元，特價0元
    await db.collection('products').updateOne({ _id: course.productId }, { $set: { specialOffer: 0, price: 300 } });
    // 更新積分申請費用為75元
    await db.collection('products').updateOne({ parent: course.productId, label: '仁寶i學習/申請積分手續費' }, { $set: { price: 75 } });
    // 更新courseplan課程價格為300元
    await db.collection('courseplans').updateOne({ _id: courseplan._id }, { $set: { price: 300 } });
    // 更新course課程價格為300元，最後購買時間為直播開始前一小時
    await db.collection('courses').updateOne({ _id: course._id }, { $set: { purchasedAt: dayjs(course.liveInfo.startAt).subtract(1, 'hour').toDate(), price: 300, discount: 0 } });
    const liveStartTime = course.liveInfo.startAt;
    let rec;
    const formattedDate = liveStartTime.toISOString().split('T')[0].replace(/-/g, '/');
    if (liveStartTime.getHours() === 12 || liveStartTime.getHours() === 15) {
      rec = `${formattedDate}推薦課程清單_第一場`;
    } else {
      rec = `${formattedDate}推薦課程清單_第二場`;
    }
    // 打印 liveStartTime 以檢查日期和時間
    console.log(formattedDate);
    const recommends = await db.collection('recommends').findOne({ name: rec });
    if (!recommends) {
      console.log('找不到推薦課程清單');
      continue;
    }
    await db.collection('courses').updateOne({ _id: course._id }, { $set: { recommendCourse: recommends._id } });
    // 將日期格式化為 'YYYY/MM/DD' 的格式
  }
  await dbClient.dbClose();
}

getData();
