import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  HiOutlineSwatch,
  HiOutlineMagnifyingGlass,
  HiOutlinePlus,
} from "react-icons/hi2";
import { useAuth } from "../../context/auth-store";

const ThreadColorReference = () => {
  const { token, user } = useAuth();
  const getAuthHeader = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );
  const [threads, setThreads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // For adding new thread (Admin/Foreman only mockup)
  const [showAdd, setShowAdd] = useState(false);
  const [newThread, setNewThread] = useState({
    code: "",
    name: "",
    colorCode: "#000000",
  });

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/threads", {
        headers: getAuthHeader(),
      });
      setThreads(res.data.data.threads);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const handleAddThread = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/threads", newThread, {
        headers: getAuthHeader(),
      });
      setShowAdd(false);
      setNewThread({ code: "", name: "", colorCode: "#000000" });
      fetchThreads();
    } catch (err) {
      alert("เพิ่มไม่สำเร็จ: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredThreads = threads.filter(
    (t) =>
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200">
            <HiOutlineSwatch className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              ค้นหาสีด้าย
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Thread Color Reference
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ค้นหารหัสหรือชื่อสี..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none w-64 transition-all"
            />
          </div>
          {(user?.role === "ADMIN" || user?.role === "EXECUTIVE") && (
            <button
              onClick={() => setShowAdd(true)}
              className="bg-slate-900 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"
            >
              <HiOutlinePlus className="w-4 h-4" /> เพิ่มรหัสสี
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-slate-100 rounded-2xl h-48"
            ></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredThreads.map((thread) => (
            <div
              key={thread.id}
              className="bg-white rounded-3xl p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3 border border-slate-50">
                {thread.imageUrl ? (
                  <img
                    src={thread.imageUrl}
                    className="w-full h-full object-cover"
                    alt={thread.name}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-black text-white text-3xl"
                    style={{ backgroundColor: thread.colorCode || "#E2E8F0" }}
                  >
                    {thread.code}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 rounded-2xl pointer-events-none group-hover:bg-transparent transition-all"></div>
              </div>
              <div className="px-1 text-center">
                <p className="text-xs font-black text-indigo-600 uppercase mb-0.5">
                  {thread.code}
                </p>
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                  {thread.name}
                </p>
              </div>
            </div>
          ))}

          {filteredThreads.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">
                ไม่พบข้อมูลสีด้ายที่ค้นหา
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal Mockup */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-black text-slate-800 mb-6">
              เพิ่มรหัสสีด้ายใหม่
            </h3>
            <form onSubmit={handleAddThread} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  รหัสสี (Code)
                </label>
                <input
                  required
                  value={newThread.code}
                  onChange={(e) =>
                    setNewThread({ ...newThread, code: e.target.value })
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
                    setNewThread({ ...newThread, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="เช่น สีส้มมานะ"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-all"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white px-4 py-3 rounded-xl font-black hover:bg-indigo-500 transition-all"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadColorReference;
