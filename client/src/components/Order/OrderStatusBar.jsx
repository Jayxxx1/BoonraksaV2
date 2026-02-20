import React from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineBellAlert,
  HiOutlineNoSymbol,
  HiOutlineArrowRightCircle,
  HiOutlineExclamationCircle,
  HiOutlineCurrencyDollar,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const OrderStatusBar = ({
  order,
  user,
  isAdmin,
  isUpdating,
  handleUpdateStatus,
  handleClaim,
  setShowUrgentModal,
  setShowCancelModal,
  setShowStockIssueModal,
  setShowRejectModal,
  setShowBufferModal,
  setShowPaymentModal,
  trackingNo,
  setTrackingNo,
  setShowProductionWorkerModal,
  getStatusBadge,
}) => {
  const isClaimedByMe = (targetId) => targetId === user?.id;

  const isStockRole = user?.role === "STOCK";
  const isProductionRole = user?.role === "PRODUCTION";
  const isQCRole = user?.role === "SEWING_QC";

  return (
    <div
      className={`erp-card p-6 border-l-4 flex flex-col md:flex-row items-center justify-between gap-6 ${order.status === "CANCELLED" ? "border-rose-500 bg-rose-50/30" : "border-indigo-600 bg-white"}`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`p-3 rounded-lg ${order.status === "CANCELLED" ? "bg-rose-100 text-rose-600" : "bg-indigo-50 text-indigo-600"}`}
        >
          <HiOutlineAdjustmentsHorizontal className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
            สถานะคำสั่งซื้อในปัจจุบัน
          </p>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {order.displayStatusLabel ||
                getStatusBadge(order.status).props.children}
            </h2>
            {order.status !== "CANCELLED" && (
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${order.sla?.isCompleted ? "bg-emerald-400" : order.sla?.status === "RED" ? "bg-rose-400" : order.sla?.status === "YELLOW" ? "bg-amber-400" : "bg-indigo-400"}`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${order.sla?.isCompleted ? "bg-emerald-500" : order.sla?.status === "RED" ? "bg-rose-500" : order.sla?.status === "YELLOW" ? "bg-amber-500" : "bg-indigo-500"}`}
                  ></span>
                </span>
                {order.sla?.isCompleted ? (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 uppercase tracking-tighter flex items-center gap-1">
                    <HiOutlineCheckCircle className="w-3 h-3" />
                    ดำเนินการเสร็จสิ้นแล้ว
                  </span>
                ) : (
                  user?.role !== "SALES" && (
                    <>
                      {order.sla?.status === "RED" && (
                        <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-tighter">
                          เกินกำหนดระยะเวลาฝ่ายตนเอง
                        </span>
                      )}
                      {order.sla?.status === "YELLOW" && (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100 uppercase tracking-tighter">
                          ใกล้กำหนดระยะเวลาฝ่ายตนเอง
                        </span>
                      )}
                    </>
                  )
                )}
              </div>
            )}
          </div>
          {order.subStatusLabel && (
            <p className="text-[10px] font-black text-rose-500 uppercase mt-1 animate-pulse">
              ⚠️ {order.subStatusLabel}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {/* SALES ACTIONS */}
        {order.actionMap?.canMarkUrgent && (
          <button
            onClick={() => setShowUrgentModal(true)}
            className={`erp-button flex items-center gap-1.5 py-2 px-4 shadow-sm border ${order.isUrgent ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}
            disabled={isUpdating}
          >
            <HiOutlineBellAlert className="w-4 h-4" />
            {order.isUrgent ? "งานด่วน (ตั้งค่าแล้ว)" : "ตั้งค่าเป็นงานด่วน"}
          </button>
        )}

        {order.actionMap?.canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="erp-button bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 flex items-center gap-1.5 py-2 px-4 shadow-sm"
            disabled={isUpdating}
          >
            <HiOutlineNoSymbol className="w-4 h-4" />
            ยกเลิกคำสั่งซื้อ
          </button>
        )}

        {/* GRAPHIC ACTIONS */}
        {order.actionMap?.canSendToStock && (
          <button
            onClick={() => handleUpdateStatus("PENDING_STOCK_CHECK")}
            className="erp-button erp-button-primary flex items-center gap-1.5 py-2 px-6 shadow-lg shadow-indigo-100"
            disabled={isUpdating}
          >
            <HiOutlineArrowRightCircle className="w-4 h-4" />
            ส่งให้ฝ่ายสต็อก (Send to Stock)
          </button>
        )}

        {/* STOCK ACTIONS */}
        {(order.actionMap?.canConfirmStock ||
          order.actionMap?.canReportStockIssue) && (
          <div className="flex items-center gap-2">
            {order.actionMap?.canConfirmStock && (
              <button
                onClick={() => handleUpdateStatus("STOCK_RECHECKED")}
                className="erp-button erp-button-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-500 py-2 px-6 shadow-lg shadow-emerald-100"
                disabled={isUpdating}
              >
                ยืนยันสต็อกครบ (Confirm Stock)
              </button>
            )}
            {order.actionMap?.canReportStockIssue && (
              <button
                onClick={() => setShowStockIssueModal(true)}
                className="erp-button bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 flex items-center gap-1.5 py-2 px-4 shadow-sm"
                disabled={isUpdating}
              >
                <HiOutlineExclamationCircle className="w-4 h-4" />
                สต็อกมีปัญหา
              </button>
            )}
            <button
              onClick={() => setShowRejectModal(true)}
              className="erp-button bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 flex items-center gap-1.5 py-2 px-4"
              disabled={isUpdating}
            >
              <HiOutlineExclamationCircle className="w-4 h-4" />
              ตีกลับงาน
            </button>
          </div>
        )}
        {/* PRODUCTION ACTIONS */}
        {order.actionMap?.canStartProduction && (
          <div className="flex flex-col gap-3 items-center w-full max-w-sm">
            {!order.productionId ? (
              <button
                onClick={() => handleClaim("productionId")}
                className="w-full px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all text-sm"
                disabled={isUpdating}
              >
                รับสิทธิ์ดูแลงาน (Claim)
              </button>
            ) : order.productionId === user?.id ? (
              <button
                onClick={() => setShowProductionWorkerModal(true)}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg hover:bg-indigo-700 transition-all text-sm flex items-center justify-center gap-2"
                disabled={isUpdating}
              >
                เริ่มผลิตและระบุลูกมือ (Start & Assign)
              </button>
            ) : (
              <div className="text-xs font-bold text-slate-500 bg-slate-100 px-4 py-2 rounded-lg truncate w-full text-center">
                งานนี้รับโดย {order.production?.name || "ทีมอื่น"}
              </div>
            )}
          </div>
        )}

        {order.actionMap?.canFinishProduction && (
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateStatus("PRODUCTION_FINISHED")}
              className="erp-button erp-button-primary bg-indigo-600 py-2 px-6 shadow-lg shadow-indigo-100"
              disabled={isUpdating}
            >
              บันทึกผลิตเสร็จ (Finish)
            </button>
            <button
              onClick={() => setShowRejectModal(true)}
              className="erp-button bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 flex items-center gap-1.5 py-2 px-4 flex-col justify-center"
              disabled={isUpdating}
            >
              <HiOutlineExclamationCircle className="w-4 h-4" />
              ตีกลับงาน
            </button>
          </div>
        )}

        {/* DIGITIZER ACTIONS */}
        {user?.role === "DIGITIZER" &&
          order.status === "PENDING_DIGITIZING" && (
            <div className="flex gap-2">
              <button
                onClick={() => handleUpdateStatus("DIGITIZING_FINISHED")}
                className="erp-button erp-button-primary bg-indigo-600 py-2 px-6 shadow-lg shadow-indigo-100 flex items-center gap-2"
                disabled={isUpdating}
              >
                <HiOutlineCheckCircle className="w-5 h-5" />
                บันทึกตีลายเสร็จ (Finish Digitizing)
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="erp-button bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 flex items-center gap-1.5 py-2 px-4 shadow-sm"
                disabled={isUpdating}
              >
                <HiOutlineExclamationCircle className="w-4 h-4" />
                ตีกลับงาน
              </button>
            </div>
          )}

        {/* QC ACTIONS */}
        {(order.actionMap?.canPassQC || order.actionMap?.canFailQC) && (
          <div className="flex gap-2">
            {order.actionMap?.canPassQC && (
              <button
                onClick={() =>
                  handleUpdateStatus("PRODUCTION_FINISHED", { pass: true })
                }
                className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                disabled={isUpdating}
              >
                ผ่าน QC (Pass)
              </button>
            )}
            {order.actionMap?.canFailQC && (
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                disabled={isUpdating}
              >
                ไม่ผ่าน (Fail)
              </button>
            )}
          </div>
        )}

        {/* DELIVERY ACTIONS */}
        {(order.actionMap?.canReceiveForShip || order.actionMap?.canShip) && (
          <div className="flex flex-col gap-3 items-center w-full">
            {order.actionMap?.canReceiveForShip && (
              <div className="flex flex-col gap-3 items-center w-full max-w-xs">
                <button
                  onClick={() => handleUpdateStatus("READY_TO_SHIP")}
                  className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all w-full"
                  disabled={isUpdating}
                >
                  รับงานเข้าฝ่ายจัดส่ง
                </button>
              </div>
            )}

            {order.actionMap?.canShip && (
              <div className="w-full max-w-md space-y-3 bg-white/20 p-4 rounded-3xl backdrop-blur-sm border border-white/30">
                <p className="text-sm font-bold text-white text-center mb-2 uppercase tracking-wide">
                  ขั้นตอนการจัดส่ง (Shipping)
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    placeholder="ระบุเลขพัสดุ (Tracking No.)"
                    className="w-full px-4 py-3 rounded-xl text-slate-900 font-bold text-center outline-none focus:ring-2 focus:ring-emerald-400"
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                  />
                  <button
                    onClick={() => {
                      if (!trackingNo) return alert("กรุณาระบุเลขพัสดุ");
                      handleUpdateStatus("COMPLETED", { trackingNo });
                    }}
                    className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl font-black shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    disabled={isUpdating}
                  >
                    <HiOutlineCheckCircle className="w-5 h-5" />
                    ยืนยันจัดส่ง (Complete)
                  </button>
                </div>
              </div>
            )}

            {/* Show Payment Alert if not ready to ship but needs payment */}
            {!order.actionMap?.canShip &&
              order.status === "READY_TO_SHIP" &&
              order.balanceDue > 0 && (
                <div className="bg-red-500/90 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-pulse w-full max-w-md">
                  <HiOutlineExclamationCircle className="w-8 h-8 shrink-0" />
                  <div className="flex-1">
                    <p className="font-black text-sm uppercase">
                      ยังชำระเงินไม่ครบ!
                    </p>
                    <p className="text-xs font-medium opacity-90">
                      ห้ามจัดส่งจนกว่าจะชำระครบ (ค้าง{" "}
                      {parseFloat(order.balanceDue).toLocaleString()}฿)
                    </p>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* PAYMENT BUTTON (Globally available if needed, or by permission) */}
        {order.actionMap?.canUploadSlip &&
          parseFloat(order.balanceDue || 0) > 0 &&
          order.status !== "COMPLETED" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all text-xs flex items-center justify-center gap-1.5 shadow-sm"
            >
              <HiOutlineCurrencyDollar className="w-4 h-4" />
              แจ้งชำระเงิน / อัปโหลดสลิป
            </button>
          )}

        {/* CLAIM REMINDERS FOR OTHER ROLES */}
        {(user?.role === "ADMIN" || user?.role === "EXECUTIVE") && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBufferModal(true)}
              className="erp-button bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 flex items-center gap-1.5 py-2 px-4 shadow-sm"
              disabled={isUpdating}
            >
              <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
              ค่าความคลาดเคลื่อน (Buffer: {order.slaBufferLevel || 0} วัน)
            </button>
          </div>
        )}

        {((isStockRole &&
          !isClaimedByMe(order.stockId) &&
          (order.status === "PENDING_STOCK_CHECK" ||
            order.status === "STOCK_ISSUE")) ||
          (isProductionRole &&
            !isClaimedByMe(order.productionId) &&
            (order.status === "STOCK_RECHECKED" ||
              order.status === "IN_PRODUCTION")) ||
          (isQCRole &&
            !isClaimedByMe(order.qcId) &&
            order.status === "PRODUCTION_FINISHED")) &&
          !isAdmin && (
            <div className="flex flex-col items-center gap-2 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 mt-4">
              <HiOutlineExclamationCircle className="w-8 h-8 text-indigo-400 animate-pulse" />
              <p className="text-indigo-900 font-black text-xs uppercase tracking-wide">
                กรุณากดรับงานก่อนเพื่อดำเนินการ
              </p>
              <p className="text-indigo-500 text-[10px] font-bold">
                ปุ่มรับงาน (Claim Task) อยู่ด้านบนสุดของหน้าจอครับ
              </p>
            </div>
          )}
      </div>
    </div>
  );
};

export default OrderStatusBar;
