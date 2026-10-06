import heroImg from '../assets/images/lamiville_abstract_silk_scarf_1791313765795.jpg';
import veilImg from '../assets/images/lamiville_sunset_floral_veil_1791313777053.jpg';

export interface SiteConfig {
  brandName: string;
  tagline: string;
  shortBio: string;
  heroHeading: string;
  heroSubtitle: string;
  heroImage: string;
  veilFeatureImage: string;
  currencySymbol: string;
  currencyCode: string;
  whatsappNumber: string; // e.g. "2348000000000" (no +, no spaces for wa.me links)
  displayPhone: string;
  displayEmail: string;
  location: string;
  storageBucket: string;
  socials: {
    instagram: string;
    tiktok: string;
    facebook: string;
  };
}

export const siteConfig: SiteConfig = {
  brandName: 'LAMIVILLE',
  tagline: 'Veils & Accessories · Curated Atelier',
  shortBio: 'Bespoke veils, luxury scarves, and fine accessories curated for grace and modest elegance.',
  heroHeading: 'Elegance in Every Fold',
  heroSubtitle: 'Discover our luxury collection of handcrafted silk scarves, ethereal veils, and refined fashion accessories.',
  heroImage: heroImg,
  veilFeatureImage: veilImg,
  currencySymbol: '₦',
  currencyCode: 'NGN',
  // Active owner contact details:
  whatsappNumber: '2349137778916',
  displayPhone: '+234 913 777 8916',
  displayEmail: 'adetolaniadedeji88@gmail.com',
  location: 'Kwara State, Nigeria',
  storageBucket: 'product-images',
  socials: {
    instagram: 'https://instagram.com',
    tiktok: 'https://tiktok.com',
    facebook: 'https://facebook.com',
  },
};

/**
 * Helper to get active site settings with any runtime overrides saved by the store owner in localStorage.
 */
export function getActiveSiteConfig(): SiteConfig {
  try {
    const saved = localStorage.getItem('lamiville_site_config');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Clean up legacy placeholders if present in browser storage
      if (parsed.whatsappNumber === '2348000000000') {
        parsed.whatsappNumber = siteConfig.whatsappNumber;
      }
      if (parsed.displayPhone === '+234 800 000 0000') {
        parsed.displayPhone = siteConfig.displayPhone;
      }
      if (parsed.displayEmail === 'orders@lamiville.com') {
        parsed.displayEmail = siteConfig.displayEmail;
      }
      if (parsed.location?.includes('Lagos')) {
        parsed.location = siteConfig.location;
      }
      // Ensure latest authentic brand visual images are always loaded
      if (!parsed.heroImage || parsed.heroImage.includes('lamiville_hero_fashion')) {
        parsed.heroImage = siteConfig.heroImage;
      }
      if (!parsed.veilFeatureImage || parsed.veilFeatureImage.includes('lamiville_veil_editorial')) {
        parsed.veilFeatureImage = siteConfig.veilFeatureImage;
      }
      return { ...siteConfig, ...parsed };
    }
  } catch (e) {
    console.error('Failed to load site config override', e);
  }
  return siteConfig;
}

export function saveSiteConfigOverride(overrides: Partial<SiteConfig>): void {
  try {
    const current = getActiveSiteConfig();
    const updated = { ...current, ...overrides };
    localStorage.setItem('lamiville_site_config', JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save site config override', e);
  }
}

/**
 * Format currency in Nigerian Naira ₦
 */
export function formatCurrency(amount: number): string {
  const num = Number(amount) || 0;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Generate clean WhatsApp chat link with optional pre-filled message
 */
export function createWhatsAppUrl(phoneNumber: string, message: string): string {
  const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, '');
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${sanitizedNumber}?text=${encodedText}`;
}
