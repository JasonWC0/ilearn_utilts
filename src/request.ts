import * as https from 'https';
import * as fs from 'fs/promises';

export async function alfrescoDownload(url: string): Promise<void | false> {
  try {
    const nodeId: string = extractNodeRef(url);
    console.log('nodeId', nodeId);

    const account: string = 'jasonwc_kao';
    const password: string = 'Aaz789789@@@@@@';
    const FILE_PATH: string = './course-price/iLearn-Pricing-Schedule.jpg';
    const api: string = `https://tpeswhqalf01.compal.com/alfresco/service/api/node/content/workspace/SpacesStore/${nodeId}?a=true`;

    const options: https.RequestOptions = {
      hostname: 'tpeswhqalf01.compal.com',
      path: `/alfresco/service/api/node/content/workspace/SpacesStore/${nodeId}?a=true`,
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(account + ':' + password).toString('base64'),
      },
      rejectUnauthorized: false,
    };

    const req: https.ClientRequest = https.request(options, (res: https.IncomingMessage) => {
      let data: Buffer[] = [];

      res.on('data', (chunk: Buffer) => {
        data.push(chunk);
      });

      res.on('end', async () => {
        let buffer: Buffer = Buffer.concat(data);
        await fs.writeFile(FILE_PATH, buffer);
      });
    });

    req.on('error', (error: Error) => {
      console.error(error);
    });

    req.end();

  } catch (error) {
    return false;
  }
}

function extractNodeRef(url: string): string {
  const pattern: RegExp = /nodeRef=workspace:\/\/SpacesStore\/([a-f0-9-]+)/;
  const match: RegExpMatchArray | null = url.match(pattern);

  if (match) {
    return match[1];
  } else {
    throw new Error('輸入URL格式不正確！');
  }
}
