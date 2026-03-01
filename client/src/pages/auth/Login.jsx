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
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-erp-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-lg shadow-xl shadow-indigo-200/50 mb-4">
            <HiOutlineCube className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Boon<span className="text-indigo-600">raksa</span>
          </h1>
          <p className="text-slate-500 text-[12px] font-bold mt-1.5">
            ระบบจัดการโรงงานเสื้อผ้า
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-2xl shadow-slate-200/50 p-6 md:p-8 border border-slate-100">
          <h2 className="text-lg font-black text-slate-800 mb-5">
            เข้าสู่ระบบ
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-md flex items-start gap-2.5">
              <HiOutlineExclamationCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] font-bold text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 ml-0.5">
                ชื่อผู้ใช้
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.trim())}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-slate-800 text-[13px] font-bold"
                placeholder="กรอกชื่อผู้ใช้"
                disabled={loading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 ml-0.5">
                รหัสผ่าน
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value.trim())}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all text-slate-800 text-[13px] font-bold"
                placeholder="กรอกรหัสผ่าน"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-md font-black text-white text-sm flex items-center justify-center gap-2 transition-all shadow-lg mt-6 ${
                loading
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-[0.98]"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  เข้าสู่ระบบ
                  <HiOutlineArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-3 bg-slate-50 rounded-md border border-slate-100">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              ข้อมูลสำหรับล็อกอินทดสอบ
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
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

        <p className="text-center text-[10px] text-slate-400 mt-5 font-medium">
          © 2026 Boonraksa System. All rights reserved.
        </p>
      </div>
    </div>
  );
}
