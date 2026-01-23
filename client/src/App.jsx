import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProductList from "./components/ProductList";
import CreateProduct from "./components/CreateProduct";
import ProductDetail from "./components/ProductDetail";

function App() {
  return (
    <Router>
      <div className="min-height-screen flex flex-col font-sans">
        <Navbar />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/create" element={<CreateProduct />} />
            <Route path="/product/:id" element={<ProductDetail />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;
