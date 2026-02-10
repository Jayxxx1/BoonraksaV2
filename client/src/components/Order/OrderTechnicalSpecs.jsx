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
  user,
  isAdmin,
  isUpdating,
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
  technicalHeader,
  isGraphicRole,
}) => {
  const canEdit = order.actionMap?.canEditSpecs;
  const canUpload = order.actionMap?.canUploadArtwork;

  if (!canViewTechnical) return null;

  return (
    <div className="erp-card">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HiOutlineAdjustmentsHorizontal className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800 text-sm">
            {technicalHeader}
          </h3>
          <div className="ml-4 flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-semibold uppercase">
              ประเภทบล็อก:
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
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
          !isAdmin && (
            <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100 uppercase tracking-tighter animate-pulse">
              กรุณากดรับงานด้านบนก่อนแก้ไขสเปค
            </span>
          )
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editSpecs.map((emb, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </div>
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Position Specs
                  </span>
                </div>
                {canEdit && (
                  <button
                    onClick={() => {
                      const newSpecs = editSpecs.filter((_, i) => i !== idx);
                      setEditSpecs(newSpecs);
                    }}
                    className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <HiOutlineXMark className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                    ตำแหน่ง (Position)
                  </label>
                  <input
                    type="text"
                    className="erp-input-compact"
                    value={emb.position}
                    readOnly={!canEdit}
                    onChange={(e) => {
                      const newSpecs = [...editSpecs];
                      newSpecs[idx].position = e.target.value;
                      setEditSpecs(newSpecs);
                    }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                      ประเภท (Type)
                    </label>
                    <select
                      className="erp-input-compact"
                      value={emb.type}
                      disabled={!canEdit}
                      onChange={(e) => {
                        const newSpecs = [...editSpecs];
                        newSpecs[idx].type = e.target.value;
                        setEditSpecs(newSpecs);
                      }}
                    >
                      <option value="EMBROIDERY">งานปัก</option>
                      <option value="SCREEN">งานสกรีน</option>
                      <option value="DTF">งาน DTF</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                      ขนาด (Size)
                    </label>
                    <input
                      type="text"
                      className="erp-input-compact text-center"
                      placeholder="เช่น 10x10 cm"
                      value={emb.size}
                      readOnly={!canEdit}
                      onChange={(e) => {
                        const newSpecs = [...editSpecs];
                        newSpecs[idx].size = e.target.value;
                        setEditSpecs(newSpecs);
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">
                    รายละเอียดเพิ่มเติม (Note)
                  </label>
                  <textarea
                    className="erp-input-compact min-h-[60px] resize-none"
                    value={emb.details}
                    readOnly={!canEdit}
                    onChange={(e) => {
                      const newSpecs = [...editSpecs];
                      newSpecs[idx].details = e.target.value;
                      setEditSpecs(newSpecs);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {canEdit && (
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

        {/* Files Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 border-t border-slate-100 pt-6">
          {/* Artwork Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                แบบอาร์ตเวิร์ค (Artwork File)
              </label>
              {canUpload && (
                <button
                  onClick={() => setIsLibraryOpen(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
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

          {/* DST File Section */}
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
              {/* Search */}
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
