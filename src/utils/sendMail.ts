import nodemailer, { Transporter } from "nodemailer";

async function sendMail(sender: string, recipient: string, subject: string, message: string): Promise<void> {
  // 创建一个可用于发送邮件的 Transporter 对象
  const transporter: Transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.error("Error occurred while sending email:", error);
  }
}
sendMail("kaojason87870423@gmail.com", "kaojason87870423@gmail.com", "Hello", "This is the message body.")
  .catch(console.error);
