// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const XLSX = require('xlsx');
const notfound = [];
const RootPath = 'C:/project4/automation';
function updateFileComments(row) {
  const filePath = path.join(RootPath, row.Path0, row.Path1, row.Path2, row.Filename);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    notfound.push(filePath);
    return;
  }
  //  C:\project4\automation\EC\SonarQube\o2o-ci-web-22\Jenkinsfile.groovy
  const fileContent = fs.readFileSync(filePath, 'utf8');

  const ext = path.extname(filePath);
  let featurePathRegex, newComment;

  if (ext === '.js' || ext === '.ts' || ext === '.groovy') {
    featurePathRegex = /\/\*\*?\s*\* FeaturePath:[\s\S]*?\n\s*\* Accountable:[\s\S]*?\n\s*\*\//;
    // New comment to be added or updated
    newComment = `/**\n * FeaturePath: 不需處理---\n * Accountable: ${row.ACC}, ${row.ACC2}\n */`;
  } else if (ext === '.py') {
    // For Python files
    featurePathRegex = /'''\s*\* FeaturePath:[\s\S]*?\n\s*\* Accountable:[^\n]*\n\s*\*[\s\S]*?'''/g;
    newComment = `'''\n * FeaturePath: 不需處理---\n * Accountable: ${row.ACC}, ${row.ACC2}\n'''`;
  } else {
    console.warn(`Unsupported file type: ${ext}, skipping ${filePath}`);
    return;
  }

  let updatedContent;
  if (featurePathRegex.test(fileContent)) {
    updatedContent = fileContent.replace(/(Accountable:)[^\n]*/, `$1 ${row.ACC}, ${row.ACC2}`);
  } else {
    updatedContent = `${newComment}\n\n${fileContent}`;
  }

  fs.writeFileSync(filePath, updatedContent, 'utf8');
  console.log(`Updated comments in file: ${filePath}`);
}

// Process each row
const excelPath = '負責人更改.xlsx';
const inputFile = fs.readFileSync(excelPath);
// STEP_01.03: 讀取匯入報表
const workbook = XLSX.read(inputFile, { type: 'buffer' });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(sheet);
jsonData.forEach(updateFileComments);
