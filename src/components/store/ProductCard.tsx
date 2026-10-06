import React, { useState } from 'react';
import { ShoppingBag, Eye, MessageCircle, AlertCircle } from 'lucide-react';
import { Product } from '../../types/database';
import { formatCurrency, getActiveSiteConfig, createWhatsAppUrl } from '../../config/site';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView }) => {
  const { addToCart } = useCart();
  const config = getActiveSiteConfig();
  const [imageError, setImageError] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const isOutOfStock = !product.is_available || product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 3;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    setIsAdding(true);
    addToCart(product, 1);
    setTimeout(() => setIsAdding(false), 600);
  };

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const message = `Hello ${config.brandName}, I'm interested in the "${product.name}" (${formatCurrency(product.price)}). Is this available?`;
    const url = createWhatsAppUrl(config.whatsappNumber, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Fallback brand imagery if product image fails to load
  const fallbackImage = config.heroImage;

  return (
    <article
      onClick={() => onQuickView(product)}
      className="group cursor-pointer bg-white border border-[#E8DFD3] flex flex-col justify-between transition-all duration-300 hover:border-[#D6B36A] hover:shadow-lg"
    >
      <div>
        {/* Product Image Area */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#F4EDE2]">
          <img
            src={imageError || !product.image_url ? fallbackImage : product.image_url}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
            loading="lazy"
          />

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-[#FAF7F2]/80 backdrop-blur-[2px] flex items-center justify-center p-4">
              <span className="text-xs uppercase tracking-widest font-semibold px-3 py-1.5 bg-[#211C1E] text-[#FAF7F2]">
                Sold Out
              </span>
            </div>
          )}

          {/* Hover Actions Bar */}
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickView(product);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-[#6B1736] hover:text-[#FAF7F2] text-[#211C1E] text-[11px] font-medium uppercase tracking-wider backdrop-blur-sm transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-[#D6B36A]" />
              <span>Details</span>
            </button>

            <button
              onClick={handleWhatsAppInquiry}
              title="Inquire on WhatsApp"
              className="p-1.5 bg-[#25D366] text-white hover:bg-[#20ba5a] rounded-full transition-colors shadow"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
            </button>
          </div>
        </div>

        {/* Product Details (Zero-Pill Metadata Discipline) */}
        <div className="p-4 space-y-2">
          {/* Category & Stock metadata */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider">
            <span className="font-semibold text-[#6B1736]">{product.category}</span>
            {isLowStock && (
              <span className="text-amber-700 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 text-[#D6B36A]" /> Only {product.stock_quantity} left
              </span>
            )}
          </div>

          {/* Product Name */}
          <h3 className="font-serif text-lg text-[#211C1E] line-clamp-1 group-hover:text-[#6B1736] transition-colors">
            {product.name}
          </h3>

          {/* Price */}
          <p className="text-base font-serif font-semibold text-[#6B1736] tracking-wide">
            {formatCurrency(product.price)}
          </p>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="px-4 pb-4 pt-1">
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-2.5 px-4 text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
            isOutOfStock
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200'
              : isAdding
              ? 'bg-[#6B1736] text-[#FAF7F2]'
              : 'bg-[#D6B36A] text-[#211C1E] hover:bg-[#6B1736] hover:text-[#FAF7F2]'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{isOutOfStock ? 'Out of Stock' : isAdding ? 'Added to Bag!' : 'Add to Bag'}</span>
        </button>
      </div>
    </article>
  );
};
