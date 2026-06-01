import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import Nav from './components/Nav';
import Footer from './components/Footer';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Product from './pages/Product';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Wishlist from './pages/Wishlist';
import Account from './pages/Account';
import SmoothScroll from './components/SmoothScroll';
import { Toaster } from 'react-hot-toast';



import AdminPanel from './components/adminDashboard/AdminPanel';
import DashboardHome from './components/adminDashboard/DashboardHome';
import DashboardOrders from './components/adminDashboard/DashboardOrders';
import DashboardProducts from './components/adminDashboard/DashboardProducts';
import DashboardAddProduct from './components/adminDashboard/DashboardAddProduct';
import DashboardRestoreProducts from './components/adminDashboard/DashboardRestoreProducts';
import DashboardCategories from './components/adminDashboard/DashboardCategories';
import DashboardSubCategories from './components/adminDashboard/DashboardSubCategories';
import DashboardTags from './components/adminDashboard/DashboardTags';
import DashboardMessages from './components/adminDashboard/DashboardMessages';
import DashboardCoupons from './components/adminDashboard/DashboardCoupons';
import DashboardUsers from './components/adminDashboard/DashboardUsers';
import DashboardSliders from './components/adminDashboard/DashboardSliders';
import DashboardReviews from './components/adminDashboard/DashboardReviews';
import DashboardSettings from './components/adminDashboard/DashboardSettings';
import DashboardQrUpdate from './components/adminDashboard/DashboardQrUpdate';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Shipping from './pages/Shipping';
import Terms from './pages/Terms';
import ReturnPolicy from './pages/ReturnPolicy';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppWidget from './components/WhatsAppWidget';

import AdminLogin from './pages/AdminLogin';
import { useDispatch } from 'react-redux';
import { fetchMe, fetchAdminMe } from './store/slices/authSlice';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Simple component to handle global auth checks and session restoration
const GlobalAuthHandler = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    // 1. Restore session if token exists
    if (token) {
      if (location.pathname.startsWith('/admin')) {
        dispatch(fetchAdminMe());
      } else {
        dispatch(fetchMe());
      }
    }

    // 2. Redirect to home if no token on private pages
    const publicPaths = ['/', '/login', '/register', '/forgot-password', '/products', '/about-us', '/contact', '/admin-login', '/privacy-policy', '/shipping', '/terms', '/return-policy'];
    const isPublic = publicPaths.includes(location.pathname) || location.pathname.startsWith('/product/');

    if (!token && !isPublic) {
      navigate('/');
    }
  }, [dispatch, location.pathname, navigate]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <GlobalAuthHandler />
      <WhatsAppWidget />
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          className: '',
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#5C3A2E', // brown color
            padding: '16px 24px',
            borderRadius: '24px',
            border: '1px solid rgba(92, 58, 46, 0.1)',
            boxShadow: '0 20px 50px rgba(92, 58, 46, 0.15)',
            fontSize: '12px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            maxWidth: '400px',
          },
          success: {
            iconTheme: {
              primary: '#C97863', // gold
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: 'rgba(254, 242, 242, 0.9)',
              color: '#991b1b',
              border: '1px solid rgba(239, 68, 68, 0.1)',
            }
          },
        }}
      />
      <SmoothScroll>
        <Routes>
          {/* Public Routes with Nav and Footer */}
          <Route
            element={
              <div className="flex flex-col min-h-screen">
                <Nav />
                <main className="grow">
                  <Outlet />
                </main>
                <Footer />
              </div>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/products" element={<Product />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<Account />} />

            {/* Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/return-policy" element={<ReturnPolicy />} />

            {/* Catch-all route for public access */}
            <Route path="*" element={<Home />} />
          </Route>

          {/* Admin Login Route */}
          <Route path="/admin-login" element={<AdminLogin />} />

          {/* Admin Routes (No Nav/Footer) */}
          <Route path="/admin" element={<AdminPanel />}>
            <Route index element={<DashboardHome />} />
            <Route path="orders" element={<DashboardOrders />} />
            <Route path="products" element={<DashboardProducts />} />
            <Route path="add-product" element={<DashboardAddProduct />} />
            <Route path="restore-products" element={<DashboardRestoreProducts />} />
            <Route path="categories" element={<DashboardCategories />} />
            <Route path="subcategories" element={<DashboardSubCategories />} />
            <Route path="sliders" element={<DashboardSliders />} />
            <Route path="tags" element={<DashboardTags />} />
            <Route path="messages" element={<DashboardMessages />} />
            <Route path="coupons" element={<DashboardCoupons />} />
            <Route path="users" element={<DashboardUsers />} />
            <Route path="reviews" element={<DashboardReviews />} />
            <Route path="settings" element={<DashboardSettings />} />
            <Route path="qr-update" element={<DashboardQrUpdate />} />
          </Route>
        </Routes>
      </SmoothScroll>
    </BrowserRouter>
  );
}

export default App;
