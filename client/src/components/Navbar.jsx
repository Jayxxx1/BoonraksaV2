import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/auth-store";
import {
  HiOutlineCube,
  HiOutlineRectangleGroup,
  HiOutlineQueueList,
  HiOutlineUserCircle,
  HiOutlineArrowRightOnRectangle,
  HiOutlineCheckBadge,
  HiOutlineBars3,
  HiOutlineXMark,
} from "react-icons/hi2";
import { useState } from "react";
import NotificationBell from "./NotificationBell";

const getRoleBadgeColor = (role) => {
  const defaultStyle = "bg-slate-100 text-slate-700 border-slate-200";
  const styles = {
    ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-200",
    EXECUTIVE: "bg-blue-50 text-blue-700 border-blue-200",
    SALES: "bg-emerald-50 text-emerald-700 border-emerald-200",
    GRAPHIC: "bg-purple-50 text-purple-700 border-purple-200",
    STOCK: "bg-orange-50 text-orange-700 border-orange-200",
    PRODUCTION: "bg-amber-50 text-amber-700 border-amber-200",
    SEWING_QC: "bg-teal-50 text-teal-700 border-teal-200",
    DELIVERY: "bg-cyan-50 text-cyan-700 border-cyan-200",
    PURCHASING: "bg-rose-50 text-rose-700 border-rose-200",
  };
  return styles[role] || defaultStyle;
};

const NavLinks = ({ user, navLinkClass }) => (
  <>
    {/* SALES / ADMIN */}
    {(user?.role === "SALES" || user?.role === "ADMIN") && (
      <>
        <Link to="/orders" className={navLinkClass("/orders")}>
          <HiOutlineQueueList className="w-4 h-4" />
          <span>รายการสั่งซื้อ</span>
        </Link>
        <Link to="/order/create" className={navLinkClass("/order/create")}>
          <HiOutlineRectangleGroup className="w-4 h-4" />
          <span>สร้างคำสั่งซื้อ</span>
        </Link>
        <Link to="/stock-check" className={navLinkClass("/stock-check")}>
          <HiOutlineCube className="w-4 h-4" />
          <span>ตรวจสอบสต็อก</span>
        </Link>
      </>
    )}

    {/* OTHER ROLES */}
    {(user?.role === "PURCHASING" || user?.role === "ADMIN") && (
      <Link to="/purchasing" className={navLinkClass("/purchasing")}>
        <HiOutlineQueueList className="w-4 h-4" />
        <span>รายการจัดซื้อ</span>
      </Link>
    )}
    {(user?.role === "GRAPHIC" || user?.role === "ADMIN") && (
      <Link to="/graphic" className={navLinkClass("/graphic")}>
        <HiOutlineRectangleGroup className="w-4 h-4" />
        <span>งานกราฟิก</span>
      </Link>
    )}
    {(user?.role === "STOCK" || user?.role === "ADMIN") && (
      <Link to="/stock-recheck" className={navLinkClass("/stock-recheck")}>
        <HiOutlineCube className="w-4 h-4" />
        <span>ตรวจสอบสินค้าจริง</span>
      </Link>
    )}
    {(user?.role === "PRODUCTION" || user?.role === "ADMIN") && (
      <Link to="/production" className={navLinkClass("/production")}>
        <HiOutlineCube className="w-4 h-4" />
        <span>งานผลิต</span>
      </Link>
    )}
    {(user?.role === "SEWING_QC" || user?.role === "ADMIN") && (
      <Link to="/qc" className={navLinkClass("/qc")}>
        <HiOutlineCheckBadge className="w-4 h-4" />
        <span>ตรวจสอบคุณภาพ (QC)</span>
      </Link>
    )}
    {(user?.role === "DELIVERY" || user?.role === "ADMIN") && (
      <Link to="/delivery" className={navLinkClass("/delivery")}>
        <HiOutlineRectangleGroup className="w-4 h-4" />
        <span>งานจัดส่ง</span>
      </Link>
    )}
    {(user?.role === "EXECUTIVE" || user?.role === "ADMIN") && (
      <>
        <Link
          to="/monitor/finance"
          className={navLinkClass("/monitor/finance")}
        >
          <span>ระบบการเงิน</span>
        </Link>
        <Link
          to="/monitor/marketing"
          className={navLinkClass("/monitor/marketing")}
        >
          <span>ระบบการตลาด</span>
        </Link>
      </>
    )}
  </>
);

export default function Navbar() {
  const { user, logout, updateRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const activeClass = (path) =>
    location.pathname === path
      ? "text-indigo-600 bg-indigo-50 border-indigo-200"
      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50 border-transparent";

  const navLinkClass = (path) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-semibold transition-all border ${activeClass(path)}`;

  return (
    <nav className="sticky top-0 z-[60] bg-white border-b border-slate-200 shadow-sm transition-all h-14">
      <div className="max-w-7xl mx-auto px-4 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Brand */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 group shrink-0">
              <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center transition-all group-hover:bg-indigo-600">
                <HiOutlineCube className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 hidden sm:block">
                Boon<span className="text-indigo-600">raksa</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <NavLinks user={user} navLinkClass={navLinkClass} />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <div className="hidden sm:flex items-center gap-3 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg shrink-0">
                  <HiOutlineUserCircle className="w-5 h-5 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-[12px] font-bold text-slate-700 leading-none">
                      {user.name}
                    </span>
                    <select
                      className={`text-[9px] font-black uppercase mt-0.5 px-1 rounded bg-transparent border-none appearance-none cursor-pointer focus:ring-0 ${getRoleBadgeColor(user.role).split(" ").slice(0, 2).join(" ")}`}
                      value={user.role}
                      onChange={(e) => updateRole(e.target.value)}
                    >
                      <option value="ADMIN">ผู้ดูแลระบบ (ADMIN)</option>
                      <option value="SALES">ฝ่ายขาย (SALES)</option>
                      <option value="PURCHASING">
                        ฝ่ายจัดซื้อ (PURCHASING)
                      </option>
                      <option value="GRAPHIC">ฝ่ายกราฟิก (GRAPHIC)</option>
                      <option value="STOCK">ฝ่ายสต็อก (STOCK)</option>
                      <option value="PRODUCTION">ฝ่ายผลิต (PRODUCTION)</option>
                      <option value="SEWING_QC">ฝ่ายตรวจสอบคุณภาพ (QC)</option>
                      <option value="DELIVERY">ฝ่ายจัดส่ง (DELIVERY)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Logout */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all shrink-0"
              title="ออกจากระบบ"
            >
              <HiOutlineArrowRightOnRectangle className="w-5 h-5" />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-md transition-all"
            >
              {isMobileMenuOpen ? (
                <HiOutlineXMark className="w-6 h-6" />
              ) : (
                <HiOutlineBars3 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-14 left-0 w-full bg-white border-b border-slate-200 shadow-xl animate-erp-in">
          <div className="flex flex-col p-4 gap-2 max-h-[calc(100vh-3.5rem)] overflow-y-auto">
            {user && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                <HiOutlineUserCircle className="w-8 h-8 text-slate-400" />
                <div>
                  <p className="font-bold text-slate-800">{user.name}</p>
                  <span
                    className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
            )}
            <div
              className="grid grid-cols-1 gap-1"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <NavLinks user={user} navLinkClass={navLinkClass} />
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              ยืนยันการออกจากระบบ
            </h3>
            <p className="text-slate-500 text-sm mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการออกจากระบบในตอนนี้?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 erp-button erp-button-secondary"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 erp-button bg-rose-500 text-white hover:bg-rose-600 shadow-sm"
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
