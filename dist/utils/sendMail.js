"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
async function sendMail(sender, recipient, subject, message) {
    // 创建一个可用于发送邮件的 Transporter 对象
    const transporter = nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: "kaojason87870423@gmail.com",
            pass: "0905323703Jason"
        }
    });
    // 配置邮件选项
    const mailOptions = {
        from: sender,
        to: recipient,
        subject: subject,
        text: message
    };
    try {
        // 发送邮件
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully!");
    }
    catch (error) {
        console.error("Error occurred while sending email:", error);
    }
}
sendMail("kaojason87870423@gmail.com", "kaojason87870423@gmail.com", "Hello", "This is the message body.")
    .catch(console.error);
