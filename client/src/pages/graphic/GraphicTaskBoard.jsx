/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function GraphicTaskBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("me");

  const fetchDesignOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab },
      });
      let filtered = res.data.data.orders;
      if (viewTab === "all" || viewTab === "available") {
        filtered = filtered.filter((o) =>
          ["PENDING_ARTWORK", "DESIGNING"].includes(o.status),
        );
      }
      setOrders(filtered);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, viewTab]);

  useEffect(() => {
    fetchDesignOrders();
  }, [fetchDesignOrders]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-400">
        กำลังโหลดงานออกแบบ...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              กระดานงานกราฟิก
            </h1>
            <p className="text-slate-500 font-medium">
              จัดการไฟล์ออกแบบและเตรียมใบงานส่งฝ่ายผลิต
            </p>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {[
              { id: "me", label: "งานของฉัน", color: "bg-indigo-600" },
              {
                id: "available",
                label: "งานที่รับได้",
                color: "bg-emerald-500",
              },
              { id: "all", label: "งานทั้งหมด", color: "bg-slate-700" },
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

        {/* Compact Table View */}
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
                      className="hover:bg-indigo-50/20 transition-colors group"
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
                            order.status === "DESIGNING"
                              ? "bg-purple-100 text-purple-600"
                              : order.status === "PENDING_ARTWORK"
                                ? "bg-blue-100 text-blue-600"
                                : order.status === "PENDING_PAYMENT"
                                  ? "bg-orange-100 text-orange-600"
                                  : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {{
                            PENDING_ARTWORK: "รอวางแบบ",
                            DESIGNING: "กำลังวางแบบ",
                            PENDING_PAYMENT: "รอชำระส่วนที่เหลือ",
                            PENDING_STOCK_CHECK: "รอสต็อคเช็ค",
                            STOCK_ISSUE: "สต็อกมีปัญหา",
                            IN_PRODUCTION: "กำลังผลิต",
                            READY_TO_SHIP: "รอจัดส่ง",
                            COMPLETED: "เสร็จสิ้น",
                            CANCELLED: "ยกเลิก",
                          }[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${order.graphic ? "bg-indigo-500" : "bg-slate-300 animate-pulse"}`}
                          ></div>
                          <span className="text-[11px] font-bold text-slate-600">
                            {order.graphic
                              ? order.graphic.name
                              : "ยังไม่มีผู้รับผิดชอบ"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/order/${order.id}`}
                          className="inline-flex items-center justify-center px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                        >
                          ไปยังหน้าออเดอร์
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
