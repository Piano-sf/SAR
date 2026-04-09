import React, { useState } from 'react';
import { Search, UserPlus, MoreVertical, Shield, Mail, Trash2, Edit } from 'lucide-react';

export default function UserList() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Data
  const users = [
    { id: 1, name: 'อ.สมชาย ใจดี', email: 'somchai@univ.ac.th', role: 'ADMIN', department: 'วิทยาการคอมพิวเตอร์', status: 'ACTIVE' },
    { id: 2, name: 'ดร.วิภาดา รักเรียน', email: 'wipada@univ.ac.th', role: 'LECTURER', department: 'เทคโนโลยีสารสนเทศ', status: 'ACTIVE' },
    { id: 3, name: 'นายณเดชน์ คูกิมิยะ', email: 'nadech@student.univ.ac.th', role: 'STUDENT', department: 'วิศวกรรมซอฟต์แวร์', status: 'INACTIVE' },
    { id: 4, name: 'ผศ.ดร.เจษฎา', email: 'jessada@univ.ac.th', role: 'LECTURER', department: 'วิทยาการคอมพิวเตอร์', status: 'ACTIVE' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h2>
          <p className="text-gray-500">รายชื่ออาจารย์ เจ้าหน้าที่ และนักศึกษาในระบบ</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center shadow-sm hover:bg-blue-700 transition-colors">
          <UserPlus size={18} className="mr-2" /> เพิ่มผู้ใช้งาน
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหาชื่อ หรืออีเมล..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select className="border border-gray-200 rounded-lg px-4 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>ทุกสถานะ</option>
          <option>อาจารย์ (Lecturer)</option>
          <option>นักศึกษา (Student)</option>
          <option>ผู้ดูแล (Admin)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="p-4 font-semibold text-gray-600">ชื่อ-นามสกุล</th>
              <th className="p-4 font-semibold text-gray-600">สิทธิ์การใช้งาน</th>
              <th className="p-4 font-semibold text-gray-600">สังกัด / สาขา</th>
              <th className="p-4 font-semibold text-gray-600">สถานะ</th>
              <th className="p-4 text-right font-semibold text-gray-600">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Mail size={12} className="mr-1" /> {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    user.role === 'LECTURER' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    'bg-green-50 text-green-700 border-green-100'
                  }`}>
                    {user.role === 'ADMIN' && <Shield size={12} className="mr-1" />}
                    {user.role}
                  </span>
                </td>
                <td className="p-4 text-gray-600 text-sm">{user.department}</td>
                <td className="p-4">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-sm text-gray-600">{user.status === 'ACTIVE' ? 'ใช้งานปกติ' : 'ปิดใช้งาน'}</span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}