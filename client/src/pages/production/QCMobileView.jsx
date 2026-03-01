import { useState, useEffect, useCallback } from "react";
import api from "../../api/config";
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
      const res = await api.get("/orders", {
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-erp-in">
        <div className="erp-spinner"></div>
        <p className="text-slate-500 text-[12px] font-bold mt-4">
          กำลังโหลดรายการ QC...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header mb-5">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              <HiOutlineCheckBadge className="w-5 h-5 text-indigo-600" />
              แผนกตรวจสอบคุณภาพ (QC)
            </h1>
            <p className="erp-page-subtitle">
              ตรวจสอบชิ้นงานที่ผลิตเสร็จแล้ว ก่อนส่งไปยังฝ่ายจัดส่ง
            </p>
          </div>
          <div className="erp-tab-container">
            {[
              { id: "me", label: "งานของฉัน" },
              { id: "available", label: "รอตรวจ QC" },
              { id: "history", label: "ประวัติสำเร็จ" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setViewTab(tab.id)}
                className={`erp-tab ${viewTab === tab.id ? "erp-tab-active" : "erp-tab-inactive"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="erp-table-container">
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>รายละเอียดงาน</th>
                  <th>สถานะ</th>
                  <th>ผู้ตรวจ QC</th>
                  <th className="text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-3 py-10 text-center text-slate-400 text-[12px] font-bold"
                    >
                      ไม่มีรายการงานในหน้านี้
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[12.5px] font-black text-slate-900">
                              {order.jobId}
                            </span>
                            {order.isUrgent && (
                              <span className="erp-urgent-tag">ด่วน</span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-slate-500">
                            {order.customerName}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`erp-status-badge ${
                            order.status === "QC_PASSED"
                              ? "bg-emerald-100 text-emerald-600 border-emerald-200"
                              : "bg-orange-100 text-orange-600 border-orange-200"
                          }`}
                        >
                          {{
                            PRODUCTION_FINISHED: "รอตรวจ QC",
                            READY_TO_SHIP: "รอจัดส่ง",
                            COMPLETED: "เสร็จสิ้น",
                          }[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
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
                      <td className="px-3 py-2.5 text-right">
                        <Link
                          to={`/order/${order.id}`}
                          className="erp-action-btn"
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

      {/* Mobile FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden">
        <button className="w-14 h-14 bg-slate-900 text-white rounded-lg shadow-2xl flex items-center justify-center ring-4 ring-white">
          <HiOutlineQrCode className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
