import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  LogOut,
  RefreshCw,
  ExternalLink,
  Sliders,
  DollarSign,
  Package,
  Eye,
  X,
  Database,
  Settings,
  Phone,
  MessageCircle,
  Save,
} from 'lucide-react';
import { Product, ProductCategory, CATEGORIES } from '../../types/database';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  subscribeToProducts,
} from '../../services/productService';
import { uploadProductImage, deleteProductImage } from '../../services/storageService';
import { signOutAdmin } from '../../services/authService';
import { getSupabase } from '../../lib/supabase';
import {
  formatCurrency,
  getActiveSiteConfig,
  saveSiteConfigOverride,
  SiteConfig,
} from '../../config/site';
import { useToast } from '../common/Toast';

interface AdminDashboardProps {
  adminEmail: string;
  onLogout: () => void;
  onViewStorefront: () => void;
  onOpenSetupGuide: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminEmail,
  onLogout,
  onViewStorefront,
  onOpenSetupGuide,
}) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Form State for Add / Edit
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState<number | string>('');
  const [formCategory, setFormCategory] = useState<ProductCategory>('scarves');
  const [formImageUrl, setFormImageUrl] = useState('');

  // Image Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submitting state
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Store Settings State
  const [siteSettings, setSiteSettings] = useState<SiteConfig>(getActiveSiteConfig());
  const [savedSettingsNotice, setSavedSettingsNotice] = useState(false);

  // Load products
  const fetchAdminProducts = async () => {
    setLoading(true);
    const res = await getProducts();
    if (res.error) {
      showToast('Error Loading Products', res.error, 'error');
    } else {
      setProducts(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAdminProducts();
  }, []);

  // Supabase Realtime subscription inside Admin as well
  useEffect(() => {
    const unsubscribe = subscribeToProducts(({ eventType, newProduct, oldProduct }) => {
      if (eventType === 'INSERT' && newProduct) {
        setProducts((prev) => [newProduct, ...prev.filter((p) => p.id !== newProduct.id)]);
      } else if (eventType === 'UPDATE' && newProduct) {
        setProducts((prev) =>
          prev.map((item) => (item.id === newProduct.id ? newProduct : item))
        );
      } else if (eventType === 'DELETE' && oldProduct) {
        setProducts((prev) => prev.filter((item) => item.id !== oldProduct.id));
      }
    });

    return () => unsubscribe();
  }, []);

  // Open modal for Creating new product
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory('scarves');
    setFormImageUrl('');
    setFormError(null);
    setImageUploadError(null);
    setIsProductModalOpen(true);
  };

  // Open modal for Editing existing product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDescription(product.description || '');
    setFormPrice(product.price);
    setFormCategory(product.category);
    setFormImageUrl(product.image_url);
    setFormError(null);
    setImageUploadError(null);
    setIsProductModalOpen(true);
  };

  // Handle Image File Upload to Supabase Storage (Requirement 5)
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);
    setUploadingImage(true);

    const { url, error } = await uploadProductImage(file);
    setUploadingImage(false);

    if (error) {
      setImageUploadError(error);
      showToast('Image Upload Failed', error, 'error');
    } else if (url) {
      setFormImageUrl(url);
      showToast('Image Uploaded', 'Product image successfully stored in Supabase Storage!', 'success');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit Add or Edit Product
  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Product name is required.');
      return;
    }

    const priceNum = Number(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid positive price in Naira (₦).');
      return;
    }

    if (!formImageUrl.trim()) {
      setFormError('Please upload an image or enter a valid image URL.');
      return;
    }

    setSubmitting(true);

    // 5 & 12: Verify that a real Supabase authenticated user exists before inserting
    const supabase = getSupabase();
    if (!supabase) {
      setFormError('Please log in again.');
      showToast('Authentication Required', 'Please log in again.', 'error');
      setSubmitting(false);
      onLogout();
      return;
    }

    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      console.warn('Authentication check failed before product submit:', userError);
      setFormError('Please log in again.');
      showToast('Session Expired', 'Please log in again.', 'error');
      setSubmitting(false);
      onLogout();
      return;
    }

    if (editingProduct) {
      // UPDATE - using only existing columns
      const res = await updateProduct(editingProduct.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        image_url: formImageUrl.trim(),
      });

      setSubmitting(false);

      if (res.error) {
        setFormError(res.error);
        showToast(res.error === 'Please log in again.' ? 'Session Expired' : 'Update Failed', res.error, 'error');
        if (res.error === 'Please log in again.') {
          onLogout();
        }
      } else {
        showToast('Product Updated', `"${formName}" has been successfully updated in Supabase.`, 'success');
        setIsProductModalOpen(false);
      }
    } else {
      // CREATE - using only existing columns in public.products
      const res = await createProduct({
        name: formName.trim(),
        description: formDescription.trim(),
        price: priceNum,
        category: formCategory,
        image_url: formImageUrl.trim(),
      });

      setSubmitting(false);

      if (res.error) {
        setFormError(res.error);
        showToast(res.error === 'Please log in again.' ? 'Session Expired' : 'Creation Failed', res.error, 'error');
        if (res.error === 'Please log in again.') {
          onLogout();
        }
      } else {
        showToast('Product Published', `"${formName}" is now live on the public storefront!`, 'success');
        setIsProductModalOpen(false);
      }
    }
  };

  // Delete product action
  const handleConfirmDelete = async (id: string) => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Session Expired', 'Please log in again.', 'error');
        setIsDeletingId(null);
        onLogout();
        return;
      }
    }

    const productToDelete = products.find((p) => p.id === id);
    setLoading(true);

    // Delete image from storage if available
    if (productToDelete?.image_url) {
      await deleteProductImage(productToDelete.image_url);
    }

    const res = await deleteProduct(id);
    setLoading(false);
    setIsDeletingId(null);

    if (res.error) {
      showToast(res.error === 'Please log in again.' ? 'Session Expired' : 'Delete Failed', res.error, 'error');
      if (res.error === 'Please log in again.') {
        onLogout();
      }
    } else {
      showToast('Product Deleted', 'Item removed from Supabase and public storefront.', 'info');
    }
  };

  // Quick toggle availability directly from table
  const handleToggleAvailability = async (product: Product) => {
    const supabase = getSupabase();
    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showToast('Session Expired', 'Please log in again.', 'error');
        onLogout();
        return;
      }
    }

    // Clean up modal state
    setEditingProduct(null);
  };

  // Save Settings Override
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveSiteConfigOverride(siteSettings);
    setSavedSettingsNotice(true);
    setTimeout(() => setSavedSettingsNotice(false), 3000);
    showToast('Store Settings Saved', 'WhatsApp number, phone number, and brand information updated.', 'success');
  };

  // Sign out
  const handleSignOut = async () => {
    await signOutAdmin();
    onLogout();
  };

  // Stats computation
  const stats = useMemo(() => {
    const total = products.length;
    const categoriesCount = new Set(products.map((p) => p.category)).size;
    const totalValue = products.reduce((acc, p) => acc + Number(p.price || 0), 0);
    return { total, categoriesCount, totalValue };
  }, [products]);

  // Filtered products list for table
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
      }
      return true;
    });
  }, [products, categoryFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-24 text-[#211C1E]">
      {/* Top Admin Navbar */}
      <header className="bg-[#211C1E] text-white sticky top-0 z-30 border-b-2 border-b-[#6B1736]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <span className="font-serif text-xl sm:text-2xl tracking-[0.18em] uppercase text-white font-medium">
                {siteSettings.brandName}
              </span>
              <span className="text-[10px] text-[#D6B36A] tracking-widest uppercase ml-2 px-2 py-0.5 border border-[#D6B36A]/40 rounded font-sans">
                Admin Console
              </span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-neutral-400 pl-4 border-l border-neutral-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Supabase Realtime Live</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1.5 border border-neutral-700 hover:border-[#D6B36A] text-xs text-neutral-300 hover:text-[#D6B36A] rounded flex items-center gap-1.5 transition-colors"
              title="Store Settings (WhatsApp & Phone Number)"
            >
              <Settings className="w-3.5 h-3.5 text-[#D6B36A]" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <button
              onClick={onOpenSetupGuide}
              className="px-3 py-1.5 bg-[#362E32] hover:bg-[#6B1736] text-xs text-[#D6B36A] hover:text-white rounded flex items-center gap-1.5 transition-colors"
              title="View Supabase SQL & Setup Guide"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Supabase Setup</span>
            </button>

            <button
              onClick={onViewStorefront}
              className="px-3 py-1.5 bg-[#D6B36A] text-[#211C1E] hover:bg-[#6B1736] hover:text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </button>

            <button
              onClick={handleSignOut}
              className="p-1.5 text-neutral-400 hover:text-red-400 rounded transition-colors"
              title={`Sign Out (${adminEmail})`}
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        
        {/* Metric Cards Banner */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E8DFD3] p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6064]">Total Products</span>
              <Package className="w-4 h-4 text-[#D6B36A]" />
            </div>
            <p className="font-serif text-3xl text-[#211C1E]">{stats.total}</p>
            <p className="text-[11px] text-neutral-500 mt-1">Live in Supabase database</p>
          </div>

          <div className="bg-white border border-[#E8DFD3] p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6064]">Categories</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="font-serif text-3xl text-emerald-700">{stats.categoriesCount}</p>
            <p className="text-[11px] text-neutral-500 mt-1">Curated fashion collections</p>
          </div>

          <div className="bg-white border border-[#E8DFD3] p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6064]">Catalog Status</span>
              <AlertCircle className="w-4 h-4 text-[#D6B36A]" />
            </div>
            <p className="font-serif text-xl sm:text-2xl text-[#6B1736] font-semibold mt-1">Active Atelier</p>
            <p className="text-[11px] text-neutral-500 mt-1">Live for storefront browsing</p>
          </div>

          <div className="bg-white border border-[#E8DFD3] p-5">
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[#6B6064]">Catalog Value</span>
              <DollarSign className="w-4 h-4 text-[#D6B36A]" />
            </div>
            <p className="font-serif text-2xl text-[#6B1736] font-semibold">{formatCurrency(stats.totalValue)}</p>
            <p className="text-[11px] text-neutral-500 mt-1">Total pieces retail value</p>
          </div>
        </section>

        {/* Action Header & Filters */}
        <section className="bg-white border border-[#E8DFD3] p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl text-[#211C1E]">Product Catalog Management</h2>
              <p className="text-xs text-[#6B6064]">
                Changes made here immediately synchronize to the customer storefront via Supabase Realtime.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAdminProducts}
                className="p-2 border border-[#E8DFD3] hover:border-[#6B1736] text-[#211C1E] transition-colors"
                title="Refresh database"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#D6B36A]' : 'text-[#6B1736]'}`} />
              </button>

              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D6B36A] hover:bg-[#6B1736] text-[#211C1E] hover:text-[#FAF7F2] text-xs uppercase tracking-wider font-semibold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#E8DFD3]">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#D6B36A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title or description..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-neutral-50 border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="w-full py-2 px-3 text-xs bg-neutral-50 border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="scarves">Scarves</option>
                <option value="veils">Veils</option>
                <option value="accessories">Accessories</option>
                <option value="others">Others</option>
              </select>
            </div>
          </div>
        </section>

        {/* Products Table (Desktop & Mobile Friendly) */}
        <section className="bg-white border border-[#E8DFD3] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F4EDE2] text-[#6B6064] uppercase tracking-wider font-semibold border-b border-[#E8DFD3]">
                <tr>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price (₦)</th>
                  <th className="py-3.5 px-4">Date Added</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DFD3]">
                {loading && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-neutral-400">
                      Loading Supabase products...
                    </td>
                  </tr>
                )}

                {!loading && filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[#6B6064] space-y-2">
                      <p className="font-serif text-lg text-[#211C1E]">No products found</p>
                      <p className="text-xs">Click "Add New Product" to publish items to the store.</p>
                    </td>
                  </tr>
                )}

                {!loading &&
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-[#FAF7F2] transition-colors">
                      {/* Image & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 bg-[#F4EDE2] shrink-0 overflow-hidden border border-[#E8DFD3]">
                            <img
                              src={product.image_url || siteSettings.heroImage}
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = siteSettings.heroImage;
                              }}
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <p className="font-medium text-[#211C1E] truncate">{product.name}</p>
                            <p className="text-[11px] text-[#6B6064] line-clamp-1">
                              {product.description || 'No description'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 uppercase tracking-wider text-[11px] font-semibold text-[#6B1736]">
                        {product.category}
                      </td>

                      {/* Price */}
                      <td className="py-3 px-4 font-semibold text-[#6B1736]">
                        {formatCurrency(product.price)}
                      </td>

                      {/* Date Added */}
                      <td className="py-3 px-4 text-[#6B6064]">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live in Store
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          className="p-1.5 text-neutral-600 hover:text-[#6B1736] hover:bg-[#F4EDE2] rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setIsDeletingId(product.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ========================================================
          ADD / EDIT PRODUCT MODAL (Requirement 5 & 6)
          ======================================================== */}
      {isProductModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
        >
          <div className="fixed inset-0" onClick={() => !submitting && setIsProductModalOpen(false)} />

          <div className="relative bg-[#FAF7F2] border border-[#E8DFD3] w-full max-w-2xl shadow-2xl z-10 overflow-hidden my-8">
            <div className="p-6 bg-[#6B1736] text-white flex items-center justify-between">
              <div>
                <h3 id="product-modal-title" className="font-serif text-xl text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-xs text-[#FAF7F2]/80">
                  Save product details directly to Supabase Database & Storage.
                </p>
              </div>

              <button
                onClick={() => setIsProductModalOpen(false)}
                disabled={submitting}
                className="p-1 text-[#FAF7F2]/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Product Name */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Premium Black Chiffon Scarf"
                  className="w-full p-2.5 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
                />
              </div>

              {/* Category & Price Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category (Restricted to: scarves, veils, accessories, others) */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ProductCategory)}
                    className="w-full p-2.5 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none font-medium capitalize"
                  >
                    <option value="scarves">Scarves</option>
                    <option value="veils">Veils</option>
                    <option value="accessories">Accessories</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                {/* Price (₦) */}
                <div>
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                    Price in Naira (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="100"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="8500"
                    className="w-full p-2.5 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Product Image Section (Supabase Storage Upload - Requirement 5) */}
              <div className="space-y-3 pt-2 border-t border-[#E8DFD3]">
                <div className="flex items-center justify-between">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-[#6B6064]">
                    Product Image (Supabase Storage) *
                  </label>
                  <span className="text-[11px] text-[#D6B36A] font-medium">Bucket: product-images</span>
                </div>

                {/* File Upload Trigger */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    id="admin-image-upload"
                  />

                  <label
                    htmlFor="admin-image-upload"
                    className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 border border-[#D6B36A] bg-white text-[#211C1E] hover:bg-[#D6B36A] hover:text-[#211C1E] text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm ${
                      uploadingImage ? 'opacity-50 pointer-events-none' : ''
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-[#6B1736]" />
                    <span>{uploadingImage ? 'Uploading to Supabase Storage...' : 'Upload Image File'}</span>
                  </label>

                  <span className="text-xs text-[#6B6064]">or enter image URL directly:</span>
                </div>

                {/* Direct URL input fallback */}
                <input
                  type="url"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://... image URL or Supabase Storage link"
                  className="w-full p-2.5 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none font-mono"
                />

                {imageUploadError && (
                  <p className="text-xs text-red-600 leading-relaxed">{imageUploadError}</p>
                )}

                {/* Image Preview Box */}
                {formImageUrl && (
                  <div className="flex items-center gap-4 p-3 bg-white border border-[#E8DFD3]">
                    <div className="w-16 h-16 bg-[#F4EDE2] overflow-hidden border border-[#E8DFD3] shrink-0">
                      <img
                        src={formImageUrl}
                        alt="Preview"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={() => setImageUploadError('Image preview failed. Please check URL.')}
                      />
                    </div>
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Image attached
                      </p>
                      <p className="text-[11px] text-neutral-500 font-mono truncate">{formImageUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-neutral-400 hover:text-red-600 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  Description & Fabric Specifications
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Fabric composition, dimensions, drape characteristics, styling notes..."
                  className="w-full p-2.5 text-xs bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-[#E8DFD3] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  disabled={submitting}
                  className="px-5 py-2.5 border border-[#E8DFD3] hover:bg-[#F4EDE2] text-[#6B6064] text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#D6B36A] hover:bg-[#6B1736] text-[#211C1E] hover:text-[#FAF7F2] text-xs font-semibold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Saving to Supabase...' : editingProduct ? 'Save Updates' : 'Publish Product'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
          ======================================================== */}
      {isDeletingId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="fixed inset-0" onClick={() => setIsDeletingId(null)} />
          <div className="relative bg-[#FAF7F2] border border-[#E8DFD3] w-full max-w-sm p-6 shadow-2xl z-10 space-y-4">
            <h3 id="delete-dialog-title" className="font-serif text-xl text-[#211C1E]">Delete Product?</h3>
            <p className="text-xs text-[#6B6064] leading-relaxed">
              Are you sure you want to permanently delete this product? It will be removed from Supabase and disappear live from customer storefronts.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsDeletingId(null)}
                className="px-4 py-2 border border-[#E8DFD3] text-xs font-semibold uppercase tracking-wider text-[#6B6064] hover:bg-[#F4EDE2]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmDelete(isDeletingId)}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold uppercase tracking-wider"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STORE SETTINGS MODAL (Requirement 11, 12, 23: WhatsApp, Phone, Bio)
          ======================================================== */}
      {isSettingsOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="store-settings-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="fixed inset-0" onClick={() => setIsSettingsOpen(false)} />
          <div className="relative bg-[#FAF7F2] border border-[#E8DFD3] w-full max-w-lg p-6 shadow-2xl z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8DFD3] pb-4">
              <div>
                <h3 id="store-settings-title" className="font-serif text-xl text-[#211C1E]">Store Configuration</h3>
                <p className="text-xs text-[#6B6064]">Customize your contact info, WhatsApp number, and brand messaging.</p>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 text-neutral-400 hover:text-[#6B1736]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              {savedSettingsNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settings successfully saved!</span>
                </div>
              )}

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  WhatsApp Number (For Direct Orders & Chat) *
                </label>
                <div className="relative">
                  <MessageCircle className="w-4 h-4 text-[#D6B36A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={siteSettings.whatsappNumber}
                    onChange={(e) => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                    placeholder="2349137778916 (country code + number, no spaces)"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">Used for wa.me links and pre-filled order messages.</p>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  Display Phone Number *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#D6B36A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={siteSettings.displayPhone}
                    onChange={(e) => setSiteSettings({ ...siteSettings, displayPhone: e.target.value })}
                    placeholder="+234 913 777 8916"
                    className="w-full pl-9 pr-3 py-2 bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  Store Email
                </label>
                <input
                  type="email"
                  value={siteSettings.displayEmail}
                  onChange={(e) => setSiteSettings({ ...siteSettings, displayEmail: e.target.value })}
                  placeholder="adetolaniadedeji88@gmail.com"
                  className="w-full p-2 bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  Store Location
                </label>
                <input
                  type="text"
                  value={siteSettings.location}
                  onChange={(e) => setSiteSettings({ ...siteSettings, location: e.target.value })}
                  placeholder="Kwara State, Nigeria"
                  className="w-full p-2 bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  Hero Headline
                </label>
                <input
                  type="text"
                  value={siteSettings.heroHeading}
                  onChange={(e) => setSiteSettings({ ...siteSettings, heroHeading: e.target.value })}
                  className="w-full p-2 bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none font-serif text-sm"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider font-semibold text-[#6B6064] mb-1">
                  Hero Subtitle
                </label>
                <textarea
                  rows={2}
                  value={siteSettings.heroSubtitle}
                  onChange={(e) => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                  className="w-full p-2 bg-white border border-[#E8DFD3] focus:border-[#6B1736] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 border border-[#E8DFD3] hover:bg-[#F4EDE2] text-[#6B6064] uppercase tracking-wider font-semibold"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#D6B36A] hover:bg-[#6B1736] text-[#211C1E] hover:text-[#FAF7F2] uppercase tracking-wider font-semibold shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Settings</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
