import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../api/config";
import { HiOutlineCheckBadge } from "react-icons/hi2";
import { HiOutlinePrinter } from "react-icons/hi";

const CustomerProofSheet = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/orders/${orderId}`);
        setOrder(res.data.data.order);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading)
    return <div className="p-20 text-center font-bold">กำลังโหลดเอกสาร...</div>;
  if (!order)
    return (
      <div className="p-20 text-center text-rose-500 font-black">
        ไม่พบข้อมูลออเดอร์
      </div>
    );

  return (
    <div className="bg-slate-100 min-h-screen py-10 px-4 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-lg overflow-hidden print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black italic tracking-tighter">
              บุญรักษา <span className="text-indigo-400 font-medium"></span>
            </h1>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
              ใบแจ้งรายละเอียดงาน
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="bg-white/10 hover:bg-white/20 p-3 rounded-md transition-all print:hidden"
          >
            <HiOutlinePrinter className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 space-y-10">
          {/* Section 1: Job Info */}
          <div className="flex flex-wrap items-start justify-between gap-6 border-b border-slate-100 pb-8">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                เลขที่ออเดอร์ (Job ID)
              </p>
              <p className="text-3xl font-black text-slate-900">
                {order.jobId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">
                วันที่ต้องการรับสินค้า (Due Date)
              </p>
              <p className="text-xl font-black text-indigo-600">
                {order.dueDate
                  ? new Date(order.dueDate).toLocaleDateString("th-TH", {
                      dateStyle: "long",
                    })
                  : "ยังไม่กำหนด"}
              </p>
            </div>
          </div>

          {/* Section 2: Items Summary */}
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              🛒 สรุปรายการสินค้า
            </h3>
            <div className="bg-slate-50 rounded-lg p-6">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200">
                    <th className="text-left py-2">รายการ</th>
                    <th className="text-center py-2">จำนวน</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-3 font-bold text-slate-700">
                        {item.productName}{" "}
                        <span className="text-xs text-slate-400">
                          ({item.variant?.color} / {item.variant?.size})
                        </span>
                      </td>
                      <td className="py-3 font-black text-center text-slate-900">
                        {item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Embroidery Layouts */}
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              🪡 รูปแบบงานปัก / รายละเอียดกราฟิก
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {order.positions?.map((pos, idx) => (
                <div
                  key={idx}
                  className="bg-white border-2 border-slate-50 rounded-lg p-6 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-50">
                    <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                      {idx + 1}
                    </span>
                    <span className="font-black text-slate-800 uppercase">
                      {pos.position}
                    </span>
                  </div>

                  {/* Mockup Image Large */}
                  <div className="aspect-[4/3] bg-slate-50 rounded-md overflow-hidden border border-slate-100">
                    {pos.mockupUrl ? (
                      <img
                        src={pos.mockupUrl}
                        className="w-full h-full object-contain"
                        alt={`Mockup ${pos.position}`}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                        <HiOutlineCheckBadge className="w-12 h-12 mb-2 opacity-20" />
                        <p className="text-xs font-bold uppercase italic">
                          No Proof Image
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <dt className="text-[9px] font-black text-slate-400 uppercase">
                      ข้อความ / รายละเอียด:
                    </dt>
                    <dd className="text-lg font-black text-indigo-600 bg-indigo-50/50 p-2 rounded-xl">
                      {pos.textToEmb || "-"}
                    </dd>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="text-[10px] font-bold text-slate-500">
                      {pos.width && pos.height
                        ? `ขนาด: ${pos.width} x ${pos.height} cm`
                        : "ไม่ได้ระบุขนาด"}
                    </div>
                    {pos.logoUrl && (
                      <div className="w-10 h-10 border border-slate-200 rounded-lg overflow-hidden">
                        <img
                          src={pos.logoUrl}
                          className="w-full h-full object-contain"
                          alt="Logo mini"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Finance (Optional based on Sales preference) */}
          <div className="bg-slate-900 rounded-lg p-8 text-white flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">
                ยอดรวมทั้งหมด
              </p>
              <p className="text-3xl font-black">
                ฿{order.totalPrice?.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">
                ยอดค้างจ่าย (Balance Due)
              </p>
              <p className="text-3xl font-black text-emerald-400">
                ฿{order.balanceDue?.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Footer Approval */}
          <div className="pt-20 text-center space-y-10">
            <div className="h-px bg-slate-100 max-w-xs mx-auto"></div>
            <p className="text-xs font-bold text-slate-400 italic">
              กรุณาตรวจสอบรายละเอียด
              หากถูกต้องรบกวนยืนยันเพื่อเข้าสู่ขั้นตอนการผลิต
            </p>
            <div className="flex justify-center gap-10">
              <div className="w-48 border-t-2 border-slate-900 pt-3">
                <p className="text-[10px] font-black uppercase">
                  ลายเซ็นลูกค้า / วันที่รับรับรอง
                </p>
              </div>
              <div className="w-48 border-t-2 border-indigo-600 pt-3 opacity-30">
                <p className="text-[10px] font-black uppercase text-indigo-600">
                  ผู้จัดทำ (BOONRAKSA)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProofSheet;
