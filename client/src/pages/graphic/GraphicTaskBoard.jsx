import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineFire,
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import RoleStatsHeader from "../../components/dashboard/RoleStatsHeader";
import { getStatusLabel } from "../../utils/statusMapper";

export default function GraphicTaskBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [claiming, setClaiming] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("me");
  const [search, setSearch] = useState("");

  const fetchDesignOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab, search },
      });
      let filtered = res.data.data.orders;
      if (viewTab === "all" || viewTab === "available") {
        filtered = filtered.filter((o) =>
          ["PENDING_ARTWORK", "DESIGNING"].includes(o.status),
        );
      }
      // Sort: Urgent first, then by date
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
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/claim`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await fetchDesignOrders(); // Refresh
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
    <div className="min-h-screen bg-[#F8FAFC] p-4">
      <div className="max-w-[1440px] mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-6 bg-indigo-600 rounded-full"></div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                งานออกแบบ (Graphic)
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input
                  type="text"
                  placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
                  className="pl-10 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all w-64 text-xs font-bold"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200/50">
                {[
                  { id: "me", label: "งานของฉัน" },
                  { id: "available", label: "งานรอรับ" },
                  { id: "all", label: "ทั้งหมด" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setViewTab(tab.id)}
                    className={`px-4 py-1.5 rounded-md text-[11px] font-black transition-all ${
                      viewTab === tab.id
                        ? "bg-white text-indigo-600 shadow-sm"
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

          {loading && orders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-slate-500 font-bold">
                กำลังโหลดข้อมูลงานออกแบบ...
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      รหัสงาน
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ลูกค้า
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      สถานะ
                    </th>
                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ผู้รับผิดชอบ
                    </th>
                    <th className="px-4 py-3 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-10 text-center text-slate-400 text-[12px] font-bold"
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
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`text-[12.5px] font-black tracking-tight ${order.isUrgent ? "text-rose-600" : "text-slate-900"}`}
                            >
                              {order.jobId || `#${order.id}`}
                            </span>
                            {order.isUrgent && (
                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8.5px] font-black uppercase rounded w-fit">
                                <HiOutlineFire className="w-2.5 h-2.5" />
                                ด่วน
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[12px] font-bold text-slate-800">
                            {order.customerName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span
                              className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                order.status === "DESIGNING"
                                  ? "bg-purple-100 text-purple-600"
                                  : order.status === "PENDING_ARTWORK"
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-slate-100 text-slate-400"
                              }`}
                            >
                              {getStatusLabel(order.status)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${order.graphic ? "bg-indigo-500" : "bg-slate-300 animate-pulse"}`}
                            ></div>
                            <span className="text-[11px] font-bold text-slate-600">
                              {order.graphic
                                ? order.graphic.name
                                : "รอรับงาน..."}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {order.status === "PENDING_ARTWORK" &&
                              !order.graphic && (
                                <button
                                  onClick={() => claimTask(order.id)}
                                  disabled={claiming === order.id}
                                  className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10.5px] font-black hover:bg-emerald-700 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                >
                                  {claiming === order.id
                                    ? "กำลังรับ..."
                                    : "รับงาน"}
                                </button>
                              )}
                            <Link
                              to={`/order/${order.id}`}
                              className="px-3 py-1 bg-slate-900 text-white rounded-lg text-[10.5px] font-black hover:bg-slate-800 transition-all shadow-sm active:scale-95"
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
          )}
        </div>
      </div>
    </div>
  );
}
