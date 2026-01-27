import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineCube,
  HiOutlineArrowRight,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate("/");
    } else {
      setError(result.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pastel-blue to-pastel-pink rounded-3xl shadow-xl shadow-indigo-200/50 mb-4">
            <HiOutlineCube className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Boon<span className="text-pastel-blue">raksa</span>
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            ระบบจัดการโรงงานเสื้อผ้า
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-10 border border-slate-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">
            เข้าสู่ระบบ
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-slate-800 font-medium"
                placeholder="กรอกชื่อผู้ใช้"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-slate-800 font-medium"
                placeholder="กรอกรหัสผ่าน"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-bold text-white text-lg flex items-center justify-center gap-2 transition-all shadow-xl mt-8 ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-pastel-blue hover:from-indigo-700 hover:to-indigo-600 hover:shadow-2xl hover:-translate-y-0.5 active:scale-95"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <HiOutlineArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              ข้อมูลทดสอบ
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Username:</span>
                <p className="font-mono font-bold text-slate-700">admin</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Password:</span>
                <p className="font-mono font-bold text-slate-700">
                  password123
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          © 2026 Boonraksa System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
