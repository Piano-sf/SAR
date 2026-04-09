import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { sendEmail, sendTeamsMessage } from '../services/notificationService';

const prisma = new PrismaClient();

export const initCronJobs = (io: any) => {
  // ตั้งค่าให้รันทุกๆ 1 นาที เพื่อการทดสอบ (ถ้าส่งงานจริงค่อยเปลี่ยนเป็น '0 8 * * *' คือทุก 8 โมงเช้า)
  cron.schedule('* * * * *', async () => {
    console.log('--- 🕒 Checking Deadlines: ' + new Date().toLocaleString() + ' ---');

    try {
      // 1. ดึงข้อมูล Deadline ทั้งหมด (เราลบเงื่อนไขวันที่ออกเพื่อให้ Test ง่ายขึ้น)
      const deadlines = await prisma.deadline.findMany({
        include: { lecturer: true }
      });

      console.log(`Found ${deadlines.length} deadlines in database.`);

      if (deadlines.length === 0) {
        console.log('No deadlines found. Please add data in DBeaver.');
        return;
      }

      for (const d of deadlines) {
        const message = `⚠️ แจ้งเตือนกำหนดส่ง: "${d.title}" มีกำหนดส่งวันที่ ${new Date(d.dueDate).toLocaleDateString('th-TH')}`;

        // 2. ส่ง Email (ต้องตั้ง App Password ใน .env ก่อน)
        if (d.lecturer.email) {
          await sendEmail(d.lecturer.email, 'ระบบแจ้งเตือน QA Reminder', message);
          console.log(`✅ Email sent to: ${d.lecturer.email}`);
        }

        // 3. ส่ง Microsoft Teams (ถ้ามี Webhook)
        if (d.lecturer.teamsWebhook) {
          await sendTeamsMessage(d.lecturer.teamsWebhook, message);
          console.log(`✅ Teams message sent for: ${d.title}`);
        }

        // 4. บันทึก Notification ลง Database เพื่อให้ Frontend ดึงไปโชว์
        const newNoti = await prisma.notification.create({
          data: {
            message: message,
            type: 'DEADLINE_REMINDER',
            userId: d.lecturerId,
            isRead: false
          }
        });

        // 5. ยิง Socket.io เพื่อให้หน้าจอ React เด้ง Notification ทันที
        io.emit('notification:received', newNoti);
        console.log(`🚀 Socket emitted for: ${d.title}`);
      }

    } catch (error) {
      console.error('❌ Error in Cron Job:', error);
    }
  });
};