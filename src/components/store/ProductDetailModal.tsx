import React, { useState } from 'react';
import { X, ShoppingBag, MessageCircle, Check, AlertCircle, Shield, Truck } from 'lucide-react';
import { Product } from '../../types/database';
import { formatCurrency, getActiveSiteConfig, createWhatsAppUrl } from '../../config/site';
import { useCart } from '../../context/CartContext';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const config = getActiveSiteConfig();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string>('');
  const [justAdded, setJustAdded] = useState(false);

  if (!product) return null;

  const currentDisplayImage = activeImage || product.image_url;
  const isOutOfStock = !product.is_available || product.stock_quantity <= 0;
  const maxAllowed = Math.max(1, product.stock_quantity);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleWhatsAppInquiry = () => {
    const message = `Hello ${config.brandName}, I'm interested in the "${product.name}" (${formatCurrency(product.price)}). Could you provide more details regarding availability and delivery?`;
    const url = createWhatsAppUrl(config.whatsappNumber, message);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const allImages = [product.image_url].filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-detail-title"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      {/* Background click to dismiss */}
      <div className="fixed inset-0" onClick={onClose}></div>

      {/* Modal Dialog Body */}
      <div className="relative bg-[#FAF7F2] border border-[#E8DFD3] w-full max-w-4xl shadow-2xl z-10 overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-[#FAF7F2]/80 hover:bg-[#6B1736] hover:text-[#FAF7F2] rounded-full transition-colors text-[#211C1E]"
          aria-label="Close product view"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Column: Product Visual Showcase */}
          <div className="bg-[#F4EDE2] p-6 sm:p-8 flex flex-col justify-between">
            <div className="relative aspect-[3/4] overflow-hidden bg-white shadow-sm border border-[#E8DFD3]">
              <img
                src={currentDisplayImage || config.heroImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = config.heroImage;
                }}
                className="w-full h-full object-cover object-center"
              />
              {isOutOfStock && (
                <div className="absolute inset-0 bg-[#FAF7F2]/85 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="text-xs uppercase tracking-widest font-semibold px-4 py-2 bg-[#211C1E] text-[#FAF7F2]">
                    Currently Sold Out
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail switcher if multiple images exist */}
            {allImages.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`w-14 h-14 shrink-0 overflow-hidden border-2 transition-all ${
                      currentDisplayImage === img ? 'border-[#D6B36A]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`view ${idx + 1}`} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Information & Purchase */}
          <div className="p-6 sm:p-8 sm:py-10 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Category & Availability status */}
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-[#6B6064]">
                <span className="font-semibold text-[#6B1736]">{product.category}</span>
                <span>
                  {isOutOfStock ? (
                    <span className="text-red-600 font-medium">Out of stock</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">
                      In Stock ({product.stock_quantity} available)
                    </span>
                  )}
                </span>
              </div>

              {/* Product Title */}
              <h2 id="product-detail-title" className="font-serif text-2xl sm:text-3xl text-[#211C1E] leading-snug">
                {product.name}
              </h2>

              {/* Price */}
              <div className="text-2xl font-serif text-[#6B1736] font-semibold tracking-wide">
                {formatCurrency(product.price)}
              </div>

              {/* Description */}
              <div className="pt-2 border-t border-[#E8DFD3]">
                <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6064] mb-2">
                  Atelier Notes & Description
                </h4>
                <p className="text-xs sm:text-sm text-[#211C1E] leading-relaxed font-light whitespace-pre-line">
                  {product.description || 'Curated luxury fashion item from the LAMIVILLE collection.'}
                </p>
              </div>

              {/* Stock note if low */}
              {product.stock_quantity > 0 && product.stock_quantity <= 4 && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#D6B36A]" />
                  <span>Limited quantity remaining in atelier: only {product.stock_quantity} units available.</span>
                </div>
              )}
            </div>

            {/* Actions: Quantity + Add to Cart + WhatsApp */}
            <div className="space-y-4 pt-4 border-t border-[#E8DFD3]">
              {/* Quantity selector */}
              {!isOutOfStock && (
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-medium text-[#6B6064]">
                    Quantity
                  </span>
                  <div className="flex items-center border border-[#E8DFD3]">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-3 py-1 text-sm text-[#211C1E] hover:bg-[#F4EDE2] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 text-xs font-semibold text-[#211C1E]">{quantity}</span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(maxAllowed, q + 1))}
                      disabled={quantity >= maxAllowed}
                      className="px-3 py-1 text-sm text-[#211C1E] hover:bg-[#F4EDE2] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Primary Buttons */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`w-full py-3.5 px-6 text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-all duration-200 shadow-sm ${
                    isOutOfStock
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                      : justAdded
                      ? 'bg-[#6B1736] text-[#FAF7F2]'
                      : 'bg-[#D6B36A] text-[#211C1E] hover:bg-[#6B1736] hover:text-[#FAF7F2]'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-4 h-4 text-[#D6B36A]" />
                      <span>Added to Shopping Bag</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isOutOfStock ? 'Sold Out' : 'Add to Shopping Bag'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleWhatsAppInquiry}
                  className="w-full py-3.5 px-6 border border-[#25D366] text-[#25D366] hover:bg-[#25D366] hover:text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 transition-colors duration-200"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span>Inquire on WhatsApp</span>
                </button>
              </div>

              {/* Confidence notes */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-[#6B6064]">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-[#D6B36A]" />
                  <span>Authentic Fabric Guarantee</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-[#D6B36A]" />
                  <span>Fast Nationwide Delivery</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
