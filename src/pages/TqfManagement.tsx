import React, { useState, useEffect, useRef } from 'react';
import { FileText, CheckCircle, Clock, UploadCloud, Search, Filter, Eye, Edit, Trash2, Lock, X, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/useUserStore';
import emailjs from '@emailjs/browser';

interface TQFDocument {
  id: string; 
  subject_code: string;
  course_name: string;
  tqf_type: 'TQF3' | 'TQF5';
  semester: number;
  academic_year: number;
  status: 'pending' | 'draft' | 'submitted'; 
  file_url?: string;
}

export default function TqfManagement() {
  const { id: userId, fullName, email } = useUserStore();
  const [documents, setDocuments] = useState<TQFDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // --- States สำหรับการค้นหาและกรองข้อมูล ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'TQF3' | 'TQF5'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'draft' | 'submitted'

  // States สำหรับ Modal อัปโหลด/แก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<TQFDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- ฟังก์ชันส่งแจ้งเตือน (Email + Teams) ---
  const sendNotifications = async (subjectCode: string, docType: string) => {
    const formatType = docType === 'TQF3' ? 'มคอ. 3' : 'มคอ. 5';
    const message = `อาจารย์ ${fullName} ได้ทำการส่งเอกสาร ${formatType} วิชารหัส ${subjectCode} เรียบร้อยแล้ว`;

    const emailParams = {
      to_name: fullName,
      to_email: email,
      message: message
    };

    try {
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        emailParams,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      );
    } catch (err) {
      console.error('Email failed:', err);
    }

    const { data: userData } = await supabase
      .from('users')
      .select('msteams_webhook_url')
      .eq('id', userId)
      .single();

    if (userData?.msteams_webhook_url) {
      try {
        await fetch(userData.msteams_webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: "message",
            attachments: [{
              contentType: "application/vnd.microsoft.card.adaptive",
              content: {
                type: "AdaptiveCard",
                version: "1.2",
                body: [
                  { type: "TextBlock", text: "✅ ยืนยันการส่งเอกสาร", weight: "Bolder", color: "Good" },
                  { type: "TextBlock", text: message, wrap: true }
                ]
              }
            }]
          })
        });
      } catch (err) {
        console.error('Teams notification failed:', err);
      }
    }
  };

  // --- 1. READ: ดึงข้อมูลจากฐานข้อมูล ---
