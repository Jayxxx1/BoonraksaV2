import { useState, useEffect } from "react";
import api from "../../api/config";
import { HiOutlineReceiptRefund, HiOutlineCalendar } from "react-icons/hi2";
import { formatDateTime } from "../../utils/dateFormat";
import ImagePreviewModal from "../Common/ImagePreviewModal";

export default function PaymentHistory({ order, refreshTrigger }) {
  const [previewImage, setPreviewImage] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!order?._id && !order?.id) return;
      try {
        const id = order._id || order.id;
        const res = await api.get(`/orders/${id}/payments`);
        setPayments(res.data.data.payments);
      } catch (err) {
        console.error("Failed to fetch payment history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [order, refreshTrigger]);

  if (loading)
    return (
      <div className="text-center py-4 text-xs text-slate-400">
        Loading history...
      </div>
    );

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 rounded-md border-2 border-dashed border-slate-100 bg-slate-50/50">
        <p className="text-xs font-bold text-slate-400">
          ยังไม่มีประวัติการชำระเงิน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <HiOutlineReceiptRefund className="w-4 h-4 text-slate-400" />
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          ประวัติการชำระเงิน
        </h4>
      </div>
      {payments.map((payment) => (
        <div
          key={payment.id || payment._id}
          className="bg-white border border-slate-100 rounded-md p-4 flex gap-4 shadow-sm"
        >
          {/* Slip Thumbnail or COD Icon */}
          {payment.slipUrl ? (
            <button
              onClick={() => setPreviewImage(payment.slipUrl)}
              className="w-14 h-14 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0 cursor-zoom-in group relative"
            >
              <img
                src={payment.slipUrl}
                alt="Slip"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ) : (
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-emerald-100">
              <HiOutlineReceiptRefund className="w-6 h-6" />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <p className="font-black text-emerald-600 text-sm">
                +{parseFloat(payment.amount || 0).toLocaleString()} ฿
              </p>
              <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-bold max-w-[80px] truncate">
                {payment.uploader?.name || "ระบบ"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[9px] text-slate-400 mb-1">
              <HiOutlineCalendar className="w-3 h-3" />
              {formatDateTime(payment.createdAt)}
            </div>

            {payment.note && (
              <p className="text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg mt-1 truncate italic">
                {payment.note}
              </p>
            )}
          </div>
        </div>
      ))}

      <ImagePreviewModal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
      />
    </div>
  );
}
