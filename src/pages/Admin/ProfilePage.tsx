import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/useUserStore';
import { 
  User as UserIcon, Loader2, Camera, Mail, 
  Building, GraduationCap, Link as LinkIcon, 
  CheckCircle2, Lock, KeyRound, Save, Bell, 
  CalendarIcon, LogOut
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get ID and global setter from store
  const { id, fullName: storeFullName, avatarUrl: storeAvatarUrl, setUser } = useUserStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 🌟 STATE MANAGEMENT ---
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTeamsConnected, setIsTeamsConnected] = useState(false); 
  
  const [profileData, setProfileData] = useState({
    fullName: storeFullName || '',
    email: '',
    role: '',
    department: '',
    avatarUrl: storeAvatarUrl || ''
  });

  // --- 🌟 REFRESH-PROOF FETCH LOGIC ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        let currentId = id;

        if (!currentId) {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (authError || !authData.user) {
            navigate('/login');
            return;
          }
          currentId = authData.user.id;
        }
        
        const { data, error } = await supabase
          .from('users')
          .select(`
            full_name,
            email,
            role,
            avatar_url,
            departments ( name )
          `)
          .eq('id', currentId)
          .single();

        if (data && !error) {
          const departments = data.departments as
            | Array<{ name?: string }>
            | { name?: string }
            | null
            | undefined;
          const deptName = Array.isArray(departments)
            ? departments[0]?.name
            : departments?.name;

          setProfileData({
            fullName: data.full_name || '',
            email: data.email || '',
            role: data.role || 'No Role',
            department: deptName || 'Central Administration',
            avatarUrl: data.avatar_url || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  // --- 📸 AVATAR UPLOAD LOGIC ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      let currentId = id;
      if (!currentId) {
         const { data } = await supabase.auth.getUser();
         currentId = data?.user?.id || null;
      }

      if (!event.target.files || event.target.files.length === 0 || !currentId) return;
      
      setIsUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${currentId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars') 
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const timestampedUrl = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: timestampedUrl })
        .eq('id', currentId);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, avatarUrl: timestampedUrl }));
      setUser({ avatarUrl: timestampedUrl }); 

      alert('อัปโหลดรูปโปรไฟล์สำเร็จ!');

    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  // --- 💾 SAVE PROFILE NAME ---
  const handleSaveProfile = async () => {
    let currentId = id;
    if (!currentId) {
       const { data } = await supabase.auth.getUser();
       currentId = data?.user?.id || null;
    }
    
    if (!currentId) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('users')
      .update({ full_name: profileData.fullName })
      .eq('id', currentId);

    if (!error) {
      setUser({ fullName: profileData.fullName });
      alert('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
    setIsSaving(false);
  };

  const toggleTeamsConnection = () => setIsTeamsConnected(!isTeamsConnected);
  const testSendTeamsNotification = () => alert("ส่งการแจ้งเตือนทดสอบไปยัง MS Teams แล้ว!");
  const handleResetPassword = () => alert("ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปยังอีเมลของคุณแล้ว");

  const sidebarMenuItems = [
    { id: "dashboard", thaiTitle: "ภาพรวมระบบ", path: "/admin/main", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { id: "course", thaiTitle: "ระบบจัดการหลักสูตรและเอกสาร", path: "/admin/courses", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { id: "instructor", thaiTitle: "ระบบจัดการการลงทะเบียนอาจารย์", path: "/admin/instructors", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: "calendar", thaiTitle: "ปฏิทินและกำหนดการ", path: "/admin/calendar", icon: <CalendarIcon className="w-4 h-4" /> },
    { id: "profile", thaiTitle: "ระบบโปรไฟล์ส่วนตัว", path: "/admin/profile", icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4.5 18a8.5 8.5 0 0115 0" /></svg> }
  ];

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]"><Loader2 className="animate-spin text-blue-600 mr-2" /> กำลังโหลดข้อมูล...</div>;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-700 text-left">
      
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 text-left">
          <div className="flex items-center gap-3">
            <div className="bg-[#1638a1] p-2 rounded-xl text-white shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <div className="text-left">
              <h1 className="text-xl font-black text-slate-800 leading-none">QA System</h1>
              <p className="text-[9px] text-[#1638a1] font-bold uppercase tracking-widest mt-1">Administrator</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">เมนูหลัก</div>
          {sidebarMenuItems.map((m) => {
            const isActive = location.pathname === m.path;
            return (
              <button 
                key={m.id} 
                onClick={() => navigate(m.path)} 
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-medium transition-all group text-left ${
                  isActive ? 'bg-blue-50 text-[#1638a1] font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <span className={isActive ? 'text-[#1638a1]' : 'text-slate-400 group-hover:text-slate-500'}>{m.icon}</span>
                <span>{m.thaiTitle}</span>
              </button>
            );
          })}
        </nav>

        {/* ─── ส่วนโปรไฟล์ด้านล่างสุดและปุ่มออกจากระบบ (ปรับปรุงใหม่) ─── */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between gap-2 text-left">
          {/* ข้อมูลโปรไฟล์ (คลิกเพื่อรีเฟรชข้อมูลหน้าเดิม) */}
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group p-2 rounded-xl hover:bg-slate-50 transition-all"
            onClick={() => navigate('/admin/profile')}
          >
            <div className="w-9 h-9 rounded-full bg-[#1638a1] text-white flex items-center justify-center text-xs font-black shadow-sm overflow-hidden shrink-0 border border-slate-100 transition-transform group-hover:scale-105">
              {storeAvatarUrl || profileData.avatarUrl ? (
                <img src={storeAvatarUrl || profileData.avatarUrl} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                storeFullName ? storeFullName.charAt(0).toUpperCase() : 'A'
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 leading-tight truncate">{storeFullName || "Admin User"}</p>
              <p className="text-[9px] text-[#1638a1] font-bold uppercase tracking-wider mt-0.5">Admin</p>
            </div>
          </div>

          {/* ปุ่มออกจากระบบ (เหลือแค่ไอคอน) */}
          <button 
            onClick={() => { supabase.auth.signOut(); navigate('/login'); }} 
            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* HEADER (ปรับปรุงมุมขวาบนออกแล้ว) */}
        <header className="flex justify-between items-center mb-8">
          <div className="text-left">
            <h2 className="text-2xl font-black text-slate-800 leading-tight">โปรไฟล์และการตั้งค่าบัญชี</h2>
            <p className="text-slate-500 text-sm mt-1">จัดการข้อมูลส่วนตัว รูปโปรไฟล์ และการเชื่อมต่อระบบต่างๆ</p>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-[#1638a1] transition-colors group bg-white rounded-full border border-slate-200 shadow-sm">
              <Bell size={20} className="transition-transform group-hover:rotate-12" />
              <div className="absolute top-0 right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
            </button>
          </div>
        </header>

        <div className="w-full space-y-6">
          
          {/* Section 1: ข้อมูลส่วนตัว & รูปถ่าย */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col md:flex-row gap-10">
              
              {/* รูปโปรไฟล์ */}
              <div className="flex flex-col items-center space-y-4 md:w-1/3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className="w-32 h-32 rounded-full bg-gray-50 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    {profileData.avatarUrl ? (
                      <img src={profileData.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon size={48} className="text-gray-300" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={24} />
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={24} className="text-white" />
                  </div>
                </div>
                
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                <p className="text-[10px] text-gray-400">รองรับ JPG, PNG (ไม่เกิน 2MB)</p>
                
                <button onClick={() => fileInputRef.current?.click()} className="text-xs font-bold text-[#1638a1] hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-full transition-colors">
                  เปลี่ยนรูปถ่าย
                </button>
              </div>

              {/* ฟอร์มข้อมูล */}
              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({...profileData, fullName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-100 focus:border-[#1638a1] outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-gray-400" /> อีเมลมหาวิทยาลัย
                  </label>
                  <input 
                    type="email" 
                    disabled
                    value={profileData.email}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-xl cursor-not-allowed text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: ข้อมูลสังกัด (Read-only) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Building size={14} /> หน่วยงาน / ภาควิชา
              </label>
              <div className="text-sm font-bold text-[#1638a1] bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                {profileData.department}
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <label className="block text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <GraduationCap size={14} /> ตำแหน่งระบบ
              </label>
              <div className="text-sm font-bold text-gray-800 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 uppercase">
                {profileData.role}
              </div>
            </div>
          </div>

          {/* Section 3: การเชื่อมต่อภายนอก (MS Teams) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-sm font-black text-gray-800 mb-4 uppercase tracking-wider">การเชื่อมต่อแอปพลิเคชัน (Integrations)</h4>
            <div className="border border-gray-100 rounded-xl p-5 flex items-center justify-between bg-gray-50 hover:border-blue-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#464EB8] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">T</div>
                <div>
                  <h5 className="text-sm font-bold text-gray-900">Microsoft Teams</h5>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {isTeamsConnected ? '✅ เชื่อมต่อแล้วกับบัญชีมหาวิทยาลัย' : 'เชื่อมต่อเพื่อรับการแจ้งเตือนงาน มคอ. ผ่านแชท'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isTeamsConnected && (
                  <button onClick={testSendTeamsNotification} className="px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 bg-white text-[#1638a1] border border-blue-200 hover:bg-blue-50 shadow-sm">
                    <Bell size={14} /> ทดสอบแจ้งเตือน
                  </button>
                )}
                <button onClick={toggleTeamsConnection} className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm ${isTeamsConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}>
                  {isTeamsConnected ? <><CheckCircle2 size={14} /> ยกเลิกการเชื่อมต่อ</> : <><LinkIcon size={14} /> เชื่อมต่อบัญชี</>}
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: ความปลอดภัย (Security) */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h4 className="text-sm font-black text-gray-800 mb-4 uppercase tracking-wider">ความปลอดภัย (Security)</h4>
            <div className="border border-gray-100 rounded-xl p-5 flex items-center justify-between bg-gray-50 hover:border-orange-200 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 shadow-sm">
                  <Lock size={20} />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-gray-900">รหัสผ่านบัญชีผู้ใช้</h5>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">หากสงสัยว่ามีผู้อื่นเข้าถึงบัญชี แนะนำให้เปลี่ยนรหัสผ่านทันที</p>
                </div>
              </div>
              <button onClick={handleResetPassword} className="px-5 py-2.5 text-xs font-bold text-orange-700 bg-white border border-orange-200 rounded-xl hover:bg-orange-50 transition-all flex items-center gap-2 shadow-sm">
                <KeyRound size={14} /> ส่งลิงก์รีเซ็ตรหัส
              </button>
            </div>
          </div>

          {/* ปุ่มบันทึกข้อมูลหลัก */}
          <div className="flex justify-end pt-4 pb-12">
            <button 
              onClick={handleSaveProfile}
              disabled={isSaving || !profileData.fullName.trim()}
              className="flex items-center gap-2 px-8 py-3 text-sm font-bold text-white bg-[#1638a1] rounded-xl hover:bg-blue-800 disabled:opacity-50 transition-all shadow-lg shadow-blue-200"
            >
              {isSaving ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : <><Save size={18} /> บันทึกข้อมูลโปรไฟล์</>}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default ProfilePage;