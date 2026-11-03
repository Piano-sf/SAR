# QA Document Management System (SAR) — ระบบบริหารจัดการเอกสารประกันคุณภาพการศึกษาและแจ้งเตือนกำหนดส่งอัตโนมัติ

> **ประเภทโครงงาน:** โครงงานปริญญาตรี (Senior Project)  
> **ขอบเขตระบบ:** Full-Stack Web Application (React 19 + Express 5 + Prisma ORM + MySQL + Real-time Socket.io)

**QA Document Management System** คือระบบเว็บแอปพลิเคชันแบบ Full-Stack สำหรับบริหารจัดการงานประกันคุณภาพการศึกษาภายในคณะ/มหาวิทยาลัย ช่วยให้อาจารย์และเจ้าหน้าที่สามารถจัดทำ ส่งตรวจ และติดตามสถานะเอกสารมาตรฐานคุณวุฒิระดับอุดมศึกษา (**มคอ.3 / TQF3**, **มคอ.5 / TQF5**) และผลงานทางวิชาการได้ในที่เดียว พร้อมระบบแจ้งเตือนกำหนดส่งงานอัตโนมัติแบบหลายช่องทาง (**In-App Real-time Notification, Email และ Microsoft Teams Webhook**)

---

## จุดเด่นของระบบ (Key Features)

- **ระบบจัดทำและบริหารจัดการเอกสาร มคอ. (TQF3 / TQF5 & Academic Works)**:
  - แบบฟอร์มกรอกข้อมูลเอกสาร **มคอ.3 (TQF3)**, **มคอ.5 (TQF5)** และผลงานทางวิชาการ (`AcademicWorkForm`) แบบโครงสร้าง JSON ที่ยืดหยุ่นต่อการปรับเปลี่ยนหมวดหมู่ตามเกณฑ์ประกันคุณภาพ
  - รองรับการบันทึกฉบับร่าง (`DRAFT`), ส่งตรวจ (`SUBMITTED`), ตรวจสอบพรีวิวเอกสาร (`DocumentPreview`) และระบบอนุมัติเอกสารสำหรับผู้ดูแล (`APPROVED` ผ่านหน้า `AdminApproval`)
- **ระบบแจ้งเตือนกำหนดส่งอัตโนมัติหลายช่องทาง (Multi-Channel Automated Reminder)**:
  - ใช้ `node-cron` ตรวจสอบกำหนดส่งเอกสาร (`Deadline`) ของอาจารย์แต่ละท่านตามตารางเวลาอัตโนมัติ
  - แจ้งเตือนพร้อมกัน 3 ช่องทาง:
    1. **Real-time Web Notification** ผ่าน `Socket.io` แสดงผลบนหน้าจอทันทีโดยไม่ต้องรีเฟรช
    2. **Email Notification** ผ่าน `Nodemailer` (SMTP)
    3. **Microsoft Teams Notification** ยิงข้อความเข้าแชนเนลหรือแชตผ่าน Incoming Webhook
- **แดชบอร์ดสรุปภาพรวมสำหรับผู้บริหารและผู้ดูแล (QA Analytics Dashboard)**:
  - แสดงสถิติการส่งเอกสาร สถานะความคืบหน้าของแต่ละรายวิชา/ภาคการศึกษา และการจัดการรายชื่อบุคลากร (`UserList`, `DeadlineSettings`) ด้วยกราฟจาก `Recharts`

---

## เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend (`client/`)
- **Framework**: React 19, Vite, React Router v7
- **Styling & Icons**: Tailwind CSS v4, Lucide React, React Icons
- **Data Visualization & Real-time**: Recharts, Socket.io Client, Axios

### Backend (`server/`)
- **Runtime & Framework**: Node.js, Express 5 (TypeScript)
- **Database & ORM**: MySQL, Prisma ORM (`@prisma/client`)
- **Real-time & Background Jobs**: Socket.io, Node-Cron (`node-cron`)
- **Integrations & Security**: Nodemailer (SMTP Email), Axios (MS Teams Webhook), JWT (`jsonwebtoken`), Bcrypt.js

---

## สถาปัตยกรรมระบบ (System Architecture)

```mermaid
flowchart LR
    subgraph Client ["Frontend (React 19 + Tailwind v4)"]
        UI["Dashboard / TQF Form / Admin Approval"]
        SC["Socket.io Client"]
    end

    subgraph Server ["Backend (Express 5 + TypeScript)"]
        API["REST API (/api/documents, /api/notifications)"]
        CRON["Cron Scheduler (reminderJob.ts)"]
        NOTI["Notification Service"]
    end

    subgraph Database ["Database (MySQL + Prisma)"]
        DB[("User / Document / Deadline / Notification")]
    end

    subgraph External ["External Channels"]
        SMTP["SMTP Email Server"]
        TEAMS["Microsoft Teams Webhook"]
    end

    UI -- "HTTP REST (Axios)" --> API
    API -- "Prisma Client" --> DB
    CRON -- "ตรวจสอบกำหนดส่ง (Deadline)" --> DB
    CRON --> NOTI
    NOTI -- "1. บันทึกแจ้งเตือน" --> DB
    NOTI -- "2. Real-time Event" --> SC
    NOTI -- "3. ส่งอีเมล" --> SMTP
    NOTI -- "4. ส่งแจ้งเตือนเข้าทีม" --> TEAMS
```

---

## โครงสร้างโปรเจค (Project Structure)

