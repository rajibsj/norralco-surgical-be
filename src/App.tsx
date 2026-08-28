import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProviders } from '@/components/layout/AppProviders';
import { CartProvider } from '@/context/CartProvider';
import HomePage from '@/pages/HomePage';
import NotFoundPage from '@/pages/NotFoundPage';
import CompositionDemoPage from '@/pages/CompositionDemoPage';
import { useAuth } from '@/hooks/useAuth';
import { PageLayout } from '@/components/layout/PageLayout';
import { Skeleton } from '@/components/ui/skeleton';

const ProductsPage = lazy(() => import('@/pages/ProductsPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/RegisterPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const LibraryPage = lazy(() => import('@/pages/LibraryPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <CartProvider>
          <Suspense fallback={<PageLayout><PageLayout.Content><div className="p-6"><Skeleton className="h-40" /></div></PageLayout.Content></PageLayout>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/composition-demo" element={<CompositionDemoPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </CartProvider>
      </AppProviders>
    </BrowserRouter>
  );
}
