import React, { useState, useEffect } from 'react';
import { Eye, Edit, Trash2, Plus, Search, FileText, Filter, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DocumentList() {
  // 1. ข้อมูลผู้ใช้งาน (ในอนาคตควรดึงจาก Auth Context/LocalStorage)
  const currentUser = { id: 1, name: 'อ.สมชาย ใจดี', role: 'LECTURER' };

  // 2. State สำหรับเก็บข้อมูลจริงจาก Database
  const [documents, setDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // --- [ส่วนที่เพิ่มใหม่: ดึงข้อมูลจาก API] ---
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/documents');
      const data = await response.json();
      
      // Map ข้อมูลจาก Database ให้เข้ากับ Field ที่ UI ต้องการโชว์
      const mappedData = data.map(doc => ({
        id: doc.id,
        courseCode: doc.courseCode,
        courseName: doc.courseName,
        type: doc.type === 'TQF3' ? 'มคอ. 3' : 'มคอ. 5',
        term: `${doc.semester}/${doc.academicYear}`,
        ownerId: doc.userId,
        ownerName: doc.user?.name || 'ไม่ระบุชื่ออาจารย์',
        status: doc.status === 'APPROVED' ? 'ส่งแล้ว' : 'ฉบับร่าง',
        // ข้อมูลอื่นๆ ใน content (JSON) สามารถดึงมาใช้เพิ่มได้ถ้าต้องการ
      }));
      
      setDocuments(mappedData);
      setLoading(false);
    } catch (error) {
      console.error("Fetch error:", error);
      setLoading(false);
    }
  };

  // ฟังก์ชันลบเอกสารออกจาก Database จริง
  const handleDelete = async (docId, ownerId) => {
    if (ownerId !== currentUser.id) {
      alert('คุณไม่มีสิทธิ์ลบเอกสารของอาจารย์ท่านอื่นครับ!');
      return;
    }

    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบเอกสารนี้ออกจากระบบ?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/documents/${docId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          setDocuments(documents.filter(doc => doc.id !== docId));
          alert('ลบเอกสารเรียบร้อยแล้ว');
        }
      } catch (error) {
        alert('เกิดข้อผิดพลาดในการลบ');
      }
    }
  };
  // ------------------------------------------

  // ส่วนการกรองข้อมูล (Filter)
  const filteredDocs = documents.filter(doc => 
    doc.courseName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    doc.courseCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto pb-10 space-y-6 p-4">
      {/* Header & สร้างเอกสารใหม่ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText size={28} className="text-blue-600" />
            จัดการเอกสาร มคอ.
          </h2>
          <p className="text-gray-500 mt-1">
            เข้าสู่ระบบโดย: <span className="font-medium text-blue-600">{currentUser.name}</span>
          </p>
        </div>
        
        <Link to="/tqf-form">
          <button className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center shadow-sm hover:bg-blue-700 transition-colors font-medium">
            <Plus size={20} className="mr-2" /> สร้างเอกสารใหม่
          </button>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหารหัสวิชา หรือ ชื่อวิชา..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 flex-1 md:flex-none justify-center shadow-sm">
            <Filter size={18} className="mr-2" /> กรองข้อมูล
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
              <tr>
                <th className="p-4 font-semibold">รหัส - ชื่อรายวิชา</th>
                <th className="p-4 font-semibold">ประเภท</th>
                <th className="p-4 font-semibold">เทอม/ปี</th>
                <th className="p-4 font-semibold">ผู้รับผิดชอบ</th>
                <th className="p-4 font-semibold">สถานะ</th>
                <th className="p-4 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="6" className="p-10 text-center text-gray-500 italic">กำลังโหลดข้อมูลเอกสาร...</td></tr>
              ) : filteredDocs.map((doc) => {
                const isOwner = doc.ownerId === currentUser.id;

                return (
                  <tr key={doc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-gray-800">{doc.courseCode}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{doc.courseName}</p>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${doc.type === 'มคอ. 3' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {doc.type}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">{doc.term}</td>
                    <td className="p-4">
                      <p className={`font-medium ${isOwner ? 'text-blue-600' : 'text-gray-600'}`}>
                        {doc.ownerName}
                      </p>
                    </td>
                    <td className="p-4">
                       <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${doc.status === 'ส่งแล้ว' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {doc.status}
                      </span>
                    </td>
                    
                    <td className="p-4">
                      <div className="flex justify-center items-center gap-2">
                        <Link to={`/documents/preview/${doc.id}`}>
                          <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="ดูรายละเอียด">
                            <Eye size={18} />
                          </button>
                        </Link>
                        
                        {isOwner ? (
                          <>
                            <button className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors" title="แก้ไขเอกสาร">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => handleDelete(doc.id, doc.ownerId)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="ลบเอกสาร">
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <div className="p-1.5 text-gray-300" title="ไม่มีสิทธิ์แก้ไข">
                            <Lock size={18} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {!loading && filteredDocs.length === 0 && (
            <div className="text-center py-10 text-gray-500 italic">
              ไม่พบข้อมูลเอกสารในระบบ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}