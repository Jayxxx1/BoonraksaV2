import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/config";
import {
  HiOutlineSwatch,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi2";
import { useAuth } from "../../context/auth-store";

const MANAGE_ROLES = ["ADMIN", "SUPER_ADMIN", "GRAPHIC"];
const DELETE_ROLES = ["ADMIN", "SUPER_ADMIN", "EXECUTIVE"];

const ThreadColorReference = () => {
  const { user } = useAuth();
  const canManage = MANAGE_ROLES.includes(user?.role);
  const canDelete = DELETE_ROLES.includes(user?.role);

  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showBulkMap, setShowBulkMap] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [bulkSummary, setBulkSummary] = useState(null);
  const [newThread, setNewThread] = useState({
    code: "",
    name: "",
    colorCode: "#000000",
  });
  const [deletingId, setDeletingId] = useState(null);

  const fetchThreads = useCallback(async (keyword = "") => {
    setLoading(true);
    setErrorMessage("");
    try {
      const res = await api.get("/threads", {
        params: keyword ? { q: keyword } : undefined,
      });
      setThreads(res.data?.data?.threads || []);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to load threads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchThreads(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search, fetchThreads]);

  const handleAddThread = async (e) => {
    e.preventDefault();
    setAdding(true);
    setErrorMessage("");
    try {
      await api.post("/threads", {
        code: newThread.code.trim().toUpperCase(),
        name: newThread.name.trim(),
        colorCode: newThread.colorCode || null,
      });
      setShowAdd(false);
      setNewThread({ code: "", name: "", colorCode: "#000000" });
      await fetchThreads(search.trim());
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to add thread");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteThread = async (id) => {
    if (!window.confirm("Delete this thread color?")) return;
    setDeletingId(id);
    setErrorMessage("");
    try {
      await api.delete(`/threads/${id}`);
      await fetchThreads(search.trim());
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to delete thread");
    } finally {
      setDeletingId(null);
    }
  };

  const parseBulkMappings = (text) => {
    const lines = String(text || "")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const mappings = [];
    const invalidLines = [];
    for (const line of lines) {
      const parsed = line.match(/^(.*?)\s+(#[0-9A-Fa-f]{6})$/);
      if (!parsed) {
        invalidLines.push(line);
        continue;
      }
      const name = parsed[1].trim();
      const colorCode = parsed[2].toUpperCase();
      if (!name) {
        invalidLines.push(line);
        continue;
      }
      mappings.push({ name, colorCode });
    }
    const dedupMap = new Map();
    for (const row of mappings) {
      dedupMap.set(row.name.trim().replace(/\s+/g, " ").toLowerCase(), row);
    }
    return { mappings: [...dedupMap.values()], invalidLines };
  };

  const handleBulkColorMap = async () => {
    const { mappings, invalidLines } = parseBulkMappings(bulkText);
    if (mappings.length === 0) {
      setErrorMessage(
        "ไม่พบข้อมูลที่ใช้ได้ กรุณาใส่รูปแบบ: ชื่อสี #RRGGBB ต่อบรรทัด",
      );
      return;
    }
    setBulkUpdating(true);
    setErrorMessage(
      invalidLines.length > 0
        ? `ข้าม ${invalidLines.length} บรรทัดที่รูปแบบไม่ถูกต้อง`
        : "",
    );
    setBulkSummary(null);
    try {
      const res = await api.patch("/threads/bulk-color-map", { mappings });
      setBulkSummary(res.data?.data || null);
      await fetchThreads(search.trim());
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Bulk update failed");
    } finally {
      setBulkUpdating(false);
    }
  };

  const stats = useMemo(() => {
    const withHex = threads.filter((item) => !!item.colorCode).length;
    return {
      total: threads.length,
      withHex,
      withoutHex: threads.length - withHex,
    };
  }, [threads]);
  const sortedThreads = useMemo(
    () =>
      [...threads].sort((a, b) =>
        String(a.code || "").localeCompare(String(b.code || ""), "th", {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    [threads],
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in space-y-4">
        {/* ── Header ── */}
        <div className="erp-page-header">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>ค้นหาสีด้าย
            </h1>
            <p className="erp-page-subtitle">สีด้ายทุกๆสีที่ใช้</p>
          </div>
          <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                Total
              </p>
              <p className="text-lg font-black text-slate-900">{stats.total}</p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                With HEX
              </p>
              <p className="text-lg font-black text-emerald-600">
                {stats.withHex}
              </p>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-[9px] font-black text-slate-400 uppercase">
                No HEX
              </p>
              <p className="text-lg font-black text-amber-600">
                {stats.withoutHex}
              </p>
            </div>
          </div>
        </div>

        {/* ── Search Bar ── */}
        <div className="erp-section !p-3">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
            <div className="relative flex-1 group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหารหัสหรือชื่อสี..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="erp-search-input w-full"
              />
            </div>
            {canManage && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkMap(true);
                    setErrorMessage("");
                    setBulkSummary(null);
                  }}
                  className="erp-action-btn !bg-indigo-600 !text-white hover:!bg-indigo-500"
                >
                  Name to HEX
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="erp-action-btn !bg-slate-900 !text-white hover:!bg-slate-800"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5" /> เพิ่มสีด้าย
                </button>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-2.5 text-[12px] font-bold text-rose-700">
            {errorMessage}
          </div>
        )}

        {/* ── Grid ── */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-slate-100 rounded-md h-36"
              ></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {sortedThreads.map((thread) => (
              <div
                key={thread.id}
                className="bg-white rounded-md p-2.5 border border-slate-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="relative">
                  <div
                    className="h-20 rounded-md border border-slate-100"
                    style={{ backgroundColor: thread.colorCode || "#E2E8F0" }}
                  />
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => handleDeleteThread(thread.id)}
                      disabled={deletingId === thread.id}
                      className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-rose-600 border border-rose-100 hover:bg-rose-50 disabled:opacity-50 transition-all"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-[10px] font-black text-indigo-600 uppercase truncate">
                    {thread.code}
                  </p>
                  <p className="text-[12px] font-bold text-slate-800 truncate">
                    {thread.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {thread.colorCode || "-"}
                  </p>
                </div>
              </div>
            ))}
            {sortedThreads.length === 0 && (
              <div className="col-span-full erp-empty-state">
                <p className="text-slate-400 text-[12px] font-bold">
                  ไม่พบข้อมูลสีด้าย
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Add Modal ── */}
        {showAdd && (
          <div className="erp-modal-overlay">
            <div className="erp-modal-content p-6 max-w-md w-full">
              <h3 className="text-[15px] font-black text-slate-800 mb-4">
                เพิ่มสีด้ายใหม่
              </h3>
              <form onSubmit={handleAddThread} className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    รหัสสี (Code)
                  </label>
                  <input
                    required
                    value={newThread.code}
                    onChange={(e) =>
                      setNewThread((p) => ({ ...p, code: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 text-[12px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="เช่น P101"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    ชื่อสี (Name)
                  </label>
                  <input
                    required
                    value={newThread.name}
                    onChange={(e) =>
                      setNewThread((p) => ({ ...p, name: e.target.value }))
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 text-[12px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="เช่น สีส้มมานะ"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    Hex Color
                  </label>
                  <input
                    type="color"
                    value={newThread.colorCode || "#000000"}
                    onChange={(e) =>
                      setNewThread((p) => ({ ...p, colorCode: e.target.value }))
                    }
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-md p-1 cursor-pointer"
                  />
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 px-3 py-2.5 rounded-md font-bold text-slate-500 hover:bg-slate-100 transition-all text-[12px]"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex-1 bg-indigo-600 text-white px-3 py-2.5 rounded-md font-black text-[12px] hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {adding ? "Saving..." : "บันทึกข้อมูล"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Bulk Modal ── */}
        {showBulkMap && (
          <div className="erp-modal-overlay">
            <div className="erp-modal-content p-5 max-w-2xl w-full space-y-3">
              <h3 className="text-[15px] font-black text-slate-800">
                Bulk map by name to HEX
              </h3>
              <p className="text-[11px] text-slate-500">
                ใส่ข้อมูลทีละบรรทัดในรูปแบบ:{" "}
                <span className="font-bold">ชื่อสี #RRGGBB</span>
              </p>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`เช่น\nDeep Red #7B0B42\nSilver Gray #BDBDBF`}
                className="w-full min-h-[200px] bg-slate-50 border border-slate-200 rounded-md px-3 py-2.5 text-[12px] font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {bulkSummary && (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
                    <div className="rounded-md bg-white border border-slate-200 px-2.5 py-1.5">
                      Updated:{" "}
                      <span className="font-black">
                        {bulkSummary.updated || 0}
                      </span>
                    </div>
                    <div className="rounded-md bg-white border border-slate-200 px-2.5 py-1.5">
                      Unchanged:{" "}
                      <span className="font-black">
                        {bulkSummary.unchanged || 0}
                      </span>
                    </div>
                    <div className="rounded-md bg-white border border-slate-200 px-2.5 py-1.5">
                      Not found:{" "}
                      <span className="font-black">
                        {bulkSummary.notFound?.length || 0}
                      </span>
                    </div>
                    <div className="rounded-md bg-white border border-slate-200 px-2.5 py-1.5">
                      Invalid:{" "}
                      <span className="font-black">
                        {bulkSummary.invalid?.length || 0}
                      </span>
                    </div>
                  </div>
                  {bulkSummary.notFound?.length > 0 && (
                    <div className="text-[10px] text-amber-700">
                      Not found:{" "}
                      {bulkSummary.notFound
                        .slice(0, 10)
                        .map((i) => i.name)
                        .join(", ")}
                    </div>
                  )}
                  {bulkSummary.ambiguous?.length > 0 && (
                    <div className="text-[10px] text-rose-700">
                      Ambiguous:{" "}
                      {bulkSummary.ambiguous
                        .slice(0, 10)
                        .map((i) => i.name)
                        .join(", ")}
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBulkMap(false)}
                  className="flex-1 px-3 py-2.5 rounded-md font-bold text-slate-500 hover:bg-slate-100 text-[12px]"
                >
                  ปิด
                </button>
                <button
                  type="button"
                  disabled={bulkUpdating}
                  onClick={handleBulkColorMap}
                  className="flex-1 bg-indigo-600 text-white px-3 py-2.5 rounded-md font-black text-[12px] hover:bg-indigo-500 disabled:opacity-60"
                >
                  {bulkUpdating ? "Updating..." : "Apply mapping"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThreadColorReference;
