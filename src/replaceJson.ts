import * as fs from 'fs';
import { JSDOM } from 'jsdom';

interface ReplaceDict {
  [key: string]: string;
}

function readAndReplaceContentInHTML(inputFilePath: string, outputFilePath: string, replaceDict: ReplaceDict) {
  // 讀取 HTML
  const htmlContent: string = fs.readFileSync(inputFilePath, 'utf-8');

  // 替換HTML模板中的特定內容為輸入的內容
  let newHtmlContent: string = htmlContent;
  for (let key in replaceDict) {
    newHtmlContent = newHtmlContent.replace(`{${key}}`, replaceDict[key]);
  }

  // 解析 HTML
  const dom = new JSDOM(newHtmlContent);
  const document = dom.window.document;

  // 提取 HTML 中的資訊
  let infoDict: { [key: string]: string } = {};

  // 將每個段落中的資訊提取出來
  const pElements = document.querySelectorAll('p');
  pElements.forEach((p: any) => {
    const info: string[] = p.textContent.split('：');
    if (info.length === 2) {
      const key: string = info[0].trim();
      const value: string = info[1].trim();
      infoDict[key] = value;
    }
  });

  // 將新的HTML內容保存到檔案中
  fs.writeFileSync(outputFilePath, dom.serialize(), 'utf-8');

  return infoDict;
}

// 使用方式
let replaceDict: ReplaceDict = {
  "teacherName": "王大明",
  "coursetTime": "3小時",
  "creditSerial": "12345",
  "creditSerialSartAt": "2023-07-01",
  "creditSerialEndAt": "2023-07-31",
  "courseFee": "2000",
  "specialPrice": "1800",
  "targetGroup1": "精神病護理師",
  "targetGroup2": "家屬",
  "courseContent1": "課程內容1",
  "courseContent2": "課程內容2",
  "courseContent3": "課程內容3",
  "courseContent4": "課程內容4",
  "learningEffeciency1": "學習效果1",
  "learningEffeciency2": "學習效果2",
  "learningEffeciency3": "學習效果3",
};

let infoDict = readAndReplaceContentInHTML('././public/introduction.html', '././public/newIntroduction.html', replaceDict);
console.log(infoDict);
