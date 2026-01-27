import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-store";
import {
  HiOutlineCube,
  HiOutlineRectangleGroup,
  HiOutlineQueueList,
  HiOutlineUserCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import { useState } from "react";

export default function Navbar() {
  const { user, logout, updateRole } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      ADMIN: "bg-purple-100 text-purple-700",
      EXECUTIVE: "bg-blue-100 text-blue-700",
      SALES: "bg-green-100 text-green-700",
      GRAPHIC: "bg-pink-100 text-pink-700",
      STOCK: "bg-orange-100 text-orange-700",
      PRODUCTION: "bg-yellow-100 text-yellow-700",
      SEWING_QC: "bg-teal-100 text-teal-700",
      DELIVERY: "bg-indigo-100 text-indigo-700",
      PURCHASING: "bg-rose-100 text-rose-700",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pastel-indigo/30 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pastel-blue to-pastel-pink rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <HiOutlineCube className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Boon<span className="text-pastel-blue">raksa</span>
            </span>
          </Link>

          {/* Desktop Menu - Role Based */}
          <div className="hidden md:flex items-center gap-6">
            {/* SALES Navigation */}
            {(user?.role === "SALES" || user?.role === "ADMIN") && (
              <>
                <Link
                  to="/orders"
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
                >
                  <HiOutlineQueueList className="w-5 h-5" />
                  ออเดอร์
                </Link>
                <Link
                  to="/order/create"
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
                >
                  <HiOutlineRectangleGroup className="w-5 h-5" />
                  สร้างออเดอร์
                </Link>
                <Link
                  to="/stock-check"
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
                >
                  <HiOutlineQueueList className="w-5 h-5" />
                  เช็คสต็อก
                </Link>
              </>
            )}

            {/* PURCHASING Navigation */}
            {(user?.role === "PURCHASING" || user?.role === "ADMIN") && (
              <Link
                to="/purchasing"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
              >
                <HiOutlineQueueList className="w-5 h-5" />
                จัดซื้อ
              </Link>
            )}

            {/* GRAPHIC Navigation */}
            {(user?.role === "GRAPHIC" || user?.role === "ADMIN") && (
              <Link
                to="/graphic"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
              >
                <HiOutlineRectangleGroup className="w-5 h-5" />
                กราฟิก
              </Link>
            )}

            {/* STOCK Recheck */}
            {(user?.role === "STOCK" || user?.role === "ADMIN") && (
              <Link
                to="/stock-recheck"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
              >
                <HiOutlineCube className="w-5 h-5" />
                เช็คของจริง
              </Link>
            )}

            {/* PRODUCTION Navigation */}
            {(user?.role === "PRODUCTION" || user?.role === "ADMIN") && (
              <Link
                to="/production"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
              >
                <HiOutlineCube className="w-5 h-5" />
                ฝ่ายผลิต
              </Link>
            )}

            {/* SEWING_QC Navigation */}
            {(user?.role === "SEWING_QC" || user?.role === "ADMIN") && (
              <Link
                to="/qc"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
              >
                <HiOutlineCheckBadge className="w-5 h-5 text-teal-500" />
                ฝ่าย QC
              </Link>
            )}

            {/* DELIVERY */}
            {(user?.role === "DELIVERY" || user?.role === "ADMIN") && (
              <Link
                to="/delivery"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
              >
                <HiOutlineRectangleGroup className="w-5 h-5" />
                การจัดส่ง
              </Link>
            )}

            {/* EXECUTIVE/FINANCE Navigation */}
            {(user?.role === "EXECUTIVE" || user?.role === "ADMIN") && (
              <>
                <Link
                  to="/monitor/finance"
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
                >
                  <HiOutlineRectangleGroup className="w-5 h-5" />
                  การเงิน
                </Link>
                <Link
                  to="/monitor/marketing"
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
                >
                  <HiOutlineRectangleGroup className="w-5 h-5" />
                  การตลาด
                </Link>
              </>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                <HiOutlineUserCircle className="w-6 h-6 text-slate-400" />
                <div className="text-sm">
                  <p className="font-bold text-slate-800">{user.name}</p>
                  <select
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-none appearance-none cursor-pointer bg-transparent focus:ring-0 ${getRoleBadgeColor(user.role)}`}
                    value={user.role}
                    onChange={(e) => updateRole(e.target.value)}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="SALES">SALES</option>
                    <option value="PURCHASING">PURCHASING</option>
                    <option value="GRAPHIC">GRAPHIC</option>
                    <option value="STOCK">STOCK</option>
                    <option value="PRODUCTION">PRODUCTION</option>
                    <option value="SEWING_QC">SEWING_QC</option>
                    <option value="DELIVERY">DELIVERY</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
              title="ออกจากระบบ"
            >
              <HiOutlineArrowRightOnRectangle className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-xl font-bold text-slate-800 mb-3">
              ยืนยันการออกจากระบบ
            </h3>
            <p className="text-slate-600 mb-6">คุณต้องการออกจากระบบหรือไม่?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
