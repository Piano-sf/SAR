import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentList from './pages/DocumentList';
import DocumentForm from './pages/DocumentForm';
import UserList from './pages/UserList';
import AcademicWorks from './pages/AcademicWorks';
import AcademicWorkForm from './pages/AcademicWorkForm';
import TQFForm from './pages/TQFForm';
import DeadlineSettings from './pages/DeadlineSettings';
import DocumentPreview from './pages/DocumentPreview';
import NotificationList from './pages/NotificationList';
import AdminApproval from './pages/AdminApproval';

// สร้าง Component หุ้มเพื่อเช็คว่าหน้านี้ต้องมี Sidebar มั้ย
const AppLayout = ({ children }) => {
  return <DashboardLayout>{children}</DashboardLayout>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* หน้า Login (ไม่มี Sidebar) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* หน้า Dashboard และอื่นๆ (มี Sidebar) */}
        <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
        <Route path="/documents" element={<AppLayout><DocumentList /></AppLayout>} />
        <Route path="/documents/edit" element={<AppLayout><DocumentForm /></AppLayout>} />
        <Route path="/users" element={<AppLayout><UserList /></AppLayout>} />
        <Route path="/academic-works" element={<AppLayout><AcademicWorks /></AppLayout>} />
        <Route path="/academic-works/new" element={<AppLayout><AcademicWorkForm /></AppLayout>} />
        <Route path="/documents" element={<AppLayout><DocumentList /></AppLayout>} />
        <Route path="/documents/new" element={<AppLayout><TQFForm /></AppLayout>} />
        <Route path="/settings" element={<AppLayout><DeadlineSettings /></AppLayout>} />
        <Route path="/documents/preview" element={<AppLayout><DocumentPreview /></AppLayout>} />
        <Route path="/notifications" element={<AppLayout><NotificationList /></AppLayout>} />
        <Route path="/approvals" element={<AppLayout><AdminApproval /></AppLayout>} />
        
        {/* กรณีพิมพ์มั่ว ให้เด้งกลับ Dashboard */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;