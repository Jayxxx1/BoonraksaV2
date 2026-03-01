import React, { useState } from "react";
import api from "../../api/config";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";
import { useAuth } from "../../context/auth-store";

const ProductionSearch = () => {
  const { token } = useAuth();
  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });
  const [jobId, setJobId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!jobId) return;

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await api.get(`/orders/search/${encodeURIComponent(jobId)}`, {
        headers: getAuthHeader(),
      });
      setOrder(res.data.data.order);
    } catch (err) {
      setError(err.response?.data?.message || "ไม่พบเลขออเดอร์นี้");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      await api.post(
        `/orders/${order.id}/production-action`,
        { action },
        {
          headers: getAuthHeader(),
        },
      );
      handleSearch();
      alert("บันทึกสำเร็จ");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + (err.response?.data?.message || err.message));
    }
  };

  const getThaiStatus = (status) => {
    const map = {
      PENDING_ARTWORK: "รอแบบ",
      DESIGNING: "กำลังออกแบบ",
      PENDING_PAYMENT: "รอชำระเงิน",
      PENDING_STOCK_CHECK: "รอเช็คสต็อก",
      STOCK_ISSUE: "สต็อกมีปัญหา",
      STOCK_RECHECKED: "รอผลิต (สต็อกพร้อม)",
      IN_PRODUCTION: "กำลังผลิต",
      PRODUCTION_FINISHED: "ผลิตเสร็จ/รอ QC",
      QC_PASSED: "รอจัดส่ง",
      READY_TO_SHIP: "พร้อมจัดส่ง",
      COMPLETED: "สำเร็จ",
      CANCELLED: "ยกเลิก",
    };
    return map[status] || status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "IN_PRODUCTION":
        return "bg-amber-100 text-amber-900 border-amber-500 ring-amber-500/20";
      case "PRODUCTION_FINISHED":
        return "bg-emerald-100 text-emerald-900 border-emerald-500 ring-emerald-500/20";
      case "STOCK_RECHECKED":
        return "bg-sky-100 text-sky-900 border-sky-500 ring-sky-500/20";
      case "CANCELLED":
        return "bg-rose-100 text-rose-900 border-rose-500 ring-rose-500/20";
      default:
        return "bg-slate-100 text-slate-900 border-slate-300 ring-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 pb-20">
      <div className="max-w-[1920px] mx-auto space-y-8">
        {/* Search Header */}
        <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 shadow-lg border-2 border-slate-200">
          <h1 className="text-3xl font-black mb-6 text-center text-indigo-700 uppercase tracking-wide">
            ค้นหางานผลิต (Production Dashboard)
          </h1>
          <form onSubmit={handleSearch} className="flex gap-4">
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value.toUpperCase())}
              placeholder="SCAN JOB ID HERE..."
              className="flex-1 bg-slate-50 border-4 border-slate-300 rounded-lg px-6 py-4 text-3xl font-black focus:border-indigo-600 focus:bg-indigo-50/30 outline-none transition-all text-slate-800 placeholder:text-slate-300 tracking-widest text-center"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-8 rounded-lg font-black transition-all shadow-xl shadow-indigo-200 active:scale-95 text-xl"
            >
              <HiOutlineMagnifyingGlass className="w-8 h-8" />
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex justify-center py-32">
            <div className="erp-spinner !w-16 !h-16 !border-[4px]"></div>
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto bg-rose-100 border-l-8 border-rose-600 rounded-lg p-8 flex items-center justify-center gap-6 text-rose-800 shadow-xl">
            <HiOutlineExclamationCircle className="w-16 h-16 shrink-0" />
            <p className="font-black text-3xl">{error}</p>
          </div>
        )}

        {order && (
          <div className="animate-erp-in space-y-8">
            {/* 1. Header Board */}
            <div
              className={`rounded-lg p-8 border-4 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6 ${getStatusColor(
                order.status,
              )}`}
            >
              <div className="text-center md:text-left">
                <p className="text-lg font-bold opacity-70 uppercase tracking-[0.2em] mb-1">
                  JOB ID
                </p>
                <h1 className="text-6xl font-black tracking-tighter leading-none">
                  {order.jobId}
                </h1>
                <p className="text-2xl font-bold mt-2 opacity-90">
                  {order.customerName}
                </p>
              </div>

              <div className="text-center">
                <div className="inline-block px-8 py-3 rounded-lg bg-white/60 backdrop-blur-md border border-black/5 shadow-sm mb-3">
                  <span className="text-3xl font-black uppercase tracking-wider">
                    {order.displayStatusLabel || getThaiStatus(order.status)}
                  </span>
                </div>
                {order.isUrgent && (
                  <div className="erp-urgent-tag !text-base !px-6 !py-2 mx-auto w-fit animate-pulse">
                    งานด่วนพิเศษ
                  </div>
                )}
                {order.assignedWorkerName && (
                  <div className="mt-4 bg-indigo-600 text-white px-6 py-2 rounded-lg font-black text-xl shadow-lg border-2 border-indigo-400">
                    ผู้รับผิดชอบ: {order.assignedWorkerName}
                  </div>
                )}
              </div>

              <div className="text-center md:text-right">
                <p className="text-lg font-bold opacity-70 uppercase tracking-[0.2em] mb-1">
                  กำหนดส่ง (Due Date)
                </p>
                <p className="text-5xl font-black">
                  {order.dueDate
                    ? new Date(order.dueDate).toLocaleDateString("th-TH")
                    : "-"}
                </p>
              </div>
            </div>

            {/* 2. Artwork Display */}
            <div className="bg-white rounded-lg border-2 border-slate-200 shadow-lg overflow-hidden relative min-h-[500px] flex flex-col">
              <div className="bg-slate-100 px-8 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-2xl font-black text-slate-700 flex items-center gap-3 uppercase tracking-wide">
                  <span className="bg-indigo-600 text-white p-2 rounded-lg">
                    <HiOutlineClipboardDocumentList className="w-6 h-6" />
                  </span>
                  ภาพใบงาน (Job Sheet)
                </h3>
                {order.productionStatus === "IN_PRODUCTION" && (
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleAction("FINISH")}
                      className="bg-sky-500 hover:bg-sky-600 text-white px-8 py-3 rounded-lg font-black text-xl shadow-lg shadow-sky-200 hover:-translate-y-1 transition-all flex items-center gap-2"
                    >
                      <HiOutlineCheckCircle className="w-6 h-6" />
                      ผลิตเสร็จสิ้น
                    </button>
                  </div>
                )}
              </div>

              <div className="flex-1 bg-slate-50 relative p-8 flex items-center justify-center">
                {order.artworkUrl ? (
                  <img
                    src={order.artworkUrl}
                    className="max-h-[70vh] w-auto object-contain drop-shadow-2xl"
                    alt="Job Sheet"
                  />
                ) : (
                  <div className="text-center py-20">
                    <HiOutlineClipboardDocumentList className="w-32 h-32 text-slate-300 mx-auto mb-6" />
                    <p className="text-3xl font-black text-slate-400">
                      รอใบงานจากกราฟิก
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Position Specs */}
            <div>
              <h3 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-3">
                <span className="w-12 h-12 bg-slate-800 text-white rounded-lg flex items-center justify-center text-xl">
                  {order.positions?.length || 0}
                </span>
                ตำแหน่งปัก
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {(() => {
                  const tablePositions = order.positions || [];
                  const jsonPositions = (order.embroideryDetails || []).map(
                    (p) => ({
                      position: p.position,
                      note: p.note,
                      details: p.details,
                      width: p.width,
                      height: p.height,
                      isFreeOption: p.isFreeOption,
                      freeOptionName: p.freeOptionName,
                      mockupUrl: p.mockupUrl,
                      logoUrl: p.logoUrl,
                      textToEmb: p.textToEmb,
                      threadColor: p.threadColor,
                      fileAddress: p.fileAddress,
                      needlePattern: p.needlePattern,
                      threadSequence: p.threadSequence,
                    }),
                  );
                  const specs =
                    jsonPositions.length > 0 ? jsonPositions : tablePositions;

                  return specs.map((pos, idx) => (
                    <div
                      key={idx}
                      className="bg-white rounded-lg border-2 border-slate-100 shadow-xl overflow-hidden flex flex-col h-full"
                    >
                      {/* Position Header */}
                      <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-200">
                            {idx + 1}
                          </div>
                          <h4 className="text-2xl font-black text-slate-800">
                            {pos.position}
                          </h4>
                        </div>
                        {!pos.isFreeOption && (
                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-400 uppercase block">
                              Size (cm)
                            </span>
                            <span className="text-xl font-black text-slate-700">
                              {pos.width || 0} x {pos.height || 0}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col gap-5">
                        {/* Logo / Option */}
                        <div className="flex-1 min-h-[200px] bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center relative overflow-hidden group">
                          {pos.isFreeOption ? (
                            <div className="text-center">
                              <p className="text-sm font-bold text-sky-400 uppercase mb-2">
                                OPTION
                              </p>
                              <p className="text-3xl font-black text-sky-600">
                                {pos.freeOptionName || "เซฟตี้"}
                              </p>
                            </div>
                          ) : pos.logoUrl ? (
                            <img
                              src={pos.logoUrl}
                              className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                              alt="Logo"
                            />
                          ) : (
                            <div className="text-center opacity-30">
                              <p className="font-black text-lg text-slate-400">
                                NO LOGO
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Technical Specs */}
                        {!pos.isFreeOption && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-emerald-50 border-2 border-emerald-100 p-3 rounded-lg">
                              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">
                                FLASHDRIVE
                              </p>
                              <p className="text-3xl font-black text-emerald-700">
                                {pos.fileAddress || "-"}
                              </p>
                            </div>
                            <div className="bg-rose-50 border-2 border-rose-100 p-3 rounded-lg">
                              <p className="text-[10px] font-black text-rose-600 uppercase mb-1">
                                NEEDLE PATTERN
                              </p>
                              <p className="text-3xl font-black text-rose-700">
                                {pos.needlePattern || "-"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Thread Sequence */}
                        {Array.isArray(pos.threadSequence) &&
                        pos.threadSequence.length > 0 ? (
                          <div className="bg-slate-900 text-white rounded-lg overflow-hidden shadow-lg">
                            <div className="bg-slate-800 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-700">
                              THREAD SEQUENCE
                            </div>
                            <div className="p-4 space-y-2">
                              {pos.threadSequence.map((t, tIdx) => (
                                <div
                                  key={tIdx}
                                  className="flex items-center gap-3"
                                >
                                  <span className="w-5 text-center font-black text-slate-500 text-xs">
                                    {tIdx + 1}
                                  </span>
                                  <div
                                    className="w-8 h-8 rounded-md border border-white/20 shadow-inner"
                                    style={{
                                      backgroundColor: t.colorCode || "#ccc",
                                    }}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-sm font-black leading-none">
                                      {t.threadCode || "-"}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {t.colorName || "-"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          pos.threadColor && (
                            <div className="bg-indigo-50 border-l-4 border-indigo-500 px-5 py-4 rounded-r-lg">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                                สีด้าย (Thread Color)
                              </p>
                              <p className="text-2xl font-black text-indigo-900 leading-none">
                                {pos.threadColor}
                              </p>
                            </div>
                          )
                        )}

                        {/* Note */}
                        {(pos.note || pos.details || pos.textToEmb) && (
                          <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-100">
                            <p className="text-[10px] font-bold text-cyan-600 uppercase mb-2">
                              Note / Text
                            </p>
                            <p className="text-xl font-bold text-cyan-900 leading-snug">
                              {pos.textToEmb && `"${pos.textToEmb}"`}{" "}
                              {pos.textToEmb &&
                                (pos.note || pos.details) &&
                                "-"}{" "}
                              {pos.note || pos.details}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionSearch;
