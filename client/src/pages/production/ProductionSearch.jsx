import React, { useState } from "react";
import axios from "axios";
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
      // We'll search by jobId (string)
      const res = await axios.get(
        `http://localhost:8000/api/orders/search/${encodeURIComponent(jobId)}`,
        {
          headers: getAuthHeader(),
        },
      );
      setOrder(res.data.data.order);
    } catch (err) {
      setError(err.response?.data?.message || "ไม่พบเลขออเดอร์นี้");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      await axios.post(
        `http://localhost:8000/api/orders/${order.id}/production-action`,
        { action },
        {
          headers: getAuthHeader(),
        },
      );
      // Refresh order data
      handleSearch();
      alert("บันทึกสำเร็จ");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + (err.response?.data?.message || err.message));
    }
  };

  /* Helper to get localized status */
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
      QC_PASSED: "QC ผ่านแล้ว",
      READY_TO_SHIP: "รอจัดส่ง",
      COMPLETED: "สำเร็จ",
      CANCELLED: "ยกเลิก",
    };
    return map[status] || status;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 pb-20">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Search Header - Centered for Focus */}
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h1 className="text-2xl font-black mb-4 text-center text-indigo-600">
            🔍 ค้นหางานผลิต
          </h1>
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={jobId}
              onChange={(e) => setJobId(e.target.value.toUpperCase())}
              placeholder="กรอกเลข JOB ID (เช่น 11/00...)"
              className="flex-1 bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:border-indigo-500 outline-none transition-all text-slate-700"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 rounded-xl font-black transition-all shadow-md shadow-indigo-200"
            >
              <HiOutlineMagnifyingGlass className="w-6 h-6" />
            </button>
          </form>
        </div>

        {loading && (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3 text-rose-600">
            <HiOutlineExclamationCircle className="w-6 h-6" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {order && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Controls & Info (4 Cols) */}
            <div className="lg:col-span-4 space-y-6 sticky top-4">
              {/* Quick Summary Card */}
              <div
                className={`rounded-3xl p-6 border-l-8 shadow-sm ${
                  order.isUrgent
                    ? "bg-rose-50 border-rose-500 text-rose-900"
                    : "bg-white border-indigo-500 text-slate-900"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-4xl font-black tracking-tight mb-1">
                      {order.jobId}
                    </h2>
                    <p className="font-bold text-slate-500 uppercase text-lg">
                      {order.customerName}
                    </p>
                  </div>
                  {order.isUrgent && (
                    <span className="bg-rose-500 text-white text-xs font-black px-3 py-1 rounded-full animate-pulse uppercase">
                      งานด่วน
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">
                      สถานะปัจจุบัน
                    </p>
                    <p className="text-lg font-black text-indigo-600">
                      {getThaiStatus(order.status)}
                    </p>
                  </div>
                  <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-1">
                      กำหนดส่ง
                    </p>
                    <p className="text-lg font-black text-amber-600">
                      {order.dueDate
                        ? new Date(order.dueDate).toLocaleDateString("th-TH")
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* General Order Notes */}
              {order.notes && (
                <div className="bg-rose-50 border-2 border-rose-100 p-6 rounded-3xl">
                  <p className="text-xs text-rose-500 font-black uppercase mb-2 flex items-center gap-2">
                    <HiOutlineExclamationCircle className="w-5 h-5" />{" "}
                    หมายเหตุสำคัญ
                  </p>
                  <p className="text-lg font-bold text-rose-800 leading-relaxed">
                    {order.notes}
                  </p>
                </div>
              )}

              {/* Files Section */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-black text-slate-700 flex items-center gap-2">
                  <HiOutlineClipboardDocumentList className="text-indigo-600" />{" "}
                  ไฟล์งาน
                </h3>
                {/* Production File (DST) */}
                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 bg-white text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                      <span className="font-black text-xs">DST</span>
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-indigo-400 uppercase">
                        สำหรับเครื่องจักร
                      </p>
                      <p className="font-bold text-indigo-900 truncate">
                        {order.productionFileName || "ไฟล์ผลิต (.DST)"}
                      </p>
                    </div>
                  </div>
                  {order.productionFileUrl ? (
                    <a
                      href={order.productionFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-full text-center bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg transition-all active:scale-95"
                    >
                      ดาวน์โหลดไฟล์ .DST
                    </a>
                  ) : (
                    <div className="w-full text-center py-3 bg-slate-200 rounded-xl text-sm font-bold text-slate-400 cursor-not-allowed">
                      ไม่พบไฟล์
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 pt-4">
                {(order.status === "STOCK_RECHECKED" ||
                  order.status === "IN_PRODUCTION") && (
                  <button
                    onClick={() => handleAction("START")}
                    disabled={order.status === "IN_PRODUCTION"}
                    className={`w-full p-6 rounded-3xl flex items-center justify-center gap-4 shadow-xl active:scale-95 transition-all text-white
                        ${
                          order.status === "IN_PRODUCTION"
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed hidden"
                            : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-200"
                        }`}
                  >
                    <HiOutlineClock className="w-8 h-8" />
                    <div className="text-left">
                      <p className="text-xs font-medium opacity-80 uppercase">
                        กดเพื่อเริ่มงาน
                      </p>
                      <p className="font-black text-2xl">
                        เริ่มงานผลิต (Start)
                      </p>
                    </div>
                  </button>
                )}

                {order.status === "IN_PRODUCTION" && (
                  <button
                    onClick={() => handleAction("FINISH")}
                    className="w-full bg-sky-600 hover:bg-sky-500 p-6 rounded-3xl flex items-center justify-center gap-4 shadow-xl shadow-sky-200 active:scale-95 transition-all text-white animate-bounce-subtle"
                  >
                    <HiOutlineCheckCircle className="w-10 h-10" />
                    <div className="text-left">
                      <p className="text-xs font-medium opacity-80 uppercase">
                        ผลิตเสร็จแล้ว
                      </p>
                      <p className="font-black text-2xl">ส่งต่อ QC (Finish)</p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Visuals & Specs (8 Cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* 1. Layout Drafts / Mockups (BIG) */}
              {order.draftImages && order.draftImages.length > 0 && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h3 className="text-xl font-black flex items-center gap-3 text-slate-800 mb-6">
                    <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
                      🖼️
                    </span>
                    ภาพร่างวางแบบ (Overall Layout)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.draftImages.map((img, i) => (
                      <div
                        key={i}
                        className="group relative rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50"
                      >
                        <img
                          src={img}
                          className="w-full h-full object-contain max-h-[500px]"
                          alt={`Draft ${i + 1}`}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                          <a
                            href={img}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold shadow-lg transform scale-90 group-hover:scale-100 transition-all"
                          >
                            เปิดดูรูปใหญ่ 🔍
                          </a>
                        </div>
                        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                          แบบที่ {i + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Detailed Embroidery Specs */}
              <div>
                <h3 className="text-2xl font-black flex items-center gap-3 text-slate-800 mb-6">
                  <span className="bg-indigo-600 text-white p-2 rounded-lg">
                    <HiOutlineClipboardDocumentList className="w-6 h-6" />
                  </span>
                  รายละเอียดตำแหน่งปัก (
                  {
                    (order.embroideryDetails &&
                    order.embroideryDetails.length > 0
                      ? order.embroideryDetails
                      : order.positions || []
                    ).length
                  }{" "}
                  จุด)
                </h3>

                <div className="space-y-6">
                  {(() => {
                    const tablePositions = order.positions || [];
                    const jsonPositions = (order.embroideryDetails || []).map(
                      (p) => ({
                        position: p.position,
                        note: p.note,
                        width: p.width,
                        height: p.height,
                        isFreeOption: p.isFreeOption,
                        freeOptionName: p.freeOptionName,
                        mockupUrl: p.mockupUrl,
                        logoUrl: p.logoUrl,
                        textToEmb: p.textToEmb,
                      }),
                    );
                    const specs =
                      jsonPositions.length > 0 ? jsonPositions : tablePositions;

                    return specs.map((pos, idx) => (
                      <div
                        key={idx}
                        className="bg-white rounded-[2rem] overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row"
                      >
                        {/* Position Header (Mobile only) */}
                        <div className="md:hidden bg-slate-100 p-4 border-b border-slate-200 flex items-center">
                          <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-full mr-2">
                            {idx + 1}
                          </span>
                          <span className="text-lg font-black text-slate-800">
                            {pos.position}
                          </span>
                        </div>

                        {/* Image Column (Left on Desktop) */}
                        <div className="w-full md:w-5/12 bg-slate-50 p-6 flex flex-col gap-4 border-r border-slate-100">
                          <div className="hidden md:flex items-center gap-3 mb-2">
                            <span className="bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-full font-black text-sm shadow-md shadow-indigo-200">
                              {idx + 1}
                            </span>
                            <span className="text-xl font-black text-slate-800">
                              {pos.position}
                            </span>
                          </div>

                          {pos.isFreeOption ? (
                            <div className="flex-1 min-h-[200px] bg-sky-50 border-4 border-sky-100 border-dashed rounded-3xl flex flex-col items-center justify-center text-center p-6">
                              <p className="text-sm font-bold text-sky-400 uppercase mb-3">
                                รูปแบบ (Option)
                              </p>
                              <p className="text-5xl font-black text-sky-600 tracking-tight">
                                {pos.freeOptionName || "เซฟตี้"}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                <p className="absolute top-2 left-2 bg-slate-900/10 text-slate-600 text-[10px] font-black uppercase px-2 py-1 rounded backdrop-blur-md">
                                  Mockup
                                </p>
                                {pos.mockupUrl ? (
                                  <img
                                    src={pos.mockupUrl}
                                    className="w-full h-auto object-contain"
                                    alt="Mockup"
                                  />
                                ) : (
                                  <div className="h-40 flex items-center justify-center text-slate-300 font-bold italic">
                                    No Mockup
                                  </div>
                                )}
                                {pos.mockupUrl && (
                                  <a
                                    href={pos.mockupUrl}
                                    target="_blank"
                                    className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <span className="bg-white px-3 py-1 rounded-full text-xs font-bold">
                                      Zoom
                                    </span>
                                  </a>
                                )}
                              </div>
                              <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                                <p className="absolute top-2 left-2 bg-slate-900/10 text-slate-600 text-[10px] font-black uppercase px-2 py-1 rounded backdrop-blur-md">
                                  Logo
                                </p>
                                {pos.logoUrl ? (
                                  <img
                                    src={pos.logoUrl}
                                    className="w-full h-auto object-contain"
                                    alt="Logo"
                                  />
                                ) : (
                                  <div className="h-20 flex items-center justify-center text-slate-300 font-bold italic">
                                    No Logo
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Details Column (Right on Desktop) */}
                        <div className="w-full md:w-7/12 p-6 flex flex-col justify-center space-y-4">
                          {/* Thread Color / Note */}
                          <div className="bg-amber-50 p-5 rounded-2xl border-l-4 border-amber-400">
                            <p className="text-xs text-amber-800 uppercase font-bold mb-1 flex items-center gap-2">
                              🎨 สีด้าย (Thread Color)
                            </p>
                            <p className="text-2xl font-black text-amber-950">
                              {pos.note || "-"}
                            </p>
                          </div>

                          {/* Text To Emb */}
                          {pos.textToEmb && (
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                              <p className="text-xs text-slate-400 uppercase font-bold mb-2">
                                📝 หมายเหตุ (Note)
                              </p>
                              <p className="text-lg font-bold text-slate-700 leading-relaxed">
                                {pos.textToEmb}
                              </p>
                            </div>
                          )}

                          {/* Dimensions */}
                          {!pos.isFreeOption && (
                            <div className="flex gap-4">
                              <div className="flex-1 bg-slate-100 p-4 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase">
                                  กว้าง (W)
                                </p>
                                <p className="text-3xl font-black text-slate-800">
                                  {pos.width || "0"}
                                </p>
                                <p className="text-[10px] text-slate-400">cm</p>
                              </div>
                              <div className="flex-1 bg-slate-100 p-4 rounded-2xl text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase">
                                  สูง (H)
                                </p>
                                <p className="text-3xl font-black text-slate-800">
                                  {pos.height || "0"}
                                </p>
                                <p className="text-[10px] text-slate-400">cm</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionSearch;
