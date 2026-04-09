import React, { useState } from 'react';
import { Save, Send, ChevronLeft, Printer } from 'lucide-react';

export default function DocumentForm() {
  const [activeTab, setActiveTab] = useState(1);

  // Tabs ของ มคอ.3 ทั่วไป
  const tabs = [
    { id: 1, name: 'หมวดที่ 1 ข้อมูลทั่วไป' },
    { id: 2, name: 'หมวดที่ 2 จุดมุ่งหมาย' },
    { id: 3, name: 'หมวดที่ 3 ลักษณะงาน' },
    { id: 4, name: 'หมวดที่ 4 แผนการสอน' },
    { id: 5, name: 'หมวดที่ 5 แผนประเมิน' },
    { id: 6, name: 'หมวดที่ 6 ทรัพยากร' },
    { id: 7, name: 'หมวดที่ 7 ประเมินรายวิชา' },
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-800">CS101: Introduction to Computer Science</h2>
            <p className="text-sm text-gray-500">แบบฟอร์ม มคอ.3 (ภาคการศึกษา 1/2567)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center">
            <Printer size={18} className="mr-2" /> PDF
          </button>
          <button className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center border border-blue-200">
            <Save size={18} className="mr-2" /> บันทึกร่าง
          </button>
          <button className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center shadow-md">
            <Send size={18} className="mr-2" /> ส่งอนุมัติ
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
        <div className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content Area */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 min-h-[500px]">
        {activeTab === 1 && (
          <div className="space-y-6 max-w-3xl">
             <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">1. ข้อมูลทั่วไปของรายวิชา</h3>
             
             <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">รหัสวิชา</label>
                  <input type="text" value="CS101" disabled className="w-full p-2 bg-gray-50 border rounded-lg text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อวิชา (ภาษาไทย)</label>
                  <input type="text" value="วิทยาการคอมพิวเตอร์เบื้องต้น" disabled className="w-full p-2 bg-gray-50 border rounded-lg text-gray-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">จำนวนหน่วยกิต</label>
                  <input type="text" value="3 (2-2-5)" disabled className="w-full p-2 bg-gray-50 border rounded-lg text-gray-500" />
                </div>
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">หลักสูตรและประเภทของรายวิชา</label>
                   <input type="text" className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="ระบุประเภทรายวิชา" />
                </div>
             </div>
             
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">อาจารย์ผู้รับผิดชอบรายวิชา</label>
                <textarea className="w-full p-2 border border-gray-300 rounded-lg h-24 focus:ring-2 focus:ring-blue-500" placeholder="ระบุรายชื่ออาจารย์..."></textarea>
             </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">4. แผนการสอนและการประเมินผล</h3>
            <div className="text-center py-10 text-gray-400 bg-gray-50 border-2 border-dashed rounded-lg">
               (พื้นที่สำหรับตารางแผนการสอนรายสัปดาห์ - จะใส่ Table เพิ่มเติมในภายหลัง)
            </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {activeTab !== 1 && activeTab !== 4 && (
          <div className="flex items-center justify-center h-64 text-gray-400">
             เลือกแท็บ "{tabs.find(t => t.id === activeTab).name}" แล้ว
          </div>
        )}

      </div>
    </div>
  );
}