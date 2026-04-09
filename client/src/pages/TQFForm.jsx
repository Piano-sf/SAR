import React, { useState } from 'react';
import { Save, FileText, ChevronRight, ChevronLeft, MapPin, BookOpen, Plus, Calendar, Users, BarChart, Paperclip } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function TQFForm() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(1);
  const [tqfType, setTqfType] = useState('5'); // เปลี่ยนค่าเริ่มต้นให้มาดู มคอ.5 ได้เลย

  // --- [ส่วนที่เพิ่มใหม่: จัดการข้อมูลฟอร์ม] ---
  const [formData, setFormData] = useState({
    institute: 'มหาวิทยาลัยหอการค้าไทย',
    faculty: 'วิศวกรรมศาสตร์',
    courseCode: '',
    courseName: '',
    credits: '',
    lecturer: '',
    section: '',
    semester: '1',
    academicYear: '2567',
    location: 'ในสถานที่ตั้ง',
    // เก็บข้อมูลเกรด (มคอ. 5)
    grades: {
      'A': 0, 'B+': 0, 'B': 0, 'C+': 0, 'C': 0, 'D+': 0, 'D': 0, 'F': 0, 'W': 0
    },
    // หมวดอื่นๆ ที่เป็นเนื้อหาอิสระ
    sectionsContent: {}
  });

  const tabsTQF3 = [
    { id: 1, name: 'หมวดที่ 1 ข้อมูลทั่วไป' },
    { id: 2, name: 'หมวดที่ 2 จุดมุ่งหมาย' },
    { id: 3, name: 'หมวดที่ 3 การดำเนินการ' },
    { id: 4, name: 'หมวดที่ 4 การพัฒนาผลการเรียนรู้' },
    { id: 5, name: 'หมวดที่ 5 แผนการสอนและประเมินผล' },
    { id: 6, name: 'หมวดที่ 6 ทรัพยากร' },
    { id: 7, name: 'หมวดที่ 7 การประเมินและปรับปรุง' },
  ];

  const tabsTQF5 = [
    { id: 1, name: 'หมวดที่ 1 ข้อมูลทั่วไป' },
    { id: 2, name: 'หมวดที่ 2 การจัดการเรียนการสอน' },
    { id: 3, name: 'หมวดที่ 3 สรุปผลการจัดการเรียนการสอน' },
    { id: 4, name: 'หมวดที่ 4 ปัญหาและผลกระทบ' },
    { id: 5, name: 'หมวดที่ 5 การประเมินรายวิชา' },
    { id: 6, name: 'หมวดที่ 6 แผนการปรับปรุง' },
  ];

  const currentTabs = tqfType === '3' ? tabsTQF3 : tabsTQF5;

  const handleTypeChange = (e) => {
    setTqfType(e.target.value);
    setActiveTab(1);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const payload = {
      type: `TQF${tqfType}`,
      courseCode: formData.courseCode,
      courseName: formData.courseName,
      semester: parseInt(formData.semester),
      academicYear: formData.academicYear,
      content: formData, // บันทึก JSON ทั้งก้อน
      userId: 1 // ปรับตาม ID ของคุณ
    };
    try {
      const response = await fetch('http://localhost:3001/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert(`บันทึก มคอ. ${tqfType} สำเร็จ! ข้อมูลถูกเก็บลง Database แล้ว`);
        navigate('/documents');
      } else {
        alert("บันทึกไม่สำเร็จ ตรวจสอบการเชื่อมต่อ Backend");
      }
    } catch (error) {
      console.error("Save Error:", error);
      alert("ไม่สามารถเชื่อมต่อ Server ได้");
    }
  };

  // ข้อมูลสำหรับวนลูปฟอร์ม มคอ.3 หมวด 4
  const learningOutcomes = [
    { title: "1. คุณธรรม จริยธรรม", q1: "1.1 คุณธรรม จริยธรรมที่ต้องพัฒนา", q2: "1.2 วิธีการสอน", q3: "1.3 วิธีการประเมินผล" },
    { title: "2. ความรู้", q1: "2.1 ความรู้ที่ต้องได้รับ", q2: "2.2 วิธีการสอน", q3: "2.3 วิธีการประเมินผล" },
    { title: "3. ทักษะทางปัญญา", q1: "3.1 ทักษะทางปัญญาที่ต้องพัฒนา", q2: "3.2 วิธีการสอน", q3: "3.3 วิธีการประเมินผล" },
    { title: "4. ทักษะความสัมพันธ์ระหว่างบุคคลและความรับผิดชอบ", q1: "4.1 ทักษะความสัมพันธ์ฯ ที่ต้องพัฒนา", q2: "4.2 วิธีการสอน", q3: "4.3 วิธีการประเมินผล" },
    { title: "5. ทักษะการวิเคราะห์เชิงตัวเลข การสื่อสาร และการใช้ไอที", q1: "5.1 ทักษะการวิเคราะห์ฯ ที่ต้องพัฒนา", q2: "5.2 วิธีการสอน", q3: "5.3 วิธีการประเมินผล" },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={28} className="text-blue-600" />แบบฟอร์มบันทึก มคอ.
          </h2>
          <p className="text-gray-500 mt-1">กรอกรายละเอียดรายวิชา หรือ รายงานผลการดำเนินการ</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-100">
          <label className="font-medium text-gray-700 ml-2">ประเภทเอกสาร:</label>
          <select value={tqfType} onChange={handleTypeChange} className="bg-blue-50 text-blue-700 font-bold px-4 py-2 rounded-md outline-none focus:ring-2 focus:ring-blue-500">
            <option value="3">มคอ. 3 (รายละเอียดรายวิชา)</option>
            <option value="5">มคอ. 5 (รายงานผลการดำเนินการ)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Tabs Navigation */}
        <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 scrollbar-hide">
          {currentTabs.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-6 py-4 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>
              {tab.name}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="p-8">
          <form id="tqf-form" onSubmit={handleSave} className="space-y-6">
            
            {/* ==================== หมวดที่ 1 ข้อมูลทั่วไป (ใช้ร่วมกัน) ==================== */}
            {activeTab === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 1 ข้อมูลทั่วไป</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">ชื่อสถาบันอุดมศึกษา</label><input type="text" className="w-full px-4 py-2 border rounded-lg bg-white" placeholder="มหาวิทยาลัย..." /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">วิทยาเขต/คณะ/ภาควิชา</label><input type="text" className="w-full px-4 py-2 border rounded-lg bg-white" placeholder="คณะ..." /></div>
                  </div>

                  <div><label className="block text-sm font-medium text-gray-700 mb-2">รหัสวิชา</label><input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="เช่น CS301" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">ชื่อรายวิชา (ไทย/อังกฤษ)</label><input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="เช่น วิศวกรรมซอฟต์แวร์" /></div>
                  
                  {tqfType === '3' && (
                    <>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">จำนวนหน่วยกิต</label><input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="เช่น 3 (2-2-5)" /></div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">หลักสูตรและประเภทของรายวิชา</label>
                        <select className="w-full px-4 py-2 border rounded-lg"><option>วิชาเอกบังคับ</option><option>วิชาเลือกเสรี</option><option>วิชาศึกษาทั่วไป</option></select>
                      </div>
                    </>
                  )}

                  <div><label className="block text-sm font-medium text-gray-700 mb-2">อาจารย์ผู้รับผิดชอบ / อาจารย์ผู้สอน</label><input type="text" className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">กลุ่มเรียน (Section)</label><input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="เช่น 01, 02" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">ภาคการศึกษา / ปีการศึกษาที่เปิดสอน</label><input type="text" className="w-full px-4 py-2 border rounded-lg" placeholder="เช่น 1 / 2567" /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-2">สถานที่เรียน</label><div className="relative"><MapPin className="absolute left-3 top-2.5 text-gray-400" size={20} /><input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg" defaultValue="ในสถานที่ตั้ง" /></div></div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">รายวิชาที่ต้องเรียนมาก่อน (Pre-requisite) (ถ้ามี)</label>
                      <div className="relative"><BookOpen className="absolute left-3 top-2.5 text-gray-400" size={20} /><input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white" placeholder="รหัสวิชา..." /></div>
                    </div>
                    {tqfType === '3' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">รายวิชาที่ต้องเรียนพร้อมกัน (Co-requisites) (ถ้ามี)</label>
                        <div className="relative"><BookOpen className="absolute left-3 top-2.5 text-gray-400" size={20} /><input type="text" className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white" placeholder="รหัสวิชา..." /></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* โซน มคอ. 3 (หมวด 2-7)                                                     */}
            {/* ========================================================================= */}
            {tqfType === '3' && activeTab === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 2 จุดมุ่งหมายและวัตถุประสงค์</h3>
                <div><label className="block font-medium text-gray-700 mb-2">1. จุดมุ่งหมายของรายวิชา</label><textarea className="w-full p-4 border rounded-lg h-32"></textarea></div>
                <div><label className="block font-medium text-gray-700 mb-2">2. วัตถุประสงค์ในการพัฒนา/ปรับปรุงรายวิชา</label><textarea className="w-full p-4 border rounded-lg h-32"></textarea></div>
              </div>
            )}

            {tqfType === '3' && activeTab === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 3 ลักษณะและการดำเนินการ</h3>
                <div><label className="block font-medium text-gray-700 mb-2">1. คำอธิบายรายวิชา</label><textarea className="w-full p-4 border rounded-lg h-32"></textarea></div>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <label className="block font-medium text-gray-700 mb-4">2. จำนวนชั่วโมงที่ใช้ต่อภาคการศึกษา</label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div><label className="text-sm text-gray-600">บรรยาย (ชม.)</label><input type="number" className="w-full px-4 py-2 border rounded-lg mt-1" /></div>
                    <div><label className="text-sm text-gray-600">สอนเสริม (ชม.)</label><input type="number" className="w-full px-4 py-2 border rounded-lg mt-1" /></div>
                    <div><label className="text-sm text-gray-600">ภาคปฏิบัติ/ภาคสนาม (ชม.)</label><input type="number" className="w-full px-4 py-2 border rounded-lg mt-1" /></div>
                    <div><label className="text-sm text-gray-600">การศึกษาด้วยตนเอง (ชม.)</label><input type="number" className="w-full px-4 py-2 border rounded-lg mt-1" /></div>
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">3. จำนวนชั่วโมงต่อสัปดาห์ที่อาจารย์ให้คำปรึกษาและแนะนำทางวิชาการแก่นักศึกษาเป็นรายบุคคล</label>
                  <div className="flex items-center gap-3"><input type="number" className="w-32 px-4 py-2 border rounded-lg" /><span className="text-gray-600">ชั่วโมง / สัปดาห์</span></div>
                </div>
              </div>
            )}

            {tqfType === '3' && activeTab === 4 && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 4 การพัฒนาผลการเรียนรู้ของนักศึกษา</h3>
                {learningOutcomes.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-blue-50 px-6 py-3 border-b border-gray-200"><h4 className="font-bold text-blue-800">{item.title}</h4></div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">{item.q1}</label><textarea className="w-full p-3 border rounded-lg h-24 text-sm"></textarea></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">{item.q2}</label><textarea className="w-full p-3 border rounded-lg h-24 text-sm"></textarea></div>
                      <div><label className="block text-sm font-medium text-gray-700 mb-2">{item.q3}</label><textarea className="w-full p-3 border rounded-lg h-24 text-sm"></textarea></div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tqfType === '3' && activeTab === 5 && (
              <div className="space-y-10 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 5 แผนการสอนและการประเมินผล</h3>
                <div>
                  <label className="font-bold text-gray-800 mb-4 block">1. แผนการสอน</label>
                  <table className="w-full text-sm text-left border"><thead className="bg-gray-50 border-b"><tr><th className="p-3 w-20">สัปดาห์</th><th className="p-3">หัวข้อ/รายละเอียด</th><th className="p-3 w-24">จำนวน(ชม.)</th><th className="p-3">กิจกรรมการเรียนการสอน/สื่อที่ใช้</th><th className="p-3 w-40">ผู้สอน</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="number" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                </div>
                <div>
                  <label className="font-bold text-gray-800 mb-4 block">2. แผนการประเมินผลการเรียนรู้</label>
                  <table className="w-full text-sm text-left border"><thead className="bg-gray-50 border-b"><tr><th className="p-3">กิจกรรมที่</th><th className="p-3">ผลการเรียนรู้*</th><th className="p-3">วิธีการประเมิน</th><th className="p-3 w-32">สัปดาห์ที่</th><th className="p-3 w-32">สัดส่วน (%)</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="number" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                </div>
              </div>
            )}

            {tqfType === '3' && activeTab === 6 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 6 ทรัพยากรประกอบการเรียนการสอน</h3>
                <div><label className="block font-medium text-gray-700 mb-2">1. ตำราและเอกสาร</label><textarea className="w-full p-4 border rounded-lg h-24"></textarea></div>
                <div><label className="block font-medium text-gray-700 mb-2">2. งานวิจัยที่ใช้ในการเรียนการสอน</label><textarea className="w-full p-4 border rounded-lg h-24"></textarea></div>
                <div><label className="block font-medium text-gray-700 mb-2">3. เอกสารและข้อมูลแนะนำ</label><textarea className="w-full p-4 border rounded-lg h-24"></textarea></div>
              </div>
            )}

            {tqfType === '3' && activeTab === 7 && (
              <div className="space-y-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 7 การประเมินและปรับปรุงการดำเนินการของรายวิชา</h3>
                {["1. กลยุทธ์การประเมินประสิทธิผลของรายวิชาโดยนักศึกษา", "2. กลยุทธ์การประเมินการสอน", "3. การปรับปรุงการสอน", "4. การทวนสอบมาตรฐานผลสัมฤทธิ์ของนักศึกษาในรายวิชา", "5. การดำเนินการทบทวนและการวางแผนปรับปรุงประสิทธิผลของรายวิชา"].map((title, idx) => (
                  <div key={idx}><label className="block font-medium text-gray-700 mb-2">{title}</label><textarea className="w-full p-3 border rounded-lg h-24"></textarea></div>
                ))}
              </div>
            )}


            {/* ========================================================================= */}
            {/* โซน มคอ. 5 (หมวด 2-6) จัดเต็มตามแบบฟอร์มเป๊ะ!                              */}
            {/* ========================================================================= */}

            {tqfType === '5' && activeTab === 2 && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 2 การจัดการเรียนการสอนเปรียบเทียบกับแผนการสอน</h3>
                
                <div>
                  <label className="block font-medium text-gray-700 mb-4">1. รายงานชั่วโมงการสอนจริงเทียบกับแผนการสอน</label>
                  <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">หัวข้อ</th><th className="p-3 w-24 text-center">ชม. ตามแผน</th><th className="p-3 w-24 text-center">ชม. ที่สอนจริง</th><th className="p-3">ระบุสาเหตุ (ถ้าต่างเกิน 25%)</th></tr></thead><tbody>
                    <tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="number" className="w-full p-2 border rounded text-center" /></td><td className="p-2"><input type="number" className="w-full p-2 border rounded text-center" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr>
                  </tbody></table><button type="button" className="text-blue-600 text-sm mt-2 flex items-center"><Plus size={16}/> เพิ่มแถว</button>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-4">2. หัวข้อที่สอนไม่ครอบคลุมตามแผน (ถ้ามี)</label>
                  <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">หัวข้อที่สอนไม่ครอบคลุมตามแผน (ถ้ามี)</th><th className="p-3">นัยสำคัญของหัวข้อที่สอนไม่ครอบคลุมตามแผน</th><th className="p-3">แนวทางชดเชย</th></tr></thead><tbody>
                    <tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr>
                  </tbody></table><button type="button" className="text-blue-600 text-sm mt-2 flex items-center"><Plus size={16}/> เพิ่มแถว</button>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-4">3. ประสิทธิผลของวิธีสอนที่ทำให้เกิดผลการเรียนรู้ตามที่ระบุในรายละเอียดของรายวิชา</label>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3 min-w-[150px]">ผลการเรียนรู้</th><th className="p-3 min-w-[150px]">วิธีสอนที่ระบุในรายละเอียดรายวิชา</th><th className="p-3 w-32 text-center">ประสิทธิผล<br/><span className="text-xs font-normal">มี / ไม่มี</span></th><th className="p-3 min-w-[150px]">ปัญหาของการใช้วิธีสอน (ถ้ามี)</th><th className="p-3 min-w-[150px]">ข้อเสนอแนะในการแก้ไข</th></tr></thead><tbody>
                      <tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2 text-center space-x-2"><input type="radio" name="eff1"/><span>มี</span><input type="radio" name="eff1"/><span>ไม่มี</span></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr>
                    </tbody></table><button type="button" className="text-blue-600 text-sm mt-2 flex items-center"><Plus size={16}/> เพิ่มแถว</button>
                  </div>
                </div>

                <div><label className="block font-medium text-gray-700 mb-2">4. ข้อเสนอการดำเนินการเพื่อปรับปรุงวิธีสอน</label><textarea className="w-full p-3 border rounded-lg h-24" placeholder="อธิบายข้อเสนอแนะ..."></textarea></div>
              </div>
            )}

            {tqfType === '5' && activeTab === 3 && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 3 สรุปผลการจัดการเรียนการสอนของรายวิชา</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-blue-50 p-6 rounded-xl border border-blue-100">
                  <div><label className="block text-sm font-medium text-blue-900 mb-2">1. จำนวนนักศึกษาที่ลงทะเบียนเรียน</label><input type="number" className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-blue-900 mb-2">2. จำนวนนักศึกษาที่คงอยู่เมื่อสิ้นสุดภาค</label><input type="number" className="w-full px-4 py-2 border rounded-lg" /></div>
                  <div><label className="block text-sm font-medium text-blue-900 mb-2">3. จำนวนนักศึกษาที่ถอน (W)</label><input type="number" className="w-full px-4 py-2 border rounded-lg" /></div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-4 flex items-center"><BarChart size={20} className="mr-2"/> 4. การกระจายของระดับคะแนน (เกรด)</label>
                  <table className="w-full text-sm text-center border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">เกรด</th><th className="p-3">ช่วงเกรด MANUAL</th><th className="p-3">รวม (คน)</th><th className="p-3">% ทุกเกรด</th><th className="p-3">% A - F</th></tr></thead><tbody>
                    {['A', 'B+', 'B', 'C+', 'C', 'D+', 'D', 'F', 'S', 'U', 'I', 'W'].map((grade) => (
                      <tr key={grade} className="border-b"><td className="p-2 font-bold">{grade}</td><td className="p-2"><input type="text" className="w-full p-1 border rounded text-center" /></td><td className="p-2"><input type="number" className="w-full p-1 border rounded text-center" /></td><td className="p-2"><input type="number" className="w-full p-1 border rounded text-center" /></td><td className="p-2"><input type="number" className="w-full p-1 border rounded text-center" /></td></tr>
                    ))}
                  </tbody></table>
                </div>

                <div><label className="block font-medium text-gray-700 mb-2">5. ปัจจัยที่ทำให้ระดับคะแนนผิดปกติ (ถ้ามี)</label><textarea className="w-full p-3 border rounded-lg h-24"></textarea></div>

                <div>
                  <label className="block font-medium text-gray-700 mb-4">6. ความคลาดเคลื่อนจากแผนการประเมินที่กำหนดไว้ในรายละเอียดรายวิชา</label>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">6.1 ความคลาดเคลื่อนด้านกำหนดเวลาการประเมิน</label>
                      <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">ความคลาดเคลื่อน</th><th className="p-3">เหตุผล</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">6.2 ความคลาดเคลื่อนด้านวิธีการประเมินผลการเรียนรู้</label>
                      <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">ความคลาดเคลื่อน</th><th className="p-3">เหตุผล</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-4">7. การทวนสอบผลสัมฤทธิ์ของนักศึกษา</label>
                  <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">วิธีการทวนสอบ</th><th className="p-3">สรุปผล</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                </div>
              </div>
            )}

            {tqfType === '5' && activeTab === 4 && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 4 ปัญหาและผลกระทบต่อการดำเนินการ</h3>
                <div>
                  <label className="block font-medium text-gray-700 mb-4">1. ประเด็นด้านทรัพยากรประกอบการเรียนและสิ่งอำนวยความสะดวก</label>
                  <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">ปัญหาในการใช้แหล่งทรัพยากรประกอบการเรียนการสอน (ถ้ามี)</th><th className="p-3">ผลกระทบ</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-4">2. ประเด็นด้านการบริหารและองค์กร</label>
                  <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">ปัญหาด้านการบริหารและองค์กร (ถ้ามี)</th><th className="p-3">ผลกระทบต่อผลการเรียนรู้ของนักศึกษา</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                </div>
              </div>
            )}

            {tqfType === '5' && activeTab === 5 && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 5 การประเมินรายวิชา</h3>
                
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <label className="font-bold text-gray-800 text-base">1. ผลการประเมินรายวิชาโดยนักศึกษา</label>
                    <label className="flex items-center text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100"><Paperclip size={16} className="mr-1"/> แนบเอกสารผลการประเมิน<input type="file" className="hidden" /></label>
                  </div>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">1.1 ข้อวิพากษ์ที่สำคัญจากผลการประเมินโดยนักศึกษา</label><textarea className="w-full p-3 border rounded-lg h-24 bg-white"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">1.2 ความเห็นของอาจารย์ผู้สอนต่อผลการประเมินตามข้อ 1.1</label><textarea className="w-full p-3 border rounded-lg h-24 bg-white"></textarea></div>
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <label className="font-bold text-gray-800 text-base mb-4 block">2. ผลการประเมินรายวิชาโดยวิธีอื่น</label>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">2.1 ข้อวิพากษ์ที่สำคัญจากผลการประเมินโดยวิธีอื่น</label><textarea className="w-full p-3 border rounded-lg h-24 bg-white"></textarea></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-2">2.2 ความเห็นของอาจารย์ผู้สอนต่อผลการประเมินตามข้อ 2.1</label><textarea className="w-full p-3 border rounded-lg h-24 bg-white"></textarea></div>
                  </div>
                </div>
              </div>
            )}

            {tqfType === '5' && activeTab === 6 && (
              <div className="space-y-8 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">หมวดที่ 6 แผนการปรับปรุง</h3>
                <div>
                  <label className="block font-medium text-gray-700 mb-4">1. ความก้าวหน้าของการปรับปรุงการเรียนการสอนตามที่เสนอในรายงาน/รายวิชาครั้งที่ผ่านมา</label>
                  <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">แผนการปรับปรุงที่เสนอในภาคการศึกษา/ปีการศึกษาที่ผ่านมา</th><th className="p-3">ผลการดำเนินการ</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                </div>
                <div><label className="block font-medium text-gray-700 mb-2">2. การดำเนินการอื่นๆ ในการปรับปรุงรายวิชา</label><textarea className="w-full p-3 border rounded-lg h-24"></textarea></div>
                <div>
                  <label className="block font-medium text-gray-700 mb-4">3. ข้อเสนอแผนการปรับปรุงสำหรับภาคการศึกษา/ปีการศึกษาต่อไป</label>
                  <table className="w-full text-sm text-left border bg-white"><thead className="bg-gray-50 border-b"><tr><th className="p-3">ข้อเสนอ</th><th className="p-3 w-40">กำหนดเวลาที่แล้วเสร็จ</th><th className="p-3 w-40">ผู้รับผิดชอบ</th></tr></thead><tbody><tr className="border-b"><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="date" className="w-full p-2 border rounded" /></td><td className="p-2"><input type="text" className="w-full p-2 border rounded" /></td></tr></tbody></table>
                </div>
                <div><label className="block font-medium text-gray-700 mb-2">4. ข้อเสนอแนะของอาจารย์ผู้รับผิดชอบรายวิชา ต่ออาจารย์ผู้รับผิดชอบหลักสูตร</label><textarea className="w-full p-3 border rounded-lg h-24"></textarea></div>

                {/* ส่วนลายเซ็น */}
                <div className="mt-12 space-y-8 p-8 border-2 border-gray-100 rounded-xl bg-gray-50">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <p className="font-medium text-gray-700 mb-4">ชื่ออาจารย์ผู้รับผิดชอบรายวิชา</p>
                        <div className="space-y-4">
                          <div className="flex items-end"><span className="mr-2">ลงชื่อ</span><input type="text" className="flex-1 border-b border-gray-400 bg-transparent focus:outline-none px-2" placeholder="ลายเซ็น / พิมพ์ชื่อ" /></div>
                          <div className="flex items-end"><span className="mr-2">วันที่รายงาน</span><input type="date" className="flex-1 border-b border-gray-400 bg-transparent focus:outline-none px-2" /></div>
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700 mb-4">ชื่ออาจารย์ผู้รับผิดชอบหลักสูตร</p>
                        <div className="space-y-4">
                          <div className="flex items-end"><span className="mr-2">ลงชื่อ</span><input type="text" className="flex-1 border-b border-gray-400 bg-transparent focus:outline-none px-2" placeholder="ลายเซ็น / พิมพ์ชื่อ" /></div>
                          <div className="flex items-end"><span className="mr-2">วันที่รับรายงาน</span><input type="date" className="flex-1 border-b border-gray-400 bg-transparent focus:outline-none px-2" /></div>
                        </div>
                      </div>
                   </div>
                </div>

              </div>
            )}

          </form>
        </div>

        {/* ==================== Footer Buttons ==================== */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
          <button type="button" onClick={() => setActiveTab(Math.max(1, activeTab - 1))} disabled={activeTab === 1} className="px-4 py-2 flex items-center text-gray-600 hover:bg-gray-200 rounded-lg disabled:opacity-50 transition-colors">
            <ChevronLeft size={20} className="mr-1" /> ย้อนกลับ
          </button>
          <div className="flex gap-3">
            <Link to="/documents"><button type="button" className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">ยกเลิก</button></Link>
            {activeTab < currentTabs.length ? (
               <button type="button" onClick={() => setActiveTab(activeTab + 1)} className="px-6 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center transition-colors">
                ถัดไป <ChevronRight size={20} className="ml-1" />
              </button>
            ) : (
              <button form="tqf-form" type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center transition-colors shadow-sm">
                <Save size={20} className="mr-2" /> บันทึกเอกสาร
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}