import React from "react";
import { HiOutlineExclamationTriangle, HiOutlineXMark } from "react-icons/hi2";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "ยืนยัน (Confirm)",
  cancelLabel = "ยกเลิก (Cancel)",
  isDangerous = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isDangerous
                  ? "bg-rose-100 text-rose-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              <HiOutlineExclamationTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">{title}</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                กรุณาตรวจสอบข้อมูลก่อนยืนยัน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
          >
            <HiOutlineXMark className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="mb-8">
          <p className="text-slate-600 text-sm font-medium leading-relaxed">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onClose}
            className="py-3 px-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-3 px-4 text-white rounded-xl font-bold shadow-lg transition-all ${
              isDangerous
                ? "bg-rose-500 shadow-rose-200 hover:bg-rose-600"
                : "bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
