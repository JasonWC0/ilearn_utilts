import { MongoClient } from 'mongodb';

export class DB {
  url: string;
  client: MongoClient;
  dbname: string;

  constructor(isProd: boolean, isERP: boolean = false) {
    if (isERP) {
      this.url = 'mongodb://10.109.35.167:32018/luna_web';
      this.client = new MongoClient(this.url, { auth: { user: 'lunaWorker', password: 'RrFuA9xX7' } });
      this.dbname = 'luna_web';
    } else {
      if (isProd) {
        this.url = 'mongodb://34.80.83.237:32018/icare_elearning';
        this.client = new MongoClient(this.url, { auth: { user: 'icare', password: 'iLearning0Care' } });
        this.dbname = 'icare_elearning';
      } else {
        this.url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
        this.client = new MongoClient(this.url, { auth: { user: 'icare', password: 'UATg0Icare' } });
        this.dbname = 'icare_elearning_v15';
      }
    }
  }

  async dbConnect() {
    console.log('Connecting to DB...');
    await this.client.connect();
    console.log(this.dbname);
    return this.client.db(this.dbname);
  }

  async dbClose() {
    await this.client.close();
  }
}
