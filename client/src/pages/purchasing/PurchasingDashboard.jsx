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
      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase bg-slate-100 text-slate-700 border border-current/20">
        {getPreorderLabel(subStatus)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2 bg-indigo-600 rounded-2xl text-white">
                <HiOutlineCalendarDays className="w-6 h-6" />
              </div>
              ฝ่ายจัดซื้อ (Purchasing)
            </h1>
            <p className="text-slate-500 font-bold ml-14 mt-1">
              จัดการรายการ Pre-order และติดตามวันเข้าพัสดุ
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchWaitingOrders}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-500 shadow-sm"
            >
              <HiOutlineArrowPath
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหา เลขใบงาน หรือชื่อลูกค้า..."
                className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all w-80 text-sm font-bold shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading && orders.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
                กำลังดึงข้อมูล...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="md:col-span-2 lg:col-span-3 bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-100">
              <HiOutlineExclamationCircle className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">
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
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all border-l-4 border-l-indigo-600 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="bg-slate-100 text-slate-900 font-black px-2 py-0.5 rounded text-[10px]">
                      {order.jobId}
                    </div>
                    {getSubStatusBadge(order.preorderSubStatus)}
                  </div>

                  <h3 className="text-sm font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors truncate">
                    {order.customerName}
                  </h3>

                  <div className="flex items-center gap-2 mb-3 text-[10px] font-bold text-slate-400">
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
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100/50">
                        <p className="text-[9px] text-slate-500 font-medium italic line-clamp-1">
                          {order.purchasingReason}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
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
