import React from 'react';
import { ArrowLeft, Download, Printer, Edit, FileText, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocumentPreview() {
  // ข้อมูลจำลองของเอกสารที่ถูกคลิกเข้ามาดู
  const documentData = {
    id: 101,
    courseCode: 'CS301',
    courseName: 'วิศวกรรมซอฟต์แวร์ (Software Engineering)',
    type: 'มคอ. 3',
    term: '1/2567',
    ownerId: 1, 
    ownerName: 'อ.สมชาย ใจดี',
    status: 'ฉบับร่าง',
    lastUpdated: '10 ต.ค. 2567'
  };

  // จำลองผู้ใช้ปัจจุบัน (เพื่อเช็คสิทธิ์แสดงปุ่มแก้ไข)
  const currentUser = { id: 1 };
  const isOwner = documentData.ownerId === currentUser.id;

  return (
    <div className="max-w-7xl mx-auto pb-10 h-[calc(100vh-100px)] flex flex-col">
      
      {/* 1. Header & Action Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-t-xl shadow-sm border border-gray-200 z-10">
        
        {/* ปุ่มย้อนกลับ & ชื่อเอกสาร */}
        <div className="flex items-center gap-4">
          <Link to="/documents">
            <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors" title="กลับไปหน้ารายการ">
              <ArrowLeft size={24} />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800">
                {documentData.courseCode} - {documentData.courseName}
              </h2>
              <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-bold">
                {documentData.type}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              ภาคเรียนที่ {documentData.term} • รับผิดชอบโดย: {documentData.ownerName}
            </p>
          </div>
        </div>

        {/* ปุ่มจัดการเอกสาร */}
        <div className="flex gap-3 mt-4 md:mt-0">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
            <Printer size={18} className="mr-2" /> พิมพ์
          </button>
          <button className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
            <Download size={18} className="mr-2" /> ดาวน์โหลด PDF
          </button>
          
          {/* แสดงปุ่มแก้ไขเฉพาะเจ้าของเอกสาร */}
          {isOwner && (
            <Link to={`/documents/edit/${documentData.id}`}>
              <button className="flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium shadow-sm">
                <Edit size={18} className="mr-2" /> แก้ไขข้อมูล
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* 2. PDF Viewer Mockup Area */}
      <div className="flex-1 bg-gray-800 rounded-b-xl overflow-hidden flex flex-col relative shadow-inner">
        
        {/* PDF Toolbar (แถบเครื่องมือสีเทาเข้ม) */}
        <div className="bg-gray-900 text-gray-300 px-4 py-2 flex justify-between items-center text-sm border-b border-gray-700">
          <div className="flex items-center gap-4">
            <FileText size={16} />
            <span>หน้า 1 จาก 15</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-white transition-colors" title="ย่อ"><ZoomOut size={18} /></button>
            <span>100%</span>
            <button className="hover:text-white transition-colors" title="ขยาย"><ZoomIn size={18} /></button>
            <div className="w-px h-4 bg-gray-600 mx-2"></div>
            <button className="hover:text-white transition-colors" title="เต็มจอ"><Maximize size={18} /></button>
          </div>
        </div>

        {/* Paper Container (พื้นที่กระดาษ A4) */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* กระดาษ A4 สีขาว */}
          <div className="bg-white max-w-4xl mx-auto min-h-[1000px] shadow-2xl p-16 relative">
            
            {/* ตราสัญลักษณ์มหาลัย (จำลอง) */}
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-gray-300">
              <span className="text-gray-400 text-xs text-center">โลโก้<br/>มหาวิทยาลัย</span>
            </div>

            {/* เนื้อหาในกระดาษ (ดึงข้อมูลมาแสดง) */}
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">รายละเอียดของรายวิชา ({documentData.type})</h1>
              <h2 className="text-lg font-bold text-gray-800">ชื่อสถาบันอุดมศึกษา: มหาวิทยาลัย...</h2>
              <h2 className="text-lg font-bold text-gray-800">วิทยาเขต/คณะ/ภาควิชา: คณะ...</h2>
            </div>

            {/* หมวดที่ 1 */}
            <div className="space-y-6 text-gray-800">
              <h3 className="text-xl font-bold border-b-2 border-gray-800 pb-2">หมวดที่ 1 ข้อมูลทั่วไป</h3>
              
              <div className="space-y-4 text-base leading-relaxed">
                <p><span className="font-bold">1. รหัสและชื่อรายวิชา:</span> {documentData.courseCode} {documentData.courseName}</p>
                <p><span className="font-bold">2. จำนวนหน่วยกิต:</span> 3 (2-2-5)</p>
                <p><span className="font-bold">3. หลักสูตรและประเภทของรายวิชา:</span> วิชาเอกบังคับ</p>
                <p><span className="font-bold">4. อาจารย์ผู้รับผิดชอบรายวิชาและอาจารย์ผู้สอน:</span></p>
                <ul className="list-disc ml-8">
                  <li>{documentData.ownerName} (กลุ่มเรียน 01)</li>
                </ul>
                <p><span className="font-bold">5. ภาคการศึกษา / ชั้นปีที่เรียน:</span> ภาคเรียนที่ {documentData.term.split('/')[0]} ปีการศึกษา {documentData.term.split('/')[1]}</p>
                <p><span className="font-bold">6. รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite):</span> ไม่มี</p>
                <p><span className="font-bold">7. รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisites):</span> ไม่มี</p>
                <p><span className="font-bold">8. สถานที่เรียน:</span> ในสถานที่ตั้งของมหาวิทยาลัย</p>
                <p><span className="font-bold">9. วันที่จัดทำหรือปรับปรุงรายละเอียดของรายวิชาครั้งล่าสุด:</span> {documentData.lastUpdated}</p>
              </div>

              <h3 className="text-xl font-bold border-b-2 border-gray-800 pb-2 mt-10">หมวดที่ 2 จุดมุ่งหมายและวัตถุประสงค์</h3>
              <div className="space-y-4 text-base leading-relaxed">
                <p><span className="font-bold">1. จุดมุ่งหมายของรายวิชา:</span></p>
                <p className="indent-8 text-justify">
                  เพื่อให้นักศึกษามีความรู้ความเข้าใจเกี่ยวกับหลักการและกระบวนการวิศวกรรมซอฟต์แวร์ การรวบรวมความต้องการ การออกแบบซอฟต์แวร์ การทดสอบ และการบำรุงรักษาซอฟต์แวร์...
                </p>
              </div>
            </div>
            
            {/* ลายน้ำจำลอง (Optional) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-100 text-9xl font-bold opacity-30 pointer-events-none rotate-[-45deg] whitespace-nowrap">
              {documentData.status}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}