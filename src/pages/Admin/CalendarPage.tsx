import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/useUserStore';
import {
  Bell, CalendarPlus, X, Loader2, Calendar as CalendarIcon,
  Clock, FileText, BookOpen, Award, User as UserIcon, LogOut,
  LayoutDashboard, Users,
} from 'lucide-react';

type DeadlineStatus = 'เลยกำหนด' | 'ใกล้ถึงกำหนด' | 'ยังไม่ถึงกำหนด';

interface Deadline {
  id: string;
  title: string;
  type: 'Document' | 'Research' | 'Reward' | string;
  due_date: string;
  assign_to: string;
  status: DeadlineStatus;
  submitted_count: number;
  total_count: number;
}

const TABS: Array<'ทั้งหมด' | DeadlineStatus> = ['ทั้งหมด', 'เลยกำหนด', 'ใกล้ถึงกำหนด', 'ยังไม่ถึงกำหนด'];

const TYPE_STYLES: Record<string, { icon: React.ReactNode; badgeBg: string; badgeText: string; iconBg: string; iconText: string; label: string; barColor: string }> = {
  Document: { icon: <FileText size={17} />, badgeBg: 'bg-blue-50', badgeText: 'text-blue-600', iconBg: 'bg-blue-50', iconText: 'text-blue-600', label: 'เอกสาร มคอ.', barColor: 'bg-blue-500' },
  Research: { icon: <BookOpen size={17} />, badgeBg: 'bg-violet-50', badgeText: 'text-violet-600', iconBg: 'bg-violet-50', iconText: 'text-violet-600', label: 'งานวิจัย', barColor: 'bg-violet-500' },
  Reward: { icon: <Award size={17} />, badgeBg: 'bg-amber-50', badgeText: 'text-amber-600', iconBg: 'bg-amber-50', iconText: 'text-amber-600', label: 'รางวัล/ผลงาน', barColor: 'bg-amber-500' },
  default: { icon: <FileText size={17} />, badgeBg: 'bg-slate-100', badgeText: 'text-slate-500', iconBg: 'bg-slate-100', iconText: 'text-slate-500', label: 'ทั่วไป', barColor: 'bg-slate-400' },
};

const getTypeStyle = (type: string) => TYPE_STYLES[type] ?? TYPE_STYLES.default;

const STATUS_STYLE: Record<DeadlineStatus, { border: string; dateText: string; icon: React.ReactNode; prefix: string }> = {
  เลยกำหนด: { border: 'border-l-red-400', dateText: 'text-red-600', icon: <Clock size={13} />, prefix: 'เลยกำหนด' },
  ใกล้ถึงกำหนด: { border: 'border-l-amber-400', dateText: 'text-amber-600', icon: <Clock size={13} />, prefix: 'กำหนดส่ง' },
  ยังไม่ถึงกำหนด: { border: 'border-l-transparent', dateText: 'text-slate-500', icon: <CalendarIcon size={13} />, prefix: '' },
};

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

const CalendarPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { fullName: storeFullName, avatarUrl: storeAvatarUrl } = useUserStore();

  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ทั้งหมด' | DeadlineStatus>('ทั้งหมด');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Document',
    dueDate: '',
    assignTo: 'All',
  });

  useEffect(() => {
    fetchDeadlines();
  }, []);

  const fetchDeadlines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const today = new Date().toISOString().split('T')[0];
        const processed: Deadline[] = data.map((task) => {
          let status: DeadlineStatus = 'ยังไม่ถึงกำหนด';
          if (task.due_date < today) {
            status = 'เลยกำหนด';
          } else {
            const diffDays = Math.ceil((new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays <= 7) status = 'ใกล้ถึงกำหนด';
          }
          return {
            ...task,
            status,
            submitted_count: task.submitted_count ?? 0,
            total_count: task.total_count ?? 0,
          };
        });
        setDeadlines(processed);
      }
    } catch (error: any) {
      console.error('Error fetching deadlines:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('deadlines')
        .insert([{
          title: formData.title,
          type: formData.type,
          due_date: formData.dueDate,
          assign_to: formData.assignTo,
          status: 'pending',
        }])
        .select()
        .single();

      if (error) throw error;

      setIsAddModalOpen(false);
      setFormData({ title: '', type: 'Document', dueDate: '', assignTo: 'All' });
      await fetchDeadlines();
      alert('สร้างกำหนดการใหม่สำเร็จ ระบบได้บันทึกและพร้อมแจ้งเตือนแล้ว');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredData = activeTab === 'ทั้งหมด' ? deadlines : deadlines.filter((d) => d.status === activeTab);

  const stats = {
    เลยกำหนด: deadlines.filter((d) => d.status === 'เลยกำหนด').length,
    ใกล้ถึงกำหนด: deadlines.filter((d) => d.status === 'ใกล้ถึงกำหนด').length,
    ยังไม่ถึงกำหนด: deadlines.filter((d) => d.status === 'ยังไม่ถึงกำหนด').length,
  };

  const grouped: Array<{ status: DeadlineStatus; items: Deadline[] }> = activeTab === 'ทั้งหมด'
    ? (['เลยกำหนด', 'ใกล้ถึงกำหนด', 'ยังไม่ถึงกำหนด'] as DeadlineStatus[])
        .map((status) => ({ status, items: deadlines.filter((d) => d.status === status) }))
        .filter((g) => g.items.length > 0)
    : [{ status: activeTab as DeadlineStatus, items: filteredData }];

  // Aggregate real submission progress per deadline type for the Visual analytics panel
  const analyticsRows = Object.keys(TYPE_STYLES)
    .filter((key) => key !== 'default')
    .map((typeKey) => {
      const items = deadlines.filter((d) => d.type === typeKey);
      const totalSubmitted = items.reduce((sum, d) => sum + (d.submitted_count || 0), 0);
      const totalCount = items.reduce((sum, d) => sum + (d.total_count || 0), 0);
      const percent = totalCount > 0 ? Math.round((totalSubmitted / totalCount) * 100) : 0;
      return {
        label: TYPE_STYLES[typeKey].label,
        percent,
        barColor: TYPE_STYLES[typeKey].barColor,
        textColor: TYPE_STYLES[typeKey].badgeText,
        hasData: items.length > 0,
      };
    })
    .filter((row) => row.hasData);

  const renderCard = (task: Deadline) => {
    const type = getTypeStyle(task.type);
    const sStyle = STATUS_STYLE[task.status];
    const percent = task.total_count > 0 ? Math.round((task.submitted_count / task.total_count) * 100) : 0;
    return (
      <div key={task.id} className={`bg-white border border-slate-100 border-l-[3px] ${sStyle.border} rounded-xl p-4 flex items-center gap-4 hover:shadow-sm transition-shadow`}>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${type.iconBg} ${type.iconText}`}>
          {type.icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${type.badgeBg} ${type.badgeText}`}>{type.label}</span>
          <p className="text-sm font-medium text-slate-900 mt-1.5 truncate">{task.title}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full ${type.barColor}`} style={{ width: `${percent}%` }} />
            </div>
            <span className="text-xs text-slate-400">{task.submitted_count}/{task.total_count} ({percent}%)</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-medium shrink-0 ${sStyle.dateText}`}>
          {sStyle.icon}
          {sStyle.prefix} {new Date(task.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-700 text-left">

      {/* Add deadline modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-100 w-full max-w-lg rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                <CalendarPlus size={18} className="text-[#1638a1]" /> สร้างกำหนดการใหม่
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignDeadline} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">
                  ชื่อกำหนดการ / หัวข้องาน <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="เช่น ส่งเอกสาร มคอ. 3 ประจำภาคเรียนที่ 1/2569"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">
                    ประเภทงาน <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all cursor-pointer"
                  >
                    <option value="Document">เอกสาร มคอ.</option>
                    <option value="Research">งานวิจัย</option>
                    <option value="Reward">การเสนอชื่อรางวัล</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-500">
                    กำหนดส่ง (Due date) <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">มอบหมายถึง (Assign to)</label>
                <select
                  value={formData.assignTo}
                  onChange={(e) => setFormData({ ...formData, assignTo: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all cursor-pointer"
                >
                  <option value="All">อาจารย์ทั้งหมดในระบบ</option>
                  <option value="HeadOnly">เฉพาะหัวหน้าภาควิชา</option>
                  <option value="Engineering">คณะวิศวกรรมศาสตร์</option>
                  <option value="Business">คณะบริหารธุรกิจ</option>
                </select>
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
                  {isSubmitting ? (<><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</>) : 'ยืนยันและส่งแจ้งเตือน'}
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
          <button onClick={() => { supabase.auth.signOut(); navigate('/login'); }} className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0" title="ออกจากระบบ">
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">จัดการปฏิทิน</h2>
            <p className="text-slate-500 text-sm mt-1">ระบบปฏิทิน และจัดการกำหนดส่งงานของอาจารย์</p>
          </div>
          <button className="p-2 text-slate-400 hover:text-[#1638a1] transition-colors bg-white rounded-full border border-slate-200">
            <Bell size={20} />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-xs text-red-500">เลยกำหนดแล้ว</p>
                <p className="text-xl font-semibold text-red-600 mt-1">{stats.เลยกำหนด} รายการ</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                <p className="text-xs text-amber-600">ใกล้ถึงกำหนด (7 วัน)</p>
                <p className="text-xl font-semibold text-amber-700 mt-1">{stats.ใกล้ถึงกำหนด} รายการ</p>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-4">
                <p className="text-xs text-slate-400">ยังไม่ถึงกำหนด</p>
                <p className="text-xl font-semibold text-slate-700 mt-1">{stats.ยังไม่ถึงกำหนด} รายการ</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="inline-flex gap-1 rounded-full border border-slate-200 bg-white p-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-sm transition-colors ${
                    activeTab === tab ? 'bg-[#1638a1] text-white font-medium' : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Grouped list */}
            {loading ? (
              <div className="bg-white border border-slate-100 rounded-xl p-12 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#1638a1]" />
                <span className="text-sm">กำลังโหลดกำหนดการ...</span>
              </div>
            ) : grouped.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-xl p-12 text-center text-sm text-slate-400">
                ไม่มีรายการในหมวดหมู่นี้
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map((g) => (
                  <div key={g.status} className="space-y-2">
                    {activeTab === 'ทั้งหมด' && <p className="text-sm font-medium text-slate-500">{g.status}</p>}
                    <div className="space-y-2">{g.items.map(renderCard)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-[#1638a1] rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <CalendarPlus size={16} /> สร้างกำหนดการใหม่
                </h4>
                <p className="text-xs text-blue-100/90 mb-5 leading-relaxed">
                  สร้างกำหนดการใหม่สำหรับ มคอ. งานวิจัย หรือเสนอชื่อรับรางวัล เพื่อแจ้งเตือนไปยังอาจารย์โดยตรง
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full bg-white text-[#1638a1] py-2.5 rounded-xl text-sm font-medium transition-transform hover:bg-blue-50 active:scale-[0.98]"
                >
                  + สร้างกำหนดการใหม่
                </button>
              </div>
              <CalendarIcon className="absolute -right-4 -bottom-4 w-32 h-32 text-white opacity-10" />
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h4 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4">Visual analytics</h4>
              {loading ? (
                <div className="flex items-center justify-center py-6 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : analyticsRows.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">ยังไม่มีข้อมูลสำหรับแสดงผล</p>
              ) : (
                <div className="space-y-4">
                  {analyticsRows.map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{row.label}</span>
                        <span className={`font-medium ${row.textColor}`}>{row.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`${row.barColor} h-full`} style={{ width: `${row.percent}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CalendarPage;