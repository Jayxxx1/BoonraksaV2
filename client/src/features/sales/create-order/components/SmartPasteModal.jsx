import React from "react";
import {
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

const SmartPasteModal = ({
  isOpen,
  onClose,
  activeColor,
  rawSpecText,
  setRawSpecText,
  autoFixEnabled,
  setAutoFixEnabled,
  handleParseSpec,
  parsedResults,
  confirmSpec,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-erp-in">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
              <HiOutlineDocumentText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 leading-none">
                เครื่องมือดึงสเปคจากแชท
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                ดึงข้อมูลสำหรับสี:{" "}
                <span className="text-indigo-600">{activeColor}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-rose-500 rounded-lg transition-all"
          >
            <HiOutlineTrash className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="erp-label">วางข้อความจากแชท (LINE/FB/Text)</label>
            <textarea
              value={rawSpecText}
              onChange={(e) => setRawSpecText(e.target.value)}
              placeholder="เช่น M80 XL 20 XL 10..."
              className="w-full h-80 p-5 erp-input font-mono text-sm leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoFixEnabled}
                  onChange={(e) => setAutoFixEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500"
                />
                <span className="text-[11px] font-bold text-slate-500">
                  ปรับจำนวนตามสต็อกอัตโนมัติ
                </span>
              </label>
              <button
                onClick={handleParseSpec}
                className="erp-button erp-button-primary py-2.5 px-6 text-sm"
              >
                ประมวลผลสเปค
              </button>
            </div>
          </div>
          <div className="space-y-4">
            <label className="erp-label">ผลลัพธ์การดึงข้อมูล</label>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden min-h-[300px]">
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-slate-500 font-bold uppercase tracking-widest border-b border-slate-200">
                      <td className="px-4 py-3">ไซส์ (Size)</td>
                      <td className="px-4 py-3 text-center">จำนวน (Qty)</td>
                      <td className="px-4 py-3 text-center">สถานะ</td>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedResults.length > 0 ? (
                      parsedResults.map((r, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-4 py-3 font-black text-slate-800">
                            {r.size}
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-indigo-600">
                            {r.adjusted}{" "}
                            <span className="text-[9px] text-slate-400">
                              /{r.requested}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {r.status === "success"
                              ? "✅"
                              : r.status === "warning"
                                ? "⚠️"
                                : "❌"}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-4 py-20 text-center text-slate-300 font-bold italic"
                        >
                          วางข้อความแล้วคลิก "ประมวลผลสเปค"
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {parsedResults.length > 0 && (
              <button
                onClick={confirmSpec}
                className="erp-button w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <HiOutlineCheckCircle className="w-5 h-5" /> ยืนยันลงตาราง
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartPasteModal;
