import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency, getActiveSiteConfig } from '../../config/site';

interface CartDrawerProps {
  onContinueShopping: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onContinueShopping }) => {
  const {
    items,
    totalItems,
    totalPrice,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    generateWhatsAppOrderUrl,
  } = useCart();

  const [customerNote, setCustomerNote] = useState('');
  const config = getActiveSiteConfig();

  if (!isCartOpen) return null;

  const handleCheckoutWhatsApp = () => {
    const url = generateWhatsAppOrderUrl(customerNote);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] border-l border-[#E8DFD3] shadow-2xl flex flex-col justify-between">
          
          {/* Header */}
          <div className="p-6 border-b border-[#E8DFD3] flex items-center justify-between bg-white">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D6B36A]" />
              <h2 id="cart-drawer-title" className="font-serif text-xl text-[#211C1E] tracking-wider uppercase">
                Shopping Bag ({totalItems})
              </h2>
            </div>
            <button
              onClick={closeCart}
              className="p-1.5 text-neutral-400 hover:text-[#6B1736] hover:bg-[#F4EDE2] rounded-full transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#D6B36A]">
                  <ShoppingBag className="w-8 h-8 stroke-[1.2]" />
                </div>
                <h3 className="font-serif text-2xl text-[#211C1E]">Your Bag Is Empty</h3>
                <p className="text-xs text-[#6B6064] max-w-xs mx-auto leading-relaxed">
                  Explore our luxury scarves, delicate veils, and handcrafted pins to add items to your bag.
                </p>
                <button
                  onClick={() => {
                    closeCart();
                    onContinueShopping();
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#D6B36A] text-[#211C1E] text-xs uppercase tracking-widest font-semibold hover:bg-[#6B1736] hover:text-[#FAF7F2] transition-all shadow-sm"
                >
                  <span>Explore Boutique</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#6B6064] pb-1">
                  <span>Review your selected items</span>
                  <button
                    onClick={clearCart}
                    className="hover:text-red-600 transition-colors underline"
                  >
                    Clear All
                  </button>
                </div>

                {items.map(({ product, quantity }) => (
                  <div
                    key={product.id}
                    className="flex gap-4 p-3 bg-white border border-[#E8DFD3] hover:border-[#D6B36A] transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-20 h-24 bg-[#F4EDE2] shrink-0 overflow-hidden">
                      <img
                        src={product.image_url || config.heroImage}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = config.heroImage;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-[#6B1736] font-semibold">
                              {product.category}
                            </span>
                            <h4 className="font-serif text-sm text-[#211C1E] line-clamp-1">
                              {product.name}
                            </h4>
                          </div>
                          <button
                            onClick={() => removeFromCart(product.id)}
                            className="text-neutral-400 hover:text-red-600 transition-colors p-1"
                            title="Remove item"
                            aria-label={`Remove ${product.name} from bag`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-[#6B1736] mt-1">
                          {formatCurrency(product.price)}
                        </p>
                      </div>

                      {/* Quantity Stepper & Line Total */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100">
                        <div className="flex items-center border border-[#E8DFD3]">
                          <button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            className="px-2 py-0.5 text-xs text-neutral-600 hover:bg-[#F4EDE2]"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="px-3 py-0.5 text-xs font-medium text-[#211C1E]">{quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= 50}
                            className="px-2 py-0.5 text-xs text-neutral-600 hover:bg-[#F4EDE2] disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-medium text-[#211C1E]">
                          Subtotal: {formatCurrency(Number(product.price) * quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Optional Customer Note / Delivery destination */}
                <div className="pt-2">
                  <label htmlFor="customer-order-note" className="block text-xs font-medium text-[#6B6064] uppercase tracking-wider mb-1">
                    Order Note / Delivery City (Optional)
                  </label>
                  <textarea
                    id="customer-order-note"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. Please deliver to Abuja or specify custom veil length..."
                    className="w-full text-xs p-2.5 bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none resize-none h-16"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer & Order Actions */}
          {items.length > 0 && (
            <div className="p-6 bg-white border-t border-[#E8DFD3] space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-[#6B6064]">
                  <span>Items count:</span>
                  <span>{totalItems} items</span>
                </div>
                <div className="flex justify-between text-[#6B6064]">
                  <span>Delivery fee:</span>
                  <span>Calculated on WhatsApp by location</span>
                </div>
                <div className="flex justify-between text-base font-serif font-semibold text-[#6B1736] pt-2 border-t border-[#E8DFD3]">
                  <span>Estimated Total:</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              {/* Checkout on WhatsApp */}
              <button
                onClick={handleCheckoutWhatsApp}
                className="w-full py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span>Order via WhatsApp ({config.brandName})</span>
              </button>

              <button
                onClick={() => {
                  closeCart();
                  onContinueShopping();
                }}
                className="w-full py-3 px-6 border border-[#6B1736] text-[#6B1736] hover:bg-[#F4EDE2] text-xs uppercase tracking-widest font-medium transition-colors text-center"
              >
                Continue Shopping
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#6B6064]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D6B36A]" />
                <span>Orders confirmed directly by atelier on WhatsApp</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
