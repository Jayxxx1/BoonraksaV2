import React, { useState } from "react";
import {
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftRight,
  HiOutlineClock,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from "react-icons/hi2";
import PaymentHistory from "../Payment/PaymentHistory";

const TimelineSection = ({ order, formatDate, formatTime }) => {
  const [showAll, setShowAll] = useState(false);
  const logs = order.logs || [];
  const displayLogs = showAll ? logs : logs.slice(0, 5);
  const hasMore = logs.length > 5;

  return (
    <div className="erp-card p-5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <HiOutlineClock className="w-5 h-5 text-slate-500" />
          <h3 className="font-bold text-slate-800 text-sm">
            ประวัติการดำเนินงาน
          </h3>
        </div>
        <span className="erp-status-badge bg-slate-50 text-slate-500 border-slate-200 text-[9px]">
          {logs.length} รายการ
        </span>
      </div>
      <div className="space-y-5 relative before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
        {displayLogs.map((log, idx) => (
          <div
            key={idx}
            className="relative pl-8 animate-erp-in"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div
              className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${
                idx === 0
                  ? "bg-indigo-500 ring-4 ring-indigo-50"
                  : "bg-slate-200"
              }`}
            />
            <p className="text-[10px] font-bold text-slate-400 mb-0.5">
              {formatDate(log.timestamp)} • {formatTime(log.timestamp)}
            </p>
            <p className="text-[11px] font-black text-slate-700 leading-tight">
              {log.action}
            </p>
            {log.details && (
              <p className="text-[10px] text-slate-500 mt-0.5 bg-slate-50 px-2 py-1 rounded border border-slate-100 italic">
                {log.details}
              </p>
            )}
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
              โดย: {log.user?.name || "ระบบ"}
            </p>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-black text-indigo-600 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-all uppercase tracking-widest"
          >
            {showAll ? (
              <>
                <HiOutlineChevronUp className="w-3.5 h-3.5" />
                ย่อประวัติ
              </>
            ) : (
              <>
                <HiOutlineChevronDown className="w-3.5 h-3.5" />
                ดูประวัติทั้งหมด ({logs.length})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const OrderSidebar = ({
  order,
  user,
  canViewFinancial,
  getPaymentStatusBadge,
  formatDate,
  formatTime,
}) => {
  return (
    <div className="space-y-6">
      {/* Customer Info */}
      {user?.role !== "DIGITIZER" && (
        <div className="erp-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <HiOutlineUser className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">ข้อมูลลูกค้า</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <HiOutlineUser className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ชื่อลูกค้า (Customer)
                </p>
                <p className="font-bold text-slate-800">{order.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                <HiOutlinePhone className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  เบอร์โทรศัพท์ (Contact)
                </p>
                <p className="font-bold text-slate-800">
                  {order.customerPhone}
                </p>
              </div>
            </div>
            {order.customerFb && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <HiOutlineChatBubbleLeftRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Facebook
                  </p>
                  <p className="font-bold text-slate-800">{order.customerFb}</p>
                </div>
              </div>
            )}
            {order.customerAddress && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mt-1">
                  <HiOutlineMapPin className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    ที่อยู่จัดส่ง (Address)
                  </p>
                  <p className="font-bold text-slate-800 text-sm leading-snug">
                    {order.customerAddress}
                  </p>
                </div>
              </div>
            )}
            {order.notes && (
              <div className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                    หมายเหตุจดออเดอร์
                  </p>
                  <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                    {order.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment & Financial summary */}
      {canViewFinancial && (
        <div className="erp-card bg-indigo-600 text-white overflow-hidden shadow-indigo-200">
          <div className="p-5 border-b border-indigo-500/50 bg-indigo-700/30">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] font-black uppercase tracking-[0.2em] text-indigo-200">
                สรุปยอดเงิน
              </span>
              {getPaymentStatusBadge(order.paymentStatus)}
            </div>
            <div className="text-3xl font-black mb-1">
              ฿{parseFloat(order.totalPrice || 0).toLocaleString()}
            </div>
            <p className="text-[10px] font-bold text-indigo-200 uppercase">
              ยอดสุทธิทั้งหมด
            </p>
          </div>
          <div className="p-5 space-y-4 bg-indigo-600">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold opacity-80">ชำระแล้ว</span>
              <span className="font-black text-emerald-300">
                ฿{parseFloat(order.paidAmount || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold opacity-80">ยอดค้าง</span>
              <span className="font-black text-rose-300">
                ฿{parseFloat(order.balanceDue || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs pt-2 border-t border-indigo-500/50">
              <span className="font-bold opacity-80">ช่องทางขาย</span>
              <span className="font-black bg-white/20 px-2 py-0.5 rounded">
                {order.salesChannel?.name || "-"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Activity Timeline */}
      <TimelineSection
        order={order}
        formatDate={formatDate}
        formatTime={formatTime}
      />

      {canViewFinancial && <PaymentHistory order={order} />}
    </div>
  );
};

export default OrderSidebar;
