import { useState, useEffect, useCallback } from "react";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineWrenchScrewdriver,
  HiOutlinePlay,
  HiOutlineCheckBadge,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import RoleStatsHeader from "../../components/dashboard/RoleStatsHeader";
import { useMaster } from "../../context/MasterContext";

export default function ProductionTaskBoard() {
  const { token } = useAuth();
  const { getStatusLabel } = useMaster();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("available");
  const [search, setSearch] = useState("");

  const fetchProductionOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab, search },
      });
      const productionOrders = res.data.data.orders;
      let filtered = productionOrders;
      if (viewTab === "available" || viewTab === "all") {
        filtered = productionOrders.filter(
          (o) => o.isReadyForProduction || o.productionStatus !== "NOT_READY",
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

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductionOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchProductionOrders, search]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              กระดานงานฝ่ายผลิต
            </h1>
            <p className="erp-page-subtitle">
              รับงานผลิต อ่านสเปคงานปัก และอัปเดตสถานะเมื่อผลิตเสร็จ
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
                { id: "available", label: "งานที่รับได้" },
                { id: "me", label: "งานของฉัน" },
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

        {/* ── Table ── */}
        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 animate-erp-in">
            <div className="erp-spinner"></div>
            <p className="text-slate-500 text-[12px] font-bold mt-4">
              กำลังโหลดรายการผลิต...
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
                      <th>รายละเอียดงาน</th>
                      <th>สถานะ</th>
                      <th>ผู้รับผิดชอบ</th>
                      <th className="text-right">ดำเนินการ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-3 py-10 text-center text-slate-400 text-[12px] font-bold italic"
                        >
                          ไม่มีงานในรายการนี้
                        </td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr
                          key={order.id}
                          className={`transition-colors group ${
                            order.isUrgent
                              ? "bg-rose-50/30 border-l-2 border-l-rose-500"
                              : ""
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[12.5px] font-black text-slate-800">
                                  {order.jobId}
                                </span>
                                {order.isUrgent && (
                                  <span className="erp-urgent-tag">
                                    งานด่วน
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-bold text-slate-500">
                                {order.customerName}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`erp-status-badge ${
                                order.status === "IN_PRODUCTION"
                                  ? "bg-orange-100 text-orange-600 border-orange-200"
                                  : "bg-blue-100 text-blue-600 border-blue-200"
                              }`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black text-slate-600">
                                {order.production
                                  ? order.production.name
                                  : "ยังไม่มีคนรับงาน"}
                              </span>
                              {order.assignedWorkerName && (
                                <span className="text-[9px] font-black text-orange-500">
                                  → {order.assignedWorkerName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Link
                              to={`/order/${order.id}`}
                              className="erp-action-btn"
                            >
                              ตรวจสอบและผลิต
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 gap-2.5 mt-3">
              {orders.length === 0 ? (
                <div className="erp-empty-state">
                  <p className="text-slate-400 text-[12px] font-bold">
                    ไม่มีงานในรายการนี้
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
                              className={`text-sm font-black tracking-tight ${order.isUrgent ? "text-rose-600" : "text-slate-900"}`}
                            >
                              {order.jobId || `#${order.id}`}
                            </span>
                            <span className="text-[11px] text-slate-600 font-bold max-w-[160px] truncate">
                              {order.customerName}
                            </span>
                          </div>
                          <span
                            className={`erp-status-badge flex-shrink-0 text-center ${order.status === "IN_PRODUCTION" ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-blue-100 text-blue-600 border-blue-200"}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </div>

                        {order.isUrgent && (
                          <div className="flex items-center gap-2">
                            <span className="erp-urgent-tag">งานด่วน</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-400">
                          ผู้รับผิดชอบ
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">
                          {order.production
                            ? order.production.name
                            : "ยังไม่มีคนรับงาน"}
                        </span>
                        {order.assignedWorkerName && (
                          <span className="text-[9px] font-black text-orange-500">
                            → {order.assignedWorkerName}
                          </span>
                        )}
                      </div>
                      <Link
                        to={`/order/${order.id}`}
                        className="erp-action-btn"
                      >
                        ตรวจสอบ
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
