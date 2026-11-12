import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/useUserStore';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Calendar as CalendarIcon,
  User,
  LogOut,
  Bell,
  Plus,
  FileUp,
  Loader2,
} from 'lucide-react';

interface CourseRow {
  id: string;
  code: string;
  name: string;
  instructorNames: string;
}

const sidebarSections = [
  {
    title: 'Dashboard',
    items: [{ id: 'dashboard', thaiTitle: 'ภาพรวมระบบ', path: '/admin/main', icon: <LayoutDashboard size={18} /> }],
  },
  {
    title: 'Operations',
    items: [{ id: 'calendar', thaiTitle: 'ปฏิทินและกำหนดการ', path: '/admin/calendar', icon: <CalendarIcon size={18} /> }],
  },
  {
    title: 'Administration',
    items: [
      { id: 'course', thaiTitle: 'จัดการหลักสูตรและรายวิชา', path: '/admin/courses', icon: <BookOpen size={18} /> },
      { id: 'instructor', thaiTitle: 'จัดการการลงทะเบียนอาจารย์', path: '/admin/instructors', icon: <Users size={18} /> },
    ],
  },
];

const AdminDash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName, avatarUrl } = useUserStore();

  const [stats, setStats] = useState({ teachers: 0, courses: 0 });
  const [courseRows, setCourseRows] = useState<CourseRow[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setFetchError(null);

      // อาจารย์ทั้งหมด — แยก query ออกจาก courses ไม่ให้ error ฝั่งใดฝั่งหนึ่งลาก state อีกฝั่งไปด้วย
      const { count: teacherCount, error: teacherError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'Lecturer');

      if (teacherError) {
        console.error('Error fetching teacher count:', teacherError);
      }
      setStats((prev) => ({ ...prev, teachers: teacherCount ?? 0 }));

      // รายวิชา + ผู้สอน — ดึงแยก 3 ตารางแล้วจับคู่ฝั่ง client แทนการ embed ซ้อน
      // (กัน error จาก FK hint / RLS ที่มีผลกับ nested join แบบเดา relationship)
      setLoadingCourses(true);

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, code, name');

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        setFetchError(`courses: ${coursesError.message}`);
        setLoadingCourses(false);
        return;
      }

      const { data: linksData, error: linksError } = await supabase
        .from('course_instructors')
        .select('course_id, teacher_id');

      if (linksError) {
        console.error('Error fetching course_instructors:', linksError);
        setFetchError(`course_instructors: ${linksError.message}`);
      }

      const teacherIds = Array.from(new Set((linksData || []).map((l: any) => l.teacher_id).filter(Boolean)));

      let teacherNameById: Record<string, string> = {};
      if (teacherIds.length > 0) {
        const { data: teachersData, error: teachersError } = await supabase
          .from('users')
          .select('id, full_name')
          .in('id', teacherIds);

        if (teachersError) {
          console.error('Error fetching teacher names:', teachersError);
          setFetchError(`users: ${teachersError.message}`);
        } else if (teachersData) {
          teacherNameById = Object.fromEntries(teachersData.map((t: any) => [t.id, t.full_name]));
        }
      }

      if (coursesData) {
        const rows: CourseRow[] = coursesData.map((c: any) => {
          const names = (linksData || [])
            .filter((l: any) => l.course_id === c.id)
            .map((l: any) => teacherNameById[l.teacher_id])
            .filter(Boolean);
          return {
            id: c.id,
            code: c.code,
            name: c.name,
            instructorNames: names.length > 0 ? names.join(', ') : 'ยังไม่มีผู้สอน',
          };
        });

        setStats((prev) => ({ ...prev, courses: coursesData.length }));
        setCourseRows(rows);
      }
      setLoadingCourses(false);
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-700 text-left">

      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-20">
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
          <div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer p-2 rounded-xl hover:bg-slate-50 transition-colors"
            onClick={() => navigate('/admin/profile')}
          >
            <div className="w-9 h-9 rounded-full bg-[#1638a1] text-white flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
              {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" /> : (fullName ? fullName.charAt(0).toUpperCase() : 'A')}
            </div>
            <div className="truncate">
              <p className="text-xs font-medium text-slate-800 leading-tight truncate">{fullName || 'Admin User'}</p>
              <p className="text-[10px] text-[#1638a1] font-medium uppercase tracking-wider mt-0.5">Admin</p>
            </div>
          </div>
          <button
            onClick={() => { supabase.auth.signOut(); navigate('/'); }}
            className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h2>
            <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              System performance overview
            </div>
          </div>
          <button className="relative p-2 text-slate-400 hover:text-[#1638a1] transition-colors bg-white rounded-full border border-slate-200">
            <Bell size={20} />
          </button>
        </header>

        {fetchError && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
            โหลดข้อมูลรายวิชาไม่สำเร็จ: {fetchError}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-2">อาจารย์ทั้งหมด</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold text-blue-600">{stats.teachers}</span>
              <span className="text-xs text-slate-400 mb-1">ท่าน</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100">
            <p className="text-xs text-slate-400 mb-2">หลักสูตรในระบบ</p>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-semibold text-indigo-600">{stats.courses}</span>
              <span className="text-xs text-slate-400 mb-1">วิชา</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Courses table */}
          <div className="col-span-12 lg:col-span-9">
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-1 h-3.5 bg-[#1638a1] rounded-full" /> รายวิชาในระบบ
                </h3>
              </div>
              <div className="px-6 pb-6">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-xs text-slate-400 border-b border-slate-100">
                      <th className="py-3 font-medium">รหัสวิชา</th>
                      <th className="py-3 font-medium">ชื่อวิชา</th>
                      <th className="py-3 font-medium">ชื่อผู้สอน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {loadingCourses ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400">
                          <Loader2 className="inline animate-spin mr-2" size={16} /> กำลังโหลดข้อมูล...
                        </td>
                      </tr>
                    ) : courseRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400">ยังไม่มีรายวิชาในระบบ</td>
                      </tr>
                    ) : (
                      courseRows.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 font-medium text-slate-700 text-sm">{course.code}</td>
                          <td className="py-3 text-slate-600 text-sm">{course.name}</td>
                          <td className="py-3 text-slate-500 text-sm">{course.instructorNames}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-[#1638a1] text-white p-6 rounded-2xl">
              <h4 className="text-xs font-medium uppercase tracking-wider opacity-70 mb-4">Quick actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => navigate('/admin/instructors')}
                  className="w-full bg-white text-[#1638a1] py-2.5 rounded-xl text-sm font-medium transition-transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> เพิ่มอาจารย์
                </button>
                <button
                  onClick={() => navigate('/admin/courses')}
                  className="w-full bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <FileUp size={16} /> นำเข้า Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDash;