import { useState, useEffect } from "react";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCloudArrowUp,
  HiOutlinePhoto,
  HiOutlineCube,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineBolt,
} from "react-icons/hi2";
import api from "../../api/config";

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
  isDigitizerRole,
  user,
}) => {
  const canEdit =
    order.actionMap?.canEditSpecs ||
    (isDigitizerRole && order.status === "PENDING_DIGITIZING");
  const canUpload = order.actionMap?.canUploadArtwork || isDigitizerRole;
  const isSales = user?.role === "SALES";
  const isSalesOrAdmin = isAdmin || isSales;

  /* 🆕 Master Embroidery Positions */
  const [masterPositions, setMasterPositions] = useState([]);

  useEffect(() => {
    const fetchMasterPositions = async () => {
      try {
        const res = await api.get("/master/positions");
        if (res.data.success) {
          setMasterPositions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch master positions", err);
      }
    };
    fetchMasterPositions();
  }, []);

  if (!canViewTechnical) return null;

  // Role-based Embroidery Gating
  const canAddRemovePos = canEdit && isSalesOrAdmin;
  const canEditDesc = canEdit && isSalesOrAdmin;
  const canEditSize = (canEdit && isGraphicRole) || isAdmin;
  const canDigitize =
    (isDigitizerRole &&
      order.status === "PENDING_DIGITIZING" &&
      ["NEW", "EDIT"].includes(order.blockType)) ||
    (isGraphicRole && canEditSize) ||
    isAdmin;

  return (
    <div className="space-y-6">
      {/* 1. Visual Mockups Section (Separated as requested) */}
      {(!isDigitizerRole || order.draftImages?.length > 0) && (
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
      )}

      {/* 2. Embroidery Positions Section */}
      <div className="erp-card">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HiOutlineAdjustmentsHorizontal className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">
              {displayHeader}
            </h3>
            <div className="ml-4 flex items-center gap-3">
              <span className="text-[14px] font-black text-slate-700">
                ตำแหน่งปัก
              </span>
              <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                <span className="text-[12px] text-slate-400 font-bold uppercase">
                  ประเภทบล็อก:
                </span>
                <span
                  className={`text-[14px] font-black px-2 py-0.5 rounded border ${
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
              บันทึกอัตโนมัติ
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
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {canEditDesc ? (
                      <div className="flex flex-col gap-1 w-full">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black text-indigo-500 shrink-0">
                            {emb.masterPositionId ||
                              masterPositions.find(
                                (m) => m.name === emb.position,
                              )?.id ||
                              "?"}
                            .
                          </span>
                          <select
                            className="text-[11px] font-black text-slate-700 bg-slate-50 border-none p-0 focus:ring-0 cursor-pointer w-full h-6"
                            value={
                              emb.masterPositionId ||
                              masterPositions.find(
                                (m) => m.name === emb.position,
                              )?.id ||
                              (emb.position &&
                              !masterPositions.some(
                                (m) => m.name === emb.position,
                              )
                                ? "CUSTOM"
                                : "")
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const newSpecs = [...editSpecs];
                              if (val === "CUSTOM") {
                                newSpecs[idx].masterPositionId = null;
                                newSpecs[idx].position = "";
                              } else {
                                const master = masterPositions.find(
                                  (m) => String(m.id) === val,
                                );
                                if (master) {
                                  newSpecs[idx].masterPositionId = master.id;
                                  newSpecs[idx].position = master.name;
                                  newSpecs[idx].customPosition = "";
                                }
                              }
                              setEditSpecs(newSpecs);
                            }}
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
                        </div>
                        {/* Custom Input for 'CUSTOM' selection or if manually typed previously */}
                        {!emb.masterPositionId && (
                          <input
                            type="text"
                            placeholder="ระบุตำแหน่ง..."
                            className="text-[10px] font-bold py-0.5 px-2 h-6 w-full bg-amber-50 border border-amber-100 rounded text-amber-900 placeholder-amber-400 outline-none focus:ring-1 focus:ring-amber-200"
                            value={
                              emb.position === "อื่นๆ"
                                ? emb.customPosition || ""
                                : emb.position || ""
                            }
                            onChange={(e) => {
                              const newSpecs = [...editSpecs];
                              newSpecs[idx].position = e.target.value;
                              newSpecs[idx].masterPositionId = null;
                              setEditSpecs(newSpecs);
                            }}
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-[12px] font-black text-slate-700 uppercase truncate">
                        {emb.masterPositionId ||
                          masterPositions.find((m) => m.name === emb.position)
                            ?.id ||
                          ""}
                        {emb.masterPositionId ||
                        masterPositions.find((m) => m.name === emb.position)?.id
                          ? ". "
                          : ""}
                        {emb.position || "ระบุตำแหน่งปัก"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {canAddRemovePos && (
                      <button
                        onClick={() => {
                          const newSpecs = editSpecs.filter(
                            (_, i) => i !== idx,
                          );
                          setEditSpecs(newSpecs);
                        }}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                      >
                        <HiOutlineXMark className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
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

                  {/* 🆕 TECHNICAL FIELDS (Flashdrive & Needle) */}
                  {(canEditSize || emb.fileAddress || emb.needlePattern) && (
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-50 pt-2">
                      <div>
                        <label className="text-[12px] font-black text-black uppercase flex items-center gap-1">
                          📁 ที่อยู่ไฟล์
                        </label>
                        <input
                          type="text"
                          className={`erp-input-compact text-xs py-1 h-8 w-full ${canEditSize ? "" : "bg-slate-50"}`}
                          placeholder="เช่น F6:159"
                          value={emb.fileAddress || ""}
                          readOnly={!canEditSize}
                          onChange={(e) => {
                            const newSpecs = [...editSpecs];
                            newSpecs[idx].fileAddress = e.target.value;
                            setEditSpecs(newSpecs);
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-black text-black uppercase flex items-center gap-1">
                          🪡 เลขรูปแบบเข็ม
                        </label>
                        <input
                          type="text"
                          className={`erp-input-compact text-xs py-1 h-8 w-full ${canEditSize ? "" : "bg-slate-50"}`}
                          placeholder="เช่น 1154"
                          value={emb.needlePattern || ""}
                          readOnly={!canEditSize}
                          onChange={(e) => {
                            const newSpecs = [...editSpecs];
                            newSpecs[idx].needlePattern = e.target.value;
                            setEditSpecs(newSpecs);
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 🆕 EMBROIDERY FILES UPLOAD PER POSITION (New for Digitizer and Graphic) */}
                  {(canDigitize ||
                    (emb.embroideryFileUrls &&
                      emb.embroideryFileUrls.length > 0)) && (
                    <div className="border-t border-slate-50 pt-2 pb-2">
                      <label className="text-[12px] font-black text-rose-500 uppercase flex items-center gap-1 mb-2">
                        <HiOutlineBolt className="w-3.5 h-3.5" /> ไฟล์ปัก (.DST){" "}
                        {emb.embroideryFileUrls?.length || 0}/10
                      </label>

                      <div className="flex flex-wrap gap-2">
                        {/* List uploaded files */}
                        {Array.isArray(emb.embroideryFileUrls) &&
                          emb.embroideryFileUrls.map((url, urlIdx) => (
                            <div
                              key={urlIdx}
                              className="flex items-center gap-2 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md text-xs group"
                            >
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-rose-600 hover:text-rose-700 hover:underline max-w-[150px] truncate"
                                title="ดาวน์โหลดไฟล์ .EMB"
                              >
                                ไฟล์ปัก {urlIdx + 1}
                              </a>
                              {canDigitize && (
                                <button
                                  onClick={() => {
                                    const newSpecs = [...editSpecs];
                                    newSpecs[idx].embroideryFileUrls.splice(
                                      urlIdx,
                                      1,
                                    );
                                    setEditSpecs(newSpecs);
                                  }}
                                  className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <HiOutlineXMark className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}

                        {/* Upload button for that specific position */}
                        {canDigitize &&
                          (!emb.embroideryFileUrls ||
                            emb.embroideryFileUrls.length < 10) && (
                            <label className="flex items-center gap-1.5 px-3 py-1 bg-white border border-dashed border-rose-300 text-rose-500 rounded-md cursor-pointer hover:bg-rose-50 transition-colors text-xs font-bold shadow-sm">
                              {uploadingField === `emb_${idx}` ? (
                                <div className="animate-spin w-3 h-3 border-2 border-rose-500 border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <HiOutlineCloudArrowUp className="w-4 h-4" />{" "}
                                  อัปโหลด .EMB
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept=".emb"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      const customEvent = {
                                        target: { files: [file] },
                                        positionIndex: idx,
                                      };
                                      handleFileUpload(
                                        customEvent,
                                        `emb_${idx}`,
                                      );
                                    }}
                                  />
                                </>
                              )}
                            </label>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Text Row */}
                  {(canEditDesc || emb.textToEmb) && (
                    <div>
                      <label className="text-[12px] font-bold text-slate-400 uppercase mb-0.5 block">
                        ข้อความที่ต้องการปัก หรือ กำกับ
                      </label>
                      <textarea
                        className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all outline-none resize-y min-h-[80px]"
                        placeholder="ระบุข้อความ..."
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
                    </div>
                  )}

                  {/* 🆕 Thread Sequence Management (Multi-color) */}
                  {(canEditSize ||
                    (emb.threadSequence && emb.threadSequence.length > 0)) && (
                    <div className="mt-3 border-t border-slate-50 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                          🧵 ลำดับสีไหม (Thread Colors)
                        </label>
                        {canEditSize && (
                          <button
                            onClick={() => {
                              const newSpecs = [...editSpecs];
                              const seq = newSpecs[idx].threadSequence || [];
                              newSpecs[idx].threadSequence = [
                                ...seq,
                                {
                                  threadCode: "",
                                  colorName: "",
                                  colorCode: "#000000",
                                },
                              ];
                              setEditSpecs(newSpecs);
                            }}
                            className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded hover:bg-indigo-100 transition-colors"
                          >
                            + เพิ่มสี
                          </button>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {(emb.threadSequence || []).map((t, tIdx) => (
                          <div
                            key={tIdx}
                            className="flex items-center gap-1.5 group/thread"
                          >
                            <span className="text-[9px] font-black text-slate-300 w-3">
                              {tIdx + 1}
                            </span>
                            <input
                              type="text"
                              placeholder="รหัสสี"
                              className="w-16 px-1.5 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-bold"
                              value={t.threadCode || ""}
                              readOnly={!canEditSize}
                              onChange={(e) => {
                                const newSpecs = [...editSpecs];
                                newSpecs[idx].threadSequence[tIdx].threadCode =
                                  e.target.value;
                                setEditSpecs(newSpecs);
                              }}
                            />
                            <input
                              type="text"
                              placeholder="ชื่อสี"
                              className="flex-1 px-1.5 py-1 text-[10px] bg-slate-50 border border-slate-200 rounded focus:ring-1 focus:ring-indigo-500 outline-none font-medium"
                              value={t.colorName || ""}
                              readOnly={!canEditSize}
                              onChange={(e) => {
                                const newSpecs = [...editSpecs];
                                newSpecs[idx].threadSequence[tIdx].colorName =
                                  e.target.value;
                                setEditSpecs(newSpecs);
                              }}
                            />
                            <input
                              type="color"
                              className="w-6 h-6 p-0 border-0 bg-transparent cursor-pointer"
                              value={t.colorCode || "#000000"}
                              disabled={!canEditSize}
                              onChange={(e) => {
                                const newSpecs = [...editSpecs];
                                newSpecs[idx].threadSequence[tIdx].colorCode =
                                  e.target.value;
                                setEditSpecs(newSpecs);
                              }}
                            />
                            {canEditSize && (
                              <button
                                onClick={() => {
                                  const newSpecs = [...editSpecs];
                                  newSpecs[idx].threadSequence = newSpecs[
                                    idx
                                  ].threadSequence.filter((_, i) => i !== tIdx);
                                  setEditSpecs(newSpecs);
                                }}
                                className="p-1 text-slate-300 hover:text-rose-500 opacity-0 group-hover/thread:opacity-100 transition-all"
                              >
                                <HiOutlineXMark className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                        {(!emb.threadSequence ||
                          emb.threadSequence.length === 0) && (
                          <p className="text-[9px] text-slate-400 font-bold italic text-center py-2 bg-slate-50/50 rounded-lg">
                            -- ยังไม่มีข้อมูลสีไหม --
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {canAddRemovePos && (
              <button
                onClick={() => {
                  const maxPos = editSpecs.reduce(
                    (max, item) => Math.max(max, item.positionNo || 0),
                    0,
                  );
                  setEditSpecs([
                    ...editSpecs,
                    {
                      positionNo: maxPos + 1,
                      position: "",
                      type: "EMBROIDERY",
                      size: "",
                      details: "",
                      threadSequence: [],
                    },
                  ]);
                }}
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

          {/* Graphic Outputs Section (Final Artwork + Production File + Embroidery File) */}
          {!isSales && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6 border-t border-slate-100 pt-6">
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

              {/* EMB File Section (Embroidery File) */}
              <div className="space-y-3">
                <label className="text-[11px] font-black text-rose-400 uppercase tracking-[0.2em]">
                  ไฟล์ตีลาย (Embroidery File)
                </label>
                <div className="erp-card p-5 bg-slate-900 text-white min-h-[160px] flex flex-col justify-between">
                  <div className="flex flex-col gap-3 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
                    {order.embroideryFileUrls &&
                    order.embroideryFileUrls.length > 0 ? (
                      order.embroideryFileUrls.map((url, i) => (
                        <div
                          key={i}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <HiOutlineBolt className="w-5 h-5 text-rose-400 shrink-0" />
                            <span className="text-xs font-mono truncate text-rose-300">
                              ไฟล์ที่ {i + 1} (.emb)
                            </span>
                          </div>
                          <a
                            href={url}
                            download
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg font-black transition-all text-center whitespace-nowrap shrink-0"
                          >
                            DOWNLOAD
                          </a>
                        </div>
                      ))
                    ) : order.embroideryFileUrl ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                        <div className="flex items-center gap-2 min-w-0">
                          <HiOutlineBolt className="w-5 h-5 text-rose-400 shrink-0" />
                          <span className="text-xs font-mono truncate text-rose-300">
                            ไฟล์เดิม (.emb)
                          </span>
                        </div>
                        <a
                          href={order.embroideryFileUrl}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] bg-rose-600 hover:bg-rose-500 px-3 py-1.5 rounded-lg font-black transition-all text-center whitespace-nowrap shrink-0"
                        >
                          DOWNLOAD
                        </a>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 h-full border border-dashed border-slate-700 rounded-xl bg-slate-800/50">
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center mt-2">
                          ยังไม่ได้อัปโหลดไฟล์ตีลายหลัก
                        </p>
                      </div>
                    )}
                  </div>

                  {canUpload && (
                    <label className="mt-4 flex items-center justify-center gap-2 py-2 border border-dashed border-slate-700 rounded-xl hover:bg-slate-800 cursor-pointer transition-all shrink-0">
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        accept=".emb"
                        onChange={(e) =>
                          handleFileUpload(e, "embroideryGlobal")
                        }
                        disabled={uploadingField === "embroideryGlobal"}
                      />
                      {uploadingField === "embroideryGlobal" ? (
                        <div className="animate-spin w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full" />
                      ) : (
                        <>
                          <HiOutlineCloudArrowUp className="w-4 h-4 text-slate-500" />
                          <span className="text-[10px] font-black uppercase text-slate-400">
                            อัปโหลดไฟล์ปักเพิ่ม
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
