import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/useUserStore';

export default function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { role, setUser } = useUserStore();

  useEffect(() => {
    const checkAuth = async () => {
      // 1. Check local Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsAuthenticated(true);
        
        // 2. Fetch role if not already in Zustand store
        if (!role) {
          const { data } = await supabase
            .from('users')
            .select('role, department_id')
            .eq('id', session.user.id)
            .single();
            
          if (data) setUser({ id: session.user.id, role: data.role, departmentId: data.department_id });
        }
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [role, setUser]);

  if (isChecking) {
    return <div className="flex h-screen items-center justify-center">Loading Dashboard...</div>; // Could be a skeleton loader
  }

  // Bounce unauthenticated users to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Optional: Bounce authenticated users who don't have the right role
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render the nested route (e.g., the Dashboard)
  return <Outlet />;
}