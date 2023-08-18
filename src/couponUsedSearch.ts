import { MongoClient } from "mongodb";
const fs = require('fs');
import { Types } from 'mongoose'
import * as ExcelJS from 'exceljs';
const now = new Date()

// const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
// const client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });

const url = 'mongodb://34.80.83.237:32018/icare_elearning';
const client = new MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });

const user = '0923334205'
async function getCollection(collection: string) {
  // const db = client.db('icare_elearning_v15');
  const db = client.db('icare_elearning');

  const licenseCol = db.collection(collection);
  return licenseCol
}



async function couponsUsedSearch() {
  await client.connect()
  let accounts: string[] = [
    '0910375233',
    '0911905265',
    '0971780825',
    '0906177752',
    '0926917532',
    '0923110990',
    '0911596557',
    '0912010658',
    '0930351073',
    '0986304456',
    '0988828662',
    '0913013939',
    '0987281066',
    '0921742657',
    '0933577374',
    '0980643985',
    '0987926255',
    '0936902059',
    '0919714379',
    '0936334646',
    '0980750206',
    '0918110571',
    '0919651799',
    '0980794469',
    '0923313183',
    '0921318558',
    '0909368319',
    '0923176948',
    '0911406768',
    '0923320814',
    '0911406156',
    '0909330349',
    '0932542557',
    '0981412225',
    '0910510121',
    '0925377255',
    '0970662070',
    '0988595683',
    '0988821702',
    '0963622509',
    '0937235882',
    '0932605448',
    '0963492925',
    '0988315745',
    '0982353856',
    '0963509646',
    '0909375236',
    '0989576725',
    '0937518013',
    '0963158603',
    '0966766201',
    '0921311184',
    '0931126731',
    // '0933707439',
    // 洪騰為
    '0905173073',
    '0934078567',
    '0982771189',
    '0955737005',
    '0912918759',
    '0911302165',
    '0963490508',
    '0926251530',
    '0980643985',
    '0939517619',
    '0912365406',
    '0937992333',
    '0905173073',
    '0977722487',
    '0938082266',
    '0985116702',
    '0916633486',
    '0921781566',
    '0933414992',
    '0932605860',
    '0963557857',
    '0912323085',
    '0919816975',
    '0906291875',
    '0979620651',
    '0980625312',
    '0988765909',
    '0963490277',
    '0922051948',
    '0926780037',
    '0985116702',
    '0921317570',
    '0937486336',
    '0975519598',
    '0921069063',
    '0909577107',
    '0985551118',
    '0939851476',
    '0911643262',
    '0983815028',
    '0906688713',
    '0972969668',
    '0934078610',
    '0972952085',
    '0963268593',
    '0937479910',
    '0928966937',
    '0963150587',
    '0967181016',
    '0933894513',
    '0919819998',
    '0968968865',
    '0966183958',
    '0911904993',
    '0952664891',
    '0923888028',
    '0980668733',
    '0975211886',
    '0956353117',
    '0909790972',
    '0919915065',
    // '0982068552',
    // '0982068652',
    // 洪瑞琪
    '0980332149',
    '0936684987',
    '0982790669',
    '0973852530',
    '0928366121',
    '0910725390',
    '0970279990',
    '0938537585',
    '0972710802',
    '0961325268',
    '0968771909',
    '0986371373',
    '0903030510',
    '0988018939',
    '0983936995',
    '0928664458',
    '0956733339',
    '0921659555',
    '0981994194',
    '0912940579',
    '0937282122',
    '0986367958',
    '0955923997',
    '0956177568',
    '0966585685'
  ]

  // let accounts: string[] = [
  //   '0982068652', '0919295277'

  // ]

  let result: any[] = []
  for (let account of accounts) {

    console.log(account)
    const courseusersC = await getCollection('courseusers')
    const couponC = await getCollection('coupons')
    let cc = await courseusersC.findOne({ account: account })
    let aggregation = await couponC.aggregate([
      {
        $match: {
          usedby: cc._id,
          batch: Types.ObjectId('63ef46dd72d9752df48b3e38')
        }
      },
      {
        $lookup: {
          from: "courseusers",
          localField: "usedby",
          foreignField: "_id",
          as: "courseuser_info"
        }
      },
      {
        $unwind: "$courseuser_info"
      }, {
        $project: {
          batch: 1,
          code: 1,
          used: 1,
          usedby: '$courseuser_info.account',
          startAt: 1,
          endAt: 1
        }
      }
    ]);

    let queryResult = await aggregation.toArray();

    result.push(...queryResult);  // Merge the query results into the result array
  }

  return result
}




async function exportToExcel(filename: string) {
  const data = await couponsUsedSearch()
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Sheet 1');

  // Set headers
  const headers = Object.keys(data[0]);
  worksheet.getRow(1).values = headers;

  // Add data rows
  data.forEach((item, index) => {
    const row = worksheet.addRow(Object.values(item));
    row.font = { bold: false };
  });

  // Auto fit columns
  worksheet.columns.forEach((column) => {
    const header = column.header as string | undefined;
    if (header) {
      column.width = header.length < 12 ? 12 : header.length;
    }
  });

  // Save workbook to file
  await workbook.xlsx.writeFile(filename);
  console.log('Excel file exported successfully.');
}
const filename = `coupon_0217批次匯入.xlsx`;
exportToExcel(filename);

