import React, { useState } from 'react';
import { CheckCircle, XCircle, Eye, FileText, BookOpen, MessageSquare, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminApproval() {
  // ข้อมูลจำลอง เอกสารและผลงานที่ "รอตรวจสอบ"
  const [pendingItems, setPendingItems] = useState([
    {
      id: 1,
      type: 'tqf',
      title: 'มคอ. 3: CS301 วิศวกรรมซอฟต์แวร์',
      submittedBy: 'อ.สมชาย ใจดี',
      date: '10 ธ.ค. 2567',
      status: 'รอตรวจสอบ',
    },
    {
      id: 2,
      type: 'academic',
      title: 'งานวิจัย: AI for Agriculture (TCI กลุ่ม 1)',
      submittedBy: 'อ.สมศรี เรียนดี',
      date: '09 ธ.ค. 2567',
      status: 'รอตรวจสอบ',
    },
    {
      id: 3,
      type: 'tqf',
      title: 'มคอ. 5: IT201 ระบบฐานข้อมูล',
      submittedBy: 'อ.สมชาย ใจดี',
      date: '08 ธ.ค. 2567',
      status: 'รอตรวจสอบ',
    }
  ]);

  const [activeTab, setActiveTab] = useState('all'); // all, tqf, academic
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // ฟังก์ชันกดอนุมัติ
  const handleApprove = (item) => {
    if(window.confirm(`ยืนยันการอนุมัติ: ${item.title} ใช่หรือไม่?`)) {
      // เตะออกจากรายการรอตรวจสอบ
      setPendingItems(pendingItems.filter(i => i.id !== item.id));
      alert(`อนุมัติสำเร็จ! ระบบได้ส่งแจ้งเตือนไปยัง ${item.submittedBy} แล้ว`);
    }
  };

  // ฟังก์ชันกดตีกลับ (เปิด Modal ให้กรอกเหตุผล)
  const openRejectModal = (item) => {
    setSelectedItem(item);
    setRejectModalOpen(true);
  };

  // ยืนยันการตีกลับ
  const submitReject = (e) => {
    e.preventDefault();
    setPendingItems(pendingItems.filter(i => i.id !== selectedItem.id));
    setRejectModalOpen(false);
    setRejectReason('');
    alert(`ส่งกลับแก้ไขเรียบร้อย! ระบบได้ส่งข้อความแจ้งเตือนพร้อมเหตุผลไปยัง ${selectedItem.submittedBy} แล้ว`);
  };

  const filteredItems = pendingItems.filter(item => 
    activeTab === 'all' ? true : item.type === activeTab
  );

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CheckCircle size={28} className="text-green-600" />
            อนุมัติเอกสารและผลงานวิชาการ
          </h2>
          <p className="text-gray-500 mt-1">รายการที่รอการตรวจสอบจากผู้ดูแลระบบ (Admin)</p>
        </div>
        <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-lg font-bold flex items-center">
          รอตรวจสอบ {pendingItems.length} รายการ
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>ทั้งหมด</button>
          <button onClick={() => setActiveTab('tqf')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center ${activeTab === 'tqf' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><FileText size={16} className="mr-2"/> มคอ.</button>
          <button onClick={() => setActiveTab('academic')} className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center ${activeTab === 'academic' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><BookOpen size={16} className="mr-2"/> ผลงานวิชาการ</button>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          <input type="text" placeholder="ค้นหาชื่ออาจารย์ หรือ ชื่อเอกสาร..." className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold w-16 text-center">ประเภท</th>
                <th className="p-4 font-semibold">ชื่อเอกสาร / ผลงาน</th>
                <th className="p-4 font-semibold">ผู้ส่ง (อาจารย์)</th>
                <th className="p-4 font-semibold">วันที่ส่ง</th>
                <th className="p-4 font-semibold text-center w-48">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    <CheckCircle size={40} className="mx-auto text-green-200 mb-3" />
                    ไม่มีเอกสารรอตรวจสอบในขณะนี้
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 text-center">
                      {item.type === 'tqf' ? (
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto" title="เอกสาร มคอ."><FileText size={20} /></div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center mx-auto" title="ผลงานวิชาการ"><BookOpen size={20} /></div>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-800">{item.title}</td>
                    <td className="p-4 text-gray-600">{item.submittedBy}</td>
                    <td className="p-4 text-gray-500">{item.date}</td>
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <Link to="/documents/preview">
                          <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="ดูรายละเอียด">
                            <Eye size={18} />
                          </button>
                        </Link>
                        <button onClick={() => handleApprove(item)} className="p-2 text-green-600 hover:bg-green-50 border border-green-200 rounded-lg transition-colors flex items-center" title="อนุมัติ">
                          <CheckCircle size={18} />
                        </button>
                        <button onClick={() => openRejectModal(item)} className="p-2 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center" title="ส่งกลับแก้ไข">
                          <XCircle size={18} />
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

      {/* Modal สำหรับกรอกเหตุผลที่ตีกลับ (Reject) */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-red-50 p-4 border-b border-red-100 flex items-center text-red-700">
              <MessageSquare size={20} className="mr-2" />
              <h3 className="font-bold">ระบุเหตุผลที่ส่งกลับแก้ไข</h3>
            </div>
            <form onSubmit={submitReject} className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">เอกสาร: <span className="font-bold text-gray-800">{selectedItem?.title}</span></p>
                <p className="text-sm text-gray-600 mb-4">ผู้ส่ง: <span className="font-bold text-gray-800">{selectedItem?.submittedBy}</span></p>
                <label className="block text-sm font-medium text-gray-700 mb-2">ข้อความถึงอาจารย์ผู้ส่ง (Feedback)</label>
                <textarea 
                  required
                  rows="4"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  placeholder="เช่น กรุณาแนบไฟล์หน้าปกบทความวิชาการเพิ่มเติม..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                ></textarea>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">ยืนยันการส่งกลับ</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}