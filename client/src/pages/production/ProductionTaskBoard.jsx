/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineWrenchScrewdriver,
  HiOutlinePlay,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function ProductionTaskBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("available");

  const fetchProductionOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: viewTab },
      });
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, viewTab]);

  useEffect(() => {
    fetchProductionOrders();
  }, [fetchProductionOrders]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-400">
        กำลังโหลดรายการผลิต...
      </div>
    );

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
          <div className="flex bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
            {[
              { id: "me", label: "งานของฉัน", color: "bg-orange-600" },
              { id: "available", label: "รอการผลิต", color: "bg-emerald-500" },
              {
                id: "history",
                label: "ประวัติผลิตเสร็จ",
                color: "bg-slate-700",
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

        {/* List View */}
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
                      className="hover:bg-orange-50/20 transition-colors group"
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
                          {{
                            STOCK_RECHECKED: "รอการผลิต",
                            IN_PRODUCTION: "กำลังผลิต",
                            QC_PASSED: "ผลิตเสร็จ/ผ่าน QC",
                            COMPLETED: "ส่งของแล้ว",
                          }[order.status] || order.status}
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
      </div>
    </div>
  );
}
