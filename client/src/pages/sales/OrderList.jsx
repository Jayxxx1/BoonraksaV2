import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/auth-store";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  HiOutlineArrowLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineDocumentArrowDown,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineFire,
} from "react-icons/hi2";

const statusGroups = {
  ongoing: [
    "PENDING_ARTWORK",
    "DESIGNING",
    "PENDING_PAYMENT",
    "PENDING_STOCK_CHECK",
    "STOCK_ISSUE",
    "IN_PRODUCTION",
  ],
  ready: ["READY_TO_SHIP"],
  completed: ["COMPLETED"],
  cancelled: ["CANCELLED"],
};

export default function OrderList() {
  const { token, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("ongoing");
  const [viewMode, setViewMode] = useState(
    user?.role === "SALES" ? "me" : "all",
  );
  const [error, setError] = useState("");

  // auth header moved inside useCallback to avoid dependency issues
  const isAdmin = user?.role === "ADMIN";
  const isSalesRole = user?.role === "SALES";
  const isDeliveryRole = user?.role === "DELIVERY";

  const canViewFinancial = isSalesRole || isAdmin || isDeliveryRole;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (search) params.search = search;

      // If a specific status filter is selected, use it.
      // Otherwise, filter by the active tab's statuses.
      if (statusFilter) {
        params.status = statusFilter;
      } else {
        // Handle multiple statuses if possible by backend,
        // but for now we filter frontend-side for maximum flexibility
      }

      if (viewMode) params.view = viewMode;

      const res = await axios.get("http://localhost:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      let rawOrders = res.data.data.orders || [];

      // Client-side filtering by tab
      const filteredByTab = rawOrders.filter((order) =>
        statusGroups[activeTab].includes(order.status),
      );

      setOrders(filteredByTab);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถโหลดข้อมูลออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, viewMode, token, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, viewMode, token, activeTab, fetchOrders]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING_ARTWORK: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "รอวางแบบ",
        icon: HiOutlineClock,
      },
      DESIGNING: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "กำลังวางแบบ",
        icon: HiOutlineClock,
      },
      PENDING_PAYMENT: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "รอชำระส่วนที่เหลือ",
        icon: HiOutlineExclamationCircle,
      },
      PENDING_STOCK_CHECK: {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        label: "รอสต็อคเช็ค",
        icon: HiOutlineClock,
      },
      STOCK_ISSUE: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "สต็อกมีปัญหา",
        icon: HiOutlineExclamationCircle,
      },
      IN_PRODUCTION: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "กำลังผลิต",
        icon: HiOutlineClock,
      },
      READY_TO_SHIP: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "รอจัดส่ง",
        icon: HiOutlineClock,
      },
      COMPLETED: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "เสร็จสิ้น",
        icon: HiOutlineCheckCircle,
      },
      CANCELLED: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        label: "ยกเลิกแล้ว",
        icon: HiOutlineExclamationCircle,
      },
    };

    const config = statusConfig[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      label: status,
      icon: HiOutlineClock,
    };
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`}
      >
        <Icon className="w-4 h-4" />
        {config.label}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">
            กำลังโหลดข้อมูลออเดอร์...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
            >
              <HiOutlineArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                {user?.role === "SALES" ? "ออเดอร์ของฉัน" : "ออเดอร์ทั้งหมด"}
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                {user?.role === "SALES"
                  ? "ติดตามสถานะออเดอร์ที่คุณเป็นผู้เปิดบิล"
                  : "จัดการและติดตามออเดอร์ทั้งหมดในระบบ"}
              </p>
            </div>
          </div>

          {/* Tabs and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex bg-white/60 backdrop-blur-md border border-slate-200 rounded-2xl p-1 shadow-sm overflow-x-auto no-scrollbar">
                {[
                  {
                    id: "ongoing",
                    label: "กำลังดำเนินการ",
                    count: orders.length,
                    color: "bg-indigo-600",
                  },
                  { id: "ready", label: "รอจัดส่ง", color: "bg-emerald-500" },
                  {
                    id: "completed",
                    label: "สำเร็จแล้ว",
                    color: "bg-slate-700",
                  },
                  { id: "cancelled", label: "ยกเลิก", color: "bg-red-500" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                      activeTab === tab.id
                        ? `${tab.color} text-white shadow-lg scale-105`
                        : "text-slate-400 hover:text-slate-600 hover:bg-white/40"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
                        {orders.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={fetchOrders}
                  className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
                  title="รีเฟรช"
                >
                  <HiOutlineArrowPath
                    className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                  />
                </button>
                <Link
                  to="/order/create"
                  className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-black transition-all flex items-center gap-2"
                >
                  <HiOutlineFire className="w-5 h-5 text-amber-400" />
                  สร้างออเดอร์ใหม่
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="flex-1 relative group min-w-[300px]">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all shadow-sm font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Sub-status Filter */}
              <div className="relative group">
                <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  className="pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all appearance-none cursor-pointer shadow-sm text-slate-600 font-bold text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">เจาะจงสถานะ...</option>
                  {statusGroups[activeTab].map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Mode Toggle */}
              {user?.role !== "SALES" && (
                <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
                  <button
                    onClick={() => setViewMode("all")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      viewMode === "all"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-slate-400 hover:text-indigo-600"
                    }`}
                  >
                    ทั้งหมด
                  </button>
                  <button
                    onClick={() => setViewMode("me")}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      viewMode === "me"
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-slate-400 hover:text-indigo-600"
                    }`}
                  >
                    ของฉัน
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
            <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        {/* Orders List */}
        {orders.length > 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3">Job ID & ชื่อลูกค้า</th>
                    <th className="px-5 py-3">สถานะ</th>
                    {canViewFinancial && <th className="px-5 py-3">การเงิน</th>}
                    <th className="px-5 py-3">พนักงานรับผิดชอบ</th>
                    <th className="px-5 py-3 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-blue-50/20 transition-colors group"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[13px] font-black text-slate-800">
                                {order.jobId}
                              </span>
                              {order.isUrgent && (
                                <HiOutlineFire className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                              )}
                            </div>
                            <p className="text-[11px] font-bold text-slate-400">
                              {order.customerName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="scale-[0.85] origin-left">
                          {getStatusBadge(order.status)}
                        </div>
                      </td>
                      {canViewFinancial && (
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-0">
                            <p className="text-[12px] font-black text-indigo-600">
                              {order.totalPrice?.toLocaleString()} ฿
                            </p>
                            <p className="text-[9px] font-bold text-slate-400">
                              ค้างชำระ:{" "}
                              <span className="text-orange-600 font-black">
                                {(
                                  Number(order.totalPrice - order.paidAmount) ||
                                  0
                                ).toLocaleString()}
                              </span>
                            </p>
                          </div>
                        </td>
                      )}
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          {order.graphic && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                              <span className="text-purple-400">🎨</span>{" "}
                              {order.graphic.name}
                            </div>
                          )}
                          {order.qc && (
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                              <span className="text-emerald-400">✅</span>{" "}
                              {order.qc.name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link
                          to={`/order/${order.id}`}
                          className="inline-flex items-center justify-center px-3 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg text-[10px] font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                        >
                          รายละเอียด
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 py-24 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                <HiOutlineMagnifyingGlass className="w-12 h-12 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                ไม่พบออเดอร์
              </h3>
              <p className="text-slate-500 max-w-xs mb-6">
                {search || statusFilter
                  ? "ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองสถานะ"
                  : "ยังไม่มีออเดอร์ในระบบ เริ่มสร้างออเดอร์แรกของคุณเลย!"}
              </p>
              <Link
                to="/order/create"
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl transition-all"
              >
                สร้างออเดอร์ใหม่
              </Link>
            </div>
          )
        )}
      </div>
    </div>
  );
}
