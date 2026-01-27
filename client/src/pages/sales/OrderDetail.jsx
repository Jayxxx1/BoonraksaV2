import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineArrowLeft,
  HiOutlineDocumentArrowDown,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineFire,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineMapPin,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCurrencyDollar,
  HiOutlineCube,
  HiOutlineClipboardDocumentList,
  HiOutlineCloudArrowUp,
  HiOutlinePhoto,
  HiOutlineDocumentText,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineTruck,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineNoSymbol,
  HiOutlineBellAlert,
} from "react-icons/hi2";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states for Graphic specs
  const [editSpecs, setEditSpecs] = useState([]);
  const [uploadingField, setUploadingField] = useState(null); // 'artwork' or 'production'

  // Library states
  const [blocks, setBlocks] = useState([]);
  const [searchBlock, setSearchBlock] = useState("");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Sales Action states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showStockIssueModal, setShowStockIssueModal] = useState(false);
  const [stockIssueReason, setStockIssueReason] = useState("");
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentNote, setUrgentNote] = useState("");

  const getAuthHeader = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:8000/api/orders/${orderId}`,
        {
          headers: getAuthHeader(),
        },
      );
      if (res.data.status === "success") {
        const fetchedOrder = res.data.data.order;
        setOrder(fetchedOrder);
        setEditSpecs(fetchedOrder.embroideryDetails || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [orderId, getAuthHeader]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const downloadJobSheet = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/orders/${orderId}/jobsheet`,
        {
          headers: getAuthHeader(),
          responseType: "blob",
        },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `JobSheet-${order.jobId.replace("/", "-")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert("ไม่สามารถดาวน์โหลด Job Sheet ได้");
    }
  };

  const handleUpdateStatus = async (endpoint, payload = {}) => {
    try {
      setIsUpdating(true);
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/${endpoint}`,
        payload,
        {
          headers: getAuthHeader(),
        },
      );
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSpecs = async () => {
    try {
      setIsUpdating(true);
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/specs`,
        {
          embroideryDetails: editSpecs,
        },
        {
          headers: getAuthHeader(),
        },
      );
      alert("อัปเดตรายละเอียดทางเทคนิคเรียบร้อย");
      await fetchOrder();
    } catch {
      alert("Failed to update specs");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClaim = async () => {
    try {
      setIsUpdating(true);
      const res = await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/claim`,
        {},
        {
          headers: getAuthHeader(),
        },
      );
      if (res.data.status === "success") {
        setOrder(res.data.data.order);
        alert("รับงานเรียบร้อยแล้วครับ");
      }
    } catch (err) {
      alert(err.response?.data?.message || "ไม่สามารถรับงานได้");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingField(type);
      const formData = new FormData();
      formData.append("file", file);

      const folder = type === "artwork" ? "artworks" : "production-files";
      const uploadRes = await axios.post(
        `http://localhost:8000/api/upload?folder=${folder}`,
        formData,
        {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        },
      );

      const fileUrl = uploadRes.data.data.url;
      const payload =
        type === "artwork"
          ? { artworkUrl: fileUrl }
          : { productionFileUrl: fileUrl, productionFileName: file.name };

      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/specs`,
        payload,
        {
          headers: getAuthHeader(),
        },
      );

      // Also update linked block if exists
      if (order.blockId) {
        await axios.patch(
          `http://localhost:8000/api/blocks/${order.blockId}`,
          payload,
          {
            headers: getAuthHeader(),
          },
        );
      }

      await fetchOrder();
    } catch {
      alert("File upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await axios.get(
        `http://localhost:8000/api/blocks?search=${searchBlock}`,
        {
          headers: getAuthHeader(),
        },
      );
      setBlocks(res.data.data.blocks);
    } catch {
      alert("ไม่สามารถดึงข้อมูลบล็อกได้");
    }
  }, [searchBlock, getAuthHeader]);

  const handleLinkBlock = async (blockId) => {
    try {
      setIsUpdating(true);
      await axios.post(
        `http://localhost:8000/api/blocks/link/${orderId}/${blockId}`,
        {},
        {
          headers: getAuthHeader(),
        },
      );
      setIsLibraryOpen(false);
      await fetchOrder();
    } catch {
      alert("Linking block failed");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (isLibraryOpen) {
      fetchBlocks();
    }
  }, [searchBlock, isLibraryOpen, fetchBlocks]);

  const handleCancelOrder = async () => {
    if (!cancelReason) return alert("กรุณาระบุเหตุผลการยกเลิก");
    await handleUpdateStatus("cancel", { reason: cancelReason });
    setShowCancelModal(false);
  };

  const handleBumpUrgent = async () => {
    await handleUpdateStatus("urgent", { note: urgentNote });
    setShowUrgentModal(false);
  };

  const handleReportStockIssue = async () => {
    if (!stockIssueReason.trim()) return alert("กรุณาระบุรายละเอียดปัญหา");
    try {
      setIsUpdating(true);
      await axios.patch(
        `http://localhost:8000/api/orders/${order.id}/stock-issue`,
        { reason: stockIssueReason },
        { headers: getAuthHeader() },
      );
      setShowStockIssueModal(false);
      await fetchOrder();
      alert("แจ้งปัญหาสำเร็จแล้ว ฝ่ายขายจะได้รับทราบข้อมูลนี้ครับ");
    } catch (err) {
      alert(err.response?.data?.message || "แจ้งปัญหาไม่สำเร็จ");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING_ARTWORK: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "รอวางแบบ",
      },
      DESIGNING: {
        bg: "bg-purple-100",
        text: "text-purple-700",
        label: "กำลังวางแบบ",
      },
      PENDING_PAYMENT: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "รอชำระส่วนที่เหลือ",
      },
      PENDING_STOCK_CHECK: {
        bg: "bg-indigo-100",
        text: "text-indigo-700",
        label: "รอสต็อคเช็ค",
      },
      STOCK_ISSUE: {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "สต็อกมีปัญหา",
      },
      IN_PRODUCTION: {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "กำลังผลิต",
      },
      READY_TO_SHIP: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "รอจัดส่ง",
      },
      COMPLETED: {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "เสร็จสิ้น",
      },
      CANCELLED: {
        bg: "bg-slate-100",
        text: "text-slate-700",
        label: "ยกเลิกแล้ว",
      },
    };
    const config = statusConfig[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      label: status,
    };
    return (
      <span
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      UNPAID: { bg: "bg-red-100", text: "text-red-700", label: "ยังไม่ชำระ" },
      PARTIALLY_PAID: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "มัดจำแล้ว/ยังไม่ครบ",
      },
      PAID: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "ชำระครบแล้ว",
      },
    };
    const config = statusConfig[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      label: status,
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold">กำลังดึงข้อมูลออเดอร์...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl text-center max-w-md w-full">
          <HiOutlineExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-slate-500 mb-6">{error || "ไม่พบข้อมูลออเดอร์"}</p>
          <button
            onClick={() => navigate("/orders")}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";
  const isSalesRole = user?.role === "SALES";
  const isGraphicRole = user?.role === "GRAPHIC";
  const isStockRole = user?.role === "STOCK";
  const isProductionRole = user?.role === "PRODUCTION";
  const isQCRole = user?.role === "SEWING_QC";
  const isDeliveryRole = user?.role === "DELIVERY";

  // Viewing permissions
  const canViewTechnical =
    isGraphicRole ||
    isProductionRole ||
    isStockRole ||
    isQCRole ||
    isDeliveryRole ||
    isAdmin;
  const canViewFinancial = isSalesRole || isAdmin || isDeliveryRole;
  const canViewOrderItems = !isGraphicRole; // ฝ่ายกราฟิกไม่จำเป็นต้องเห็นรายการสินค้า

  // Action permissions
  const canPerformSalesAction = isSalesRole || isAdmin;
  const canPerformGraphicAction = isGraphicRole;
  const canPerformStockAction = isStockRole;
  const canPerformProductionAction = isProductionRole;
  const canPerformQCAction = isQCRole;
  const canPerformDeliveryAction = isDeliveryRole;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Navigation & Header */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-indigo-600 transition-all"
            >
              <HiOutlineArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-800 leading-tight">
                  Job ID: {order.jobId}
                </h1>
                {order.isUrgent && (
                  <HiOutlineFire className="w-5 h-5 text-red-500 animate-bounce" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Created: {new Date(order.createdAt).toLocaleDateString("th-TH")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadJobSheet}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-black transition-all flex items-center gap-2"
            >
              <HiOutlineDocumentArrowDown className="w-5 h-5" />
              <span className="hidden sm:inline">PDF Job Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assignment Bar (Real-time awareness) */}
      {(order.graphic ||
        order.qc ||
        (isGraphicRole && !order.graphicId) ||
        (isQCRole && !order.qcId)) && (
        <div className="bg-gradient-to-r from-indigo-700 to-indigo-600 text-white shadow-inner">
          <div className="max-w-6xl mx-auto px-6 py-2 flex items-center justify-between text-[11px] font-bold">
            <div className="flex items-center gap-6">
              {order.graphic && (
                <div className="flex items-center gap-2">
                  <span className="opacity-70">🎨 กราฟิก:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg">
                    {order.graphic.name}
                  </span>
                </div>
              )}
              {order.stock && (
                <div className="flex items-center gap-2">
                  <span className="opacity-70">📦 สต็อก:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg">
                    {order.stock.name}
                  </span>
                </div>
              )}
              {order.qc && (
                <div className="flex items-center gap-2">
                  <span className="opacity-70">✅ QC:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg">
                    {order.qc.name}
                  </span>
                </div>
              )}
              {order.production && (
                <div className="flex items-center gap-2">
                  <span className="opacity-70">⚙️ ฝ่ายผลิต:</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-lg">
                    {order.production.name}
                  </span>
                </div>
              )}
              {!order.graphicId && isGraphicRole && (
                <div className="flex items-center gap-2 text-yellow-300">
                  <HiOutlineBellAlert className="w-4 h-4" />
                  <span>รอคนรับงานออกแบบ</span>
                </div>
              )}
              {!order.stockId && isStockRole && (
                <div className="flex items-center gap-2 text-yellow-300">
                  <HiOutlineBellAlert className="w-4 h-4" />
                  <span>รอคนรับงานเช็คสต็อก</span>
                </div>
              )}
              {!order.qcId && isQCRole && (
                <div className="flex items-center gap-2 text-yellow-300">
                  <HiOutlineBellAlert className="w-4 h-4" />
                  <span>รอคนรับงาน QC</span>
                </div>
              )}
            </div>
            {((isGraphicRole && !order.graphicId) ||
              (isStockRole && !order.stockId) ||
              (isProductionRole && !order.productionId) ||
              (isQCRole && !order.qcId)) && (
              <button
                onClick={handleClaim}
                disabled={isUpdating}
                className="bg-white text-indigo-600 px-4 py-1 rounded-full hover:bg-yellow-300 hover:text-slate-900 transition-all shadow-lg animate-pulse hover:animate-none"
              >
                {isUpdating ? "กำลังบันทึก..." : "กดรับงานที่นี่ (Claim)"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Role Action Panel */}
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div
          className={`rounded-[2.5rem] p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative ${order.status === "CANCELLED" ? "bg-red-500 text-white" : "bg-indigo-600 text-white"}`}
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

          <div className="relative z-10 text-center md:text-left">
            <p className="text-white/70 text-[10px] font-black uppercase tracking-[0.2em] mb-2">
              Current Step Workflow
            </p>
            <div className="flex items-center gap-4 justify-center md:justify-start">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <HiOutlineAdjustmentsHorizontal className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-black">
                {getStatusBadge(order.status).props.children}
              </h2>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 justify-center">
            {/* SALES ACTIONS */}
            {canPerformSalesAction &&
              order.status !== "CANCELLED" &&
              order.status !== "COMPLETED" && (
                <>
                  <button
                    onClick={() => setShowUrgentModal(true)}
                    className={`px-6 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2 ${order.isUrgent ? "bg-amber-400 text-amber-900 ring-4 ring-amber-300" : "bg-white text-indigo-600"}`}
                  >
                    <HiOutlineBellAlert className="w-5 h-5" />
                    {order.isUrgent
                      ? "เร่งออเดอร์แล้ว"
                      : "ส่งสัญญาณเร่งงาน (Urgent)"}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="px-6 py-3 bg-red-100 text-red-600 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <HiOutlineNoSymbol className="w-5 h-5" />
                    ยกเลิกออเดอร์
                  </button>
                </>
              )}

            {/* GRAPHIC ACTIONS */}
            {canPerformGraphicAction && order.status === "PENDING_ARTWORK" && (
              <p className="text-sm font-bold bg-white/10 px-4 py-2 rounded-xl border border-white/20">
                ฝ่ายกราฟิก: รอส่งข้อมูลด้านเทคนิคและอัปโหลด Artwork
              </p>
            )}
            {canPerformGraphicAction && order.status === "DESIGNING" && (
              <button
                onClick={() => handleUpdateStatus("print-signal")}
                className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                disabled={isUpdating}
              >
                ยืนยันพิมพ์ใบงาน (Job Printed)
              </button>
            )}

            {/* STOCK ACTIONS */}
            {canPerformStockAction &&
              (order.status === "PENDING_STOCK_CHECK" ||
                order.status === "STOCK_ISSUE") && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {order.status === "PENDING_STOCK_CHECK" && (
                    <button
                      onClick={() => handleUpdateStatus("stock-recheck")}
                      className="px-6 py-3 bg-emerald-400 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                      disabled={isUpdating}
                    >
                      ยืนยันสต็อกครบ (Confirm Stock)
                    </button>
                  )}
                  <button
                    onClick={() => setShowStockIssueModal(true)}
                    className="px-6 py-3 bg-red-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                  >
                    <HiOutlineExclamationCircle className="w-5 h-5" />
                    แจ้งตัวเลือก/สต็อกไม่ตรง
                  </button>
                </div>
              )}

            {/* PRODUCTION ACTIONS */}
            {canPerformProductionAction &&
              order.status === "STOCK_RECHECKED" && (
                <button
                  onClick={() => handleUpdateStatus("production-start")}
                  className="px-6 py-3 bg-orange-400 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                  disabled={isUpdating}
                >
                  เริ่มฝ่ายผลิต (Start Production)
                </button>
              )}

            {canPerformProductionAction && order.status === "IN_PRODUCTION" && (
              <button
                onClick={() => handleUpdateStatus("production-finish")}
                className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                disabled={isUpdating}
              >
                ผลิตเสร็จแล้ว (Finish Production)
              </button>
            )}

            {/* QC ACTIONS */}
            {canPerformQCAction && order.status === "PRODUCTION_FINISHED" && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleUpdateStatus("qc-pass", { pass: true })}
                  className="px-6 py-3 bg-emerald-400 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                  disabled={isUpdating}
                >
                  ผ่าน QC (Pass)
                </button>
                <button
                  onClick={() => handleUpdateStatus("qc-pass", { pass: false })}
                  className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                  disabled={isUpdating}
                >
                  ไม่ผ่าน (Fail)
                </button>
              </div>
            )}

            {/* DELIVERY ACTIONS */}
            {canPerformDeliveryAction && order.status === "QC_PASSED" && (
              <button
                onClick={() => handleUpdateStatus("ready-to-ship")}
                className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all"
                disabled={isUpdating}
              >
                เตรียมจัดส่ง (Ready to Ship)
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Order Content */}
        <div className="lg:col-span-2 space-y-8">
          {(order.purchasingReason ||
            order.urgentNote ||
            order.cancelReason) && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-4">
              {order.cancelReason && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-start gap-4">
                  <HiOutlineNoSymbol className="w-8 h-8 text-red-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-red-500 uppercase tracking-widest mb-1">
                      เหตุผลการยกเลิก
                    </p>
                    <p className="font-bold text-red-900 leading-relaxed">
                      {order.cancelReason}
                    </p>
                  </div>
                </div>
              )}
              {order.urgentNote && (
                <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] flex items-start gap-4">
                  <HiOutlineBellAlert className="w-8 h-8 text-amber-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">
                      หมายเหตุเร่งด่วน (แจ้งกราฟิก)
                    </p>
                    <p className="font-bold text-amber-900 leading-relaxed">
                      {order.urgentNote}
                    </p>
                  </div>
                </div>
              )}
              {order.purchasingReason && (
                <div className="p-6 bg-orange-50 border border-orange-100 rounded-[2rem] flex items-start gap-4">
                  <HiOutlineExclamationCircle className="w-8 h-8 text-orange-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">
                      ปัญหาจากฝ่ายสต็อก/จัดซื้อ
                    </p>
                    <p className="font-bold text-orange-900 leading-relaxed">
                      {order.purchasingReason}
                    </p>
                    {order.purchasingEta && (
                      <p className="mt-2 text-[10px] font-black text-orange-600">
                        คาดว่าของจะเข้า:{" "}
                        {new Date(order.purchasingEta).toLocaleDateString(
                          "th-TH",
                        )}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {canViewOrderItems && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <HiOutlineCube className="w-6 h-6 text-emerald-500" />
                  รายการสินค้าในออเดอร์
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                    <tr>
                      <th className="px-8 py-4">สินค้า / รหัส (SKU)</th>
                      <th className="px-4 py-4 text-center">สี/ไซส์</th>
                      <th className="px-4 py-4 text-center">จำนวน</th>
                      <th className="px-8 py-4 text-right">ราคาหน่วย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {order.items.map((item, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-8 py-4">
                          <p className="font-black text-slate-700">
                            {item.productName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter">
                            {item.variant.sku}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-black text-slate-600">
                            {item.variant.color} / {item.variant.size}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center font-black text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="px-8 py-4 text-right font-black text-slate-700">
                          {item.price.toLocaleString()} ฿
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50/50">
                      <td
                        colSpan="3"
                        className="px-8 py-4 font-black text-indigo-700"
                      >
                        จำนวนรวมทั้งหมด
                      </td>
                      <td className="px-8 py-4 text-right font-black text-indigo-700 text-xl">
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}{" "}
                        ชิ้น
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {canViewTechnical && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <HiOutlineAdjustmentsHorizontal className="w-6 h-6 text-indigo-500" />
                  รายละเอียดทางเทคนิค (Graphic Specification)
                </h2>
                {canPerformGraphicAction && order.status !== "CANCELLED" && (
                  <button
                    onClick={handleUpdateSpecs}
                    className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all border border-indigo-100"
                    disabled={isUpdating}
                  >
                    บันทึกสเปคเทคนิค
                  </button>
                )}
              </div>

              <div className="p-8 space-y-4">
                {editSpecs.map((emb, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-xs font-black shadow-sm ring-1 ring-slate-200">
                        {emb.position === "อื่นๆ"
                          ? emb.customPosition
                          : emb.position}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {emb.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                          ขนาด (กว้าง x สูง)
                        </label>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            placeholder="W"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            value={emb.width || ""}
                            readOnly={!canPerformGraphicAction}
                            onChange={(e) => {
                              const n = [...editSpecs];
                              n[idx].width = e.target.value;
                              setEditSpecs(n);
                            }}
                          />
                          <span className="text-slate-300">x</span>
                          <input
                            type="text"
                            placeholder="H"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            value={emb.height || ""}
                            readOnly={!canPerformGraphicAction}
                            onChange={(e) => {
                              const n = [...editSpecs];
                              n[idx].height = e.target.value;
                              setEditSpecs(n);
                            }}
                          />
                        </div>
                      </div>
                      <div className="col-span-2">
                        <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                          รายละเอียดสี
                        </label>
                        <input
                          type="text"
                          placeholder="รหัสสีไหม/สีสกรีน"
                          className="w-full mt-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                          value={emb.colorDetail || ""}
                          readOnly={!canPerformGraphicAction}
                          onChange={(e) => {
                            const n = [...editSpecs];
                            n[idx].colorDetail = e.target.value;
                            setEditSpecs(n);
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase ml-1">
                        หมายเหตุเดิม
                      </label>
                      <p className="text-xs text-slate-600 font-medium italic mt-1">
                        {emb.note || "-"}
                      </p>
                    </div>
                  </div>
                ))}
                {editSpecs.length === 0 && (
                  <p className="text-center py-8 text-slate-400 font-bold italic">
                    ไม่มีรายละเอียดการปัก/สกรีนเพิ่มเติม
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Media Sections - Visible to Technical Roles (Except Stock) */}
          {canViewTechnical && !isStockRole && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  <HiOutlinePhoto className="w-6 h-6 text-purple-500" />
                  สื่อดิจิทัลและไฟล์งาน (Media & Assets)
                </h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Draft Images - Visible to EVERYONE as Source of Truth */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                    ภาพร่างจำลองจากแชท (Draft Mockups)
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.isArray(order.draftImages) &&
                    order.draftImages.length > 0 ? (
                      order.draftImages.map((img, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-white rounded-3xl overflow-hidden relative group border border-slate-100"
                        >
                          <img
                            src={img}
                            className="w-full h-full object-cover"
                            alt={`Draft ${i}`}
                          />
                          <a
                            href={img}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-black uppercase"
                          >
                            ดูภาพ
                          </a>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center text-slate-300">
                        <HiOutlinePhoto className="w-10 h-10 mb-2" />
                        <p className="text-[10px] font-bold uppercase">
                          ไม่มีภาพสเปคจากแชท
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Deposit Slip - Restricted Visibility */}
                {canViewFinancial && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      สลิปเงินมัดจำ (Sales Only)
                    </p>
                    <div className="aspect-[3/4] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center relative group">
                      {order.depositSlipUrl ? (
                        <>
                          <img
                            src={order.depositSlipUrl}
                            className="w-full h-full object-cover"
                            alt="Slip"
                          />
                          <a
                            href={order.depositSlipUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                          >
                            ขยายรูปสลิป
                          </a>
                        </>
                      ) : (
                        <div className="text-center p-6">
                          <HiOutlineCurrencyDollar className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                          <p className="text-xs font-bold text-slate-300 uppercase">
                            ยังไม่มีสลิป
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Assets: Production focus - HIDDEN FOR STOCK */}
          {canViewTechnical && !isStockRole && (
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50 bg-indigo-50/30">
                <h2 className="text-lg font-black text-indigo-800 flex items-center gap-2">
                  <HiOutlineAdjustmentsHorizontal className="w-6 h-6 text-indigo-500" />
                  ไฟล์งานผลิตควบคุม (Production Assets)
                </h2>
              </div>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Artwork Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      Artwork (Final Design)
                    </p>
                    {canPerformGraphicAction &&
                      order.status !== "CANCELLED" && (
                        <label className="text-[10px] font-bold text-indigo-600 cursor-pointer hover:underline">
                          {uploadingField === "artwork"
                            ? "กำลังอัปโหลด..."
                            : "อัปโหลด Artwork"}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, "artwork")}
                            disabled={!!uploadingField}
                          />
                        </label>
                      )}
                  </div>
                  <div className="aspect-square bg-gray-800 rounded-[2.5rem] flex items-center justify-center relative group overflow-hidden border-4 border-slate-800">
                    {order.artworkUrl ? (
                      <>
                        <img
                          src={order.artworkUrl}
                          className="w-full h-full object-contain"
                          alt="Artwork"
                        />
                        <a
                          href={order.artworkUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                        >
                          ดูรูปเต็ม
                        </a>
                      </>
                    ) : (
                      <div className="text-center p-6">
                        <HiOutlinePhoto className="w-12 h-12 text-slate-700 mx-auto mb-2" />
                        <p className="text-xs font-black text-slate-600 uppercase">
                          รอฝ่ายกราฟิก...
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Production File */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">
                      Production File (.DST)
                    </p>
                    {canPerformGraphicAction &&
                      order.status !== "CANCELLED" && (
                        <label className="text-[10px] font-bold text-emerald-600 cursor-pointer hover:underline">
                          {uploadingField === "production"
                            ? "กำลังอัปโหลด..."
                            : "อัปโหลดไฟล์ผลิต"}
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, "production")}
                            disabled={!!uploadingField}
                          />
                        </label>
                      )}
                  </div>
                  <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] border border-slate-200 p-6 min-h-[220px]">
                    {order.productionFileUrl ? (
                      <a
                        href={order.productionFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-6 bg-slate-900 rounded-[2.5rem] shadow-xl text-white flex items-center gap-4 hover:bg-black transition-all group mt-auto"
                      >
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <HiOutlineDocumentText className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-black text-sm truncate">
                            {order.productionFileName || "Technical_File"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Ready for Machine
                          </p>
                        </div>
                      </a>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                        <HiOutlineDocumentText className="w-16 h-16 mb-2" />
                        <p className="text-xs font-black uppercase">
                          No DST File
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 space-y-6">
            <h2 className="text-md font-black text-slate-800 border-l-4 border-blue-400 pl-3">
              ข้อมูลลูกค้า
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                  <HiOutlineUser className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    ชื่อลูกค้า
                  </p>
                  <p className="font-bold text-slate-700">
                    {order.customerName}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-50 text-green-500 rounded-lg">
                  <HiOutlinePhone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">
                    เบอร์โทร
                  </p>
                  <p className="font-bold text-slate-700">
                    {order.customerPhone || "ไม่ได้ระบุ"}
                  </p>
                </div>
              </div>
            </div>

            {canViewFinancial && (
              <div className="pt-6 border-t border-slate-50 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    ยอดรวมทั้งสิ้น
                  </span>
                  <span className="font-black text-slate-800">
                    {(Number(order.totalPrice) || 0).toLocaleString()} ฿
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    ยอดมัดจำที่ชำระแล้ว
                  </span>
                  <span className="font-black text-emerald-600">
                    {(Number(order.paidAmount) || 0).toLocaleString()} ฿
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    ค้างชำระ
                  </span>
                  <span className="font-black text-rose-600">
                    {(Number(order.balanceDue) || 0).toLocaleString()} ฿
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">
                    สถานะชำระ
                  </span>
                  {getPaymentStatusBadge(order.paymentStatus)}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8 max-h-[500px] overflow-y-auto">
            <h2 className="text-md font-black text-slate-800 border-l-4 border-emerald-400 pl-3 mb-6">
              ความเคลื่อนไหว (Log)
            </h2>
            <div className="space-y-6">
              {order.logs?.map((log, idx) => (
                <div key={idx} className="relative pl-6 pb-6 last:pb-0">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-indigo-500" />
                  <div>
                    <p className="text-[10px] font-black text-slate-800 leading-tight uppercase">
                      {{
                        CREATED: "รับออเดอร์ใหม่",
                        PURCHASING_UPDATE: "อัปเดตสต็อกพัสดุ",
                        UPLOAD_ARTWORK: "อัปโหลดงานออกแบบ",
                        UPDATE_SPECS: "อัปเดตงานปัก",
                        PRINT_JOB_SHEET: "พิมพ์ใบงาน",
                        STOCK_RECHECKED: "ส่งผลิต",
                        START_PRODUCTION: "ส่งเข้าผลิต",
                        QC_PASS: "ตรวจสอบ QC ผ่าน",
                        QC_FAIL: "ตรวจสอบ QC ไม่ผ่าน",
                        COMPLETED: "จัดส่งเรียบร้อย",
                        CANCEL_ORDER: "ยกเลิกออเดอร์",
                        BUMP_URGENT: "เร่งงานด่วน",
                        CLAIM_GRAPHIC: "กราฟิกรับงาน",
                        CLAIM_QC: "QC รับงาน",
                      }[log.action] || log.action}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      {log.details}
                    </p>
                    <p className="text-[9px] font-bold text-indigo-400 mt-1 uppercase">
                      {log.user?.name} •{" "}
                      {new Date(log.timestamp).toLocaleTimeString("th-TH")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-800 mb-4">
              ยกเลิกออเดอร์
            </h2>
            <textarea
              className="w-full px-6 py-4 bg-slate-50 border rounded-3xl font-bold h-32 focus:ring-4 focus:ring-red-100 outline-none"
              placeholder="ระบุเหตุผลการยกเลิก..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-600"
              >
                ปิด
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg"
                disabled={isUpdating}
              >
                ยืนยันการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showUrgentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-800 mb-4">
              เร่งออเดอร์ (Urgent)
            </h2>
            <textarea
              className="w-full px-6 py-4 bg-amber-50 border border-amber-100 rounded-3xl font-bold h-32 focus:ring-4 focus:ring-amber-200 outline-none"
              placeholder="หมายเหตุเร่งด่วนสำหรับกราฟิก..."
              value={urgentNote}
              onChange={(e) => setUrgentNote(e.target.value)}
            />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowUrgentModal(false)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-600"
              >
                ปิด
              </button>
              <button
                onClick={handleBumpUrgent}
                className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg"
                disabled={isUpdating}
              >
                ส่งสัญญาณเร่งด่วน
              </button>
            </div>
          </div>
        </div>
      )}

      {isLibraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in slide-in-from-bottom-8 duration-300">
            <div className="p-8 border-b flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800">
                Embroidery Library
              </h2>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-3 bg-slate-100 rounded-2xl text-slate-400 hover:text-red-500 transition-colors"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8 bg-slate-50 border-b relative">
              <HiOutlineMagnifyingGlass className="absolute left-12 top-1/2 -translate-y-1/2 text-slate-400 w-6 h-6" />
              <input
                type="text"
                placeholder="ค้นหาบล็อก..."
                className="w-full pl-14 pr-6 py-4 bg-white border rounded-2xl font-bold outline-none shadow-sm focus:ring-4 focus:ring-indigo-100"
                value={searchBlock}
                onChange={(e) => setSearchBlock(e.target.value)}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {blocks.length > 0 ? (
                blocks.map((block) => (
                  <div
                    key={block.id}
                    className="p-4 bg-white border rounded-[2rem] flex items-center gap-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleLinkBlock(block.id)}
                  >
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                      {block.artworkUrl && (
                        <img
                          src={block.artworkUrl}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 font-black text-slate-800">
                      {block.name}
                    </div>
                    <button className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      เลือก
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-20">
                  <HiOutlineCube className="w-16 h-16 mx-auto mb-2" />
                  <p className="font-black font-bold">ไม่พบบล็อกที่มีชื่อนี้</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Stock Issue Modal */}
      {showStockIssueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <HiOutlineExclamationCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                แจ้งปัญหาสินค้า
              </h3>
            </div>

            <p className="text-slate-500 mb-6 font-medium">
              ระบุรายละเอียดปัญหา เช่น สีนี้ในสต็อกหมด หรือ
              รายละเอียดที่ลูกค้าสั่งไม่ตรงกับของที่มี
              (ข้อมูลนี้จะแจ้งไปยังฝ่ายขายโดยตรง)
            </p>

            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all min-h-[120px] mb-6 font-medium text-slate-800"
              placeholder="ตัวอย่าง: เช็คสินค้าแล้วสีนี้ไซส์ M สต็อกหมด จะให้สั่งเพิ่มหรือยกเลิก ถามลูกค้าเอา..."
              value={stockIssueReason}
              onChange={(e) => setStockIssueReason(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowStockIssueModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReportStockIssue}
                disabled={!stockIssueReason.trim() || isUpdating}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isUpdating ? "กำลังส่ง..." : "แจ้งปัญหาไปยังฝ่ายขาย"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
