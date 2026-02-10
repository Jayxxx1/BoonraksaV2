import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Footer from "./components/Footer";
import { HiOutlineBars3, HiOutlineCube } from "react-icons/hi2";

// Pages
import ProductList from "./pages/stock/ProductList";
import CreateProduct from "./pages/stock/CreateProduct";
import ProductDetail from "./pages/stock/ProductDetail";
import CreateOrder from "./pages/sales/CreateOrder";
import OrderList from "./pages/sales/OrderList";
import OrderDetail from "./pages/sales/OrderDetail";
import StockCheck from "./pages/stock/StockCheck";
import PurchasingDashboard from "./pages/purchasing/PurchasingDashboard";
import GraphicTaskBoard from "./pages/graphic/GraphicTaskBoard";
import StockRecheck from "./pages/stock/StockRecheck";
import ProductionTaskBoard from "./pages/production/ProductionTaskBoard";
import ProductionSearch from "./pages/production/ProductionSearch";
import ThreadColorReference from "./pages/production/ThreadColorReference";
import ShiftReport from "./pages/production/ShiftReport";
import QCMobileView from "./pages/production/QCMobileView";
import DeliveryOrderDetail from "./pages/delivery/DeliveryOrderDetail";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import FinanceMonitor from "./pages/executive/FinanceMonitor";
import MarketingMonitor from "./pages/executive/MarketingMonitor";
import Login from "./pages/auth/Login";

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row font-sans">
      {/* Sidebar - Handles its own responsive state with isOpen/setIsOpen */}
      <Sidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-60"}`}
      >
        {/* Mobile Header - High Density */}
        <header className="lg:hidden h-12 bg-white border-b border-slate-200 px-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            <HiOutlineBars3 className="w-5 h-5" />
          </button>
          <Link to="/" className="flex items-center gap-1.5">
            <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center">
              <HiOutlineCube className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-sm tracking-tight text-slate-900">
              Boon<span className="text-indigo-600">raksa</span>
            </span>
          </Link>
          <div className="w-8"></div> {/* Spacer for balance */}
        </header>

        {/* Dynamic Content */}
        <main className="flex-1">
          <div className="max-w-[1600px] mx-auto pb-10">{children}</div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes Wrapper */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    {/* Publicly visible pages within shell - All authenticated can see */}
                    <Route path="/" element={<ProductList />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/product/:id" element={<ProductDetail />} />

                    {/* Stock & Purchasing */}
                    <Route
                      path="/product/create"
                      element={
                        <ProtectedRoute
                          allowedRoles={["STOCK", "ADMIN", "PURCHASING"]}
                        >
                          <CreateProduct />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/stock-check"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "STOCK",
                            "ADMIN",
                            "SALES",
                            "MARKETING",
                          ]}
                        >
                          <StockCheck />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/stock-recheck"
                      element={
                        <ProtectedRoute allowedRoles={["STOCK", "ADMIN"]}>
                          <StockRecheck />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/purchasing"
                      element={
                        <ProtectedRoute allowedRoles={["PURCHASING", "ADMIN"]}>
                          <PurchasingDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Sales & Orders */}
                    <Route
                      path="/order/create"
                      element={
                        <ProtectedRoute allowedRoles={["SALES", "MARKETING"]}>
                          <CreateOrder />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orders"
                      element={
                        <ProtectedRoute allowedRoles={["SALES", "MARKETING"]}>
                          <OrderList />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/order/:orderId"
                      element={
                        <ProtectedRoute
                          allowedRoles={[
                            "SALES",
                            "MARKETING",
                            "ADMIN",
                            "GRAPHIC",
                            "STOCK",
                            "PRODUCTION",
                            "SEWING_QC",
                            "DELIVERY",
                          ]}
                        >
                          <OrderDetail />
                        </ProtectedRoute>
                      }
                    />

                    {/* Technical / Production */}
                    <Route
                      path="/graphic"
                      element={
                        <ProtectedRoute allowedRoles={["GRAPHIC", "ADMIN"]}>
                          <GraphicTaskBoard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/production"
                      element={
                        <ProtectedRoute allowedRoles={["PRODUCTION", "ADMIN"]}>
                          <ProductionTaskBoard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/production/search"
                      element={
                        <ProtectedRoute
                          allowedRoles={["PRODUCTION", "ADMIN", "FOREMAN"]}
                        >
                          <ProductionSearch />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/production/threads"
                      element={
                        <ProtectedRoute
                          allowedRoles={["PRODUCTION", "GRAPHIC", "ADMIN"]}
                        >
                          <ThreadColorReference />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/production/shift-report"
                      element={
                        <ProtectedRoute
                          allowedRoles={["ADMIN", "EXECUTIVE", "PRODUCTION"]}
                        >
                          <ShiftReport />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/qc"
                      element={
                        <ProtectedRoute allowedRoles={["SEWING_QC", "ADMIN"]}>
                          <QCMobileView />
                        </ProtectedRoute>
                      }
                    />

                    {/* Delivery */}
                    <Route
                      path="/delivery/order/:orderId"
                      element={
                        <ProtectedRoute allowedRoles={["DELIVERY", "ADMIN"]}>
                          <DeliveryOrderDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/delivery"
                      element={
                        <ProtectedRoute allowedRoles={["DELIVERY", "ADMIN"]}>
                          <DeliveryDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Executive & Monitoring */}
                    <Route
                      path="/monitor/finance"
                      element={
                        <ProtectedRoute
                          allowedRoles={["FINANCE", "EXECUTIVE", "ADMIN"]}
                        >
                          <FinanceMonitor />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/monitor/marketing"
                      element={
                        <ProtectedRoute
                          allowedRoles={["MARKETING", "EXECUTIVE", "ADMIN"]}
                        >
                          <MarketingMonitor />
                        </ProtectedRoute>
                      }
                    />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
