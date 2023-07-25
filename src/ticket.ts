/**
 * FeaturePath: 自動化-報表-即享券-即享券報表產製
 * Accountable: Hilbert Huang
*/
// -*- coding: utf-8 -*-

//產出簡易即享券月報表
//@author: Hilbert

// ---------------------------------------- import * from node_modules ----------------------------------------
import mongoose, { Document, Schema, Types } from 'mongoose';
import * as dfd from "danfojs"
import * as fs from "fs"
import mo from 'moment'
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
const xlsxPopulate = require('xlsx-populate');
const { DataFrame, replace } = require('dataframe-js');
import mongodb, { MongoClient } from 'mongodb';
const url = 'mongodb://34.80.83.237:32018/icare_elearning';
const client = new MongoClient(url, { auth: { user: 'icare', password: 'iLearning0Care' } });
const endPoint = `https://icarechat.compal-health.com/api/v1/chat-rooms`

// excel格式
interface RowData {
    [key: string]: string | number;
}

// 資料庫連線
// uat-database-expresstickets
//test 
// async function connectToDatabase() {
//     const uri = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
//     await mongoose.connect(uri, {
//         auth: {
//             username: 'icare',
//             password: 'UATg0Icare'
//         },
//     });
// }

// product-database-expresstickets

async function getCollection(collection: string) {
    //const db = client.db('icare_elearning_v15');
    const db = client.db('icare_elearning');
    const licenseCol = db.collection(collection);
    return licenseCol
}



// 生成即享券簡易報表
async function ExpressticketMonthreport() {
    //test
    //const uri = 'mongodb://104.199.235.97:32018/icare_elearning_v15'; // 替换为你的 MongoDB 连接字符串
    //const dbName = 'icare_elearning_v15'; // 替换为你的数据库名称
    //const collectionName = 'expresstickets'; // 替换为你的集合名称
    try {
        await client.connect();
        //test
        //const db = client.db('icare_elearning_v15');
        //const collection = db.collection('expressticket');


        const df = await Ticketget()
        const [all] = df.dim()

        // 計算status1~4的次數跟即享券張數 
        // 需要列舉enums
        const numstatus1 = df.countValue(1, 'status')
        const numstatus2 = df.countValue(2, 'status')
        const numstatus3 = df.countValue(3, 'status')
        const numstatus4 = df.countValue(4, 'status')

        // 100元即享券次數計算
        const num11 = df.filter({ 'status': 1 }).countValue("100元多選一福利即享券", 'productName')
        const num12 = df.filter({ 'status': 2 }).countValue("100元多選一福利即享券", 'productName')
        const num13 = df.filter({ 'status': 3 }).countValue("100元多選一福利即享券", 'productName')
        const num14 = df.filter({ 'status': 4 }).countValue("100元多選一福利即享券", 'productName')

        // 5000元即享券次數計算
        const num21 = df.filter({ 'status': 1 }).countValue("500元多選一福利即享券", 'productName')
        const num22 = df.filter({ 'status': 2 }).countValue("500元多選一福利即享券", 'productName')
        const num23 = df.filter({ 'status': 3 }).countValue("500元多選一福利即享券", 'productName')
        const num24 = df.filter({ 'status': 4 }).countValue("500元多選一福利即享券", 'productName')

        // 1000元即享券次數計算
        const num31 = df.filter({ 'status': 1 }).countValue("1000元多選一福利即享券", 'productName')
        const num32 = df.filter({ 'status': 2 }).countValue("1000元多選一福利即享券", 'productName')
        const num33 = df.filter({ 'status': 3 }).countValue("1000元多選一福利即享券", 'productName')
        const num34 = df.filter({ 'status': 4 }).countValue("1000元多選一福利即享券", 'productName')

        const df1 = new DataFrame([
            ['100元即享券', num11, num12, num13, num14],
            ['500元即享券', num21, num22, num23, num24],
            ['1000元即享券', num31, num32, num33, num34]
        ], ['即享券類別', '可用', '已抽中，未完成兌獎', '已抽中，已完成兌獎', '已兌換或已繳費']);

        // 將status 1~4 替換為對應狀況
        const df2 = df.replace(1, '可用').replace(2, '已抽中，未完成兌獎').replace(3, '已抽中，已完成兌獎').replace(4, '已兌換或已繳費')
        // 生成cvs檔
        df1.toCSV(true, 'ticketone.csv')
        df2.toCSV(true, 'tickettwo.csv')

        // 轉成 xlsx檔
        const csvFilePathone = 'ticketone.csv';
        const outputFilePathone = 'tickettwo.xlsx';
        await csvToExcel(csvFilePathone, outputFilePathone)
            .then(() => {
                console.log('CSV data has been converted to Excel successfully!');
            })
            .catch((error) => {
                console.error('Error converting CSV to Excel:', error);
            });
        const csvFilePathtwo = 'tickettwo.csv';
        const outputFilePathtwo = 'ticketone.xlsx';
        await csvToExcel(csvFilePathtwo, outputFilePathtwo)
            .then(() => {
                console.log('CSV data has been converted to Excel successfully!');
            })
            .catch((error) => {
                console.error('Error converting CSV to Excel:', error);
            });


        // 修改格式
        await addFrozenPanesAndHeaderWithFilter('ticketone.xlsx', 'test1.xlsx')
        await addFrozenPanesAndHeaderWithFilter('tickettwo.xlsx', 'test.xlsx')
        // 合併檔案
        await mergeExcelFiles();
        // 修改檔名以及最終格式
        const filename = `iLearn-即享券-月報表-${mo.utc().format('YYYYMM')}-Hilbert.xlsx`
        await addFrozenPanesAndHeaderToSheet2('iLearn即享券簡易月報表.xlsx', filename)
        // 刪除csv檔
        await deleteCSVFile('ticketone.csv');
        await deleteCSVFile('tickettwo.csv');
        async function deleteCSVFile(filePath: string) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting the CSV file:', err);
                } else {
                    console.log('CSV file deleted successfully!');
                }
            });
        }

        // 刪除xlsx檔
        await deleteXLSXFile('ticketone.xlsx')
        await deleteXLSXFile('tickettwo.xlsx')
        await deleteXLSXFile('test.xlsx')
        await deleteXLSXFile('test1.xlsx')
        await deleteXLSXFile('iLearn即享券簡易月報表.xlsx')
        async function deleteXLSXFile(filePath: string) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Error deleting the XLSX file:', err);
                } else {
                    console.log('XLSX file deleted successfully!');
                }
            });
        }

    } catch (error) {
        console.error("Error occurred:", error);
    } finally {
        // 斷開與 MongoDB 的連接
        client.close();
    }
}
ExpressticketMonthreport().then(() => {
    console.log('Offline process completed');
}).catch(error => console.error('Error:', error));




