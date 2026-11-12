import React, { useState, useEffect, useRef } from 'react';
import { CheckSquare, Clock, Calendar as CalendarIcon, FileText, BookOpen, Bell, User as UserIcon, LayoutDashboard, ChevronRight, X, Save, Camera, Mail, Building, GraduationCap, Link as LinkIcon, CheckCircle2, Lock, KeyRound, Loader2, Award } from 'lucide-react';
import { useUserStore } from '../../stores/useUserStore';
import { supabase } from '../../lib/supabase';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { Value } from 'react-calendar/src/shared/types.js';
import '../../App.css';
import emailjs from '@emailjs/browser';

// ประกาศโครงสร้างข้อมูลของงานที่ต้องทำ
interface TodoTask {
  id: string;
  source: 'course_tqf3' | 'course_tqf5' | 'deadline';
  task_type: string; // 'Document' | 'RESEARCH' ใช้กำหนดไอคอน/label ตอนแสดงผล
  task_title: string;
  due_date?: string;
  courseId?: string; // ใช้ตอน mark complete สำหรับรายการที่มาจาก courses.tqf3_status/tqf5_status
}

const LecturerDash = () => {
  // ดึง fullName, email, และข้อมูลสังกัดจาก Store
  const { id: userId, fullName, role, email, faculty: userFaculty, departmentName: userDepartment, avatarUrl, setUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // ใช้เช็คว่าตอนนี้อยู่หน้าไหน เพื่อทำไฮไลท์เมนู
  const location = useLocation();
  const navigate = useNavigate();

  const [calendarDate, setCalendarDate] = useState<Value>(new Date());

  // สร้าง State สำหรับเก็บงานที่ดึงมาจาก Database
  const [pendingTasks, setPendingTasks] = useState<TodoTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  // เก็บ id ของงานที่กำลังอยู่ระหว่างขีดฆ่า/เฟดออกก่อนตัดออกจากลิสต์จริง
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());

  // State สำหรับเปิด/ปิด Dropdown การแจ้งเตือน
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const [summary, setSummary] = useState({ totalWeight: 0, academicCount: 0, tqfComplete: 0 });

  // เพิ่ม State สำหรับเก็บวันที่ที่มีงาน
  const [taskDates, setTaskDates] = useState<string[]>([]);
  const [deadlineDates, setDeadlineDates] = useState<string[]>([]);
  const [adminDeadlines, setAdminDeadlines] = useState<any[]>([]);
  const [selectedDateTask, setSelectedDateTask] = useState<any | null>(null);
  const [allDeadlines, setAllDeadlines] = useState<any[]>([]);

  // เพิ่ม State สำหรับเก็บกิจกรรมจริง
  const [activities, setActivities] = useState<any[]>([]);

  // --- ฟังก์ชันอัปโหลดรูปของจริง ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !userId) return;
      
      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`; // เก็บไว้ในโฟลเดอร์ชื่อเดียวกับ ID ของ user

      // 1. อัปโหลดไฟล์ขึ้น Storage (ใช้ upsert: true เพื่อเขียนทับรูปเดิม)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

    // 2. ดึง Public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // ✨ สร้าง URL แบบมี Timestamp ก่อนเอาไปเซฟลง Database
    const timestampedUrl = `${publicUrl}?t=${new Date().getTime()}`;

    // 3. อัปเดต URL ลง Database (ต้องใช้ตัว timestampedUrl นะครับ!)
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar_url: timestampedUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 4. อัปเดต Zustand Store
    setUser({ avatarUrl: timestampedUrl });

    alert('อัปโหลดรูปโปรไฟล์สำเร็จ!');

    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- State สำหรับ Profile Modal ---
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState(fullName || '');
  const [isSaving, setIsSaving] = useState(false);

  // เมื่อเปิด Modal ให้ดึงชื่อล่าสุดมาใส่ฟอร์มรอไว้เลย
  useEffect(() => {
    if (isProfileOpen) setEditName(fullName || '');
  }, [isProfileOpen, fullName]);

  // ฟังก์ชันบันทึกข้อมูลลง Supabase และ Zustand
  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);

    // อัปเดตข้อมูลในตาราง users
    const { error } = await supabase
      .from('users')
      .update({ full_name: editName })
      .eq('id', userId);

    if (!error) {
      // อัปเดตใน Zustand Store เพื่อให้ชื่อบน Header เปลี่ยนทันทีไม่ต้องรีเฟรช
      setUser({ fullName: editName });
      setIsProfileOpen(false); // ปิด Popup
      alert('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
    setIsSaving(false);
  };

  // ดึงรายการที่ต้องทำจากข้อมูลจริง 2 แหล่ง:
  // 1) วิชาที่อาจารย์คนนี้สอนอยู่ (course_instructors) เช็คสถานะ tqf3_status / tqf5_status ของแต่ละวิชา
  //    หมายเหตุ: สมมติว่าค่าที่แปลว่า "ส่งแล้ว" คือ 'submitted' — ถ้าจริงๆ ในระบบใช้คำอื่น (เช่น 'completed')
  //    ให้เปลี่ยนเงื่อนไข c.tqf3_status !== 'submitted' ด้านล่างให้ตรงกับค่าจริง
  // 2) กำหนดการประเภทงานวิจัยจาก admin (ตาราง deadlines) ที่ยัง pending และ assign ถึงอาจารย์คนนี้
  const fetchMyTasks = async () => {
    if (!userId) return;
    setIsLoadingTasks(true);

    try {
      const todos: TodoTask[] = [];

      // 1) วิชาที่อาจารย์คนนี้รับผิดชอบ
      const { data: links, error: linksError } = await supabase
        .from('course_instructors')
        .select('course_id')
        .eq('teacher_id', userId);

      if (linksError) throw linksError;

      const courseIds = (links || []).map((l: any) => l.course_id);

      if (courseIds.length > 0) {
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id, code, name, tqf3_status, tqf5_status')
          .in('id', courseIds);

        if (coursesError) throw coursesError;

        (courses || []).forEach((c: any) => {
          if (c.tqf3_status !== 'submitted') {
            todos.push({
              id: `tqf3-${c.id}`,
              source: 'course_tqf3',
              task_type: 'Document',
              task_title: `มคอ.3 - ${c.code} ${c.name}`,
              courseId: c.id,
            });
          }
          if (c.tqf5_status !== 'submitted') {
            todos.push({
              id: `tqf5-${c.id}`,
              source: 'course_tqf5',
              task_type: 'Document',
              task_title: `มคอ.5 - ${c.code} ${c.name}`,
              courseId: c.id,
            });
          }
        });
      }

      // 2) งานวิจัย/กำหนดการจากแอดมินที่ยัง pending
      const { data: research, error: researchError } = await supabase
        .from('deadlines')
        .select('id, title, due_date, type')
        .eq('type', 'Research')
        .eq('status', 'pending')
        .in('assign_to', ['All', 'Lecturer']);

      if (researchError) throw researchError;

      (research || []).forEach((d: any) => {
        todos.push({
          id: `deadline-${d.id}`,
          source: 'deadline',
          task_type: 'RESEARCH',
          task_title: d.title,
          due_date: d.due_date,
        });
      });

      todos.sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      });

      setPendingTasks(todos);
    } catch (error: any) {
      console.error('Error fetching to-do list:', error.message);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // ทำเครื่องหมายว่างานนี้ส่งแล้ว: ขีดฆ่า/เฟดออกก่อน แล้วค่อยตัดออกจากลิสต์จริง
  // - รายการที่มาจาก courses (tqf3/tqf5): อัปเดตสถานะกลับไปที่ตาราง courses ตรงๆ
  // - รายการที่มาจาก deadlines (งานวิจัยของแอดมิน): เป็นกำหนดการกลางที่แชร์กันทุกคน
  //   ระบบยังไม่มีตารางเก็บสถานะการส่งของแต่ละอาจารย์แยกจากกัน จึงตัดออกจากลิสต์นี้ในเครื่องได้เลย
  //   แต่จะไม่ถูกบันทึกถาวร (จะกลับมาโชว์อีกครั้งตอนโหลดหน้าใหม่) จนกว่าจะมีตาราง submission ต่อคนจริง
  const handleMarkComplete = async (task: TodoTask) => {
    setCompletingIds(prev => new Set(prev).add(task.id));

    try {
      if (task.source === 'course_tqf3' && task.courseId) {
        const { error } = await supabase.from('courses').update({ tqf3_status: 'submitted' }).eq('id', task.courseId);
        if (error) throw error;
      } else if (task.source === 'course_tqf5' && task.courseId) {
        const { error } = await supabase.from('courses').update({ tqf5_status: 'submitted' }).eq('id', task.courseId);
        if (error) throw error;
      }
      // source === 'deadline' → ไม่มีตารางบันทึกสถานะรายบุคคล ข้ามการเขียน DB ไปเลย
    } catch (error: any) {
      console.error('Error marking task complete:', error.message);
      alert('ไม่สามารถอัปเดตสถานะงานได้: ' + error.message);
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
      return;
    }

    // ปล่อยให้แอนิเมชันขีดฆ่า/เฟดเล่นจบก่อน แล้วค่อยตัดออกจาก state จริง
    setTimeout(() => {
      setPendingTasks(prev => prev.filter(t => t.id !== task.id));
      setCompletingIds(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }, 400);
  };

useEffect(() => {
    const loadInitialData = async () => {
      console.log("1. กำลังเช็คสถานะล็อกอิน...");
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        console.log("2. พบ User ID:", user.id, "กำลังดึงข้อมูลโปรไฟล์...");
        
        const { data, error } = await supabase
          .from('users')
          .select('full_name, avatar_url, faculty, department_name')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("ดึงข้อมูลพลาด:", error);
          return;
        }

        if (data) {
          console.log("3. ดึงข้อมูลสำเร็จ! URL รูปล่าสุดคือ:", data.avatar_url);
          // เอาข้อมูลยัดใส่ Zustand Store ทันที
          setUser({
            id: user.id,
            email: user.email,
            fullName: data.full_name,
            avatarUrl: data.avatar_url, // รูปภาพควรจะโชว์จากตรงนี้
            faculty: data.faculty,
            departmentName: data.department_name
          });
        }
      } else {
        console.log(" ไม่พบข้อมูล User (อาจจะหลุดล็อกอิน)");
      }
    };

    loadInitialData();
    fetchMyTasks(); // เรียกดึงงานที่ต้องทำด้วย
  }, []); // ใส่เป็น [] ว่างๆ เพื่อให้รันแค่ครั้งเดียวตอน mount
  
  // State ใหม่สำหรับรูปโปรไฟล์และการเชื่อมต่อ (จำลองข้อมูลเบื้องต้น)
  const [isTeamsConnected, setIsTeamsConnected] = useState(false);
  
  // ภายใน useEffect หรือฟังก์ชันดึงข้อมูล User
  const fetchUserProfile = async () => {
    // 1. ดึงข้อมูลคนล็อกอินจากระบบ Auth ของ Supabase (ตัวนี้จะไม่หายแม้รีเฟรช)
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (authUser) {
      // 2. ดึงข้อมูลโปรไฟล์จากตาราง users โดยใช้ ID จาก authUser
      const { data: userData, error } = await supabase
        .from('users')
        .select('full_name, avatar_url, faculty, department_name, msteams_webhook_url')
        .eq('id', authUser.id)
        .single();

      if (!error && userData) {
        // 3. เอาข้อมูลที่ดึงได้ กลับไปใส่ใน Store เพื่อให้ UI ทุกจุดแสดงผล
        setUser({
          id: authUser.id,
          email: authUser.email,
          fullName: userData.full_name,
          avatarUrl: userData.avatar_url,
          faculty: userData.faculty,
          departmentName: userData.department_name
        });
        
        // เช็คว่ามีลิงก์ Webhook ไหม ถ้ามีแปลว่าเชื่อมต่อแล้ว
        if (userData.msteams_webhook_url) {
          setIsTeamsConnected(true);
        } else {
          setIsTeamsConnected(false);
        }
      }
    }
  };

  // ฟังก์ชันจำลองการอัปโหลดรูป (ของจริงต้องต่อกับ Supabase Storage)
  const handleImageUpload = () => {
    alert('ระบบจะเปิดหน้าต่างเลือกไฟล์ และอัปโหลดขึ้น Supabase Storage');
    // setAvatarUrl('URL_รูปใหม่ที่อัปโหลดเสร็จ');
  };

  // ฟังก์ชันการเชื่อมต่อ MS Teams
  const toggleTeamsConnection = async () => {
    if (!userId) return;

    if (isTeamsConnected) {
      // กรณียกเลิกการเชื่อมต่อ
      const isConfirm = window.confirm('ต้องการยกเลิกการเชื่อมต่อ Microsoft Teams ใช่หรือไม่?');
      if (isConfirm) {
        // ลบ Webhook ออกจาก Database (ตั้งค่าเป็น null)
        const { error } = await supabase
          .from('users')
          .update({ msteams_webhook_url: null })
          .eq('id', userId);

        if (!error) {
          setIsTeamsConnected(false);
          alert('ยกเลิกการเชื่อมต่อสำเร็จ');
        } else {
          alert('เกิดข้อผิดพลาด: ' + error.message);
        }
      }
    } else {
      // กรณีต้องการเชื่อมต่อใหม่ ให้มีกล่องเด้งขึ้นมาถามหา URL
      const webhookUrl = window.prompt('กรุณาวางลิงก์ Webhook จาก Microsoft Teams Channel ของคุณ:');
      
      if (webhookUrl && webhookUrl.trim() !== '') {
        // บันทึกลิงก์ลง Database
        const { error } = await supabase
          .from('users')
          .update({ msteams_webhook_url: webhookUrl.trim() })
          .eq('id', userId);

        if (!error) {
          setIsTeamsConnected(true);
          alert('เชื่อมต่อ Microsoft Teams สำเร็จ! ระบบจะส่งการแจ้งเตือนไปที่ช่องทางนี้');
        } else {
          alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
        }
      }
    }
  };

  // 👇 วางฟังก์ชันทดสอบตรงนี้เลยครับ
  const testSendTeamsNotification = async () => {
    const { data } = await supabase.from('users').select('msteams_webhook_url').eq('id', userId).single();
    
    if (!data?.msteams_webhook_url) {
      alert('ยังไม่ได้เชื่อมต่อ MS Teams');
      return;
    }

    try {
      const response = await fetch(data.msteams_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "message",
          attachments: [
            {
              contentType: "application/vnd.microsoft.card.adaptive",
              content: {
                $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
                type: "AdaptiveCard",
                version: "1.2",
                body: [
                  { type: "TextBlock", text: "🚨 ทดสอบระบบแจ้งเตือน QA_Project", weight: "Bolder", size: "Medium" },
                  { type: "TextBlock", text: `สวัสดีครับอาจารย์ ${fullName} ระบบเชื่อมต่อกับ MS Teams สำเร็จแล้ว!`, wrap: true }
                ]
              }
            }
          ]
        })
      });

      if (response.ok) {
        alert('ส่งแจ้งเตือนเข้า Teams สำเร็จ! ลองเปิดกลุ่มแชท QA_Project ดูครับ');
      } else {
        alert('ส่งไม่สำเร็จ รหัสข้อผิดพลาด: ' + response.status);
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการส่งข้อความ');
    }
  };

  // ฟังก์ชันส่งลิงก์รีเซ็ตรหัสผ่าน
  const handleResetPassword = async () => {
    const isConfirm = window.confirm('ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณ ยืนยันหรือไม่?');
    if (!isConfirm) return;

    // ดึงอีเมลของผู้ใช้ที่ล็อกอินอยู่ปัจจุบันจากระบบ Auth ของ Supabase
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user?.email) {
      // สั่งให้ Supabase ส่งอีเมลรีเซ็ตรหัส
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'http://localhost:5173/dashboard/lecturer', // ใส่ URL หน้าเว็บของคุณเพื่อให้พอกดลิงก์ในอีเมลแล้วเด้งกลับมาหน้านี้
      });

      if (!error) {
        alert('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว กรุณาตรวจสอบ Inbox หรือโฟลเดอร์ Junk');
      } else {
        alert('เกิดข้อผิดพลาดในการส่งอีเมล: ' + error.message);
      }
    } else {
      alert('ไม่พบข้อมูลอีเมลในระบบ กรุณาติดต่อผู้ดูแลระบบ');
    }
  };

  const handleSubmitDocument = async (documentId, documentName) => {
    try {
      // 1. อัปเดตสถานะงานใน Database (Supabase) ว่า "ส่งแล้ว"
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'submitted' })
        .eq('id', documentId);

      if (error) throw error;

      // 2. ถ้าเซฟลง Database ผ่าน ค่อย "ส่งอีเมลแจ้งเตือน"
      const templateParams = {
        to_name: user?.fullName || 'อาจารย์', 
        to_email: user?.email, 
        message: `คุณได้ทำการส่งเอกสาร "${documentName}" เรียบร้อยแล้ว ระบบได้บันทึกข้อมูลของคุณแล้วครับ`
      };

      // ใช้ค่าจาก .env แทนการพิมพ์ตรงๆ
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        templateParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );

      // 3. (ถ้ามี) ส่งเข้า MS Teams ด้วยก็เรียกใช้ฟังก์ชัน Teams ตรงนี้ได้เลย

      alert('ส่งเอกสารสำเร็จ และแจ้งเตือนผ่านอีเมลแล้ว!');
      
      // รีเฟรชข้อมูลในหน้าเว็บ...
      
    } catch (error) {
      console.error('เกิดข้อผิดพลาด:', error);
      alert('เกิดข้อผิดพลาดในการส่งข้อมูล');
    }
  };

  const fetchSummaryData = async () => {
    if (!userId) return;
    
    // 1. ดึงคะแนนรวมผลงานวิชาการ
    const { data: works } = await supabase
      .from('academic_works')
      .select('weight')
      .eq('user_id', userId);
    
    const totalWeight = works?.reduce((sum, w) => sum + (Number(w.weight) || 0), 0) || 0;

    // 2. ดึงจำนวนวิชาที่ส่ง มคอ. ครบแล้ว (สมมติเช็คจาก view หรือ table)
    const { count: tqfCount } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'submitted');

    setSummary({
      totalWeight,
      academicCount: works?.length || 0,
      tqfComplete: tqfCount || 0
    });
  };

  const fetchTaskDates = async () => {
    // ดึงวันที่ที่มีงานค้างส่ง (ตัวอย่างชื่อคอลัมน์ due_date)
    const { data } = await supabase
      .from('deadlines')
      .select('due_date')
      .eq('status', 'pending')
      .in('assign_to', ['All', 'Lecturer']);

    if (data) {
      // เก็บเฉพาะวันที่ในรูปแบบ YYYY-MM-DD
      const dates = data.map(t => new Date(t.due_date).toDateString());
      setTaskDates(dates);
    }
  };

  const getTileContent = ({ date, view }: { date: Date, view: string }) => {
    // แสดงจุดแจ้งเตือนเฉพาะในมุมมอง "เดือน"
    if (view === 'month') {
      // ตรวจสอบว่าวันที่ในช่องปฏิทิน ตรงกับวัน Deadline วันไหนบ้างไหม
      const hasDeadline = deadlineDates.includes(date.toDateString());
      
      if (hasDeadline) {
        return (
          <div className="flex flex-col items-center mt-1">
            {/* จุดสีแดงกระพริบสำหรับ Deadline จาก Admin */}
            <div className="w-1.5 h-1.5 bg-rose-600 rounded-full ring-2 ring-rose-100 animate-pulse"></div>
            <span className="text-[8px] text-rose-600 font-bold mt-0.5">Due</span>
          </div>
        );
      }
    }
    return null;
  };

  const handleDateClick = (date: Date) => {
    setCalendarDate(date);
    
    // เปลี่ยนมาหาใน allDeadlines แทน adminDeadlines
    const task = allDeadlines.find(
      (t: any) => new Date(t.due_date).toDateString() === date.toDateString()
    );

    if (task) {
      setSelectedDateTask(task);
    } else {
      setSelectedDateTask(null);
    }
  };

  const NotificationBanner = ({ task }) => {
    const days = task.days_remaining;
    
    // กำหนดสีและความแรงของการเตือนตามจำนวนวัน
    const alertConfig = {
      7: { color: 'bg-blue-50 text-blue-700', label: 'แจ้งเตือนล่วงหน้า' },
      3: { color: 'bg-orange-50 text-orange-700', label: 'ใกล้ครบกำหนด' },
      2: { color: 'bg-orange-100 text-orange-800', label: 'เร่งด่วน' },
      1: { color: 'bg-red-50 text-red-700 animate-pulse', label: 'วันสุดท้าย!' },
      0: { color: 'bg-red-600 text-white animate-bounce', label: 'ครบกำหนดวันนี้!' }
    };

    const config = alertConfig[days] || { color: 'bg-gray-50', label: 'กำหนดส่ง' };

    return (
      <div className={`p-4 mb-3 rounded-lg border flex justify-between items-center ${config.color}`}>
        <div className="flex items-center gap-3">
          <span className="font-bold text-lg">{days === 0 ? '⚠️' : '🔔'}</span>
          <div>
            <h4 className="font-bold text-sm">{task.title}</h4>
            <p className="text-xs">{config.label} (กำหนดส่ง: {task.deadline_date})</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-black">{days}</span>
          <span className="text-[10px] block uppercase">Days Left</span>
        </div>
      </div>
    );
  };

  const calculateDaysRemaining = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // รีเซ็ตเวลาเป็นเที่ยงคืนเพื่อการคำนวณวันที่แม่นยำ
    const deadline = new Date(dueDate);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const fetchDeadlines = async () => {
    const { data, error } = await supabase
      .from('deadlines')
      .select('*')
      .eq('status', 'pending')
      .in('assign_to', ['All', 'Lecturer']);

    if (!error && data) {
      setAllDeadlines(data); // ✨ เก็บงานทั้งหมดไว้เช็คตอนคลิกปฏิทิน

      const urgentTasks = data.filter(task => {
        const days = calculateDaysRemaining(task.due_date);
        return days >= 0 && days <= 7;
      });
      setAdminDeadlines(urgentTasks); // เก็บเฉพาะงานด่วนโชว์ Banner

      const dates = data.map(task => new Date(task.due_date).toDateString());
      setDeadlineDates(dates);
    }
  };

  // ฟังก์ชันดึงกิจกรรมล่าสุด (ดึงจากตารางผลงานวิชาการเป็นตัวอย่าง)
  const fetchActivities = async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from('academic_works')
      .select('id, title, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data) {
      setActivities(data);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'เมื่อครู่นี้';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 3600 / 24)} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH'); // ถ้าเกินอาทิตย์ให้โชว์วันที่ปกติ
  };

  useEffect(() => {
    fetchTaskDates();
    fetchSummaryData();
    fetchDeadlines();
    
    if (!userId) return;

      fetchActivities(); // ดึงครั้งแรกตอนโหลดหน้า

      const channel = supabase
        .channel('dashboard-realtime')
        .on(
          'postgres_changes',
          {
            event: '*', // ดักจับทุกสถานะ INSERT, UPDATE, DELETE
            schema: 'public',
            table: 'academic_works',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            console.log('Real-time Update:', payload);
            fetchActivities(); // เมื่อมีการเปลี่ยนแปลง ให้ดึงข้อมูลใหม่ทันที
          }
        )
        // ฟังการเปลี่ยนแปลงสถานะ มคอ. ที่ตาราง courses แบบเรียลไทม์
        // เผื่อกรณีอาจารย์ไปกดส่งเอกสารจากหน้า /dashboard/tqf โดยตรง (ไม่ได้กดติ๊กจากหน้านี้)
        // รายการนี้จะหายไปจากลิสต์ทันทีโดยไม่ต้องรีเฟรชหน้า
        // หมายเหตุ: courses ไม่มีคอลัมน์ user_id ให้ filter ตรงๆ (ผูกผ่าน course_instructors)
        // จึงฟังการเปลี่ยนแปลงทุกวิชาแล้วให้ fetchMyTasks() คัดกรองเฉพาะวิชาของอาจารย์คนนี้เอาเอง
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'courses',
          },
          (payload) => {
            console.log('Course status changed:', payload);
            fetchMyTasks();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
  }, [userId]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 ">

        {/* Dashboard Content Grid */}
        <div className="flex-1 overflow-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full flex-1">
            
            {/* ─── Left Column (Spans 2 columns) ─── */}
            <div className="lg:col-span-2 space-y-6 flex flex-col h-full">

              {/* Performance Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* คะแนน KPI */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-5 rounded-2xl text-white shadow-lg shadow-blue-200 flex flex-col justify-center">
                  <div className="flex justify-between items-start">
                    <p className="text-blue-100 text-sm font-medium">คะแนน KPI รวม</p>
                    <Award size={20} className="text-blue-200" />
                  </div>
                  <h3 className="text-3xl font-bold mt-2">{summary.totalWeight.toFixed(2)}</h3>
                  <p className="text-xs text-blue-200 mt-1">สะสมจาก {summary.academicCount} ผลงาน</p>
                </div>

                {/* จำนวนผลงานวิชาการ */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">ผลงานวิชาการ</p>
                  <div className="flex items-end gap-2 mt-2">
                    <h3 className="text-2xl font-bold text-gray-900">{summary.academicCount}</h3>
                    <span className="text-gray-400 text-sm mb-1">รายการ</span>
                  </div>
                  <div className="mt-3 w-full bg-gray-100 h-1.5 rounded-full">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '65%' }}></div>
                  </div>
                </div>

                {/* สถานะ TQF */}
                <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center">
                  <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">เอกสารที่ส่งแล้ว</p>
                  <div className="flex items-end gap-2 mt-2">
                    <h3 className="text-2xl font-bold text-gray-900">{summary.tqfComplete}</h3>
                    <span className="text-gray-400 text-sm mb-1">วิชา</span>
                  </div>
                  <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
                    <CheckCircle2 size={12} /> อัปเดตล่าสุดเมื่อครู่
                  </p>
                </div>
              </div>
              
              {/* Quick Actions (มคอ. & Portfolio) */}
              <div className="grid grid-cols-2 gap-4">
                <div 
                  onClick={() => navigate('/dashboard/tqf')} 
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <FileText size={20} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">จัดการเอกสาร มคอ.</h3>
                    <p className="text-sm text-gray-500 mt-1">สร้าง แก้ไข และติดตามสถานะ มคอ.3-6</p>
                  </div>
                </div>

                <div 
                  onClick={() => navigate('/dashboard/portfolio')} 
                  className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-gray-200 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <BookOpen size={20} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">ผลงานทางวิชาการ</h3>
                    <p className="text-sm text-gray-500 mt-1">จัดการพอร์ตโฟลิโอและงานวิจัย</p>
                  </div>
                </div>
              </div>

              {/* Calendar View (ปรับให้เต็มพื้นที่ที่เหลือ) */}
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col flex-1">
                <div className="w-full flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <CalendarIcon size={18} className="text-gray-400" />
                    ปฏิทินกำหนดการ
                  </h3>
                  <button 
                    onClick={() => {
                      setCalendarDate(new Date()); // รีเซ็ตวันที่ในปฏิทินให้เป็นวันนี้
                      setSelectedDateTask(null); // ปิด Pop-up (ถ้าเปิดค้างไว้)
                    }}
                    className="text-xs font-bold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 border border-blue-100 transition-colors shadow-sm"
                  >
                    วันนี้
                  </button>
                </div>
                
                <div className="w-full overflow-hidden text-sm flex justify-center flex-1">
                  <Calendar 
                    onClickDay={handleDateClick} 
                    value={calendarDate} 
                    className="border-0 font-sans w-full h-full"
                    tileContent={getTileContent}
                  />
                </div>

                {/* ─── Modal Pop-up แสดงรายละเอียดงานในปฏิทิน ─── */}
                {selectedDateTask && (
                  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 p-6">
                      
                      {/* Header ของ Pop-up */}
                      <div className="flex justify-between items-start mb-5">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                            <CalendarIcon size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">รายละเอียดกำหนดการ</h4>
                            <p className="text-xs text-blue-600 font-medium mt-0.5">
                              {/* แปลงวันที่ให้เป็นภาษาไทยแบบอ่านง่าย */}
                              {new Date(selectedDateTask.due_date).toLocaleDateString('th-TH', { 
                                day: 'numeric', month: 'long', year: 'numeric' 
                              })}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedDateTask(null)} 
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
                        >
                          <X size={20} />
                        </button>
                      </div>

                      {/* เนื้อหางาน */}
                      <div className="space-y-5">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                          <p className="text-base font-bold text-gray-900 leading-tight">
                            {selectedDateTask.title}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-[10px] bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-medium shadow-sm">
                              ประเภท: <span className="text-blue-600">{selectedDateTask.type}</span>
                            </span>
                            <span className="text-[10px] bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-medium shadow-sm">
                              ผู้รับผิดชอบ: <span className="text-blue-600">{selectedDateTask.assign_to}</span>
                            </span>
                          </div>
                        </div>

                        {/* ปุ่มไปหน้าส่งงาน (พอกดแล้วให้ปิด Pop-up ด้วย) */}
                        <Link 
                          to={selectedDateTask.type === 'Document' ? '/dashboard/tqf' : '/dashboard/portfolio'}
                          onClick={() => setSelectedDateTask(null)}
                          className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                        >
                          ไปที่หน้าส่งงาน <ChevronRight size={16} />
                        </Link>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ─── Right Column (Spans 1 column) ─── */}
            <div className="lg:col-span-1 space-y-6 flex flex-col h-full">
              
              {/* Latest Activities */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col max-h-[400px]">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock size={18} className="text-blue-500 animate-pulse" />
                    <h3 className="font-medium text-gray-900">สถานะล่าสุด</h3>
                  </div>
                  <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Live</span>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <div className="space-y-6">
                    {activities.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">ยังไม่มีการเคลื่อนไหว</p>
                    ) : (
                      activities.map((activity, index) => (
                        <div key={activity.id} className="relative pl-5 group animate-in fade-in slide-in-from-left-2">
                          {index !== activities.length - 1 && (
                            <div className="absolute left-[5.5px] top-5 bottom-[-24px] w-[1px] bg-gray-100 group-hover:bg-blue-100 transition-colors"></div>
                          )}
                          <div className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm ring-4 ring-transparent group-hover:ring-blue-50 transition-all"></div>
                          
                          <div>
                            <p className="text-sm text-gray-800 leading-tight">
                              อัปโหลดผลงาน: <span className="font-medium text-gray-900">{activity.title || activity.action}</span>
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                              <Clock size={10} /> {activity.time}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <button className="w-full mt-6 py-2 text-xs font-semibold text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-transparent hover:border-blue-100 flex items-center justify-center gap-1">
                    ดูทั้งหมด <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* To-Do List (ย้ายมาไว้ตรงนี้) */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex flex-col flex-1 max-h-[500px]">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <h3 className="font-medium flex items-center gap-2 text-gray-900">
                    <CheckSquare size={18} className="text-gray-400" /> รายการที่ต้องทำ
                  </h3>
                  {pendingTasks.length > 0 && (
                    <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-medium">
                      {pendingTasks.length} รายการ
                    </span>
                  )}
                </div>
                <div className="p-2 overflow-y-auto flex-1">
                  {isLoadingTasks ? (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                      <Loader2 className="animate-spin mb-2" size={24} />
                      <p className="text-sm">กำลังโหลดรายการ...</p>
                    </div>
                  ) : pendingTasks.length === 0 ? (
                    <div className="text-center py-8 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 size={24} className="text-green-500" />
                      </div>
                      <p className="text-sm text-green-600 font-medium">✨ เยี่ยมมาก! ไม่มีงานค้างส่งแล้ว</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {pendingTasks.map((task) => {
                        const isCompleting = completingIds.has(task.id);
                        return (
                          <div
                            key={task.id}
                            className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 border border-transparent ${
                              isCompleting ? 'opacity-40' : 'hover:bg-gray-50 hover:border-gray-100'
                            }`}
                          >
                            <button
                              onClick={() => !isCompleting && handleMarkComplete(task)}
                              disabled={isCompleting}
                              title="ทำเครื่องหมายว่าส่งแล้ว"
                              className={`mt-1 flex-shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                isCompleting
                                  ? 'bg-green-500 border-green-500'
                                  : task.task_type === 'RESEARCH'
                                  ? 'border-indigo-400 bg-indigo-50 hover:bg-indigo-100'
                                  : 'border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              {isCompleting && <CheckCircle2 size={12} className="text-white" />}
                            </button>
                            <div className={`flex flex-col ${isCompleting ? 'line-through decoration-2' : ''}`}>
                              <span className="text-sm font-medium text-gray-800">
                                {task.task_type === 'RESEARCH' ? '📊 ภาระงานวิจัย' : '📝 ส่งเอกสาร มคอ.'}
                              </span>
                              <span className="text-xs text-blue-600 mt-0.5 font-medium">{task.task_title}</span>
                              {task.due_date && (
                                <span className="text-[10px] text-gray-400 mt-1">
                                  กำหนดส่ง: {new Date(task.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* --- Profile Modal (Popup) --- */}
        {isProfileOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 sticky top-0 z-10">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <UserIcon size={20} className="text-blue-600" />
                  โปรไฟล์และการตั้งค่าบัญชี
                </h3>
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* เนื้อหา Modal (Scrollable) */}
              <div className="p-6 overflow-y-auto space-y-8">
                
                {/* Section 1: ข้อมูลส่วนตัว & รูปถ่าย */}
                <div className="flex flex-col md:flex-row gap-8">
                  {/* รูปโปรไฟล์ */}
                  <div className="flex flex-col items-center space-y-4 md:w-1/3">
                    <div 
                      className="relative group cursor-pointer" 
                      onClick={() => fileInputRef.current?.click()} // เมื่อคลิกรูป ให้ไปคลิก input file ที่ซ่อนอยู่
                    >
                      <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={48} className="text-gray-300" />
                        )}
                        
                        {/* แสดง Spinner ตอนกำลังอัปโหลด */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                            <Loader2 className="animate-spin text-blue-600" size={24} />
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </div>
                    
                    {/* Input File ที่ซ่อนไว้ */}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} // ตัวนี้แหละที่จะทำหน้าที่อัปโหลดรูปของจริงขึ้น Supabase!
                      className="hidden" 
                      accept="image/*" 
                    />
                    
                    <p className="text-[10px] text-gray-400">รองรับ JPG, PNG (ขนาดไม่เกิน 2MB)</p>
                    
                    {/* ปุ่มเปลี่ยนรูปถ่าย (แก้ onClick ให้มากระตุ้น input file) */}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-1.5 rounded-full transition-colors"
                    >
                      เปลี่ยนรูปถ่าย
                    </button>
                  </div>

                  {/* ฟอร์มข้อมูล */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                        <Mail size={14} className="text-gray-400" /> อีเมล
                      </label>
                      <input 
                        type="email" 
                        disabled
                        value={email || ''} // ใช้ข้อมูลจริงจาก Database/Auth
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: ข้อมูลสังกัด (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                      <Building size={14} /> คณะ
                    </label>
                    <div className="text-sm font-medium text-gray-800 bg-white px-3 py-2 rounded-md border border-gray-200">
                      {userFaculty || 'ไม่ระบุข้อมูลคณะ'} 
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5">
                      <GraduationCap size={14} /> สาขาวิชา
                    </label>
                    <div className="text-sm font-medium text-gray-800 bg-white px-3 py-2 rounded-md border border-gray-200">
                      {userDepartment || 'ไม่ระบุข้อมูลสาขา'}
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    * หากข้อมูลสังกัดหรืออีเมลไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบส่วนกลาง
                  </p>
                </div>

                {/* Section 3: การเชื่อมต่อภายนอก (MS Teams) */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">การเชื่อมต่อแอปพลิเคชัน</h4>
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-blue-200 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* ไอคอน MS Teams จำลอง */}
                      <div className="w-10 h-10 bg-[#464EB8] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        T
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">Microsoft Teams</h5>
                        <p className="text-xs text-gray-500">
                          {isTeamsConnected ? 'เชื่อมต่อแล้วกับบัญชีมหาวิทยาลัย' : 'เชื่อมต่อเพื่อรับการแจ้งเตือนงานผ่านแชท'}
                        </p>
                      </div>
                    </div>
                    
                    {/* กลุ่มปุ่มกดฝั่งขวา */}
                    <div className="flex items-center gap-2">
                      
                      {/* 👇 ปุ่มทดสอบยิงข้อความ (โชว์เฉพาะตอน isTeamsConnected เป็น true) */}
                      {isTeamsConnected && (
                        <button 
                          onClick={testSendTeamsNotification}
                          className="px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        >
                          <Bell size={16} /> ทดสอบแจ้งเตือน
                        </button>
                      )}

                      {/* 👇 ปุ่มเชื่อมต่อ/ยกเลิก (โค้ดเดิมของคุณ) */}
                      <button 
                        onClick={toggleTeamsConnection}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isTeamsConnected 
                            ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' 
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {isTeamsConnected ? (
                          <><CheckCircle2 size={16} /> สวิทช์บัญชี / ยกเลิก</>
                        ) : (
                          <><LinkIcon size={16} /> เชื่อมต่อบัญชี</>
                        )}
                      </button>

                    </div>
                  </div>
                </div>

                {/* Section 4: ความปลอดภัย (Security) */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">ความปลอดภัย</h4>
                  <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-orange-200 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* ไอคอนความปลอดภัย */}
                      <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shadow-sm">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-900">รหัสผ่านบัญชีผู้ใช้</h5>
                        <p className="text-xs text-gray-500">
                          หากสงสัยว่ามีผู้อื่นเข้าถึงบัญชี แนะนำให้เปลี่ยนรหัสผ่านทันที
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={handleResetPassword}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all flex items-center gap-2"
                    >
                      <KeyRound size={16} /> ส่งลิงก์รีเซ็ตรหัส
                    </button>
                  </div>
                </div>

              </div>

              {/* Footer / ปุ่มบันทึก */}
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 sticky bottom-0">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ปิด
                </button>
                <button 
                  onClick={handleSaveProfile}
                  disabled={isSaving || !editName.trim()}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSaving ? 'กำลังบันทึก...' : (
                    <><Save size={16} /> บันทึกการเปลี่ยนแปลง</>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}
    </div>
  );
}

export default LecturerDash;