import nodemailer from 'nodemailer';
import axios from 'axios';

const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'stanley.schaefer0@ethereal.email',
        pass: 'gQg3RjkSAqDkgpPQNg'
    }
});

// ใน src/services/notificationService.ts
export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    await transporter.sendMail({
    from: `"QA Support System" <${process.env.EMAIL_USER}>`, // ใส่ชื่อระบบให้ชัดเจน
    to: to,
    subject: `📌 แจ้งเตือน: ${subject}`, // เพิ่ม Icon หรือข้อความให้น่าเชื่อถือ
    text: text,
    html: `<p>${text}</p>`, // ใส่ HTML ไปด้วยจะช่วยลดโอกาสโดนมองเป็น Spam
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Email error:', error);
  }
};

export const sendTeamsMessage = async (webhookUrl: string, message: string) => {
  try {
    if (webhookUrl) await axios.post(webhookUrl, { text: message });
  } catch (error) {
    console.error('Teams error:', error);
  }
};