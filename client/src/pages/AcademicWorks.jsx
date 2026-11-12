import React from 'react';
import { BookOpen, Award, Plus, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AcademicWorks() {
  const works = [
    { 
      id: 1, 
      title: 'การพัฒนาระบบตรวจจับใบหน้าด้วย Deep Learning', 
      type: 'งานวิจัย (Research)', 
      date: '15 ม.ค. 2567', 
      publisher: 'IEEE Access',
      category: 'นานาชาติ'
    },
    { 
      id: 2, 
      title: 'ผลกระทบของ AI ต่อการศึกษาไทย', 
      type: 'บทความวิชาการ (Article)', 
      date: '20 ธ.ค. 2566', 
      publisher: 'วารสารวิชาการ TCI กลุ่ม 1',
      category: 'ระดับชาติ'
    },
    { 
      id: 3, 
      title: 'นวัตกรรมสื่อการสอน AR สำหรับเด็กปฐมวัย', 
      type: 'ผลงานสร้างสรรค์', 
      date: '10 พ.ย. 2566', 
      publisher: 'งานประกวดนวัตกรรมแห่งชาติ',
      category: 'รางวัลเหรียญทอง'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">ผลงานทางวิชาการ</h2>
          <p className="text-gray-500">รวบรวมงานวิจัย บทความ และผลงานสร้างสรรค์</p>
        </div>
        <Link to="/academic-works/new">
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow-sm hover:bg-blue-700 transition-colors">
            <Plus size={18} className="mr-2" /> เพิ่มผลงานใหม่
        </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
             <BookOpen size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs">งานวิจัยตีพิมพ์ (ปีนี้)</p>
            <h3 className="text-2xl font-bold text-gray-800">5 เรื่อง</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
             <Award size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-xs">การอ้างอิง (Citations)</p>
            <h3 className="text-2xl font-bold text-gray-800">128 ครั้ง</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h3 className="font-semibold text-gray-800">รายการผลงานล่าสุด</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {works.map((work) => (
            <div key={work.id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-gray-500">
                   <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{work.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className="flex items-center"><Award size={14} className="mr-1" /> {work.type}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-0.5 rounded text-xs border border-blue-100">
                      {work.category}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{work.publisher}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end mt-2 sm:mt-0 pl-16 sm:pl-0">
                 <div className="flex items-center text-gray-400 text-sm">
                    <Calendar size={14} className="mr-1" /> {work.date}
                 </div>
                 <button className="text-gray-400 hover:text-blue-600 transition-colors">
                    <ExternalLink size={20} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}