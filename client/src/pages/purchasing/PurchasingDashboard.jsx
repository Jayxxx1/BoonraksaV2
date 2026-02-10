import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import DateInput from "../../components/Common/DateInput";

export default function PurchasingDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchWaitingOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get("http://localhost:8000/api/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: { view: "available", search },
      });
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchWaitingOrders();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchWaitingOrders, search]);

  const handleUpdateETA = async (orderId, eta, reason) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/purchasing`,
        {
          purchasingEta: eta,
          purchasingReason: reason,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchWaitingOrders();
    } catch {
      alert("ไม่สามารถอัปเดตวันของเข้าได้");
    }
  };

  const handleConfirmArrival = async (orderId) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/purchasing`,
        {
          status: "PENDING_ARTWORK",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchWaitingOrders();
    } catch {
      alert("ไม่สามารถยืนยันข่าวเข้าได้");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <h1 className="text-3xl font-black text-slate-800">
          ฝ่ายจัดซื้อ (Purchasing)
        </h1>

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
      </div>

      <div className="grid gap-6">
        {loading && orders.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center text-slate-400 font-bold border-2 border-dashed">
            กำลังโหลดข้อมูลจัดซื้อ...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center text-slate-400 font-bold border-2 border-dashed">
            {search ? "ไม่พบออเดอร์ที่ค้นหา" : "ไม่มีออเดอร์ที่รอสต็อก"}
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-amber-100 text-amber-700 font-black px-3 py-1 rounded-lg text-sm">
                    {order.jobId}
                  </span>
                  <h3 className="text-xl font-bold text-slate-800">
                    {order.customerName}
                  </h3>
                </div>
                <p className="text-slate-500 mb-4">
                  {order.items?.length} รายการ | ค้างชำระ: {order.balanceDue} ฿
                </p>

                <Link
                  to={`/order/${order.id}`}
                  className="inline-flex items-center gap-2 mb-4 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-widest"
                >
                  <HiOutlineClipboardDocumentList className="w-4 h-4" />
                  ดูรายละเอียดออเดอร์
                </Link>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl min-w-[150px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      ETA (วันที่ของจะเข้า)
                    </p>
                    <DateInput
                      value={order.purchasingEta?.split("T")[0]}
                      onChange={(e) =>
                        handleUpdateETA(
                          order.id,
                          e.target.value,
                          order.purchasingReason,
                        )
                      }
                      className="bg-transparent font-bold text-slate-700 outline-none w-full"
                    />
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl flex-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      เหตุผล/หมายเหตุ
                    </p>
                    <input
                      type="text"
                      defaultValue={order.purchasingReason}
                      onBlur={(e) =>
                        handleUpdateETA(
                          order.id,
                          order.purchasingEta,
                          e.target.value,
                        )
                      }
                      placeholder="ใส่เหตุผลกรณีล่าช้า..."
                      className="bg-transparent font-bold text-slate-700 outline-none w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <button
                  onClick={() => handleConfirmArrival(order.id)}
                  className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-emerald-100 transition-all flex items-center gap-2"
                >
                  <HiOutlineCheckCircle className="w-6 h-6" />
                  สินค้าเข้าคลังแล้ว (Confirm)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
