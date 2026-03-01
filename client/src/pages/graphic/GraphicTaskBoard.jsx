import { useState, useEffect, useCallback } from "react";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineFire,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineShoppingBag,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineCube,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import RoleStatsHeader from "../../components/dashboard/RoleStatsHeader";
import { useMaster } from "../../context/MasterContext";

export default function GraphicTaskBoard() {
  const { token } = useAuth();
  const { getStatusLabel, statusColors } = useMaster();
  const [orders, setOrders] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("me");
  const [search, setSearch] = useState("");

  const fetchDesignOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab, search },
      });
      let filtered = res.data.data.orders;
      if (viewTab === "all" || viewTab === "available") {
        filtered = filtered.filter((o) =>
          ["PENDING_ARTWORK", "DESIGNING", "PENDING_DIGITIZING"].includes(
            o.status,
          ),
        );
      }
      filtered.sort((a, b) => {
        if (a.isUrgent && !b.isUrgent) return -1;
        if (!a.isUrgent && b.isUrgent) return 1;
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      });
      setOrders(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, viewTab, search]);

  const claimTask = async (orderId) => {
    try {
      setClaiming(orderId);
      await api.patch(
        `/orders/${orderId}/claim`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchDesignOrders();
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถรับงานได้");
    } finally {
      setClaiming(null);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDesignOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchDesignOrders]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              งานออกแบบ (Graphic)
            </h1>
            <p className="erp-page-subtitle">
              รับงานออกแบบ วางแบบ Mockup และจัดการไฟล์งาน
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
                className="erp-search-input w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="erp-tab-container">
              {[
                { id: "me", label: "งานของฉัน" },
                { id: "available", label: "งานรอรับ" },
                { id: "history", label: "ประวัติงาน" },
                { id: "all", label: "ทั้งหมด" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id)}
                  className={`erp-tab ${
                    viewTab === tab.id ? "erp-tab-active" : "erp-tab-inactive"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <RoleStatsHeader />

        {/* ── Content ── */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 animate-erp-in">
            <div className="erp-spinner"></div>
            <p className="text-slate-500 text-[12px] font-bold mt-4">
              กำลังโหลดข้อมูลงานออกแบบ...
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block erp-table-container">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>รหัสงาน</th>
                      <th>ลูกค้า</th>
                      <th>สถานะ</th>
                      <th className="text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-3 py-10 text-center text-slate-400 text-[12px] font-bold"
                        >
                          {viewTab === "me"
                            ? "คุณยังไม่มีงานที่รับผิดชอบ"
                            : viewTab === "available"
                              ? "ไม่มีงานรอรับในขณะนี้"
                              : "ไม่พบงานออกแบบ"}
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`transition-all hover:bg-slate-50/80 group ${
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
                                {order.jobId || `#${order.id}`}
                              </span>
                              {order.isUrgent && (
                                <div className="erp-urgent-tag w-fit">
                                  <HiOutlineFire className="w-2.5 h-2.5" />
                                  ด่วน
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col">
                              <span className="text-[12px] font-bold text-slate-800">
                                {order.customerName}
                              </span>
                              {order.items && order.items.length > 0 && (
                                <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-1 bg-slate-50 p-1 rounded border border-slate-100 w-fit"></div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-1.5">
                              <span
                                className={`erp-status-badge w-fit ${
                                  statusColors[order.status]?.bg ||
                                  "bg-slate-100"
                                } ${statusColors[order.status]?.text || "text-slate-700"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                              >
                                {getStatusLabel(order.status)}
                              </span>

                              <div className="flex flex-col gap-0.5 mt-0.5">
                                {order.dueDate && (
                                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold opacity-80">
                                    <HiOutlineCalendarDays className="w-3 h-3" />
                                    <span>
                                      ส่ง:{" "}
                                      {new Date(
                                        order.dueDate,
                                      ).toLocaleDateString("th-TH", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "2-digit",
                                      })}
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
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {order.status === "PENDING_ARTWORK" &&
                                !order.graphic && (
                                  <button
                                    onClick={() => claimTask(order.id)}
                                    disabled={claiming === order.id}
                                    className="erp-button px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                                  >
                                    {claiming === order.id
                                      ? "กำลังรับ..."
                                      : "รับงาน"}
                                  </button>
                                )}
                              <Link
                                to={`/order/${order.id}`}
                                className="erp-action-btn"
                              >
                                จัดการ
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            {!loading && (
              <div className="lg:hidden grid grid-cols-1 gap-2.5 mt-3">
                {orders.length === 0 ? (
                  <div className="erp-empty-state">
                    <p className="text-slate-400 text-[12px] font-bold">
                      {viewTab === "me"
                        ? "คุณยังไม่มีงานที่รับผิดชอบ"
                        : viewTab === "available"
                          ? "ไม่มีงานรอรับในขณะนี้"
                          : "ไม่พบงานออกแบบ"}
                    </p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className={`erp-mobile-card ${
                        order.isUrgent ? "erp-mobile-card-urgent" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-col gap-1.5 w-full">
                          <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                              <span
                                className={`text-sm font-black ${order.isUrgent ? "text-rose-600" : "text-slate-900"}`}
                              >
                                {order.jobId || `#${order.id}`}
                              </span>
                              <span className="text-[11px] text-slate-600 font-bold">
                                {order.customerName}
                              </span>
                            </div>
                            <span
                              className={`erp-status-badge flex-shrink-0 text-center ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-700"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </div>

                          {order.isUrgent && (
                            <div className="flex items-center gap-2">
                              <span className="erp-urgent-tag">ด่วน</span>
                            </div>
                          )}

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
                                className={`flex items-center gap-1 text-[10px] font-bold ${order.sla.status === "RED" ? "text-rose-600" : order.sla.status === "YELLOW" ? "text-amber-600" : "text-emerald-600"}`}
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

                      <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-1.5 h-1.5 rounded-full ${order.graphic ? "bg-indigo-500" : "bg-slate-300 animate-pulse"}`}
                          ></div>
                          <span className="text-[11px] font-bold text-slate-600">
                            {order.graphic ? order.graphic.name : "รอรับงาน..."}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {order.status === "PENDING_ARTWORK" &&
                            !order.graphic && (
                              <button
                                onClick={() => claimTask(order.id)}
                                disabled={claiming === order.id}
                                className="erp-button px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                              >
                                {claiming === order.id
                                  ? "กำลังรับ..."
                                  : "รับงาน"}
                              </button>
                            )}
                          <Link
                            to={`/order/${order.id}`}
                            className="erp-action-btn"
                          >
                            จัดการ
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
