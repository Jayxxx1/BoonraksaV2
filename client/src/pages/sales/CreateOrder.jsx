import { useState, useEffect, useMemo } from "react";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import { useNavigate } from "react-router-dom";
import { HiOutlineCheckCircle } from "react-icons/hi2";
import { HiOutlinePrinter } from "react-icons/hi";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

// Components
import HeaderSection from "../../features/sales/create-order/components/HeaderSection";
import CustomerSection from "../../features/sales/create-order/components/CustomerSection";
import OrderInfoSection from "../../features/sales/create-order/components/OrderInfoSection";
import ProductMatrixSection from "../../features/sales/create-order/components/ProductMatrixSection";
import EmbroiderySection from "../../features/sales/create-order/components/EmbroiderySection";
import PaymentSection from "../../features/sales/create-order/components/PaymentSection";
import SummarySection from "../../features/sales/create-order/components/SummarySection";
import SmartPasteModal from "../../features/sales/create-order/components/SmartPasteModal";

const CreateOrder = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  // --- Form State ---
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    customerFb: "",
  });

  const [orderInfo, setOrderInfo] = useState({
    salesChannelId: "",
    isUrgent: false,
    dueDate: "",
    notes: "",
    blockType: "บล็อคเดิม",
  });

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customUnitPrice, setCustomUnitPrice] = useState(""); // Sales can override
  const [paidAmount, setPaidAmount] = useState(""); // ยอดที่ลูกค้าชำระมา
  const [depositSlipUrl, setDepositSlipUrl] = useState(""); // URL รูปสลิป
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  const [facebookPages, setFacebookPages] = useState([]);

  // Matrix State
  const [matrixData, setMatrixData] = useState({});
  const [activeColor, setActiveColor] = useState(""); // Currently selected color for editing
  const [quickFillTotal, setQuickFillTotal] = useState("");
  const [quickFillSizeIds, setQuickFillSizeIds] = useState([]); // Selected variant IDs for quick fill

  // Spec Parser State
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [rawSpecText, setRawSpecText] = useState("");
  const [parsedResults, setParsedResults] = useState([]); // [{ size, requested, actualStock, status, variantId }]
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);

  // Embroidery State
  const [embroidery, setEmbroidery] = useState([]);

  // Blocks State
  const [blocks, setBlocks] = useState([]);

  const fetchCustomerBlocks = async () => {
    if (!customer.name && !customer.phone) {
      alert("กรุณาระบุชื่อหรือเบอร์โทรลูกค้าก่อนค้นหาบล็อก");
      return;
    }
    try {
      const q = customer.phone || customer.name;
      const res = await api.get(`/blocks/customer-search?q=${q}`);
      setBlocks(res.data.data.blocks);
      if (res.data.data.blocks.length === 0) {
        alert("ไม่พบประวัติบล็อกของลูกค้ารายนี้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการค้นหาบล็อก");
    }
  };

  const [loading, setLoading] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [error, setError] = useState("");

  const [draftImages, setDraftImages] = useState([]);
  const [uploadingDraft, setUploadingDraft] = useState(false);
  const [showPreOrderConfirm, setShowPreOrderConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, channelRes] = await Promise.all([
          api.get("/products"),
          api.get("/orders/channels"),
        ]);

        const enrichedProducts = (prodRes.data.data || []).map((p) => ({
          ...p,
          subtitle: `รหัส: ${p.codePrefix || "-"} | สต็อกรวม: ${p.totalStock ?? 0} ชิ้น | เริ่มต้น: ${p.startPrice || 0} ฿`,
        }));

        setProducts(enrichedProducts);
        const enrichedChannels = (channelRes.data.data.channels || []).map(
          (c) => ({
            ...c,
            subtitle: `รหัส: ${c.code}`,
          }),
        );
        setFacebookPages(enrichedChannels);
      } catch (err) {
        console.error("Fetch error", err);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
    };
    fetchData();
  }, [token]);

  // Selected Product & Matrix Logic
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === parseInt(selectedProductId)),
    [products, selectedProductId],
  );

  useEffect(() => {
    if (selectedProductId && (!selectedProduct || !selectedProduct.variants)) {
      const fetchFullProduct = async () => {
        try {
          const res = await api.get(`/products/${selectedProductId}`);

          if (res.data.success) {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === parseInt(selectedProductId)
                  ? { ...p, ...res.data.data }
                  : p,
              ),
            );
          }
        } catch (err) {
          console.error("Fetch full product error", err);
        }
      };
      fetchFullProduct();
    }
  }, [selectedProductId, token, selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      const price =
        selectedProduct.startPrice ||
        selectedProduct.variants?.[0]?.price ||
        "";
      setCustomUnitPrice(price);
    }
  }, [selectedProduct]);

  const { colors, sizes, variantsMap } = useMemo(() => {
    if (!selectedProduct || !selectedProduct.variants)
      return { colors: [], sizes: [], variantsMap: {} };

    const cSet = new Set();
    const sSet = new Set();
    const vMap = {};

    selectedProduct.variants.forEach((v) => {
      cSet.add(v.color);
      sSet.add(v.size);
      vMap[`${v.color}-${v.size}`] = v;
    });

    const sizeOrder = [
      "XXS",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL",
      "5XL",
      "6XL",
      "7XL",
      "8XL",
      "9XL",
      "Free",
    ];
    return {
      colors: Array.from(cSet),
      sizes: Array.from(sSet).sort(
        (a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b),
      ),
      variantsMap: vMap,
    };
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      setMatrixData({});
      setQuickFillSizeIds([]);
      setQuickFillTotal("");
      if (colors.length > 0) setActiveColor(colors[0]);
    }
  }, [selectedProduct, colors]);

  const handleMatrixChange = (vId, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setMatrixData((prev) => ({ ...prev, [vId]: num }));
  };

  const handleQuickFill = () => {
    const total = parseInt(quickFillTotal) || 0;
    if (total <= 0 || quickFillSizeIds.length === 0) return;

    const perSize = Math.floor(total / quickFillSizeIds.length);
    const remainder = total % quickFillSizeIds.length;

    const newData = { ...matrixData };
    quickFillSizeIds.forEach((vId, idx) => {
      newData[vId] = perSize + (idx === 0 ? remainder : 0);
    });

    setMatrixData(newData);
    setQuickFillTotal("");
    setQuickFillSizeIds([]);
  };

  const handleParseSpec = () => {
    if (!rawSpecText.trim() || !activeColor) return;
    const regex = /(XXS|XS|S|M|L|XL|[2-9]XL|Free)\s*[:=]?\s*(\d+)/gi;
    const matches = [...rawSpecText.matchAll(regex)];

    const results = matches.map((match) => {
      const sizeStr = match[1].toUpperCase();
      const qty = parseInt(match[2]);
      const variant = Object.values(variantsMap).find(
        (v) => v.color === activeColor && v.size.toUpperCase() === sizeStr,
      );

      let status = "success";
      let adjustedQty = qty;
      let message = "";

      if (!variant) {
        status = "error";
        message = "ไม่มีไซส์นี้";
      } else if (qty > variant.stock) {
        if (autoFixEnabled) {
          adjustedQty = variant.stock;
          status = "warning";
          message = `สต็อกจำกัด (${variant.stock})`;
        } else {
          status = "warning";
          message = "สต็อกไม่พอ";
        }
      }

      return {
        size: sizeStr,
        requested: qty,
        adjusted: adjustedQty,
        stock: variant?.stock || 0,
        status,
        message,
        vId: variant?.id,
      };
    });
    setParsedResults(results);
  };

  const confirmSpec = () => {
    const newData = { ...matrixData };
    parsedResults.forEach((res) => {
      if (res.vId) newData[res.vId] = res.adjusted;
    });
    setMatrixData(newData);
    setShowSpecModal(false);
    setRawSpecText("");
    setParsedResults([]);
  };

  const addEmbroidery = () => {
    setEmbroidery([
      ...embroidery,
      {
        position: "อกซ้าย",
        masterPositionId: 1, // Default to Left Chest (ID: 1) if available, check this logic?
        // Better to leave empty or default to first master?
        // Let's stick to "อกซ้าย" name but adding ID might be safer if we know ID 1 is Left Chest.
        // Or wait, let's just init as empty/first available logic in UI?
        // User requested "1. อกซ้าย" so ID 1 is likely "อกซ้าย".
        // Safe to init with name, but UI needs handle matching.
        customPosition: "",
        blockId: "",
        blockType: "บล็อคเดิม",
        width: "",
        height: "",
        note: "",
        textToEmb: "", // สำหรับปักข้อความ (Text Lock)
        logoUrl: "", // รูปไฟล์โลโก้เฉพาะจุด
        mockupUrl: "", // รูปจำลองเฉพาะจุด
        isFreeOption: false,
        freeOptionName: "เซฟตี้",
        isChangePosition: false,
      },
    ]);
  };

  const removeEmbroidery = (index) => {
    setEmbroidery(embroidery.filter((_, i) => i !== index));
  };

  const handleDraftImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    setUploadingDraft(true);
    try {
      const res = await api.post("/upload?folder=drafts", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDraftImages([...draftImages, res.data.data.url]);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploadingDraft(false);
    }
  };

  const handleUploadSlip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setIsUploadingSlip(true);
    try {
      const res = await api.post("/upload?folder=slips", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDepositSlipUrl(res.data.data.url);
    } catch {
      alert("อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const [isUploadingPositionImage, setIsUploadingPositionImage] =
    useState(null); // Track which index/type is uploading

  const handleEmbroideryImageUpload = async (index, type, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    const key = `${index}-${type}`;
    setIsUploadingPositionImage(key);

    try {
      const res = await api.post(`/upload?folder=embroidery`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newEmb = [...embroidery];
      if (type === "logo") newEmb[index].logoUrl = res.data.data.url;
      if (type === "mockup") newEmb[index].mockupUrl = res.data.data.url;
      setEmbroidery(newEmb);
    } catch (err) {
      console.error(err);
      alert("อัปโหลดรูปภาพตำแหน่งปักไม่สำเร็จ");
    } finally {
      setIsUploadingPositionImage(null);
    }
  };
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER"); // TRANSFER | COD
  const [masterPositions, setMasterPositions] = useState([]);

  useEffect(() => {
    const fetchMasterPositions = async () => {
      try {
        const res = await api.get("/master/positions");
        if (res.data.success) {
          setMasterPositions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch master positions", err);
      }
    };
    fetchMasterPositions();
  }, []);

  const totals = useMemo(() => {
    let matrixQty = 0;
    Object.entries(matrixData).forEach(([, qty]) => {
      if (qty > 0) matrixQty += qty;
    });
    const unitPrice = parseFloat(customUnitPrice) || 0;
    const subtotal = unitPrice * matrixQty;
    const blockPrice = orderInfo.blockType === "บล็อคใหม่" ? 250 : 0;

    // COD Logic: Surcharge 3% on (Subtotal + BlockPrice)
    // Note: Only if paymentMethod is COD and there are items
    let codSurcharge = 0;
    if (paymentMethod === "COD" && subtotal + blockPrice > 0) {
      codSurcharge = Math.ceil((subtotal + blockPrice) * 0.03);
    }

    const finalTotal = subtotal + blockPrice + codSurcharge;

    return {
      subtotal,
      totalQty: matrixQty,
      blockPrice,
      codSurcharge,
      finalTotal,
      balance: finalTotal - (parseFloat(paidAmount) || 0),
    };
  }, [
    matrixData,
    customUnitPrice,
    orderInfo.blockType,
    paidAmount,
    paymentMethod,
  ]);

  const [hasManualDeposit, setHasManualDeposit] = useState(false);
  useEffect(() => {
    if (!hasManualDeposit && totals.finalTotal > 0) {
      // If COD, usually no deposit required? Or maybe assume full COD?
      // User didn't specify, but usually COD = No Deposit or partial.
      // Keeping logic same: Suggest 20%
      setPaidAmount(Math.round(totals.finalTotal * 0.2));
    }
  }, [totals.finalTotal, hasManualDeposit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const items = Object.entries(matrixData)
      .filter(([, qty]) => qty > 0)
      .map(([vId, qty]) => {
        const v = selectedProduct.variants.find((v) => v.id === parseInt(vId));
        return {
          variantId: v.id,
          productName: selectedProduct.name,
          price: parseFloat(customUnitPrice) || v.price,
          quantity: qty,
          details: { color: v.color, size: v.size },
        };
      });

    if (items.length === 0) {
      setError("กรุณาเลือกสินค้าและระบุจำนวนอย่างน้อย 1 รายการ");
      setLoading(false);
      return;
    }

    const payload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerFb: customer.customerFb,
      salesChannelId: orderInfo.salesChannelId || null,
      isUrgent: orderInfo.isUrgent,
      blockType:
        { บล็อคเดิม: "OLD", บล็อคเดิมเปลี่ยนข้อความ: "EDIT", บล็อคใหม่: "NEW" }[
          orderInfo.blockType
        ] || "OLD",
      dueDate: orderInfo.dueDate || null,
      notes: orderInfo.notes,
      items,
      totalPrice: totals.finalTotal,
      paidAmount: parseFloat(paidAmount) || 0,
      blockPrice: totals.blockPrice, // Server might need this separately
      unitPrice: parseFloat(customUnitPrice) || 0,
      embroideryDetails: embroidery,
      depositSlipUrl: depositSlipUrl,
      draftImages: draftImages,
      // Sending payment method info in notes or specific field if schema supports
      paymentMethod: paymentMethod,
      codSurcharge: totals.codSurcharge,
    };

    // Check for out-of-stock items for pre-order confirmation
    const hasPreOrder = items.some((item) => {
      const v = selectedProduct.variants.find((v) => v.id === item.variantId);
      return v.stock < item.quantity;
    });

    if (hasPreOrder && !showPreOrderConfirm) {
      setPendingPayload(payload);
      setShowPreOrderConfirm(true);
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/orders", payload);
      if (res.data.success) {
        setSuccessOrderId(res.data.data.order.id);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างออเดอร์",
      );
    } finally {
      setLoading(false);
      setShowPreOrderConfirm(false);
      setPendingPayload(null);
    }
  };

  const confirmSubmit = () => {
    if (pendingPayload) {
      setLoading(true);
      const executeSubmit = async () => {
        try {
          const res = await api.post("/orders", pendingPayload);
          if (res.data.success) {
            setSuccessOrderId(res.data.data.order.id);
          }
        } catch (err) {
          setError(
            err.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างออเดอร์",
          );
        } finally {
          setLoading(false);
          setShowPreOrderConfirm(false);
          setPendingPayload(null);
        }
      };
      executeSubmit();
    }
  };

  const downloadJobSheet = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}/download/proof`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JobSheet-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      alert("ไม่สามารถดาวน์โหลด Job Sheet ได้");
    }
  };

  if (successOrderId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900">
        <div className="bg-white rounded-[2rem] shadow-xl p-10 max-w-md w-full text-center animate-erp-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineCheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            สร้างออเดอร์สำเร็จ!
          </h2>
          <p className="text-slate-500 mb-8 font-medium">
            คุณได้สร้างออเดอร์สำเร็จแล้ว
          </p>
          <div className="space-y-3">
            <button
              onClick={() => downloadJobSheet(successOrderId)}
              className="erp-button erp-button-primary w-full py-3.5 flex items-center justify-center gap-2"
            >
              <HiOutlinePrinter className="w-5 h-5" />{" "}
              ดาวน์โหลดใบงานสำหรับลูกค้า
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="erp-button erp-button-secondary w-full py-3.5"
            >
              ดูรายการออเดอร์ทั้งหมด
            </button>
            <button
              onClick={() => window.location.reload()}
              className="text-indigo-600 font-bold text-sm hover:underline mt-4"
            >
              สร้างออเดอร์อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-erp-in font-sans text-slate-900">
      <HeaderSection user={user} error={error} />

      <SmartPasteModal
        isOpen={showSpecModal}
        onClose={() => setShowSpecModal(false)}
        activeColor={activeColor}
        rawSpecText={rawSpecText}
        setRawSpecText={setRawSpecText}
        autoFixEnabled={autoFixEnabled}
        setAutoFixEnabled={setAutoFixEnabled}
        handleParseSpec={handleParseSpec}
        parsedResults={parsedResults}
        confirmSpec={confirmSpec}
      />

      {/* Pre-order Confirmation Modal */}
      {showPreOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">
              ยืนยันการสั่งผลิต (Pre-order)
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              พบรายการสินค้าบางรายการมีจำนวนสต็อกไม่เพียงพอ
              ออเดอร์นี้จะถูกส่งไปที่ฝ่ายจัดซื้อเพื่อดำเนินการสั่งของเพิ่ม
              <br />
              <b>สถานะจะเป็น: กำลังสั่งซื้อ</b>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPreOrderConfirm(false);
                  setPendingPayload(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "กำลังบันทึก..." : "ยืนยันการสั่งซื้อ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Main Content: 8 Columns */}
          <div className="lg:col-span-8 space-y-6">
            <CustomerSection customer={customer} setCustomer={setCustomer} />
            <OrderInfoSection
              orderInfo={orderInfo}
              setOrderInfo={setOrderInfo}
              facebookPages={facebookPages}
            />
            <ProductMatrixSection
              products={products}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              customUnitPrice={customUnitPrice}
              setCustomUnitPrice={setCustomUnitPrice}
              selectedProduct={selectedProduct}
              colors={colors}
              sizes={sizes}
              activeColor={activeColor}
              setActiveColor={setActiveColor}
              matrixData={matrixData}
              handleMatrixChange={handleMatrixChange}
              variantsMap={variantsMap}
              quickFillTotal={quickFillTotal}
              setQuickFillTotal={setQuickFillTotal}
              handleQuickFill={handleQuickFill}
              onOpenSpecModal={() => setShowSpecModal(true)}
            />
            <EmbroiderySection
              embroidery={embroidery}
              setEmbroidery={setEmbroidery}
              addEmbroidery={addEmbroidery}
              removeEmbroidery={removeEmbroidery}
              masterPositions={masterPositions}
              blocks={blocks}
              fetchCustomerBlocks={fetchCustomerBlocks}
              orderInfo={orderInfo}
              setOrderInfo={setOrderInfo}
              user={user}
              onUploadPositionImage={handleEmbroideryImageUpload}
              isUploadingImage={isUploadingPositionImage}
            />
            <PaymentSection
              draftImages={draftImages}
              setDraftImages={setDraftImages}
              onUploadDraft={handleDraftImageUpload}
              uploadingDraft={uploadingDraft}
              totals={totals}
              paidAmount={paidAmount}
              setPaidAmount={setPaidAmount}
              setHasManualDeposit={setHasManualDeposit}
              depositSlipUrl={depositSlipUrl}
              onUploadSlip={handleUploadSlip}
              isUploadingSlip={isUploadingSlip}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </div>

          {/* Sidebar Area: 4 Columns */}
          <div className="lg:col-span-4 space-y-6">
            <SummarySection totals={totals} loading={loading} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrder;
