import React from "react";
import { HiOutlineCube } from "react-icons/hi2";

const OrderItemTable = ({ order, canViewOrderItems }) => {
  if (!canViewOrderItems) return null;

  return (
    <div className="erp-card overflow-hidden">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
        <HiOutlineCube className="w-5 h-5 text-emerald-500" />
        <h3 className="font-bold text-slate-800 text-sm">
          รายการสินค้าในออเดอร์
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th>สินค้า / SKU (Product)</th>
              <th className="text-center">สี/ไซส์ (Variant)</th>
              <th className="text-center">จำนวน (Qty)</th>
              <th className="text-right">ราคาต่อชิ้น (Price)</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const standardItems = order.items.filter(
                (item) => !item.isPreorder,
              );
              const preorderItems = order.items.filter(
                (item) => item.isPreorder,
              );

              let rows = [];

              // Standard Items
              standardItems.forEach((item, idx) => {
                rows.push(
                  <tr key={`std-${idx}`}>
                    <td>
                      <p className="font-bold text-slate-800 text-[13px]">
                        {item.productName}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">
                        {item.variant?.sku || "N/A"}
                      </p>
                    </td>
                    <td className="text-center">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-slate-600">
                        {item.variant?.color || "-"} /{" "}
                        {item.variant?.size || "-"}
                      </span>
                    </td>
                    <td className="text-center font-bold text-slate-700">
                      {item.quantity}
                    </td>
                    <td className="text-right font-bold text-slate-900">
                      ฿{item.price?.toLocaleString()}
                    </td>
                  </tr>,
                );
              });

              // Pre-order Section Header
              if (preorderItems.length > 0) {
                rows.push(
                  <tr key="pre-header" className="bg-amber-100/30">
                    <td
                      colSpan="4"
                      className="py-3 px-6 border-t-2 border-b-2 border-amber-400/30 shadow-inner"
                    >
                      <span className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                        <HiOutlineCube className="w-4 h-4 text-amber-500 animate-pulse" />
                        รายการสั่งซื้อเพิ่ม
                      </span>
                    </td>
                  </tr>,
                );

                preorderItems.forEach((item, idx) => {
                  rows.push(
                    <tr key={`pre-${idx}`} className="bg-amber-50/20">
                      <td>
                        <p className="font-bold text-amber-900 text-[13px]">
                          {item.productName}
                        </p>
                        <p className="text-[10px] text-amber-600/50 font-mono tracking-tighter uppercase">
                          {item.variant?.sku || "N/A"}
                        </p>
                      </td>
                      <td className="text-center">
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">
                          {item.variant?.color || "-"} /{" "}
                          {item.variant?.size || "-"}
                        </span>
                      </td>
                      <td className="text-center font-bold text-amber-900">
                        <div className="flex flex-col items-center">
                          <span className="text-[13px]">{item.quantity}</span>
                          {item.prStatus === "COMPLETED" ? (
                            <span className="text-[9px] bg-emerald-100 px-1.5 rounded-full text-emerald-700 font-black uppercase tracking-tighter mt-0.5 border border-emerald-200">
                              สินค้าเข้าคลังแล้ว
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-200 px-1.5 rounded-full text-amber-800 uppercase tracking-tighter mt-0.5">
                              สั่งเพิ่ม: {item.preorderQty}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-right font-bold text-amber-950">
                        ฿{item.price?.toLocaleString()}
                      </td>
                    </tr>,
                  );
                });
              }

              return rows;
            })()}
          </tbody>
          <tfoot className="bg-slate-50/80">
            <tr>
              <td colSpan="2" className="py-3 font-bold text-slate-500 text-xs">
                จำนวนรวมทั้งหมด
              </td>
              <td className="text-center font-black text-indigo-600">
                {order.items.reduce((sum, item) => sum + item.quantity, 0)} ตัว
                (Pcs)
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default OrderItemTable;
