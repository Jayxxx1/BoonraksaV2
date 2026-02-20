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
    <div className="min-h-screen bg-slate-50/50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              จัดการสต็อกและคลังสินค้า
            </h1>
            <p className="text-slate-500 font-medium mt-1">
              หยิบของและสแกนยืนยันสินค้าก่อนเข้าไลน์ผลิต
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all w-64 text-xs font-bold shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
              {[
                {
                  id: "available",
                  label: "รอเช็คสต็อก",
                  color: "bg-emerald-500",
                },
                { id: "me", label: "งานที่ฉันเช็ค", color: "bg-indigo-600" },
                {
                  id: "history",
                  label: "ประวัติสำเร็จ",
                  color: "bg-amber-500",
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    viewTab === tab.id
                      ? `${tab.color} text-white shadow-lg`
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 font-medium">
            กำลังโหลดข้อมูล...
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">รายละเอียดงาน</th>
                    <th className="px-6 py-4">สถานะ</th>
                    <th className="px-6 py-4">พนักงานคลัง</th>
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
                        ไม่มีรายการในส่วนนี้
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr
                        key={order.id}
                        className={`hover:bg-indigo-50/30 transition-colors group ${
                          order.isUrgent
                            ? "bg-rose-50/40 border-l-4 border-l-rose-500"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800">
                              {order.jobId}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500">
                              {order.customerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-600"}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                          {order.stock?.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/order/${order.id}`}
                            className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-black hover:bg-indigo-600 transition-all shadow-sm"
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

            {/* Mobile Cards for Stock Recheck */}
            <div className="lg:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
              {orders.length === 0 ? (
                <div className="px-6 py-12 text-center text-slate-300 italic font-medium">
                  ไม่มีรายการในส่วนนี้
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className={`block bg-white p-3.5 rounded-xl border transition-all ${
                      order.isUrgent
                        ? "border-rose-200 bg-rose-50/30 shadow-sm shadow-rose-100/50 block border-l-4 border-l-rose-500"
                        : "border-slate-200 shadow-sm block"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex flex-col gap-1.5 w-full">
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
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter flex-shrink-0 text-center ${statusColors[order.status]?.bg || "bg-slate-100"} ${statusColors[order.status]?.text || "text-slate-600"}`}
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
                      <div className="flex items-center">
                        <Link
                          to={`/order/${order.id}`}
                          className="px-4 py-1.5 bg-slate-900 text-white border border-transparent rounded-lg text-[10.5px] font-black hover:bg-indigo-600 transition-all shadow-sm active:scale-95"
                        >
                          ตรวจสอบและยืนยัน
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
