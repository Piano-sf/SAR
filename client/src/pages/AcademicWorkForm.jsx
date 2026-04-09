import React, { useState } from 'react';
import { Save, X, BookOpen, User, Award, Globe, Paperclip, Calculator } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AcademicWorkForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. ข้อมูลระดับคุณภาพผลงาน และ ค่าน้ำหนัก
  const qualityLevels = [
    { id: '', label: '-- กรุณาเลือกระดับคุณภาพผลงาน --', weight: '' },
    { id: 'NONE_00', label: '[0.00] ไม่นับผลงาน', weight: '0.00' },
    
    // กลุ่ม 0.20
    { id: 'CONF_NAT_02', label: '[0.20] บทความวิจัย/วิชาการ ตีพิมพ์ในรายงานประชุมวิชาการระดับชาติ', weight: '0.20' },
    { id: 'CREATIVE_PUB_02', label: '[0.20] งานสร้างสรรค์ที่เผยแพร่สู่สาธารณะ หรือผ่านสื่อ online', weight: '0.20' },
    
    // กลุ่ม 0.40
    { id: 'CONF_INT_04', label: '[0.40] บทความวิจัยตีพิมพ์ในการประชุมนานาชาติ หรือวารสารชาติไม่อยู่ในฐานข้อมูล', weight: '0.40' },
    { id: 'PETTY_PATENT_04', label: '[0.40] ผลงานได้รับการจดอนุสิทธิบัตร', weight: '0.40' },
    { id: 'CREATIVE_INST_04', label: '[0.40] งานสร้างสรรค์ที่ได้รับการเผยแพร่ในระดับสถาบัน', weight: '0.40' },
    
    // กลุ่ม 0.60
    { id: 'TCI_2_06', label: '[0.60] บทความวิจัย/วิชาการ ตีพิมพ์ในวารสารฐานข้อมูล TCI กลุ่มที่ 2', weight: '0.60' },
    { id: 'CREATIVE_NAT_06', label: '[0.60] งานสร้างสรรค์ที่ได้รับการเผยแพร่ในระดับชาติ', weight: '0.60' },
    
    // กลุ่ม 0.80
    { id: 'TCI_1_08', label: '[0.80] บทความวิจัยตีพิมพ์ในวารสารนานาชาติไม่อยู่ในฐานข้อมูล หรือ TCI กลุ่มที่ 1', weight: '0.80' },
    { id: 'CREATIVE_INT_COL_08', label: '[0.80] งานสร้างสรรค์ที่ได้รับการเผยแพร่ในระดับความร่วมมือระหว่างประเทศ', weight: '0.80' },
    
    // กลุ่ม 1.00
    { id: 'INT_JOURNAL_10', label: '[1.00] บทความวิจัยตีพิมพ์ในวารสารระดับนานาชาติตามประกาศ ก.พ.อ.', weight: '1.00' },
    { id: 'PATENT_10', label: '[1.00] ผลงานได้รับการจดสิทธิบัตร', weight: '1.00' },
    { id: 'SOCIAL_SERV_10', label: '[1.00] ผลงานวิชาการรับใช้สังคมที่ผ่านการประเมินตำแหน่งทางวิชาการแล้ว', weight: '1.00' },
    { id: 'NAT_RESEARCH_10', label: '[1.00] ผลงานวิจัยที่หน่วยงานหรือองค์กรระดับชาติว่าจ้างให้ดำเนินการ', weight: '1.00' },
    { id: 'NEW_SPECIES_10', label: '[1.00] ผลงานค้นพบพันธุ์พืช พันธุ์สัตว์ใหม่ และได้รับการจดทะเบียน', weight: '1.00' },
    { id: 'BOOK_EVAL_10', label: '[1.00] ตำราหรือหนังสือที่ผ่านการประเมินตำแหน่งทางวิชาการแล้ว', weight: '1.00' },
    { id: 'BOOK_UNEVAL_10', label: '[1.00] ตำรา/หนังสือที่ผ่านการพิจารณาแต่ไม่ได้นำมาขอรับการประเมินตำแหน่ง', weight: '1.00' },
    { id: 'CREATIVE_INT_10', label: '[1.00] งานสร้างสรรค์ที่ได้รับการเผยแพร่ในระดับภูมิภาคอาเซียน/นานาชาติ', weight: '1.00' },
  ];

  // 2. State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    lecturerName: '',
    qualityLevel: '',
    title: '',
    publisher: '',
    weight: '', // ค่าน้ำหนัก
  });

  // 3. ฟังก์ชันจัดการเมื่อพิมพ์ หรือเลือก Dropdown
  const handleChange = (e) => {
    const { name, value } = e.target;

    // ถ้าเปลี่ยน dropdown "ระดับคุณภาพ" ให้หา "ค่าน้ำหนัก" มาใส่ให้อัตโนมัติ
    if (name === 'qualityLevel') {
      const selectedLevel = qualityLevels.find(level => level.id === value);
      setFormData({
        ...formData,
        qualityLevel: value,
        weight: selectedLevel ? selectedLevel.weight : ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // จำลองการบันทึก
    setTimeout(() => {
      setLoading(false);
      alert('บันทึกผลงานเรียบร้อยแล้ว');
      navigate('/academic-works');
    }, 1500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">เพิ่มผลงานทางวิชาการ</h2>
        <p className="text-gray-500">บันทึกข้อมูลผลงานวิจัยและบทความวิชาการของอาจารย์</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
        
        {/* 1. ชื่อ-นามสกุลอาจารย์ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อ-นามสกุล (อาจารย์เจ้าของผลงาน)</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              name="lecturerName"
              type="text" 
              required
              value={formData.lecturerName}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="เช่น ผศ.ดร.สมชาย ใจดี"
            />
          </div>
        </div>

        {/* 2. ชื่อผลงาน */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อผลงานวิชาการ</label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              name="title"
              type="text" 
              required
              value={formData.title}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="ระบุชื่อผลงานวิจัย หรือบทความ..."
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
          {/* 3. ระดับคุณภาพผลงานทางวิชาการ (Dropdown) */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">ระดับคุณภาพผลงานทางวิชาการ</label>
            <div className="relative">
              <Award className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <select 
                name="qualityLevel"
                required
                value={formData.qualityLevel}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white appearance-none"
              >
                {qualityLevels.map((level) => (
                  <option key={level.id} value={level.id} disabled={level.id === ''}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. ค่าน้ำหนัก (Auto-fill & Readonly) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ค่าน้ำหนัก</label>
            <div className="relative">
              <Calculator className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                type="text" 
                readOnly
                value={formData.weight}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 bg-gray-100 text-gray-600 rounded-lg font-semibold outline-none cursor-not-allowed"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">* ระบบคำนวณจากระดับคุณภาพ</p>
          </div>
        </div>

        {/* 5. แหล่งเผยแพร่ / ตีพิมพ์ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">แหล่งเผยแพร่ / ตีพิมพ์</label>
          <div className="relative">
            <Globe className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input 
              name="publisher"
              type="text" 
              required
              value={formData.publisher}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="ระบุชื่อวารสาร หรือชื่องานประชุมวิชาการ..."
            />
          </div>
        </div>

        {/* 6. เอกสารแนบ (Attachment) */}
        <div>
           <label className="block text-sm font-medium text-gray-700 mb-2">เอกสารแนบ (หลักฐานการตีพิมพ์ / Full Paper)</label>
           <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Paperclip size={24} />
              </div>
              <p className="text-sm font-medium text-gray-700">คลิกเพื่ออัปโหลดไฟล์ หรือลากไฟล์มาวางที่นี่</p>
              <p className="text-xs text-gray-400 mt-1">รองรับไฟล์ PDF, JPG, PNG (ขนาดไม่เกิน 10MB)</p>
           </div>
        </div>

        <hr className="border-gray-100 my-6" />

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Link to="/academic-works">
            <button type="button" className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 flex items-center transition-colors">
              <X size={20} className="mr-2" /> ยกเลิก
            </button>
          </Link>
          <button 
            type="submit" 
            disabled={loading || !formData.qualityLevel}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'กำลังบันทึก...' : (
              <>
                <Save size={20} className="mr-2" /> บันทึกข้อมูล
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}