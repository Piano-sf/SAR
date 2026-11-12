import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle, AlertCircle, FileText, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';


const socket = io('http://localhost:3001');

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [notifications, setNotifications] = useState([]); // เริ่มต้นด้วย Array ว่าง

  useEffect(() => {
    // 1. รับการแจ้งเตือน Real-time จาก Backend
    socket.on('notification:received', (newNoti) => {
      console.log("Got new notification!", newNoti);
      
      // แปลงข้อมูลจาก DB ให้เข้ากับ Format ของหน้าจอเรา
      const formattedNoti = {
        id: newNoti.id,
        type: newNoti.type === 'DEADLINE_REMINDER' ? 'warning' : 'info',
        title: 'แจ้งเตือนระบบ',
        message: newNoti.message,
        time: 'เมื่อสักครู่',
        isRead: newNoti.isRead,
      };

      setNotifications(prev => [formattedNoti, ...prev]);

      // (Optional) ถ้าอยากให้มีเสียงหรือ Browser Notification ก็ใส่ตรงนี้ได้
    });

    // 2. ดึงข้อมูลแจ้งเตือนเก่าจาก Database (API) เมื่อโหลดหน้าเว็บ
    const fetchNotifications = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/notifications');
        const data = await response.json();
        const formattedData = data.map(n => ({
          id: n.id,
          type: n.type === 'DEADLINE_REMINDER' ? 'warning' : 'info',
          title: 'แจ้งเตือนระบบ',
          message: n.message,
          time: new Date(n.createdAt).toLocaleTimeString(),
          isRead: n.isRead,
        }));
        setNotifications(formattedData);
      } catch (err) {
        console.error("Failed to fetch notifications", err);
      }
    };

    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      socket.off('notification:received'); // ปิดการเชื่อมต่อเมื่อ Unmount
    };
  }, []);

  // นับจำนวนที่ยังไม่ได้อ่าน
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // ปิด Dropdown เมื่อคลิกที่อื่นบนหน้าจอ
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ฟังก์ชันสำหรับเปลี่ยนสถานะเป็น "อ่านแล้ว"
  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  // เลือกไอคอนและสีตามประเภทของการแจ้งเตือน
  const getIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertCircle size={20} className="text-orange-500" />;
      case 'success': return <CheckCircle size={20} className="text-green-500" />;
      case 'info': return <Info size={20} className="text-blue-500" />;
      default: return <FileText size={20} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ปุ่มกระดิ่ง */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
      >
        <Bell size={24} />
        {/* จุดสีแดงแสดงจำนวนที่ยังไม่ได้อ่าน */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown กล่องแจ้งเตือน */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 animate-fadeIn">
          {/* ส่วนหัว */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-100">
            <h3 className="font-bold text-gray-800">การแจ้งเตือน</h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                อ่านทั้งหมด
              </button>
            )}
          </div>

          {/* รายการแจ้งเตือน */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">ไม่มีการแจ้งเตือนใหม่</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    onClick={() => markAsRead(notif.id)}
                    className={`flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer ${notif.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
                  >
                    <div className="mt-1 flex-shrink-0">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notif.title}
                      </p>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {notif.time}
                      </p>
                    </div>
                    {/* จุดสีน้ำเงิน (Indicator) สำหรับอันที่ยังไม่ได้อ่าน */}
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ส่วนท้าย (ปุ่มดูทั้งหมด) */}
          <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
          <Link to="/notifications" onClick={() => setIsOpen(false)}>
              <button className="text-sm text-blue-600 hover:text-blue-800 font-medium w-full">
                ดูการแจ้งเตือนทั้งหมด
              </button>
          </Link>
          </div>
        </div>
      )}
    </div>
  );
}