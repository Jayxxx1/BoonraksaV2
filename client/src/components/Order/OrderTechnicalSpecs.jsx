import React from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCloudArrowUp,
  HiOutlinePhoto,
  HiOutlineCube,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2";

const OrderTechnicalSpecs = ({
  order,
  isAdmin,
  isUpdating,
  displayHeader,
  editSpecs,
  setEditSpecs,
  uploadingField,
  handleFileUpload,
  handleUpdateSpecs,
  isLibraryOpen,
  setIsLibraryOpen,
  searchBlock,
  setSearchBlock,
  blocks,
  handleLinkBlock,
  canViewTechnical,
  isGraphicRole,
  user,
}) => {
  const canEdit = order.actionMap?.canEditSpecs;
  const canUpload = order.actionMap?.canUploadArtwork;
  const isSales = user?.role === "SALES";
  const isSalesOrAdmin = isAdmin || isSales;

  if (!canViewTechnical) return null;

  // Role-based Embroidery Gating
  const canAddRemovePos = canEdit && isSalesOrAdmin;
  const canEditDesc = canEdit && isSalesOrAdmin;
  const canEditSize = canEdit && isGraphicRole;

  return (
    <div className="space-y-6">
      {/* 1. Visual Mockups Section (Separated as requested) */}
      <div className="erp-card bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlinePhoto className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800 text-sm">
              รูปภาพวางแบบให้ลูกค้า{" "}
            </h3>
          </div>
        </div>
        <div className="p-4">
          {order.draftImages && order.draftImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {order.draftImages.map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 bg-white relative group shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={img}
                    alt={`Mockup ${idx + 1}`}
                    className="w-full h-full object-cover cursor-zoom-in hover:scale-110 transition-transform duration-500"
                    onClick={() => window.open(img)}
                  />
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/40 backdrop-blur-md rounded-lg text-[8px] font-black text-white opacity-0 group-hover:opacity-100 transition-opacity">
                    #{idx + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-center">
              <HiOutlinePhoto className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">
                ไม่มีรูปม็อคอัพสำหรับออเดอร์นี้
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Embroidery Positions Section */}
      <div className="erp-card">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineAdjustmentsHorizontal className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">
              {displayHeader}
            </h3>
            <div className="ml-4 flex items-center gap-3">
              <span className="text-xs font-black text-slate-700 bg-slate-200/50 px-2 py-1 rounded-lg">
                ตำแหน่งปัก
              </span>
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">
                  ประเภทบล็อก:
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                    order.blockType === "NEW"
                      ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                      : order.blockType === "EDIT"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                  }`}
                >
                  {order.blockType === "NEW"
                    ? "3 (ใหม่)"
                    : order.blockType === "EDIT"
                      ? "2 (แก้)"
                      : "1 (เดิม)"}
                </span>
              </div>
            </div>
          </div>
          {canEdit && order.status !== "CANCELLED" ? (
            <button
              onClick={handleUpdateSpecs}
              className="erp-button erp-button-primary py-1.5 px-3 text-xs"
              disabled={isUpdating}
            >
              บันทึกอัตโนมัติ (Auto Saved)
            </button>
          ) : (
            isGraphicRole &&
            !isAdmin &&
            (order.status === "PENDING_ARTWORK" ||
              order.status === "DESIGNING") && (
              <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 uppercase tracking-tighter animate-pulse">
                กรุณากดรับงานด้านบนก่อนแก้ไขสเปค
              </span>
            )
          )}
        </div>

        <div className="p-4 bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {editSpecs.map((emb, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group relative"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      ตำแหน่งปักที่
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>
                    </span>
                  </div>
                  {canAddRemovePos && (
                    <button
                      onClick={() => {
                        const newSpecs = editSpecs.filter((_, i) => i !== idx);
                        setEditSpecs(newSpecs);
                      }}
                      className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                    >
                      <HiOutlineXMark className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {/* Position & Type Row */}
                  <div className="grid grid-cols-2 gap-2">
                    {(canEditDesc || emb.position) && (
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">
                          ตำแหน่ง (Position)
                        </label>
                        <input
                          type="text"
                          className="erp-input-compact text-xs py-1 h-8"
                          value={emb.position || ""}
                          readOnly={!canEditDesc}
                          onChange={(e) => {
                            const newSpecs = [...editSpecs];
                            newSpecs[idx].position = e.target.value;
                            setEditSpecs(newSpecs);
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Size Row (New for Graphic) - Compact Pro */}
                  {(canEditSize || emb.width || emb.height) && (
                    <div className="flex items-center gap-2 border-t border-slate-50 pt-2">
                      <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest shrink-0">
                        ขนาด (cm):
                      </label>
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="W"
                          title="ความกว้าง (Width)"
                          className={`w-full min-w-0 px-1.5 py-1 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${canEditSize ? "bg-indigo-50/30" : ""}`}
                          value={emb.width || ""}
                          readOnly={!canEditSize}
                          onChange={(e) => {
                            const newSpecs = [...editSpecs];
                            newSpecs[idx].width =
                              parseFloat(e.target.value) || 0;
                            setEditSpecs(newSpecs);
                          }}
                        />
                        <span className="text-slate-300 font-light">x</span>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="H"
                          title="ความสูง (Height)"
                          className={`w-full min-w-0 px-1.5 py-1 text-center font-bold text-xs bg-slate-50 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none ${canEditSize ? "bg-indigo-50/30" : ""}`}
                          value={emb.height || ""}
                          readOnly={!canEditSize}
                          onChange={(e) => {
                            const newSpecs = [...editSpecs];
                            newSpecs[idx].height =
                              parseFloat(e.target.value) || 0;
                            setEditSpecs(newSpecs);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Text Row */}
                  {(canEditDesc || emb.textToEmb) && (
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">
                        ข้อความ (Text)
                      </label>
                      <input
                        type="text"
                        className="erp-input-compact text-xs py-1 h-8"
                        placeholder="-"
                        value={emb.textToEmb || ""}
                        readOnly={!canEditDesc}
                        onChange={(e) => {
                          const newSpecs = [...editSpecs];
                          newSpecs[idx].textToEmb = e.target.value;
                          setEditSpecs(newSpecs);
                        }}
                      />
                    </div>
                  )}

                  {/* Images Row (Logo / Mockup) */}
                  {(emb.logoUrl || emb.mockupUrl) && (
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {emb.logoUrl && (
                        <div
                          className="space-y-1 group cursor-zoom-in"
                          onClick={() => window.open(emb.logoUrl)}
                        >
                          <label className="text-[9px] font-bold text-slate-400 uppercase">
                            ไฟล์โลโก้ (Logo)
                          </label>
                          <div className="aspect-square rounded-lg border border-slate-200 bg-white overflow-hidden relative">
                            <img
                              src={emb.logoUrl}
                              alt="Logo"
                              className="w-full h-full object-contain p-1"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all" />
                          </div>
                        </div>
                      )}
                      {emb.mockupUrl && (
                        <div
                          className="space-y-1 group cursor-zoom-in"
                          onClick={() => window.open(emb.mockupUrl)}
                        >
                          <label className="text-[9px] font-bold text-slate-400 uppercase">
                            ม็อคอัพจุดนี้ (Mockup)
                          </label>
                          <div className="aspect-square rounded-lg border border-slate-200 bg-white overflow-hidden relative">
                            <img
                              src={emb.mockupUrl}
                              alt="Mockup"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/10 transition-all" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(canEditDesc || emb.details || emb.note) && (
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase mb-0.5 block">
                        เพิ่มเติม (Note)
                      </label>
                      <textarea
                        className="erp-input-compact min-h-[40px] resize-none text-xs leading-snug"
                        value={emb.details || emb.note || ""}
                        readOnly={!canEditDesc}
                        onChange={(e) => {
                          const newSpecs = [...editSpecs];
                          newSpecs[idx].details = e.target.value;
                          setEditSpecs(newSpecs);
                        }}
                        placeholder="ระบุรายละเอียดเพิ่มเติม..."
                      />
                    </div>
                  )}

                  {/* Thread Color (New) */}
                  {(canEditDesc || emb.threadColor) && (
                    <div className="mt-2">
                      <label className="text-[9px] font-bold text-indigo-400 uppercase mb-0.5 block flex items-center gap-1">
                        🎨 สีด้าย (Thread Color)
                      </label>
                      <input
                        type="text"
                        className="erp-input-compact text-xs py-1 h-8 border-indigo-200 focus:border-indigo-500 focus:ring-indigo-200"
                        value={emb.threadColor || ""}
                        readOnly={!canEditDesc}
                        onChange={(e) => {
                          const newSpecs = [...editSpecs];
                          newSpecs[idx].threadColor = e.target.value;
                          setEditSpecs(newSpecs);
                        }}
                        placeholder="ระบุรหัสสี/ชื่อสี (Optional)"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {canAddRemovePos && (
              <button
                onClick={() =>
                  setEditSpecs([
                    ...editSpecs,
                    { position: "", type: "EMBROIDERY", size: "", details: "" },
                  ])
                }
                className="p-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center gap-2 group"
              >
                <div className="p-2 rounded-full bg-slate-100 group-hover:bg-indigo-100 transition-colors">
                  <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider">
                  เพิ่มตำแหน่งงานปัก/สกรีน
                </span>
              </button>
            )}
          </div>

          {/* Graphic Outputs Section (Final Artwork + Production File) */}
          {!isSales && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t border-slate-100 pt-6">
              {/* Artwork Upload (Final Artwork) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    รูปออกแบบสำเร็จ
                  </label>
                  {canUpload && order.blockType !== "NEW" && (
                    <button
                      onClick={() => setIsLibraryOpen(true)}
                      className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      <HiOutlineMagnifyingGlass className="w-3 h-3" />
                      เลือกจากคลังบล็อกเดิม
                    </button>
                  )}
                </div>
                {order.artworkUrl ? (
                  <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-[4/3] bg-white">
                    <img
                      src={order.artworkUrl}
                      alt="Artwork"
                      className="w-full h-full object-contain cursor-zoom-in"
                      onClick={() => window.open(order.artworkUrl)}
                    />
                    {canUpload && (
                      <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, "artwork")}
                          accept="image/*"
                        />
                        <div className="text-center text-white">
                          <HiOutlineCloudArrowUp className="w-8 h-8 mx-auto mb-1" />
                          <span className="text-[10px] font-black uppercase">
                            เปลี่ยนรูปใหม่
                          </span>
                        </div>
                      </label>
                    )}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-[4/3] rounded-2xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-slate-50 transition-all cursor-pointer group">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "artwork")}
                      accept="image/*"
                      disabled={!canUpload || uploadingField === "artwork"}
                    />
                    {uploadingField === "artwork" ? (
                      <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full" />
                    ) : (
                      <>
                        <HiOutlinePhoto className="w-10 h-10 text-slate-300 group-hover:text-indigo-400 mb-2" />
                        <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600">
                          คลิกเพื่ออัปโหลดแบบ (PNG/JPG)
                        </span>
                      </>
                    )}
                  </label>
                )}
              </div>

              {/* DST File Section (Production File) */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  ไฟล์สติ๊ก/ผลิต (Production File)
                </label>
                <div className="erp-card p-5 bg-slate-900 text-white min-h-[160px] flex flex-col justify-between">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      <HiOutlineCube className="w-6 h-6 text-indigo-400" />
                    </div>
                    {order.productionFileUrl && (
                      <a
                        href={order.productionFileUrl}
                        download
                        className="text-[10px] bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded-lg font-black transition-all"
                      >
                        DOWNLOAD .DST
                      </a>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                      Filename:
                    </p>
                    <p className="text-sm font-mono font-medium truncate text-indigo-300">
                      {order.productionFileName || "No file uploaded"}
                    </p>
                  </div>
                  {canUpload && (
                    <label className="mt-4 flex items-center justify-center gap-2 py-2 border border-dashed border-slate-700 rounded-xl hover:bg-slate-800 cursor-pointer transition-all">
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "production")}
                        disabled={uploadingField === "production"}
                      />
                      {uploadingField === "production" ? (
                        <div className="animate-spin w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <HiOutlineCloudArrowUp className="w-4 h-4 text-slate-500" />
                          <span className="text-[10px] font-black uppercase text-slate-400">
                            อัปโหลดไฟล์ใหม่ (New Source)
                          </span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Block Library Modal */}
      {isLibraryOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  คลังบล็อกปัก/สกรีน (Block Library)
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  ค้นหาและเลือกบล็อกเดิมที่เคยทำมาใช้กับออเดอร์นี้
                </p>
              </div>
              <button
                onClick={() => setIsLibraryOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <HiOutlineXMark className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 bg-slate-50 flex-1 overflow-y-auto">
              <div className="relative mb-6">
                <HiOutlineMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อบล็อก, Job ID, หรือรหัสบล็อก..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-transparent focus:border-indigo-600 focus:bg-white bg-slate-200/50 outline-none font-bold text-slate-800 transition-all shadow-sm"
                  value={searchBlock}
                  onChange={(e) => setSearchBlock(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {blocks.map((block) => (
                  <div
                    key={block.id}
                    className="erp-card bg-white p-3 hover:shadow-xl transition-all cursor-pointer group hover:-translate-y-1"
                    onClick={() => handleLinkBlock(block.id)}
                  >
                    <div className="aspect-square rounded-xl bg-slate-100 mb-3 overflow-hidden border border-slate-100">
                      {block.artworkUrl ? (
                        <img
                          src={block.artworkUrl}
                          alt={block.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlinePhoto className="w-8 h-8 text-slate-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-black text-slate-800 truncate">
                      {block.name}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mono">
                      {block.blockCode}
                    </p>
                    <div className="mt-2 text-[9px] bg-slate-100 px-1.5 py-0.5 rounded w-fit font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      เลือกใช้หน้านี้
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTechnicalSpecs;
