const { MongoClient } = require("mongodb")
const fs = require('fs');

export async function dbConnect(isTest: boolean) {
  let client: any
  let dbname: any
  let url: string
  if (isTest) {
    url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
    dbname = 'icare_elearning_v15'
    client = new MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });
  }
  else {
    const url = 'mongodb://34.80.83.237:32018/icare_elearning';
    client = new MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });
    dbname = 'icare_elearning'
  }
  return { client, dbname }
}

export async function getCollection(collection: string, connectRes: any) {
  const client = connectRes.client
  const dbname = connectRes.dbname

  const db = client.db(dbname);
  const licenseCol = db.collection(collection);
  return licenseCol
}
