import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineTruck,
  HiOutlineShieldCheck,
  HiOutlineExclamationCircle,
  HiOutlineCreditCard,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function DeliveryDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReadyToShip = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        "http://localhost:8000/api/orders?status=READY_TO_SHIP",
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
  }, [token]);

  useEffect(() => {
    fetchReadyToShip();
  }, [fetchReadyToShip]);

  const handleCompleteOrder = async (orderId, tracking) => {
    try {
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/complete`,
        {
          trackingNo: tracking,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      fetchReadyToShip();
    } catch (err) {
      alert(err.response?.data?.message || "Delivery completion failed");
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-400">
        กำลังโหลดรายการจัดส่ง...
      </div>
    );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-slate-800 tracking-tighter">
            แผนกจัดส่งสินค้า
          </h1>
          <p className="text-slate-500 font-medium">
            ฝ่ายจัดส่งและตรวจสอบยอดค้างชำระก่อนส่งสินค้า
          </p>
        </div>
        <div className="bg-indigo-600 px-6 py-4 rounded-[2rem] text-white shadow-xl flex items-center gap-4">
          <HiOutlineTruck className="w-8 h-8" />
          <div>
            <p className="text-[10px] font-black opacity-70 uppercase tracking-widest">
              รอจัดส่ง
            </p>
            <p className="text-2xl font-black leading-none">{orders.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {orders.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold italic">
              ไมามีออเดอร์ที่รอจัดส่ง
            </p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-2xl transition-all border-l-8 border-l-emerald-500"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full mb-1 inline-block">
                      {order.jobId}
                    </span>
                    <h3 className="text-base font-bold text-slate-800">
                      {order.customerName}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      ยอดค้างชำระ
                    </p>
                    <p
                      className={`text-lg font-black ${order.balanceDue > 0 ? "text-rose-600" : "text-emerald-500"}`}
                    >
                      {order.balanceDue} ฿
                    </p>
                  </div>
                </div>

                <Link
                  to={`/order/${order.id}`}
                  className="w-full mb-4 py-3 bg-white text-indigo-600 rounded-xl font-bold flex items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-50 transition-all"
                >
                  <HiOutlineClipboardDocumentList className="w-6 h-6" />
                  ดูรายละเอียดออเดอร์
                </Link>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                  <p className="text-xs font-bold text-slate-400 mb-3 uppercase flex items-center gap-2">
                    <HiOutlineExclamationCircle className="w-4 h-4" />
                    ที่อยู่จัดส่ง
                  </p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed italic">
                    {order.customerAddress || "ไม่ระบุที่อยู่"}
                  </p>
                </div>

                {order.balanceDue > 0 ? (
                  <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                      <HiOutlineShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-rose-600 font-black">
                        ชำระเงินไม่ครบ!
                      </p>
                      <p className="text-xs text-rose-500 font-medium">
                        บล็อกการส่งชั่วคราว จนกว่าฝ่ายขายจะอัปเดตยอด
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="กรอกเลขพัสดุ (Tracking No.)..."
                        id={`tracking-${order.id}`}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => {
                        const val = document.getElementById(
                          `tracking-${order.id}`,
                        ).value;
                        if (!val) return alert("Please enter tracking number");
                        handleCompleteOrder(order.id, val);
                      }}
                      className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      <HiOutlineTruck className="w-6 h-6" />
                      ยืนยันการจัดส่ง (Complete)
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
