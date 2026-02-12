import { useState, useRef } from "react";
import axios from "axios";
import {
  HiOutlineCloudArrowUp,
  HiOutlineXMark,
  HiOutlineCurrencyDollar,
  HiOutlineTruck,
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
      <div className="bg-white w-[98%] max-w-4xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <HiOutlineCurrencyDollar className="w-8 h-8 text-emerald-500" />
            บันทึกการชำระเงิน
          </h2>
          <button
            onClick={onClose}
            className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            <HiOutlineXMark className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-10"
        >
          {/* Left Column: Financials */}
          <div className="space-y-6">
            {/* Payment Method Toggle */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                ช่องทางการชำระ (Payment Method)
              </label>
              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("TRANSFER")}
                  className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
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
                  className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${
                    paymentMethod === "COD"
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-400"
                  }`}
                >
                  เก็บเงินปลายทาง (COD)
                </button>
              </div>
            </div>

            {/* Balance Info */}
            <div
              className={`p-6 rounded-3xl border-2 transition-all ${
                paymentMethod === "TRANSFER"
                  ? "bg-emerald-50 border-emerald-100"
                  : "bg-orange-50 border-orange-100"
              }`}
            >
              <div className="flex justify-between items-center text-sm mb-1">
                <span
                  className={`font-black uppercase tracking-tight ${
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
                    className={`block font-black text-3xl ${
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
                        className="text-xs text-emerald-600 font-black underline hover:text-emerald-700 mt-1"
                      >
                        จ่ายตามยอดค้างทั้งหมด
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <div className="flex justify-between items-end mb-3 ml-1">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">
                  {paymentMethod === "TRANSFER"
                    ? "ยอดโอน (บาท)"
                    : "ยืนยันยอดเก็บจริง (บาท)"}
                </label>
                {Number(amount) > Number(order.balanceDue) && (
                  <span className="text-xs text-rose-500 font-black animate-bounce">
                    ⚠️ เกินยอดค้าง!
                  </span>
                )}
              </div>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full px-6 py-5 bg-slate-50 border-2 rounded-[1.5rem] font-black text-2xl text-slate-800 outline-none transition-all ${
                  Number(amount) > Number(order.balanceDue)
                    ? "border-rose-300 focus:ring-4 focus:ring-rose-50 text-rose-600"
                    : "border-slate-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
                }`}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Right Column: Evidence & Submission */}
          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Slip Upload - Only for Transfer */}
              {paymentMethod === "TRANSFER" ? (
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                    หลักฐานการโอน (Slip)
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
                  >
                    {preview ? (
                      <>
                        <img
                          src={preview}
                          alt="Slip Preview"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white font-black text-sm">
                            คลิกเพื่อเปลี่ยนรูป
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <HiOutlineCloudArrowUp className="w-12 h-12 text-slate-300 mb-2" />
                        <p className="text-sm font-black text-slate-400">
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
              ) : (
                <div className="aspect-[4/3] bg-orange-50 p-8 rounded-3xl border-2 border-orange-100 flex flex-col items-center justify-center space-y-4">
                  <div className="p-4 bg-orange-100 rounded-full">
                    <HiOutlineTruck className="w-12 h-12 text-orange-600" />
                  </div>
                  <p className="text-sm font-bold text-orange-700 leading-relaxed text-center max-w-[280px]">
                    เมื่อจัดส่งสินค้าแบบ COD
                    พนักงานจัดส่งจะได้รับยอดเงินเมื่อส่งมอบสินค้าสำเร็จ
                    <br />
                    <span className="font-black text-orange-800">
                      กรุณายืนยันยอดที่จะเรียกเก็บจากลูกค้าในช่องซ้ายมือ
                    </span>
                  </p>
                </div>
              )}

              {/* Note Input */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">
                  หมายเหตุ (ถ้ามี)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 h-24 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none resize-none"
                  placeholder={
                    paymentMethod === "TRANSFER"
                      ? "เช่น โอนมัดจำรอบแรก..."
                      : "ระบุสาเหตุที่เปลี่ยนเป็น COD..."
                  }
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              {Number(order.balanceDue) <= 0 ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-5 text-lg text-white bg-emerald-500 rounded-3xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95"
                >
                  ปิดหน้าต่าง (ชำระครบแล้ว)
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !amount ||
                    Number(amount) > Number(order.balanceDue) ||
                    (paymentMethod === "TRANSFER" && !file)
                  }
                  className={`w-full py-5 text-lg text-white rounded-3xl font-black shadow-xl transition-all disabled:opacity-50 disabled:shadow-none active:scale-95 ${
                    paymentMethod === "TRANSFER"
                      ? "bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600"
                      : "bg-orange-500 shadow-orange-200 hover:bg-orange-600"
                  }`}
                >
                  {isSubmitting
                    ? "กำลังบันทึก..."
                    : paymentMethod === "TRANSFER"
                      ? "ยืนยันการชำระเงิน"
                      : "ยืนยันเก็บเงินปลายทาง"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
