import React from 'react';
import { MessageCircle } from 'lucide-react';
import { getActiveSiteConfig, createWhatsAppUrl } from '../../config/site';

interface WhatsAppFloatingButtonProps {
  customMessage?: string;
}

export const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({ customMessage }) => {
  const config = getActiveSiteConfig();
  const defaultMsg = `Hello ${config.brandName}, I'm interested in your collections.`;
  const url = createWhatsAppUrl(config.whatsappNumber, customMessage || defaultMsg);

  return (
    <aside aria-label="Customer support" className="fixed bottom-6 right-6 z-40">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with LAMIVILLE on WhatsApp"
        className="group flex items-center gap-2.5 bg-[#25D366] text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#20ba5a] transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <MessageCircle className="w-5 h-5 fill-current" />
        <span className="text-sm font-medium tracking-wide">WhatsApp</span>
      </a>
    </aside>
  );
};
