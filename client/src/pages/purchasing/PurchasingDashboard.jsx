import { useState, useEffect, useCallback } from "react";
import api from "../../api/config";
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineCalendarDays,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import { useMaster } from "../../context/MasterContext";
import DateInput from "../../components/Common/DateInput";

export default function PurchasingDashboard() {
  const { getPreorderLabel } = useMaster();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchWaitingOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        params: { view: "available", search, purchasingMode: true },
      });
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWaitingOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchWaitingOrders, search]);

  const getSubStatusBadge = (subStatus) => {
    return (
      <span className="erp-status-badge bg-slate-100 text-slate-700 border-slate-200">
        {getPreorderLabel(subStatus)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header mb-6">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              ฝ่ายจัดซื้อ (Purchasing)
            </h1>
            <p className="erp-page-subtitle">
              จัดการรายการ Pre-order และติดตามวันเข้าพัสดุ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchWaitingOrders}
              className="group p-2 bg-white border border-slate-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-sm"
            >
              <HiOutlineArrowPath
                className={`w-4 h-4 text-slate-500 group-hover:text-indigo-600 transition-colors ${loading ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา เลขใบงาน หรือชื่อลูกค้า..."
                className="erp-search-input w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* ── Cards Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {loading && orders.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 erp-empty-state">
              <div className="erp-spinner mx-auto mb-3"></div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                กำลังดึงข้อมูล...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 erp-empty-state">
              <HiOutlineExclamationCircle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                {search
                  ? "ไม่พบออเดอร์ที่ตรงกับเงื่อนไข"
                  : "ไม่มีออเดอร์ที่รอจัดซื้อ"}
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <Link
                key={order.id}
                to={`/order/${order.id}`}
                className="erp-mobile-card border-l-[3px] border-l-indigo-600 hover:shadow-md hover:border-indigo-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-slate-100 text-slate-900 font-black px-2 py-0.5 rounded text-[10px]">
                      {order.jobId}
                    </div>
                    {getSubStatusBadge(order.preorderSubStatus)}
                  </div>

                  <h3 className="text-[12.5px] font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                    {order.customerName}
                  </h3>

                  <div className="flex items-center gap-2 mb-2.5 text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <HiOutlineClipboardDocumentList className="w-3 h-3" />
                      {order.items?.length || 0}
                    </span>
                    <span className="text-rose-600">
                      ฿{order.balanceDue?.toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-tighter">
                        วันของเข้า (ETA):
                      </span>
                      <span
                        className={`font-black ${order.purchasingEta ? "text-indigo-600" : "text-slate-300"}`}
                      >
                        {order.purchasingEta
                          ? new Date(order.purchasingEta).toLocaleDateString(
                              "th-TH",
                            )
                          : "ยังไม่ระบุ"}
                      </span>
                    </div>
                    {order.purchasingReason && (
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100/50">
                        <p className="text-[9px] text-slate-500 font-medium italic line-clamp-1">
                          {order.purchasingReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                    จัดการออเดอร์ →
                  </span>
                  {order.isUrgent && (
                    <div
                      className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"
                      title="งานด่วน"
                    />
                  )}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
