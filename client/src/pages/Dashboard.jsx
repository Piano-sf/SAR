import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, BookOpen, AlertCircle, CheckCircle, Clock, TrendingUp, Calendar, ChevronRight, Activity, Award } from 'lucide-react';

export default function Dashboard() {
  // 🔴 จำลองข้อมูลผู้ใช้ (เปลี่ยน 'ADMIN' เป็น 'LECTURER' เพื่อดูหน้าจอที่เปลี่ยนไป)
  const [currentUser] = useState({ id: 1, name: 'อ.สมชาย ใจดี', role: 'ADMIN' });

  // ข้อมูลจำลองสำหรับกราฟแท่ง (Progress)
  const tqfProgress = { total: 45, submitted: 32, pending: 13 };
  const academicProgress = { total: 120, approved: 85, pending: 25, rejected: 10 };

  // ข้อมูลจำลองกิจกรรมล่าสุด
  const recentActivities = [
    { id: 1, user: 'อ.สมศรี เรียนดี', action: 'ส่ง มคอ. 3', subject: 'CS302 ปัญญาประดิษฐ์', time: '2 ชั่วโมงที่แล้ว', type: 'tqf' },
    { id: 2, user: 'อ.สมชาย ใจดี', action: 'ส่งผลงานวิชาการ', subject: 'การพัฒนาระบบ AI...', time: '5 ชั่วโมงที่แล้ว', type: 'academic' },
    { id: 3, user: 'Admin', action: 'อนุมัติผลงาน', subject: 'การวิเคราะห์ข้อมูล...', time: '1 วันที่แล้ว', type: 'approve' },
  ];

  // ข้อมูลจำลองกำหนดการ
  const upcomingDeadlines = [
    { id: 1, title: 'ส่ง มคอ. 3 (ภาค 1/2567)', date: '31 ก.ค. 2567', daysLeft: 5, urgent: true },
    { id: 2, title: 'ส่งผลงานวิชาการรอบที่ 1', date: '15 ส.ค. 2567', daysLeft: 20, urgent: false },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn pb-10">
      
      {/* ================= Header & Greeting ================= */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-blue-900 to-blue-700 p-8 rounded-2xl shadow-lg text-white relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">สวัสดี, {currentUser.name} 👋</h1>
          <p className="text-blue-100 text-lg">
            {currentUser.role === 'ADMIN' 
              ? 'ภาพรวมระบบบริหารจัดการเอกสาร มคอ. และผลงานวิชาการระดับคณะ' 
              : 'ยินดีต้อนรับสู่พื้นที่จัดการเอกสารและผลงานวิชาการของคุณ'}
          </p>
        </div>
        <div className="relative z-10 bg-white/10 backdrop-blur-md px-6 py-3 rounded-xl border border-white/20 text-center">
          <p className="text-blue-100 text-sm font-medium mb-1">ปีการศึกษาปัจจุบัน</p>
          <p className="text-2xl font-bold">เทอม 1 / 2567</p>
        </div>
        {/* วงกลมตกแต่ง */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute right-40 -bottom-20 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl"></div>
      </div>

      {/* ================= Quick Stats Cards ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <Link to="/documents">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 font-medium mb-1">มคอ. {currentUser.role === 'ADMIN' ? 'ทั้งหมดในระบบ' : 'ของฉันเทอมนี้'}</p>
                <h3 className="text-3xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                  {currentUser.role === 'ADMIN' ? tqfProgress.total : '4'} <span className="text-sm font-normal text-gray-500">วิชา</span>
                </h3>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-blue-600 bg-blue-50 w-max px-3 py-1 rounded-md">
              <TrendingUp size={16} className="mr-1" /> {currentUser.role === 'ADMIN' ? 'ส่งแล้ว 70%' : 'ดำเนินการครบถ้วน'}
            </div>
          </div>
        </Link>

        <Link to="/academic-works">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 font-medium mb-1">ผลงานวิชาการ {currentUser.role === 'ADMIN' ? 'ทั้งหมด' : 'ของฉัน'}</p>
                <h3 className="text-3xl font-bold text-gray-800 group-hover:text-purple-600 transition-colors">
                  {currentUser.role === 'ADMIN' ? academicProgress.total : '2'} <span className="text-sm font-normal text-gray-500">ชิ้น</span>
                </h3>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                <BookOpen size={24} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm font-medium text-purple-600 bg-purple-50 w-max px-3 py-1 rounded-md">
              <Award size={16} className="mr-1" /> {currentUser.role === 'ADMIN' ? 'อนุมัติแล้ว 85 ชิ้น' : 'น้ำหนักรวม 1.5'}
            </div>
          </div>
        </Link>

        {currentUser.role === 'ADMIN' ? (
          // การ์ดด่วนสำหรับ Admin
          <Link to="/approvals" className="lg:col-span-2">
            <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer flex items-center justify-between h-full relative overflow-hidden group">
              <div className="relative z-10">
                <p className="text-orange-100 font-medium mb-1 text-lg">งานด่วนที่ต้องดำเนินการ</p>
                <h3 className="text-3xl font-bold text-white flex items-center">
                  รอตรวจสอบ 3 รายการ
                </h3>
                <p className="text-white/80 text-sm mt-2 flex items-center">
                  กดเพื่อเข้าสู่กระดานอนุมัติ <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
              <div className="relative z-10 bg-white/20 p-4 rounded-full backdrop-blur-sm group-hover:rotate-12 transition-transform">
                <AlertCircle size={40} className="text-white" />
              </div>
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            </div>
          </Link>
        ) : (
          // การ์ดสถานะสำหรับอาจารย์
          <div className="lg:col-span-2 bg-gradient-to-r from-teal-500 to-emerald-500 p-6 rounded-2xl shadow-lg text-white flex items-center justify-between h-full relative overflow-hidden">
             <div className="relative z-10">
                <p className="text-teal-100 font-medium mb-1 text-lg">สถานะการส่งเอกสารของคุณ</p>
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <CheckCircle size={28} className="mr-2" /> สมบูรณ์ 100%
                </h3>
                <p className="text-white/80 text-sm mt-2">ยอดเยี่ยม! คุณไม่มีเอกสารค้างส่งในขณะนี้</p>
              </div>
              <div className="absolute right-0 top-0 opacity-20">
                <FileText size={150} className="-mr-10 -mt-10 rotate-12" />
              </div>
          </div>
        )}
      </div>

      {/* ================= Main Content Grid ================= */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Charts & Progress) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Progress Section (แสดงสัดส่วนโดยไม่ต้องใช้ Plugin เสริม) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <Activity size={20} className="text-blue-600 mr-2" /> 
              ภาพรวมความคืบหน้าการส่งเอกสาร
            </h3>
            
            <div className="space-y-8">
              {/* TQF Progress */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="font-bold text-gray-700">การส่งเอกสาร มคอ.</p>
                    <p className="text-sm text-gray-500">ส่งแล้ว {tqfProgress.submitted} จาก {tqfProgress.total} วิชา</p>
                  </div>
                  <span className="font-bold text-blue-600 text-xl">{Math.round((tqfProgress.submitted/tqfProgress.total)*100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden flex">
                  <div className="bg-blue-600 h-3.5 rounded-full" style={{ width: `${(tqfProgress.submitted/tqfProgress.total)*100}%` }}></div>
                </div>
              </div>

              {/* Academic Works Progress */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <p className="font-bold text-gray-700">สถานะผลงานวิชาการ</p>
                    <p className="text-sm text-gray-500">รอตรวจสอบ {academicProgress.pending} รายการ</p>
                  </div>
                  <span className="font-bold text-purple-600 text-xl">{Math.round((academicProgress.approved/academicProgress.total)*100)}% อนุมัติแล้ว</span>
                </div>
                {/* Multi-color progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-3.5 overflow-hidden flex">
                  <div className="bg-emerald-500 h-3.5" title="อนุมัติแล้ว" style={{ width: `${(academicProgress.approved/academicProgress.total)*100}%` }}></div>
                  <div className="bg-amber-400 h-3.5" title="รอตรวจสอบ" style={{ width: `${(academicProgress.pending/academicProgress.total)*100}%` }}></div>
                  <div className="bg-red-500 h-3.5" title="ตีกลับ" style={{ width: `${(academicProgress.rejected/academicProgress.total)*100}%` }}></div>
                </div>
                <div className="flex gap-4 mt-3 text-xs font-medium text-gray-500">
                  <div className="flex items-center"><div className="w-3 h-3 bg-emerald-500 rounded-full mr-1.5"></div> อนุมัติแล้ว</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-amber-400 rounded-full mr-1.5"></div> รอตรวจสอบ</div>
                  <div className="flex items-center"><div className="w-3 h-3 bg-red-500 rounded-full mr-1.5"></div> ส่งกลับแก้ไข</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activities Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-bold text-gray-800">ความเคลื่อนไหวล่าสุด</h3>
              <button className="text-sm font-medium text-blue-600 hover:text-blue-800">ดูทั้งหมด</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <tbody className="divide-y divide-gray-100">
                  {recentActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 w-12 text-center">
                        {activity.type === 'tqf' && <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto"><FileText size={14} /></div>}
                        {activity.type === 'academic' && <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto"><BookOpen size={14} /></div>}
                        {activity.type === 'approve' && <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto"><CheckCircle size={14} /></div>}
                      </td>
                      <td className="p-4">
                        <p className="font-bold text-gray-800">{activity.user} <span className="font-normal text-gray-500 ml-1">{activity.action}</span></p>
                        <p className="text-gray-500 mt-0.5">{activity.subject}</p>
                      </td>
                      <td className="p-4 text-right text-gray-400 whitespace-nowrap">
                        {activity.time}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (Deadlines & Quick Actions) */}
        <div className="space-y-8">
          
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center">
                <Calendar size={20} className="text-orange-500 mr-2" />
                <h3 className="text-lg font-bold text-gray-800">กำหนดการที่กำลังมาถึง</h3>
             </div>
             <div className="p-6 space-y-4">
               {upcomingDeadlines.map((deadline) => (
                 <div key={deadline.id} className={`p-4 rounded-xl border ${deadline.urgent ? 'border-orange-200 bg-orange-50' : 'border-gray-100 bg-white shadow-sm'}`}>
                   <div className="flex justify-between items-start mb-2">
                     <h4 className={`font-bold ${deadline.urgent ? 'text-orange-800' : 'text-gray-800'}`}>{deadline.title}</h4>
                     {deadline.urgent && <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-[10px] font-bold rounded-full animate-pulse">ด่วน!</span>}
                   </div>
                   <div className="flex items-center text-sm text-gray-600 mb-3">
                     <Clock size={14} className="mr-1.5" /> ภายในวันที่ {deadline.date}
                   </div>
                   <div className="flex items-end justify-between">
                     <span className={`text-xs font-medium px-2 py-1 rounded-md ${deadline.urgent ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                       เหลือเวลาอีก {deadline.daysLeft} วัน
                     </span>
                     <button className="text-blue-600 text-sm font-medium hover:underline">จัดการเลย</button>
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* Quick Actions (ปุ่มลัด) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">เมนูลัด (Quick Actions)</h3>
            <div className="space-y-3">
              <Link to="/documents/new">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
                  <div className="flex items-center text-gray-700 group-hover:text-blue-700 font-medium">
                    <FileText size={18} className="mr-3" /> สร้าง มคอ. ฉบับใหม่
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-blue-500" />
                </button>
              </Link>
              <Link to="/academic-works/new">
                <button className="w-full flex items-center justify-between p-3 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
                  <div className="flex items-center text-gray-700 group-hover:text-purple-700 font-medium">
                    <BookOpen size={18} className="mr-3" /> เพิ่มผลงานวิชาการ
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-purple-500" />
                </button>
              </Link>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}