import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import { HiOutlineReceiptRefund, HiOutlineCalendar } from "react-icons/hi2";
import { formatDateTime } from "../../utils/dateFormat";

export default function PaymentHistory({ orderId, refreshTrigger }) {
  const { token } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8000/api/orders/${orderId}/payments`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setPayments(res.data.data.payments);
      } catch (err) {
        console.error("Failed to fetch payment history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [orderId, token, refreshTrigger]);

  if (loading)
    return (
      <div className="text-center py-4 text-xs text-slate-400">
        Loading history...
      </div>
    );

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 rounded-2xl border-2 border-dashed border-slate-100 bg-slate-50/50">
        <p className="text-xs font-bold text-slate-400">
          ยังไม่มีประวัติการชำระเงิน
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="bg-white border border-slate-100 rounded-2xl p-4 flex gap-4"
        >
          {/* Slip Thumbnail or COD Icon */}
          {payment.slipUrl ? (
            <a
              href={payment.slipUrl}
              target="_blank"
              rel="noreferrer"
              className="w-16 h-16 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex-shrink-0"
            >
              <img
                src={payment.slipUrl}
                alt="Slip"
                className="w-full h-full object-cover"
              />
            </a>
          ) : (
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 border border-orange-200">
              <HiOutlineReceiptRefund className="w-8 h-8" />
            </div>
          )}

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-1">
              <p className="font-black text-emerald-600 text-sm">
                +{payment.amount.toLocaleString()} ฿
              </p>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-500 font-bold">
                {payment.uploader?.name || "Unknown"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-1">
              <HiOutlineCalendar className="w-3 h-3" />
              {formatDateTime(payment.createdAt)}
            </div>

            {payment.note && (
              <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1 truncate">
                {payment.note}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
