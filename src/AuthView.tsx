import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import { fetchUsers, saveUsers } from './api';

interface AuthViewProps {
  onLogin: (user: any) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const users = await fetchUsers();
      
      if (isLogin) {
        const user = users.find((u: any) => u.email === email && u.password === password);
        if (user) {
          if (!user.isApproved && user.email !== 'retrotownuk@gmail.com') {
            setError('ACCOUNT PENDING APPROVAL: Your staff record has been created but an administrator must grant access before you can log in.');
            setLoading(false);
            return;
          }
          onLogin(user);
        } else {
          setError('Invalid email or password');
        }
      } else {
        if (users.find((u: any) => u.email === email)) {
          setError('Email already exists');
          setLoading(false);
          return;
        }
        const newUser = { 
          name, 
          email, 
          password, 
          isApproved: email === 'retrotownuk@gmail.com',
          role: email === 'retrotownuk@gmail.com' ? 'admin' : 'staff'
        };
        users.push(newUser);
        await saveUsers(users);
        
        if (!newUser.isApproved) {
          setError('ACCOUNT CREATED: Please wait for an administrator to approve your access.');
          setIsLogin(true); // Switch to login to show the message
        } else {
          onLogin(newUser);
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#f3f4f6]">
      <div className="w-full max-w-[1000px] h-[600px] bg-white rounded-[48px] shadow-2xl overflow-hidden flex animate-in zoom-in duration-500">
        
        {/* Left Side: Illustration / Brand */}
        <div className="hidden lg:flex flex-1 bg-blue-600 p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500 rounded-full -translate-y-1/2 translate-x-1/2 opacity-20" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-700 rounded-full translate-y-1/2 -translate-x-1/2 opacity-20" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">RackBuilder Pro</h1>
            </div>
            <h2 className="text-5xl font-black leading-[1.1] tracking-tighter uppercase mb-6">
              Internal <br />
              <span className="text-blue-200">Staff Portal</span>
            </h2>
            <p className="text-blue-100 font-medium max-w-sm leading-relaxed">
              Securely manage industrial pipe orders, customer issues, and inventory stock in one centralized dashboard.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-4 text-xs font-bold text-blue-200 uppercase tracking-widest">
            <span className="w-8 h-px bg-blue-400" />
            Empowering Modern Logistics
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-center lg:text-left">
              <h3 className="text-3xl font-black text-gray-800 uppercase tracking-tighter mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                {isLogin ? 'Enter your credentials to access the console' : 'Register for staff access to the dashboard'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-bold flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
                <ShieldCheck className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1 focus-within:scale-[1.02] transition-transform">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Sarah Miller"
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1 focus-within:scale-[1.02] transition-transform">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sarah@rackbuilder.pro"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1 focus-within:scale-[1.02] transition-transform">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-blue-600 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl shadow-blue-200 active:scale-95 flex items-center justify-center gap-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>Processing...</>
                ) : isLogin ? (
                  <>
                    <LogIn className="w-5 h-5" />
                    Secure Login
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Create Staff Record
                  </>
                )}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
              >
                {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