const fetchTqfStatus = async () => {
  if (!userId) {
    console.error("No User ID found in Store");
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  try {
    // 1. ดึงวิชาที่อาจารย์คนนี้รับผิดชอบจากตารางเชื่อมโยง
    const { data: assignments, error: assignError } = await supabase
      .from('course_instructors')
      .select(`
        course_id,
        courses (
          id,
          code,
          name
        )
      `)
      .eq('teacher_id', userId);

    if (assignError) throw assignError;

    // 2. ดึงข้อมูลการส่งเอกสารของอาจารย์คนนี้
    const { data: submissions, error: subError } = await supabase
      .from('submissions')
      .select('subject_id, type, file_url, status')
      .eq('user_id', userId);

      if (subError) throw subError;

      // 3. นำข้อมูลมา Map เข้าด้วยกัน
      const formattedDocs: TQFDocument[] = [];

      if (assignments && assignments.length > 0) {
        assignments.forEach((item: any) => {
          const course = item.courses;
          if (!course) return; // ข้ามถ้าหาข้อมูลวิชาไม่เจอ

          ['TQF3', 'TQF5'].forEach((type) => {
            // ตรวจสอบว่าเคยส่งหรือยัง โดยเช็คจาก subject_id (รหัสวิชา) และประเภท
            const sub = submissions?.find(
              (s) => s.subject_id === course.code && s.type === type
            );

            formattedDocs.push({
              id: `${course.id}-${type}`,
              subject_code: course.code,
              course_name: course.name,
              tqf_type: type as 'TQF3' | 'TQF5',
              semester: 1, // ค่าจำลอง
              academic_year: 2567, // ค่าจำลอง
              status: sub ? sub.status : 'pending',
              file_url: sub?.file_url
            });
          });
        });
      }

      setDocuments(formattedDocs);
    } catch (error: any) {
      console.error('Fetch Error:', error.message);
    } finally {
      setIsLoading(false); // 🌟 จุดสำคัญ: ต้องปิด Loading เสมอไม่ว่าจะสำเร็จหรือพลาด
    }
  };

  useEffect(() => {
    fetchTqfStatus();
  }, [userId]);

  // --- 2. CREATE / UPDATE: อัปโหลดและบันทึกข้อมูล ---
  const handleSaveDocument = async (saveStatus: 'draft' | 'submitted') => {
    if (!editingDoc) return;
    if (!selectedFile && !editingDoc.file_url) {
      alert('กรุณาเลือกไฟล์ PDF ก่อนบันทึก');
      return;
    }

    setIsSaving(true);
    let finalFileUrl = editingDoc.file_url;

    try {
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${userId}/${editingDoc.subject_code}_${editingDoc.tqf_type}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('tqf_submissions')
          .upload(fileName, selectedFile, { contentType: 'application/pdf', upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage.from('tqf_submissions').getPublicUrl(fileName);
        finalFileUrl = publicUrl;
      }

      // แก้จาก .single() เป็น .maybeSingle() — .single() จะ throw error (406) ทุกครั้งที่ไม่มีแถว
      // ซึ่งเป็นเรื่องปกติตอนส่งครั้งแรก แต่โค้ดเดิมไม่เช็ค error เลย ทำให้แยกไม่ออกว่า
      // "ไม่มีแถวจริง" กับ "query ถูกบล็อกด้วยเหตุผลอื่น (เช่น RLS)" เป็นคนละกรณีกัน
      // ถ้าเคสหลังเกิดขึ้น โค้ดจะเข้าใจผิดว่าไม่มี submission เดิม แล้วพยายาม insert ซ้ำ
      // ทั้งที่มีแถวเดิมอยู่แล้ว → ชน unique constraint → error "Error saving document"
      const { data: existingSub, error: existingSubError } = await supabase
        .from('submissions')
        .select('id')
        .eq('user_id', userId)
        .eq('subject_id', editingDoc.subject_code)
        .eq('type', editingDoc.tqf_type)
        .maybeSingle();

      if (existingSubError) throw existingSubError;

      if (existingSub) {
        const { error: dbError } = await supabase
          .from('submissions')
          .update({ status: saveStatus, file_url: finalFileUrl })
          .eq('id', existingSub.id);
        if (dbError) throw dbError;
      } else {
        const { error: dbError } = await supabase
          .from('submissions')
          .insert([{
            user_id: userId,
            subject_id: editingDoc.subject_code,
            type: editingDoc.tqf_type,
            status: saveStatus,
            file_url: finalFileUrl
          }]);
        if (dbError) throw dbError;
      }

      if (saveStatus === 'submitted') {
        await sendNotifications(editingDoc.subject_code, editingDoc.tqf_type);
        alert('ส่งเอกสารสำเร็จ และส่งการแจ้งเตือนแล้ว!');
      } else {
        alert('บันทึกฉบับร่างเรียบร้อยแล้ว');
      }

      setIsModalOpen(false);
      fetchTqfStatus();

    } catch (error: any) {
      console.error('Error saving document:', error);
      alert('เกิดข้อผิดพลาด: ' + (error.message || JSON.stringify(error)));
    } finally {
      setIsSaving(false);
    }
  };

  // --- 3. DELETE: ลบฉบับร่าง ---
  const handleDeleteDraft = async (doc: TQFDocument) => {
    const isConfirm = window.confirm(`ยืนยันการลบฉบับร่าง ${doc.tqf_type} วิชา ${doc.subject_code} หรือไม่?`);
    if (!isConfirm) return;

    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('user_id', userId)
      .eq('subject_id', doc.subject_code)
      .eq('type', doc.tqf_type);

    if (!error) {
      alert('ลบฉบับร่างสำเร็จ');
      fetchTqfStatus();
    } else {
      alert('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    }
  };

  const handlePreview = (url?: string) => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else alert('ยังไม่มีไฟล์แนบในเอกสารนี้');
  };

  const openUploadModal = (doc: TQFDocument) => {
    setEditingDoc(doc);
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  // --- LOGIC การกรองข้อมูล (Search + Filters) ---
  const filteredDocs = documents.filter(doc => {
    // 1. กรองด้วยช่องค้นหา
    const matchesSearch = doc.subject_code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.course_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. กรองด้วยประเภทเอกสาร
    const matchesType = filterType === 'all' || doc.tqf_type === filterType;
    
    // 3. กรองด้วยสถานะ
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // นับจำนวน Filter ที่เปิดใช้งานอยู่
  const activeFilterCount = (filterType !== 'all' ? 1 : 0) + (filterStatus !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800 animate-in fade-in duration-300">
      
      {/* ─── Header & Search ─── */}
      <div className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="text-blue-600" /> ระบบจัดการเอกสาร มคอ.
            </h1>
            <p className="text-sm text-gray-500 mt-1">ภาคการศึกษาปัจจุบัน: 1/2567 | ผู้สอน: {fullName}</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* ช่องค้นหา */}
            <div className="relative w-full sm:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search size={16} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="ค้นหารหัส หรือ ชื่อวิชา..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50 focus:bg-white"
              />
            </div>

            {/* ปุ่ม Filter พร้อม Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`relative flex items-center gap-2 px-4 py-2 border rounded-xl text-sm font-medium transition-colors ${
                  isFilterOpen || activeFilterCount > 0 
                    ? 'border-blue-300 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} /> กรองข้อมูล
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold ring-2 ring-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* Filter Dropdown Menu */}
              {isFilterOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-gray-900">ตัวกรองเอกสาร</h4>
                    {(filterType !== 'all' || filterStatus !== 'all') && (
                      <button 
                        onClick={() => { setFilterType('all'); setFilterStatus('all'); }}
                        className="text-[10px] text-red-500 hover:underline font-medium"
                      >
                        ล้างทั้งหมด
                      </button>
                    )}
                  </div>
                  
                  {/* ตัวกรองประเภท */}
                  <div className="space-y-1.5 mb-4">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภทเอกสาร</label>
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    >
                      <option value="all">ทั้งหมด (มคอ.3 และ มคอ.5)</option>
                      <option value="TQF3">มคอ. 3 (ก่อนเปิดเทอม)</option>
                      <option value="TQF5">มคอ. 5 (หลังปิดเทอม)</option>
                    </select>
                  </div>

                  {/* ตัวกรองสถานะ */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">สถานะการส่ง</label>
                    <select 
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    >
                      <option value="all">ทุกสถานะ</option>
                      <option value="pending">ยังไม่ดำเนินการ</option>
                      <option value="draft">ฉบับร่าง</option>
                      <option value="submitted">ส่งแล้ว</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        </div>

        {/* ─── Data Table ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50/80 text-xs text-gray-500 font-semibold border-b border-gray-100">
                  <th className="p-4 w-[40%]">รหัส - ชื่อรายวิชา</th>
                  <th className="p-4 w-[15%] text-center">ประเภท</th>
                  <th className="p-4 w-[15%] text-center">เทอม/ปี</th>
                  <th className="p-4 w-[15%] text-center">สถานะ</th>
                  <th className="p-4 w-[15%] text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      <Loader2 className="animate-spin mx-auto mb-3 text-blue-500" size={28} />
                      กำลังโหลดข้อมูล...
                    </td>
                  </tr>
                ) : filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <FileText size={32} className="text-gray-300 mb-2" />
                        <p>ไม่พบเอกสาร มคอ. ที่ตรงกับเงื่อนไข</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors group">
                      
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{doc.subject_code}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{doc.course_name}</div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${
                          doc.tqf_type === 'TQF3' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                        }`}>
                          {doc.tqf_type === 'TQF3' ? 'มคอ. 3' : 'มคอ. 5'}
                        </span>
                      </td>

                      <td className="p-4 text-center text-gray-600 font-medium">
                        {doc.semester}/{doc.academic_year}
                      </td>

                      <td className="p-4 text-center">
                        {doc.status === 'pending' && (
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[11px] font-bold">ยังไม่ดำเนินการ</span>
                        )}
                        {doc.status === 'draft' && (
                          <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[11px] font-bold">ฉบับร่าง</span>
                        )}
                        {doc.status === 'submitted' && (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold">ส่งแล้ว</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-3 text-gray-400">
                          <button 
                            onClick={() => handlePreview(doc.file_url)} 
                            className={`${doc.file_url ? 'hover:text-blue-600 cursor-pointer' : 'opacity-30 cursor-not-allowed'} transition-colors`} 
                            title="ดูเอกสาร"
                          >
                            <Eye size={18} />
                          </button>
                          
                          {doc.status !== 'submitted' ? (
                            <>
                              <button onClick={() => openUploadModal(doc)} className="hover:text-amber-600 transition-colors" title="จัดการ/แนบไฟล์">
                                <Edit size={18} />
                              </button>
                              {doc.status === 'draft' && (
                                <button onClick={() => handleDeleteDraft(doc)} className="hover:text-red-600 transition-colors" title="ลบฉบับร่าง">
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </>
                          ) : (
                            <span title="เอกสารถูกส่งแล้ว ไม่สามารถแก้ไขได้">
                              <Lock size={18} className="text-gray-300 opacity-50 cursor-not-allowed" />
                            </span>
                          )}
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

      {/* ─── Modal จัดการไฟล์ (Upload & Draft) ─── */}
      {isModalOpen && editingDoc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText size={18} className="text-blue-600"/> 
                จัดการเอกสาร {editingDoc.tqf_type === 'TQF3' ? 'มคอ. 3' : 'มคอ. 5'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-200 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-bold text-gray-900">{editingDoc.subject_code}</p>
                <p className="text-xs text-gray-500 mt-1">{editingDoc.course_name}</p>
                <p className="text-xs text-blue-600 font-medium mt-2">ภาคเรียนที่ {editingDoc.semester}/{editingDoc.academic_year}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">อัปโหลดไฟล์ (PDF) <span className="text-red-500">*</span></label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-colors bg-white">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <UploadCloud className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 font-medium">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวาง</p>
                    {selectedFile && <p className="text-xs text-blue-600 mt-2 font-bold">{selectedFile.name}</p>}
                    {!selectedFile && editingDoc.file_url && <p className="text-xs text-amber-600 mt-2 font-bold">มีไฟล์ฉบับร่างอยู่แล้ว (อัปโหลดใหม่เพื่อเขียนทับ)</p>}
                  </div>
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="pt-2 flex justify-between gap-3 items-center">
                <button 
                  onClick={() => handleSaveDocument('draft')}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกเป็นฉบับร่าง'}
                </button>

                <button 
                  onClick={() => handleSaveDocument('submitted')}
                  disabled={isSaving || (!selectedFile && !editingDoc.file_url)}
                  className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                  {isSaving ? 'กำลังส่ง...' : 'ส่งเอกสาร'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}