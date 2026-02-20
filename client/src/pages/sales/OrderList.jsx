import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth-store";
import api from "../../api/config";
import RoleStatsHeader from "../../components/dashboard/RoleStatsHeader";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
  HiOutlineFire,
  HiOutlineClock,
  HiOutlinePlus,
  HiOutlineShoppingBag,
  HiOutlineCalendarDays,
  HiOutlineCube,
} from "react-icons/hi2";
import { getDisplayName } from "../../utils/namePrivacy";
import { useMaster } from "../../context/MasterContext";

const statusGroups = {
  ongoing: [
    "PENDING_ARTWORK",
    "DESIGNING",
    "PENDING_DIGITIZING",
    "PENDING_STOCK_CHECK",
    "STOCK_ISSUE",
    "STOCK_RECHECKED",
    "IN_PRODUCTION",
    "PRODUCTION_FINISHED",
  ],
  ready: ["QC_PASSED", "READY_TO_SHIP"],
  completed: ["COMPLETED"],
  cancelled: ["CANCELLED"],
};

export default function OrderList() {
  const { token, user } = useAuth();
  const { getStatusLabel, statusColors } = useMaster();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("ongoing");
  const [viewMode, setViewMode] = useState(
    user?.role === "SALES" ? "me" : "all",
  );
  const [error, setError] = useState("");

  const isAdmin = user?.role === "ADMIN";
  const isSalesRole = user?.role === "SALES";
  const isDeliveryRole = user?.role === "DELIVERY";
  const canViewFinancial = isSalesRole || isAdmin || isDeliveryRole;

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = { view: viewMode };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get("/orders", { params });
      const rawOrders = res.data.data.orders || [];

      // Unified Tab Filtering based on Backend logic/flags
      const filteredByTab = rawOrders.filter((order) => {
        if (activeTab === "ongoing") {
          return ![
            "QC_PASSED",
            "READY_TO_SHIP",
            "COMPLETED",
            "CANCELLED",
          ].includes(order.status);
        }
        if (activeTab === "ready") {
          return ["QC_PASSED", "READY_TO_SHIP"].includes(order.status);
        }
        if (activeTab === "completed") return order.status === "COMPLETED";
        if (activeTab === "cancelled") return order.status === "CANCELLED";
        return true;
      });

      setOrders(filteredByTab);
    } catch (err) {
      console.error(err);
      setError("Unable to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, viewMode, activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, statusFilter, viewMode, token, activeTab, fetchOrders]);

  const getStatusBadge = (status) => {
    const config = statusColors[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
    };
    return (
      <span
        className={`px-2.5 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-wider border transition-all duration-300 ${config.bg} ${config.text} ${config.border}`}
      >
        {getStatusLabel(status)}
      </span>
    );
  };

  if (loading && orders.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-500">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
        </div>
        <p className="text-slate-500 text-sm font-bold mt-4 tracking-tight">
          กำลังเรียกคืนข้อมูลรายการ...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* Header - Extra Compact */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              {isSalesRole ? "รายการขายของฉัน" : "ระบบจัดการรายการสั่งซื้อ"}
            </h1>
            <p className="text-slate-500 text-[12px] font-medium pl-3.5">
              ตรวจสอบและติดตามสถานะออเดอร์ทั้งหมดในระบบ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="group p-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all duration-200 shadow-sm"
              title="รีเฟรชข้อมูล"
            >
              <HiOutlineArrowPath
                className={`w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors ${loading ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
            {isSalesRole && (
              <Link
                to="/order/create"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[12px] transition-all shadow-sm hover:shadow-md active:scale-95"
              >
                <HiOutlinePlus className="w-4 h-4" />
                เปิดออเดอร์ใหม่
              </Link>
            )}
          </div>
        </div>

        {/* Dynamic Statistics Header */}
        <RoleStatsHeader />

        {/* Filters Section - Tightened */}
        <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
            {/* Main Tabs */}
            <div className="flex bg-slate-100/80 p-1 rounded-xl w-fit border border-slate-200/50">
              {[
                { id: "ongoing", label: "กำลังดำเนินการ" },
                { id: "ready", label: "รอจัดส่ง" },
                { id: "completed", label: "สำเร็จ" },
                { id: "cancelled", label: "ยกเลิก" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-white text-indigo-600 shadow-sm translate-y-[-1px]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Access Toggle */}
            {!isSalesRole && (
              <div className="flex bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black transition-all ${
                    viewMode === "all"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  ออเดอร์ทั้งหมด
                </button>
                <button
                  onClick={() => setViewMode("me")}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-black transition-all ${
                    viewMode === "me"
                      ? "bg-slate-900 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  งานของฉัน
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* Search Bar */}
            <div className="md:col-span-8 relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา (JOB ID, ชื่อลูกค้า, เบอร์โทร...)"
                className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all text-[13px] font-bold placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Dropdown */}
            <div className="md:col-span-4 relative group">
              <HiOutlineFunnel className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                className="w-full pl-10 pr-9 py-2 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 focus:bg-white transition-all text-[12px] font-black text-slate-700 appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">กรองสถานะละเอียด...</option>
                <optgroup label="สถานะ Pre-order (จัดซื้อ)">
                  <option value="WAITING_PURCHASE_INPUT">
                    รอระบุวันเข้า (WAITING_PURCHASE_INPUT)
                  </option>
                  <option value="PURCHASE_CONFIRMED">
                    จัดซื้อคอนเฟิร์มแล้ว (CONFIRMED)
                  </option>
                  <option value="WAITING_ARRIVAL">
                    รอสินค้าเข้าคลัง (WAITING_ARRIVAL)
                  </option>
                  <option value="DELAYED_ROUND_1">
                    ล่าช้า: รอบที่ 1 (DELAYED_R1)
                  </option>
                  <option value="DELAYED_ROUND_2">
                    ล่าช้า: รอบที่ 2 (CRITICAL)
                  </option>
                </optgroup>
                <optgroup label="สถานะออเดอร์">
                  {statusGroups[activeTab].map((st) => (
                    <option key={st} value={st}>
                      {getStatusLabel(st)}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-2xl mb-8 text-sm font-bold flex items-center gap-3">
            <HiOutlineExclamationCircle className="w-6 h-6 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Orders Display - Ultra Compact */}
        {orders.length > 0 ? (
          <div className="space-y-3">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-xl border border-slate-200/60 shadow-sm overflow-hidden p-1.5">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-4 py-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                        รหัสงาน
                      </th>
                      <th className="px-4 py-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                        ข้อมูลลูกค้า
                      </th>
                      <th className="px-4 py-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                        สถานะงาน
                      </th>
                      <th className="px-4 py-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                        เลขพัสดุ
                      </th>
                      {canViewFinancial && (
                        <th className="px-4 py-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                          สรุปยอดเงิน
                        </th>
                      )}
                      <th className="px-4 py-3 text-[12px] font-black text-slate-400 uppercase tracking-widest">
                        ผู้รับผิดชอบ
                      </th>
                      <th className="px-4 py-3 text-right text-[12px] font-black text-slate-400 uppercase tracking-widest">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className={`transition-all duration-200 hover:bg-slate-50/80 group ${
                          order.isUrgent
                            ? "bg-rose-50/30 border-l-2 border-l-rose-500"
                            : ""
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            {/* Thumbnail */}
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`text-[12.5px] font-black tracking-tight ${order.isUrgent ? "text-rose-600" : "text-slate-900"}`}
                              >
                                {order.jobId}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {order.isUrgent && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8.5px] font-black uppercase rounded w-fit">
                                    <HiOutlineFire className="w-2.5 h-2.5" />
                                    ด่วน
                                  </div>
                                )}
                                {order.hasPreorder && (
                                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8.5px] font-black uppercase rounded w-fit border border-amber-200">
                                    PRE
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-800">
                              {order.customerName}
                            </span>
                            <span className="text-[12px] font-bold text-slate-400 truncate max-w-[140px]">
                              {order.customerFb || "ไม่มีประวัติสื่อสาร"}
                            </span>
                            {/* Product Summary */}
                            {order.items && order.items.length > 0 && (
                              <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-1 bg-slate-50 p-1 rounded border border-slate-100">
                                <HiOutlineShoppingBag className="w-3 h-3 mt-0.5 text-indigo-500" />
                                <span className="font-bold">
                                  {order.items.reduce(
                                    (sum, item) => sum + item.quantity,
                                    0,
                                  )}{" "}
                                  ชิ้น
                                  <span className="text-slate-400 font-normal mx-1">
                                    |
                                  </span>
                                  <span className="truncate max-w-[120px] inline-block align-bottom">
                                    {order.items
                                      .map((i) => i.productName || i.name)
                                      .join(", ")}
                                  </span>
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            {/* Status Badge */}
                            {order.displayStatusLabel ? (
                              <span
                                className={`px-2.5 py-1.5 rounded-xl text-[12px] font-black uppercase tracking-wider border transition-all duration-300 w-fit ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-700"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                              >
                                {order.displayStatusLabel}
                              </span>
                            ) : (
                              getStatusBadge(order.status)
                            )}

                            {/* Sub-status Label */}
                            {order.subStatusLabel && (
                              <span className="text-[10px] font-black text-orange-600 animate-pulse">
                                {order.subStatusLabel}
                              </span>
                            )}

                            {/* Dates Container */}
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {/* Final Due Date (Send:) */}
                              {order.dueDate && (
                                <div className="flex items-center gap-1.5 text-[10.5px] text-slate-500 font-bold opacity-80">
                                  <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                                  <span>
                                    ส่ง:{" "}
                                    {new Date(order.dueDate).toLocaleDateString(
                                      "th-TH",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "2-digit",
                                      },
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* SLA Target Deadline (Target:) */}
                              {order.sla && order.sla.targetDeadline && (
                                <div
                                  className={`flex items-center gap-1.5 text-[10.5px] font-bold ${
                                    order.sla.status === "RED"
                                      ? "text-rose-600"
                                      : order.sla.status === "YELLOW"
                                        ? "text-amber-600"
                                        : "text-emerald-600"
                                  }`}
                                >
                                  <HiOutlineClock className="w-3.5 h-3.5" />
                                  <span>
                                    เป้า:{" "}
                                    {new Date(
                                      order.sla.targetDeadline,
                                    ).toLocaleDateString("th-TH", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "2-digit",
                                    })}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {order.trackingNo ? (
                            <div className="text-[12px] font-black font-mono tracking-tight text-slate-600">
                              {order.trackingNo}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[12px] font-black italic">
                              ไม่มีข้อมูล
                            </span>
                          )}
                        </td>
                        {canViewFinancial && (
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="text-[12px] font-black text-slate-900">
                                ฿{order.totalPrice?.toLocaleString()}
                              </span>
                              {order.totalPrice - (order.paidAmount || 0) >
                              0 ? (
                                <span className="text-[9px] font-black text-orange-600">
                                  ค้าง ฿
                                  {(
                                    order.totalPrice - (order.paidAmount || 0)
                                  ).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-[9px] font-black text-emerald-600">
                                  ชำระครบ
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            {order.graphic && (
                              <div
                                className="w-6 h-6 rounded-md bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center text-[12px] font-black shadow-sm"
                                title={`G: ${getDisplayName(order.graphic, user)}`}
                              >
                                G
                              </div>
                            )}
                            {order.qc && (
                              <div
                                className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center text-[12px] font-black shadow-sm"
                                title={`Q: ${getDisplayName(order.qc, user)}`}
                              >
                                Q
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            to={`/order/${order.id}`}
                            className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10.5px] font-black transition-all shadow-sm active:scale-95"
                          >
                            จัดการ
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards - Refined for Density */}
            <div className="lg:hidden grid grid-cols-1 gap-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/order/${order.id}`}
                  className={`block bg-white p-3 rounded-xl border transition-all active:scale-[0.98] ${
                    order.isUrgent
                      ? "border-rose-200 bg-rose-50/20"
                      : "border-slate-200 shadow-sm"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    {/* Startup: Thumbnail for Mobile */}
                    

                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-black ${
                              order.isUrgent
                                ? "text-rose-600"
                                : "text-slate-900"
                            }`}
                          >
                            {order.jobId}
                          </span>
                          <span className="text-[11px] text-slate-600 font-bold">
                            {order.customerName}
                          </span>
                        </div>

                        <span
                          className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border flex-shrink-0 text-center ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-700"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                        >
                          {order.displayStatusLabel ||
                            getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.isUrgent && (
                          <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                            ด่วน
                          </span>
                        )}
                        {order.hasPreorder && (
                          <span className="text-[9px] font-black uppercase text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">
                            PRE
                          </span>
                        )}
                        {/* Mobile Product Summary */}
                        {order.items && order.items.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <HiOutlineShoppingBag className="w-3 h-3 text-indigo-500" />
                            <span className="font-bold">
                              {order.items.reduce(
                                (sum, item) => sum + item.quantity,
                                0,
                              )}{" "}
                              ชิ้น
                            </span>
                          </div>
                        )}
                      </div>

                      {/* SLA & Due Date Mobile Display (Hidden on very small screens, moved to detail view) */}
                      <div className="hidden sm:flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {order.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                            <HiOutlineCalendarDays className="w-3 h-3" />
                            <span>
                              ส่ง:{" "}
                              {new Date(order.dueDate).toLocaleDateString(
                                "th-TH",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "2-digit",
                                },
                              )}
                            </span>
                          </div>
                        )}

                        {order.sla && order.sla.targetDeadline && (
                          <div
                            className={`flex items-center gap-1 text-[10px] font-bold ${
                              order.sla.status === "RED"
                                ? "text-rose-600"
                                : order.sla.status === "YELLOW"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            }`}
                          >
                            <HiOutlineClock className="w-3 h-3" />
                            <span>
                              เป้า:{" "}
                              {new Date(
                                order.sla.targetDeadline,
                              ).toLocaleDateString("th-TH", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[12px] font-bold text-slate-400 truncate">
                        {order.customerFb || "ไม่มีประวัติสื่อสาร"}
                      </span>
                    </div>
                    {canViewFinancial && (
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-black text-slate-900 leading-none">
                          ฿{order.totalPrice?.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          !loading && (
            <div className="bg-white rounded-xl border border-slate-200 border-dashed p-10 text-center animate-in zoom-in duration-300">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiOutlineMagnifyingGlass className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">
                ไม่พบข้อมูลออเดอร์
              </h3>
              <p className="text-slate-400 text-[11px] font-medium">
                ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหาของคุณ
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
