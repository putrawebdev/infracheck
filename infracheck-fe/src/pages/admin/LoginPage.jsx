import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import Spinner from '../../components/ui/Spinner';
import useAuth from '../../hooks/useAuth';
import infracheckLogo from '../../../assets/Icon.png';
import rightSideImg from '../../../assets/Right-side-login.jpeg';

const LoginPage = () => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/admin/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMessage) {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.email.trim() || !credentials.password) {
      setErrorMessage('Email dan kata sandi wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      await login(credentials);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Gagal masuk. Periksa kembali email dan kata sandi Anda.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="login-page-container"
      className="min-h-screen w-full bg-[#111316] text-white flex flex-col lg:flex-row items-center justify-between font-['Poppins',sans-serif] p-4 sm:p-6 lg:p-8 select-none"
    >
      {/* Left Form Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between items-center min-h-full py-4 lg:py-8 px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20">
        {/* Back Link Top Left */}
        <div className="w-full max-w-[480px] flex justify-start mb-6 lg:mb-0">
          <Link
            id="login-back-to-public"
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E2229] hover:bg-[#282E37] text-slate-400 hover:text-white text-xs sm:text-sm font-medium border border-slate-700/50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Center Login Form Content */}
        <div className="w-full max-w-[480px] my-auto py-6 sm:py-8">
          <h1
            id="login-heading"
            className="text-4xl sm:text-5xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif] mb-3"
          >
            Admin Access
          </h1>
          <p className="text-base sm:text-lg text-[#8E95A2] font-['Poppins',sans-serif] mb-10">
            Login untuk mengakses sistem admin
          </p>

          {/* Error Alert */}
          {errorMessage && (
            <div
              id="login-error-alert"
              className="mb-6 p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-200 text-sm sm:text-base flex items-center gap-3 shadow-md"
            >
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Email Field */}
            <div className="relative flex items-center group">
              <div className="absolute left-5 pointer-events-none text-[#8E95A2] group-focus-within:text-white transition-colors">
                <Mail className="w-6 h-6" />
              </div>
              <input
                id="login-email"
                name="email"
                type="email"
                placeholder="Email"
                value={credentials.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
                className="w-full h-14 sm:h-15 rounded-full bg-[#242830] hover:bg-[#282D36] focus:bg-[#242830] border border-[#353B47] focus:border-[#4E649E] focus:ring-2 focus:ring-[#4E649E]/30 text-base sm:text-lg text-white placeholder-[#7A8392] pl-15 pr-5 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-['Poppins',sans-serif]"
              />
            </div>

            {/* Password Field */}
            <div className="relative flex items-center group">
              <div className="absolute left-5 pointer-events-none text-[#8E95A2] group-focus-within:text-white transition-colors">
                <Lock className="w-6 h-6" />
              </div>
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="current-password"
                className="w-full h-14 sm:h-15 rounded-full bg-[#242830] hover:bg-[#282D36] focus:bg-[#242830] border border-[#353B47] focus:border-[#4E649E] focus:ring-2 focus:ring-[#4E649E]/30 text-base sm:text-lg text-white placeholder-[#7A8392] pl-15 pr-14 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed font-['Poppins',sans-serif]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
                tabIndex={-1}
                className="absolute right-5 p-1.5 rounded-full text-[#8E95A2] hover:text-white transition-colors cursor-pointer"
                aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Centered Login Pill Button */}
            <div className="pt-6 flex justify-center">
              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-48 sm:w-56 h-13 sm:h-14 rounded-full bg-[#3F5287] hover:bg-[#4D63A4] active:bg-[#364775] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed text-white font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-base sm:text-lg tracking-wide shadow-lg shadow-indigo-950/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" color="white" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer bottom info */}
        <div className="w-full max-w-[480px] flex justify-start text-xs text-slate-500 mt-4">
          <span>&copy; {new Date().getFullYear()} InfraCheck</span>
        </div>
      </div>

      {/* Right Side Illustration Card */}
      <div className="w-full lg:w-1/2 h-[340px] sm:h-[440px] lg:h-[calc(100vh-4rem)] p-2 sm:p-4 lg:p-6 lg:pr-2 xl:pr-4 flex items-center justify-center lg:justify-end">
        <div className="relative w-full max-w-2xl xl:max-w-3xl h-full rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl bg-[#1D222A] border border-white/5">
          {/* Main Illustration Image */}
          <img
            src={rightSideImg}
            alt="InfraCheck Scene"
            className="w-full h-full object-cover object-center select-none"
          />

          {/* InfraCheck Logo in Top Right Corner */}
          <div className="absolute top-5 right-5 sm:top-7 sm:right-7 z-10">
            <img
              src={infracheckLogo}
              alt="InfraCheck Logo"
              className="h-11 sm:h-13 md:h-15 w-auto object-contain drop-shadow-lg select-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

