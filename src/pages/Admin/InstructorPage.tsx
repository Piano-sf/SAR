/* eslint-disable no-irregular-whitespace */
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/useUserStore';
import {
  Loader2, Bell, X, UserPlus, Mail, Building, GraduationCap,
  Calendar as CalendarIcon, LogOut, LayoutDashboard, BookOpen, Users, User as UserIcon, Search,
} from 'lucide-react';

interface Instructor {
  id: string;
  full_name: string;
  email: string;
  role: string;
  departments: { name: string } | { name: string }[] | null;
}

interface Department {
  id: string;
  name: string;
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

const getDeptName = (departments: Instructor['departments']) =>
  Array.isArray(departments) ? departments[0]?.name : departments?.name;

const InstructorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName: storeFullName, avatarUrl: storeAvatarUrl } = useUserStore();

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: 'Lecturer',
    departmentId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, full_name, email, role, departments(name)')
          .in('role', ['Lecturer', 'Department_Head'])
          .order('full_name', { ascending: true });

        if (usersError) throw usersError;
        if (usersData) setInstructors(usersData as any);

        const { data: deptData, error: deptError } = await supabase
          .from('departments')
          .select('id, name')
          .order('name', { ascending: true });

        if (deptError) throw deptError;
        if (deptData) {
          setDepartments(deptData);
          if (deptData.length > 0) setFormData((prev) => ({ ...prev, departmentId: deptData[0].id }));
        }
      } catch (error: any) {
        console.error('Error fetching data:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // กรองฝั่ง client: ค้นหาจากชื่อ/อีเมล + กรองตามบทบาทและสาขาวิชา
  // (หมายเหตุ: ตัวกรอง "สถานะบัญชี" เดิม (ใช้งานปกติ/ปิดการใช้งาน) ตัดออก
  // เพราะตาราง users ที่ให้มาไม่มีคอลัมน์ status จริง ค่าที่โชว์ในตารางเป็น mock ทั้งหมด
  // ถ้ามีคอลัมน์นี้ในอนาคต บอกได้เลย จะเพิ่มตัวกรองนี้กลับเข้ามาให้ทำงานจริง)
  const filteredInstructors = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return instructors.filter((ins) => {
      const matchesSearch =
        !q ||
        (ins.full_name || '').toLowerCase().includes(q) ||
        (ins.email || '').toLowerCase().includes(q);
      const matchesRole = !roleFilter || ins.role === roleFilter;
      const deptName = getDeptName(ins.departments);
      const matchesDept = !departmentFilter || deptName === departmentFilter;
      return matchesSearch && matchesRole && matchesDept;
    });
  }, [instructors, searchTerm, roleFilter, departmentFilter]);

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email,
            role: formData.role,
            department_id: formData.departmentId,
            created_at: new Date().toISOString(),
          },
        ])
        .select('id, full_name, email, role, departments(name)');

      if (error) throw error;

      if (data) {
        setInstructors((prev) => [data[0] as any, ...prev]);
      }

      setIsAddModalOpen(false);
      setFormData({
        fullName: '',
        email: '',
        role: 'Lecturer',
        departmentId: departments[0]?.id || '',
      });

      alert('เพิ่มข้อมูลอาจารย์ใหม่ลงฐานข้อมูลสำเร็จ');
    } catch (error: any) {
      console.error('Error adding instructor:', error.message);
      alert('เกิดข้อผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-700 text-left">

      {/* Add instructor modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <UserPlus size={18} className="text-[#1638a1]" /> เพิ่มบัญชีผู้ใช้งานใหม่
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddInstructor} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">
                    ชื่อ-นามสกุล <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="เช่น ดร.นที พิทักษ์ไทย"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Mail size={12} /> อีเมล <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@utcc.ac.th"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Building size={12} /> สังกัด / ภาควิชา
                  </label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all cursor-pointer"
                  >
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500 flex items-center gap-1">
                    <GraduationCap size={12} /> บทบาทในระบบ
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all cursor-pointer"
                  >
                    <option value="Lecturer">อาจารย์ผู้สอน</option>
                    <option value="Department_Head">หัวหน้าภาควิชา</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-[#1638a1] leading-relaxed">
                  <strong>หมายเหตุ:</strong> ระบบจะสร้างรหัสผ่านชั่วคราวและส่งไปยังอีเมลของอาจารย์โดยอัตโนมัติ อาจารย์จะถูกบังคับให้เปลี่ยนรหัสผ่านในการเข้าสู่ระบบครั้งแรก
                </p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-[#1638a1] hover:bg-blue-800 disabled:opacity-70 rounded-xl transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (<><Loader2 size={14} className="animate-spin" /> กำลังสร้างบัญชี...</>) : 'ยืนยันการเพิ่มบัญชี'}
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
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">จัดการการลงทะเบียนอาจารย์</h2>
            <p className="text-slate-500 text-sm mt-1">ระบบจัดการการลงทะเบียนอาจารย์</p>
          </div>
          <button className="relative p-2 text-slate-400 hover:text-[#1638a1] transition-colors bg-white rounded-full border border-slate-200">
            <Bell size={20} />
          </button>
        </header>

        {/* Search + filters */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อ หรือ อีเมลอาจารย์..."
                className="block w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] transition-all"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer transition-all"
            >
              <option value="">ทุกบทบาท</option>
              <option value="Lecturer">อาจารย์ผู้สอน</option>
              <option value="Department_Head">หัวหน้าภาควิชา</option>
            </select>

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer transition-all"
            >
              <option value="">ทุกสาขาวิชา</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>{dept.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full md:w-auto bg-[#1638a1] text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95"
          >
            <UserPlus size={16} /> เพิ่มผู้ใช้งานรายบุคคล
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-400 border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">ชื่อ-นามสกุล</th>
                  <th className="px-6 py-3 font-medium">อีเมล</th>
                  <th className="px-6 py-3 font-medium">สาขาวิชา</th>
                  <th className="px-6 py-3 font-medium">บทบาท</th>
                  <th className="px-6 py-3 font-medium text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1638a1]" /> กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filteredInstructors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                      {searchTerm || roleFilter || departmentFilter ? 'ไม่พบข้อมูลที่ตรงกับตัวกรอง' : 'ยังไม่มีข้อมูลอาจารย์ในระบบ'}
                    </td>
                  </tr>
                ) : (
                  filteredInstructors.map((ins) => {
                    const deptName = getDeptName(ins.departments);
                    return (
                      <tr key={ins.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-medium text-[#1638a1] shrink-0">
                              {ins.full_name ? ins.full_name.charAt(0) : 'U'}
                            </div>
                            <span className="font-medium text-slate-800">{ins.full_name || 'ไม่ระบุชื่อ'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{ins.email}</td>
                        <td className="px-6 py-4 text-slate-600">{deptName || '-'}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {ins.role === 'Department_Head' ? 'หัวหน้าภาควิชา' : 'อาจารย์ผู้สอน'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            <button className="p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors" title="แก้ไข">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            <button className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors" title="ลบ">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
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
      </main>
    </div>
  );
};

export default InstructorPage;