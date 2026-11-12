import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/useUserStore';
import {
  Loader2, Bell, Upload, FileSpreadsheet, Search, Eye, Trash2,
  Calendar as CalendarIcon, LogOut, LayoutDashboard, BookOpen, Users, User as UserIcon, X, Pencil,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface CourseRow {
  id: string;
  code: string;
  name: string;
  instructorNames: string;
}

const sidebarSections = [
  { title: 'Dashboard', items: [{ id: 'dashboard', thaiTitle: 'ภาพรวมระบบ', path: '/admin/main', icon: <LayoutDashboard size={18} /> }] },
  { title: 'Operations', items: [{ id: 'calendar', thaiTitle: 'ปฏิทินและกำหนดการ', path: '/admin/calendar', icon: <CalendarIcon size={18} /> }] },
  {
    title: 'Administration',
    items: [
      { id: 'course', thaiTitle: 'จัดการหลักสูตรและรายวิชา', path: '/admin/courses', icon: <BookOpen size={18} /> },
      { id: 'instructor', thaiTitle: 'จัดการการลงทะเบียนอาจารย์', path: '/admin/instructors', icon: <Users size={18} /> },
    ],
  },
];

const CoursePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName: storeFullName, avatarUrl: storeAvatarUrl } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingCourse, setEditingCourse] = useState<CourseRow | null>(null);
  const [editForm, setEditForm] = useState({ code: '', name: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Toast แจ้งผลลัพธ์ในหน้าเว็บเอง แทน window.alert() ของเบราว์เซอร์
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message });
    window.clearTimeout((showNotice as any)._t);
    (showNotice as any)._t = window.setTimeout(() => setNotice(null), 6000);
  };

  // ดึงข้อมูลแบบ 3 query แยกแล้วจับคู่ฝั่ง client แทนการ embed ซ้อน
  // (ผลลัพธ์เสถียรกว่า ไม่ต้องพึ่ง FK hint / nested join ที่มักมีปัญหากับ RLS)
  const fetchCourses = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, code, name')
        .order('code', { ascending: true });

      if (coursesError) throw coursesError;

      const { data: linksData, error: linksError } = await supabase
        .from('course_instructors')
        .select('course_id, teacher_id');

      if (linksError) throw linksError;

      const teacherIds = Array.from(new Set((linksData || []).map((l: any) => l.teacher_id).filter(Boolean)));

      let teacherNameById: Record<string, string> = {};
      if (teacherIds.length > 0) {
        const { data: teachersData, error: teachersError } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', teacherIds);

        if (teachersError) throw teachersError;
        teacherNameById = Object.fromEntries((teachersData || []).map((t: any) => [t.id, t.full_name]));
      }

      const rows: CourseRow[] = (coursesData || []).map((c: any) => {
        const names = (linksData || [])
          .filter((l: any) => l.course_id === c.id)
          .map((l: any) => teacherNameById[l.teacher_id])
          .filter(Boolean);
        return {
          id: c.id,
          code: c.code,
          name: c.name,
          instructorNames: names.length > 0 ? names.join(', ') : 'ยังไม่ระบุผู้สอน',
        };
      });

      setCourses(rows);
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      setFetchError(error.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.instructorNames.toLowerCase().includes(q)
    );
  }, [courses, searchTerm]);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        รหัสวิชา: 'CS301',
        ชื่อรายวิชา: 'Data Structures and Algorithms',
        ชื่ออาจารย์ผู้สอน: 'ผศ. สมพงษ์ พลังงาน',
        อีเมลอาจารย์ผู้สอน: 'sompong.p@utcc.ac.th',
      },
      {
        รหัสวิชา: 'ENG101',
        ชื่อรายวิชา: 'Engineering Graphics',
        ชื่ออาจารย์ผู้สอน: '',
        อีเมลอาจารย์ผู้สอน: '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    // คอลัมน์ "ชื่ออาจารย์ผู้สอน" ไว้ให้แอดมินอ่าน/กรอกง่าย ระบบจะ match จริงด้วยอีเมลเท่านั้น
    // เพราะชื่อในฐานข้อมูลมีคำนำหน้า (ผศ./ดร./รศ.) และอาจซ้ำกันได้ ส่วนอีเมล unique เสมอ
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Course_Mapping');
    XLSX.writeFile(workbook, 'QA_Course_Template.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const notFoundEmails: string[] = [];
    let coursesUpserted = 0;
    let instructorsLinked = 0;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      for (const row of jsonData) {
        const code = String(row['รหัสวิชา'] || '').trim();
        const name = String(row['ชื่อรายวิชา'] || '').trim();
        const email = String(row['อีเมลอาจารย์ผู้สอน'] || '').trim().toLowerCase();

        if (!code || !name) continue;

        // upsert รายวิชา แล้วขอ id กลับมาด้วยเพื่อใช้ผูกกับ course_instructors
        const { data: courseRow, error: courseError } = await supabase
          .from('courses')
          .upsert({ code, name }, { onConflict: 'code' })
          .select('id')
          .single();

        if (courseError || !courseRow) {
          console.error(`Error upserting course ${code}:`, courseError);
          continue;
        }
        coursesUpserted += 1;

        if (!email) continue;

        // หา user จากอีเมล (key ที่เชื่อถือได้กว่าชื่อ เพราะ unique และไม่มีปัญหาคำนำหน้า)
        const { data: teacherRow, error: teacherError } = await supabase
          .from('users')
          .select('id')
          .ilike('email', email)
          .maybeSingle();

        if (teacherError || !teacherRow) {
          notFoundEmails.push(email);
          continue;
        }

        // เช็คก่อนว่ามีคู่ course_id + teacher_id นี้อยู่แล้วหรือยัง กันซ้ำ (ไม่พึ่งชื่อ constraint ที่เดาไม่ได้)
        const { data: existingLink } = await supabase
          .from('course_instructors')
          .select('course_id')
          .eq('course_id', courseRow.id)
          .eq('teacher_id', teacherRow.id)
          .maybeSingle();

        if (!existingLink) {
          const { error: linkError } = await supabase
            .from('course_instructors')
            .insert({ course_id: courseRow.id, teacher_id: teacherRow.id });

          if (linkError) {
            console.error(`Error linking ${code} to ${email}:`, linkError);
            continue;
          }
        }
        instructorsLinked += 1;
      }

      let summary = `นำเข้ารายวิชาสำเร็จ ${coursesUpserted} รายการ, ผูกผู้สอนสำเร็จ ${instructorsLinked} รายการ`;
      if (notFoundEmails.length > 0) {
        summary += `\n\nไม่พบอีเมลนี้ในระบบผู้ใช้งาน (${notFoundEmails.length} รายการ):\n${notFoundEmails.join(', ')}`;
      }
      showNotice('success', summary);
      fetchCourses();
    } catch (error: any) {
      showNotice('error', 'เกิดข้อผิดพลาดในการอ่านไฟล์: ' + error.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openEditModal = (course: CourseRow) => {
    setEditingCourse(course);
    setEditForm({ code: course.code, name: course.name });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('courses')
        .update({ code: editForm.code, name: editForm.name })
        .eq('id', editingCourse.id);

      if (error) throw error;

      setEditingCourse(null);
      await fetchCourses();
      showNotice('success', 'บันทึกการแก้ไขรายวิชาสำเร็จ');
    } catch (error: any) {
      showNotice('error', 'บันทึกการแก้ไขไม่สำเร็จ: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (course: CourseRow) => {
    const confirmed = window.confirm(`ยืนยันลบรายวิชา "${course.code} - ${course.name}"? การลบนี้จะลบข้อมูลออกจากฐานข้อมูลถาวร`);
    if (!confirmed) return;

    setDeletingId(course.id);
    try {
      const { error } = await supabase.from('courses').delete().eq('id', course.id);
      if (error) throw error;
      await fetchCourses();
      showNotice('success', `ลบรายวิชา "${course.code}" สำเร็จ`);
    } catch (error: any) {
      showNotice('error', 'ลบรายวิชาไม่สำเร็จ: ' + error.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-700 text-left">

      {/* Toast notification */}
      {notice && (
        <div className="fixed top-6 right-6 z-[60] max-w-sm">
          <div
            className={`rounded-xl border p-4 shadow-lg flex items-start gap-3 ${
              notice.type === 'success' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'
            }`}
          >
            <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${notice.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <p className={`text-sm whitespace-pre-line flex-1 ${notice.type === 'success' ? 'text-emerald-700' : 'text-red-700'}`}>
              {notice.message}
            </p>
            <button
              onClick={() => setNotice(null)}
              className={`shrink-0 ${notice.type === 'success' ? 'text-emerald-400 hover:text-emerald-600' : 'text-red-400 hover:text-red-600'}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Edit course modal */}
      {editingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <Pencil size={16} className="text-[#1638a1]" /> แก้ไขรายวิชา
              </h3>
              <button onClick={() => setEditingCourse(null)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">รหัสวิชา</label>
                <input
                  required
                  type="text"
                  value={editForm.code}
                  onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">ชื่อรายวิชา</label>
                <input
                  required
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all"
                />
              </div>
              <p className="text-xs text-slate-400">การแก้ไขนี้จะบันทึกลงฐานข้อมูลทันที</p>
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setEditingCourse(null)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#1638a1] hover:bg-blue-800 disabled:opacity-70 rounded-xl transition-all flex items-center gap-2"
                >
                  {isSaving ? (<><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</>) : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-[#1638a1] p-2 rounded-xl text-white">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-slate-800 leading-none">QA System</h1>
              <p className="text-[10px] text-[#1638a1] font-medium uppercase tracking-wider mt-1">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-5 mt-2">
          {sidebarSections.map((section) => (
            <div key={section.title}>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-4 mb-2">{section.title}</div>
              <div className="space-y-1">
                {section.items.map((m) => {
                  const isActive = location.pathname === m.path;
                  return (
                    <button
                      key={m.id}
                      onClick={() => navigate(m.path)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors text-left ${
                        isActive ? 'bg-blue-50 text-[#1638a1] font-medium' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      <span className={isActive ? 'text-[#1638a1]' : 'text-slate-400'}>{m.icon}</span>
                      <span>{m.thaiTitle}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors" onClick={() => navigate('/admin/profile')}>
            <div className="w-9 h-9 rounded-full bg-[#1638a1] text-white flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
              {storeAvatarUrl ? <img src={storeAvatarUrl} className="w-full h-full object-cover" alt="Profile" /> : (storeFullName ? storeFullName.charAt(0).toUpperCase() : 'A')}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-800 leading-tight truncate">{storeFullName || 'Admin User'}</p>
              <p className="text-[10px] text-[#1638a1] font-medium uppercase tracking-wider mt-0.5">Admin</p>
            </div>
          </div>
          <button onClick={() => { supabase.auth.signOut(); navigate('/'); }} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0" title="ออกจากระบบ">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 h-screen overflow-y-auto p-8">
        <div className="w-full space-y-6">
          <header className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">จัดการรายวิชา</h2>
              <p className="text-slate-500 text-sm mt-1">จัดการข้อมูลรายวิชา</p>
            </div>
            <button className="relative p-2 text-slate-400 hover:text-[#1638a1] transition-colors bg-white rounded-full border border-slate-200">
              <Bell size={20} />
            </button>
          </header>

          {fetchError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
              โหลดข้อมูลไม่สำเร็จ: {fetchError}
            </div>
          )}

          {/* Import / template cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="lg:col-span-2 bg-white rounded-2xl border-2 border-dashed border-blue-200 p-8 flex flex-col items-center justify-center hover:border-[#1638a1] hover:bg-blue-50/30 transition-all cursor-pointer"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".xlsx, .xls" />
              {isUploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-10 h-10 animate-spin text-[#1638a1] mb-3" />
                  <h3 className="text-sm font-medium text-slate-800">กำลังประมวลผลข้อมูล...</h3>
                </div>
              ) : (
                <>
                  <div className="w-11 h-11 bg-blue-50 rounded-full flex items-center justify-center text-[#1638a1] mb-3">
                    <Upload size={22} />
                  </div>
                  <h3 className="text-sm font-medium text-slate-800 mb-1">นำเข้าไฟล์ Excel (mapping รายชื่ออาจารย์ + รายวิชา)</h3>
                  <p className="text-xs text-slate-400">อัปโหลดไฟล์ Excel เพื่ออัปเดตข้อมูลผู้รับผิดชอบรายวิชาแบบกลุ่ม</p>
                </>
              )}
            </div>

            <div className="bg-[#1638a1] rounded-2xl p-6 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-sm font-semibold mb-2">Excel template</h3>
                <p className="text-xs text-blue-100/90 leading-relaxed mb-5">ใช้เทมเพลตมาตรฐานในการ mapping อาจารย์ประจำวิชา</p>
                <button
                  onClick={handleDownloadTemplate}
                  className="w-full bg-white text-[#1638a1] py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-blue-50 flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet size={16} /> ดาวน์โหลดเทมเพลต
                </button>
              </div>
              <FileSpreadsheet className="absolute -right-6 -bottom-6 w-32 h-32 text-white opacity-10" />
            </div>
          </div>

          {/* Data table */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-sm font-medium text-slate-500">รายการข้อมูลเอกสารหลักสูตร</span>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ค้นหารหัสวิชา ชื่อวิชา หรือชื่อผู้สอน..."
                  className="text-sm pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full sm:w-72 focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">รหัสวิชา</th>
                    <th className="px-6 py-3 font-medium">ชื่อรายวิชา</th>
                    <th className="px-6 py-3 font-medium text-center">อาจารย์ผู้สอน</th>
                    <th className="px-6 py-3 font-medium text-center">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1638a1]" />
                        กำลังโหลดข้อมูลรายวิชา...
                      </td>
                    </tr>
                  ) : filteredCourses.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-16 text-center text-slate-400">
                        {searchTerm ? 'ไม่พบรายวิชาที่ค้นหา' : 'ยังไม่มีข้อมูลรายวิชาในระบบ'}
                      </td>
                    </tr>
                  ) : (
                    filteredCourses.map((course) => {
                      const isAssigned = course.instructorNames !== 'ยังไม่ระบุผู้สอน';
                      return (
                        <tr key={course.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-800">{course.code}</td>
                          <td className="px-6 py-4 text-slate-600">{course.name}</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`text-xs font-medium ${isAssigned ? 'text-[#1638a1]' : 'text-red-500'}`}>
                              {course.instructorNames}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(course)}
                                className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
                                title="แก้ไขรายวิชา"
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(course)}
                                disabled={deletingId === course.id}
                                className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors disabled:opacity-50"
                                title="ลบรายวิชา"
                              >
                                {deletingId === course.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CoursePage;