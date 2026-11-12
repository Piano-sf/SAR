import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, FileText, ArrowLeft, Trash2, Loader2, Filter, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/useUserStore';
import { label } from 'framer-motion/client';

// กำหนด Type ให้ข้อมูล
interface AcademicWork {
  id: string;
  title: string;
  work_type: string;
  publication_year: number;
  status: string;
  created_at: string;
  file_url?: string;
  weight?: number;
}

  const WORK_TYPES = [
    { label: "[0.00] ไม่นับผลงาน", value: "Excluding works", weight: 0.00 },
    { label: "[0.20] บทความวิจัย/วิชาการ ตีพิมพ์ในรายงานประชุมวิชาการระดับชาติ", value: "National Conference", weight: 0.20 },
    { label: "[0.20] งานสร้างสรรค์ที่เผยแพร่สู่สาธารณะ หรือผ่านสื่อ online", value: "Creative Work Online", weight: 0.20 },
    { label: "[0.40] บทความวิจัยตีพิมพ์ในการประชุมนานาชาติ หรือวารสารชาติไม่อยู่ในฐานข้อมูล", value: "International Conference", weight: 0.40 },
    { label: "[0.40] ผลงานได้รับการจดอนุสิทธิบัตร", value: "Petty Patent", weight: 0.40 },
    { label: "[0.40] งานสร้างสรรค์ที่ได้รับการเผยแพร่ในระดับสถาบัน", value: "Creative Work Institutional", weight: 0.40 },
    { label: "[0.60] บทความวิจัย/วิชาการ ตีพิมพ์ในวารสารฐานข้อมูล TCI กลุ่มที่ 2", value: "TCI Group 2", weight: 0.60 },
    { label: "[0.60] งานสร้างสรรค์ที่ได้รับการเผยแพร่ในระดับชาติ", value: "Creative Work National", weight: 0.60 },
    { label: "[0.80] บทความวิจัยตีพิมพ์ในวารสารนานาชาติไม่อยู่ในฐานข้อมูล หรือ TCI กลุ่มที่ 1", value: "TCI Group 1 / International (Non-DB)", weight: 0.80 },
    { label: "[0.80] งานสร้างสรรค์ที่ได้รับการเผยแพร่ในระดับความร่วมมือระหว่างประเทศ", value: "Creative Work International Collab", weight: 0.80 },
    { label: "[1.00] บทความวิจัยตีพิมพ์ในวารสารระดับนานาชาติตามประกาศ ก.พ.อ.", value: "International Journal (OCSC)", weight: 1.00 },
    { label: "[1.00] ผลงานได้รับการจดสิทธิบัตร", value: "Patent", weight: 1.00 },
    { label: "[1.00] ผลงานวิชาการรับใช้สังคมที่ผ่านการประเมินตำแหน่งทางวิชาการแล้ว", value: "Academic Service (Evaluated)", weight: 1.00 },
    { label: "[1.00] ผลงานวิจัยที่หน่วยงานหรือองค์กรระดับชาติว่าจ้างให้ดำเนินการ", value: "Commissioned Research (National)", weight: 1.00 },
    { label: "[1.00] ผลงานค้นพบพันธุ์พืช พันธุ์สัตว์ใหม่ และได้รับการจดทะเบียน", value: "New Species Registration", weight: 1.00 },
    { label: "[1.00] ตำราหรือหนังสือที่ผ่านการประเมินตำแหน่งทางวิชาการแล้ว", value: "Textbook (Evaluated)", weight: 1.00 },
    { label: "[1.00] ตำรา/หนังสือที่ผ่านการพิจารณาแต่ไม่ได้นำมาขอรับการประเมินตำแหน่ง", value: "Textbook (Not for Evaluation)", weight: 1.00 },
  ];

