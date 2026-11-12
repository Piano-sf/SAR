import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle2, Download, Search, Filter, Eye, AlertCircle, BarChart3, PieChart, BookOpen, Award, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUserStore } from '../../stores/useUserStore';

interface StaffTracking {
  id: string;
  lecturer_name: string;
  lecturer_dept: string;
  course_code: string;
  course_name: string;
  tqf3_status: 'pending' | 'draft' | 'submitted';
  tqf5_status: 'pending' | 'draft' | 'submitted';
}

interface PortfolioRecord {
  id: string;
  lecturer_name: string;
  title: string;
  type: string;
  weight: number;
  academic_year: number;
  file_url?: string;
}

export default function DepartmentOverview() {
  const userId = useUserStore((state: any) => state.id);

  const [dbDeptName, setDbDeptName] = useState<string>('กำลังโหลด...');
  const [dbDeptId, setDbDeptId] = useState<string | null>(null);

  const [trackingData, setTrackingData] = useState<StaffTracking[]>([]);
  const [portfolioData, setPortfolioData] = useState<PortfolioRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'TQF' | 'PORTFOLIO'>('TQF');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!userId) return;
      setIsLoading(true);
      setFetchError(null);

      try {
        // STEP 0: department_id ของหัวหน้าสาขาที่ล็อกอินอยู่
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('department_id')
          .eq('id', userId)
          .single();

        if (userError) throw new Error(`users: ${userError.message}`);
        if (!userData?.department_id) {
          setDbDeptName('ไม่พบข้อมูลสาขา');
          setIsLoading(false);
          return;
        }

        const currentDeptId = userData.department_id;
        setDbDeptId(currentDeptId);

        // ดึงชื่อสาขาทั้งหมดไว้ครั้งเดียว ใช้ทั้งโชว์ชื่อสาขาตัวเองและ map ชื่อสาขาของอาจารย์แต่ละคน
        const { data: allDepts, error: allDeptsError } = await supabase.from('departments').select('id, name');
        if (allDeptsError) throw new Error(`departments: ${allDeptsError.message}`);

        const currentDeptName = allDepts?.find(d => d.id === currentDeptId)?.name || 'ไม่ระบุ';
        setDbDeptName(currentDeptName);

        // =========================================================
        // STEP 1: วิชาของสาขานี้ + สถานะ มคอ. (อ่านจาก courses ตรงๆ ไม่ต้องพึ่งตาราง submissions)
        // =========================================================
        const { data: courses, error: coursesError } = await supabase
          .from('courses')
          .select('id, code, name, tqf3_status, tqf5_status')
          .eq('department_id', currentDeptId);

        if (coursesError) throw new Error(`courses: ${coursesError.message}`);

        const courseIds = (courses || []).map(c => c.id);

        // ผู้สอนของวิชาเหล่านี้ (แยก query กัน embed ซ้อนพังเหมือนที่เจอมาก่อน)
        let links: { course_id: string; teacher_id: string }[] = [];
        if (courseIds.length > 0) {
          const { data: linksData, error: linksError } = await supabase
            .from('course_instructors')
            .select('course_id, teacher_id')
            .in('course_id', courseIds);
          if (linksError) throw new Error(`course_instructors: ${linksError.message}`);
          links = linksData || [];
        }

        const teacherIds = Array.from(new Set(links.map(l => l.teacher_id)));
        let teacherById: Record<string, { full_name: string; department_id: string | null }> = {};
        if (teacherIds.length > 0) {
          const { data: teachersData, error: teachersError } = await supabase
            .from('users')
            .select('id, full_name, department_id')
            .in('id', teacherIds);
          if (teachersError) throw new Error(`users (teachers): ${teachersError.message}`);
          teacherById = Object.fromEntries((teachersData || []).map(t => [t.id, { full_name: t.full_name, department_id: t.department_id }]));
        }

        // สร้าง 1 แถวต่อ 1 คู่ (วิชา, ผู้สอน) — ถ้าวิชาไหนยังไม่มีผู้สอนเลย ให้โชว์เป็น "ยังไม่ระบุผู้สอน" หนึ่งแถว
        const formattedTracking: StaffTracking[] = [];
        (courses || []).forEach(c => {
          const courseLinks = links.filter(l => l.course_id === c.id);
          if (courseLinks.length === 0) {
            formattedTracking.push({
              id: c.id,
              lecturer_name: 'ยังไม่ระบุผู้สอน',
              lecturer_dept: currentDeptName,
              course_code: c.code,
              course_name: c.name,
              tqf3_status: (c.tqf3_status as any) || 'pending',
              tqf5_status: (c.tqf5_status as any) || 'pending',
            });
            return;
          }
          courseLinks.forEach(l => {
            const teacher = teacherById[l.teacher_id];
            const teacherDeptName = allDepts?.find(d => d.id === teacher?.department_id)?.name || 'ไม่ระบุสาขา';
            formattedTracking.push({
              id: `${c.id}-${l.teacher_id}`,
              lecturer_name: teacher?.full_name || 'ไม่ทราบชื่อ',
              lecturer_dept: teacherDeptName,
              course_code: c.code,
              course_name: c.name,
              tqf3_status: (c.tqf3_status as any) || 'pending',
              tqf5_status: (c.tqf5_status as any) || 'pending',
            });
          });
        });

        setTrackingData(formattedTracking);

        // =========================================================
        // STEP 2: ผลงานวิชาการของอาจารย์ในสาขานี้ (แยก query แทน nested embed)
        // =========================================================
        const { data: deptUsers, error: deptUsersError } = await supabase
          .from('users')
          .select('id, full_name')
          .eq('department_id', currentDeptId);

        if (deptUsersError) throw new Error(`users (dept): ${deptUsersError.message}`);

        const deptUserIds = (deptUsers || []).map(u => u.id);
        const nameById = Object.fromEntries((deptUsers || []).map(u => [u.id, u.full_name]));

        let works: any[] = [];
        if (deptUserIds.length > 0) {
          const { data: worksData, error: worksError } = await supabase
            .from('academic_works')
            .select('id, title, work_type, weight, publication_year, file_url, user_id')
            .in('user_id', deptUserIds);
          if (worksError) throw new Error(`academic_works: ${worksError.message}`);
          works = worksData || [];
        }

        const formattedPortfolio: PortfolioRecord[] = works.map(w => ({
          id: w.id,
          lecturer_name: nameById[w.user_id] || 'ไม่ทราบชื่อ',
          title: w.title,
          type: w.work_type,
          weight: Number(w.weight) || 0,
          academic_year: w.publication_year,
          file_url: w.file_url,
        }));

        setPortfolioData(formattedPortfolio);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setFetchError(error.message || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [userId]);

  const totalCourses = trackingData.length;
  const tqf3Submitted = trackingData.filter(d => d.tqf3_status === 'submitted').length;
  const tqf5Submitted = trackingData.filter(d => d.tqf5_status === 'submitted').length;
  const totalPortfolios = portfolioData.length;

  const tqf3Progress = totalCourses > 0 ? Math.round((tqf3Submitted / totalCourses) * 100) : 0;
  const tqf5Progress = totalCourses > 0 ? Math.round((tqf5Submitted / totalCourses) * 100) : 0;

  const filteredTQF = trackingData.filter(item => {
    const matchesSearch = item.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.course_code.toLowerCase().includes(searchQuery.toLowerCase());
    if (filterStatus === 'complete') return matchesSearch && item.tqf3_status === 'submitted' && item.tqf5_status === 'submitted';
    if (filterStatus === 'incomplete') return matchesSearch && (item.tqf3_status !== 'submitted' || item.tqf5_status !== 'submitted');
    if (filterStatus === 'external') return matchesSearch && item.lecturer_dept !== dbDeptName;
    return matchesSearch;
  });

  const filteredPortfolio = portfolioData.filter(item => {
    return item.lecturer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleExport = () => {
    let csvContent = "";
    let fileName = "";

    if (activeTab === 'TQF') {
      const headers = ['ชื่ออาจารย์', 'สังกัด', 'รหัสวิชา', 'ชื่อวิชา', 'สถานะ มคอ.3', 'สถานะ มคอ.5'];
      csvContent = [headers.join(','), ...filteredTQF.map(d => `"${d.lecturer_name}","${d.lecturer_dept}","${d.course_code}","${d.course_name}","${d.tqf3_status}","${d.tqf5_status}"`)].join('\n');
      fileName = `รายงานสถานะ_มคอ_${dbDeptName}.csv`;
    } else {
      const headers = ['ชื่ออาจารย์', 'ชื่อผลงาน', 'ประเภท', 'ค่าน้ำหนัก', 'ปีที่เผยแพร่'];
      csvContent = [headers.join(','), ...filteredPortfolio.map(d => `"${d.lecturer_name}","${d.title}","${d.type}","${d.weight}","${d.academic_year}"`)].join('\n');
      fileName = `รายงานผลงานวิชาการ_${dbDeptName}.csv`;
    }

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (url?: string) => {
    if (url && url !== 'url') window.open(url, '_blank', 'noopener,noreferrer');
    else alert('ไม่พบเอกสารอ้างอิง');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'submitted') return <span className="text-green-600 bg-green-50 px-2 py-1 rounded text-[10px] font-bold">ส่งแล้ว</span>;
    if (status === 'draft') return <span className="text-amber-600 bg-amber-50 px-2 py-1 rounded text-[10px] font-bold">ฉบับร่าง</span>;
    return <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded text-[10px] font-bold">ยังไม่ส่ง</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800 animate-in fade-in duration-300">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ─── Header ─── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="text-indigo-600" size={28} />
            ระบบติดตามภาพรวมสาขา
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            สาขาวิชา: <span className="font-semibold text-indigo-700">{dbDeptName}</span> | ดูข้อมูลทั้ง มคอ. และผลงานวิชาการ
          </p>
        </div>

        {fetchError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
            <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-sm font-medium text-red-700">โหลดข้อมูลไม่สำเร็จ</p>
              <p className="text-xs text-red-600 mt-0.5 font-mono break-all">{fetchError}</p>
            </div>
          </div>
        )}

        {/* ─── Monitoring Dashboard ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600"><FileText size={20} /></div>
            <div>
              <p className="text-xs font-medium text-gray-500">วิชาเปิดสอนทั้งหมด</p>
              <h3 className="text-xl font-bold text-gray-900">{totalCourses} <span className="text-xs font-normal text-gray-500">วิชา</span></h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-gray-500">ความคืบหน้า มคอ. 3</p>
              <span className="text-xs font-bold text-blue-600">{tqf3Submitted}/{totalCourses}</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${tqf3Progress}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-right">{tqf3Progress}%</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <p className="text-xs font-medium text-gray-500">ความคืบหน้า มคอ. 5</p>
              <span className="text-xs font-bold text-green-600">{tqf5Submitted}/{totalCourses}</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${tqf5Progress}%` }}></div>
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 text-right">{tqf5Progress}%</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 rounded-2xl text-white shadow-md flex items-center gap-4">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white"><Award size={20} /></div>
            <div>
              <p className="text-xs font-medium text-indigo-100">ผลงานวิชาการรวม</p>
              <h3 className="text-xl font-bold text-white">{totalPortfolios} <span className="text-xs font-normal text-indigo-200">รายการ</span></h3>
            </div>
          </div>
        </div>

        {/* ─── ส่วนแสดงผลเนื้อหา (Table Area) ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">

          <div className="flex border-b border-gray-100 px-6 pt-4 gap-6 bg-gray-50/50">
            <button
              onClick={() => setActiveTab('TQF')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'TQF' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <FileText size={16} /> ติดตามเอกสาร มคอ.
            </button>
            <button
              onClick={() => setActiveTab('PORTFOLIO')}
              className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'PORTFOLIO' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <BookOpen size={16} /> ผลงานทางวิชาการบุคลากร
            </button>
          </div>

          <div className="p-4 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex w-full sm:w-auto items-center gap-3">
              <div className="relative w-full sm:w-72">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search size={16} className="text-gray-400" /></div>
                <input
                  type="text"
                  placeholder={activeTab === 'TQF' ? "ค้นหาชื่ออาจารย์ หรือ รหัสวิชา..." : "ค้นหาชื่ออาจารย์ หรือ ชื่อผลงาน..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white"
                />
              </div>
              {activeTab === 'TQF' && (
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="py-2 px-3 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 cursor-pointer"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="incomplete">⏳ ติดตามเอกสาร (ค้างส่ง)</option>
                  <option value="complete">✅ ส่งครบสมบูรณ์</option>
                  <option value="external">👤 อาจารย์ผู้สอนต่างสาขา</option>
                </select>
              )}
            </div>

            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors w-full sm:w-auto justify-center">
              <Download size={16} /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {activeTab === 'TQF' ? (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/80 text-xs text-gray-500 font-semibold border-b border-gray-100">
                    <th className="p-4 w-[25%]">ชื่อผู้สอน</th>
                    <th className="p-4 w-[25%]">รายวิชา</th>
                    <th className="p-4 w-[15%] text-center">มคอ.3</th>
                    <th className="p-4 w-[15%] text-center">มคอ.5</th>
                    <th className="p-4 w-[20%] text-center">ตรวจสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400"><Loader2 className="inline animate-spin mr-2" size={16} /> กำลังโหลดข้อมูล...</td></tr>
                  ) : filteredTQF.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400">ไม่พบข้อมูล</td></tr>
                  ) : (
                    filteredTQF.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                             {item.lecturer_name.charAt(0) || '?'}
                             </div>
                             <div className="flex flex-col">
                             <span className="font-medium text-gray-900">{item.lecturer_name}</span>
                             <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                                 item.lecturer_dept !== dbDeptName
                                 ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                 : 'text-gray-400'
                             }`}>
                                 {item.lecturer_dept ? `สาขา${item.lecturer_dept}` : 'ไม่ระบุสาขา'}
                             </span>
                             </div>
                         </div>
                        </td>
                        <td className="p-4"><div className="font-bold text-gray-800">{item.course_code}</div><div className="text-[11px] text-gray-500">{item.course_name}</div></td>
                        <td className="p-4 text-center"><StatusBadge status={item.tqf3_status} /></td>
                        <td className="p-4 text-center"><StatusBadge status={item.tqf5_status} /></td>
                        <td className="p-4 flex justify-center gap-3">
                          <button onClick={() => handlePreview()} className={`flex items-center gap-1 text-[11px] font-medium ${item.tqf3_status === 'submitted' ? 'text-blue-600 hover:underline' : 'text-gray-300'}`}><Eye size={14}/> 3</button>
                          <span className="text-gray-200">|</span>
                          <button onClick={() => handlePreview()} className={`flex items-center gap-1 text-[11px] font-medium ${item.tqf5_status === 'submitted' ? 'text-blue-600 hover:underline' : 'text-gray-300'}`}><Eye size={14}/> 5</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-50/80 text-xs text-gray-500 font-semibold border-b border-gray-100">
                    <th className="p-4 w-[20%]">ชื่อเจ้าของผลงาน</th>
                    <th className="p-4 w-[40%]">ชื่อผลงานวิชาการ</th>
                    <th className="p-4 w-[15%] text-center">ประเภท</th>
                    <th className="p-4 w-[10%] text-center">ค่าน้ำหนัก</th>
                    <th className="p-4 w-[15%] text-center">ตรวจสอบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400"><Loader2 className="inline animate-spin mr-2" size={16} /> กำลังโหลด...</td></tr>
                  ) : filteredPortfolio.length === 0 ? (
                    <tr><td colSpan={5} className="p-10 text-center text-gray-400">ไม่พบข้อมูลผลงานวิชาการ</td></tr>
                  ) : (
                    filteredPortfolio.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{item.lecturer_name}</td>
                        <td className="p-4 text-gray-700">
                          <div className="font-semibold">{item.title}</div>
                          <div className="text-[10px] text-gray-400">ปีที่เผยแพร่: {item.academic_year}</div>
                        </td>
                        <td className="p-4 text-center"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap">{item.type}</span></td>
                        <td className="p-4 text-center font-bold text-indigo-600">{item.weight.toFixed(2)}</td>
                        <td className="p-4 text-center">
                          <button onClick={() => handlePreview(item.file_url)} className="text-blue-500 hover:text-blue-700 transition-colors inline-flex justify-center" title="ดูเอกสารแนบ">
                            <FileText size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}