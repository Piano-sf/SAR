import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, FileText, Award, TrendingUp,
  Calendar, ChevronRight, MoreHorizontal, AlertCircle, XCircle, CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

// สีประจำแต่ละสาขา — ระบบมีแค่ 3 สาขาจริง (คอมพิวเตอร์ / ไฟฟ้า / โลจิสติกส์)
// ถ้าเพิ่มสาขาใหม่ในอนาคต ให้เพิ่ม mapping ตรงนี้ ไม่งั้นจะ fallback เป็นสีเทา
const DEPT_COLOR: Record<string, { text: string; bg: string }> = {
  'คอมพิวเตอร์': { text: 'text-blue-600', bg: 'bg-blue-500' },
  'ไฟฟ้า': { text: 'text-amber-600', bg: 'bg-amber-500' },
  'โลจิสติกส์': { text: 'text-emerald-600', bg: 'bg-emerald-500' },
};
const DEFAULT_DEPT_COLOR = { text: 'text-slate-600', bg: 'bg-slate-500' };

interface LecturerStatusRow {
  name: string;
  progress: number;
  status: 'ครบ' | 'กำลังดำเนินการ' | 'ยังไม่เริ่ม';
  color: string;
}

interface DeptProgressRow {
  name: string;
  progress: number;
  total: number;
  sent: number;
  color: string;
  bg: string;
}

interface TopLecturerRow {
  name: string;
  dept: string;
  score: number;
}

