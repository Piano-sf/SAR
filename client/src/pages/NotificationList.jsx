import React, { useState } from 'react';
import { Bell, CheckCircle, AlertCircle, FileText, Info, Trash2, CheckCheck, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotificationList() {
  // ข้อมูลจำลองของการแจ้งเตือนทั้งหมด (เพิ่มให้เยอะขึ้นเพื่อดูระบบ Filter)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'warning',
      category: 'tqf',
      title: 'กำหนดส่ง มคอ. 5 (เหลือ 7 วัน)',
      message: 'กรุณาส่งรายงานผลการดำเนินการ มคอ. 5 รายวิชา CS301 ภายในวันที่ 15 ธ.ค. 2567',
      date: '08 ธ.ค. 2567',
      time: '09:00 น.',
      isRead: false,
      link: '/documents'
    },
    {
      id: 2,
      type: 'success',
      category: 'academic',
      title: 'อนุมัติผลงานวิชาการ',
      message: 'ผลงานวิจัย "ระบบ AI สำหรับการเกษตรอัจฉริยะ" ของคุณได้รับการตรวจสอบและอนุมัติแล้ว',
      date: '07 ธ.ค. 2567',
      time: '14:30 น.',
      isRead: false,
      link: '/academic-works'
    },
    {
      id: 3,
      type: 'warning',
      category: 'tqf',
      title: 'แจ้งเตือน: ยังไม่ได้ส่ง มคอ. 3',
      message: 'คุณยังมีรายวิชา IT201 ที่ยังไม่ได้จัดทำ มคอ. 3 กรุณาดำเนินการก่อนเปิดภาคเรียน',
      date: '05 ธ.ค. 2567',
      time: '10:15 น.',
      isRead: true,
      link: '/documents'
    },
    {
      id: 4,
      type: 'info',
      category: 'system',
      title: 'อัปเดตระบบ QA เวอร์ชันใหม่',
      message: 'ระบบได้เพิ่มฟีเจอร์การดึงค่าน้ำหนักผลงานอัตโนมัติจากฐานข้อมูล TCI แล้ว',
      date: '01 ธ.ค. 2567',
      time: '08:00 น.',
      isRead: true,
      link: '#'
    },
    {
      id: 5,
      type: 'error',
      category: 'academic',
      title: 'เอกสารผลงานวิชาการไม่สมบูรณ์',
      message: 'กรุณาแนบไฟล์หน้าปกและสารบัญของบทความวิชาการ "Data Science Trends" ใหม่อีกครั้ง',
      date: '28 พ.ย. 2567',
      time: '16:45 น.',
      isRead: true,
      link: '/academic-works'
    }
  ]);

  const [activeFilter, setActiveFilter] = useState('all'); // all, unread, tqf, academic, system
  const [searchTerm, setSearchTerm] = useState('');

  // ฟังก์ชันเลือกไอคอนตามประเภท
  const getIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertCircle size={24} className="text-orange-500" />;
      case 'error': return <AlertCircle size={24} className="text-red-500" />;
      case 'success': return <CheckCircle size={24} className="text-green-500" />;
      case 'info': return <Info size={24} className="text-blue-500" />;
      default: return <FileText size={24} className="text-gray-500" />;
    }
  };

  // จัดการเปลี่ยนสถานะการอ่าน
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id) => {
    if(window.confirm('ต้องการลบการแจ้งเตือนนี้ใช่หรือไม่?')) {
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  // ตัวกรองข้อมูล (Filter & Search)
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.includes(searchTerm) || n.message.includes(searchTerm);
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case 'unread': return !n.isRead;
      case 'tqf': return n.category === 'tqf';
      case 'academic': return n.category === 'academic';
      case 'system': return n.category === 'system';
      default: return true; // all
    }
  });

  return (
    <div className="max-w-5xl mx-auto pb-10 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Bell size={28} className="text-blue-600" />
            การแจ้งเตือนทั้งหมด
          </h2>
          <p className="text-gray-500 mt-1">
            คุณมีข้อความที่ยังไม่ได้อ่าน <span className="font-bold text-red-500">{notifications.filter(n => !n.isRead).length}</span> รายการ
          </p>
        </div>
        
        <button 
          onClick={markAllAsRead}
          disabled={notifications.filter(n => !n.isRead).length === 0}
          className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <CheckCheck size={20} className="mr-2" /> ทำเครื่องหมายว่าอ่านแล้วทั้งหมด
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between gap-4">
        
        {/* แถบตัวกรอง */}
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'ทั้งหมด' },
            { id: 'unread', label: 'ยังไม่ได้อ่าน' },
            { id: 'tqf', label: 'เอกสาร มคอ.' },
            { id: 'academic', label: 'ผลงานวิชาการ' },
            { id: 'system', label: 'ประกาศระบบ' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === tab.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ช่องค้นหา */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="ค้นหาการแจ้งเตือน..." 
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Notification List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
               <Bell size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700">ไม่มีการแจ้งเตือน</h3>
            <p className="text-gray-500 mt-1">ไม่พบข้อมูลในหมวดหมู่ที่คุณกำลังค้นหา</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-5 flex gap-4 transition-colors hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/20' : ''}`}
              >
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notif.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-1">
                    <h3 className={`text-base font-semibold ${!notif.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notif.title}
                    </h3>
                    <div className="text-xs text-gray-500 whitespace-nowrap flex items-center">
                      {notif.date} • {notif.time}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm leading-relaxed pr-8">
                    {notif.message}
                  </p>

                  <div className="mt-3 flex items-center gap-4">
                    <Link to={notif.link}>
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 underline-offset-2 hover:underline"
                      >
                        ดูรายละเอียด
                      </button>
                    </Link>
                    
                    {!notif.isRead && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="text-sm font-medium text-gray-500 hover:text-gray-700"
                      >
                        ทำเครื่องหมายว่าอ่านแล้ว
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Indicator & Delete */}
                <div className="flex flex-col items-end justify-between flex-shrink-0 ml-2">
                  {!notif.isRead ? (
                    <div className="w-3 h-3 bg-blue-600 rounded-full shadow-sm" title="ยังไม่ได้อ่าน"></div>
                  ) : (
                    <div></div> // Empty div to keep alignment
                  )}
                  
                  <button 
                    onClick={() => deleteNotification(notif.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mt-2"
                    title="ลบการแจ้งเตือน"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}