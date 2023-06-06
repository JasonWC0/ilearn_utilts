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
exports.offline = exports.closeChatRoom = void 0;
const request = __importStar(require("request"));
const mongodb_1 = require("mongodb");
const fs = require('fs');
const url = 'mongodb://104.199.235.97:32018/icare_elearning_v15';
const client = new mongodb_1.MongoClient(url, { auth: { user: 'icare', password: 'UATg0Icare' } });
const endPoint = `https://icarechat.compal-health.com/api/v1/chat-rooms`;
async function getCollection(collection) {
    const db = client.db('icare_elearning_v15');
    // const db = client.db('icare_elearning');
    const licenseCol = db.collection(collection);
    return licenseCol;
}
function logMessage(message) {
    const timestamp = new Date().toISOString();
    const log = `${timestamp} - ${message}`;
    console.log(log);
    // 將log寫入檔案或其他目的地
    fs.appendFileSync('logs.log', log + '\n');
}
const closeChatRoom = async (chatRoomId) => {
    console.log(`${endPoint}/${chatRoomId}/status/close`);
    return new Promise((resolve, reject) => {
        return request.patch(`${endPoint}/${chatRoomId}/status/close`, (err, res, body) => {
            if (err) {
                reject(err);
            }
            try {
                const { code, message, result } = JSON.parse(body);
                console.log('closeChatRoom');
                if (code && message) {
                    throw new Error(message);
                }
                return resolve(result);
            }
            catch (err) {
                console.error('closeChatRoom catch err', err);
                return reject('err');
            }
        });
    });
};
exports.closeChatRoom = closeChatRoom;
function subtractDays(date, days) {
    const result = new Date(date);
    result.setDate(date.getDate() - days);
    return result;
}
async function offline() {
    try {
        await client.connect();
        const courssesC = await getCollection("courses");
        const courseplanC = await getCollection('courseplans');
        const productC = await getCollection('products');
        const currentDate = new Date();
        const threeDaysAfter = new Date(currentDate.getTime() + (3 * 24 * 60 * 60 * 1000));
        const OneDaysAgo = new Date(currentDate.getTime() - (1 * 24 * 60 * 60 * 1000));
        const query = { 'creditSerialEndAt': { $gte: OneDaysAgo, $lt: threeDaysAfter } };
        console.log(query);
        const overedueCourses = await courssesC.find(query).toArray();
        const overeSerials = overedueCourses.map((x) => x.serial);
        const overdueCoursePlan = await courseplanC.find({ serial: { $in: overeSerials } }).toArray();
        const now = new Date();
        const packages = [];
        const productId = [];
        const allOverdue = [];
        const overduelSerial = await Promise.all(overdueCoursePlan.map(async (coursePlan) => {
            if (coursePlan.type === "LIVE") {
                // if (new Date(coursePlan.liveInfo.startAt).getTime() < now)
                allOverdue.push({ serial: coursePlan.serial, type: 'LIIVE' });
                return 'LIVE';
            }
            if (coursePlan.status == 'OFFLINE') {
                allOverdue.push({ serial: coursePlan.serial, type: 'OFFLINE' });
                return 'offline';
            }
            // if (coursePlan.type === "LIVE") {
            //   const closeChatRoomRes = await closeChatRoom((coursePlan.liveInfo.chatRoomId as Types.ObjectId).toString())
            //   console.log(closeChatRoomRes)
            // }
            const course = await courssesC.findOne({ serial: coursePlan.serial });
            productId.push(course.productId);
            const coursePackge = await courssesC.find({ type: 'PACKAGE', packages: course._id }).toArray();
            for (let i in coursePackge) {
                if (coursePackge) {
                    console.log(coursePackge);
                    packages.push(coursePackge[i].serial);
                }
            }
            return coursePlan.serial;
        }));
        console.log('productId', productId);
        console.log('overeserial', overduelSerial);
        console.log('packages', packages);
        console.log('all', allOverdue);
        const rr = await courseplanC.find({ serial: { $in: overduelSerial } }).toArray();
        await courseplanC.updateMany({ serial: { $in: overduelSerial } }, { $set: { status: "OFFLINE" } });
        await courssesC.updateMany({ serial: { $in: overduelSerial } }, { $set: { offlineTime: now, online: false } });
        await courseplanC.updateMany({ serial: { $in: packages } }, { $set: { status: "OFFLINE" } });
        await courssesC.updateMany({ serial: { $in: packages } }, { $set: { offlineTime: now, online: false } });
        await productC.updateMany({ _id: { $in: productId } }, { $set: { status: 'OFFLINE' } });
        await client.close();
    }
    catch (err) {
        console.log(err);
    }
}
exports.offline = offline;
offline();
