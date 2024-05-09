import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DB } from './database';

// 更新線上課程
// 1. 更新產品原價300元，特價0元
// 2. 更新積分申請費用為75元
// 3. 更新courseplan課程價格為300元
// 4. 更新course課程價格為300元且最後購買時間為直播開始前一小時

dayjs.extend(utc);

const serials = ['NC240346', 'NC240345', 'NC240344'];

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
    await db.collection('products').updateOne({ _id: courseplan.productId }, { $set: { specialOffer: 0, price: 300 } });
    // 更新積分申請費用為75元
    await db.collection('products').updateOne({ parent: courseplan.productId, label: '仁寶i學習/申請積分手續費' }, { $set: { price: 75 } });
    // 更新courseplan課程價格為300元
    await db.collection('courseplans').updateOne({ _id: courseplan._id }, { $set: { price: 300 } });
    // 更新course課程價格為300元，最後購買時間為直播開始前一小時
    await db.collection('courses').updateOne({ _id: course._id }, { $set: { purchaseAt: dayjs(courseplan.liveInfo.startAt).subtract(1, 'hour').toDate(), price: 300 } });
  }
  await dbClient.dbClose();
}

getData();
