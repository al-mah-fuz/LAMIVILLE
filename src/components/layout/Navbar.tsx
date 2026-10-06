import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { getActiveSiteConfig, createWhatsAppUrl } from '../../config/site';
import { ProductCategory } from '../../types/database';

interface NavbarProps {
  currentView: 'home' | 'store' | 'admin';
  selectedCategory: 'all' | ProductCategory;
  onNavigateHome: () => void;
  onNavigateStore: (category?: 'all' | ProductCategory) => void;
  onOpenAdminLogin: () => void;
  onOpenSearch?: () => void;
  isAdminLoggedIn?: boolean;
  onNavigateAdminDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  selectedCategory,
  onNavigateHome,
  onNavigateStore,
  onOpenAdminLogin,
  isAdminLoggedIn = false,
  onNavigateAdminDashboard,
}) => {
  const { totalItems, openCart } = useCart();
  const config = getActiveSiteConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (cat: 'all' | ProductCategory) => {
    onNavigateStore(cat);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD3] transition-all">
      {/* Editorial Announcement Bar */}
      <div className="bg-[#6B1736] text-[#FAF7F2] text-xs py-2 px-4 text-center tracking-widest uppercase font-light">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <span className="hidden md:inline text-[11px] text-[#D6B36A] tracking-wider font-medium">
            {config.tagline}
          </span>
          <span className="mx-auto text-[11px] font-normal tracking-widest text-[#FAF7F2]">
            Bespoke Orders & Inquiries via WhatsApp · Worldwide Delivery
          </span>
          <a
            href={`tel:+2349137778916`}
            className="hidden md:inline text-[11px] text-[#FAF7F2]/80 hover:text-[#D6B36A] transition-colors"
          >
            {config.displayPhone}
          </a>
        </div>
      </div>

      {/* Main Nav Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Mobile menu trigger */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#211C1E] hover:text-[#6B1736] transition-colors focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6 text-[#6B1736]" /> : <Menu className="w-6 h-6 text-[#211C1E]" />}
            </button>
          </div>

          {/* Desktop Nav Links (Left side) */}
          <nav className="hidden md:flex items-center space-x-7 text-xs uppercase tracking-widest font-medium text-[#211C1E]">
            <button
              onClick={onNavigateHome}
              className={`hover:text-[#6B1736] transition-colors py-1 relative ${
                currentView === 'home'
                  ? 'text-[#6B1736] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D6B36A]'
                  : 'text-[#6B6064]'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => handleCategoryClick('all')}
              className={`hover:text-[#6B1736] transition-colors py-1 relative ${
                currentView === 'store' && selectedCategory === 'all'
                  ? 'text-[#6B1736] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D6B36A]'
                  : 'text-[#6B6064]'
              }`}
            >
              Shop All
            </button>
            <button
              onClick={() => handleCategoryClick('scarves')}
              className={`hover:text-[#6B1736] transition-colors py-1 relative ${
                currentView === 'store' && selectedCategory === 'scarves'
                  ? 'text-[#6B1736] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D6B36A]'
                  : 'text-[#6B6064]'
              }`}
            >
              Scarves
            </button>
            <button
              onClick={() => handleCategoryClick('veils')}
              className={`hover:text-[#6B1736] transition-colors py-1 relative ${
                currentView === 'store' && selectedCategory === 'veils'
                  ? 'text-[#6B1736] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D6B36A]'
                  : 'text-[#6B6064]'
              }`}
            >
              Veils
            </button>
            <button
              onClick={() => handleCategoryClick('accessories')}
              className={`hover:text-[#6B1736] transition-colors py-1 relative ${
                currentView === 'store' && selectedCategory === 'accessories'
                  ? 'text-[#6B1736] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D6B36A]'
                  : 'text-[#6B6064]'
              }`}
            >
              Accessories
            </button>
            <button
              onClick={() => handleCategoryClick('others')}
              className={`hover:text-[#6B1736] transition-colors py-1 relative ${
                currentView === 'store' && selectedCategory === 'others'
                  ? 'text-[#6B1736] font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D6B36A]'
                  : 'text-[#6B6064]'
              }`}
            >
              Others
            </button>
          </nav>

          {/* Center Brand Identity */}
          <div className="flex-1 text-center md:flex-initial">
            <button
              onClick={onNavigateHome}
              className="group inline-flex flex-col items-center focus:outline-none"
            >
              <span className="font-serif text-2xl sm:text-3xl tracking-[0.22em] font-medium uppercase text-[#6B1736] group-hover:text-[#D6B36A] transition-colors">
                {config.brandName}
              </span>
              <span className="text-[9px] tracking-[0.35em] uppercase text-[#6B6064] -mt-1 font-sans font-light">
                Atelier
              </span>
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-3 sm:space-x-5">
            {/* Quick Go To Shop Button (if on home) */}
            {currentView === 'home' && (
              <button
                onClick={() => onNavigateStore('all')}
                className="hidden lg:inline-flex items-center px-4 py-2 bg-[#D6B36A] text-[#211C1E] text-xs uppercase tracking-widest font-semibold hover:bg-[#6B1736] hover:text-[#FAF7F2] transition-all duration-200 shadow-sm"
              >
                Enter Boutique
              </button>
            )}

            {/* Shopping Bag Button */}
            <button
              onClick={openCart}
              className="relative p-2 text-[#211C1E] hover:text-[#6B1736] transition-colors flex items-center"
              aria-label={`Shopping bag with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5 stroke-[1.7] text-[#D6B36A]" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#6B1736] text-[#FAF7F2] text-[10px] font-semibold w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#FAF7F2]">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Admin Access Button */}
            <button
              onClick={() => {
                if (isAdminLoggedIn && onNavigateAdminDashboard) {
                  onNavigateAdminDashboard();
                } else {
                  onOpenAdminLogin();
                }
              }}
              title={isAdminLoggedIn ? 'Open Admin Dashboard' : 'Admin Portal'}
              aria-label="Admin Portal"
              className="p-1.5 text-[#D6B36A] hover:text-[#6B1736] hover:bg-[#F4EDE2] rounded-full transition-all duration-200"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-t border-[#E8DFD3] px-6 py-6 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-4 text-xs uppercase tracking-widest font-medium text-[#211C1E]">
            <button
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 border-b border-[#E8DFD3]/60 hover:text-[#6B1736]"
            >
              Home
            </button>
            <button
              onClick={() => handleCategoryClick('all')}
              className="text-left py-2 border-b border-[#E8DFD3]/60 hover:text-[#6B1736]"
            >
              Shop All Products
            </button>
            <button
              onClick={() => handleCategoryClick('scarves')}
              className="text-left py-2 border-b border-[#E8DFD3]/60 hover:text-[#6B1736]"
            >
              Scarves
            </button>
            <button
              onClick={() => handleCategoryClick('veils')}
              className="text-left py-2 border-b border-[#E8DFD3]/60 hover:text-[#6B1736]"
            >
              Veils
            </button>
            <button
              onClick={() => handleCategoryClick('accessories')}
              className="text-left py-2 border-b border-[#E8DFD3]/60 hover:text-[#6B1736]"
            >
              Accessories
            </button>
            <button
              onClick={() => handleCategoryClick('others')}
              className="text-left py-2 border-b border-[#E8DFD3]/60 hover:text-[#6B1736]"
            >
              Others
            </button>
            <div className="pt-2 flex items-center justify-between text-[#6B6064] text-[11px]">
              <a
                href={createWhatsAppUrl(config.whatsappNumber, `Hello ${config.brandName}, I'm interested in your collections.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#25D366] transition-colors"
              >
                WhatsApp: {config.displayPhone}
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAdminLoggedIn && onNavigateAdminDashboard) {
                    onNavigateAdminDashboard();
                  } else {
                    onOpenAdminLogin();
                  }
                }}
                className="text-[#D6B36A] hover:text-[#6B1736] flex items-center gap-1 font-medium"
              >
                <Plus className="w-3 h-3" /> Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
