import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineQrCode,
  HiOutlineCheckBadge,
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function QCTaskBoard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTab, setViewTab] = useState("available");

  const fetchQCWork = useCallback(async () => {
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
    fetchQCWork();
  }, [fetchQCWork]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-400">
        กำลังโหลดรายการ QC...
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-teal-600 p-8 rounded-b-[3rem] shadow-xl text-white mb-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black flex items-center gap-3">
              <HiOutlineCheckBadge className="w-10 h-10" />
              แผนกตรวจสอบคุณภาพ (QC)
            </h1>
            <p className="text-teal-100 font-medium">
              ตรวจสอบชิ้นงานที่ผลิตเสร็จแล้ว ก่อนส่งไปยังฝ่ายจัดส่ง
            </p>
          </div>

          <div className="flex bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-1 shadow-inner">
            {[
              { id: "me", label: "งานของฉัน", color: "bg-teal-500" },
              { id: "available", label: "รอตรวจ QC", color: "bg-emerald-500" },
              { id: "history", label: "ประวัติสำเร็จ", color: "bg-amber-500" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                  viewTab === tab.id
                    ? `${tab.color} text-white shadow-lg`
                    : "text-teal-100 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">รายละเอียดงาน</th>
                  <th className="px-6 py-4">สถานะ</th>
                  <th className="px-6 py-4">ผู้ตรวจ QC</th>
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
                      ไม่มีรายการงานในหน้านี้
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-teal-50/20 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
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
                          <span className="text-[11px] font-bold text-slate-500">
                            {order.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            order.status === "QC_PASSED"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {{
                            IN_PRODUCTION: "รอตรวจ QC",
                            QC_PASSED: "ตรวจผ่านแล้ว",
                            READY_TO_SHIP: "รอจัดส่ง",
                            COMPLETED: "เสร็จสิ้น",
                          }[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.qc ? (
                          <span className="text-[11px] font-bold text-emerald-600">
                            {order.qc.name}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-300 italic">
                            ยังไม่มีพนักงานรับผิดชอบ
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/order/${order.id}`}
                          className="inline-flex items-center justify-center px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-black hover:bg-teal-600 transition-all shadow-sm"
                        >
                          ตรวจสอบงาน
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

      {/* Mobile Floating Action Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2">
        <button className="w-16 h-16 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center ring-8 ring-white">
          <HiOutlineQrCode className="w-8 h-8" />
        </button>
      </div>
    </div>
  );
}
