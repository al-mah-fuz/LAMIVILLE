import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { CartItem, Product } from '../types/database';
import { getActiveSiteConfig, createWhatsAppUrl, formatCurrency } from '../config/site';

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  generateWhatsAppOrderUrl: (customerNote?: string) => string;
}

const CART_STORAGE_KEY = 'lamiville_cart_v1';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Failed to load cart from storage', e);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  }, [items]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product.id === product.id);
      if (existingIndex > -1) {
        const currentQty = prev[existingIndex].quantity;
        const newQty = currentQty + quantity;
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity: newQty };
        return updated;
      } else {
        return [...prev, { product, quantity }];
      }
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          return {
            ...item,
            quantity: Math.max(1, quantity),
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const totalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((acc, item) => acc + Number(item.product.price) * item.quantity, 0);
  }, [items]);

  const generateWhatsAppOrderUrl = (customerNote?: string): string => {
    const config = getActiveSiteConfig();
    if (items.length === 0) {
      return createWhatsAppUrl(config.whatsappNumber, `Hello ${config.brandName}, I would like to inquire about your collections.`);
    }

    let message = `Hello *${config.brandName}*, I would like to place an order:\n\n`;

    items.forEach((item, index) => {
      const lineTotal = Number(item.product.price) * item.quantity;
      message += `${index + 1}. *${item.product.name}*\n`;
      message += `   Qty: ${item.quantity} × ${formatCurrency(item.product.price)} = *${formatCurrency(lineTotal)}*\n`;
    });

    message += `\n*TOTAL: ${formatCurrency(totalPrice)}*`;

    if (customerNote && customerNote.trim()) {
      message += `\n\n*Note / Delivery Details:*\n${customerNote.trim()}`;
    }

    message += `\n\nPlease let me know account details or how to proceed with payment. Thank you!`;

    return createWhatsAppUrl(config.whatsappNumber, message);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        openCart,
        closeCart,
        generateWhatsAppOrderUrl,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
