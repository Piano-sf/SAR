import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// API สำหรับบันทึก มคอ.
router.post('/api/documents', async (req, res) => {
  try {
    const { type, courseCode, courseName, semester, academicYear, content, userId } = req.body;

    const newDoc = await prisma.document.create({
      data: {
        type,
        courseCode,
        courseName,
        semester,
        academicYear,
        content, // Prisma จะจัดการ Save เป็น JSON ให้เลย
        userId
      }
    });

    res.status(201).json(newDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Cannot save document" });
  }
});

export default router;