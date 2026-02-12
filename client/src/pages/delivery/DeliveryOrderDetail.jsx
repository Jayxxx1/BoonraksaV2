import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineCube,
  HiOutlineBanknotes,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineArrowLeft,
  HiOutlineExclamationTriangle,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import PaymentModal from "../../components/Payment/PaymentModal";

export default function DeliveryOrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackingNo, setTrackingNo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8000/api/orders/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setOrder(res.data.data.order);
      if (res.data.data.order.trackingNo) {
        setTrackingNo(res.data.data.order.trackingNo);
      }
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถดึงข้อมูลออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [orderId, token]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleCompleteOrder = async () => {
    if (!trackingNo) return alert("กรุณากรอกเลขพัสดุ");
    if (!window.confirm(`ยืนยันการจัดส่งออเดอร์นี้ด้วยเลขพัสดุ ${trackingNo}?`))
      return;

    try {
      setSubmitting(true);
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/complete`,
        { trackingNo },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      alert("บันทึกการจัดส่งเรียบร้อย! 🎉");
      navigate("/delivery");
    } catch (err) {
      alert(err.response?.data?.message || "Delivery completion failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );

  if (!order) return <div className="text-center p-10">Order not found</div>;

  const isPaid =
    order.paymentStatus === "PAID" || parseFloat(order.balanceDue) <= 0;
  const isCOD = order.paymentMethod === "COD";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <button
        onClick={() => navigate("/delivery")}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-6 transition-colors"
      >
        <HiOutlineArrowLeft className="w-5 h-5" /> กลับไปหน้ากระดาน
      </button>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Section */}
        <div className="bg-slate-50 p-6 md:p-8 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-black uppercase">
                Job ID
              </span>
              <h1 className="text-3xl font-black text-slate-900">
                {order.jobId}
              </h1>
            </div>
            <p className="font-bold text-slate-500 text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>{" "}
              {order.customerName}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">
              สถานะปัจจุบัน
            </p>
            <div className="flex flex-col items-end gap-1">
              <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-black border border-indigo-100 uppercase tracking-tight">
                <HiOutlineCube className="w-5 h-5" />
                {order.displayStatusLabel || order.status}
              </div>
              {order.subStatusLabel && (
                <p className="text-[10px] font-black text-rose-500 uppercase animate-pulse">
                  ⚠️ {order.subStatusLabel}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-10 space-y-10">
          {/* 1. FINANCIAL HIGHLIGHT (MAIN FOCUS) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Price */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-black text-slate-400 uppercase mb-2">
                ยอดรวมทั้งหมด (Total)
              </p>
              <p className="text-3xl font-black text-slate-800">
                {parseFloat(order.totalPrice).toLocaleString()} ฿
              </p>
            </div>

            {/* Paid Amount */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-black text-slate-400 uppercase mb-2">
                จ่ายแล้ว (Paid)
              </p>
              <p className="text-3xl font-black text-emerald-600">
                {parseFloat(order.paidAmount).toLocaleString()} ฿
              </p>
            </div>

            {/* Balance Due */}
            <div
              className={`p-6 rounded-2xl border-2 text-center relative overflow-hidden ${isPaid ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-200"}`}
            >
              <p
                className={`text-xs font-black uppercase mb-2 ${isPaid ? "text-emerald-500" : "text-rose-500"}`}
              >
                {isPaid ? "ชำระครบแล้ว" : "ยอดค้างชำระ (Balance)"}
              </p>
              <p
                className={`text-4xl font-black ${isPaid ? "text-emerald-700" : "text-rose-600"}`}
              >
                {parseFloat(order.balanceDue).toLocaleString()} ฿
              </p>
              {!isPaid && (
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <HiOutlineExclamationTriangle className="w-24 h-24 text-rose-500" />
                </div>
              )}
            </div>
          </div>

          {!isPaid && !isCOD && (
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r-xl flex items-start gap-3">
              <HiOutlineBanknotes className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-orange-800">
                  ลูกค้ายังชำระเงินไม่ครบ
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  กรุณาแจ้งลูกค้าผ่านเพจ และอัปโหลดหลักฐานการโอนเงิน
                  (เว้นแต่เป็น COD)
                </p>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-black text-sm shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all active:scale-95"
                >
                  <HiOutlineClipboardDocumentList className="w-4 h-4" />
                  แจ้งชำระเงิน / อัปโหลดสลิป
                </button>
              </div>
            </div>
          )}

          {isPaid && !isCOD && (
            <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-r-xl flex items-start gap-3">
              <HiOutlineCheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-emerald-800">
                  ชำระเงินเรียบร้อยแล้ว
                </h3>
                <p className="text-sm text-emerald-700">
                  ขอบคุณสำหรับการตรวจสอบ
                </p>
              </div>
            </div>
          )}

          {isCOD && (
            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-xl flex items-start gap-3">
              <HiOutlineTruck className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-indigo-800">
                  เก็บเงินปลายทาง (COD)
                </h3>
                <p className="text-sm text-indigo-700">
                  ยอดที่ต้องเก็บจากลูกค้า:{" "}
                  <span className="font-black text-lg">
                    {parseFloat(order.balanceDue).toLocaleString()} ฿
                  </span>
                </p>
              </div>
            </div>
          )}

          <hr className="border-slate-100" />

          {/* 2. DELIVERY ACTION */}
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-black text-slate-800 mb-2">
                📦 บันทึกการจัดส่ง
              </h2>
              <p className="text-slate-500 text-sm">
                กรอกเลขพัสดุเมื่อทำการส่งสินค้าเรียบร้อยแล้ว
              </p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-inner">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-3 ml-1">
                เลขพัสดุ (Tracking Number)
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiOutlineTruck className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    placeholder="Scan or type tracking number..."
                    className="block w-full pl-11 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl text-lg font-bold placeholder-slate-300 focus:border-indigo-500 focus:ring-0 transition-all outline-none text-slate-800"
                    autoFocus
                  />
                </div>
                <button
                  onClick={handleCompleteOrder}
                  disabled={submitting || (!isPaid && !isCOD)}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-4 rounded-2xl font-black text-lg shadow-lg shadow-emerald-200 transition-all active:scale-95 flex items-center gap-2"
                >
                  {submitting ? (
                    "Creating..."
                  ) : (
                    <>
                      <HiOutlineCheckCircle className="w-6 h-6" /> ยืนยันส่งของ
                    </>
                  )}
                </button>
              </div>
              {!isPaid && !isCOD && (
                <p className="text-center text-xs font-bold text-rose-400 mt-3">
                  * ไม่สามารถส่งของได้เนื่องจากยังชำระเงินไม่ครบ
                </p>
              )}
            </div>

            {/* Address Info */}
            <div className="border border-slate-200 rounded-2xl p-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">
                ที่อยู่จัดส่ง (Shipping Address)
              </p>
              <p className="text-lg font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                {order.customerAddress || "ไม่ระบุที่อยู่"}
              </p>
              {order.customerPhone && (
                <p className="mt-4 font-bold text-slate-600 flex items-center gap-2">
                  📞 {order.customerPhone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={fetchOrder}
        />
      )}
    </div>
  );
}
