import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { KeyRound, ShieldCheck, Loader2 } from 'lucide-react';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsLoading(true);
    // ใช้คำสั่ง updateUser ของ Supabase เพื่อเปลี่ยนรหัสผ่าน
    const { error } = await supabase.auth.updateUser({ 
      password: newPassword 
    });

    if (!error) {
      alert('เปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว! กรุณาเข้าสู่ระบบอีกครั้ง');
      await supabase.auth.signOut(); // บังคับ Logout เพื่อให้ Login ใหม่ด้วยรหัสใหม่
      navigate('/login');
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">ตั้งรหัสผ่านใหม่</h1>
          <p className="text-gray-500 text-center mt-2 text-sm">
            ความปลอดภัยเป็นสิ่งสำคัญ กรุณากำหนดรหัสผ่านที่คาดเดาได้ยาก
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400"><KeyRound size={18} /></span>
              <input 
                type="password" 
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ระบุรหัสผ่านใหม่"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400"><KeyRound size={18} /></span>
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'บันทึกรหัสผ่านใหม่'}
          </button>
        </form>
      </div>
    </div>
  );
}