export default function ExecutiveDashboard() {
  const [stats, setStats] = useState({
    totalLecturers: 0,
    totalDepartments: 0,
    sentTQF: 0,
    totalCourses: 0,
    totalSlots: 0,
    kpiScore: 0,
  });
  const [lecturerStatus, setLecturerStatus] = useState<LecturerStatusRow[]>([]);
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});
  const [topLecturers, setTopLecturers] = useState<TopLecturerRow[]>([]);
  const [deptProgress, setDeptProgress] = useState<DeptProgressRow[]>([]);
  const [upcomingDeadline, setUpcomingDeadline] = useState<{ title: string; daysLeft: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [notification, setNotification] = useState<{
    show: boolean, title: string, message: string, type: 'error' | 'success'
  }>({ show: false, title: '', message: '', type: 'success' });

  const showAlert = (title: string, message: string, type: 'error' | 'success' = 'error') => {
    setNotification({ show: true, title, message, type });
  };

  useEffect(() => {
    fetchExecutiveData();
  }, []);

  const fetchExecutiveData = async () => {
    setIsLoading(true);
    try {
      // ดึงทุกตารางแบบ flat query แล้วประมวลผลรวมกันฝั่ง client
      // (กัน nested embed พังเงียบๆ เหมือนที่เจอมาหลายหน้าก่อนหน้านี้)
      const [
        { data: departments, error: deptError },
        { data: lecturers, error: lecturersError },
        { data: courses, error: coursesError },
        { data: links, error: linksError },
        { data: works, error: worksError },
        { data: deadlines, error: deadlinesError },
      ] = await Promise.all([
        supabase.from('departments').select('id, name'),
        supabase.from('users').select('id, full_name, department_id').in('role', ['Lecturer', 'Department_Head']),
        supabase.from('courses').select('id, code, name, department_id, tqf3_status, tqf5_status'),
        supabase.from('course_instructors').select('course_id, teacher_id'),
        supabase.from('academic_works').select('id, weight, user_id'),
        supabase.from('deadlines').select('title, due_date').eq('status', 'pending').order('due_date', { ascending: true }).limit(1),
      ]);

      const firstError = deptError || lecturersError || coursesError || linksError || worksError || deadlinesError;
      if (firstError) throw firstError;

      const deptList = departments || [];
      const deptNameById = Object.fromEntries(deptList.map(d => [d.id, d.name]));

      // ---------- สรุปสถานะรายวิชา ----------
      // นับเป็น "ฉบับเอกสาร" ไม่ใช่ "รายวิชา" — วิชาหนึ่งมี 2 ฉบับ (มคอ.3 + มคอ.5)
      // ส่งแค่มคอ.3 อย่างเดียวก็นับเพิ่ม 1 ฉบับทันที ไม่ต้องรอส่งครบทั้งคู่ถึงจะขึ้นตัวเลข
      const submittedSlotsOf = (c: any) =>
        (c.tqf3_status === 'submitted' ? 1 : 0) + (c.tqf5_status === 'submitted' ? 1 : 0);
      const sentTQFCount = (courses || []).reduce((sum, c) => sum + submittedSlotsOf(c), 0);
      const totalSlots = (courses || []).length * 2;

      // ---------- KPI ต่อคน (รวมค่าน้ำหนักผลงานวิชาการ) ----------
      const weightByUser: Record<string, number> = {};
      (works || []).forEach((w: any) => {
        weightByUser[w.user_id] = (weightByUser[w.user_id] || 0) + (Number(w.weight) || 0);
      });
      const lecturerList = lecturers || [];
      const avgKpi = lecturerList.length > 0
        ? lecturerList.reduce((sum, l) => sum + (weightByUser[l.id] || 0), 0) / lecturerList.length
        : 0;

      setStats({
        totalLecturers: lecturerList.length,
        totalDepartments: deptList.length,
        sentTQF: sentTQFCount,
        totalCourses: (courses || []).length,
        totalSlots,
        kpiScore: avgKpi,
      });

      // ---------- สถานะการส่ง มคอ. รายอาจารย์ ----------
      const linksList = links || [];
      const lecturerRows: LecturerStatusRow[] = lecturerList.map((l) => {
        const myCourseIds = linksList.filter(link => link.teacher_id === l.id).map(link => link.course_id);
        const myCourses = (courses || []).filter(c => myCourseIds.includes(c.id));
        const totalSlots = myCourses.length * 2; // มคอ.3 + มคอ.5 ต่อวิชา
        const submittedSlots = myCourses.reduce((sum, c) => {
          return sum + (c.tqf3_status === 'submitted' ? 1 : 0) + (c.tqf5_status === 'submitted' ? 1 : 0);
        }, 0);
        const progress = totalSlots > 0 ? Math.round((submittedSlots / totalSlots) * 100) : 0;
        const status: LecturerStatusRow['status'] = progress === 100 ? 'ครบ' : progress === 0 ? 'ยังไม่เริ่ม' : 'กำลังดำเนินการ';
        const color = progress === 100 ? 'bg-green-500' : progress === 0 ? 'bg-gray-200' : 'bg-blue-500';
        return { name: l.full_name || 'ไม่ทราบชื่อ', progress, status, color };
      }).sort((a, b) => a.progress - b.progress); // โชว์คนที่ค้างส่งเยอะสุดก่อน

      setLecturerStatus(lecturerRows);

      // ---------- ผลงานวิชาการรวมต่อสาขา (กราฟแท่ง) ----------
      const deptIdByUser = Object.fromEntries(lecturerList.map(l => [l.id, l.department_id]));
      const deptWeight: Record<string, number> = {};
      (works || []).forEach((w: any) => {
        const deptId = deptIdByUser[w.user_id];
        const deptName = deptId ? deptNameById[deptId] : null;
        if (!deptName) return;
        deptWeight[deptName] = (deptWeight[deptName] || 0) + (Number(w.weight) || 0);
      });
      setDeptStats(deptWeight);

      // ---------- ความคืบหน้า มคอ. แยกตามสาขา ----------
      const deptProgressRows: DeptProgressRow[] = deptList.map((d) => {
        const deptCourses = (courses || []).filter(c => c.department_id === d.id);
        const total = deptCourses.length * 2;
        const sent = deptCourses.reduce((sum, c) => sum + submittedSlotsOf(c), 0);
        const progress = total > 0 ? Math.round((sent / total) * 100) : 0;
        const palette = DEPT_COLOR[d.name] || DEFAULT_DEPT_COLOR;
        return { name: d.name, progress, total, sent, color: palette.text, bg: palette.bg };
      });
      setDeptProgress(deptProgressRows);

      // ---------- Top 5 อาจารย์ KPI สูงสุด ----------
      const topRows: TopLecturerRow[] = lecturerList
        .map(l => ({
          name: l.full_name || 'ไม่ทราบชื่อ',
          dept: l.department_id ? (deptNameById[l.department_id] || 'ไม่ระบุสาขา') : 'ไม่ระบุสาขา',
          score: weightByUser[l.id] || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setTopLecturers(topRows);

      // ---------- กำหนดการสำคัญที่ใกล้ถึงที่สุด ----------
      const nextDeadline = (deadlines || [])[0];
      if (nextDeadline) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const due = new Date(nextDeadline.due_date); due.setHours(0, 0, 0, 0);
        const daysLeft = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setUpcomingDeadline({ title: nextDeadline.title, daysLeft });
      } else {
        setUpcomingDeadline(null);
      }
    } catch (error: any) {
      console.error('Error fetching executive data:', error);
      showAlert('โหลดข้อมูลไม่สำเร็จ', error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F2] p-8 font-sans">
      <div className="max-w-[1600px] mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-xs text-gray-400">QA System {'>'} ภาพรวมคณะ</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                <Calendar size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-600">ภาคเรียน 1 / 2567</span>
             </div>
             <button onClick={fetchExecutiveData} className="p-2 text-gray-400 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all">
               <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-sm font-medium opacity-80 flex items-center gap-2 mb-2">
                <TrendingUp size={16} /> ภาพรวม KPI คณะ (เฉลี่ย/คน)
              </span>
              <h2 className="text-4xl font-black mb-1">{stats.kpiScore.toFixed(2)}</h2>
              <p className="text-xs opacity-70">เป้าหมาย 5.00 คะแนน</p>
            </div>
            <div className="absolute -right-4 -bottom-4 text-white/10 rotate-12"><BarChart3 size={120} /></div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-medium text-gray-400 block mb-2 font-bold">อาจารย์ทั้งหมด</span>
            <h2 className="text-4xl font-black text-gray-900 mb-1">{stats.totalLecturers}</h2>
            <p className="text-xs text-gray-400">ใน {stats.totalDepartments} ภาควิชา</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-medium text-gray-400 block mb-2 font-bold">ส่งเอกสาร มคอ. แล้ว</span>
            <h2 className="text-4xl font-black text-gray-900 mb-1">{stats.sentTQF}</h2>
            <p className="text-xs text-gray-400">จากทั้งหมด {stats.totalSlots} ฉบับ ({stats.totalCourses} วิชา)</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-sm font-medium text-gray-400 block mb-2 font-bold">สำเร็จแล้ว (%)</span>
            <h2 className="text-4xl font-black text-gray-900 mb-1">
              {stats.totalSlots > 0 ? Math.round((stats.sentTQF / stats.totalSlots) * 100) : 0}%
            </h2>
            <p className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded inline-block">สถานะการส่งรวม</p>
          </div>
        </div>

        {/* สรุปสถานะ มคอ. แยกตามสาขา */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            สรุปความคืบหน้า มคอ. แยกตามสาขาวิชา
            </h3>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Department Overview</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <p className="text-sm text-gray-400 col-span-full text-center py-6">กำลังโหลด...</p>
            ) : deptProgress.length === 0 ? (
              <p className="text-sm text-gray-400 col-span-full text-center py-6">ยังไม่มีข้อมูลสาขา</p>
            ) : (
              deptProgress.map((dept, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-50 bg-gray-50/30 hover:bg-white hover:shadow-md transition-all group">
                    <div className="flex justify-between items-start mb-3">
                    <div>
                        <p className="text-xs font-black text-gray-800 mb-1">{dept.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">ส่งแล้ว {dept.sent}/{dept.total} ฉบับ</p>
                    </div>
                    <span className={`text-sm font-black ${dept.color}`}>{dept.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                    <div
                        className={`h-full ${dept.bg} transition-all duration-1000 ease-out`}
                        style={{ width: `${dept.progress}%` }}
                    ></div>
                    </div>
                </div>
              ))
            )}
        </div>
        </div>

        {/* Middle: Progress Bar รายอาจารย์ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <FileText size={18} className="text-gray-400" /> สถานะการส่ง มคอ. รายอาจารย์
            </h3>
            <div className="space-y-5 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {isLoading ? (
                <p className="text-sm text-gray-400 text-center py-6">กำลังโหลด...</p>
              ) : lecturerStatus.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">ยังไม่มีข้อมูลอาจารย์</p>
              ) : (
                lecturerStatus.map((lec, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-600 w-32 truncate">{lec.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ${lec.color}`} style={{ width: `${lec.progress}%` }}></div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 w-8 text-right">{lec.progress}%</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded w-20 text-center ${
                      lec.status === 'ครบ' ? 'bg-green-50 text-green-600' :
                      lec.status === 'กำลังดำเนินการ' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                    }`}>{lec.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
              <Calendar size={18} className="text-gray-400" /> กำหนดการสำคัญ
            </h3>
            <div className="space-y-6">
               {upcomingDeadline ? (
                 <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                    <div className="flex-1">
                       <p className="text-xs font-bold text-gray-800">{upcomingDeadline.title}</p>
                       <p className="text-[10px] text-gray-400">กำหนดการที่ใกล้ถึงที่สุด</p>
                    </div>
                    <div className="text-right"><p className="text-sm font-black text-red-600">{upcomingDeadline.daysLeft} วัน</p></div>
                 </div>
               ) : (
                 <p className="text-sm text-gray-400 text-center py-4">ไม่มีกำหนดการที่ใกล้ถึง</p>
               )}
            </div>
          </div>
        </div>

        {/* Bottom Section: กราฟภาควิชา และ Top 5 KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* ฝั่งซ้าย: กราฟแท่งผลงานรายภาควิชา */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-[450px]">
            <div className="flex justify-between items-start mb-6">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-500" />
                ผลงานวิชาการรายภาควิชา
            </h3>
            <span className="text-[10px] text-gray-400 font-bold bg-gray-50 px-2 py-1 rounded">ปีการศึกษา 2567</span>
            </div>
            
            <div className="flex-1 flex items-end justify-around gap-4 px-4 pb-2 pt-10">
            {Object.keys(deptStats).length === 0 ? (
              <p className="text-sm text-gray-400 m-auto">{isLoading ? 'กำลังโหลด...' : 'ยังไม่มีข้อมูลผลงานวิชาการ'}</p>
            ) : (
              Object.entries(deptStats).map(([name, score], idx) => {
                const maxScore = Math.max(...Object.values(deptStats), 1);
                return (
                  <div key={idx} className="flex flex-col items-center flex-1 group h-full justify-end">
                  <div className="relative w-full max-w-[45px] flex flex-col justify-end h-full">
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[11px] font-black text-indigo-600 transition-all group-hover:scale-110">
                      {score.toFixed(2)}
                      </div>
                      <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-xl transition-all duration-1000 ease-out hover:from-indigo-500 hover:to-indigo-300 shadow-lg shadow-indigo-100"
                      style={{ height: `${(score / maxScore) * 100}%` }}
                      >
                      <div className="w-full h-full bg-white/10 rounded-t-xl"></div>
                      </div>
                  </div>
                  <span className="text-[10px] text-gray-500 font-bold mt-4 text-center leading-tight">
                      {name}
                  </span>
                  </div>
                );
              })
            )}
            </div>
        </div>

        {/* ฝั่งขวา: อันดับอาจารย์ KPI สูงสุด (Top 5) */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col h-[450px]">
            <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Award size={20} className="text-orange-500" />
                อาจารย์ KPI สูงสุด (Top 5)
            </h3>
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded">EXCELLENCE</span>
            </div>
            
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
            {topLecturers.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">{isLoading ? 'กำลังโหลด...' : 'ยังไม่มีข้อมูลผลงานวิชาการ'}</p>
            ) : (
              topLecturers.map((lec, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all group">
                <div className="flex items-center gap-4">
                    <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-[11px] font-bold border-2 border-white shadow-sm">
                        {lec.name.substring(0, 2)}
                    </div>
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-white border border-gray-100 rounded-full flex items-center justify-center text-[9px] font-black text-gray-400 shadow-sm">
                        {idx + 1}
                    </div>
                    </div>
                    <div>
                    <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">{lec.name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{lec.dept}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-lg font-black text-indigo-600 leading-none block">{lec.score.toFixed(2)}</span>
                    <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Points</span>
                </div>
                </div>
              ))
            )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-50 flex justify-center">
            <button className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                ดูรายงานฉบับเต็มรายบุคคล →
            </button>
            </div>
        </div>
        </div>
      </div>
      {/* Notification Pop-up */}
      {notification.show && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
              {notification.type === 'error' ? <XCircle size={32} /> : <CheckCircle2 size={32} />}
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{notification.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{notification.message}</p>
            <button onClick={() => setNotification({ ...notification, show: false })} className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors">ตกลง</button>
          </div>
        </div>
      )}
    </div>
  );
}