import React from "react";
import { HiOutlineShoppingBag, HiOutlineDocumentText } from "react-icons/hi2";
import SearchableSelect from "../../../../components/SearchableSelect";

const ProductMatrixSection = ({
  products,
  selectedProductId,
  setSelectedProductId,
  customUnitPrice,
  setCustomUnitPrice,
  selectedProduct,
  colors,
  sizes,
  activeColor,
  setActiveColor,
  matrixData,
  handleMatrixChange,
  variantsMap,
  quickFillTotal,
  setQuickFillTotal,
  handleQuickFill,
  onOpenSpecModal,
}) => {
  const handleKeyDown = (e, vId, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = document.querySelector(
        `input[data-matrix-idx="${index + 1}"]`,
      );
      if (nextInput) nextInput.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleMatrixChange(vId, (matrixData[vId] || 0) + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleMatrixChange(vId, Math.max(0, (matrixData[vId] || 0) - 1));
    }
  };

  // Helper to check stock status
  const getStockStatus = (v) => {
    if (!v) return { qty: 0, isLow: false };
    const qty = matrixData[v.id] || 0;
    const isLow = v.stock < 5;
    return { qty, isLow };
  };

  return (
    <div className="erp-card shadow-sm">
      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineShoppingBag className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm">
            การเลือกสินค้า (Product Selection)
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              ปรับเปลี่ยนราคาต่อหน่วย
            </span>
            <input
              type="number"
              step="0.01"
              value={customUnitPrice}
              onChange={(e) => setCustomUnitPrice(e.target.value)}
              className="w-24 text-right erp-input py-1 px-2 text-xs font-bold bg-amber-50"
            />
          </div>
        </div>
      </div>
      <div className="p-5 space-y-6">
        <div className="relative z-[50]">
          <label className="erp-label mb-1.5 flex items-center gap-2">
            เลือกโมเดลสินค้า *
          </label>
          <SearchableSelect
            options={products}
            value={selectedProductId}
            onChange={(val) => setSelectedProductId(val)}
            placeholder="ค้นหาด้วยรหัสหรือชื่อ..."
            displayKey="name"
            valueKey="id"
            imageKey="imageUrl"
            searchKeys={["name", "codePrefix", "subtitle"]}
          />
        </div>

        {selectedProduct && colors.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-50">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {colors.map((color) => {
                  const active = activeColor === color;
                  // Check if any size in this color has quantity selected
                  const hasQty = sizes.some(
                    (s) => matrixData[variantsMap[`${color}-${s}`]?.id] > 0,
                  );
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setActiveColor(color)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border whitespace-nowrap ${
                        active
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                      } ${hasQty && !active ? "ring-2 ring-emerald-400/50" : ""}`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    value={quickFillTotal}
                    onChange={(e) => setQuickFillTotal(e.target.value)}
                    className="w-12 bg-transparent text-[10px] font-bold outline-none border-0 p-0"
                    placeholder="จำนวน"
                  />
                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="text-[10px] font-extrabold text-indigo-600 hover:text-indigo-800 uppercase"
                  >
                    เติมทั้งหมด
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onOpenSpecModal}
                  className="erp-button erp-button-secondary py-1.5 text-[10px] text-indigo-600 bg-indigo-50 border-indigo-100 flex items-center gap-1.5"
                >
                  <HiOutlineDocumentText className="w-3.5 h-3.5" />{" "}
                  ดึงสเปคจากแชท
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {sizes.map((size, idx) => {
                  const v = variantsMap[`${activeColor}-${size}`];
                  if (!v) return null;
                  const { qty, isLow } = getStockStatus(v);
                  return (
                    <div
                      key={size}
                      className={`erp-card p-3 flex flex-col items-center justify-center transition-all ${
                        qty > 0
                          ? "border-indigo-500 ring-1 ring-indigo-50 bg-white"
                          : "border-slate-100 opacity-80"
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-800">
                        {size}
                      </span>
                      <span
                        className={`text-[9px] font-bold ${
                          isLow ? "text-rose-500" : "text-slate-400"
                        }`}
                      >
                        Stock: {v.stock} (คงเหลือ)
                      </span>
                      <input
                        type="number"
                        min="0"
                        data-matrix-idx={idx}
                        value={matrixData[v.id] || ""}
                        onChange={(e) =>
                          handleMatrixChange(v.id, e.target.value)
                        }
                        onKeyDown={(e) => handleKeyDown(e, v.id, idx)}
                        className={`w-full mt-2 text-center text-sm font-black border-0 bg-transparent focus:ring-0 ${
                          qty > 0
                            ? "text-indigo-600"
                            : v.stock === 0
                              ? "text-amber-500"
                              : "text-slate-400"
                        }`}
                        placeholder={v.stock === 0 ? "Pre" : "-"}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductMatrixSection;
