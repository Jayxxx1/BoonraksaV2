import React, { useState, useEffect, useCallback } from "react";
import api from "../../api/config";
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
      const res = await api.get("/orders/reports/daily", {
        headers: getAuthHeader(),
      });
      setReports(res.data.data.reports);
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeader]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReports]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/orders/reports/daily", formData, {
        headers: getAuthHeader(),
      });
      setShowForm(false);
      fetchReports();
      alert("บันทึกรายงานกะเรียบร้อยแล้ว");
    } catch (err) {
      alert("บันทึกไม่สำเร็จ: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-5 animate-erp-in space-y-5">
        {/* ── Page Header ── */}
        <div className="erp-page-header">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              รายงานยอดการผลิตรายกะ
            </h1>
            <p className="erp-page-subtitle">Daily Shift Report</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="erp-action-btn !bg-slate-900 !text-white hover:!bg-slate-800"
          >
            <HiOutlinePlus className="w-4 h-4" />
            สร้างรายงานใหม่
          </button>
        </div>

        {/* ── Form ── */}
        {showForm && (
          <div className="erp-section animate-erp-slide-up">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-[13px] font-black text-slate-800">
                ส่งรายงานประจำกะ
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 text-[11px] font-bold hover:text-slate-600"
              >
                ปิด
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <div className="space-y-3">
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 text-[12px] font-bold px-3"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 text-[12px] font-bold px-3"
                  >
                    <option value="เช้า">กะเช้า (08:00 - 20:00)</option>
                    <option value="ค่ำ">กะค่ำ (20:00 - 08:00)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 text-[12px] font-bold px-3"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-md py-2.5 text-[12px] font-bold px-3"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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
                      className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-md py-2.5 text-[12px] font-bold px-3"
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
                      className="w-full bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-md py-2.5 text-[12px] font-bold px-3"
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
                      setFormData({
                        ...formData,
                        missingReason: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 text-[12px] font-bold px-3"
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
                    className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 text-[12px] font-bold px-3"
                    placeholder="ระบุแนวทางการจัดการ..."
                  ></textarea>
                </div>
              </div>

              <div className="md:col-span-2 pt-3">
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 rounded-md font-black text-sm hover:bg-indigo-500 transition-all"
                >
                  บันทึกรายงานลงระบบ
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── Reports History ── */}
        <div className="space-y-3">
          <h3 className="erp-section-title">ประวัติย้อนหลัง</h3>
          {reports.length === 0 ? (
            <div className="erp-empty-state">
              <p className="text-slate-400 text-[12px] font-bold">
                ยังไม่มีข้อมูลรายงานในระบบ
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="erp-section flex flex-wrap items-center justify-between gap-4 !p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-sm ${report.shift === "เช้า" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}
                    >
                      {report.shift === "เช้า" ? "AM" : "PM"}
                    </div>
                    <div>
                      <p className="text-[13px] font-black text-slate-800">
                        {new Date(report.date).toLocaleDateString("th-TH", {
                          dateStyle: "long",
                        })}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">
                        ผู้บันทึก: {report.foreman?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase">
                        เป้า
                      </p>
                      <p className="text-lg font-black text-slate-800">
                        {report.targetOutput}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase">
                        จริง
                      </p>
                      <p className="text-lg font-black text-emerald-600">
                        {report.actualOutput}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-black text-slate-400 uppercase">
                        ประสิทธิภาพ
                      </p>
                      <p className="text-lg font-black text-indigo-600">
                        {Math.round(
                          (report.actualOutput / report.targetOutput) * 100,
                        )}
                        %
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span className="erp-status-badge bg-slate-100 text-slate-600 border-slate-200">
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
    </div>
  );
};

export default ShiftReport;
