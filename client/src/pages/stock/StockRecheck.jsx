import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineQrCode,
  HiOutlineCheckCircle,
  HiOutlineViewColumns,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import RoleStatsHeader from "../../components/dashboard/RoleStatsHeader";
import { useMaster } from "../../context/MasterContext";

export default function StockRecheck() {
  const { token } = useAuth();
  const { getStatusLabel, statusColors } = useMaster();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("available");
  const [search, setSearch] = useState("");

  const fetchReadyOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab, search },
      });
      let raw = res.data.data.orders;
      if (viewTab === "available" || viewTab === "all") {
        raw = raw.filter((o) =>
          ["PENDING_STOCK_CHECK", "STOCK_ISSUE"].includes(o.status),
        );
      }
      setOrders(
        raw.sort((a, b) => {
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, viewTab, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReadyOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchReadyOrders, search]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              จัดการสต็อกและคลังสินค้า
            </h1>
            <p className="erp-page-subtitle">
              หยิบของและสแกนยืนยันสินค้าก่อนเข้าไลน์ผลิต
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
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
                { id: "available", label: "รอเช็คสต็อก" },
                { id: "me", label: "งานที่ฉันเช็ค" },
                { id: "history", label: "ประวัติสำเร็จ" },
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

        {loading && orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 animate-erp-in">
            <div className="erp-spinner"></div>
            <p className="text-slate-500 text-[12px] font-bold mt-4">
              กำลังโหลดข้อมูล...
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
                      <th>พนักงานคลัง</th>
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
                          ไม่มีรายการในส่วนนี้
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
                            <div className="flex flex-col">
                              <span className="text-[12.5px] font-black text-slate-800">
                                {order.jobId}
                              </span>
                              <span className="text-[11px] font-bold text-slate-500">
                                {order.customerName}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`erp-status-badge ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-600"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-[11px] font-bold text-slate-500">
                            {order.stock?.name || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Link
                              to={`/order/${order.id}`}
                              className="erp-action-btn"
                            >
                              ตรวจสอบและยืนยัน
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
                    ไม่มีรายการในส่วนนี้
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
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span
                              className={`text-sm font-black tracking-tight ${order.isUrgent ? "text-rose-600" : "text-slate-900"}`}
                            >
                              {order.jobId}
                            </span>
                            <span className="text-[11px] text-slate-500 font-bold max-w-[160px] truncate">
                              {order.customerName}
                            </span>
                          </div>
                          <span
                            className={`erp-status-badge flex-shrink-0 ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-600"} ${statusColors[order.status]?.border || "border-slate-200"}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-black text-slate-400">
                          พนักงานคลัง
                        </span>
                        <span className="text-[11px] font-bold text-slate-700">
                          {order.stock?.name || "-"}
                        </span>
                      </div>
                      <Link
                        to={`/order/${order.id}`}
                        className="erp-action-btn"
                      >
                        ตรวจสอบและยืนยัน
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
