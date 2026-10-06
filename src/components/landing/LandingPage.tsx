import React from 'react';
import { ArrowRight, Sparkles, MessageCircle, ShieldCheck, HeartHandshake, Compass } from 'lucide-react';
import { getActiveSiteConfig, createWhatsAppUrl } from '../../config/site';
import { ProductCategory, CATEGORIES } from '../../types/database';

interface LandingPageProps {
  onShopNow: (category?: 'all' | ProductCategory) => void;
  featuredProductsCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onShopNow }) => {
  const config = getActiveSiteConfig();
  const whatsappUrl = createWhatsAppUrl(
    config.whatsappNumber,
    `Hello ${config.brandName}, I would like to inquire about bespoke veils and scarves.`
  );

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* ========================================================
          1. HERO SECTION (Simple, Elegant, Fashion Visual, SHOP NOW)
          ======================================================== */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:py-24 border-b border-[#E8DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Brand Statement & Shop CTA */}
            <div className="lg:col-span-6 space-y-6 lg:space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F4EDE2] border border-[#E8DFD3] text-[#6B1736] text-[11px] uppercase tracking-[0.25em] font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#D6B36A]" />
                <span>Atelier Modest Fashion</span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight text-[#211C1E] leading-[1.12] font-normal">
                {config.heroHeading}
              </h1>

              <p className="text-base sm:text-lg text-[#6B6064] font-light leading-relaxed max-w-xl">
                {config.heroSubtitle}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                {/* PROMINENT SHOP NOW BUTTON */}
                <button
                  onClick={() => onShopNow('all')}
                  className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D6B36A] text-[#211C1E] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#6B1736] hover:text-[#FAF7F2] transition-all duration-300 shadow-md hover:shadow-lg active:scale-[0.99]"
                >
                  <span>SHOP NOW</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => onShopNow('veils')}
                  className="inline-flex items-center justify-center px-8 py-4 border border-[#6B1736] text-[#6B1736] text-xs uppercase tracking-[0.2em] font-medium hover:bg-[#6B1736] hover:text-[#FAF7F2] transition-all duration-200"
                >
                  <span>Explore Veils</span>
                </button>
              </div>

              {/* Quiet Micro Brand Features */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-[#E8DFD3] text-xs text-[#6B6064]">
                <div>
                  <p className="font-serif text-lg text-[#211C1E] font-medium">Premium</p>
                  <p className="text-[11px] font-light">Korean Chiffon & Silk</p>
                </div>
                <div>
                  <p className="font-serif text-lg text-[#211C1E] font-medium">Bespoke</p>
                  <p className="text-[11px] font-light">Bridal & Event Veils</p>
                </div>
                <div>
                  <p className="font-serif text-lg text-[#211C1E] font-medium">Realtime</p>
                  <p className="text-[11px] font-light">Live Boutique Catalog</p>
                </div>
              </div>
            </div>

            {/* Right Column: Fashion Visual Area */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative border frame */}
                <div className="absolute -inset-3 border border-[#D6B36A]/40 -z-10 translate-x-3 translate-y-3 hidden sm:block"></div>

                {/* Primary Hero Fashion Visual */}
                <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-[#F4EDE2] shadow-xl">
                  <img
                    src={config.heroImage}
                    alt="LAMIVILLE luxury silk scarf styling"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                    loading="eager"
                  />
                  
                  {/* Subtle Floating Editorial Tag */}
                  <div className="absolute bottom-6 left-6 right-6 bg-[#FAF7F2]/95 backdrop-blur-md p-4 border border-[#E8DFD3] shadow-sm">
                    <p className="text-[10px] uppercase tracking-widest text-[#6B1736] font-semibold">
                      Curated Atelier
                    </p>
                    <p className="font-serif text-base text-[#211C1E] mt-0.5">
                      Pure Silk Chiffon & Hand-Finished Hemlines
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================
          2. THE FOUR CORE CATEGORIES (Direct Navigation to Store)
          ======================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-[#6B1736] font-semibold">
            Explore By Category
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#211C1E] font-normal">
            Refined Essentials For Every Occasion
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6064] font-light">
            Select a collection to browse real-time inventory and pricing in our boutique.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.key}
              onClick={() => onShopNow(cat.key)}
              className="group cursor-pointer bg-[#F4EDE2]/60 border border-[#E8DFD3] p-6 flex flex-col justify-between hover:bg-[#FAF7F2] hover:border-[#6B1736] hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#6B1736] text-[#D6B36A] flex items-center justify-center group-hover:bg-[#D6B36A] group-hover:text-[#211C1E] transition-colors">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-2xl text-[#211C1E] group-hover:text-[#6B1736] transition-colors">
                  {cat.label}
                </h3>
                <p className="text-xs text-[#6B6064] font-light leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="pt-8 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#6B1736] group-hover:text-[#D6B36A]">
                <span>Shop {cat.label}</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================
          3. EDITORIAL VEIL & BESPOKE SPOTLIGHT
          ======================================================== */}
      <section className="bg-[#F4EDE2] py-20 border-y border-[#E8DFD3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 order-2 lg:order-1">
              <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-neutral-200 shadow-lg border border-[#E8DFD3]">
                <img
                  src={config.veilFeatureImage}
                  alt="LAMIVILLE Bespoke Veil Craftsmanship"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>

            <div className="lg:col-span-6 order-1 lg:order-2 space-y-6 lg:pl-6">
              <p className="text-xs uppercase tracking-[0.25em] text-[#6B1736] font-semibold">
                Bridal & Bespoke
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#211C1E] font-normal leading-tight">
                Handcrafted Veils For Unforgettable Moments
              </h2>
              <p className="text-sm text-[#6B6064] font-light leading-relaxed">
                From delicate fingertip veils to regal cathedral lengths encrusted with soft pearls and French Chantilly lace, each piece is designed to drape with breathtaking lightness.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button
                  onClick={() => onShopNow('veils')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#D6B36A] text-[#211C1E] text-xs uppercase tracking-widest font-semibold hover:bg-[#6B1736] hover:text-[#FAF7F2] transition-all shadow-sm"
                >
                  <span>View Veil Catalog</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#25D366] text-white text-xs uppercase tracking-widest font-semibold hover:bg-[#20ba5a] transition-all"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Custom Veil Inquiry</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          4. BRAND PILLARS (Clean, subtle, high quality)
          ======================================================== */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#D6B36A] border border-[#E8DFD3]">
              <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl text-[#211C1E]">Uncompromising Quality</h3>
            <p className="text-xs text-[#6B6064] font-light leading-relaxed">
              We exclusively select non-slip chiffon, high-grade mulberry silk blends, and snag-free magnetic hardware.
            </p>
          </div>

          <div className="p-6 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#D6B36A] border border-[#E8DFD3]">
              <HeartHandshake className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl text-[#211C1E]">Dedicated Styling Care</h3>
            <p className="text-xs text-[#6B6064] font-light leading-relaxed">
              Direct consultation via WhatsApp for color matching, veil length advice, and bespoke accessory pairings.
            </p>
          </div>

          <div className="p-6 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#D6B36A] border border-[#E8DFD3]">
              <Compass className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-xl text-[#211C1E]">Live Realtime Stock</h3>
            <p className="text-xs text-[#6B6064] font-light leading-relaxed">
              Our inventory updates dynamically in real-time. When a piece is ready, it appears instantly in the store.
            </p>
          </div>
        </div>

        {/* Final CTA Bar */}
        <div className="mt-12 text-center p-10 bg-[#6B1736] text-[#FAF7F2] shadow-xl">
          <h2 className="font-serif text-3xl font-light">Experience The LAMIVILLE Atelier</h2>
          <p className="text-xs text-[#FAF7F2]/80 font-light mt-2 max-w-md mx-auto">
            Browse our full range of scarves, veils, magnetic pins, and accessories.
          </p>
          <button
            onClick={() => onShopNow('all')}
            className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 bg-[#D6B36A] text-[#211C1E] text-xs uppercase tracking-[0.2em] font-semibold hover:bg-[#FAF7F2] hover:text-[#6B1736] transition-all duration-300 shadow-md"
          >
            <span>ENTER THE STORE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};