```text
SAR/
├── client/                              # ส่วนหน้าบ้าน (React 19 + Vite)
│   ├── src/
│   │   ├── components/                  # คอมโพเนนต์ส่วนกลาง (Navbar, Sidebar ฯลฯ)
│   │   ├── layouts/                     # โครงหน้าเว็บหลัก (Main Layout)
│   │   ├── pages/                       # หน้าจอทั้งหมดของระบบ
│   │   │   ├── Dashboard.jsx            # หน้าแดชบอร์ดสรุปภาพรวมการส่งเอกสาร
│   │   │   ├── TQFForm.jsx              # แบบฟอร์มจัดทำเอกสาร มคอ.3 / มคอ.5
│   │   │   ├── AcademicWorkForm.jsx     # แบบฟอร์มบันทึกผลงานทางวิชาการ
│   │   │   ├── DocumentList.jsx         # รายการเอกสารและสถานะ
│   │   │   ├── DocumentPreview.jsx      # หน้าแสดงตัวอย่างเอกสารก่อนพิมพ์/อนุมัติ
│   │   │   ├── AdminApproval.jsx        # หน้าตรวจสอบและอนุมัติเอกสารสำหรับผู้ดูแล
│   │   │   ├── DeadlineSettings.jsx     # หน้าตั้งค่ากำหนดส่งเอกสาร (Deadlines)
│   │   │   ├── NotificationList.jsx     # หน้าประวัติการแจ้งเตือน
│   │   │   └── UserList.jsx             # หน้าจัดการข้อมูลอาจารย์และบุคลากร
│   │   └── App.jsx                      # ตั้งค่า Routing ของระบบ
│   └── package.json
├── server/                              # ส่วนหลังบ้าน (Express 5 + Prisma + Socket.io)
│   ├── prisma/
│   │   └── schema.prisma                # โครงสร้างตารางฐานข้อมูล (User, Document, Deadline, Notification)
│   ├── src/
│   │   ├── index.ts                     # จุดเริ่มต้นเซิร์ฟเวอร์ Express & Socket.io
│   │   ├── routes/
│   │   │   └── documentRoutes.ts        # API Routes สำหรับจัดการเอกสาร
│   │   ├── jobs/
│   │   │   └── reminderJob.ts           # Cron Job ตรวจสอบกำหนดส่งและส่งแจ้งเตือนอัตโนมัติ
│   │   └── services/
│   │       └── notificationService.ts   # บริการส่ง Email (Nodemailer) และ MS Teams Webhook
│   ├── .env.example                     # ตัวอย่างไฟล์ตั้งค่า Environment Variables
│   └── package.json
└── README.md                            # เอกสารอธิบายโปรเจค
```

---

## โครงสร้างฐานข้อมูล (Database Schema)

ฐานข้อมูล MySQL ดูแลผ่าน **Prisma ORM** ([`server/prisma/schema.prisma`](server/prisma/schema.prisma)) ประกอบด้วย 4 ตารางหลัก:
1. **`User` (`user`)**: ข้อมูลผู้ใช้งาน (`email`, `name`, `role` เช่น `LECTURER` / `ADMIN`, และ `teamsWebhook`)
2. **`Document` (`document`)**: ข้อมูลเอกสารประกันคุณภาพ (`type` เช่น `TQF3`/`TQF5`, `courseCode`, `courseName`, `semester`, `academicYear`, `content` แบบ JSON, และ `status`: `DRAFT` | `SUBMITTED` | `APPROVED`)
3. **`Deadline` (`deadline`)**: กำหนดส่งเอกสารแต่ละรายการ (`title`, `description`, `dueDate`, ผูกกับอาจารย์ผู้รับผิดชอบ)
4. **`Notification` (`notification`)**: ประวัติการแจ้งเตือนในระบบ (`message`, `type`, `isRead`, `createdAt`)

---

## การติดตั้งและรันโปรเจคในเครื่อง (Getting Started)

### สิ่งที่ต้องเตรียมล่วงหน้า (Prerequisites)
- **Node.js** (เวอร์ชัน 18 ขึ้นไป)
- **MySQL Server** สำหรับเก็บข้อมูลระบบ

### 1. โคลนโปรเจคและติดตั้งแพ็กเกจทั้งหมด
```bash
git clone https://github.com/Piano-sf/SAR.git
cd SAR
npm run install:all
```

### 2. ตั้งค่า Environment Variables ของฝั่ง Server
คัดลอกไฟล์ตัวอย่าง `server/.env.example` ไปเป็น `server/.env` และแก้ไขค่าการเชื่อมต่อฐานข้อมูล MySQL และ SMTP:
```bash
cp server/.env.example server/.env
```

| ตัวแปร | คำอธิบาย |
| :--- | :--- |
| `DATABASE_URL` | Connection String ของฐานข้อมูล MySQL (เช่น `mysql://root:password@localhost:3306/qa_document_db`) |
| `PORT` | พอร์ตของฝั่ง Backend API (ค่าเริ่มต้น `3001`) |
| `SMTP_HOST` / `SMTP_PORT` | โฮสต์และพอร์ตของเซิร์ฟเวอร์อีเมลสำหรับการแจ้งเตือน |
| `EMAIL_USER` / `EMAIL_PASS` | บัญชีอีเมลและรหัสผ่าน (App Password) สำหรับส่งแจ้งเตือน |

### 3. สร้างตารางฐานข้อมูลด้วย Prisma
```bash
cd server
npm run prisma:generate
npm run prisma:migrate
cd ..
```

### 4. เริ่มรันระบบ (Frontend + Backend)
เปิดเทอร์มินัล 2 หน้าต่างเพื่อรันฝั่ง Server และฝั่ง Client:

**เทอร์มินัลที่ 1 (Backend API & Socket.io — พอร์ต `3001`):**
```bash
npm run dev:server
```

**เทอร์มินัลที่ 2 (Frontend React — พอร์ต `5173`):**
```bash
npm run dev:client
```
