import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { login } from '../../api/auth';
import type { SignInData } from '../../interface/auth/auth';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../store/slices/authSlice';

function Login() {
  const [data, setData] = useState<SignInData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.email || !data.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await login(data);

      if (response.data.access_token) {
        toast.success('Welcome back!');

        localStorage.setItem('access_token', response.data.access_token);

        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
          dispatch(loginSuccess({ user: response.data.user, token: response.data.access_token }));
        }

        navigate('/dashboard');
      } else {
        toast.error('Login failed');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-inter">
      {/* Background blobs for modern look */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 bg-slate-50">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-200/40 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
            <span className="text-white text-3xl font-bold">P</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">POWA AI</h1>
          <p className="text-slate-500 mt-2 font-medium">Elevate your audit workflow</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800">Sign In</h2>
            <p className="text-sm text-slate-400 mt-1">Please enter your details to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <HiOutlineMail size={20} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="block w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder:text-slate-400 font-medium"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                  <HiOutlineLockClosed size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-14 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-slate-700 placeholder:text-slate-400 font-medium"
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <HiOutlineEyeOff size={22} /> : <HiOutlineEye size={22} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 cursor-pointer ${loading ? 'opacity-80 cursor-not-allowed' : ''
                }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm font-medium">
            <span className="text-slate-400">New around here?</span>{' '}
            <Link to="/register" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline transition-all">
              Create an account
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Login;
