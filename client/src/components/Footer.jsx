export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 py-10 mt-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="font-bold text-lg text-slate-800 mb-4">
              Boonraksa System
            </h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              เครื่องมือจัดการระบบการผลิตและสต็อกสินค้าสำหรับธุรกิจเสื้อผ้า
              ทันสมัย ใช้งานง่าย และรองรับการทำงานแบบทีม
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
              ลิงก์ด่วน
            </h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <a
                  href="/"
                  className="hover:text-pastel-blue transition-colors"
                >
                  แดชบอร์ด
                </a>
              </li>
              <li>
                <a
                  href="/products"
                  className="hover:text-pastel-blue transition-colors"
                >
                  จัดการสินค้า
                </a>
              </li>
              <li>
                <a
                  href="/orders"
                  className="hover:text-pastel-blue transition-colors"
                >
                  รายการสั่งซื้อ
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">
              ติดต่อเรา
            </h4>
            <p className="text-sm text-slate-500">
              ฝ่ายสนับสนุนระบบ: support@boonraksa.com
              <br />
              LINE: @boonraksasystem
            </p>
          </div>
        </div>
        <div className="border-t border-slate-50 mt-10 pt-8 text-center">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Boonraksa Co., Ltd. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
