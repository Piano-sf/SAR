import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ShieldCheck, ArrowRight, FileText } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true); // true = เข้าสู่ระบบ, false = ลงทะเบียน
  const [loading, setLoading] = useState(false);

  // State สำหรับเก็บข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'LECTURER' // ค่าเริ่มต้นตอนสมัคร
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // จำลองการโหลดส่งข้อมูลไป Backend (API)
    setTimeout(() => {
      setLoading(false);
      // สมมติว่า Login หรือสมัครสำเร็จ ให้เด้งไปหน้า Dashboard
      navigate('/');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden relative z-10 animate-fadeIn">
        
        {/* ================= Left Side (Branding / Info) ================= */}
        <div className="md:w-5/12 bg-gradient-to-br from-blue-900 to-blue-700 p-10 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Overlay Pattern */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileText size={28} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-wide">QA System</h1>
            </div>
            
            <h2 className="text-3xl font-bold leading-tight mb-4">
              ระบบบริหารจัดการ<br />เอกสาร มคอ. <br />และผลงานวิชาการ
            </h2>
            <p className="text-blue-100/80 text-sm leading-relaxed mb-8">
              แพลตฟอร์มที่ช่วยยกระดับการประกันคุณภาพการศึกษา ลดขั้นตอนความซ้ำซ้อน และติดตามความคืบหน้าได้แบบเรียลไทม์
            </p>
          </div>

          <div className="relative z-10 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
            <div className="flex items-center gap-3 text-sm font-medium">
              <ShieldCheck size={20} className="text-green-400" />
              <span>ระบบรักษาความปลอดภัยระดับองค์กร</span>
            </div>
          </div>
        </div>

        {/* ================= Right Side (Form) ================= */}
        <div className="md:w-7/12 p-10 sm:p-14 bg-white flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
              {isLoginMode ? 'เข้าสู่ระบบ (Sign In)' : 'สร้างบัญชีผู้ใช้ (Sign Up)'}
            </h2>
            <p className="text-gray-500 text-sm mt-2">
              {isLoginMode 
                ? 'กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งานระบบ' 
                : 'กรอกข้อมูลส่วนตัวเพื่อลงทะเบียนเข้าใช้งานระบบ QA'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* ฟิลด์ชื่อ-นามสกุล (โชว์เฉพาะตอนลงทะเบียน) */}
            {!isLoginMode && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-sm font-medium text-gray-700">ชื่อ - นามสกุล</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    type="text" name="name" required={!isLoginMode}
                    value={formData.name} onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-gray-50 focus:bg-white" 
                    placeholder="เช่น อ.สมชาย ใจดี" 
                  />
                </div>
              </div>
            )}

            {/* ฟิลด์อีเมล */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">อีเมล (มหาวิทยาลัย)</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="email" name="email" required
                  value={formData.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-gray-50 focus:bg-white" 
                  placeholder="name@university.ac.th" 
                />
              </div>
            </div>

            {/* ฟิลด์รหัสผ่าน */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
                {isLoginMode && (
                  <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-800">ลืมรหัสผ่าน?</a>
                )}
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input 
                  type="password" name="password" required
                  value={formData.password} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 outline-none transition-all bg-gray-50 focus:bg-white" 
                  placeholder="••••••••" 
                />
              </div>
            </div>

            {/* ฟิลด์เลือกสิทธิ์ (โชว์เฉพาะตอนลงทะเบียน เอาไว้ Demo ให้กรรมการดู) */}
            {!isLoginMode && (
              <div className="space-y-1 animate-fadeIn">
                <label className="text-sm font-medium text-gray-700">ลงทะเบียนในฐานะ</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button type="button" onClick={() => setFormData({...formData, role: 'LECTURER'})} className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${formData.role === 'LECTURER' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    อาจารย์ผู้สอน
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, role: 'ADMIN'})} className={`py-2 px-4 rounded-xl border text-sm font-medium transition-all ${formData.role === 'ADMIN' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                    ผู้ดูแลระบบ (Admin)
                  </button>
                </div>
              </div>
            )}

            {/* ปุ่ม Submit */}
            <button 
              type="submit" disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {loading 
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 
                : <>{isLoginMode ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'} <ArrowRight size={18} /></>}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-8 text-center text-sm text-gray-600">
            {isLoginMode ? "ยังไม่มีบัญชีผู้ใช้? " : "มีบัญชีผู้ใช้แล้ว? "}
            <button 
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {isLoginMode ? 'ลงทะเบียนที่นี่' : 'เข้าสู่ระบบ'}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}