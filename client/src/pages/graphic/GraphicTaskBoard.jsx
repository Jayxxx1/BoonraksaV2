/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function GraphicTaskBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [claiming, setClaiming] = useState(null);
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
    fetchDesignOrders();
  }, [fetchDesignOrders]);

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600 font-bold">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
          <div className="flex items-center gap-3 mb-8">
            <HiOutlineClipboardDocumentList className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-black text-slate-800">
              งานออกแบบ (Graphic)
            </h1>
          </div>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setViewTab("all")}
              className={`px-6 py-3 rounded-xl font-black transition-all ${
                viewTab === "all"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setViewTab("me")}
              className={`px-6 py-3 rounded-xl font-black transition-all ${
                viewTab === "me"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              }`}
            >
              งานของฉัน
            </button>
            <button
              onClick={() => setViewTab("available")}
              className={`px-6 py-3 rounded-xl font-black transition-all ${
                viewTab === "available"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              }`}
            >
              งานรอรับ
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    JOB ID
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ลูกค้า
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    สถานะ
                  </th>
                  <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    ผู้รับผิดชอบ
                  </th>
                  <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-slate-400 font-bold"
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
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-all"
                    >
                      <td className="px-6 py-4">
                        <p className="font-black text-indigo-600">
                          {order.jobId || `#${order.id}`}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">
                          {order.customerName}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center w-fit px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
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
                          {/* Payment Status */}
                          <span
                            className={`inline-flex items-center w-fit px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              order.paymentStatus === "PAID"
                                ? "bg-emerald-100 text-emerald-700"
                                : order.paymentStatus === "PARTIALLY_PAID"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                            }`}
                          >
                            {order.paymentStatus === "PAID"
                              ? "ชำระครบแล้ว"
                              : order.paymentStatus === "PARTIALLY_PAID"
                                ? "มัดจำแล้ว"
                                : "ยังไม่จ่าย"}
                          </span>
                        </div>
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
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "PENDING_ARTWORK" &&
                            !order.graphic && (
                              <button
                                onClick={() => claimTask(order.id)}
                                disabled={claiming === order.id}
                                className="inline-flex items-center justify-center gap-1 px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-black hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
                              >
                                <HiOutlineCheckCircle className="w-4 h-4" />
                                {claiming === order.id
                                  ? "กำลังรับงาน..."
                                  : "รับงาน"}
                              </button>
                            )}
                          <Link
                            to={`/order/${order.id}`}
                            className="inline-flex items-center justify-center px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-black hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                          >
                            ดูรายละเอียด
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
      </div>
    </div>
  );
}