// 讀取expressticket資料庫資料
async function Ticketget() {

    const pipeline = [
        {
            $project: {
                productName: 1,
                status: 1,
            },
        },
    ];
    const courssesC = await getCollection("expresstickets")
    const expresstickets = await courssesC.aggregate(pipeline).toArray()
    const jsonCourses = JSON.stringify(expresstickets);
    const data = JSON.parse(jsonCourses)
    const df = new DataFrame(data);
    return df
}







// 合併兩個excel檔在不同工作表 
async function mergeExcelFiles() {
    const file1Path = 'test1.xlsx'; // 第一个 Excel 文件路径
    const file2Path = 'test.xlsx'; // 第二个 Excel 文件路径
    const mergedFilePath = 'iLearn即享券簡易月報表.xlsx'; // 合并后的 Excel 文件路径

    const workbook1 = new ExcelJS.Workbook();
    const workbook2 = new ExcelJS.Workbook();

    // 读取第一个 Excel 文件
    await workbook1.xlsx.readFile(file1Path);

    // 读取第二个 Excel 文件
    await workbook2.xlsx.readFile(file2Path);

    // 合并两个 Excel 文件的工作表
    workbook2.eachSheet((sheet, sheetId) => {
        const newSheetName = sheetId === 1 ? '總計' : '盤點'; // 设置新的工作表名称
        const newSheet = workbook1.addWorksheet(newSheetName); // 在第一个工作簿中创建新的工作表

        // 复制第二个工作表的内容到新的工作表
        sheet.eachRow((row, rowNumber) => {
            row.eachCell((cell, colNumber) => {
                newSheet.getCell(rowNumber, colNumber).value = cell.value;
            });
        });
    });

    const worksheet1 = workbook1.getWorksheet(1);
    worksheet1.name = '盤點';

    // 将合并后的数据写入新的 Excel 文件
    await workbook1.xlsx.writeFile(mergedFilePath);

    console.log('Excel files merged successfully!');
}



// 合併兩個excel檔在同一個工作表 
async function mergeExcelFilestable() {
    const file1Path = 'ticketone.xlsx'; // 第一个 Excel 文件路径
    const file2Path = 'tickettwo.xlsx'; // 第二个 Excel 文件路径
    const mergedFilePath = 'iLearn即享券簡易月報表.xlsx'; // 合并后的 Excel 文件路径

    const workbook1 = new ExcelJS.Workbook();
    const workbook2 = new ExcelJS.Workbook();

    // 读取第一个 Excel 文件
    await workbook1.xlsx.readFile(file1Path);

    // 读取第二个 Excel 文件
    await workbook2.xlsx.readFile(file2Path);

    const worksheet1 = workbook1.getWorksheet('Sheet1');
    const worksheet2 = workbook2.getWorksheet('Sheet1');

    // 获取第一个工作表的行数和列数
    const numRows1 = worksheet1.rowCount;
    const numCols1 = worksheet1.columnCount;

    // 获取第二个工作表的行数和列数
    const numRows2 = worksheet2.rowCount;
    const numCols2 = worksheet2.columnCount;


    // 将第二个工作表的数据列插入到第一个工作表的右侧
    for (let colNumber = 1; colNumber <= numCols2; colNumber++) {
        for (let rowNumber = 1; rowNumber <= numRows2; rowNumber++) {
            const cellValue = worksheet2.getCell(rowNumber, colNumber).value;
            worksheet1.getCell(rowNumber, numCols1 + colNumber).value = cellValue;
        }
    }

    // 将合并后的数据写入新的 Excel 文件
    await workbook1.xlsx.writeFile(mergedFilePath);

    console.log('Excel files merged successfully!');


}



// CSV檔轉成Xlsx
async function csvToExcel(csvFilePath: string, outputFilePath: string) {
    // 读取CSV文件内容
    const csvData = fs.readFileSync(csvFilePath, 'utf-8');

    // 解析CSV数据
    const parsedData = Papa.parse<RowData>(csvData, {
        header: true, // 第一行为标题
    });

    // 创建Excel工作簿和工作表
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');

    // 将CSV标题行写入工作表
    const headerRow = worksheet.addRow(Object.keys(parsedData.data[0]));

    // 设置标题行样式
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
    });

    // 将CSV数据写入工作表
    parsedData.data.forEach((row) => {
        worksheet.addRow(Object.values(row));
    });

    // 将数据写入文件
    await workbook.xlsx.writeFile(outputFilePath);
}


//增加標頭灰底白字、篩選功能、凍結表格跟欄位長度(單個excel檔)
async function addFrozenPanesAndHeaderWithFilter(inputFilePath: string, outputFilePath: string) {
    // Load the existing Excel workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputFilePath);

    // Get the first worksheet
    const worksheet = workbook.getWorksheet(1);

    // Set frozen panes
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Add header row and set style
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; // White font color and bold text
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } }; // Gray background color
    });

    // Determine the data range (excluding the header row)
    const startCell = worksheet.getCell('A1');
    const endCell = worksheet.getCell(worksheet.rowCount, worksheet.columnCount);
    const dataRange = startCell.address + ':' + endCell.address;

    // Enable autoFilter on the entire data range
    worksheet.autoFilter = dataRange;
    worksheet.columns.forEach((column) => {

        column.width = 25; // Set the column width, adding some extra space (2) and limiting it to a maximum width of 50
    });
    // Save the updated workbook to the output file
    await workbook.xlsx.writeFile(outputFilePath);
}


//增加標頭灰底白字、篩選功能、凍結表格跟欄位長度(最終excel的工作表2)
async function addFrozenPanesAndHeaderToSheet2(inputFilePath: string, outputFilePath: string) {
    // Load the existing Excel workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(inputFilePath);

    // Get the second worksheet (index 1-based)
    const worksheet = workbook.getWorksheet(2);

    // Set frozen panes
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Add header row and set style
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }; // White font color and bold text
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF666666' } }; // Gray background color
    });
    //添加篩選功能
    const startCell = worksheet.getCell('A1');
    const endCell = worksheet.getCell(worksheet.rowCount, worksheet.columnCount);
    const dataRange = startCell.address + ':' + endCell.address;
    worksheet.autoFilter = dataRange;
    worksheet.columns.forEach((column) => {

        column.width = 23; // Set the column width, adding some extra space (2) and limiting it to a maximum width of 50
    });
    // Save the updated workbook to the output file
    await workbook.xlsx.writeFile(outputFilePath);
}

function moment() {
    throw new Error('Function not implemented.');
}
