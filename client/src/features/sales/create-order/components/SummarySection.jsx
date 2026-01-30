import React from "react";
import { HiOutlineCheckCircle } from "react-icons/hi2";

const SummarySection = ({ totals, loading }) => {
  return (
    <div className="sticky top-20 z-40 space-y-6">
      <div className="erp-card shadow-md border-t-4 border-t-indigo-600">
        <div className="p-5 border-b border-slate-50 bg-slate-50/50">
          <h3 className="font-black text-slate-800 text-sm">
            สรุปรายการสั่งซื้อ (Summary)
          </h3>
        </div>
        <div className="p-5 space-y-5">
          {/* Pricing Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-tighter">
                จำนวนรวมทั้งหมด
              </span>
              <span className="font-black text-slate-900">
                {totals.totalQty} ตัว (Units)
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500 uppercase tracking-tighter">
                รวมราคาสินค้า
              </span>
              <span className="font-black text-slate-900">
                ฿{totals.subtotal.toLocaleString()}
              </span>
            </div>
            {totals.blockPrice > 0 && (
              <div className="flex justify-between items-center text-xs text-amber-600">
                <span className="font-bold uppercase tracking-tighter">
                  ค่าบล็อก
                </span>
                <span className="font-black">
                  +฿{totals.blockPrice.toLocaleString()}
                </span>
              </div>
            )}
            {totals.codSurcharge > 0 && (
              <div className="flex justify-between items-center text-xs text-indigo-600">
                <span className="font-bold uppercase tracking-tighter">
                  ค่าเก็บเงินปลายทาง (3% งานปัก)
                </span>
                <span className="font-black">
                  +฿{totals.codSurcharge.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <span className="text-sm font-black text-slate-800 uppercase tracking-tighter">
                ยอดรวมสุทธิ
              </span>
              <span className="text-xl font-black text-indigo-700">
                ฿{totals.finalTotal.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading || totals.totalQty === 0}
              className="erp-button erp-button-primary w-full py-4 text-base font-black shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <HiOutlineCheckCircle className="w-6 h-6" />{" "}
                  ยืนยันและสร้างออเดอร์
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummarySection;
