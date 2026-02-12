import React from "react";
import {
  HiOutlineArrowLeft,
  HiOutlineFire,
  HiOutlineDocumentText,
  HiOutlinePrinter,
  HiOutlineCheckBadge,
  HiOutlineClock,
} from "react-icons/hi2";

const OrderHeader = ({
  order,
  user,
  isUpdating,
  navigate,
  formatDate,
  downloadCustomerProof,
  downloadJobSheet,
  getDisplayName,
  handleClaim,
  isGraphicRole,
  isStockRole,
  isProductionRole,
  isQCRole,
}) => {
  return (
    <>
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 h-16 pt-1">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-md transition-all"
              title="กลับ (Back)"
            >
              <HiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-none">
                  เลขใบงาน: {order.jobId}
                </h1>
                {order.isUrgent && (
                  <span className="erp-badge bg-rose-50 text-rose-700 animate-pulse border-rose-100 flex items-center gap-1">
                    <HiOutlineFire className="w-3 h-3" />
                    งานด่วน
                  </span>
                )}
                {order.hasPreorder && order.actionMap?.canViewPreorder && (
                  <span className="erp-badge bg-amber-50 text-amber-700 border-amber-100 flex items-center gap-1">
                    <HiOutlineClock className="w-3 h-3" />
                    PRE-ORDER
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                {user?.role !== "SALES" && user?.role !== "PURCHASING" && (
                  <>Ref: {order.systemJobNo?.toString()?.padStart(6, "0")} | </>
                )}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user?.role !== "PURCHASING" && (
              <>
                <button
                  onClick={downloadCustomerProof}
                  className="erp-button bg-indigo-50 text-indigo-700 border-indigo-100 py-1.5 px-3 text-xs"
                >
                  <HiOutlineDocumentText className="w-4 h-4" />
                  <span>พิมพ์ใบงานสำหรับลูกค้า</span>
                </button>
                {user?.role !== "SALES" && (
                  <button
                    onClick={downloadJobSheet}
                    className="erp-button erp-button-secondary py-1.5 px-3 text-xs"
                  >
                    <HiOutlinePrinter className="w-4 h-4" />
                    <span>พิมพ์ใบงานสำหรับองค์กร</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Bar */}
      {(order.graphic ||
        order.qc ||
        (isGraphicRole && !order.graphicId) ||
        (isQCRole && !order.qcId)) && (
        <div className="bg-slate-900 text-white shadow-sm border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between flex-wrap gap-4 text-[11px] font-bold">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
              {order.graphic && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-500 uppercase tracking-tighter">
                    กราฟิก (Graphic):
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-white border border-slate-700">
                    {getDisplayName(order.graphic, user)}
                  </span>
                </div>
              )}
              {order.stock && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-500 uppercase tracking-tighter">
                    สต็อก (Stock):
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-white border border-slate-700">
                    {getDisplayName(order.stock, user)}
                  </span>
                </div>
              )}
              {order.production && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-500 uppercase tracking-tighter">
                    โรงงาน (Factory):
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-white border border-slate-700">
                    {getDisplayName(order.production, user)}
                  </span>
                </div>
              )}
              {order.qc && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-slate-500 uppercase tracking-tighter">
                    ฝ่ายตรวจสอบ (QC):
                  </span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-white border border-slate-700">
                    {getDisplayName(order.qc, user)}
                  </span>
                </div>
              )}
            </div>

            {((isGraphicRole && !order.graphicId) ||
              (isStockRole && !order.stockId) ||
              (isProductionRole && !order.productionId) ||
              (isQCRole && !order.qcId)) && (
              <div className="flex items-center gap-3">
                <span className="text-indigo-300 animate-pulse hidden sm:inline">
                  กรุณากดรับงานก่อนเพื่อดำเนินการต่อ →
                </span>
                <button
                  onClick={handleClaim}
                  disabled={isUpdating}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg transition-all shadow-lg shadow-indigo-900/40 animate-pulse hover:animate-none flex items-center gap-2 border border-indigo-400 font-black text-xs"
                >
                  <HiOutlineCheckBadge className="w-4 h-4" />
                  {isUpdating
                    ? "กำลังบันทึก..."
                    : "กดรับงานเพื่อเริ่มทำ (Claim Task)"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default OrderHeader;
