import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
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
import QCMobileView from "./pages/production/QCMobileView";
import DeliveryDashboard from "./pages/delivery/DeliveryDashboard";
import FinanceMonitor from "./pages/executive/FinanceMonitor";
import MarketingMonitor from "./pages/executive/MarketingMonitor";
import Login from "./pages/auth/Login";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="min-height-screen flex flex-col font-sans">
                  <Navbar />
                  <main className="flex-grow">
                    <Routes>
                      <Route path="/" element={<ProductList />} />
                      <Route path="/products" element={<ProductList />} />
                      <Route
                        path="/product/create"
                        element={<CreateProduct />}
                      />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/order/create" element={<CreateOrder />} />
                      <Route path="/order/:orderId" element={<OrderDetail />} />
                      <Route path="/orders" element={<OrderList />} />
                      <Route path="/stock-check" element={<StockCheck />} />
                      <Route
                        path="/purchasing"
                        element={<PurchasingDashboard />}
                      />
                      <Route path="/graphic" element={<GraphicTaskBoard />} />
                      <Route path="/stock-recheck" element={<StockRecheck />} />
                      <Route
                        path="/production"
                        element={<ProductionTaskBoard />}
                      />
                      <Route path="/qc" element={<QCMobileView />} />
                      <Route path="/delivery" element={<DeliveryDashboard />} />
                      <Route
                        path="/monitor/finance"
                        element={<FinanceMonitor />}
                      />
                      <Route
                        path="/monitor/marketing"
                        element={<MarketingMonitor />}
                      />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
