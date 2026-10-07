import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  CheckCircle2,
  Database,
  ExternalLink,
} from 'lucide-react';
import { Product, ProductCategory, CATEGORIES } from '../../types/database';
import { getProducts, subscribeToProducts } from '../../services/productService';
import { isSupabaseConfigured, testSupabaseConnection } from '../../lib/supabase';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { useToast } from '../common/Toast';

interface StorePageProps {
  initialCategory?: 'all' | ProductCategory;
  onOpenSetupGuide?: () => void;
}

export const StorePage: React.FC<StorePageProps> = ({
  initialCategory = 'all',
  onOpenSetupGuide,
}) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [selectedCategory, setSelectedCategory] = useState<'all' | ProductCategory>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'name-asc'>('newest');

  // Active Detail Modal Product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Realtime Status
  const [isRealtimeActive, setIsRealtimeActive] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Supabase connection diagnostic
  const [supabaseConnected, setSupabaseConnected] = useState(isSupabaseConfigured());
  const [needsTableSetup, setNeedsTableSetup] = useState(false);

  // Sync prop changes
  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Load products function
  const loadProducts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);

    const configured = isSupabaseConfigured();
    setSupabaseConnected(configured);

    if (!configured) {
      setLoading(false);
      return;
    }

    const res = await getProducts();
    if (res.error) {
      if (res.error.includes('relation "public.products" does not exist') || res.error.includes('42P01')) {
        setNeedsTableSetup(true);
      }
      setError(res.error);
    } else {
      setProducts(res.data || []);
      setNeedsTableSetup(false);
    }
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Verify connection status on mount
  useEffect(() => {
    if (isSupabaseConfigured()) {
      testSupabaseConnection().then((diag) => {
        if (!diag.success && diag.tableExists === false) {
          setNeedsTableSetup(true);
        }
      });
    }
  }, []);

  // Supabase Realtime Subscription (Requirement 9)
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    setIsRealtimeActive(true);

    const unsubscribe = subscribeToProducts(({ eventType, newProduct, oldProduct }) => {
      console.log(`⚡ Realtime event received [${eventType}]:`, { newProduct, oldProduct });

      if (eventType === 'INSERT' && newProduct) {
        setProducts((prev) => {
          // Avoid duplicate additions
          if (prev.some((p) => p.id === newProduct.id)) return prev;
          return [newProduct, ...prev];
        });
        showToast('New Product Added!', `"${newProduct.name}" is now live in the store.`, 'success');
      } else if (eventType === 'UPDATE' && newProduct) {
        setProducts((prev) =>
          prev.map((item) => (item.id === newProduct.id ? newProduct : item))
        );
        // If user is currently looking at this product in modal, sync it live!
        setSelectedProduct((curr) => (curr?.id === newProduct.id ? newProduct : curr));
        showToast('Catalog Updated', `"${newProduct.name}" details were updated.`, 'info');
      } else if (eventType === 'DELETE' && oldProduct) {
        setProducts((prev) => prev.filter((item) => item.id !== oldProduct.id));
        setSelectedProduct((curr) => (curr?.id === oldProduct.id ? null : curr));
        showToast('Catalog Updated', 'A product was removed from the catalog.', 'info');
      }
    });

    return () => {
      setIsRealtimeActive(false);
      unsubscribe();
    };
  }, [showToast]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts(true);
    setTimeout(() => setIsRefreshing(false), 400);
  };

  // Filtered & Sorted Product computation
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // Category filter
        if (selectedCategory !== 'all' && product.category !== selectedCategory) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return Number(a.price) - Number(b.price);
        if (sortBy === 'price-desc') return Number(b.price) - Number(a.price);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        // Default newest
        return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24">
      {/* Editorial Store Header */}
      <section className="bg-[#FAF7F2] border-b border-[#E8DFD3] pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-[#6B1736] font-semibold">
              <span>Boutique Catalog</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#D6B36A]"></span>
              <span className="flex items-center gap-1.5 text-[#6B6064] font-normal">
                <span className={`w-2 h-2 rounded-full ${isRealtimeActive ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                Real-Time Live Sync
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#211C1E]">
              The LAMIVILLE Collection
            </h1>
            <p className="text-xs sm:text-sm text-[#6B6064] font-light max-w-xl">
              Immaculately tailored scarves, cathedral & fingertip veils, and non-snag accessories.
            </p>
          </div>

          {/* Quick Refresh & Counts */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <span className="text-xs text-[#6B6064]">
              Showing <strong className="text-[#211C1E] font-semibold">{filteredProducts.length}</strong> items
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 border border-[#E8DFD3] hover:border-[#6B1736] text-[#211C1E] bg-white transition-colors disabled:opacity-50"
              title="Refresh Catalog from Supabase"
              aria-label="Refresh Catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#D6B36A]' : 'text-[#6B1736]'}`} />
            </button>
          </div>
        </div>
      </section>

      {/* Category Bar & Controls */}
      <div className="sticky top-20 z-20 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DFD3] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          
          {/* Main 4 Categories + All */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Functional Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap ${
                  selectedCategory === 'all'
                    ? 'bg-[#6B1736] text-[#FAF7F2] shadow-sm'
                    : 'bg-white text-[#6B6064] border border-[#E8DFD3] hover:text-[#6B1736] hover:border-[#D6B36A]'
                }`}
              >
                All Products
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold transition-all whitespace-nowrap ${
                    selectedCategory === cat.key
                      ? 'bg-[#6B1736] text-[#FAF7F2] shadow-sm'
                      : 'bg-white text-[#6B6064] border border-[#E8DFD3] hover:text-[#6B1736] hover:border-[#D6B36A]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar & Sorting */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-[#E8DFD3]/60">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#D6B36A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scarves, veils, magnetic pins..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 text-xs"
                >
                  ×
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B6064]" />
              <span className="text-xs text-[#6B6064]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs bg-white border border-[#E8DFD3] py-1.5 px-3 focus:outline-none focus:border-[#6B1736]"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* Main Catalog Grid & States */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Loading State with Skeleton Cards */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white border border-[#E8DFD3] animate-pulse">
                <div className="aspect-[3/4] bg-[#F4EDE2]"></div>
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-[#E8DFD3] w-1/3 rounded"></div>
                  <div className="h-4 bg-[#E8DFD3] w-4/5 rounded"></div>
                  <div className="h-4 bg-[#E8DFD3] w-1/4 rounded"></div>
                  <div className="h-8 bg-[#E8DFD3]/40 w-full mt-3 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-16 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl text-[#211C1E]">Unable to Load Storefront</h3>
            <p className="text-xs text-[#6B6064] leading-relaxed">
              {error}
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => loadProducts()}
                className="px-5 py-2.5 bg-[#D6B36A] text-[#211C1E] text-xs uppercase tracking-wider font-semibold hover:bg-[#6B1736] hover:text-[#FAF7F2] transition-colors"
              >
                Retry Connection
              </button>
              {onOpenSetupGuide && (
                <button
                  onClick={onOpenSetupGuide}
                  className="px-5 py-2.5 border border-[#6B1736] text-[#6B1736] text-xs uppercase tracking-wider font-semibold hover:bg-[#F4EDE2] transition-colors"
                >
                  View Setup Guide
                </button>
              )}
            </div>
          </div>
        )}

        {/* Empty State: No Products Matching Filters */}
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="py-20 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F4EDE2] flex items-center justify-center text-[#D6B36A] border border-[#E8DFD3]">
              <Sparkles className="w-7 h-7 stroke-[1.2]" />
            </div>
            <h3 className="font-serif text-2xl text-[#211C1E]">
              {products.length === 0 ? 'Atelier Collection Updating' : 'No Matching Pieces Found'}
            </h3>
            <p className="text-xs text-[#6B6064] leading-relaxed">
              {products.length === 0
                ? 'Our boutique pieces are currently being curated. Contact us on WhatsApp for custom orders and catalog previews.'
                : `We couldn't find any items matching "${searchQuery || selectedCategory}". Try adjusting your search or category filter.`}
            </p>
            {(searchQuery || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="mt-2 px-6 py-2.5 bg-[#D6B36A] text-[#211C1E] text-xs uppercase tracking-wider font-semibold hover:bg-[#6B1736] hover:text-[#FAF7F2] transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && !error && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}

      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
};
