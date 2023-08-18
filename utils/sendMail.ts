import nodemailer from "nodemailer";

async function sendEmail() {
  // 建立一個可重複使用的 "transporter" 物件
  let transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "kaojason87870423@gmail.com", // 寄送郵件的 Gmail 地址
      pass: "0905323703Jason" // 寄送郵件的 Gmail 密碼
    }
  });

  // 設定郵件選項
  let mailOptions = {
    from: "kaojason87870423@gmail.com", // 寄件者的郵件地址
    to: "kaojason870423@gmail.com", // 收件者的郵件地址
    subject: "測試郵件", // 郵件主旨
    text: "這是一封測試郵件。" // 郵件內文
  };

  try {
    // 使用 "transporter" 物件寄送電子郵件
    let info = await transporter.sendMail(mailOptions);
    console.log("郵件已寄送：", info.messageId);
  } catch (error) {
    console.log("寄送郵件時發生錯誤：", error);
  }
}

sendEmail();
