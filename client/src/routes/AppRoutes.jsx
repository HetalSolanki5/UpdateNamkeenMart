import React from 'react';
import { Routes, Route } from 'react-router-dom';

// ---- Auth Pages ----
import LandingPage from '../pages/auth/LandingPage.jsx';
import LoginPage from '../pages/auth/LoginPage.jsx';
import RegisterCustomerPage from '../pages/auth/RegisterCustomerPage.jsx';
import RegisterWholesalerPage from '../pages/auth/RegisterWholesalerPage.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

// ---- Customer Area ----
import CustomerLayout from '../layouts/CustomerLayout.jsx';
import CustomerHome from '../pages/customer/CustomerHome.jsx';
import ShopPage from '../pages/customer/ShopPage.jsx';
import ProductDetailPage from '../pages/customer/ProductDetailPage.jsx';
import CartPage from '../pages/customer/CartPage.jsx';
import CheckoutPage from '../pages/customer/CheckoutPage.jsx';
import MyOrdersPage from '../pages/customer/MyOrdersPage.jsx';
import OrderDetailPage from '../pages/customer/OrderDetailPage.jsx';
import OrderTrackingPage from '../pages/customer/OrderTrackingPage.jsx';
import InvoicesListPage from '../pages/customer/InvoicesListPage.jsx';
import InvoicePage from '../pages/customer/InvoicePage.jsx';
import AddressesPage from '../pages/customer/AddressesPage.jsx';

// ---- Wholesaler Area ----
import WholesalerLayout from '../layouts/WholesalerLayout.jsx';
import WholesalerDashboard from '../pages/wholesaler/WholesalerDashboard.jsx';
import WholesaleProductsPage from '../pages/wholesaler/WholesaleProductsPage.jsx';
import WholesaleCartPage from '../pages/wholesaler/WholesaleCartPage.jsx';
import WholesaleOrdersPage from '../pages/wholesaler/WholesaleOrdersPage.jsx';
import WholesaleOrderDetailPage from '../pages/wholesaler/WholesaleOrderDetailPage.jsx';
import WholesaleOrderTrackingPage from '../pages/wholesaler/WholesaleOrderTrackingPage.jsx';
import WholesaleInvoicesPage from '../pages/wholesaler/WholesaleInvoicesPage.jsx';
import WholesaleInvoiceDetailPage from '../pages/wholesaler/WholesaleInvoiceDetailPage.jsx';
import WholesalePaymentsPage from '../pages/wholesaler/WholesalePaymentsPage.jsx';
import WholesaleReportsPage from '../pages/wholesaler/WholesaleReportsPage.jsx';
import WholesalerProfilePage from '../pages/wholesaler/WholesalerProfilePage.jsx';

// ---- Admin Area ----
import AdminLayout from '../layouts/AdminLayout.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import AdminUsersPage from '../pages/admin/AdminUsersPage.jsx';
import AdminProductsPage from '../pages/admin/AdminProductsPage.jsx';
import AdminOffersPage from '../pages/admin/AdminOffersPage.jsx';
import AdminOrdersPage from '../pages/admin/AdminOrdersPage.jsx';
import AdminOrderDetailPage from '../pages/admin/AdminOrderDetailPage.jsx';
import AdminWholesaleOrdersPage from '../pages/admin/AdminWholesaleOrdersPage.jsx';
import AdminWholesaleOrderDetailPage from '../pages/admin/AdminWholesaleOrderDetailPage.jsx';
import AdminReviewsPage from '../pages/admin/AdminReviewsPage.jsx';
import AdminPaymentsPage from '../pages/admin/AdminPaymentsPage.jsx';
import AdminReportsPage from '../pages/admin/AdminReportsPage.jsx';
import AdminAuditLogsPage from '../pages/admin/AdminAuditLogsPage.jsx';
import AdminSettingsPage from '../pages/admin/AdminSettingsPage.jsx';

// ---- Utility Pages ----
import UnauthorizedPage from '../pages/UnauthorizedPage.jsx';
import NotFoundPage from '../pages/NotFoundPage.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register/customer" element={<RegisterCustomerPage />} />
      <Route path="/register/wholesaler" element={<RegisterWholesalerPage />} />

      {/* ===== Customer Area — ProtectedRoute + CustomerLayout as nested routes ===== */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute allowedRoles={['customer']}>
            <CustomerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<CustomerHome />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="product/:id" element={<ProductDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="orders" element={<MyOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="orders/:id/tracking" element={<OrderTrackingPage />} />
        <Route path="invoices" element={<InvoicesListPage />} />
        <Route path="invoices/:orderId" element={<InvoicePage />} />
        <Route path="addresses" element={<AddressesPage />} />
      </Route>

      {/* ===== Wholesaler Area — ProtectedRoute + WholesalerLayout as nested routes ===== */}
      {/*
        WholesalerLayout itself handles the approval-status gate: if wholesalerStatus
        is NOT "approved", it renders a blocking info screen instead of <Outlet />.
        This means any role="wholesaler" user can reach the layout regardless of
        approval status — the layout shows the correct message without wasted API calls.
      */}
      <Route
        path="/wholesaler"
        element={
          <ProtectedRoute allowedRoles={['wholesaler']}>
            <WholesalerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<WholesalerDashboard />} />
        <Route path="products" element={<WholesaleProductsPage />} />
        <Route path="cart" element={<WholesaleCartPage />} />
        <Route path="orders" element={<WholesaleOrdersPage />} />
        <Route path="orders/:id" element={<WholesaleOrderDetailPage />} />
        <Route path="orders/:id/tracking" element={<WholesaleOrderTrackingPage />} />
        <Route path="invoices" element={<WholesaleInvoicesPage />} />
        <Route path="invoices/:orderId" element={<WholesaleInvoiceDetailPage />} />
        <Route path="payments" element={<WholesalePaymentsPage />} />
        <Route path="reports" element={<WholesaleReportsPage />} />
        <Route path="profile" element={<WholesalerProfilePage />} />
      </Route>

      {/* ===== Admin Area — ProtectedRoute + AdminLayout as nested routes ===== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="offers" element={<AdminOffersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="wholesale-orders" element={<AdminWholesaleOrdersPage />} />
        <Route path="wholesale-orders/:id" element={<AdminWholesaleOrderDetailPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* Utility */}
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
