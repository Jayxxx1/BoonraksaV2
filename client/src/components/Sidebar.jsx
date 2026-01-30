/* eslint-disable no-unused-vars */
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
  HiOutlineChartBarSquare,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
} from "react-icons/hi2";
import { useState } from "react";

const getRoleBadgeColor = (role) => {
  const styles = {
    ADMIN: "bg-indigo-50 text-indigo-700 border-indigo-100",
    EXECUTIVE: "bg-blue-50 text-blue-700 border-blue-100",
    SALES: "bg-emerald-50 text-emerald-700 border-emerald-100",
    GRAPHIC: "bg-purple-50 text-purple-700 border-purple-100",
    STOCK: "bg-orange-50 text-orange-700 border-orange-100",
    PRODUCTION: "bg-amber-50 text-amber-700 border-amber-100",
    SEWING_QC: "bg-teal-50 text-teal-700 border-teal-100",
    DELIVERY: "bg-cyan-50 text-cyan-700 border-cyan-100",
    PURCHASING: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return styles[role] || "bg-slate-50 text-slate-600 border-slate-100";
};

const NavItem = ({ to, icon: Icon, label, isActive, onClick, isCollapsed }) => (
  <Link
    to={to}
    onClick={onClick}
    title={isCollapsed ? label : ""}
    className={`flex items-center gap-2.5 rounded-lg text-[13px] font-bold transition-all duration-300 border ${
      isCollapsed
        ? "lg:px-0 lg:justify-center h-9 lg:w-9 lg:mx-auto px-3 py-1.5"
        : "px-3 py-1.5"
    } ${
      isActive
        ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-transparent"
    }`}
  >
    <Icon
      className={`shrink-0 ${isCollapsed ? "lg:w-5 lg:h-5 w-4 h-4" : "w-4 h-4"} ${isActive ? "text-white" : "text-slate-400"}`}
    />
    <span className={`truncate ${isCollapsed ? "lg:hidden" : ""}`}>
      {label}
    </span>
  </Link>
);

export default function Sidebar({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}) {
  const { user, logout, updateRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const menuGroups = [
    {
      label: "งานขายและลูกค้า",
      roles: ["SALES", "ADMIN"],
      links: [
        { to: "/orders", label: "รายการสั่งซื้อ", icon: HiOutlineQueueList },
        {
          to: "/order/create",
          label: "เปิดออเดอร์ใหม่",
          icon: HiOutlineRectangleGroup,
        },
        { to: "/stock-check", label: "เช็คสต็อกสินค้า", icon: HiOutlineCube },
      ],
    },
    {
      label: "ฝ่ายผลิตและกราฟิก",
      roles: ["GRAPHIC", "PRODUCTION", "SEWING_QC", "ADMIN"],
      links: [
        {
          to: "/graphic",
          label: "งานกราฟิก",
          icon: HiOutlineRectangleGroup,
          roles: ["GRAPHIC", "ADMIN"],
        },
        {
          to: "/production",
          label: "งานผลิต",
          icon: HiOutlineCube,
          roles: ["PRODUCTION", "ADMIN"],
        },
        {
          to: "/qc",
          label: "งานตรวจสอบ (QC)",
          icon: HiOutlineCheckBadge,
          roles: ["SEWING_QC", "ADMIN"],
        },
      ],
    },
    {
      label: "คลังและจัดส่ง",
      roles: ["STOCK", "PURCHASING", "DELIVERY", "ADMIN"],
      links: [
        {
          to: "/purchasing",
          label: "รายการจัดซื้อ",
          icon: HiOutlineQueueList,
          roles: ["PURCHASING", "ADMIN"],
        },
        {
          to: "/stock-recheck",
          label: "ตรวจสอบสินค้าจริง",
          icon: HiOutlineCube,
          roles: ["STOCK", "ADMIN"],
        },
        {
          to: "/delivery",
          label: "งานจัดส่งสินค้า",
          icon: HiOutlineRectangleGroup,
          roles: ["DELIVERY", "ADMIN"],
        },
      ],
    },
    {
      label: "รายงานและการเงิน",
      roles: ["EXECUTIVE", "ADMIN", "MARKETING", "FINANCE"],
      links: [
        {
          to: "/monitor/finance",
          label: "ระบบการเงิน",
          icon: HiOutlineChartBarSquare,
          roles: ["EXECUTIVE", "ADMIN", "FINANCE"],
        },
        {
          to: "/monitor/marketing",
          label: "ระบบการตลาด",
          icon: HiOutlineChartBarSquare,
          roles: ["EXECUTIVE", "ADMIN", "MARKETING"],
        },
      ],
    },
  ];

  const closeMobile = () => setIsOpen(false);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-[80] bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "lg:w-20 w-60" : "w-60"} flex flex-col group/sidebar`}
      >
        {/* Toggle Button - Desktop Only */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-slate-200 rounded-full items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 shadow-sm z-50 transition-all hover:scale-110"
        >
          {isCollapsed ? (
            <HiOutlineChevronRight className="w-3.5 h-3.5" />
          ) : (
            <HiOutlineChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Logo Section */}
        <div
          className={`h-12 flex items-center border-b border-slate-100 shrink-0 bg-white transition-all duration-300 ${isCollapsed ? "lg:px-0 lg:justify-center px-4" : "px-4"}`}
        >
          <Link
            to="/"
            className="flex items-center gap-2 group"
            onClick={closeMobile}
          >
            <div
              className={`bg-slate-900 rounded-md flex items-center justify-center transition-all group-hover:bg-indigo-600 shadow-sm ${isCollapsed ? "lg:w-8 lg:h-8 w-6 h-6" : "w-6 h-6"}`}
            >
              <HiOutlineCube
                className={`${isCollapsed ? "lg:w-5 lg:h-5 w-3.5 h-3.5" : "w-3.5 h-3.5"} text-white`}
              />
            </div>
            <span
              className={`font-black text-sm tracking-tight text-slate-900 animate-in fade-in slide-in-from-left-1 duration-300 ${isCollapsed ? "lg:hidden" : ""}`}
            >
              Boon<span className="text-indigo-600">raksa</span>
            </span>
          </Link>
          <button
            onClick={closeMobile}
            className={`lg:hidden ml-auto p-1.5 text-slate-400 hover:text-slate-600 rounded-lg`}
          >
            <HiOutlineXMark className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile - Extra Compact */}
        <div
          className={`border-b border-slate-100 bg-slate-50/30 transition-all duration-300 ${isCollapsed ? "lg:p-2 lg:py-4 p-3 flex lg:justify-center" : "p-3"}`}
        >
          <div
            className={`flex items-center ${isCollapsed ? "lg:flex-col lg:gap-2 gap-2.5" : "gap-2.5"}`}
          >
            <div
              className={`rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black border border-indigo-100 shrink-0 transition-all ${isCollapsed ? "lg:w-10 lg:h-10 lg:text-[14px] w-7 h-7 text-[10px]" : "w-7 h-7 text-[10px]"}`}
            >
              {user?.name?.[0] || "U"}
            </div>
            <div
              className={`flex flex-col min-w-0 animate-in fade-in slide-in-from-left-1 duration-300 ${isCollapsed ? "lg:hidden" : ""}`}
            >
              <p className="text-[11px] font-black text-slate-800 truncate leading-none mb-1">
                {user?.name}
              </p>
              <select
                className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border bg-white cursor-pointer focus:ring-0 w-fit ${getRoleBadgeColor(user?.role)}`}
                value={user?.role}
                onChange={(e) => updateRole(e.target.value)}
              >
                <option value="ADMIN">ADMIN</option>
                <option value="SALES">SALES</option>
                <option value="PURCHASING">PURCHASING</option>
                <option value="GRAPHIC">GRAPHIC</option>
                <option value="STOCK">STOCK</option>
                <option value="PRODUCTION">PRODUCTION</option>
                <option value="SEWING_QC">QC</option>
                <option value="DELIVERY">DELIVERY</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
                <option value="MARKETING">MARKETING</option>
                <option value="FINANCE">FINANCE</option>
              </select>
            </div>
            {isCollapsed && (
              <div className="hidden lg:block w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 animate-pulse" />
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav
          className={`flex-1 overflow-y-auto scrollbar-hide transition-all duration-300 ${isCollapsed ? "lg:p-2 lg:space-y-6 p-3 space-y-4" : "p-3 space-y-4"}`}
        >
          {menuGroups.map((group, idx) => {
            const groupVisibleLinks = group.links.filter(
              (l) => !l.roles || l.roles.includes(user?.role),
            );
            if (groupVisibleLinks.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <p
                  className={`px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1.5 animate-in fade-in duration-300 ${isCollapsed ? "lg:hidden" : ""}`}
                >
                  {group.label}
                </p>
                {isCollapsed && (
                  <div className="hidden lg:block border-t border-slate-100 mx-1 my-2" />
                )}
                <div
                  className={`space-y-0.5 ${isCollapsed ? "lg:flex lg:flex-col lg:items-center" : ""}`}
                >
                  {groupVisibleLinks.map((link, lIdx) => (
                    <NavItem
                      key={lIdx}
                      {...link}
                      isActive={location.pathname === link.to}
                      onClick={closeMobile}
                      isCollapsed={isCollapsed}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div
          className={`border-t border-slate-100 bg-white transition-all duration-300 ${isCollapsed ? "lg:p-2 lg:flex lg:justify-center p-3" : "p-3"}`}
        >
          <button
            onClick={() => setShowLogoutConfirm(true)}
            title={isCollapsed ? "ออกจากระบบ" : ""}
            className={`flex items-center text-rose-500 hover:bg-rose-50 rounded-lg transition-all ${
              isCollapsed
                ? "lg:w-10 lg:h-10 lg:justify-center gap-2.5 w-full px-3 py-1.5 text-[12px] font-bold"
                : "gap-2.5 w-full px-3 py-1.5 text-[12px] font-bold"
            }`}
          >
            <HiOutlineArrowRightOnRectangle
              className={`${isCollapsed ? "lg:w-5 lg:h-5 w-4 h-4" : "w-4 h-4"}`}
            />
            <span
              className={`animate-in fade-in duration-300 ${isCollapsed ? "lg:hidden" : ""}`}
            >
              ออกจากระบบ
            </span>
          </button>
        </div>
      </aside>

      {/* Logout Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl p-4 max-w-sm w-full shadow-2xl border border-slate-200">
            <h3 className="text-[14px] font-black text-slate-900 mb-1">
              ออกจากระบบ
            </h3>
            <p className="text-slate-500 text-[12px] font-medium mb-4">
              คุณแน่ใจว่าต้องการออกจากระบบในตอนนี้?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg font-bold text-[11px] hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold text-[11px] hover:bg-rose-700 shadow-sm shadow-rose-200"
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
