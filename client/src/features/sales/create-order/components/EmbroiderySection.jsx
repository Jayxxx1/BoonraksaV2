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
  masterPositions = [],
  blocks,
  fetchCustomerBlocks,
  orderInfo,
  setOrderInfo,
  onUploadPositionImage,
  isUploadingImage,
}) => {
  const commonPhrases = ["การไฟฟ้า", "PEA", "MEA", "กระทรวงเกษตร", "กรมปกครอง"];

  const handlePaste = (e, index) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          // Default to uploading as 'logo' for convenience
          onUploadPositionImage(index, "logo", file);
        }
      }
    }
  };
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
              onPaste={(e) => handlePaste(e, index)}
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
                    value={
                      item.masterPositionId ||
                      masterPositions.find((m) => m.name === item.position)
                        ?.id ||
                      (item.position &&
                      !masterPositions.some((m) => m.name === item.position)
                        ? "CUSTOM"
                        : "")
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      const n = [...embroidery];
                      if (val === "CUSTOM") {
                        n[index].masterPositionId = null;
                        n[index].position = "";
                      } else {
                        const master = masterPositions.find(
                          (m) => String(m.id) === val,
                        );
                        if (master) {
                          n[index].masterPositionId = master.id;
                          n[index].position = master.name;
                          n[index].customPosition = "";
                        }
                      }
                      setEmbroidery(n);
                    }}
                    className="text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                  >
                    <option value="" disabled>
                      -- เลือกตำแหน่ง --
                    </option>
                    {masterPositions.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id}. {m.name}
                      </option>
                    ))}
                    <option value="CUSTOM">✏️ กำหนดเอง / อื่นๆ</option>
                  </select>
                  {/* Custom input logic if not a standard position */}
                  {!item.masterPositionId &&
                    (item.position === "" ||
                      !masterPositions.some(
                        (m) => m.name === item.position,
                      )) && (
                      <input
                        value={item.position || ""}
                        onChange={(e) => {
                          const n = [...embroidery];
                          n[index].position = e.target.value;
                          n[index].masterPositionId = null;
                          setEmbroidery(n);
                        }}
                        className="text-xs border-b border-slate-200 py-0.5 px-1 focus:outline-none bg-amber-50 rounded"
                        placeholder="ระบุตำแหน่ง..."
                      />
                    )}
                </div>
              </div>

              <div className="space-y-3">
                {/* Block Logic, Details, and Uploads - Hidden if Free Option is selected */}
                {!item.isFreeOption && (
                  <>
                    <div className="space-y-3">
                      {/* Block Logic */}
                      {orderInfo.blockType === "บล็อคใหม่" ? (
                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                          <div className="text-[10px] text-slate-500">
                            ระบุรายละเอียดหรืออัปโหลดไฟล์โลโก้
                            (ในส่วนแนบไฟล์ด้านล่าง) สำหรับบล็อคใหม่ (รองรับ
                            Ctrl+V)
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
                              // Find and save block name for display parity
                              const selectedBlock = blocks.find(
                                (b) => b.id === v,
                              );
                              if (selectedBlock)
                                n[index].blockName = selectedBlock.name;
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
                              ></button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            หมายเหตุ
                          </label>
                          <div className="flex gap-2">
                            <input
                              value={item.textToEmb}
                              onChange={(e) => {
                                const n = [...embroidery];
                                n[index].textToEmb = e.target.value;
                                setEmbroidery(n);
                              }}
                              className="erp-input text-xs py-1.5 w-full bg-indigo-50 border-indigo-100 font-bold"
                              placeholder="พิมพ์ข้อความที่ต้องการปักที่นี่..."
                            />
                          </div>
                          {/* Common Phrases */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {commonPhrases.map((phrase) => (
                              <button
                                key={phrase}
                                type="button"
                                onClick={() => {
                                  const n = [...embroidery];
                                  n[index].textToEmb = phrase;
                                  setEmbroidery(n);
                                }}
                                className="text-[9px] px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 rounded border border-slate-200 transition-colors"
                              >
                                +{phrase}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Image Uploads for Position */}
                      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-slate-50">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                            ไฟล์โลโก้ (Paste Logo Here)
                          </label>
                          <div className="flex items-center gap-3">
                            {item.logoUrl ? (
                              <div className="relative w-16 h-16 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 group">
                                <img
                                  src={item.logoUrl}
                                  className="w-full h-full object-contain"
                                  alt="Logo"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const n = [...embroidery];
                                    n[index].logoUrl = "";
                                    setEmbroidery(n);
                                  }}
                                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity"
                                >
                                  ลบ
                                </button>
                              </div>
                            ) : (
                              <label className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all">
                                <HiOutlinePlus className="w-4 h-4 text-slate-400" />
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/*"
                                  onChange={(e) =>
                                    onUploadPositionImage(
                                      index,
                                      "logo",
                                      e.target.files[0],
                                    )
                                  }
                                  disabled={
                                    isUploadingImage === `${index}-logo`
                                  }
                                />
                              </label>
                            )}
                            <div className="text-[9px] text-slate-400 leading-tight">
                              {isUploadingImage === `${index}-logo`
                                ? "กำลังอัปโหลด..."
                                : "โลโก้ (Logo)\nรองรับ Ctrl+V"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                  {!item.isFreeOption && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 min-w-12 uppercase text-right">
                        ขนาด (cm):
                      </span>
                      <input
                        value={item.width}
                        onChange={(e) => {
                          const n = [...embroidery];
                          n[index].width = e.target.value;
                          setEmbroidery(n);
                        }}
                        className="erp-input text-xs py-1.5 text-center w-full"
                        placeholder="กว้าง (W)"
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
                        placeholder="สูง (H)"
                      />
                    </div>
                  )}
                </div> */}

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
                      ปักฟรี
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
