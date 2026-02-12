import React from "react";
import {
  HiOutlinePhoto,
  HiOutlineCurrencyDollar,
  HiOutlineTrash,
} from "react-icons/hi2";

const PaymentSection = ({
  draftImages,
  setDraftImages,
  onUploadDraft,
  uploadingDraft,
  totals,
  paidAmount,
  setPaidAmount,
  setHasManualDeposit,
  depositSlipUrl,
  onUploadSlip,
  isUploadingSlip,
  paymentMethod,
  setPaymentMethod,
}) => {
  return (
    <div className="space-y-6">
      {/* 4. Attachments (Mockups) */}
      <div className="erp-card shadow-sm">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlinePhoto className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              รูปภาพวางแบบให้ลูกค้า{" "}
            </h3>
          </div>
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={onUploadDraft}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <button
              type="button"
              className="erp-button erp-button-secondary py-1.5 text-xs"
              disabled={uploadingDraft}
            >
              {uploadingDraft ? "..." : "Upload Images"}
            </button>
          </div>
        </div>
        <div className="p-5">
          {draftImages.length > 0 ? (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
              {draftImages.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square bg-slate-50 rounded-lg border border-slate-100 overflow-hidden group relative shadow-inner"
                >
                  <img
                    src={img}
                    className="w-full h-full object-cover"
                    alt={`mockup-${idx}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setDraftImages(draftImages.filter((_, i) => i !== idx))
                    }
                    className="absolute top-1 right-1 p-1 bg-rose-500 text-white rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <HiOutlineTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] font-bold text-slate-400 text-center py-4">
              อัปโหลดรูปภาพแบบเพื่อให้ลูกค้าคอนเฟิร์ม
            </p>
          )}
        </div>
      </div>

      {/* Payment Info Card */}
      <div className="erp-card shadow-sm border-t-4 border-t-emerald-500">
        <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineCurrencyDollar className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">
              บันทึกการชำระเงิน
            </h3>
          </div>
          {depositSlipUrl && (
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase tracking-tighter">
              อัปโหลดสลิปแล้ว
            </span>
          )}
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Method Selector */}
            <div className="md:col-span-2 flex items-center justify-between bg-slate-100 p-3 rounded-lg border border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">
                รูปแบบการชำระเงิน
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                    paymentMethod === "TRANSFER"
                      ? "bg-emerald-600 text-white shadow-md"
                      : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  โอนจ่าย (Transfer)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("COD")}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all ${
                    paymentMethod === "COD"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white text-slate-500 border border-slate-200"
                  }`}
                >
                  เก็บเงินปลายทาง (COD +3%)
                </button>
              </div>
            </div>

            {/* COD Notice */}
            {paymentMethod === "COD" && (
              <div className="md:col-span-2 bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                  <span className="font-black text-indigo-600 text-xs text-center leading-none">
                    +3%
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-indigo-800">
                    +3% สำหรับงานปัก (เก็บเงินปลายทาง)
                  </p>
                  <p className="text-[10px] text-indigo-600">
                    เนื่องจากมีการใช้บล็อคปัก/สกรีน
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="erp-label">มัดจำ *</label>
              <input
                type="number"
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(e.target.value);
                  setHasManualDeposit(true);
                }}
                className="erp-input py-2 text-lg font-black text-emerald-600 bg-emerald-50"
              />
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                ขั้นต่ำที่แนะนำ (20%): ฿
                {Math.round(totals.finalTotal * 0.2).toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <label className="erp-label">ยอดคงเหลือค้างชำระ</label>
              <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-lg font-black text-rose-600 flex justify-between items-center">
                <span>฿{totals.balance.toLocaleString()}</span>
                <span className="text-[9px] font-bold uppercase tracking-tighter opacity-70">
                  รอการชำระ
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={onUploadSlip}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <button
              type="button"
              className={`erp-button w-full py-2.5 text-xs font-bold border-2 border-dashed ${
                depositSlipUrl
                  ? "bg-white border-emerald-300 text-emerald-600"
                  : "bg-slate-50 border-slate-200 text-slate-400"
              }`}
              disabled={isUploadingSlip}
            >
              {isUploadingSlip
                ? "กำลังอัปโหลด..."
                : depositSlipUrl
                  ? "เปลี่ยนสลิป (Change Slip)"
                  : "+ อัปโหลดสลิปโอนเงิน (Upload Slip)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSection;
