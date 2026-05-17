import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider } from './context/StoreContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ShippingAddressPage from './pages/ShippingAddressPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MerchantLoginPage from './pages/MerchantLoginPage';
import MerchantRegisterPage from './pages/MerchantRegisterPage';
import MerchantDashboard from './pages/MerchantDashboard';
import DeliveryLoginPage from './pages/DeliveryLoginPage';
import DeliveryDashboard from './pages/DeliveryDashboard';
import OwnerLoginPage from './pages/OwnerLoginPage';
import OwnerDashboard from './pages/OwnerDashboard';
import SourceBackupDownload from './pages/SourceBackupDownload';
import PriceComparisonPage from './pages/PriceComparisonPage';
import StoresPage from './pages/StoresPage';
import DeliveryCompaniesPage from './pages/DeliveryCompaniesPage';
import OffersPage from './pages/OffersPage';
import SupportPage from './pages/SupportPage';
import SupportLoginPage from './pages/SupportLoginPage';
import SupportDashboard from './pages/SupportDashboard';
import FavoritesPage from './pages/FavoritesPage';
import DeliveryRegisterPage from './pages/DeliveryRegisterPage';
import SupportApplyPage from './pages/SupportApplyPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import OrderTrackingFullPage from './pages/OrderTrackingFullPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <ScrollToTop />
        <StoreProvider>
          <Routes>
            {/* ── Public customer routes ─────────────────────────────── */}
            <Route path="/" element={<Layout />}>
              <Route index element={<LandingPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductDetailsPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="shipping-address" element={<ShippingAddressPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="stores" element={<StoresPage />} />
              <Route path="stores/:id" element={<StoresPage />} />
              <Route path="delivery-companies" element={<DeliveryCompaniesPage />} />
              <Route path="offers" element={<OffersPage />} />
              <Route path="support" element={<SupportPage />} />
              <Route path="compare" element={<PriceComparisonPage />} />
              <Route path="order-tracking" element={<OrderTrackingPage />} />
              <Route path="tracking" element={<OrderTrackingFullPage />} />
              <Route path="my-orders" element={<CustomerOrdersPage />} />
            </Route>

            {/* ── Customer auth ──────────────────────────────────────── */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />

            {/* ── Vendor / store-portal routes (VENDOR only) ─────────── */}
            <Route path="/store-portal/login" element={<MerchantLoginPage />} />
            <Route path="/store-portal/register" element={<MerchantRegisterPage />} />
            <Route
              path="/store-portal/dashboard"
              element={
                <ProtectedRoute allowedRoles={['VENDOR']}>
                  <MerchantDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Logistics routes (LOGISTICS only) ──────────────────── */}
            <Route path="/logistics/login" element={<DeliveryLoginPage />} />
            <Route path="/logistics/register" element={<DeliveryRegisterPage />} />
            <Route
              path="/logistics/dashboard"
              element={
                <ProtectedRoute allowedRoles={['LOGISTICS']}>
                  <DeliveryDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Admin-cp routes (ADMIN only) ───────────────────────── */}
            <Route path="/admin-cp/login" element={<OwnerLoginPage />} />
            <Route
              path="/admin-cp/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <OwnerDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Helpdesk routes (HELPDESK only) ────────────────────── */}
            <Route path="/helpdesk/login" element={<SupportLoginPage />} />
            <Route path="/helpdesk/apply" element={<SupportApplyPage />} />
            <Route
              path="/helpdesk/dashboard"
              element={
                <ProtectedRoute allowedRoles={['HELPDESK']}>
                  <SupportDashboard />
                </ProtectedRoute>
              }
            />

            {/* ── Misc ───────────────────────────────────────────────── */}
            <Route path="/source-backup.zip" element={<SourceBackupDownload />} />
          </Routes>
        </StoreProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
