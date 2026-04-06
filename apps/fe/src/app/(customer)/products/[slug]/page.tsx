'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Heart, Star, ChevronLeft, ChevronRight, Check,
  Shield, Truck, RotateCcw, Share2, Minus, Plus, Package,
  MapPin, Tag, Eye, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PriceDisplay } from '@/components/shared/price-display';
import { ProductCard } from '@/components/customer/product-card';
import { useProduct, useProducts } from '@/hooks/use-products';
import { useCartStore } from '@/stores/use-cart-store';
import { useWishlistStore } from '@/stores/use-wishlist-store';
import type { Product, ProductColor, ProductDimension, ProductVariant } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { data: product, isLoading } = useProduct(params.slug);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(null);
  const [selectedDimId, setSelectedDimId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showFullDesc, setShowFullDesc] = useState(false);

  const { addItem } = useCartStore();
  const { toggle, isWished } = useWishlistStore();

  // Related products — same category
  const categorySlug = (product as any)?.categoryId?.slug;
  const { data: relatedData } = useProducts(
    categorySlug ? { category: categorySlug, limit: 4 } : undefined
  );
  const relatedProducts = ((relatedData as any)?.data || []).filter(
    (p: any) => p._id !== product?._id
  ).slice(0, 4);

  // Derived state
  const p = product as any;

  const colors: ProductColor[] = p?.colors || [];
  const dimensions: ProductDimension[] = p?.dimensions || [];
  const variants: ProductVariant[] = p?.variants || [];

  const selectedColor = colors.find((c) => c.id === selectedColorId) || null;
  const selectedDim = dimensions.find((d) => d.id === selectedDimId) || null;

  // Images — prefer color-specific, fallback to product images
  const images = useMemo(() => {
    if (selectedColor?.images?.length) return selectedColor.images;
    return p?.images?.length ? p.images : ['/images/placeholder.svg'];
  }, [selectedColor, p?.images]);

  // Find matching variant
  const activeVariant = useMemo(() => {
    if (!selectedColorId && !selectedDimId) return null;
    return variants.find(
      (v) =>
        (!selectedColorId || v.colorId === selectedColorId) &&
        (!selectedDimId || v.dimensionId === selectedDimId)
    ) || null;
  }, [selectedColorId, selectedDimId, variants]);

  // Calculate price
  const currentPrice = useMemo(() => {
    if (activeVariant) return activeVariant.price;
    const base = p?.salePrice || p?.basePrice || 0;
    const colorMod = selectedColor?.priceModifier || 0;
    const dimMod = selectedDim?.priceModifier || 0;
    return base + colorMod + dimMod;
  }, [activeVariant, p?.salePrice, p?.basePrice, selectedColor, selectedDim]);

  // Stock
  const currentStock = activeVariant?.stock ?? null;
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  const wished = p ? isWished(p._id) : false;
  const rating = p?.rating || { average: 0, count: 0 };
  const specs = p?.specifications || {};
  const category = p?.categoryId;

  if (isLoading) {
    return (
      <div className="container-custom py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 animate-pulse">
          <div>
            <div className="aspect-square bg-gray-100 rounded-2xl" />
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 w-20 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="space-y-4 py-2">
            <div className="h-5 bg-gray-100 rounded w-1/4" />
            <div className="h-8 bg-gray-100 rounded w-3/4" />
            <div className="h-5 bg-gray-100 rounded w-1/3" />
            <div className="h-10 bg-gray-100 rounded w-1/2" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-2/3" />
            <div className="h-12 bg-gray-100 rounded mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (!p) {
    return (
      <div className="container-custom py-20 text-center">
        <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Khong Tim Thay San Pham</h2>
        <p className="text-gray-500 mb-6">San pham nay khong ton tai hoac da bi xoa.</p>
        <Button asChild><Link href="/products">Quay Lai San Pham</Link></Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      productId: p._id,
      product: {
        _id: p._id,
        name: p.name,
        slug: p.slug,
        images: p.images,
        basePrice: p.basePrice,
        salePrice: p.salePrice,
      },
      ...(activeVariant
        ? {
            variantId: activeVariant.sku,
            variant: {
              _id: activeVariant.sku,
              sku: activeVariant.sku,
              colorName: selectedColor?.name || '',
              colorHex: selectedColor?.hexCode || '',
              dimensionLabel: selectedDim?.label || '',
              price: activeVariant.price,
              stock: activeVariant.stock,
            },
          }
        : {}),
      price: currentPrice,
      quantity,
    });
    toast.success('Da them vao gio hang!');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: p.name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Da copy link san pham!');
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Da copy link san pham!');
      }
    }
  };

  return (
    <div className="container-custom py-6 lg:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 overflow-x-auto no-scrollbar">
        <Link href="/" className="hover:text-primary-600 shrink-0">Trang chu</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-primary-600 shrink-0">San pham</Link>
        {category && (
          <>
            <span>/</span>
            <Link href={`/categories/${category.slug}`} className="hover:text-primary-600 shrink-0">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900 truncate">{p.name}</span>
      </nav>

      {/* === Main Section === */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 border border-gray-100">
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedImageIdx}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <Image
                  src={images[selectedImageIdx] || '/images/placeholder.svg'}
                  alt={p.name}
                  fill
                  className="object-contain p-4"
                  priority
                  unoptimized
                />
              </motion.div>
            </AnimatePresence>

            {p.salePrice && p.salePrice < p.basePrice && (
              <Badge variant="destructive" className="absolute top-4 left-4 text-sm px-3 py-1 shadow-sm">
                -{Math.round(((p.basePrice - p.salePrice) / p.basePrice) * 100)}%
              </Badge>
            )}

            {images.length > 1 && (
              <>
                <button
                  onClick={() => setSelectedImageIdx((i) => (i - 1 + images.length) % images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedImageIdx((i) => (i + 1) % images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            <span className="absolute bottom-3 right-3 text-xs bg-black/50 text-white px-2 py-1 rounded-full">
              {selectedImageIdx + 1} / {images.length}
            </span>
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {images.map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImageIdx(i)}
                  className={cn(
                    'relative h-20 w-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all',
                    i === selectedImageIdx
                      ? 'border-primary-500 shadow-sm'
                      : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                  )}
                >
                  <Image src={img} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="space-y-5">
          {/* Brand + Category */}
          <div className="flex items-center gap-2 flex-wrap">
            {p.brand && (
              <Badge variant="secondary" className="text-xs font-medium">
                {p.brand}
              </Badge>
            )}
            {category && (
              <Link
                href={`/categories/${category.slug}`}
                className="text-xs text-primary-600 hover:underline bg-primary-50 px-2 py-1 rounded"
              >
                {category.name}
              </Link>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
            {p.name}
          </h1>

          {/* Rating + Stats */}
          <div className="flex items-center gap-4 flex-wrap text-sm">
            {rating.average > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        'h-4 w-4',
                        s <= Math.round(rating.average)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                      )}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-900">{rating.average.toFixed(1)}</span>
                <span className="text-gray-500">({rating.count} danh gia)</span>
              </div>
            )}
            {p.totalSold > 0 && (
              <span className="text-gray-500 flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                Da ban {p.totalSold.toLocaleString()}
              </span>
            )}
            <span className="text-gray-400 flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {p.viewCount?.toLocaleString()}
            </span>
          </div>

          {/* Price */}
          <div className="bg-surface-50 rounded-xl p-4 border border-gray-100">
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-primary-600">
                {formatPrice(currentPrice)}
              </span>
              {p.salePrice && p.salePrice < p.basePrice && currentPrice <= p.salePrice && (
                <>
                  <span className="text-lg line-through text-gray-400">{formatPrice(p.basePrice)}</span>
                  <Badge variant="destructive" className="text-xs">
                    -{Math.round(((p.basePrice - p.salePrice) / p.basePrice) * 100)}%
                  </Badge>
                </>
              )}
            </div>
            {activeVariant && currentStock !== null && (
              <p className={cn(
                'text-sm mt-2 font-medium',
                currentStock > 10 ? 'text-success-600' : currentStock > 0 ? 'text-warning-600' : 'text-danger-600'
              )}>
                {currentStock > 10
                  ? `Con hang (${currentStock} san pham)`
                  : currentStock > 0
                  ? `Chi con ${currentStock} san pham`
                  : 'Het hang'}
              </p>
            )}
          </div>

          {/* Short description */}
          {p.shortDescription && (
            <p className="text-gray-600 leading-relaxed">{p.shortDescription}</p>
          )}

          {/* Info badges */}
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
            {p.material && (
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-gray-400" /> {p.material}
              </span>
            )}
            {p.origin && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-gray-400" /> {p.origin}
              </span>
            )}
          </div>

          {/* === Color Selection === */}
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2.5">
                Mau sac {selectedColor && <span className="text-primary-600 font-normal">— {selectedColor.name}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => {
                      setSelectedColorId(color.id === selectedColorId ? null : color.id);
                      setSelectedImageIdx(0);
                    }}
                    disabled={!color.available}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm transition-all',
                      color.id === selectedColorId
                        ? 'border-primary-500 bg-primary-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300',
                      !color.available && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    <span
                      className={cn(
                        'h-5 w-5 rounded-full border',
                        color.hexCode === '#FFFFFF' ? 'border-gray-300' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color.hexCode }}
                    />
                    <span>{color.name}</span>
                    {color.priceModifier > 0 && (
                      <span className="text-xs text-gray-400">+{formatPrice(color.priceModifier)}</span>
                    )}
                    {color.id === selectedColorId && <Check className="h-4 w-4 text-primary-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* === Dimension Selection === */}
          {dimensions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-2.5">
                Kich thuoc {selectedDim && <span className="text-primary-600 font-normal">— {selectedDim.label}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {dimensions.map((dim) => {
                  const dimVariant = selectedColorId
                    ? variants.find((v) => v.colorId === selectedColorId && v.dimensionId === dim.id)
                    : null;
                  const outOfStock = dimVariant && dimVariant.stock === 0;

                  return (
                    <button
                      key={dim.id}
                      onClick={() => setSelectedDimId(dim.id === selectedDimId ? null : dim.id)}
                      disabled={outOfStock || !dim.available}
                      className={cn(
                        'px-4 py-2 rounded-xl border-2 text-sm transition-all',
                        dim.id === selectedDimId
                          ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300',
                        (outOfStock || !dim.available) && 'opacity-30 cursor-not-allowed line-through'
                      )}
                    >
                      <span className="font-medium">{dim.label}</span>
                      {dim.priceModifier > 0 && (
                        <span className="block text-xs text-gray-400 mt-0.5">
                          +{formatPrice(dim.priceModifier)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* === Quantity === */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-2.5">So luong</p>
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-11 w-11 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="h-11 w-14 text-center font-semibold border-x border-gray-200 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="h-11 w-11 flex items-center justify-center hover:bg-gray-50 active:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {totalStock > 0 && (
                <span className="text-sm text-gray-500">{totalStock} san pham co san</span>
              )}
            </div>
          </div>

          {/* === Actions === */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleAddToCart}
              size="lg"
              className="flex-1 gap-2 h-12 text-base shadow-md"
              disabled={activeVariant?.stock === 0}
            >
              <ShoppingCart className="h-5 w-5" />
              Them Vao Gio Hang
            </Button>
            <button
              onClick={() => {
                toggle(p._id);
                toast.success(wished ? 'Da xoa khoi yeu thich' : 'Da them vao yeu thich!');
              }}
              className={cn(
                'h-12 w-12 shrink-0 rounded-lg border-2 inline-flex items-center justify-center transition-colors',
                wished ? 'border-danger-400 bg-danger-50 hover:bg-danger-100' : 'border-gray-300 bg-white hover:bg-gray-50'
              )}
            >
              <Heart className={cn('h-5 w-5', wished ? 'fill-danger-500 text-danger-500' : 'text-gray-700')} />
            </button>
            <button onClick={handleShare} className="h-12 w-12 shrink-0 rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 inline-flex items-center justify-center transition-colors">
              <Share2 className="h-5 w-5 text-gray-700" />
            </button>
          </div>

          {/* === Trust Badges === */}
          <div className="grid grid-cols-3 gap-3 pt-3">
            {[
              { icon: Truck, title: 'Mien phi van chuyen', desc: 'Don tu 2.000.000d' },
              { icon: Shield, title: 'Bao hanh chinh hang', desc: 'Theo nha san xuat' },
              { icon: RotateCcw, title: 'Doi tra 30 ngay', desc: 'Mien phi doi tra' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center p-3 rounded-xl bg-gray-50 border border-gray-100">
                <Icon className="h-5 w-5 text-primary-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-gray-800 leading-tight">{title}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === Product Details Tabs === */}
      <div className="mt-12 lg:mt-16">
        <Tabs defaultValue="description">
          <TabsList className="mb-6 bg-gray-50 p-1 rounded-xl">
            <TabsTrigger value="description" className="rounded-lg">Mo Ta Chi Tiet</TabsTrigger>
            <TabsTrigger value="specs" className="rounded-lg">Thong So Ky Thuat</TabsTrigger>
            <TabsTrigger value="variants" className="rounded-lg">
              Bang Gia ({variants.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-lg">
              Danh Gia ({rating.count})
            </TabsTrigger>
          </TabsList>

          {/* Description */}
          <TabsContent value="description">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
              <div className={cn('text-gray-700 leading-relaxed whitespace-pre-line', !showFullDesc && 'max-h-80 overflow-hidden relative')}>
                {p.description}
                {!showFullDesc && p.description?.length > 500 && (
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
                )}
              </div>
              {p.description?.length > 500 && (
                <button
                  onClick={() => setShowFullDesc(!showFullDesc)}
                  className="flex items-center gap-1 text-primary-600 font-medium text-sm mt-4 hover:underline"
                >
                  {showFullDesc ? 'Thu gon' : 'Xem them'}
                  <ChevronDown className={cn('h-4 w-4 transition-transform', showFullDesc && 'rotate-180')} />
                </button>
              )}
            </div>
          </TabsContent>

          {/* Specifications */}
          <TabsContent value="specs">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {/* Fixed fields */}
                {p.brand && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Thuong hieu</span>
                    <span className="text-sm font-medium text-gray-900">{p.brand}</span>
                  </div>
                )}
                {p.material && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Chat lieu</span>
                    <span className="text-sm font-medium text-gray-900">{p.material}</span>
                  </div>
                )}
                {p.origin && (
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Xuat xu</span>
                    <span className="text-sm font-medium text-gray-900">{p.origin}</span>
                  </div>
                )}

                {/* Dynamic specifications */}
                {Object.entries(specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">{key}</span>
                    <span className="text-sm font-medium text-gray-900">{value as string}</span>
                  </div>
                ))}

                {/* Dimensions list */}
                {dimensions.map((dim) => (
                  <div key={dim.id} className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">Kich thuoc ({dim.label})</span>
                    <span className="text-sm font-medium text-gray-900">
                      {dim.width}x{dim.depth}x{dim.height}cm, {dim.weight}kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Variant price table */}
          <TabsContent value="variants">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">SKU</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Mau sac</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-700">Kich thuoc</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Gia</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-700">Ton kho</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-700">Trang thai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => {
                      const color = colors.find((c) => c.id === v.colorId);
                      const dim = dimensions.find((d) => d.id === v.dimensionId);
                      return (
                        <tr key={v.sku} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="px-4 py-3 text-gray-500 font-mono text-xs">{v.sku}</td>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              {color && (
                                <span
                                  className="h-4 w-4 rounded-full border border-gray-200"
                                  style={{ backgroundColor: color.hexCode }}
                                />
                              )}
                              {color?.name || v.colorId}
                            </span>
                          </td>
                          <td className="px-4 py-3">{dim?.label || v.dimensionId}</td>
                          <td className="px-4 py-3 text-right font-semibold text-primary-600">
                            {formatPrice(v.price)}
                          </td>
                          <td className="px-4 py-3 text-right">{v.stock}</td>
                          <td className="px-4 py-3 text-center">
                            {v.stock > 0 ? (
                              <Badge variant="outline" className="text-success-600 border-success-200 bg-success-50 text-xs">
                                Con hang
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-danger-600 border-danger-200 bg-danger-50 text-xs">
                                Het hang
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:p-8">
              {rating.count > 0 ? (
                <div className="flex items-center gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900">{rating.average.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-1 justify-center">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={cn(
                            'h-4 w-4',
                            s <= Math.round(rating.average) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{rating.count} danh gia</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Star className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Chua co danh gia nao</p>
                  <p className="text-sm text-gray-400 mt-1">Hay la nguoi dau tien danh gia san pham nay</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* === Related Products === */}
      {relatedProducts.length > 0 && (
        <div className="mt-12 lg:mt-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900">San Pham Lien Quan</h2>
            {category && (
              <Link href={`/categories/${category.slug}`} className="text-sm text-primary-600 font-medium hover:underline">
                Xem tat ca →
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {relatedProducts.map((rp: any, i: number) => (
              <motion.div
                key={rp._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProductCard product={rp} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
