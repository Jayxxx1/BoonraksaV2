import React from "react";
import { HiOutlineBriefcase } from "react-icons/hi2";
import SearchableSelect from "../../../../components/SearchableSelect"; // Adjust path as needed
import DateInput from "../../../../components/Common/DateInput";

const OrderInfoSection = ({ orderInfo, setOrderInfo, facebookPages }) => {
  return (
    <div className="erp-card shadow-sm">
      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
        <HiOutlineBriefcase className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800 text-sm">ข้อมูลคำสั่งซื้อ</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sales Channel */}
        <div className="space-y-1">
          <label className="erp-label">ช่องทางขาย / เพจ Facebook</label>
          <SearchableSelect
            options={facebookPages}
            value={orderInfo.salesChannelId}
            onChange={(val) =>
              setOrderInfo({ ...orderInfo, salesChannelId: val })
            }
            placeholder="เลือกเพจ Facebook..."
            displayKey="name"
            valueKey="id"
            searchKeys={["name", "code"]}
            className="!py-1"
          />
        </div>

        {/* Due Date & Urgent */}
        <div className="space-y-1 flex gap-4">
          <div className="flex-1 space-y-1">
            <label className="erp-label">วันกำหนดส่งงาน</label>
            <DateInput
              value={orderInfo.dueDate}
              onChange={(e) =>
                setOrderInfo({
                  ...orderInfo,
                  dueDate: e.target.value,
                })
              }
              className="erp-input py-1.5 text-sm font-bold w-full"
            />
          </div>
          <div className="space-y-1">
            <label className="erp-label block">&nbsp;</label>
            <button
              type="button"
              onClick={() =>
                setOrderInfo({
                  ...orderInfo,
                  isUrgent: !orderInfo.isUrgent,
                })
              }
              className={`h-[34px] px-4 rounded-lg text-xs font-black transition-all ${orderInfo.isUrgent ? "bg-rose-500 text-white shadow-md ring-2 ring-rose-100" : "bg-white text-slate-400 border border-slate-200"}`}
            >
              {orderInfo.isUrgent ? "ด่วน (3 วัน)" : "งานปกติ"}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="md:col-span-2 space-y-1">
          <label className="erp-label">หมายเหตุภายใน (ฝ่ายผลิต/QC)</label>
          <textarea
            value={orderInfo.notes}
            onChange={(e) =>
              setOrderInfo({ ...orderInfo, notes: e.target.value })
            }
            className="erp-input p-3 text-sm leading-relaxed min-h-[80px] resize-none"
            placeholder="ระบุคำแนะนำพิเศษ..."
          />
        </div>
      </div>
    </div>
  );
};

export default OrderInfoSection;
