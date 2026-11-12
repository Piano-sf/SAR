import React, { useState, useEffect, useRef } from 'react';
import { useUserStore } from '../../stores/useUserStore';
import { supabase } from '../../lib/supabase';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import {
  FileText, BookOpen, Bell, User as UserIcon, LayoutDashboard,
  X, Save, Camera, Mail, Building, GraduationCap, Link as LinkIcon,
  CheckCircle2, Lock, KeyRound, Loader2, Award, LogOut, PieChart,
  AlertCircle, BarChart3
} from 'lucide-react';

const LecturerLayout = () => {
  const {
    id: userId, fullName, role, email,
    faculty: userFaculty, departmentName: userDepartment,
    avatarUrl, setUser
  } = useUserStore();

  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<any[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [editName, setEditName] = useState(fullName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isTeamsConnected, setIsTeamsConnected] = useState(false);
  const navigate = useNavigate();
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [teamsWebhookInput, setTeamsWebhookInput] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const isDeptHead = role === 'Department_Head' || role === 'หัวหน้าสาขา';
  const isExecutive = role === 'Executive' || role === 'ผู้บริหาร';

  // จัดกลุ่มเมนู sidebar ให้เหมาะกับบทบาทที่ใช้งานจริง แทนการไล่เรียงเป็นลิสต์เดียว
  const navSections = [
    {
      title: 'Dashboard',
      items: [
        { to: '/dashboard/lecturer', icon: <LayoutDashboard size={18} />, label: 'ภาพรวม (Dashboard)' },
      ],
    },
    {
      title: 'เอกสารและผลงาน',
      items: [
        { to: '/dashboard/tqf', icon: <FileText size={18} />, label: 'จัดการเอกสาร มคอ.' },
        { to: '/dashboard/portfolio', icon: <BookOpen size={18} />, label: 'ผลงานทางวิชาการ' },
      ],
    },
    ...(isDeptHead || isExecutive
      ? [{
          title: 'การบริหารจัดการ',
          items: [
            ...(isDeptHead ? [{ to: '/dashboard/department', icon: <PieChart size={18} />, label: 'ระบบติดตามภาพรวมสาขา' }] : []),
            ...(isExecutive ? [{ to: '/dashboard/executive', icon: <BarChart3 size={18} />, label: 'รายงานสรุปภาพรวมคณะ' }] : []),
          ],
        }]
      : []),
  ];

  // Sync editName when modal opens
  useEffect(() => {
    if (isProfileOpen) setEditName(fullName || '');
  }, [isProfileOpen, fullName]);

  // Initial data load
  useEffect(() => {
    const loadInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select(`
          full_name, 
          avatar_url, 
          faculty, 
          department_id,
          msteams_webhook_url,
          departments ( name )
        `)
        .eq('id', user.id)
        .single();

      if (data) {
        const dbDeptName = data.departments?.name || 'ไม่ระบุข้อมูลสาขา';

        setUser({
          id: user.id,
          email: user.email,
          fullName: data.full_name,
          avatarUrl: data.avatar_url,
          faculty: 'วิศวกรรมศาสตร์',
          departmentName: dbDeptName
        });
        setIsTeamsConnected(!!data.msteams_webhook_url);
      }

      const { data: tasks } = await supabase
        .from('lecturer_todo_list')
        .select('*')
        .eq('user_id', user.id);

      if (tasks) setPendingTasks(tasks.filter(t => !t.is_completed));
    };

    loadInitialData();
  }, []);

  // Avatar Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files?.length || !userId) return;
      setIsUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars').upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const timestampedUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('users').update({ avatar_url: timestampedUrl }).eq('id', userId);
      if (updateError) throw updateError;

      setUser({ avatarUrl: timestampedUrl });
      alert('อัปโหลดรูปโปรไฟล์สำเร็จ!');
    } catch (err: any) {
      alert('Error uploading avatar: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!userId) return;
    setIsSaving(true);
    const { error } = await supabase
      .from('users').update({ full_name: editName }).eq('id', userId);
    if (!error) {
      setUser({ fullName: editName });
      setIsProfileOpen(false);
      alert('อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว');
    } else alert('เกิดข้อผิดพลาด: ' + error.message);
    setIsSaving(false);
  };

  const toggleTeamsConnection = async () => {
    if (!userId) return;
    if (isTeamsConnected) {
      setIsConfirmModalOpen(true);
    } else {
      setTeamsWebhookInput('');
      setIsTeamsModalOpen(true);
    }
  };

  const handleConfirmDisconnect = async () => {
    const { error } = await supabase
      .from('users').update({ msteams_webhook_url: null }).eq('id', userId);
    
    if (!error) { 
      setIsTeamsConnected(false); 
      setIsConfirmModalOpen(false);
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const handleSaveTeamsWebhook = async () => {
    if (!teamsWebhookInput.trim()) return;
    
    const { error } = await supabase
      .from('users')
      .update({ msteams_webhook_url: teamsWebhookInput.trim() })
      .eq('id', userId);

    if (!error) {
      setIsTeamsConnected(true);
      setIsTeamsModalOpen(false);
    } else {
      alert('เกิดข้อผิดพลาด: ' + error.message);
    }
  };

  const testSendTeamsNotification = async () => {
    const { data } = await supabase.from('users').select('msteams_webhook_url').eq('id', userId).single();
    if (!data?.msteams_webhook_url) { alert('ยังไม่ได้เชื่อมต่อ MS Teams'); return; }
    try {
      const response = await fetch(data.msteams_webhook_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "message",
          attachments: [{
            contentType: "application/vnd.microsoft.card.adaptive",
            content: {
              $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
              type: "AdaptiveCard", version: "1.2",
              body: [
                { type: "TextBlock", text: "🚨 ทดสอบระบบแจ้งเตือน QA_Project", weight: "Bolder", size: "Medium" },
                { type: "TextBlock", text: `สวัสดีค่ะอาจารย์ ${fullName} ระบบเชื่อมต่อกับ MS Teams สำเร็จแล้ว!`, wrap: true }
              ]
            }
          }]
        })
      });
      alert(response.ok ? 'ส่งแจ้งเตือนเข้า Teams สำเร็จ!' : 'ส่งไม่สำเร็จ รหัส: ' + response.status);
    } catch { alert('เกิดข้อผิดพลาดในการส่งข้อความ'); }
  };

  const handleResetPassword = async () => {
    if (!window.confirm('ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณ ยืนยันหรือไม่?')) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: 'http://localhost:5173/dashboard/lecturer'
      });
      alert(!error ? 'ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลของคุณแล้ว' : 'เกิดข้อผิดพลาด: ' + error.message);
    } else alert('ไม่พบข้อมูลอีเมลในระบบ');
  };

  const handleLogout = async () => {
    const isConfirm = window.confirm('คุณต้องการออกจากระบบใช่หรือไม่?');
    if (!isConfirm) return;

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser({
        id: '',
        email: '',
        fullName: '',
        avatarUrl: '',
        faculty: '',
        departmentName: '',
        role: ''
      });

      navigate('/login', { replace: true }); 
    } catch (error: any) {
      alert('เกิดข้อผิดพลาดในการออกจากระบบ: ' + error.message);
    }
  };

  const pageTitle = location.pathname.includes('/tqf')
    ? 'จัดการเอกสาร มคอ.'
    : location.pathname.includes('/portfolio')
    ? 'ผลงานทางวิชาการ'
    : location.pathname.includes('/department')
    ? 'ระบบติดตามภาพรวมสาขา'
    : location.pathname.includes('/executive')
    ? 'รายงานสรุปภาพรวมคณะ'
    : 'ภาพรวมอาจารย์ผู้สอน';

  return (
    <div className="h-screen bg-gray-50 font-sans text-gray-800 flex overflow-hidden">

      {/* ─── Sidebar ─── */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen z-20 shrink-0">
        <div className="p-6 border-b border-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="text-blue-600">
              <FileText size={26} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-blue-600">QA System</h1>
          </div>
          <p className="text-[12px] text-gray-500 mt-2 font-medium pl-1">ระบบจัดการงานประกันคุณภาพ</p>
        </div>

        <nav className="flex-1 px-4 space-y-5 pt-5">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="text-xs font-semibold text-gray-400 px-3 mb-2">{section.title}</p>
              <div className="space-y-1">
                {section.items.map(({ to, icon, label }) => {
                  const active = to === '/dashboard/lecturer'
                    ? location.pathname === to
                    : location.pathname.includes(to.split('/').pop()!);
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                        active ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {icon} {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ─── ส่วนโปรไฟล์ด้านล่างขนานกับไอคอนล็อกเอาท์เดี่ยว ─── */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between gap-2 text-left bg-white">
          <div 
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group p-1.5 rounded-xl hover:bg-gray-50 transition-all"
            onClick={() => setIsProfileOpen(true)}
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black shadow-sm overflow-hidden shrink-0 border border-gray-100 transition-transform group-hover:scale-105">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                fullName ? fullName.charAt(0).toUpperCase() : 'L'
              )}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-gray-800 leading-tight truncate">{fullName || "Lecturer User"}</p>
              <p className="text-[9px] text-blue-600 font-bold uppercase tracking-wider mt-0.5 truncate">
                {role ? role.replace('_', ' ') : 'Lecturer'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout} 
            className="w-9 h-9 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
            title="ออกจากระบบ"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* ─── Main Area ─── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{pageTitle}</h2>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              >
                <Bell size={20} />
                {pendingTasks.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900">การแจ้งเตือน</h3>
                    {pendingTasks.length > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        {pendingTasks.length} รายการ
                      </span>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {pendingTasks.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-sm">🎉 ไม่มีงานค้างส่ง เยี่ยมมาก!</div>
                    ) : (
                      pendingTasks.map((task, idx) => (
                        <div key={idx} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 flex gap-3">
                          <span className="mt-1.5 flex h-2 w-2 rounded-full bg-red-500 flex-shrink-0"></span>
                          <div>
                            <p className="text-sm text-gray-800 font-medium">
                              {task.task_type === 'RESEARCH' ? 'แจ้งเตือน: ส่งผลงานวิจัย' : `แจ้งเตือน: ส่ง ${task.task_type}`}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{task.task_title}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {pendingTasks.length > 0 && (
                    <div className="px-4 py-2 border-t border-gray-50 bg-gray-50/50 text-center">
                      <Link to="/dashboard/tqf" onClick={() => setIsNotifOpen(false)} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                        ไปที่หน้าจัดการเอกสาร →
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* ─── Profile Modal ─── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 sticky top-0 z-10">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <UserIcon size={20} className="text-blue-600" />
                โปรไฟล์และการตั้งค่าบัญชี
              </h3>
              <button onClick={() => setIsProfileOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-200 p-1.5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center space-y-4 md:w-1/3">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                      {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <UserIcon size={48} className="text-gray-300" />}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-full">
                          <Loader2 className="animate-spin text-blue-600" size={24} />
                        </div>
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                  <p className="text-[10px] text-gray-400">รองรับ JPG, PNG (ขนาดไม่เกิน 2MB)</p>
                  <button onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-1.5 rounded-full transition-colors">เปลี่ยนรูปถ่าย</button>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5"><Mail size={14} className="text-gray-400" /> อีเมล</label>
                    <input type="email" disabled value={email || ''} className="w-full px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-lg cursor-not-allowed" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5"><Building size={14} /> คณะ</label>
                  <div className="text-sm font-medium text-gray-800 bg-white px-3 py-2 rounded-md border border-gray-200">{userFaculty || 'ไม่ระบุข้อมูลคณะ'}</div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1.5"><GraduationCap size={14} /> สาขาวิชา</label>
                  <div className="text-sm font-medium text-gray-800 bg-white px-3 py-2 rounded-md border border-gray-200">{userDepartment || 'ไม่ระบุข้อมูลสาขา'}</div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">การเชื่อมต่อแอปพลิเคชัน</h4>
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-[#464EB8] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">T</div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">Microsoft Teams</h5>
                      <p className="text-xs text-gray-500">{isTeamsConnected ? 'เชื่อมต่อแล้วกับบัญชีมหาวิทยาลัย' : 'เชื่อมต่อเพื่อรับการแจ้งเตือนงานผ่านแชท'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isTeamsConnected && (
                      <button onClick={testSendTeamsNotification} className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"><Bell size={16} /> ทดสอบแจ้งเตือน</button>
                    )}
                    <button onClick={toggleTeamsConnection} className={`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all ${isTeamsConnected ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>{isTeamsConnected ? <><CheckCircle2 size={16} /> สวิทช์บัญชี / ยกเลิก</> : <><LinkIcon size={16} /> เชื่อมต่อบัญชี</>}</button>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">ความปลอดภัย</h4>
                <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between bg-white hover:border-orange-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 shadow-sm"><Lock size={20} /></div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-900">รหัสผ่านบัญชีผู้ใช้</h5>
                      <p className="text-xs text-gray-500">หากสงสัยว่ามีผู้อื่นเข้าถึงบัญชี แนะนำให้เปลี่ยนรหัสผ่านทันที</p>
                    </div>
                  </div>
                  <button onClick={handleResetPassword} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-orange-50 hover:text-orange-700 flex items-center gap-2"><KeyRound size={16} /> ส่งลิงก์รีเซ็ตรหัส</button>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/80 sticky bottom-0">
              <button onClick={() => setIsProfileOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">ปิด</button>
              <button onClick={handleSaveProfile} disabled={isSaving || !editName.trim()} className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm">{isSaving ? 'กำลังบันทึก...' : <><Save size={16} /> บันทึกการเปลี่ยนแปลง</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Teams Webhook Modal --- */}
      {isTeamsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#464EB8] rounded-xl flex items-center justify-center text-white"><LinkIcon size={20} /></div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">เชื่อมต่อ Microsoft Teams</h3>
                  <p className="text-xs text-gray-500">กรุณาวางลิงก์ Webhook สำหรับรับแจ้งเตือน</p>
                </div>
              </div>
              <textarea rows={3} value={teamsWebhookInput} onChange={(e) => setTeamsWebhookInput(e.target.value)} placeholder="https://outlook.office.com/webhook/..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono bg-gray-50" />
              <div className="flex gap-3 mt-6">
                <button onClick={() => setIsTeamsModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl">ยกเลิก</button>
                <button onClick={handleSaveTeamsWebhook} disabled={!teamsWebhookInput.trim()} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#464EB8] rounded-xl">เชื่อมต่อทันที</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- Disconnect Confirmation Modal --- */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-900/40 backdrop-blur-[2px] p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4"><AlertCircle size={32} /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">ยืนยันการยกเลิก</h3>
              <p className="text-sm text-gray-500 mb-6">คุณต้องการยกเลิกการเชื่อมต่อกับ Microsoft Teams ใช่หรือไม่?</p>
              <div className="flex gap-3">
                <button onClick={() => setIsConfirmModalOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl">ไว้ก่อน</button>
                <button onClick={handleConfirmDisconnect} className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl">ยืนยันการลบ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturerLayout;