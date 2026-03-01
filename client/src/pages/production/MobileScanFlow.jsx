import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/config";
import {
  HiOutlineCamera,
  HiOutlineQrCode,
  HiOutlineArrowPath,
  HiOutlineArrowRightCircle,
  HiOutlineXCircle,
  HiOutlineClipboardDocumentList,
  HiOutlineClock,
} from "react-icons/hi2";

const TARGET_ROLE_OPTIONS = [
  { value: "GRAPHIC", label: "Graphic" },
  { value: "DIGITIZER", label: "Digitizer" },
  { value: "PRODUCTION", label: "Production" },
  { value: "STOCK", label: "Stock" },
];

export default function MobileScanFlow() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const loopTimerRef = useRef(null);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [order, setOrder] = useState(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [rejectRole, setRejectRole] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  const stopCamera = useCallback(() => {
    if (loopTimerRef.current) {
      clearTimeout(loopTimerRef.current);
      loopTimerRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const resolveOrder = useCallback(async (rawValue) => {
    const value = String(rawValue || "").trim();
    if (!value) return;
    setLoading(true);
    setOrder(null);
    try {
      const urlMatch = value.match(/\/order\/(\d+)/i);
      if (urlMatch?.[1]) {
        const byId = await api.get(`/orders/${urlMatch[1]}`);
        setOrder(byId.data?.data?.order || null);
        return;
      }
      try {
        const byJob = await api.get(
          `/orders/search/${encodeURIComponent(value)}`,
        );
        setOrder(byJob.data?.data?.order || null);
        return;
      } catch {
        if (/^\d+$/.test(value)) {
          const byId = await api.get(`/orders/${value}`);
          setOrder(byId.data?.data?.order || null);
          return;
        }
        throw new Error("Order not found");
      }
    } catch (error) {
      alert(
        error.response?.data?.message || error.message || "Order not found",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const detectLoop = useCallback(async () => {
    if (!cameraOn || !videoRef.current || !detectorRef.current) return;
    try {
      const barcodes = await detectorRef.current.detect(videoRef.current);
      if (barcodes?.length) {
        const value = barcodes[0]?.rawValue || "";
        if (value) {
          setInput(value);
          stopCamera();
          await resolveOrder(value);
          return;
        }
      }
    } catch {}
    loopTimerRef.current = setTimeout(detectLoop, 350);
  }, [cameraOn, resolveOrder, stopCamera]);

  const startCamera = useCallback(async () => {
    if (!("BarcodeDetector" in window)) {
      alert("This browser does not support camera barcode scanning.");
      return;
    }
    try {
      if (!detectorRef.current)
        detectorRef.current = new window.BarcodeDetector({
          formats: ["qr_code", "code_128", "code_39", "ean_13"],
        });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (error) {
      alert("Cannot start camera scanning.");
      console.error(error);
    }
  }, []);

  useEffect(() => {
    if (cameraOn) detectLoop();
    return () => {
      if (loopTimerRef.current) {
        clearTimeout(loopTimerRef.current);
        loopTimerRef.current = null;
      }
    };
  }, [cameraOn, detectLoop]);

  const refreshOrder = useCallback(async () => {
    if (!order?.id) return;
    const res = await api.get(`/orders/${order.id}`);
    setOrder(res.data?.data?.order || null);
  }, [order?.id]);

  const doNextAction = async (kind) => {
    if (!order?.id) return;
    setLoading(true);
    try {
      if (kind === "stock")
        await api.patch(`/orders/${order.id}/stock-recheck`);
      if (kind === "finish")
        await api.patch(`/orders/${order.id}/production-finish`);
      if (kind === "qc-pass") await api.patch(`/orders/${order.id}/qc-pass`);
      if (kind === "receive")
        await api.patch(`/orders/${order.id}/ready-to-ship`);
      if (kind === "ship") {
        if (!trackingNo.trim()) {
          alert("Tracking number is required.");
          setLoading(false);
          return;
        }
        await api.patch(`/orders/${order.id}/complete`, {
          trackingNo: trackingNo.trim(),
        });
      }
      await refreshOrder();
    } catch (error) {
      alert(error.response?.data?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const doReject = async () => {
    if (!order?.id) return;
    if (!rejectRole) {
      alert("Please select target department.");
      return;
    }
    if (!rejectReason.trim()) {
      alert("Please provide reject reason.");
      return;
    }
    setLoading(true);
    try {
      await api.patch(`/orders/${order.id}/reject`, {
        targetRole: rejectRole,
        reason: rejectReason.trim(),
      });
      setRejectReason("");
      await refreshOrder();
    } catch (error) {
      alert(error.response?.data?.message || "Reject failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-4">
      <div className="max-w-2xl mx-auto space-y-3 animate-erp-in">
        <header className="erp-section !p-4">
          <h1 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <HiOutlineQrCode className="w-5 h-5 text-indigo-600" />
            Mobile Scan Flow
          </h1>
          <p className="text-[11px] text-slate-500 mt-0.5 font-bold">
            Scan QR / barcode, then move job to next department or reject with
            reason.
          </p>
        </header>

        <section className="erp-section !p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={startCamera}
              className="erp-button px-3 py-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm text-[12px]"
            >
              <HiOutlineCamera className="w-4 h-4" /> Start Camera
            </button>
            <button
              onClick={stopCamera}
              className="erp-button px-3 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-[12px]"
            >
              Stop
            </button>
          </div>
          <video
            ref={videoRef}
            className={`w-full rounded-md border ${cameraOn ? "border-indigo-300" : "border-slate-200 bg-slate-100"}`}
            muted
            playsInline
          />
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-slate-200 font-bold text-[12px]"
              placeholder="Paste JOB ID / QR value here"
            />
            <button
              onClick={() => resolveOrder(input)}
              disabled={loading}
              className="erp-button px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 text-[12px]"
            >
              Find
            </button>
          </div>
        </section>

        {order && (
          <section className="erp-section !p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase">
                  Order
                </p>
                <p className="text-xl font-black text-slate-900">
                  {order.jobId}
                </p>
                <p className="text-[12px] font-bold text-slate-700">
                  {order.customerName}
                </p>
                <p className="text-[10px] font-bold text-indigo-600 mt-1">
                  Status: {order.displayStatusLabel || order.status}
                </p>
              </div>
              <button
                onClick={() => navigate(`/order/${order.id}`)}
                className="erp-action-btn"
              >
                Open Detail
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {order.actionMap?.canConfirmStock && (
                <ActionButton
                  label="Confirm Stock"
                  icon={HiOutlineArrowRightCircle}
                  onClick={() => doNextAction("stock")}
                  loading={loading}
                />
              )}
              {order.actionMap?.canFinishProduction && (
                <ActionButton
                  label="Finish Production"
                  icon={HiOutlineArrowRightCircle}
                  onClick={() => doNextAction("finish")}
                  loading={loading}
                />
              )}
              {order.actionMap?.canPassQC && (
                <ActionButton
                  label="QC Pass"
                  icon={HiOutlineArrowRightCircle}
                  onClick={() => doNextAction("qc-pass")}
                  loading={loading}
                />
              )}
              {order.actionMap?.canReceiveForShip && (
                <ActionButton
                  label="Receive For Ship"
                  icon={HiOutlineArrowRightCircle}
                  onClick={() => doNextAction("receive")}
                  loading={loading}
                />
              )}
            </div>

            {order.actionMap?.canShip && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">
                  Complete Shipment
                </p>
                <div className="flex gap-2">
                  <input
                    value={trackingNo}
                    onChange={(e) => setTrackingNo(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-md border border-emerald-200 bg-white text-[12px] font-bold"
                    placeholder="Tracking No."
                  />
                  <button
                    onClick={() => doNextAction("ship")}
                    className="erp-button px-3 py-2 bg-emerald-600 text-white text-[12px]"
                    disabled={loading}
                  >
                    Ship
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 space-y-2">
              <p className="text-[10px] font-black text-rose-700 uppercase tracking-wider">
                Reject Flow
              </p>
              <select
                value={rejectRole}
                onChange={(e) => setRejectRole(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-rose-200 bg-white text-[12px] font-bold"
              >
                <option value="">Select target department</option>
                {TARGET_ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-rose-200 bg-white text-[12px] font-bold min-h-[80px]"
                placeholder="Reject reason"
              />
              <button
                onClick={doReject}
                className="w-full px-3 py-2 rounded-md bg-rose-600 text-white font-black text-[12px] flex items-center justify-center gap-2"
                disabled={loading}
              >
                <HiOutlineXCircle className="w-4 h-4" /> Reject
              </button>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" />{" "}
                  Timeline
                </p>
                <button
                  onClick={refreshOrder}
                  className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                >
                  <HiOutlineArrowPath className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
              <div className="space-y-1.5">
                {(order.logs || []).slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="bg-white border border-slate-200 rounded-md p-2"
                  >
                    <p className="text-[11px] font-black text-slate-800">
                      {log.action}
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold">
                      {log.user?.name || "System"}
                    </p>
                    <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                      <HiOutlineClock className="w-3 h-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="erp-button px-3 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 text-[12px] font-black flex items-center justify-center gap-2 disabled:opacity-60 w-full"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
