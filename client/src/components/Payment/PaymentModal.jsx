import { useState, useRef } from "react";
import axios from "axios";
import {
  HiOutlineCloudArrowUp,
  HiOutlineXMark,
  HiOutlineCurrencyDollar,
} from "react-icons/hi2";
import { useAuth } from "../../context/auth-store";

export default function PaymentModal({ order, onClose, onSuccess }) {
  const { token } = useAuth();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER"); // "TRANSFER" or "COD"
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Transfer needs slip, COD doesn't
    if (paymentMethod === "TRANSFER" && (!amount || !file)) {
      alert("กรุณาระบุยอดเงินและอัปโหลดสลิป");
      return;
    }
    if (paymentMethod === "COD" && !amount) {
      alert("กรุณาระบุยอดเงินที่เรียกเก็บปลายทาง");
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload image first (mocking cloudinary/upload API if needed,
      // but here we might need a direct upload endpoint or use existing upload logic)
      // Assuming we use the existing /api/upload endpoint

      let slipUrl = "";

      if (paymentMethod === "TRANSFER") {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await axios.post(
          "http://localhost:8000/api/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          },
        );
        slipUrl = uploadRes.data.data.url;
      }

      // Create payment record
      await axios.post(
        `http://localhost:8000/api/orders/${order.id}/payment`,
        {
          amount: parseFloat(amount),
          slipUrl,
          note,
          paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการบันทึกการชำระเงิน",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <HiOutlineCurrencyDollar className="w-6 h-6 text-emerald-500" />
            บันทึกการชำระเงิน
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Payment Method Toggle */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("TRANSFER")}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                paymentMethod === "TRANSFER"
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-slate-400"
              }`}
            >
              โอนเงิน (Transfer)
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("COD")}
              className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all ${
                paymentMethod === "COD"
                  ? "bg-orange-500 text-white shadow-sm"
                  : "text-slate-400"
              }`}
            >
              เก็บเงินปลายทาง (COD)
            </button>
          </div>

          {/* Balance Info */}
          <div
            className={`p-4 rounded-2xl border transition-all ${
              paymentMethod === "TRANSFER"
                ? "bg-emerald-50 border-emerald-100"
                : "bg-orange-50 border-orange-100"
            }`}
          >
            <div className="flex justify-between items-center text-sm mb-1">
              <span
                className={`font-bold ${
                  paymentMethod === "TRANSFER"
                    ? "text-emerald-600"
                    : "text-orange-600"
                }`}
              >
                {paymentMethod === "TRANSFER"
                  ? "ยอดคงเหลือที่ต้องชำระ"
                  : "ยอดที่ต้องเก็บปลายทาง"}
              </span>
              <div className="text-right">
                <span
                  className={`block font-black text-lg ${
                    paymentMethod === "TRANSFER"
                      ? "text-emerald-800"
                      : "text-orange-800"
                  }`}
                >
                  {(Number(order.balanceDue) || 0).toLocaleString()} ฿
                </span>
                {paymentMethod === "TRANSFER" &&
                  Number(order.balanceDue) > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(order.balanceDue.toString())}
                      className="text-[10px] text-emerald-600 font-bold underline hover:text-emerald-700"
                    >
                      จ่ายตามยอดค้างทั้งหมด
                    </button>
                  )}
              </div>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-end mb-2 ml-1">
              <label className="block text-xs font-bold text-slate-400 uppercase">
                {paymentMethod === "TRANSFER"
                  ? "ยอดโอน (บาท)"
                  : "ยืนยันยอดเก็บจริง (บาท)"}
              </label>
              {paymentMethod === "TRANSFER" &&
                amount > Number(order.balanceDue) && (
                  <span className="text-[10px] text-rose-500 font-bold animate-bounce">
                    ⚠️ เกินยอดค้าง!
                  </span>
                )}
            </div>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={`w-full px-4 py-3 bg-slate-50 border rounded-xl font-bold text-slate-800 outline-none transition-all ${
                paymentMethod === "TRANSFER" &&
                amount > Number(order.balanceDue)
                  ? "border-rose-300 focus:ring-2 focus:ring-rose-100 text-rose-600"
                  : "border-slate-200 focus:ring-2 focus:ring-indigo-200"
              }`}
              placeholder="0.00"
              required
            />
          </div>

          {/* Slip Upload - Only for Transfer */}
          {paymentMethod === "TRANSFER" && (
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
                หลักฐานการโอน (Slip)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Slip Preview"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white font-bold text-xs">
                        คลิกเพื่อเปลี่ยนรูป
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <HiOutlineCloudArrowUp className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-xs font-bold text-slate-400">
                      คลิกเพื่ออัปโหลดสลิป
                    </p>
                  </>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                  required
                />
              </div>
            </div>
          )}

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 h-24 focus:ring-2 focus:ring-indigo-200 outline-none resize-none"
              placeholder={
                paymentMethod === "TRANSFER"
                  ? "เช่น โอนมัดจำรอบแรก..."
                  : "ระบุสาเหตุที่เปลี่ยนเป็น COD..."
              }
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isSubmitting ||
              !amount ||
              (paymentMethod === "TRANSFER" &&
                (!file ||
                  amount > Number(order.balanceDue) ||
                  Number(order.balanceDue) <= 0))
            }
            className={`w-full py-4 text-white rounded-2xl font-black shadow-lg transition-all disabled:opacity-50 disabled:shadow-none ${
              paymentMethod === "TRANSFER"
                ? "bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600"
                : "bg-orange-500 shadow-orange-200 hover:bg-orange-600"
            }`}
          >
            {isSubmitting
              ? "กำลังบันทึก..."
              : paymentMethod === "TRANSFER"
                ? Number(order.balanceDue) <= 0
                  ? "จ่ายครบแล้ว"
                  : "ยืนยันการชำระเงิน"
                : "ยืนยันเก็บเงินปลายทาง"}
          </button>
        </form>
      </div>
    </div>
  );
}