export default function AcademicPortfolio() {
  const { id: userId, fullName } = useUserStore();
  const [works, setWorks] = useState<AcademicWork[]>([]);
  const [selectedYear, setSelectedYear] = useState('All');
  const availableYears = Array.from(new Set(works.map(w => w.publication_year)))
  .filter(Boolean) 
  .sort((a, b) => b - a);
  const filteredWorks = selectedYear === 'All' 
    ? works 
    : works.filter(w => w.publication_year?.toString() === selectedYear);
  const totalWeight = filteredWorks.reduce((sum, w) => sum + (Number(w.weight) || 0), 0).toFixed(2);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State สำหรับฟอร์มเพิ่มผลงาน
  const [showForm, setShowForm] = useState(false);
  const [newWork, setNewWork] = useState({ 
    title: '', 
    work_type: WORK_TYPES[0].value, 
    publication_year: new Date().getFullYear(),
    weight: WORK_TYPES[0].weight // เพิ่มตัวนี้
  });

  // ฟังก์ชันดึงข้อมูลผลงาน
  const fetchWorks = async () => {
    if (!userId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('academic_works')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWorks(data);
    }
    setIsLoading(false);
  };

  // ฟังก์ชันบันทึกผลงานใหม่
  const handleAddWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWork.title) return alert('กรุณากรอกชื่อผลงาน');
    
    setIsSubmitting(true);
