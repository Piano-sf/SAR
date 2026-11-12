import React, { useState } from 'react';
import { User, Lock, Mail, Briefcase, UserPlus, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Register() {
  const [loading, setLoading] = useState(false);
  
  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    email: '',
    role: 'TEACHER' // ค่าเริ่มต้นเป็นนักศึกษา
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("รหัสผ่านไม่ตรงกัน");
      return;
    }
    
    setLoading(true);
    // จำลองการโหลด
    setTimeout(() => {
      setLoading(false);
      alert("ลงทะเบียนสำเร็จ (Mockup)");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
        
        {/* Header */}
        <div className="text-center mb-8 relative">
          <Link to="/login" className="absolute left-0 top-0 text-gray-400 hover:text-gray-600">
            <ArrowLeft size={24} />
          </Link>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 text-blue-600">
            <UserPlus size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">สร้างบัญชีผู้ใช้งาน</h1>
          <p className="text-gray-500 text-sm mt-2">กรอกข้อมูลเพื่อสมัครสมาชิกเข้าระบบ QA System</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* ชื่อ-นามสกุล */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อจริง</label>
              <input 
                name="firstName"
                type="text" 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="สมชาย"
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
              <input 
                name="lastName"
                type="text" 
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ใจดี"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                name="email"
                type="email" 
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="somchai@university.ac.th"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สถานะ</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <select 
                name="role"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
                onChange={handleChange}
              >
                <option value="STUDENT">นักศึกษา (Student)</option>
                <option value="LECTURER">อาจารย์ (Lecturer)</option>
              </select>
            </div>
          </div>

          <hr className="my-4 border-gray-100" />

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้งาน (Username)</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                name="username"
                type="text" 
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ตั้งชื่อผู้ใช้งาน..."
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                name="password"
                type="password" 
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input 
                name="confirmPassword"
                type="password" 
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
                onChange={handleChange}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition-all shadow-md mt-6 disabled:opacity-70"
          >
            {loading ? 'กำลังบันทึก...' : 'ลงทะเบียน'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          มีบัญชีอยู่แล้ว? <Link to="/login" className="text-blue-600 hover:underline font-medium">เข้าสู่ระบบ</Link>
        </p>
      </div>
    </div>
  );
}