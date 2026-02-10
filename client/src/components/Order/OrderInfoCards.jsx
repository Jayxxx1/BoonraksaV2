import React from "react";
import {
  HiOutlineNoSymbol,
  HiOutlineBellAlert,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";

const OrderInfoCards = ({ order }) => {
  if (!order.purchasingReason && !order.urgentNote && !order.cancelReason)
    return null;

  return (
    <div className="space-y-4">
      {order.cancelReason && (
        <div className="erp-card p-4 bg-rose-50 border-rose-200 flex items-start gap-4 animate-erp-in">
          <div className="p-2 bg-rose-100 rounded text-rose-600">
            <HiOutlineNoSymbol className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">
              เหตุผลการยกเลิก (Cancellation Reason)
            </h4>
            <p className="font-bold text-rose-900 text-sm leading-snug">
              {order.cancelReason}
            </p>
          </div>
        </div>
      )}
      {order.urgentNote && (
        <div className="erp-card p-4 bg-amber-50 border-amber-200 flex items-start gap-4 animate-erp-in">
          <div className="p-2 bg-amber-100 rounded text-amber-600">
            <HiOutlineBellAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
              หมายเหตุงานด่วน (Urgent Note)
            </h4>
            <p className="font-bold text-amber-900 text-sm leading-snug">
              {order.urgentNote}
            </p>
          </div>
        </div>
      )}
      {order.purchasingReason && (
        <div className="erp-card p-4 bg-orange-50 border-orange-200 flex items-start gap-4 animate-erp-in">
          <div className="p-2 bg-orange-100 rounded text-orange-600">
            <HiOutlineExclamationCircle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mb-1">
              แจ้งปัญหาจากฝ่ายสต็อก (Stock Issue)
            </h4>
            <p className="font-bold text-orange-900 text-sm leading-snug">
              {order.purchasingReason}
            </p>
            {order.purchasingEta && (
              <div className="mt-2 text-[10px] bg-orange-200/50 w-fit px-2 py-0.5 rounded text-orange-800 font-bold">
                ETA: {new Date(order.purchasingEta).toLocaleDateString("th-TH")}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderInfoCards;
