import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineWrenchScrewdriver,
  HiOutlinePlay,
  HiOutlineCheckBadge,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import RoleStatsHeader from "../../components/dashboard/RoleStatsHeader";
import { getStatusLabel } from "../../utils/statusMapper";

export default function ProductionTaskBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("available");
  const [search, setSearch] = useState("");

  const fetchProductionOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab, search },
      });
      const productionOrders = res.data.data.orders;
      // Filter to only production-relevant statuses for available/all tabs
      let filtered = productionOrders;
      if (viewTab === "available" || viewTab === "all") {
        filtered = productionOrders.filter((o) =>
          ["STOCK_RECHECKED", "IN_PRODUCTION", "PRODUCTION_FINISHED"].includes(
            o.status,
          ),
        );
      }
      // Sort: Urgent first
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <HiOutlineWrenchScrewdriver className="w-10 h-10 text-orange-500" />
              กระดานงานฝ่ายผลิต
            </h1>
            <p className="text-slate-500 font-medium">
              รับงานผลิต อ่านสเปคงานปัก และอัปเดตสถานะเมื่อผลิตเสร็จ
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
                className="pl-10 pr-4 py-2 bg-white/80 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all w-64 text-xs font-bold shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex bg-white/60 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200/50 shadow-sm">
              {[
                { id: "available", label: "งานที่รับได้" },
                { id: "me", label: "งานของฉัน" },
                { id: "all", label: "ทั้งหมด" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id)}
                  className={`px-5 py-2 rounded-xl text-xs font-black transition-all duration-300 ${
                    viewTab === tab.id
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-200 translate-y-[-1px]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <RoleStatsHeader />

        {/* List View */}
        {loading && orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 font-medium">
            กำลังโหลดรายการผลิต...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-6 py-4">รายละเอียดงาน</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4">ผู้รับผิดชอบ</th>
                    <th className="px-6 py-4 text-right">ดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-slate-300 italic font-medium"
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
                            ? "bg-rose-50 border-l-4 border-l-rose-500 hover:bg-rose-100"
                            : "hover:bg-orange-50/20"
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-800">
                                {order.jobId}
                              </span>
                              {order.isUrgent && (
                                <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase animate-pulse">
                                  งานด่วน
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-slate-500">
                              {order.customerName}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              order.status === "IN_PRODUCTION"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[11px] font-bold text-slate-600">
                            {order.production
                              ? order.production.name
                              : "ยังไม่มีคนรับงาน"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/order/${order.id}`}
                            className="inline-flex items-center justify-center px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-black hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all shadow-sm"
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
        )}
      </div>
    </div>
  );
}
