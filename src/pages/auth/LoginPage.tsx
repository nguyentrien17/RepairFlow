import React, { useState } from 'react';
import {
  Wrench,
  Lock,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  LogIn,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { StorageService } from '../../services/mockStorage';

interface LoginPageProps {
  onOpenLookup?: () => void;
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenLookup, onLoginSuccess }) => {
  const { login, allUsers } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const settings = StorageService.getSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim()) {
      setErrorMessage('Vui lòng nhập tên đăng nhập hoặc email');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const res = login(username, password);
      setIsLoading(false);

      if (res.success) {
        showToast('Đăng nhập thành công! Chào mừng bạn trở lại.', 'success');
        onLoginSuccess?.();
      } else {
        setErrorMessage(res.message || 'Đăng nhập không thành công');
        showToast(res.message || 'Đăng nhập thất bại', 'error');
      }
    }, 350);
  };

  const handleQuickLogin = (uname: string, pwd?: string) => {
    setUsername(uname);
    const resolvedPwd = pwd || (uname === 'admin' ? 'admin' : '123');
    setPassword(resolvedPwd);
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(uname, resolvedPwd);
      setIsLoading(false);
      if (res.success) {
        showToast(`Đăng nhập thành công với tài khoản: ${uname}!`, 'success');
        onLoginSuccess?.();
      } else {
        setErrorMessage(res.message || 'Không thể đăng nhập');
      }
    }, 250);
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 z-10">
        {/* Left Column: Branding & Feature Highlights */}
        <div className="lg:col-span-5 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />

          <div>
            {/* Brand Logo */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">RepairFlow</h1>
                <span className="text-[11px] font-semibold text-indigo-300 tracking-wider uppercase">
                  Hệ thống Quản lý Sửa chữa
                </span>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <h2 className="text-xl font-bold text-white leading-snug">
                Nền tảng vận hành trung tâm kỹ thuật toàn diện
              </h2>
              <p className="text-xs text-indigo-200 leading-relaxed">
                Chuẩn hóa quy trình 11 bước tiếp nhận, chẩn đoán, linh kiện, kiểm tra chất lượng và thanh toán tự động VietQR.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Ràng buộc trách nhiệm & Trạng thái</h4>
                  <p className="text-[11px] text-indigo-300">KTV phụ trách, QC kiểm thử độc lập, đối soát minh bạch.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Thanh toán VietQR & In hóa đơn</h4>
                  <p className="text-[11px] text-indigo-300">Tự động điền số tiền, đối soát giao dịch ngân hàng & công nợ.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/30 border border-indigo-400/30 flex items-center justify-center shrink-0 mt-0.5 text-indigo-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cổng tra cứu minh bạch cho khách</h4>
                  <p className="text-[11px] text-indigo-300">Khách tra cứu trực tiếp bằng mã phiếu & số điện thoại.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Store Info Footer */}
          <div className="pt-6 mt-8 border-t border-indigo-700/50 text-[11px] text-indigo-300">
            <p className="font-semibold text-white">{settings.store_name}</p>
            <p className="mt-0.5 text-indigo-400">Hotline kỹ thuật: {settings.phone}</p>
          </div>
        </div>

        {/* Right Column: Sign-in Form & Quick Role Access */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Đăng nhập tài khoản</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Nhập tên đăng nhập và mật khẩu để bắt đầu ca làm việc
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                Phiên bản v2.5
              </span>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-medium animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tên đăng nhập hoặc Email <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="VD: admin, letan, kythuat..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Mật khẩu <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">
                    (Tài khoản mẫu: <span className="font-mono text-indigo-600 font-bold">admin</span> hoặc <span className="font-mono text-indigo-600 font-bold">123</span>)
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-600">Ghi nhớ phiên đăng nhập</span>
                </label>

                <span className="text-xs text-indigo-600 hover:underline cursor-pointer">
                  Quên mật khẩu?
                </span>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-indigo-300 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Đăng nhập hệ thống</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick 1-Click Demo Accounts */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Đăng nhập nhanh (1 chạm trải nghiệm)</span>
                </p>
                <span className="text-[10px] text-slate-400">Chọn vai trò</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin', 'admin')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 leading-none">Admin</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Toàn quyền</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('manager', '123')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 leading-none">Quản lý</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Báo cáo & kho</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('letan', '123')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 leading-none">Lễ tân</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Tiếp nhận & thu</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('kythuat', '123')}
                  className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-left group cursor-pointer"
                >
                  <p className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 leading-none">KTV Trưởng</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Sửa & QC</p>
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Customer Portal Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
            <span className="text-slate-500">Khách hàng cần kiểm tra máy đang sửa?</span>
            {onOpenLookup && (
              <button
                type="button"
                onClick={onOpenLookup}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Tra cứu tiến độ ngay</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
