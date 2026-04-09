import express, { Express } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { initCronJobs } from './jobs/reminderJob';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();
const app: Express = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

// API ดู Notification
app.get('/api/notifications', async (req, res) => {
  const notis = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(notis);
});

// เริ่มต้นระบบอัตโนมัติ
initCronJobs(io);

httpServer.listen(3001, () => {
  console.log('🚀 Backend 2.0 started at http://localhost:3001');
});

// API สำหรับบันทึก มคอ. ลง Database
app.post('/api/documents', async (req, res) => {
  try {
    const { type, courseCode, courseName, semester, academicYear, content, userId } = req.body;

    const newDoc = await prisma.document.create({
      data: {
        type,
        courseCode,
        courseName,
        semester: parseInt(semester) || 1,
        academicYear,
        content: content, // บันทึกก้อน JSON จาก Frontend
        userId: userId || 1 // ถ้ายังไม่มีระบบ Login ให้ Default เป็น 1
      }
    });

    res.status(201).json({ message: "บันทึกสำเร็จ", data: newDoc });
  } catch (error) {
    console.error("Save Document Error:", error);
    res.status(500).json({ error: "ไม่สามารถบันทึกเอกสารได้" });
  }
});

// API สำหรับดึงรายการเอกสารทั้งหมด
app.get('/api/documents', async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      include: {
        user: true, // ดึงชื่อผู้รับผิดชอบมาด้วย
      },
      orderBy: {
        createdAt: 'desc', // เอาอันใหม่ขึ้นก่อน
      },
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลเอกสารได้" });
  }
});