import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserRole = 'Staff' | 'Lecturer' | 'Department_Head' | 'Executive' | null;

interface UserState {
  id: string | null;
  role: UserRole;
  departmentId: string | null;
  fullName: string | null;
  email: string | null;         
  faculty: string | null;       
  departmentName: string | null;
  avatarUrl: string | null;
  setUser: (data: Partial<UserState>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      id: null,
      role: null,
      departmentId: null,
      fullName: null,
      email: null,
      faculty: null,
      departmentName: null,
      avatarUrl: null,
      setUser: (data) => set((state) => ({ ...state, ...data })),
      clearUser: () => set({ 
        id: null, role: null, departmentId: null, fullName: null, 
        email: null, faculty: null, departmentName: null, avatarUrl: null 
      }),
    }),
    {
      name: 'user-storage', // ชื่อ key ที่จะเก็บใน LocalStorage
    }
  )
);

