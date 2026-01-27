import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function PurchasingDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWaitingOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:8000/api/orders?status=WAITING_STOCK",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setOrders(res.data.data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWaitingOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    } catch (err) {
      alert("Failed to update ETA");
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
    } catch (err) {
      alert("Failed to confirm arrival");
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black mb-8 text-slate-800">
        ฝ่ายจัดซื้อ (Purchasing)
      </h1>
      <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-[2rem] text-center text-slate-400 font-bold border-2 border-dashed">
            ไม่มีออเดอร์ที่รอสต็อก
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
                  View Details ออเดอร์
                </Link>

                <div className="flex flex-wrap gap-4">
                  <div className="bg-slate-50 p-3 rounded-xl min-w-[150px]">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                      ETA (วันที่ของจะเข้า)
                    </p>
                    <input
                      type="date"
                      defaultValue={order.purchasingEta?.split("T")[0]}
                      onChange={(e) =>
                        handleUpdateETA(
                          order.id,
                          e.target.value,
                          order.purchasingReason,
                        )
                      }
                      className="bg-transparent font-bold text-slate-700 outline-none"
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
                  ของเข้าแล้ว (Confirm)
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
