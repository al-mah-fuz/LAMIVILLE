import React from 'react';
import { MessageCircle, Phone, Mail, MapPin, Plus, ArrowUp } from 'lucide-react';
import { getActiveSiteConfig, createWhatsAppUrl } from '../../config/site';
import { ProductCategory } from '../../types/database';

interface FooterProps {
  onNavigateStore: (category?: 'all' | ProductCategory) => void;
  onNavigateHome: () => void;
  onOpenAdminLogin: () => void;
  isAdminLoggedIn?: boolean;
  onNavigateAdminDashboard?: () => void;
  isRealtimeConnected?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigateStore,
  onNavigateHome,
  onOpenAdminLogin,
  isAdminLoggedIn = false,
  onNavigateAdminDashboard,
  isRealtimeConnected = true,
}) => {
  const config = getActiveSiteConfig();
  const whatsappUrl = createWhatsAppUrl(config.whatsappNumber, `Hello ${config.brandName}, I would like to make an inquiry.`);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#211C1E] text-[#FAF7F2] pt-16 pb-12 border-t-2 border-t-[#6B1736]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-14 border-b border-[#362E32]">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-4">
            <h2 className="font-serif text-2xl tracking-[0.2em] font-normal uppercase text-[#FAF7F2]">
              {config.brandName}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed font-light">
              {config.shortBio}
            </p>
            <div className="pt-2 flex items-center space-x-2 text-[11px] text-[#D6B36A]">
              <span className={`inline-block w-2 h-2 rounded-full ${isRealtimeConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isRealtimeConnected ? 'Supabase Realtime Live' : 'Supabase Syncing'}</span>
            </div>
          </div>

          {/* Quick Collections Column */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#D6B36A]">
              The Collections
            </h3>
            <ul className="space-y-2.5 text-xs text-neutral-300 font-light">
              <li>
                <button
                  onClick={() => onNavigateStore('all')}
                  className="hover:text-[#D6B36A] transition-colors"
                >
                  All Products
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStore('scarves')}
                  className="hover:text-[#D6B36A] transition-colors"
                >
                  Luxury Scarves & Hijabs
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStore('veils')}
                  className="hover:text-[#D6B36A] transition-colors"
                >
                  Bridal & Ceremonial Veils
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStore('accessories')}
                  className="hover:text-[#D6B36A] transition-colors"
                >
                  Fine Accessories & Magnetic Pins
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigateStore('others')}
                  className="hover:text-[#D6B36A] transition-colors"
                >
                  Signature Boxes & Others
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service & WhatsApp */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#D6B36A]">
              Customer Care
            </h3>
            <ul className="space-y-3 text-xs text-neutral-300 font-light">
              <li>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-[#25D366] transition-colors group"
                  aria-label="Chat on WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0 group-hover:scale-110 transition-transform" />
                  <span>WhatsApp: {config.displayPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:+2349137778916`}
                  className="inline-flex items-center gap-2 hover:text-[#D6B36A] transition-colors group"
                  aria-label="Call customer care"
                >
                  <Phone className="w-4 h-4 text-[#D6B36A] shrink-0 group-hover:scale-110 transition-transform" />
                  <span>Call: {config.displayPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${config.displayEmail}`}
                  className="inline-flex items-center gap-2 hover:text-[#D6B36A] transition-colors group"
                  aria-label="Email customer care"
                >
                  <Mail className="w-4 h-4 text-[#D6B36A] shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{config.displayEmail}</span>
                </a>
              </li>
              <li className="flex items-center gap-2 text-neutral-300">
                <MapPin className="w-4 h-4 text-[#D6B36A] shrink-0" />
                <span>{config.location}</span>
              </li>
            </ul>
          </div>

          {/* Brand Promise & Values */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[#D6B36A]">
              The LAMIVILLE Standard
            </h3>
            <p className="text-xs text-neutral-400 font-light leading-relaxed">
              Every veil is inspected for immaculate draping, and every scarf is chosen for luxurious tactile breathability. We honor traditional modest craftsmanship with contemporary luxury.
            </p>
            <div className="pt-2">
              <button
                onClick={scrollToTop}
                className="inline-flex items-center gap-1.5 text-xs text-[#D6B36A] hover:text-[#FAF7F2] transition-colors border border-[#362E32] hover:border-[#D6B36A] px-3 py-1.5 rounded"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Back to top</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Sub-footer */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 font-light space-y-4 sm:space-y-0">
          <div>
            © {new Date().getFullYear()} {config.brandName} Atelier. All rights reserved.
          </div>

          <div className="flex items-center space-x-6">
            <button onClick={onNavigateHome} className="hover:text-[#D6B36A] transition-colors">
              Home
            </button>
            <button onClick={() => onNavigateStore('all')} className="hover:text-[#D6B36A] transition-colors">
              Store
            </button>
            
            {/* Discreet Admin Access button in footer */}
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
              className="text-[#D6B36A]/60 hover:text-[#D6B36A] transition-colors p-1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
