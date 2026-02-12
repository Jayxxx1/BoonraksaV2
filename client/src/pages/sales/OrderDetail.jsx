import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineExclamationCircle,
  HiOutlineCube,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleBottomCenterText,
} from "react-icons/hi2";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import PaymentModal from "../../components/Payment/PaymentModal";
import ConfirmationModal from "../../components/Common/ConfirmationModal";
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

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDangerous: false,
    confirmLabel: "ยืนยัน (Confirm)",
  });

  const openConfirmModal = ({
    title,
    message,
    onConfirm,
    isDangerous = false,
    confirmLabel = "ยืนยัน (Confirm)",
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDangerous,
      confirmLabel,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
        const fetchedOrder = res.data.data.order;
        setOrder(fetchedOrder);
        setEditSpecs(fetchedOrder.positions || []);
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

  const downloadJobSheet = async () => {
    try {
      const response = await api.get(`/orders/${orderId}/download/jobsheet`, {
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

  const executeStatusUpdate = async (endpoint, payload = {}) => {
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

  const handleUpdateStatus = async (endpoint, payload = {}) => {
    let title = "ยืนยันการเปลี่ยนสถานะ";
    let message = "คุณต้องการเปลี่ยนสถานะออเดอร์ใช่หรือไม่?";
    let confirmLabel = "ยืนยัน (Confirm)";
    let shouldConfirm = false;

    switch (endpoint) {
      case "PENDING_STOCK_CHECK":
        title = "ยืนยันส่งฝ่ายสต็อก (Send to Stock)";
        message =
          "คุณตรวจสอบรายละเอียดครบถ้วนแล้ว และต้องการส่งออเดอร์นี้ให้ฝ่ายสต็อกดำเนินการต่อใช่หรือไม่?";
        confirmLabel = "ส่งสต็อก (Send)";
        shouldConfirm = true;
        break;
      case "STOCK_RECHECKED":
        title = "ยืนยันสต็อกครบ (Confirm Stock)";
        message =
          "คุณยืนยันว่าสินค้าในสต็อกมีเพียงพอและพร้อมสำหรับการผลิต/ดำเนินการต่อใช่หรือไม่?";
        confirmLabel = "ยืนยัน (Confirm)";
        shouldConfirm = true;
        break;
      case "PRODUCTION_FINISHED":
        if (payload.pass) {
          title = "ยืนยันผ่าน QC (QC Pass)";
          message =
            "คุณตรวจสอบงานแล้วว่ามีคุณภาพถูกต้องตามสเปค และพร้อมส่งต่อให้ฝ่ายจัดส่งใช่หรือไม่?";
          confirmLabel = "ผ่าน QC (Pass)";
        } else {
          title = "ยืนยันผลิตเสร็จ (Production Finished)";
          message =
            "คุณดำเนินการผลิตเสร็จเรียบร้อยและพร้อมส่งต่องานให้ฝ่าย QC ตรวจสอบใช่หรือไม่?";
          confirmLabel = "ยืนยัน (Confirm)";
        }
        shouldConfirm = true;
        break;
      case "READY_TO_SHIP":
        title = "ยืนยันรับงานเข้าฝ่ายจัดส่ง";
        message =
          "คุณได้รับสินค้าจากฝ่ายผลิต/QC เรียบร้อยแล้ว และพร้อมสำหรับการแพ็ค/จัดส่งใช่หรือไม่?";
        confirmLabel = "รับงาน (Receive)";
        shouldConfirm = true;
        break;
      case "COMPLETED": {
        title = "ยืนยันการจัดส่ง (Complete Order)";
        const trackingMsg = payload.trackingNo
          ? `เลขพัสดุ: ${payload.trackingNo}`
          : "";
        message = `คุณได้ทำการจัดส่งสินค้าเรียบร้อยแล้วใช่หรือไม่? ${trackingMsg}`;
        confirmLabel = "ยืนยันจัดส่ง (Complete)";
        shouldConfirm = true;
        break;
      }
      case "cancel": // Handle cancel via existing modal structure, but if called directly:
        // note: bump urgent / cancel usually called via specific handlers, but if routed here:
        shouldConfirm = false;
        break;
      default:
        shouldConfirm = false;
    }

    if (shouldConfirm) {
      openConfirmModal({
        title,
        message,
        confirmLabel,
        onConfirm: () => executeStatusUpdate(endpoint, payload),
      });
    } else {
      executeStatusUpdate(endpoint, payload);
    }
  };

  const handleUpdateSpecs = async () => {
    try {
      setIsUpdating(true);
      await api.patch(`/orders/${orderId}/specs`, {
        embroideryDetails: editSpecs,
      });
      await fetchOrder();
    } catch {
      console.error("Failed to update specs");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleQCFail = async () => {
    if (!qcFailReason.trim()) return alert("กรุณาระบุเหตุผลที่ไม่ผ่าน QC");
    openConfirmModal({
      title: "ยืนยันผลการตรวจสอบ (Confirm QC Fail)",
      message: `คุณกำลังจะระบุว่างานนี้ "ไม่ผ่าน QC" และส่งกลับไปยัง ${
        qcReturnTo === "PRODUCTION" ? "ฝ่ายผลิต" : "ฝ่ายแก้แพทเทิร์น"
      } ใช่หรือไม่?`,
      confirmLabel: "ยืนยัน (Confirm)",
      isDangerous: true,
      onConfirm: async () => {
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
      },
    });
  };

  const handleUpdatePurchasingInfo = async (eta, reason) => {
    try {
      setIsUpdating(true);
      await api.patch(`/orders/${orderId}/purchasing`, {
        purchasingEta: eta,
        purchasingReason: reason,
      });
      await fetchOrder();
    } catch (err) {
      alert(
        err.response?.data?.message || "ไม่สามารถอัปเดตข้อมูลการจัดซื้อได้",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmArrival = async () => {
    openConfirmModal({
      title: "ยืนยันสินค้าเข้าคลัง (Confirm Delivery)",
      message:
        "คุณต้องการยืนยันว่าได้รับสินค้าตามจำนวนที่ถูกต้องและพร้อมดำเนินการในขั้นตอนถัดไปใช่หรือไม่?",
      confirmLabel: "ยืนยัน (Confirm)",
      onConfirm: async () => {
        try {
          setIsUpdating(true);
          await api.patch(`/orders/${orderId}/purchasing`, {
            confirmArrival: true,
          });
          await fetchOrder();
          alert("ยืนยันสินค้าเข้าคลังเรียบร้อยแล้ว");
        } catch (err) {
          alert(err.response?.data?.message || "ไม่สามารถยืนยันสินค้าเข้าได้");
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  const handleClaim = async () => {
    openConfirmModal({
      title: "ยืนยันการรับงาน (Claim Task)",
      message:
        "คุณต้องการรับผิดชอบงานนี้ใช่หรือไม่? หลังจากกดรับงานแล้ว คุณจะสามารถแก้ไขข้อมูลและดำเนินการต่อได้",
      confirmLabel: "รับงาน (Claim)",
      onConfirm: async () => {
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
      },
    });
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
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-center max-w-md w-full">
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
  const isPurchasingRole = user?.role === "PURCHASING";
  const isGraphicRole = user?.role === "GRAPHIC";
  const isStockRole = user?.role === "STOCK";
  const isProductionRole = user?.role === "PRODUCTION";
  const isQCRole = user?.role === "SEWING_QC";
  const isDeliveryRole = user?.role === "DELIVERY";
  const isMarketingRole = user?.role === "MARKETING";
  const isFinanceRole = user?.role === "FINANCE";
  const isExecutiveRole = user?.role === "EXECUTIVE";

  const canViewTechnical =
    (isSalesRole || isProductionRole || isQCRole || isGraphicRole || isAdmin) &&
    !isPurchasingRole;

  const canViewFinancial =
    isSalesRole ||
    isPurchasingRole ||
    isQCRole ||
    isDeliveryRole ||
    isExecutiveRole ||
    isMarketingRole ||
    isFinanceRole ||
    isAdmin;

  const canViewOrderItems = !isGraphicRole;

  const isClaimedByMe = (claimId) => claimId === user?.id;

  const canPerformSalesAction = isSalesRole || isAdmin;
  const canPerformGraphicAction =
    (isGraphicRole && isClaimedByMe(order.graphicId)) || isAdmin;
  const canPerformStockAction =
    (isStockRole && isClaimedByMe(order.stockId)) || isAdmin;
  const canPerformProductionAction =
    (isProductionRole && isClaimedByMe(order.productionId)) || isAdmin;
  const canPerformQCAction = (isQCRole && isClaimedByMe(order.qcId)) || isAdmin;
  const canPerformDeliveryAction = isDeliveryRole || isAdmin;

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
        <div className="lg:col-span-2 space-y-6">
          <OrderInfoCards order={order} />

          {order.actionMap?.canViewPreorder && order.hasPreorder && (
            <div
              className={`erp-card overflow-hidden ${order.preorderSubStatus === "ARRIVED" ? "bg-emerald-50/20 border-emerald-200" : "bg-amber-50/20 border-amber-200"}`}
            >
              <div
                className={`p-4 border-b flex items-center justify-between ${order.preorderSubStatus === "ARRIVED" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}
              >
                <div className="flex items-center gap-2">
                  <HiOutlineTruck
                    className={`w-5 h-5 ${order.preorderSubStatus === "ARRIVED" ? "text-emerald-600" : "text-amber-600"}`}
                  />
                  <h3
                    className={`font-black text-sm uppercase tracking-wide ${order.preorderSubStatus === "ARRIVED" ? "text-emerald-900" : "text-amber-900"}`}
                  >
                    จัดการสถานะสินค้าสั่งผลิต (Procurement Management)
                  </h3>
                </div>
                {order.preorderSubStatus === "ARRIVED" ? (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    สินค้าเข้าคลังแล้ว
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter animate-pulse">
                    ดำเนินการสั่งซื้อ โปรดรอฝ่ายจัดซื้อบันทึกเข้าระบบ
                  </span>
                )}
              </div>

              <div className="p-6">
                <div
                  className={`mb-6 rounded-2xl p-4 border ${order.preorderSubStatus === "ARRIVED" ? "bg-emerald-100/50 border-emerald-200" : "bg-amber-100/50 border-amber-200"}`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${order.preorderSubStatus === "ARRIVED" ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    <HiOutlineCube className="w-4 h-4" />
                    สรุปรายการที่รอของเข้า (Inventory Shortage)
                  </p>
                  <div className="space-y-1.5">
                    {order.items
                      .filter((i) => i.isPreorder)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-700">
                            {item.productName} ({item.variant?.color}/
                            {item.variant?.size})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-black ${order.preorderSubStatus === "ARRIVED" ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"}`}
                          >
                            สั่งเพิ่มอีก: {item.preorderQty} ตัว
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div
                  className={`grid grid-cols-1 ${
                    order.isDelayed &&
                    (order.actionMap?.canEditPreorder || order.purchasingEta) &&
                    order.preorderSubStatus !== "ARRIVED"
                      ? "md:grid-cols-2"
                      : "md:grid-cols-1"
                  } gap-6 mb-8`}
                >
                  {(order.actionMap?.canEditPreorder || order.purchasingEta) &&
                    order.preorderSubStatus !== "ARRIVED" && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                          วันที่สินค้าจะเข้าคลัง (ETA)
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 font-black text-lg text-indigo-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                          value={order.purchasingEta?.split("T")[0] || ""}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            handleUpdatePurchasingInfo(
                              e.target.value,
                              order.purchasingReason,
                            )
                          }
                          disabled={
                            isUpdating || !order.actionMap?.canEditPreorder
                          }
                        />
                        <p className="text-[10px] text-slate-400 font-bold italic">
                          {!order.actionMap?.canEditPreorder
                            ? "* ติดตามความคืบหน้าจากฝ่ายจัดซื้อ"
                            : `* แก้ไขได้อีก ${2 - (order.purchasingEtaCount || 0)} ครั้ง`}
                        </p>
                      </div>
                    )}

                  {order.isDelayed && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <HiOutlineChatBubbleBottomCenterText className="w-3.5 h-3.5" />
                        หมายเหตุจัดซื้อ / สาเหตุที่ล่าช้า (Purchasing Remarks)
                      </label>
                      <textarea
                        placeholder="ระบุความคืบหน้า..."
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 h-[80px] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal text-sm"
                        defaultValue={order.purchasingReason}
                        onBlur={(e) =>
                          handleUpdatePurchasingInfo(
                            order.purchasingEta,
                            e.target.value,
                          )
                        }
                        disabled={
                          isUpdating || !order.actionMap?.canEditPreorder
                        }
                      />
                    </div>
                  )}
                </div>

                {order.actionMap?.canEditPreorder &&
                  order.preorderSubStatus !== "ARRIVED" && (
                    <button
                      onClick={handleConfirmArrival}
                      disabled={isUpdating}
                      className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-[2rem] font-black shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 group"
                    >
                      <HiOutlineTruck className="w-6 h-6 animate-bounce" />
                      <span>ยืนยันว่าสินค้ามาส่งแล้ว (Confirm Delivery)</span>
                    </button>
                  )}

                {!order.actionMap?.canEditPreorder &&
                  !isAdmin &&
                  order.preorderSubStatus !== "ARRIVED" && (
                    <div className="bg-slate-100 p-4 rounded-2xl text-center">
                      <p className="text-xs font-bold text-slate-500 italic">
                        * รอฝ่ายจัดซื้อยืนยันการรับสินค้าเมื่อของมาถึงหน้างาน
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

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
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDangerous={confirmModal.isDangerous}
      />
    </div>
  );
};

export default OrderDetail;
