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
    const timer = setTimeout(() => {
      fetchThreads(search.trim());
    }, 250);
    return () => clearTimeout(timer);
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
      .map((line) => line.trim())
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
      const key = row.name.trim().replace(/\s+/g, " ").toLowerCase();
      dedupMap.set(key, row);
    }
    return {
      mappings: [...dedupMap.values()],
      invalidLines,
    };
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
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <HiOutlineSwatch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              ค้นหาสีด้าย
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              สีด้ายทุกๆสีที่ใช้
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full lg:w-auto">
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-black text-slate-400 uppercase">Total</p>
            <p className="text-lg font-black text-slate-900">{stats.total}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-black text-slate-400 uppercase">With HEX</p>
            <p className="text-lg font-black text-emerald-600">{stats.withHex}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[10px] font-black text-slate-400 uppercase">No HEX</p>
            <p className="text-lg font-black text-amber-600">{stats.withoutHex}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-3 md:p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหารหัสหรือชื่อสี..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
                className="px-4 py-2.5 rounded-xl font-black text-sm bg-indigo-600 text-white hover:bg-indigo-500 transition-all"
              >
                Name to HEX
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="px-4 py-2.5 rounded-xl font-black text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all inline-flex items-center gap-2"
              >
                <HiOutlinePlus className="w-4 h-4" />
                เพิ่มสีด้าย
              </button>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-40"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {sortedThreads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="relative">
                <div
                  className="h-24 rounded-xl border border-slate-100"
                  style={{ backgroundColor: thread.colorCode || "#E2E8F0" }}
                />
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => handleDeleteThread(thread.id)}
                    disabled={deletingId === thread.id}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 text-rose-600 border border-rose-100 hover:bg-rose-50 disabled:opacity-50 transition-all"
                    title="Delete"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-0.5">
                <p className="text-xs font-black text-indigo-600 uppercase truncate">
                  {thread.code}
                </p>
                <p className="text-sm font-bold text-slate-800 truncate">
                  {thread.name}
                </p>
                <p className="text-[11px] font-semibold text-slate-400 truncate">
                  {thread.colorCode || "-"}
                </p>
              </div>
            </div>
          ))}

          {sortedThreads.length === 0 && (
            <div className="col-span-full py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <p className="text-slate-500 font-bold">ไม่พบข้อมูลสีด้าย</p>
            </div>
          )}
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-slate-800 mb-6">เพิ่มสีด้ายใหม่</h3>
            <form onSubmit={handleAddThread} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  รหัสสี (Code)
                </label>
                <input
                  required
                  value={newThread.code}
                  onChange={(e) =>
                    setNewThread((prev) => ({ ...prev, code: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    setNewThread((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
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
                    setNewThread((prev) => ({
                      ...prev,
                      colorCode: e.target.value,
                    }))
                  }
                  className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl p-1 cursor-pointer"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-black hover:bg-indigo-500 transition-all disabled:opacity-60"
                >
                  {adding ? "Saving..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showBulkMap && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-black text-slate-800">
              Bulk map by name to HEX
            </h3>
            <p className="text-sm text-slate-500">
              ใส่ข้อมูลทีละบรรทัดในรูปแบบ: <span className="font-bold">ชื่อสี #RRGGBB</span>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`เช่น\nDeep Red #7B0B42\nSilver Gray #BDBDBF`}
              className="w-full min-h-[220px] bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {bulkSummary && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">
                    Updated: <span className="font-black">{bulkSummary.updated || 0}</span>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">
                    Unchanged: <span className="font-black">{bulkSummary.unchanged || 0}</span>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">
                    Not found: <span className="font-black">{bulkSummary.notFound?.length || 0}</span>
                  </div>
                  <div className="rounded-xl bg-white border border-slate-200 px-3 py-2">
                    Invalid: <span className="font-black">{bulkSummary.invalid?.length || 0}</span>
                  </div>
                </div>

                {bulkSummary.notFound?.length > 0 && (
                  <div className="text-xs text-amber-700">
                    Not found names:{" "}
                    {bulkSummary.notFound
                      .slice(0, 10)
                      .map((item) => item.name)
                      .join(", ")}
                  </div>
                )}

                {bulkSummary.ambiguous?.length > 0 && (
                  <div className="text-xs text-rose-700">
                    Ambiguous names:{" "}
                    {bulkSummary.ambiguous
                      .slice(0, 10)
                      .map((item) => item.name)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowBulkMap(false)}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
              >
                ปิด
              </button>
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={handleBulkColorMap}
                className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-black hover:bg-indigo-500 transition-all disabled:opacity-60"
              >
                {bulkUpdating ? "Updating..." : "Apply mapping"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadColorReference;
