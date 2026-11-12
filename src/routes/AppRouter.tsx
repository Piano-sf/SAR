import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/Admin/LoginPage'; 
import LecturerDash from '../pages/Dashboard/LecturerDash';
import AdminDash from '../pages/Dashboard/AdminDash';
import TqfManagement from '../pages/TqfManagement';
import AcademicPortfolio from '../pages/AcademicPortfolio';
import ResetPassword from '../pages/Auth/ResetPassword';
import LecturerLayout from '../pages/Dashboard/Lecturerlayout';
import DepartmentOverview from '../pages/Dashboard/DepartmentOverview';
import ExecutiveDash from '../pages/Dashboard/Executivedash';

// --- ฝั่ง Admin ที่เพิ่งสร้างใหม่ ---
import CoursePage from '../pages/Admin/CoursePage';
import InstructorPage from '../pages/Admin/InstructorPage';
import ProfilePage from '../pages/Admin/ProfilePage';
import CalendarPage from '../pages/Admin/CalendarPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin/main" element={<AdminDash />} />
        <Route path="/admin/courses" element={<CoursePage />} />
        <Route path="/admin/instructors" element={<InstructorPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route path="/admin/calendar" element={<CalendarPage />} />

        {/* Protected Routes (Requires Login) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<LecturerLayout />}>
            <Route path="/dashboard/lecturer" element={<LecturerDash />} />
            <Route path="/dashboard/tqf" element={<TqfManagement />} />
            <Route path="/dashboard/portfolio" element={<AcademicPortfolio />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard/department" element={<DepartmentOverview />} />
            <Route path="/dashboard/executive" element={<ExecutiveDash />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={['Staff', 'Executive']} />}>
            <Route path="/dashboard/admin" element={<AdminDash />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}