"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ExcelJS = __importStar(require("exceljs"));
const judgeDuplicate_1 = require("./judgeDuplicate");
const now = new Date();
async function exportToExcel(filename) {
    const data = await (0, judgeDuplicate_1.judge)(judgeDuplicate_1.serials);
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
        const header = column.header;
        if (header) {
            column.width = header.length < 12 ? 12 : header.length;
        }
    });
    // Save workbook to file
    await workbook.xlsx.writeFile(filename);
    console.log('Excel file exported successfully.');
}
const filename = `output_${now.getMilliseconds()}.xlsx`;
exportToExcel(filename);
