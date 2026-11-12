import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserStore } from '../stores/useUserStore';
import { Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
      setError(authError?.message || 'Login failed');
      setLoading(false);
      return;
    }

    // 2. Fetch custom user data (Role & Department)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, department_id, full_name, avatar_url')
      .eq('id', authData.user.id)
      .single();

    if (userError) {
      setError('Failed to fetch user role.');
      setLoading(false);
      return;
    }

    // 3. Populate global store
    setUser({
      id: authData.user.id,
      role: userData.role,
      departmentId: userData.department_id,
      fullName: userData.full_name,
      avatarUrl: userData.avatar_url,
    });

    // 4. Smart Routing based on Role
    if (userData.role === 'Lecturer') navigate('/dashboard/lecturer');
    else if (userData.role === 'Staff') navigate('/dashboard/admin');
    else if (userData.role === 'Department_Head') navigate('/dashboard/department');
    else if (userData.role === 'Executive') navigate('/dashboard/executive');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">QA System Portal</h2>
          <p className="text-sm text-gray-500 mt-2">Sign in to manage your documents</p>
        </div>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              required
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="password"
              required
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}