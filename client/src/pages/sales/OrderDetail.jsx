import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineCheckBadge,
  HiOutlineShieldCheck,
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
  HiOutlineArrowRightCircle,
} from "react-icons/hi2";
import { HiOutlinePrinter } from "react-icons/hi";
import PaymentModal from "../../components/Payment/PaymentModal";
import PaymentHistory from "../../components/Payment/PaymentHistory";
import { getDisplayName } from "../../utils/namePrivacy";
import { formatDate, formatTime } from "../../utils/dateFormat"; // Import utils
import {
  getStatusLabel,
  getActionLabel,
  statusColors,
} from "../../utils/statusMapper";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trackingNo, setTrackingNo] = useState("");

  // QC Fail states
  const [showQCFailModal, setShowQCFailModal] = useState(false);
  const [qcFailReason, setQCFailReason] = useState("");
  const [qcReturnTo, setQCReturnTo] = useState("PRODUCTION"); // Default to Production

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

  // Auto-refresh removed as per user request
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     fetchOrder();
  //   }, 30000); // 30 วินาที

  //   return () => clearInterval(interval);
  // }, [fetchOrder]);

  const downloadJobSheet = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/orders/${orderId}/jobsheet`,
        {
          headers: getAuthHeader(),
          responseType: "blob",
        },
      );

      // If the response is JSON (error), it will still be a blob
      if (response.data.type === "application/json") {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        alert(`เกิดข้อผิดพลาด: ${errorData.message}`);
        return;
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `JobSheet-${order.jobId.replace("/", "-")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("ไม่สามารถดาวน์โหลด Job Sheet ได้");
    }
  };

  const downloadCustomerProof = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/orders/${orderId}/customer-proof`,
        {
          headers: getAuthHeader(),
          responseType: "blob",
        },
      );

      if (response.data.type === "application/json") {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        alert(`เกิดข้อผิดพลาด: ${errorData.message}`);
        return;
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `ProofSheet-${order.jobId.replace("/", "-")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("ไม่สามารถดาวน์โหลด Proof Sheet ได้");
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
      // alert("อัปเดตรายละเอียดทางเทคนิคเรียบร้อย"); // Auto-save silently
      await fetchOrder();
    } catch {
      console.error("Failed to update specs");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQCFail = async () => {
    if (!qcFailReason.trim()) return alert("กรุณาระบุเหตุผลที่ไม่ผ่าน QC");
    try {
      setIsUpdating(true);
      await axios.patch(
        `http://localhost:8000/api/orders/${orderId}/qc-pass`,
        {
          pass: false,
          reason: qcFailReason,
          returnTo: qcReturnTo,
        },
        {
          headers: getAuthHeader(),
        },
      );
      setShowQCFailModal(false);
      setQCFailReason("");
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ");
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
    const config = statusColors[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      label: status,
    };
    return (
      <span
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}
      >
        {getStatusLabel(status)}
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
  const isMarketingRole = user?.role === "MARKETING";
  const isFinanceRole = user?.role === "FINANCE";
  const isExecutiveRole = user?.role === "EXECUTIVE";

  // Viewing permissions
  // Viewing permissions

  // 1. Technical (Graphic Specs, Artwork, Production Files) - RESTRICTED
  // QC, PRODUCTION, GRAPHIC, ADMIN ดูได้
  const canViewTechnical =
    isSalesRole || isProductionRole || isQCRole || isGraphicRole || isAdmin; // ฝ่ายขายเห็นได้ทั้งหมด

  // 2. Financial (Prices, Deposit Slips, Balance) & General Order Info
  // QC ดู Financial ได้, รวมทั้ง Sales, Delivery, Exec, Marketing, Finance
  const canViewFinancial =
    isSalesRole ||
    isQCRole ||
    isDeliveryRole ||
    isExecutiveRole ||
    isMarketingRole ||
    isFinanceRole ||
    isAdmin;

  // 3. Draft Images (Mockups) - Sales needs to see this, but not Source Files
  // Generally everyone involved in the order flow usually sees the draft
  // QC ไม่ต้องการดู Draft

  const canViewOrderItems = !isGraphicRole; // ฝ่ายกราฟิกไม่จำเป็นต้องเห็นรายการสินค้า

  // Helper to check if task is claimed by current user
  const isClaimedByMe = (claimId) => claimId === user?.id;

  // Action permissions - Now enforced by claimId
  const canPerformSalesAction = isSalesRole || isAdmin;
  const canPerformGraphicAction =
    (isGraphicRole && isClaimedByMe(order.graphicId)) || isAdmin;
  const canPerformStockAction =
    (isStockRole && isClaimedByMe(order.stockId)) || isAdmin;
  const canPerformProductionAction =
    (isProductionRole && isClaimedByMe(order.productionId)) || isAdmin;
  const canPerformQCAction = (isQCRole && isClaimedByMe(order.qcId)) || isAdmin;
  const canPerformDeliveryAction = isDeliveryRole || isAdmin;
  const canViewProductionFiles =
    (isAdmin || isGraphicRole || isProductionRole || isQCRole) && !isSalesRole;

  // Role-based Dynamic Labels
  const technicalHeader = isProductionRole
    ? "รายละเอียดสเปคการผลิต (Production Specs)"
    : isQCRole
      ? "ข้อมูลประกอบการตรวจงาน (QC Specs)"
      : "รายละเอียดทางเทคนิค (Graphic Specification)";

  const dstLabel = isQCRole
    ? "สรุปประวัติจ่ายเงิน (Payment Summary)"
    : "Production File (.DST)";
  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-erp-in">
      {/* Navigation & Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50 h-14">
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
                  Job ID: {order.jobId}
                </h1>
                {order.isUrgent && (
                  <span className="erp-badge bg-rose-50 text-rose-700 animate-pulse border-rose-100 flex items-center gap-1">
                    <HiOutlineFire className="w-3 h-3" />
                    งานด่วน
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Ref: {order.globalRunning?.toString().padStart(6, "0")} |{" "}
                {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCustomerProof}
              className="erp-button bg-indigo-50 text-indigo-700 border-indigo-100 py-1.5 px-3 text-xs"
            >
              <HiOutlineDocumentText className="w-4 h-4" />
              <span>พิมพ์ใบสรุปงาน (Customer Proof)</span>
            </button>
            <button
              onClick={downloadJobSheet}
              className="erp-button erp-button-secondary py-1.5 px-3 text-xs"
            >
              <HiOutlinePrinter className="w-4 h-4" />
              <span>พิมพ์ใบงาน (Print Sheet)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Assignment Bar (High-density Awareness) */}
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

      {/* Role Action Panel */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
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
                  {getStatusBadge(order.status).props.children}
                </h2>
                {order.status !== "CANCELLED" && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {/* SALES ACTIONS */}
            {canPerformSalesAction &&
              order.status !== "CANCELLED" &&
              order.status !== "COMPLETED" && (
                <>
                  <button
                    onClick={() => setShowUrgentModal(true)}
                    className={`erp-button flex items-center gap-1.5 py-2 px-4 ${order.isUrgent ? "bg-amber-100 text-amber-700 border-amber-200" : "erp-button-secondary"}`}
                    disabled={isUpdating}
                  >
                    <HiOutlineBellAlert className="w-4 h-4" />
                    {order.isUrgent
                      ? "งานด่วน (ตั้งค่าแล้ว)"
                      : "ตั้งค่าเป็นงานด่วน"}
                  </button>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    className="erp-button bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 flex items-center gap-1.5 py-2 px-4"
                    disabled={isUpdating}
                  >
                    <HiOutlineNoSymbol className="w-4 h-4" />
                    ยกเลิกคำสั่งซื้อ
                  </button>
                </>
              )}

            {/* GRAPHIC ACTIONS */}
            {canPerformGraphicAction &&
              (order.status === "PENDING_ARTWORK" ||
                order.status === "DESIGNING") && (
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateStatus("print-signal")}
                      className="erp-button erp-button-primary flex items-center gap-1.5 py-2 px-4"
                      disabled={isUpdating}
                    >
                      <HiOutlineArrowRightCircle className="w-4 h-4" />
                      ส่งให้ฝ่ายสต็อก (Send to Stock)
                    </button>
                  </div>
                </div>
              )}

            {/* STOCK ACTIONS */}
            {canPerformStockAction &&
              (order.status === "PENDING_STOCK_CHECK" ||
                order.status === "STOCK_ISSUE") && (
                <div className="flex items-center gap-2">
                  {order.status === "PENDING_STOCK_CHECK" && (
                    <button
                      onClick={() => handleUpdateStatus("stock-recheck")}
                      className="erp-button erp-button-primary bg-emerald-600 hover:bg-emerald-700 border-emerald-500 py-2 px-4"
                      disabled={isUpdating}
                    >
                      ยืนยันสต็อกครบ (Confirm Stock)
                    </button>
                  )}
                  <button
                    onClick={() => setShowStockIssueModal(true)}
                    className="erp-button bg-rose-50 text-rose-600 border-rose-100 py-2 px-4"
                    disabled={isUpdating}
                  >
                    แจ้งปัญหาสินค้า
                  </button>
                </div>
              )}

            {canPerformProductionAction && order.status === "IN_PRODUCTION" && (
              <button
                onClick={() => handleUpdateStatus("production-finish")}
                className="erp-button erp-button-primary bg-indigo-600 py-2 px-4"
                disabled={isUpdating}
              >
                บันทึกผลิตเสร็จ (Finish)
              </button>
            )}

            {/* QC ACTIONS */}
            {canPerformQCAction && order.status === "PRODUCTION_FINISHED" && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus("qc-pass", { pass: true })}
                  className="px-6 py-3 bg-emerald-400 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isUpdating || order.status !== "PRODUCTION_FINISHED"
                  }
                >
                  ผ่าน QC (Pass)
                </button>
                <button
                  onClick={() => setShowQCFailModal(true)}
                  className="px-6 py-3 bg-rose-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    isUpdating || order.status !== "PRODUCTION_FINISHED"
                  }
                >
                  ไม่ผ่าน (Fail)
                </button>
              </div>
            )}

            {/* DELIVERY ACTIONS */}
            {canPerformDeliveryAction && (
              <div className="flex flex-col gap-3 items-center w-full">
                {order.status === "QC_PASSED" && (
                  <div className="flex flex-col gap-3 items-center w-full max-w-xs">
                    <button
                      onClick={() => handleUpdateStatus("ready-to-ship")}
                      className="px-6 py-3 bg-blue-500 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all w-full disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isUpdating || order.status !== "QC_PASSED"}
                    >
                      รับงานเข้าฝ่ายจัดส่ง
                    </button>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-100 transition-all text-xs w-full flex items-center justify-center gap-1.5"
                    >
                      <HiOutlineCurrencyDollar className="w-4 h-4" />
                      แจ้งชำระเงิน / อัปโหลดสลิป
                    </button>
                  </div>
                )}

                {order.status === "READY_TO_SHIP" && (
                  <div className="w-full max-w-md space-y-3 bg-white/20 p-4 rounded-3xl backdrop-blur-sm border border-white/30">
                    <p className="text-sm font-bold text-white text-center mb-2 uppercase tracking-wide">
                      ขั้นตอนการจัดส่ง (Shipping)
                    </p>

                    {/* PAYMENT GATE */}
                    {order.paymentStatus !== "PAID" ? (
                      <div className="bg-red-500/90 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-pulse">
                        <HiOutlineExclamationCircle className="w-8 h-8 shrink-0" />
                        <div className="flex-1">
                          <p className="font-black text-sm uppercase">
                            ยังชำระเงินไม่ครบ!
                          </p>
                          <p className="text-xs font-medium opacity-90">
                            ห้ามจัดส่งจนกว่าจะชำระครบ (ค้าง{" "}
                            {parseFloat(order.balanceDue).toLocaleString()}฿)
                          </p>
                          <button
                            onClick={() => setShowPaymentModal(true)}
                            className="mt-3 w-full py-2.5 bg-white text-red-600 rounded-xl font-black text-xs shadow-md border border-red-200 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                          >
                            📌 คลิกเพื่ออัปโหลดสลิป / แจ้งชำระเงิน
                          </button>
                        </div>
                      </div>
                    ) : (
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
                            handleUpdateStatus("complete", { trackingNo });
                          }}
                          className="w-full px-6 py-3 bg-emerald-500 text-white rounded-xl font-black shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={
                            isUpdating || order.status !== "READY_TO_SHIP"
                          }
                        >
                          <HiOutlineCheckCircle className="w-5 h-5" />
                          ยืนยันจัดส่ง (Complete)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* CLAIM REMINDERS FOR OTHER ROLES */}
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
                    <div className="flex flex-col items-center gap-2 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20">
                      <HiOutlineExclamationCircle className="w-8 h-8 text-indigo-300 animate-pulse" />
                      <p className="text-white font-black text-sm uppercase tracking-wide">
                        กรุณากดรับงานก่อนเพื่อดำเนินการ
                      </p>
                      <p className="text-indigo-200 text-[10px] font-bold">
                        ปุ่มรับงาน (Claim Task) อยู่ด้านบนสุดของหน้าจอครับ
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Content */}
        <div className="lg:col-span-2 space-y-6">
          {(order.purchasingReason ||
            order.urgentNote ||
            order.cancelReason) && (
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
                        ETA:{" "}
                        {new Date(order.purchasingEta).toLocaleDateString(
                          "th-TH",
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {canViewOrderItems && (
            <div className="erp-card overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                <HiOutlineCube className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  รายการสินค้าในออเดอร์
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>สินค้า / SKU (Product)</th>
                      <th className="text-center">สี/ไซส์ (Variant)</th>
                      <th className="text-center">จำนวน (Qty)</th>
                      <th className="text-right">ราคาต่อชิ้น (Price)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <p className="font-bold text-slate-800 text-[13px]">
                            {item.productName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">
                            {item.variant.sku}
                          </p>
                        </td>
                        <td className="text-center">
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                            {item.variant.color} / {item.variant.size}
                          </span>
                        </td>
                        <td className="text-center font-bold text-slate-700">
                          {item.quantity}
                        </td>
                        <td className="text-right font-bold text-slate-900">
                          ฿{item.price.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50/80">
                    <tr>
                      <td
                        colSpan="2"
                        className="py-3 font-bold text-slate-500 text-xs"
                      >
                        จำนวนรวมทั้งหมด
                      </td>
                      <td className="text-center font-black text-indigo-600">
                        {order.items.reduce(
                          (sum, item) => sum + item.quantity,
                          0,
                        )}{" "}
                        ตัว (Pcs)
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {canViewTechnical && (
            <div className="erp-card">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineAdjustmentsHorizontal className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    {technicalHeader}
                  </h3>
                  <div className="ml-4 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-semibold uppercase">
                      ประเภทบล็อก:
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        order.blockType === "NEW"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : order.blockType === "EDIT"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                      }`}
                    >
                      {order.blockType === "NEW"
                        ? "3 (ใหม่)"
                        : order.blockType === "EDIT"
                          ? "2 (แก้)"
                          : "1 (เดิม)"}
                    </span>
                  </div>
                </div>
                {canPerformGraphicAction && order.status !== "CANCELLED" ? (
                  <button
                    onClick={handleUpdateSpecs}
                    className="erp-button erp-button-primary py-1.5 px-3 text-xs"
                    disabled={
                      isUpdating ||
                      (order.status !== "PENDING_ARTWORK" &&
                        order.status !== "DESIGNING")
                    }
                  >
                    บันทึกอัตโนมัติ (Auto Saved)
                  </button>
                ) : (
                  isGraphicRole &&
                  !isAdmin && (
                    <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 uppercase tracking-tighter animate-pulse">
                      กรุณากดรับงานด้านบนก่อนแก้ไขสเปค
                    </span>
                  )
                )}
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editSpecs.map((emb, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 shadow-sm"
                    >
                      <div className="flex justify-between items-center">
                        <span className="bg-white px-2 py-0.5 rounded text-[10px] font-bold text-indigo-600 border border-indigo-100 uppercase">
                          {emb.position === "อื่นๆ"
                            ? emb.customPosition
                            : emb.position}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {emb.type}
                          {emb.blockName && (
                            <span className="ml-2 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">
                              Block: {emb.blockName}
                            </span>
                          )}
                        </span>
                      </div>

                      {canPerformGraphicAction ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            {emb.isFreeOption && (
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={emb.isFreeOption || false}
                                  disabled={true}
                                  onChange={(e) => {
                                    const n = [...editSpecs];
                                    n[idx].isFreeOption = e.target.checked;
                                    setEditSpecs(n);
                                  }}
                                  className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  onBlur={handleUpdateSpecs}
                                />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                  ตัวเลือกเสริม (Free)
                                </span>
                              </label>
                            )}

                            {emb.isFreeOption ? (
                              <select
                                value={emb.freeOptionName || "เซฟตี้"}
                                onChange={(e) => {
                                  const n = [...editSpecs];
                                  n[idx].freeOptionName = e.target.value;
                                  setEditSpecs(n);
                                }}
                                className="erp-input py-1 text-xs font-bold w-full"
                                disabled={true} // Always lock if checked
                              >
                                <option value="เซฟตี้">เซฟตี้</option>
                                <option value="ธงชาติ">ธงชาติ</option>
                                <option value="โลโก้สาขา">โลโก้สาขา</option>
                                <option value="เครื่องหมายราชการ">
                                  เครื่องหมายราชการ
                                </option>
                                <option value="อื่นๆ">อื่นๆ</option>
                              </select>
                            ) : (
                              <div className="flex items-center gap-1.5 flex-1">
                                <input
                                  type="text"
                                  placeholder="กว้าง"
                                  className="erp-input py-1 text-xs font-bold text-center"
                                  value={emb.width || ""}
                                  onChange={(e) => {
                                    const n = [...editSpecs];
                                    n[idx].width = e.target.value;
                                    setEditSpecs(n);
                                  }}
                                  onBlur={handleUpdateSpecs}
                                />
                                <span className="text-slate-300 text-[10px] font-bold">
                                  ×
                                </span>
                                <input
                                  type="text"
                                  placeholder="สูง"
                                  className="erp-input py-1 text-xs font-bold text-center"
                                  value={emb.height || ""}
                                  onChange={(e) => {
                                    const n = [...editSpecs];
                                    n[idx].height = e.target.value;
                                    setEditSpecs(n);
                                  }}
                                  onBlur={handleUpdateSpecs}
                                />
                              </div>
                            )}
                          </div>

                          {/* Text Field & Note */}
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">
                                หมายเหตุ
                              </label>
                              <input
                                type="text"
                                placeholder="(ไม่มีข้อความ)"
                                className="erp-input py-1.5 text-xs font-bold text-slate-500 w-full bg-slate-100 border-slate-200 cursor-not-allowed"
                                value={emb.textToEmb || ""}
                                readOnly={true}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">
                                หมายเหตุ (Notes)
                              </label>
                              <input
                                type="text"
                                placeholder="สีไหม / รายละเอียดเพิ่มเติม..."
                                className="erp-input py-1.5 text-xs font-semibold w-full"
                                value={emb.note || ""}
                                onChange={(e) => {
                                  const n = [...editSpecs];
                                  n[idx].note = e.target.value;
                                  setEditSpecs(n);
                                }}
                                onBlur={handleUpdateSpecs}
                              />
                            </div>
                          </div>

                          {/* Image Preview in Edit Mode */}
                          <div className="flex gap-2 pt-2 border-t border-slate-100">
                            {emb.logoUrl && (
                              <div className="w-12 h-12 rounded border bg-white overflow-hidden group relative">
                                <img
                                  src={emb.logoUrl}
                                  className="w-full h-full object-contain"
                                  alt="Logo"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <a
                                    href={emb.logoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[8px] text-white font-bold bg-indigo-600 px-1 rounded"
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            )}
                            {emb.mockupUrl && (
                              <div className="w-12 h-12 rounded border bg-white overflow-hidden group relative">
                                <img
                                  src={emb.mockupUrl}
                                  className="w-full h-full object-contain"
                                  alt="Mockup"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <a
                                    href={emb.mockupUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[8px] text-white font-bold bg-indigo-600 px-1 rounded"
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            )}
                            {!emb.logoUrl && !emb.mockupUrl && (
                              <span className="text-[9px] text-slate-400 italic self-center">
                                No images uploaded
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white/50 p-2.5 rounded border border-slate-100">
                          <p className="text-xs font-bold text-slate-700 leading-snug">
                            {emb.isFreeOption
                              ? `[FREE: ${emb.freeOptionName}]`
                              : `รายละเอียด`}
                            {emb.note && (
                              <span className="block mt-1 text-indigo-600 font-semibold">
                                {emb.note}
                              </span>
                            )}
                            {emb.textToEmb && (
                              <span className="block mt-1 text-slate-500 font-bold border-t border-slate-100 pt-1">
                                หมายเหตุ: {emb.textToEmb}
                              </span>
                            )}
                          </p>

                          {/* 🆕 Render Images if available */}
                          <div className="flex gap-2 mt-2">
                            {emb.logoUrl && (
                              <div className="w-16 h-16 rounded border bg-white overflow-hidden group relative">
                                <img
                                  src={emb.logoUrl}
                                  className="w-full h-full object-contain"
                                  alt="Logo"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <a
                                    href={emb.logoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[8px] text-white font-bold bg-indigo-600 px-1 rounded"
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            )}
                            {emb.mockupUrl && (
                              <div className="w-16 h-16 rounded border bg-white overflow-hidden group relative">
                                <img
                                  src={emb.mockupUrl}
                                  className="w-full h-full object-contain"
                                  alt="Mockup"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <a
                                    href={emb.mockupUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[8px] text-white font-bold bg-indigo-600 px-1 rounded"
                                  >
                                    View
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {editSpecs.length === 0 && (
                    <div className="col-span-full py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                      <p className="text-xs font-bold text-slate-400 italic uppercase tracking-widest">
                        ไม่มีการระบุรายละเอียดเพิ่มเติม
                      </p>
                    </div>
                  )}
                </div>

                {/* Media Assets (Split view) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      แบบปัก / ม็อคอัพ (Final Mockup)
                    </p>
                    {order.artworkUrl ? (
                      <div className="relative group aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-900 shadow-sm">
                        <img
                          src={order.artworkUrl}
                          className="w-full h-full object-contain"
                          alt="Final Design"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a
                            href={order.artworkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-white text-slate-900 px-3 py-1.5 rounded-md text-xs font-bold shadow-lg hover:bg-slate-50 transition-all"
                          >
                            ดูรูปภาพขนาดเต็ม
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 opacity-60">
                        <HiOutlinePhoto className="w-8 h-8 mb-1" />
                        <p className="text-[10px] font-bold uppercase">
                          รอการอัปโหลด
                        </p>
                      </div>
                    )}
                    {canPerformGraphicAction &&
                      order.status !== "CANCELLED" && (
                        <div className="relative overflow-hidden erp-button erp-button-secondary py-1.5 text-xs">
                          <input
                            type="file"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => handleFileUpload(e, "artwork")}
                            disabled={!!uploadingField}
                          />
                          <HiOutlineCloudArrowUp className="w-4 h-4 mr-1.5" />
                          {uploadingField === "artwork"
                            ? "กำลังอัปโหลด..."
                            : "อัปโหลดรูปภาพแบบ"}
                        </div>
                      )}
                  </div>

                  {/* Draft Images (Visual Mockups) */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      ภาพร่างจากฝ่ายขาย (Visual Mockups)
                    </p>
                    {order.draftImages && order.draftImages.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {order.draftImages.map((img, i) => (
                          <div
                            key={i}
                            className="aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group relative"
                          >
                            <img
                              src={img}
                              className="w-full h-full object-cover"
                              alt={`Draft ${i + 1}`}
                            />
                            <a
                              href={img}
                              target="_blank"
                              rel="noreferrer"
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs"
                            >
                              ดูรูป
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
                        <p className="text-[10px] text-slate-400">
                          ไม่มีภาพร่าง
                        </p>
                      </div>
                    )}
                  </div>

                  {canViewProductionFiles && (
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {dstLabel}
                      </p>
                      {!isQCRole ? (
                        <div className="space-y-3 h-full">
                          <div className="bg-slate-900 rounded-lg p-4 h-[100px] flex flex-col justify-center border border-slate-800 shadow-inner">
                            {order.productionFileUrl ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 bg-indigo-500/20 rounded text-indigo-400">
                                    <HiOutlineDocumentText className="w-5 h-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate max-w-[120px]">
                                      {order.productionFileName ||
                                        "Technical_Spec"}
                                    </p>
                                    <p className="text-[9px] text-slate-500 uppercase font-bold">
                                      พร้อมสำหรับการผลิต
                                    </p>
                                  </div>
                                </div>
                                <a
                                  href={order.productionFileUrl}
                                  download
                                  className="p-1.5 bg-indigo-600 rounded text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/40"
                                >
                                  <HiOutlineDocumentArrowDown className="w-4 h-4" />
                                </a>
                              </div>
                            ) : (
                              <p className="text-[10px] font-bold text-slate-600 text-center italic">
                                No technical file uploaded yet
                              </p>
                            )}
                          </div>
                          {canPerformGraphicAction &&
                            order.status !== "CANCELLED" && (
                              <div className="flex gap-2">
                                <div className="relative overflow-hidden erp-button erp-button-secondary flex-1 py-1.5 text-xs text-indigo-600">
                                  <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) =>
                                      handleFileUpload(e, "production")
                                    }
                                    disabled={!!uploadingField}
                                  />
                                  {uploadingField === "production"
                                    ? "..."
                                    : "อัปโหลดไฟล์ .DST"}
                                </div>
                                <button
                                  onClick={() => setIsLibraryOpen(true)}
                                  className="erp-button erp-button-secondary py-1.5 text-xs text-slate-500"
                                >
                                  <HiOutlineMagnifyingGlass className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                        </div>
                      ) : (
                        <div className="bg-indigo-50 rounded-lg p-4 h-[100px] border border-indigo-100 flex flex-col justify-center text-center">
                          <p className="text-xs font-bold text-indigo-700 uppercase">
                            QC Mode
                          </p>
                          <p className="text-[10px] text-indigo-400 font-semibold mt-1">
                            กรุณาตรวจสอบม็อคอัพด้านซ้ายมือ
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Sidebar */}
        <div className="space-y-6">
          {/* Customer Profile */}
          <div className="erp-card">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <HiOutlineUser className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">ข้อมูลลูกค้า</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">
                  ชื่อ-นามสกุล
                </p>
                <p className="text-base font-bold text-slate-900">
                  {order.customerName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <HiOutlinePhone className="w-3 h-3" /> เบอร์โทรศัพท์
                  </p>
                  <a
                    href={`tel:${order.customerPhone}`}
                    className="text-sm font-bold text-indigo-600 hover:underline"
                  >
                    {order.customerPhone || "-"}
                  </a>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <HiOutlineChatBubbleLeftRight className="w-3 h-3" /> ชื่อ
                    Facebook / LINE
                  </p>
                  <span className="text-sm font-bold text-slate-700 truncate block">
                    {order.customerFb || "-"}
                  </span>
                </div>

                <div className="col-span-2 w-full pt-2 border-t border-slate-100 mt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                    <HiOutlineShieldCheck className="w-3 h-3 text-indigo-500" />{" "}
                    ช่องทาง / เพจ (Sales Channel)
                  </p>
                  <div className="w-full space-y-2">
                    <div className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        เพจ (Page):
                      </span>
                      <span className="text-[11px] font-black text-slate-900 text-right">
                        {order.salesChannel?.name || "-"}
                      </span>
                    </div>

                    <div className="w-full bg-slate-50 p-2.5 rounded-lg border border-slate-100 grid grid-cols-2 items-center">
                      <span className="text-[11px] font-bold text-slate-500 uppercase">
                        หมายเลขเพจ (Code):
                      </span>
                      <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 justify-self-end">
                        {order.salesChannel?.code || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                  <HiOutlineMapPin className="w-3 h-3" /> ที่อยู่สำหรับจัดส่ง
                </p>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] font-semibold text-slate-600 leading-relaxed shadow-inner">
                  {order.customerAddress || "ไม่มีข้อมูลที่อยู่"}
                </div>
              </div>

              {canPerformSalesAction && (
                <Link
                  to={`/order/edit/${order.id}`}
                  className="erp-button erp-button-secondary w-full py-2.5 text-xs bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 flex items-center justify-center gap-2"
                >
                  <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
                  แก้ไขข้อมูล (กรณีใส่ข้อมูลผิด)
                </Link>
              )}
            </div>
          </div>

          {/* Financial Summary */}
          {canViewFinancial && (
            <div className="erp-card border-t-4 border-t-emerald-500">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HiOutlineCurrencyDollar className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800 text-sm">
                    สรุปสถานะการเงิน
                  </h3>
                </div>
                {getPaymentStatusBadge(order.paymentStatus)}
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500">
                      ยอดรวมทั้งหมด
                    </span>
                    <span className="font-bold text-slate-900">
                      ฿{parseFloat(order.totalPrice).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-500 text-emerald-600">
                      ชำระแล้ว
                    </span>
                    <span className="font-bold text-emerald-600">
                      ฿{parseFloat(order.paidAmount).toLocaleString()}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100" />
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-500">
                      ยอดคงเหลือที่ต้องชำระ
                    </span>
                    <span className="text-lg font-black text-rose-600">
                      ฿{parseFloat(order.balanceDue).toLocaleString()}
                    </span>
                  </div>
                </div>

                {canPerformSalesAction &&
                  order.status !== "CANCELLED" &&
                  order.status !== "COMPLETED" && (
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="erp-button erp-button-primary w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100"
                      disabled={isUpdating}
                    >
                      อัพเดตยอดคงเหลือ / อัปโหลดสลิป
                    </button>
                  )}

                {/* รายประวัติการจ่ายเงิน (Sub-list) */}
                {(order.paymentSlips?.length > 0 || order.depositSlipUrl) && (
                  <div className="pt-4 border-t border-slate-100 mt-4 h-[120px] overflow-y-auto no-scrollbar">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-3 flex items-center justify-between">
                      ประวัติการชำระเงิน
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px]">
                        {(order.paymentSlips?.length || 0) +
                          (order.depositSlipUrl ? 1 : 0)}{" "}
                        รายการ
                      </span>
                    </p>
                    <div className="space-y-2 pb-2">
                      {/* New Slips */}
                      {order.paymentSlips?.map((slip) => (
                        <div
                          key={slip.id}
                          className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center group"
                        >
                          <div>
                            <p className="text-[10px] font-bold text-slate-700">
                              ฿{parseFloat(slip.amount).toLocaleString()}
                            </p>
                            <p className="text-[9px] text-slate-400">
                              {formatDate(slip.createdAt)} •{" "}
                              {slip.uploader?.name || "Unknown"}
                            </p>
                          </div>
                          <a
                            href={slip.slipUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] font-bold text-indigo-500 hover:text-indigo-600 underline"
                          >
                            ดูสลิป
                          </a>
                        </div>
                      ))}

                      {/* Legacy Deposit */}
                      {order.depositSlipUrl &&
                        !order.paymentSlips?.some(
                          (s) => s.slipUrl === order.depositSlipUrl,
                        ) && (
                          <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100 flex justify-between items-center">
                            <div>
                              <p className="text-[10px] font-bold text-emerald-700">
                                ฿
                                {parseFloat(
                                  order.deposit || 0,
                                ).toLocaleString()}
                              </p>
                              <p className="text-[9px] text-emerald-500 font-medium">
                                มัดจำ (ข้อมูลเดิม)
                              </p>
                            </div>
                            <a
                              href={order.depositSlipUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 underline"
                            >
                              ดูสลิป
                            </a>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="erp-card overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">
                ประวัติกิจกรรม (Timeline)
              </h3>
            </div>
            <div className="p-5 max-h-[400px] overflow-y-auto no-scrollbar space-y-4">
              {order.logs
                ?.filter((log) => log.action !== "อัปเดตสเปคทางเทคนิค")
                .map((log, idx, filteredLogs) => {
                  const isLatest = idx === 0;
                  return (
                    <div key={idx} className="flex gap-3 relative">
                      {idx < filteredLogs.length - 1 && (
                        <div className="absolute left-[7px] top-4 bottom-0 w-0.5 bg-slate-100" />
                      )}
                      <div
                        className={`shrink-0 w-4 h-4 rounded-full border-2 z-10 mt-1 transition-all ${isLatest ? "bg-indigo-600 border-indigo-200 animate-pulse" : "bg-white border-slate-200"}`}
                      />
                      <div className="flex-1 min-w-0 pb-4">
                        <p
                          className={`text-[11px] font-bold leading-tight ${isLatest ? "text-indigo-600" : "text-slate-800"}`}
                        >
                          {getActionLabel(log.action)}
                        </p>
                        {log.details && (
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                            {log.details}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 mt-1 opacity-60">
                          {log.action !== "AUTO_URGENT" && (
                            <>
                              <span className="text-[9px] font-bold text-slate-400">
                                {log.user?.name || "ระบบอัตโนมัติ"}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                            </>
                          )}
                          <span className="text-[9px] font-medium text-slate-400">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
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

      {showPaymentModal && (
        <PaymentModal
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            fetchOrder();
            // Optional: Show success toast
          }}
        />
      )}

      {showUrgentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-800 mb-4">
              เร่งออเดอร์
            </h2>
            <textarea
              className="w-full px-6 py-4 bg-amber-50 border border-amber-100 rounded-3xl font-bold h-32 focus:ring-4 focus:ring-amber-200 outline-none"
              placeholder="หมายเหตุเร่งด่วน...."
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
                คลังแบบปัก (Embroidery Library)
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
      {/* QC Fail Modal */}
      {showQCFailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <HiOutlineXMark className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                แจ้งผล QC ไม่ผ่าน
              </h3>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                  1. ส่งกลับไปแก้ไขที่ฝ่ายไหน?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setQCReturnTo("PRODUCTION")}
                    className={`py-3 rounded-2xl font-black border-2 transition-all ${
                      qcReturnTo === "PRODUCTION"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    ฝ่ายผลิต (Production)
                  </button>
                  <button
                    onClick={() => setQCReturnTo("GRAPHIC")}
                    className={`py-3 rounded-2xl font-black border-2 transition-all ${
                      qcReturnTo === "GRAPHIC"
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    ฝ่ายกราฟิก (Graphic)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                  2. ระบุเหตุผลที่ไม่ผ่าน
                </label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-50 focus:border-rose-400 outline-none transition-all min-h-[120px] font-medium text-slate-800"
                  placeholder="เช่น สีด้ายไม่ตรงสเปค, งานปักเบี้ยว, มีรอยเปื้อน..."
                  value={qcFailReason}
                  onChange={(e) => setQCFailReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowQCFailModal(false);
                  setQCFailReason("");
                }}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all font-bold"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleQCFail}
                disabled={!qcFailReason.trim() || isUpdating}
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 disabled:opacity-50 transition-all font-black"
              >
                {isUpdating ? "กำลังส่ง..." : "ยืนยันส่งแก้ไข"}
              </button>
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
