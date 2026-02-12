import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  HiOutlineDocumentText,
  HiOutlinePlus,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { useAuth } from "../../context/auth-store";

const ShiftReport = () => {
  const { token } = useAuth();
  const getAuthHeader = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );
  const [reports, setReports] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Auto-detect shift
  const currentHour = new Date().getHours();
  const initialShift = currentHour >= 8 && currentHour < 20 ? "เช้า" : "ค่ำ";

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: initialShift,
    staffCount: 0,
    machineCount: 0,
    targetOutput: 0,
    actualOutput: 0,
    missingReason: "",
    solution: "",
  });

  const fetchReports = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:8000/api/orders/reports/daily",
        {
          headers: getAuthHeader(),
        },
      );
      setReports(res.data.data.reports);
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:8000/api/orders/reports/daily",
        formData,
        {
          headers: getAuthHeader(),
        },
      );
      setShowForm(false);
      fetchReports();
      alert("บันทึกรายงานกะเรียบร้อยแล้ว");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-600 rounded-2xl shadow-lg shadow-rose-200">
            <HiOutlineDocumentText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              รายงานยอดการผลิตรายกะ
            </h1>
            <p className="text-xs font-bold text-slate-400 uppercase">
              Daily Shift Report
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg"
        >
          <HiOutlinePlus className="w-5 h-5" /> สร้างรายงานใหม่
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <h2 className="text-xl font-black text-slate-800">
              ส่งรายงานประจำกะ
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-slate-400 font-bold hover:text-slate-600"
            >
              ปิด
            </button>
          </div>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  วันที่
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 font-bold px-4"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  กะการทำงาน (Shift)
                </label>
                <select
                  value={formData.shift}
                  onChange={(e) =>
                    setFormData({ ...formData, shift: e.target.value })
                  }
                  className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 font-bold px-4"
                >
                  <option value="เช้า">กะเช้า (08:00 - 20:00)</option>
                  <option value="ค่ำ">กะค่ำ (20:00 - 08:00)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    จำนวนคนงาน
                  </label>
                  <input
                    type="number"
                    value={formData.staffCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        staffCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 font-bold px-4"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    จำนวนเครื่องที่เปิด
                  </label>
                  <input
                    type="number"
                    value={formData.machineCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machineCount: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 font-bold px-4"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    เป้าการผลิต (Target)
                  </label>
                  <input
                    type="number"
                    value={formData.targetOutput}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetOutput: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-amber-50 border-amber-200 text-amber-900 rounded-xl py-3 font-bold px-4"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase">
                    ทำได้จริง (Actual)
                  </label>
                  <input
                    type="number"
                    value={formData.actualOutput}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        actualOutput: parseInt(e.target.value),
                      })
                    }
                    className="w-full bg-emerald-50 border-emerald-200 text-emerald-900 rounded-xl py-3 font-bold px-4"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  สาเหตุที่ยอดไม่ถึงเป้า (ถ้ามี)
                </label>
                <textarea
                  rows="2"
                  value={formData.missingReason}
                  onChange={(e) =>
                    setFormData({ ...formData, missingReason: e.target.value })
                  }
                  className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 font-bold px-4"
                  placeholder="ระบุเหตุผล..."
                ></textarea>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase">
                  แนวทางการแก้ไข
                </label>
                <textarea
                  rows="2"
                  value={formData.solution}
                  onChange={(e) =>
                    setFormData({ ...formData, solution: e.target.value })
                  }
                  className="w-full bg-slate-50 border-slate-200 rounded-xl py-3 font-bold px-4"
                  placeholder="ระบุแนวทางการจัดการ..."
                ></textarea>
              </div>
            </div>

            <div className="md:col-span-2 pt-6">
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-500 transition-all"
              >
                บันทึกรายงานลงระบบ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Reports History */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">
          ประวัติย้อนหลัง
        </h3>
        {reports.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 text-center py-20 rounded-3xl">
            <p className="font-bold text-slate-400">
              ยังไม่มีข้อมูลรายงานในระบบ
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-wrap items-center justify-between gap-6 hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${report.shift === "เช้า" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}
                  >
                    {report.shift === "เช้า" ? "☀️" : "🌙"}
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-800">
                      {new Date(report.date).toLocaleDateString("th-TH", {
                        dateStyle: "long",
                      })}
                    </p>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      ผู้บันทึก: {report.foreman?.name || "-"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-8">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      เป้า
                    </p>
                    <p className="text-xl font-black text-slate-800">
                      {report.targetOutput}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      จริง
                    </p>
                    <p className="text-xl font-black text-emerald-600">
                      {report.actualOutput}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase">
                      ประสิทธิภาพ
                    </p>
                    <p className="text-xl font-black text-indigo-600">
                      {Math.round(
                        (report.actualOutput / report.targetOutput) * 100,
                      )}
                      %
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    {report.staffCount} พล / {report.machineCount} เครื่อง
                  </span>
                  {report.actualOutput >= report.targetOutput && (
                    <span className="text-emerald-500 flex items-center gap-1 font-black text-[10px]">
                      <HiOutlineCheckCircle /> ถึงเป้าหมาย
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShiftReport;
