import React, { useState } from 'react';
import { Save, Calendar, Clock, AlertCircle, FileText, BookOpen } from 'lucide-react';

export default function DeadlineSettings() {
  const [loading, setLoading] = useState(false);

  // 1. เพิ่ม academicWorkDeadline เข้าไปใน State
  const [formData, setFormData] = useState({
    academicYear: '2567',
    semester: '1',
    tqf3Deadline: '2024-07-31', 
    tqf5Deadline: '2024-12-15', 
    academicWorkDeadline: '2024-12-20', // เพิ่มกำหนดส่งผลงานวิชาการ
  });

  // 2. เพิ่มข้อมูลผลงานวิชาการในประวัติจำลอง
  const [history, setHistory] = useState([
    { year: '2566', term: '2', tqf3: '2023-11-15', tqf5: '2024-04-15', academicWork: '2024-04-30', status: 'ปิดแล้ว' },
    { year: '2566', term: '1', tqf3: '2023-07-31', tqf5: '2023-12-15', academicWork: '2023-12-30', status: 'ปิดแล้ว' },
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      alert(`บันทึกกำหนดส่งเอกสาร ภาคเรียนที่ ${formData.semester}/${formData.academicYear} เรียบร้อยแล้ว`);

      // 3. เพิ่ม academicWork เข้าไปในก้อนข้อมูลประวัติใหม่
      const newHistoryItem = {
        year: formData.academicYear,
        term: formData.semester,
        tqf3: formData.tqf3Deadline,
        tqf5: formData.tqf5Deadline,
        academicWork: formData.academicWorkDeadline,
        status: 'กำลังใช้งาน',
      };

      setHistory([newHistoryItem, ...history]);
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={28} className="text-blue-600" />
            ตั้งค่ากำหนดส่งเอกสารและผลงาน
          </h2>
          <p className="text-gray-500 mt-1">กำหนดวันเดดไลน์สำหรับ มคอ. และผลงานวิชาการในแต่ละภาคการศึกษา</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* กล่องตั้งค่าเทอมปัจจุบัน */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-50/50 p-6 border-b border-gray-100 flex items-center justify-between">
               <h3 className="font-bold text-gray-800 text-lg">เปิดรอบส่งเอกสารใหม่</h3>
               <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center">
                  กำลังใช้งาน (Active)
               </span>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ปีการศึกษา</label>
                  <input type="text" name="academicYear" value={formData.academicYear} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เช่น 2567" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ภาคการศึกษา</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                    <option value="1">ภาคเรียนที่ 1</option>
                    <option value="2">ภาคเรียนที่ 2</option>
                    <option value="3">ภาคฤดูร้อน (Summer)</option>
                  </select>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* ปรับ Grid เป็น 3 คอลัมน์ สำหรับ 3 หมวด */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* วันส่ง มคอ. 3 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center text-sm">
                    <FileText size={16} className="mr-2 text-blue-600"/> กำหนดส่ง มคอ. 3
                  </h4>
                  <label className="block text-xs font-medium text-gray-600 mb-2">ก่อนเปิดภาคเรียน</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="date" name="tqf3Deadline" value={formData.tqf3Deadline} onChange={handleChange} className="w-full pl-9 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                </div>

                {/* วันส่ง มคอ. 5 */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center text-sm">
                    <FileText size={16} className="mr-2 text-green-600"/> กำหนดส่ง มคอ. 5
                  </h4>
                  <label className="block text-xs font-medium text-gray-600 mb-2">หลังสิ้นสุดภาคเรียน</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="date" name="tqf5Deadline" value={formData.tqf5Deadline} onChange={handleChange} className="w-full pl-9 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" required />
                  </div>
                </div>

                {/* วันส่ง ผลงานวิชาการ (เพิ่มใหม่) */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center text-sm">
                    <BookOpen size={16} className="mr-2 text-purple-600"/> ผลงานวิชาการ
                  </h4>
                  <label className="block text-xs font-medium text-gray-600 mb-2">วันสุดท้ายของการรับผลงาน</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input type="date" name="academicWorkDeadline" value={formData.academicWorkDeadline} onChange={handleChange} className="w-full pl-9 pr-2 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" required />
                  </div>
                </div>

              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-start mt-2">
                 <AlertCircle size={16} className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                 <p className="text-xs text-blue-800">
                   ระบบจะส่งการแจ้งเตือนอัตโนมัติไปยังอาจารย์เมื่อเหลือเวลา <span className="font-bold text-red-600">7 วัน, 3 วัน, 1 วัน และในวันสุดท้าย</span> ของกำหนดส่งแต่ละประเภทเอกสาร
                 </p>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm flex items-center disabled:opacity-70 transition-colors">
                  {loading ? 'กำลังบันทึก...' : <><Save size={20} className="mr-2" /> บันทึกและเปิดใช้งาน</>}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ประวัติการตั้งค่า */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="p-4 border-b border-gray-100 flex justify-between items-center">
               <h3 className="font-bold text-gray-800">ประวัติการตั้งค่า</h3>
             </div>
             <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
               {history.map((item, idx) => (
                 <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                   <div className="flex justify-between items-center mb-3">
                     <span className="font-bold text-gray-800">เทอม {item.term}/{item.year}</span>
                     <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                        item.status === 'กำลังใช้งาน' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                     }`}>
                        {item.status}
                     </span>
                   </div>
                   <div className="text-sm text-gray-600 space-y-1.5 bg-white border border-gray-100 p-3 rounded-lg">
                     <p className="flex justify-between"><span>มคอ.3:</span> <span className="font-medium">{item.tqf3}</span></p>
                     <p className="flex justify-between"><span>มคอ.5:</span> <span className="font-medium">{item.tqf5}</span></p>
                     <p className="flex justify-between"><span>ผลงานวิชาการ:</span> <span className="font-medium">{item.academicWork}</span></p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}