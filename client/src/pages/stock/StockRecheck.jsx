import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineQrCode,
  HiOutlineCheckCircle,
  HiOutlineViewColumns,
} from "react-icons/hi2";
import { getStatusLabel, statusColors } from "../../utils/statusMapper";

export default function StockRecheck() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("available"); // Default to available since stock recheck is a per-job action

  const fetchReadyOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab },
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
  }, [token, viewTab]);

  useEffect(() => {
    fetchReadyOrders();
  }, [fetchReadyOrders]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-400">กำลังโหลดข้อมูล...</div>
    );

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

          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {[
              {
                id: "available",
                label: "รอเช็คสต็อก",
                color: "bg-emerald-500",
              },
              { id: "me", label: "งานที่ฉันเช็ค", color: "bg-indigo-600" },
              { id: "history", label: "ประวัติสำเร็จ", color: "bg-amber-500" },
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
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
        </div>
      </div>
    </div>
  );
}
