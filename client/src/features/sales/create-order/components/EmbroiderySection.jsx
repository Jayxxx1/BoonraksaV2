import React from "react";
import {
  HiOutlineScissors,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import SearchableSelect from "../../../../components/SearchableSelect";

const EmbroiderySection = ({
  embroidery,
  setEmbroidery,
  addEmbroidery,
  removeEmbroidery,
  embroideryPositions,
  blocks,
  fetchCustomerBlocks,
  orderInfo,
  setOrderInfo,
  user,
}) => {
  return (
    <div className="erp-card shadow-sm">
      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineScissors className="w-5 h-5 text-indigo-600" />
          <h3 className="font-bold text-slate-800 text-sm">
            รายละเอียดงานปัก / งานสกรีน
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              ประเภทบล็อค (Block Type)
            </span>
            <select
              value={orderInfo.blockType}
              onChange={(e) =>
                setOrderInfo({
                  ...orderInfo,
                  blockType: e.target.value,
                })
              }
              className="erp-input py-1 px-2 text-[11px] font-bold bg-amber-50 border-amber-200 text-amber-900"
            >
              <option value="บล็อคเดิม">บล็อคเดิม (Old)</option>
              <option value="บล็อคเดิมเปลี่ยนข้อความ">
                บล็อคเดิมเปลี่ยนชื่อ (Edit)
              </option>
              <option value="บล็อคใหม่">บล็อคใหม่ (+250฿)</option>
            </select>
          </div>
          <button
            type="button"
            onClick={addEmbroidery}
            className="erp-button erp-button-secondary py-1.5 text-xs"
          >
            <HiOutlinePlus className="w-4 h-4 mr-1" /> เพิ่มตำแหน่ง
          </button>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {embroidery.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-xs font-bold text-slate-400">
              ยังไม่มีการเพิ่มตำแหน่งงานปัก
            </p>
          </div>
        ) : (
          embroidery.map((item, index) => (
            <div
              key={index}
              className="bg-white border border-slate-200 rounded-xl p-4 relative group"
            >
              <button
                type="button"
                onClick={() => removeEmbroidery(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <HiOutlineTrash className="w-3.5 h-3.5" />
              </button>

              {/* Header: Position */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    ตำแหน่ง:
                  </span>
                  <select
                    value={item.position}
                    onChange={(e) => {
                      const n = [...embroidery];
                      n[index].position = e.target.value;
                      setEmbroidery(n);
                    }}
                    className="text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    {embroideryPositions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  {item.position === "อื่นๆ" && (
                    <input
                      value={item.customPosition}
                      onChange={(e) => {
                        const n = [...embroidery];
                        n[index].customPosition = e.target.value;
                        setEmbroidery(n);
                      }}
                      className="text-xs border-b border-slate-200 py-0.5 px-1 focus:outline-none"
                      placeholder="ระบุ..."
                    />
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {/* Block Logic */}
                {orderInfo.blockType === "บล็อคใหม่" ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                    <div className="text-[10px] text-slate-500">
                      ระบุรายละเอียดหรืออัปโหลดไฟล์โลโก้ (ในส่วนแนบไฟล์ด้านล่าง)
                      สำหรับบล็อคใหม่
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <SearchableSelect
                      options={blocks}
                      value={item.blockId}
                      onChange={(v) => {
                        const n = [...embroidery];
                        n[index].blockId = v;
                        setEmbroidery(n);
                      }}
                      placeholder={
                        orderInfo.blockType === "บล็อคเดิมเปลี่ยนข้อความ"
                          ? "ค้นหาบล็อคเดิมที่ต้องการแก้..."
                          : "ค้นหาบล็อคเดิม..."
                      }
                      displayKey="name"
                      valueKey="id"
                      imageKey="imageUrl"
                      className="!py-1.5"
                    />
                    <div className="flex justify-between items-start">
                      {orderInfo.blockType?.includes("บล็อคเดิม") && (
                        <button
                          type="button"
                          onClick={() => fetchCustomerBlocks()}
                          className="text-[10px] text-indigo-600 underline mt-1"
                        >
                          ดึงประวัติบล็อคเก่า (จากเบอร์/ชื่อ)
                        </button>
                      )}
                      {orderInfo.blockType === "บล็อคเดิม" && (
                        <button
                          type="button"
                          onClick={() => {
                            const n = [...embroidery];
                            n[index].isChangePosition =
                              !n[index].isChangePosition;
                            setEmbroidery(n);
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded border ${
                            item.isChangePosition
                              ? "bg-slate-800 text-white border-slate-800"
                              : "bg-white text-slate-500 border-slate-200"
                          }`}
                        >
                          เปลี่ยนตำแหน่ง
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <input
                      value={item.note}
                      onChange={(e) => {
                        const n = [...embroidery];
                        n[index].note = e.target.value;
                        setEmbroidery(n);
                      }}
                      className="erp-input text-xs py-1.5 w-full"
                      placeholder="หมายเหตุเพิ่มเติม... (สีด้าย, รายละเอียด)"
                    />
                  </div>

                  {/* Size - Hidden for Sales */}
                  {user?.role !== "SALES" && !item.isFreeOption && (
                    <div className="flex items-center gap-2">
                      <input
                        value={item.width}
                        onChange={(e) => {
                          const n = [...embroidery];
                          n[index].width = e.target.value;
                          setEmbroidery(n);
                        }}
                        className="erp-input text-xs py-1.5 text-center w-full"
                        placeholder="W (cm)"
                      />
                      <span className="text-slate-300">x</span>
                      <input
                        value={item.height}
                        onChange={(e) => {
                          const n = [...embroidery];
                          n[index].height = e.target.value;
                          setEmbroidery(n);
                        }}
                        className="erp-input text-xs py-1.5 text-center w-full"
                        placeholder="H (cm)"
                      />
                    </div>
                  )}
                </div>

                {/* Free Option Toggle */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={item.isFreeOption}
                      onChange={(e) => {
                        const n = [...embroidery];
                        n[index].isFreeOption = e.target.checked;
                        setEmbroidery(n);
                      }}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      ตัวเลือกฟรี (Free Option)
                    </span>
                  </label>
                  {item.isFreeOption && (
                    <select
                      value={item.freeOptionName}
                      onChange={(e) => {
                        const n = [...embroidery];
                        n[index].freeOptionName = e.target.value;
                        setEmbroidery(n);
                      }}
                      className="bg-slate-100 rounded-md border-0 text-[10px] font-bold px-2 py-0.5 text-slate-600"
                    >
                      <option value="เซฟตี้">เซฟตี้</option>
                      <option value="ธงชาติ">ธงชาติ</option>
                      <option value="โลโก้สาขา">โลโก้สาขา</option>
                      <option value="เครื่องหมายราชการ">
                        เครื่องหมายราชการ
                      </option>
                    </select>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmbroiderySection;
