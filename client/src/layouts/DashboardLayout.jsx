import React from 'react';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Bell, User, BookOpen, CheckCircle  } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom'; 
import NotificationBell from '../components/NotificationBell';

// ปรับ Component ย่อยให้รับ Link
const SidebarItem = ({ icon: Icon, text, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to}>
      <li className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
      }`}>
        <Icon size={20} className="mr-3" />
        <span className="font-medium">{text}</span>
      </li>
    </Link>
  );
};

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <Link to="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <FileText className="fill-blue-600 text-white" /> QA System
          </Link>
          <p className="text-xs text-gray-400 mt-1">ระบบจัดการงานประกันคุณภาพ</p>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            <div className="text-xs font-semibold text-gray-400 mb-2 px-3 uppercase">เมนูหลัก</div>
            
            {/* ใส่ Link ให้ครบ */}
            <SidebarItem icon={LayoutDashboard} text="ภาพรวม (Dashboard)" to="/" />
            <SidebarItem icon={FileText} text="เอกสาร มคอ." to="/documents" />
            <SidebarItem icon={BookOpen} text="ผลงานวิชาการ" to="/academic-works" />
            <SidebarItem icon={Users} text="จัดการผู้ใช้งาน" to="/users" />
            <SidebarItem icon={CheckCircle} text="อนุมัติเอกสาร  " to="/approvals" />
            
            <div className="text-xs font-semibold text-gray-400 mb-2 mt-6 px-3 uppercase">ตั้งค่า</div>
            <SidebarItem icon={Settings} text="ตั้งค่าระบบ" to="/settings" />
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link to="/login">
            <button className="flex items-center w-full p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={20} className="mr-3" />
              <span>ออกจากระบบ</span>
            </button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">ระบบบริหารจัดการ</h2>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">อ.สมชาย ใจดี</p>
                <p className="text-xs text-gray-500">Admin / ผู้ดูแลระบบ</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}