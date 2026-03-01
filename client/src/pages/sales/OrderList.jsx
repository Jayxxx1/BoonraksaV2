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
      console.error("Order Fetch Error:", err);
      setOrders([]);

      if (err.response?.status !== 404) {
        setError(
          "ไม่สามารถโหลดข้อมูลออเดอร์ได้ชั่วคราว กรุณารีเฟรชหน้าจออีกครั้ง",
        );
      }
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
        className={`erp-status-badge ${config.bg} ${config.text} ${config.border}`}
      >
        {getStatusLabel(status)}
      </span>
    );
  };

  if (loading && orders.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-erp-in">
        <div className="erp-spinner"></div>
        <p className="text-slate-500 text-[12px] font-bold mt-4 tracking-tight">
          กำลังเรียกคืนข้อมูลรายการ...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              {isSalesRole ? "รายการขายของฉัน" : "ระบบจัดการรายการสั่งซื้อ"}
            </h1>
            <p className="erp-page-subtitle">
              ตรวจสอบและติดตามสถานะออเดอร์ทั้งหมดในระบบ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchOrders}
              className="group p-2 bg-white border border-slate-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-sm"
              title="รีเฟรชข้อมูล"
            >
              <HiOutlineArrowPath
                className={`w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors ${loading ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
            {isSalesRole && (
              <Link
                to="/order/create"
                className="erp-button erp-button-primary gap-2 px-4 py-2 text-[12px] shadow-sm hover:shadow-md"
              >
                <HiOutlinePlus className="w-4 h-4" />
                เปิดออเดอร์ใหม่
              </Link>
            )}
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <RoleStatsHeader />

        {/* ── Filter Bar ── */}
        <div className="erp-filter-bar">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
            {/* Main Tabs */}
            <div className="erp-tab-container">
              {[
                { id: "ongoing", label: "กำลังดำเนินการ" },
                { id: "ready", label: "รอจัดส่ง" },
                { id: "completed", label: "สำเร็จ" },
                { id: "cancelled", label: "ยกเลิก" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`erp-tab ${
                    activeTab === tab.id ? "erp-tab-active" : "erp-tab-inactive"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* View Access Toggle */}
            {!isSalesRole && (
              <div className="erp-view-toggle">
                <button
                  onClick={() => setViewMode("all")}
                  className={`erp-view-toggle-btn ${
                    viewMode === "all"
                      ? "erp-view-toggle-active"
                      : "erp-view-toggle-inactive"
                  }`}
                >
                  ออเดอร์ทั้งหมด
                </button>
                <button
                  onClick={() => setViewMode("me")}
                  className={`erp-view-toggle-btn ${
                    viewMode === "me"
                      ? "erp-view-toggle-active"
                      : "erp-view-toggle-inactive"
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
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา (JOB ID, ชื่อลูกค้า, เบอร์โทร...)"
                className="erp-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Dropdown */}
            <div className="md:col-span-4 relative group">
              <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                className="erp-search-input pl-9 pr-9 text-[12px] font-black appearance-none cursor-pointer"
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
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg mb-5 text-[12px] font-bold flex items-center gap-2.5">
            <HiOutlineExclamationCircle className="w-5 h-5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Orders Display ── */}
        {orders.length > 0 ? (
          <div className="space-y-3">
            {/* Desktop Table */}
            <div className="hidden lg:block erp-table-container">
              <div className="overflow-x-auto">
                <table className="erp-table table-fixed w-full">
                  <thead>
                    <tr>
                      <th className="erp-table th w-[72px]">รหัสงาน</th>
                      <th className="erp-table th w-[28%]">ข้อมูลลูกค้า</th>
                      <th className="erp-table th w-[20%]">สถานะงาน</th>
                      <th className="erp-table th w-[14%]">เลขพัสดุ</th>
                      {canViewFinancial && (
                        <th className="erp-table th w-[16%]">สรุปยอดเงิน</th>
                      )}
                      <th className="erp-table th w-[72px] text-right">
                        จัดการ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        className={`transition-all duration-200 hover:bg-slate-50/80 group ${
                          order.isUrgent
                            ? "bg-rose-50/30 border-l-2 border-l-rose-500"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`text-[12.5px] font-black tracking-tight ${order.isUrgent ? "text-rose-600" : "text-slate-900"}`}
                            >
                              {order.jobId}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {order.isUrgent && (
                                <div className="erp-urgent-tag">
                                  <HiOutlineFire className="w-2.5 h-2.5" />
                                  ด่วน
                                </div>
                              )}
                              {order.hasPreorder && (
                                <div className="erp-pre-tag">PRE</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 overflow-hidden">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-black text-slate-800">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] font-bold text-slate-400 truncate block">
                              {order.customerFb || "ไม่มีประวัติสื่อสาร"}
                            </span>
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
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5">
                            {order.displayStatusLabel ? (
                              <span
                                className={`erp-status-badge w-fit ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-700"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                              >
                                {order.displayStatusLabel}
                              </span>
                            ) : (
                              getStatusBadge(order.status)
                            )}

                            {order.subStatusLabel && (
                              <span className="text-[10px] font-black text-orange-600 animate-pulse">
                                {order.subStatusLabel}
                              </span>
                            )}

                            <div className="flex flex-col gap-0.5 mt-0.5">
                              {order.dueDate && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold opacity-80">
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

                              {user.role !== "SALES" &&
                                order.sla &&
                                order.sla.targetDeadline && (
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
                        </td>
                        <td className="px-3 py-2.5">
                          {order.trackingNo ? (
                            <div className="text-[12px] font-black font-mono tracking-tight text-slate-600">
                              {order.trackingNo}
                            </div>
                          ) : (
                            <span className="text-slate-300 text-[11px] font-bold italic">
                              ไม่มีข้อมูล
                            </span>
                          )}
                        </td>
                        {canViewFinancial && (
                          <td className="px-3 py-2.5">
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
                        <td className="px-3 py-2.5 text-right">
                          <Link
                            to={`/order/${order.id}`}
                            className="erp-action-btn"
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

            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 gap-2.5">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  to={`/order/${order.id}`}
                  className={`erp-mobile-card ${
                    order.isUrgent ? "erp-mobile-card-urgent" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
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
                          className={`erp-status-badge flex-shrink-0 text-center ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-700"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                        >
                          {order.displayStatusLabel ||
                            getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.isUrgent && (
                          <span className="erp-urgent-tag">ด่วน</span>
                        )}
                        {order.hasPreorder && (
                          <span className="erp-pre-tag">PRE</span>
                        )}
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

                      {/* SLA & Due Date */}
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

                  <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-[11px] font-bold text-slate-400 truncate">
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
          !loading &&
          !error && (
            <div className="erp-empty-state animate-erp-slide-up">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <HiOutlineMagnifyingGlass className="w-5 h-5 text-slate-300" />
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
