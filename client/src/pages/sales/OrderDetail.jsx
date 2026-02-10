import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineExclamationCircle,
  HiOutlineCube,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import PaymentModal from "../../components/Payment/PaymentModal";
import { getDisplayName } from "../../utils/namePrivacy";
import { formatDate, formatTime } from "../../utils/dateFormat"; // Import utils
import { getStatusLabel, statusColors } from "../../utils/statusMapper";
import OrderHeader from "../../components/Order/OrderHeader";
import OrderStatusBar from "../../components/Order/OrderStatusBar";
import OrderInfoCards from "../../components/Order/OrderInfoCards";
import OrderItemTable from "../../components/Order/OrderItemTable";
import OrderTechnicalSpecs from "../../components/Order/OrderTechnicalSpecs";
import OrderSidebar from "../../components/Order/OrderSidebar";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
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
  }, [orderId]);

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
      const response = await api.get(`/orders/${orderId}/download/jobsheet`, {
        responseType: "blob",
      });

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
      const response = await api.get(`/orders/${orderId}/download/proof`, {
        responseType: "blob",
      });

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
      await api.patch(`/orders/${orderId}/status`, {
        status: endpoint,
        ...payload,
      });
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
      await api.patch(`/orders/${orderId}/specs`, {
        embroideryDetails: editSpecs,
      });
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
      await api.patch(`/orders/${orderId}/status`, {
        status: "PRODUCTION_FINISHED",
        pass: false,
        reason: qcFailReason,
        returnTo: qcReturnTo,
      });
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
      const res = await api.post(`/orders/${orderId}/claim`);
      if (res.data.success) {
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
      const uploadRes = await api.post(`/upload?folder=${folder}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const fileUrl = uploadRes.data.data.url;
      const payload =
        type === "artwork"
          ? { artworkUrl: fileUrl }
          : { productionFileUrl: fileUrl, productionFileName: file.name };

      await api.patch(`/orders/${orderId}/specs`, payload);

      // Also update linked block if exists
      if (order.blockId) {
        await api.patch(`/blocks/${order.blockId}`, payload);
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
      const res = await api.get(`/blocks?search=${searchBlock}`);
      setBlocks(res.data.data.blocks);
    } catch {
      alert("ไม่สามารถดึงข้อมูลบล็อกได้");
    }
  }, [searchBlock]);

  const handleLinkBlock = async (blockId) => {
    try {
      setIsUpdating(true);
      await api.post(`/blocks/link/${orderId}/${blockId}`);
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
      await api.patch(`/orders/${order.id}/status`, {
        status: "STOCK_ISSUE",
        reason: stockIssueReason,
      });
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

  // Role-based Dynamic Labels
  const technicalHeader = isProductionRole
    ? "รายละเอียดสเปคการผลิต (Production Specs)"
    : isQCRole
      ? "ข้อมูลประกอบการตรวจงาน (QC Specs)"
      : "รายละเอียดทางเทคนิค (Graphic Specification)";

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 overflow-x-hidden font-sans">
      <OrderHeader
        order={order}
        user={user}
        isAdmin={isAdmin}
        isUpdating={isUpdating}
        navigate={navigate}
        formatDate={formatDate}
        downloadCustomerProof={downloadCustomerProof}
        downloadJobSheet={downloadJobSheet}
        getDisplayName={getDisplayName}
        handleClaim={handleClaim}
        isGraphicRole={isGraphicRole}
        isStockRole={isStockRole}
        isProductionRole={isProductionRole}
        isQCRole={isQCRole}
      />

      <div className="max-w-7xl mx-auto px-4 mt-6">
        <OrderStatusBar
          order={order}
          user={user}
          isAdmin={isAdmin}
          isUpdating={isUpdating}
          handleUpdateStatus={handleUpdateStatus}
          handleClaim={handleClaim}
          setShowUrgentModal={setShowUrgentModal}
          setShowCancelModal={setShowCancelModal}
          setShowStockIssueModal={setShowStockIssueModal}
          setShowQCFailModal={setShowQCFailModal}
          setShowPaymentModal={setShowPaymentModal}
          trackingNo={trackingNo}
          setTrackingNo={setTrackingNo}
          canPerformSalesAction={canPerformSalesAction}
          canPerformGraphicAction={canPerformGraphicAction}
          canPerformStockAction={canPerformStockAction}
          canPerformProductionAction={canPerformProductionAction}
          canPerformQCAction={canPerformQCAction}
          canPerformDeliveryAction={canPerformDeliveryAction}
          isClaimedByMe={isClaimedByMe}
          getStatusBadge={getStatusBadge}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Order Content */}
        <div className="lg:col-span-2 space-y-6">
          <OrderInfoCards order={order} />
          <OrderItemTable order={order} canViewOrderItems={canViewOrderItems} />

          <OrderTechnicalSpecs
            order={order}
            user={user}
            isAdmin={isAdmin}
            isUpdating={isUpdating}
            editSpecs={editSpecs}
            setEditSpecs={setEditSpecs}
            uploadingField={uploadingField}
            handleFileUpload={handleFileUpload}
            handleUpdateSpecs={handleUpdateSpecs}
            isLibraryOpen={isLibraryOpen}
            setIsLibraryOpen={setIsLibraryOpen}
            searchBlock={searchBlock}
            setSearchBlock={setSearchBlock}
            blocks={blocks}
            handleLinkBlock={handleLinkBlock}
            canPerformGraphicAction={canPerformGraphicAction}
            canViewTechnical={canViewTechnical}
            technicalHeader={technicalHeader}
            isGraphicRole={isGraphicRole}
          />
        </div>

        <OrderSidebar
          order={order}
          user={user}
          canViewFinancial={canViewFinancial}
          getPaymentStatusBadge={getPaymentStatusBadge}
          formatDate={formatDate}
          formatTime={formatTime}
        />
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
