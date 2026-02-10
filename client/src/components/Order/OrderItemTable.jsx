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
            {order.items.map((item, idx) => (
              <tr key={idx}>
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
                    {item.variant?.color || "-"} / {item.variant?.size || "-"}
                  </span>
                </td>
                <td className="text-center font-bold text-slate-700">
                  {item.quantity}
                </td>
                <td className="text-right font-bold text-slate-900">
                  ฿{item.price?.toLocaleString() || "0"}
                </td>
              </tr>
            ))}
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
