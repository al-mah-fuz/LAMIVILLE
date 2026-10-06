/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/common/Toast';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { StorePage } from './components/store/StorePage';
import { CartDrawer } from './components/cart/CartDrawer';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SupabaseSetupGuideModal } from './components/admin/SupabaseSetupGuideModal';
import { WhatsAppFloatingButton } from './components/common/WhatsAppFloatingButton';
import { getActiveSession, subscribeToAuth } from './services/authService';
import { ProductCategory } from './types/database';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'store' | 'admin'>('home');
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>('all');

  // Supabase Auth State
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);

  // Check auth session
  useEffect(() => {
    getActiveSession().then(({ user }) => {
      setAdminUser(user);
    });

    const unsubscribe = subscribeToAuth((user) => {
      setAdminUser(user);
      if (!user && currentView === 'admin') {
        setCurrentView('store');
      }
    });

    return () => unsubscribe();
  }, [currentView]);

  // Public navigation
  const handleNavigateHome = () => {
    setCurrentView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateStore = (category: 'all' | ProductCategory = 'all') => {
    setSelectedCategory(category);
    setCurrentView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin access
  const handleOpenAdminLogin = () => {
    if (adminUser) {
      setCurrentView('admin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleLoginSuccess = () => {
    setIsAdminLoginOpen(false);
    setCurrentView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    setAdminUser(null);
    setCurrentView('store');
  };

  return (
    <ToastProvider>
      <CartProvider>
        <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#211C1E]">
          {/* Main Public Navbar (hidden on admin view for distraction-free workspace) */}
          {currentView !== 'admin' && (
            <Navbar
              currentView={currentView}
              selectedCategory={selectedCategory}
              onNavigateHome={handleNavigateHome}
              onNavigateStore={handleNavigateStore}
              onOpenAdminLogin={handleOpenAdminLogin}
              isAdminLoggedIn={Boolean(adminUser)}
              onNavigateAdminDashboard={() => setCurrentView('admin')}
            />
          )}

          {/* Active View Container */}
          <div className="flex-1">
            {currentView === 'home' && (
              <LandingPage onShopNow={handleNavigateStore} />
            )}

            {currentView === 'store' && (
              <StorePage
                initialCategory={selectedCategory}
                onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
              />
            )}

            {currentView === 'admin' && adminUser && (
              <AdminDashboard
                adminEmail={adminUser.email || 'Admin'}
                onLogout={handleLogout}
                onViewStorefront={() => setCurrentView('store')}
                onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
              />
            )}
          </div>

          {/* Public Footer (hidden on admin view) */}
          {currentView !== 'admin' && (
            <Footer
              onNavigateHome={handleNavigateHome}
              onNavigateStore={handleNavigateStore}
              onOpenAdminLogin={handleOpenAdminLogin}
              isAdminLoggedIn={Boolean(adminUser)}
              onNavigateAdminDashboard={() => setCurrentView('admin')}
              isRealtimeConnected={true}
            />
          )}

          {/* Slide-over Shopping Bag Drawer */}
          <CartDrawer onContinueShopping={() => handleNavigateStore('all')} />

          {/* Floating WhatsApp Button */}
          {currentView !== 'admin' && <WhatsAppFloatingButton />}

          {/* Admin Login Dialog */}
          <AdminLoginModal
            isOpen={isAdminLoginOpen}
            onClose={() => setIsAdminLoginOpen(false)}
            onLoginSuccess={handleLoginSuccess}
            onOpenSetupGuide={() => {
              setIsAdminLoginOpen(false);
              setIsSetupGuideOpen(true);
            }}
          />

          {/* Supabase Setup & SQL Guide Modal */}
          <SupabaseSetupGuideModal
            isOpen={isSetupGuideOpen}
            onClose={() => setIsSetupGuideOpen(false)}
            onConfigUpdated={() => {
              // Trigger reload of products in store
            }}
          />
        </div>
      </CartProvider>
    </ToastProvider>
  );
}