try {
    let fileUrl = '';

    if (uploadFile) {
      // --- ส่วนที่ต้องแก้ไข ---
      const fileExt = uploadFile.name.split('.').pop(); // ดึงนามสกุลไฟล์ (.pdf)
      
      // สร้างชื่อไฟล์ใหม่เป็นภาษาอังกฤษ: academic_เวลา_สุ่มเลข.pdf
      const cleanFileName = `work_${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      
      // กำหนด Path ให้เรียบร้อย
      const filePath = `${userId}/${cleanFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('academic_files')
        .upload(filePath, uploadFile);
      // -----------------------

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('academic_files')
        .getPublicUrl(filePath);
      
      fileUrl = publicUrl;
    }

      // 2. บันทึกข้อมูลลงตาราง (เพิ่มคอลัมน์ file_url ใน DB ด้วย)
      const { error } = await supabase
        .from('academic_works')
        .insert([{ 
          user_id: userId, 
          title: newWork.title, 
          work_type: newWork.work_type, 
          publication_year: newWork.publication_year,
          weight: newWork.weight,
          file_url: fileUrl 
        }]);

      if (error) throw error;

      alert('เพิ่มผลงานสำเร็จ!');
      setShowForm(false);
      setUploadFile(null);
      fetchWorks();
    } catch (error: any) {
      alert('ผิดพลาด: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชันลบผลงาน
  const handleDeleteWork = async (workId: string, fileUrl: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้และไฟล์แนบ?')) return;
    
    try {
      // 1. ลบไฟล์ใน Storage
      if (fileUrl) {
        // สกัดเอา Path จาก Public URL (ดึงข้อความหลัง /academic_files/)
        const filePath = fileUrl.split('/academic_files/').pop();
        
        if (filePath) {
          const { error: storageError } = await supabase.storage
            .from('academic_files')
            .remove([filePath]);
          
          if (storageError) console.error('ลบไฟล์ไม่สำเร็จ:', storageError);
        }
      }

      // 2. ลบข้อมูลใน Database
      const { error: dbError } = await supabase
        .from('academic_works')
        .delete()
        .eq('id', workId);

      if (dbError) throw dbError;

      setWorks(works.filter(w => w.id !== workId));
      alert('ลบข้อมูลเรียบร้อยแล้ว');
    } catch (error: any) {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      
      {/* ส่วนหัวหน้าเว็บ */}
      <div className="w-full flex-1 mx-auto mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen size={24} className="text-blue-600" />
            ระบบจัดการผลงานทางวิชาการ
          </h1>
          <p className="text-gray-500 mt-1">ผู้นำเสนอ: {fullName || 'อาจารย์'}</p>
        </div>
        
        <button 
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={18} /> {showForm ? 'ปิดฟอร์ม' : 'เพิ่มผลงานใหม่'}
        </button>
      </div>

      <div className="w-full flex-1 space-y-6">
        
        {/* ฟอร์มเพิ่มผลงาน (แสดงเมื่อกดปุ่ม) */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
            <h2 className="text-lg font-medium mb-4">รายละเอียดผลงานใหม่</h2>
            <form onSubmit={handleAddWork} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผลงาน / หัวข้องานวิจัย</label>
                <input 
                  type="text" 
                  value={newWork.title}
                  onChange={(e) => setNewWork({...newWork, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="เช่น การพัฒนาโมเดล AI สำหรับ..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ประเภทและคุณภาพผลงาน</label>
                <select 
                  value={newWork.work_type}
                  onChange={(e) => {
                    const selected = WORK_TYPES.find(t => t.value === e.target.value);
                    setNewWork({
                      ...newWork, 
                      work_type: e.target.value,
                      weight: selected?.weight || 0 // 👈 เก็บน้ำหนักคะแนนลง State ด้วย
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                >
                  <option value="">-- กรุณาเลือกระดับคุณภาพผลงาน --</option>
                  {WORK_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ปีที่เผยแพร่ (ค.ศ.)</label>
                <input 
                  type="number" 
                  value={newWork.publication_year}
                  onChange={(e) => setNewWork({...newWork, publication_year: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              {/* เพิ่มส่วนอัปโหลดไฟล์ใน Form */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ไฟล์หลักฐาน (PDF เท่านั้น)</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── แถบคะแนนรวมและตัวกรอง ─── */}
        <div className="bg-[#f4f8ff] border border-blue-100 rounded-xl p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
          
          {/* ฝั่งซ้าย: คะแนนรวม */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100/50 rounded-lg flex items-center justify-center text-blue-600">
              <Award size={20} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                คะแนนรวมผลงานวิชาการทั้งหมด:
              </h3>
            </div>
          </div>

          {/* ฝั่งขวา: ตัวกรองปี และ ตัวเลขคะแนน */}
          <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
            
            {/* Dropdown Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-blue-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer shadow-sm transition-all"
              >
                <option value="All">ทุกปีการศึกษา</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>ปี {year}</option>
                ))}
              </select>
            </div>

            {/* ตัวเลขคะแนนรวมที่เปลี่ยนตาม Filter */}
            <div className="text-3xl font-black text-blue-700 w-24 text-right">
              {totalWeight}
            </div>

          </div>
        </div>

        {/* ตารางแสดงผลงาน */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h3 className="font-medium text-gray-900">ประวัติผลงานที่บันทึกแล้ว</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm text-gray-500">
                  <th className="p-4 w-[40%]">ชื่อผลงาน</th>
                  <th className="p-4 w-[25%]">ประเภท</th>
                  <th className="p-4 w-[10%] text-center">ค่าน้ำหนัก</th>
                  <th className="p-4 w-[10%] text-center">ปีที่เผยแพร่</th>
                  <th className="p-4 w-[15%] text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : works.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={32} className="text-gray-300 mb-2" />
                        <p>ยังไม่มีประวัติผลงานทางวิชาการ</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  works.map((work) => (
                    <tr key={work.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{work.title}</td>
                      <td className="p-4 text-sm text-gray-600">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs">{work.work_type}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="font-semibold text-blue-600">
                          {work.weight?.toFixed(2) || "0.00"}
                        </span>
                      </td>
                      <td className="p-4 text-center text-gray-700">{work.publication_year}</td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          
                          {/* 👇 ปุ่ม Preview เอกสาร (แสดงเฉพาะเมื่อมี Link ไฟล์) */}
                          {work.file_url ? (
                            <button
                              onClick={() => window.open(work.file_url, '_blank', 'noopener,noreferrer')}
                              className="text-blue-500 hover:text-blue-700 transition-colors p-1"
                              title="ดูเอกสาร"
                            >
                              <FileText size={18} />
                            </button>
                          ) : (
                            <span className="text-gray-300" title="ไม่มีไฟล์เอกสาร">
                              <FileText size={18} />
                            </span>
                          )}

                          {/* ปุ่มลบผลงาน */}
                          <button 
                            onClick={() => handleDeleteWork(work.id, work.file_url || '')}
                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                            title="ลบผลงาน"
                          >
                            <Trash2 size={18} />
                          </button>
                          
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}