import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "../../lib/supabase"; // Adjust path if necessary
import { useUserStore } from "../../stores/useUserStore"; // Adjust path if necessary

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { setUser } = useUserStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง'); // "Invalid email or password"
      setLoading(false);
      return;
    }

    // 2. Fetch custom user data (Role & Department) from our custom table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, department_id, full_name')
      .eq('id', authData.user.id)
      .single();

    if (userError || !userData) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูลสิทธิ์การใช้งาน'); // "Error fetching role data"
      setLoading(false);
      return;
    }

    // 3. Populate global Zustand store
    setUser({
      id: authData.user.id,
      role: userData.role,
      departmentId: userData.department_id,
      fullName: userData.full_name,
    });

    // 4. Smart Routing based on Role
    if (userData.role === 'Lecturer') navigate('/dashboard/lecturer');
    else if (userData.role === 'Staff') navigate('/dashboard/admin');
    else if (userData.role === 'Department_Head') navigate('/dashboard/department');
    else if (userData.role === 'Executive') navigate('/dashboard/executive');
    else navigate('/'); // Fallback
  };

  return (
    // พื้นหลังปรับให้เข้มขึ้นเล็กน้อยเพื่อให้เงาสีดำดูสมจริง
    <div className="min-h-screen flex items-center justify-center bg-slate-100 font-sans text-slate-800">
      
      {/* Container หลัก: เพิ่มเงาให้หนักและลึกขึ้น (shadow-2xl พร้อมปรับค่า rgba) */}
      <div className="flex w-full max-w-[760px] min-h-[440px] bg-white rounded-[1.2rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.25)] overflow-hidden m-4 border border-slate-200/60">
        
        {/* ฝั่งซ้าย: Branding Section - สีน้ำเงินเข้ม Deep Navy */}
        <div className="hidden md:flex md:w-[38%] bg-[#1638a1] p-7 flex-col justify-between text-white relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-white/10 p-1.5 rounded-lg border border-white/20">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-base font-bold tracking-tight">QA System</span>
            </div>
            
            <h1 className="text-xl font-bold leading-snug mb-3">
              ระบบบริหารจัดการ <br />
              เอกสาร มคอ.<br />
              และผลงานวิชาการ
            </h1>
            
            <p className="text-blue-50/60 text-[11px] leading-relaxed font-light">
              แพลตฟอร์มที่ช่วยยกระดับการประกันคุณภาพการศึกษา ลดขั้นตอนความซ้ำซ้อน <br />
              และติดตามความคืบหน้าแบบเรียล์ไทม์
            </p>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 bg-black/10 p-2.5 rounded-xl border border-white/10">
            <div className="bg-green-400 rounded-full p-1">
              <svg className="w-2 h-2 text-[#1638a1]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-[10px] font-semibold text-blue-50">ระบบรักษาความปลอดภัยระดับองค์กร</span>
          </div>
        </div>

        {/* ฝั่งขวา: Form Section */}
        <div className="w-full md:w-[62%] p-8 md:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-[20px] text-slate-800 mb-1 text-left">เข้าสู่ระบบ</h2>
            <p className="text-slate-400 text-[13px] text-left">กรุณากรอกข้อมูลเพื่อเข้าใช้งานระบบ</p>
          </div>
          
          {/* Error Message Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs font-medium rounded-xl">
              {error}
            </div>
          )}
          
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1 text-left">
              <label className="block text-slate-550 text-[12px] font-bold uppercase tracking-wider ml-1">อีเมล (มหาวิทยาลัย)</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all text-xs disabled:opacity-60"
                placeholder="name@university.ac.th"
              />
            </div>

            <div className="space-y-1 text-left">
              <div className="flex justify-between items-center ml-1">
                <label className="text-slate-550 text-[12px] font-bold uppercase tracking-wider">รหัสผ่าน</label>
                <a href="#" className="text-[#1638a1] text-[10px] font-bold hover:underline">ลืมรหัสผ่าน?</a>
              </div>
              <div className="relative">
                <input 
                  required
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all text-xs disabled:opacity-60"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1638a1] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.024 10.024 0 014.13-5.323m3.946-1.558A10.03 10.03 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-[#93c5fd] text-white font-bold py-3 rounded-xl shadow-lg transition-all transform active:scale-[0.98] mt-3 text-xs"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : null}
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;