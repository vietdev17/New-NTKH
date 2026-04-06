# CUSTOMER - DANH GIA SAN PHAM

> He thong Thuong Mai Dien Tu Noi That Viet Nam
> File goc: `apps/fe/src/components/reviews/`, `apps/fe/src/app/(customer)/reviews/`
> Viet danh gia, danh sach danh gia, thong ke, lightbox anh, trang ca nhan
> Tech stack: Next.js 14 + TailwindCSS + Framer Motion + react-hook-form + zod
> Phien ban: 1.0 | Cap nhat: 02/04/2026

---

## Muc luc

1. [WriteReviewForm - Viet danh gia](#1-writereviewform---viet-danh-gia)
2. [ReviewsList - Danh sach danh gia](#2-reviewslist---danh-sach-danh-gia)
3. [ReviewCard - Card danh gia](#3-reviewcard---card-danh-gia)
4. [MyReviewsPage - Danh gia cua toi](#4-myreviewspage---danh-gia-cua-toi)
5. [ProductReviewStats - Thong ke danh gia](#5-productreviewstats---thong-ke-danh-gia)
6. [ImageLightbox - Xem anh toan man hinh](#6-imagelightbox---xem-anh-toan-man-hinh)

---

## 1. WriteReviewForm - Viet danh gia

> File: `apps/fe/src/components/reviews/WriteReviewForm.tsx`
> Form viet danh gia san pham: rating 1-5 sao (hover interactive), tieu de, noi dung,
> upload toi da 5 anh (preview grid, xoa tung anh).
> Validation: react-hook-form + zod. On success: invalidate query, toast.

### 1.1 Review Schema (Zod)

```typescript
// apps/fe/src/lib/validations/review.ts
import { z } from 'zod';

export const reviewSchema = z.object({
  rating: z
    .number()
    .min(1, 'Vui long chon so sao danh gia')
    .max(5, 'Danh gia toi da 5 sao'),
  title: z
    .string()
    .max(150, 'Tieu de khong qua 150 ky tu')
    .optional()
    .or(z.literal('')),
  comment: z
    .string()
    .min(20, 'Noi dung danh gia phai co it nhat 20 ky tu')
    .max(2000, 'Noi dung khong qua 2000 ky tu'),
  images: z
    .array(z.instanceof(File))
    .max(5, 'Toi da 5 anh')
    .optional()
    .default([]),
});

export type ReviewFormData = z.infer<typeof reviewSchema>;
```

### 1.2 StarRatingInput Component

```tsx
// apps/fe/src/components/reviews/StarRatingInput.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  error?: string;
}

const RATING_LABELS = [
  '',
  'Rat te',
  'Khong hai long',
  'Binh thuong',
  'Hai long',
  'Tuyet voi',
];

export function StarRatingInput({
  value,
  onChange,
  size = 'lg',
  disabled = false,
  error,
}: StarRatingInputProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const displayValue = hoverValue || value;

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
  };

  const gapClasses = {
    sm: 'gap-0.5',
    md: 'gap-1',
    lg: 'gap-1.5',
  };

  const handleClick = useCallback(
    (star: number) => {
      if (!disabled) {
        onChange(star);
      }
    },
    [disabled, onChange]
  );

  return (
    <div>
      <div className={cn('flex items-center', gapClasses[size])}>
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;

          return (
            <motion.button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => !disabled && setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              whileHover={!disabled ? { scale: 1.2 } : undefined}
              whileTap={!disabled ? { scale: 0.9 } : undefined}
              disabled={disabled}
              className={cn(
                'transition-colors focus:outline-none focus-visible:ring-2',
                'focus-visible:ring-primary-500 rounded',
                disabled ? 'cursor-not-allowed' : 'cursor-pointer'
              )}
              aria-label={`${star} sao - ${RATING_LABELS[star]}`}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'transition-colors duration-150',
                  isFilled
                    ? 'fill-amber-400 text-amber-400'
                    : 'fill-transparent text-gray-300 hover:text-amber-300'
                )}
              />
            </motion.button>
          );
        })}

        {/* Label */}
        {displayValue > 0 && (
          <motion.span
            key={displayValue}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'ml-2 font-medium',
              size === 'lg' ? 'text-base' : 'text-sm',
              displayValue >= 4
                ? 'text-green-600'
                : displayValue >= 3
                ? 'text-amber-600'
                : 'text-red-500'
            )}
          >
            {RATING_LABELS[displayValue]}
          </motion.span>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

### 1.3 WriteReviewForm Component

```tsx
// apps/fe/src/components/reviews/WriteReviewForm.tsx
'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Loader2, Send } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewSchema, type ReviewFormData } from '@/lib/validations/review';
import { reviewService } from '@/services/reviewService';
import { StarRatingInput } from '@/components/reviews/StarRatingInput';
import { Button } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';

interface WriteReviewFormProps {
  productId: string;
  productName: string;
  variantInfo?: string; // "Mau: Oak Natural - Kich thuoc: Standard"
  orderId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WriteReviewForm({
  productId,
  productName,
  variantInfo,
  orderId,
  onSuccess,
  onCancel,
}: WriteReviewFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<
    { file: File; preview: string }[]
  >([]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      comment: '',
      images: [],
    },
  });

  const commentValue = watch('comment') || '';

  // Mutation
  const submitMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const formData = new FormData();
      formData.append('productId', productId);
      formData.append('rating', String(data.rating));
      if (data.title) formData.append('title', data.title);
      formData.append('comment', data.comment);
      if (orderId) formData.append('orderId', orderId);

      imagePreviews.forEach(({ file }) => {
        formData.append('images', file);
      });

      return reviewService.create(formData);
    },
    onSuccess: () => {
      toast.success('Danh gia cua ban da duoc gui thanh cong!');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['productReviewStats', productId] });
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      reset();
      setImagePreviews([]);
      onSuccess?.();
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || 'Gui danh gia that bai. Vui long thu lai.';
      toast.error(message);
    },
  });

  // Xu ly chon anh
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - imagePreviews.length;

    if (files.length > remaining) {
      toast.error(`Chi co the them toi da ${remaining} anh nua`);
    }

    const newFiles = files.slice(0, remaining);
    const newPreviews = newFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // Reset input de co the chon lai cung file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Xoa 1 anh
  const handleRemoveImage = (index: number) => {
    setImagePreviews((prev) => {
      const removed = prev[index];
      URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-1">
        Danh gia san pham
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        {productName}
        {variantInfo && (
          <span className="text-gray-400"> ({variantInfo})</span>
        )}
      </p>

      <form onSubmit={handleSubmit((data) => submitMutation.mutate(data))}>
        <div className="space-y-5">
          {/* === RATING === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Danh gia cua ban <span className="text-red-500">*</span>
            </label>
            <Controller
              name="rating"
              control={control}
              render={({ field }) => (
                <StarRatingInput
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.rating?.message}
                />
              )}
            />
          </div>

          {/* === TIEU DE === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tieu de (tuy chon)
            </label>
            <input
              {...register('title')}
              placeholder="VD: San pham chat luong, dung nhu mo ta"
              className="w-full px-4 py-2.5 text-sm border border-gray-300
                         rounded-lg focus:outline-none focus:ring-2
                         focus:ring-primary-500 focus:border-primary-500"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* === NOI DUNG === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Noi dung danh gia <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('comment')}
              rows={4}
              placeholder="Chia se trai nghiem cua ban ve san pham nay (it nhat 20 ky tu)..."
              className={`w-full px-4 py-2.5 text-sm border rounded-lg resize-none
                focus:outline-none focus:ring-2 focus:ring-primary-500
                ${errors.comment
                  ? 'border-red-400 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500'}`}
            />
            <div className="flex justify-between mt-1">
              {errors.comment ? (
                <p className="text-xs text-red-500">{errors.comment.message}</p>
              ) : (
                <span />
              )}
              <span
                className={`text-xs ${
                  commentValue.length < 20 ? 'text-gray-400' : 'text-green-500'
                }`}
              >
                {commentValue.length}/2000
              </span>
            </div>
          </div>

          {/* === UPLOAD ANH === */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hinh anh (toi da 5)
            </label>

            <div className="flex flex-wrap gap-3">
              {/* Preview cac anh da chon */}
              <AnimatePresence>
                {imagePreviews.map((item, index) => (
                  <motion.div
                    key={item.preview}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg
                               overflow-hidden border border-gray-200 group"
                  >
                    <Image
                      src={item.preview}
                      alt={`Anh danh gia ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60
                                 rounded-full flex items-center justify-center
                                 text-white opacity-0 group-hover:opacity-100
                                 transition-opacity"
                      aria-label={`Xoa anh ${index + 1}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Nut them anh */}
              {imagePreviews.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2
                             border-dashed border-gray-300 flex flex-col
                             items-center justify-center gap-1 text-gray-400
                             hover:border-primary-400 hover:text-primary-500
                             transition-colors"
                  aria-label="Them anh"
                >
                  <ImagePlus className="w-6 h-6" />
                  <span className="text-[10px]">Them anh</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleImageSelect}
              className="hidden"
              aria-hidden="true"
            />

            {errors.images && (
              <p className="mt-1 text-xs text-red-500">
                {errors.images.message}
              </p>
            )}
          </div>

          {/* === BUTTONS === */}
          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={submitMutation.isLoading}
              >
                Huy
              </Button>
            )}
            <Button
              type="submit"
              disabled={submitMutation.isLoading}
              className="gap-2 flex-1 sm:flex-none"
            >
              {submitMutation.isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Dang gui...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Gui danh gia
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}
```

---

## 2. ReviewsList - Danh sach danh gia

> File: `apps/fe/src/components/reviews/ReviewsList.tsx`
> Hien thi danh sach danh gia tren trang chi tiet san pham.
> Gom: thong ke tong hop, filter theo so sao, sort, danh sach ReviewCard, pagination.

```tsx
// apps/fe/src/components/reviews/ReviewsList.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, SlidersHorizontal, PenLine } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import { useAuth } from '@/hooks/useAuth';
import { ProductReviewStats } from '@/components/reviews/ProductReviewStats';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { WriteReviewForm } from '@/components/reviews/WriteReviewForm';
import { Pagination } from '@/components/ui/Pagination';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Moi nhat' },
  { value: 'oldest', label: 'Cu nhat' },
  { value: 'most_helpful', label: 'Huu ich nhat' },
] as const;

const FILTER_OPTIONS = [
  { value: 0, label: 'Tat ca' },
  { value: 5, label: '5 sao' },
  { value: 4, label: '4 sao' },
  { value: 3, label: '3 sao' },
  { value: 2, label: '2 sao' },
  { value: 1, label: '1 sao' },
] as const;

interface ReviewsListProps {
  productId: string;
  productName: string;
}

const PAGE_SIZE = 5;

export function ReviewsList({ productId, productName }: ReviewsListProps) {
  const { user } = useAuth();
  const [filterRating, setFilterRating] = useState(0); // 0 = tat ca
  const [sortBy, setSortBy] = useState<string>('newest');
  const [page, setPage] = useState(1);
  const [showWriteForm, setShowWriteForm] = useState(false);

  // Fetch review stats
  const { data: stats } = useQuery({
    queryKey: ['productReviewStats', productId],
    queryFn: () => reviewService.getStats(productId),
  });

  // Fetch reviews
  const { data, isLoading } = useQuery({
    queryKey: ['reviews', productId, filterRating, sortBy, page],
    queryFn: () =>
      reviewService.getByProduct(productId, {
        rating: filterRating || undefined,
        sort: sortBy,
        page,
        limit: PAGE_SIZE,
      }),
    keepPreviousData: true,
  });

  // Kiem tra xem user co the viet danh gia khong
  const { data: canReviewData } = useQuery({
    queryKey: ['canReview', productId],
    queryFn: () => reviewService.canReview(productId),
    enabled: !!user,
  });

  const reviews = data?.items || [];
  const totalPages = data?.totalPages || 0;

  const handleWriteReview = () => {
    if (!user) {
      // Redirect to login
      window.location.href = `/auth/login?redirect=${window.location.pathname}`;
      return;
    }

    if (!canReviewData?.canReview) {
      return; // Button disabled, message shown
    }

    setShowWriteForm(true);
  };

  return (
    <section id="reviews" className="scroll-mt-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between
                      gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          Danh gia san pham
        </h2>

        {/* Nut viet danh gia */}
        <div>
          {!user ? (
            <Button onClick={handleWriteReview} className="gap-2">
              <PenLine className="w-4 h-4" />
              Viet danh gia
            </Button>
          ) : canReviewData?.canReview ? (
            <Button onClick={handleWriteReview} className="gap-2">
              <PenLine className="w-4 h-4" />
              Viet danh gia
            </Button>
          ) : (
            <div className="text-sm text-gray-500 italic">
              {canReviewData?.reason === 'ALREADY_REVIEWED'
                ? 'Ban da danh gia san pham nay'
                : canReviewData?.reason === 'NOT_PURCHASED'
                ? 'Ban can mua san pham de danh gia'
                : 'Khong the danh gia luc nay'}
            </div>
          )}
        </div>
      </div>

      {/* === FORM VIET DANH GIA === */}
      <AnimatePresence>
        {showWriteForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <WriteReviewForm
              productId={productId}
              productName={productName}
              onSuccess={() => setShowWriteForm(false)}
              onCancel={() => setShowWriteForm(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* === THONG KE DANH GIA === */}
      {stats && (
        <div className="mb-6">
          <ProductReviewStats stats={stats} />
        </div>
      )}

      {/* === FILTER + SORT === */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Filter theo so sao */}
        <div className="flex flex-wrap gap-2 flex-1">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setFilterRating(option.value);
                setPage(1);
              }}
              className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                filterRating === option.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-primary-300'
              }`}
            >
              {option.value > 0 && (
                <Star className="w-3 h-3 inline-block mr-1 fill-current" />
              )}
              {option.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-primary-500
                       bg-white"
            aria-label="Sap xep danh gia"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* === DANH SACH REVIEW === */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <Star className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            Chua co danh gia nao
          </h3>
          <p className="text-sm text-gray-500">
            {filterRating > 0
              ? `Khong co danh gia ${filterRating} sao nao`
              : 'Hay la nguoi dau tien danh gia san pham nay'}
          </p>
        </motion.div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review: any, index: number) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ReviewCard review={review} />
              </motion.div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}
```

---

## 3. ReviewCard - Card danh gia

> File: `apps/fe/src/components/reviews/ReviewCard.tsx`
> Hien thi 1 danh gia: avatar, ten, ngay, sao, variant, tieu de, noi dung,
> anh (grid, click lightbox), vote huu ich (optimistic update), status badge.

```tsx
// apps/fe/src/components/reviews/ReviewCard.tsx
'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, Shield, Clock, XCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/utils';
import { ImageLightbox } from '@/components/reviews/ImageLightbox';
import { cn } from '@/lib/utils';
import type { Review, ReviewStatus } from '@/types';

interface ReviewCardProps {
  review: Review;
  showProductInfo?: boolean; // Trong MyReviewsPage
  showStatus?: boolean;      // Hien thi status badge (cho review cua minh)
}

const STATUS_BADGE_MAP: Record<ReviewStatus, {
  label: string;
  color: string;
  icon: any;
}> = {
  PENDING: { label: 'Cho duyet', color: 'text-amber-600 bg-amber-50', icon: Clock },
  APPROVED: { label: 'Da duyet', color: 'text-green-600 bg-green-50', icon: Shield },
  REJECTED: { label: 'Bi tu choi', color: 'text-red-600 bg-red-50', icon: XCircle },
};

export function ReviewCard({
  review,
  showProductInfo = false,
  showStatus = false,
}: ReviewCardProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Optimistic vote state
  const [localHelpful, setLocalHelpful] = useState(review.helpfulCount);
  const [localUnhelpful, setLocalUnhelpful] = useState(review.unhelpfulCount);
  const [userVote, setUserVote] = useState<'helpful' | 'unhelpful' | null>(
    review.userVote || null
  );

  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: ({
      type,
    }: {
      type: 'helpful' | 'unhelpful';
    }) => reviewService.vote(review.id, type),
    onMutate: ({ type }) => {
      // Optimistic update
      if (userVote === type) {
        // Un-vote
        setUserVote(null);
        if (type === 'helpful') setLocalHelpful((v) => v - 1);
        else setLocalUnhelpful((v) => v - 1);
      } else {
        // Doi vote hoac vote moi
        if (userVote === 'helpful') setLocalHelpful((v) => v - 1);
        if (userVote === 'unhelpful') setLocalUnhelpful((v) => v - 1);

        setUserVote(type);
        if (type === 'helpful') setLocalHelpful((v) => v + 1);
        else setLocalUnhelpful((v) => v + 1);
      }
    },
    onError: () => {
      // Rollback
      setLocalHelpful(review.helpfulCount);
      setLocalUnhelpful(review.unhelpfulCount);
      setUserVote(review.userVote || null);
    },
  });

  const handleOpenLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const isOwnReview = user?.id === review.userId;

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5">
        {/* === HEADER: User info + Rating + Date === */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden
                            bg-gray-100 flex-shrink-0">
              <Image
                src={review.user.avatar || '/images/default-avatar.png'}
                alt={review.user.name}
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {review.user.name}
                </span>
                {isOwnReview && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary-50
                                   text-primary-600 rounded-full font-medium">
                    Ban
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>

          {/* Status badge (neu la review cua minh) */}
          {showStatus && review.status && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium',
                STATUS_BADGE_MAP[review.status]?.color
              )}
            >
              {React.createElement(STATUS_BADGE_MAP[review.status]?.icon, {
                className: 'w-3 h-3',
              })}
              {STATUS_BADGE_MAP[review.status]?.label}
            </div>
          )}
        </div>

        {/* === STARS === */}
        <div className="flex items-center gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={cn(
                'w-4 h-4',
                star <= review.rating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-transparent text-gray-300'
              )}
            />
          ))}
        </div>

        {/* Variant info */}
        {review.variantInfo && (
          <p className="text-xs text-gray-400 mb-2">
            {review.variantInfo}
          </p>
        )}

        {/* === TITLE + COMMENT === */}
        {review.title && (
          <h4 className="font-semibold text-gray-800 text-sm mb-1">
            {review.title}
          </h4>
        )}
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>

        {/* === IMAGES GRID === */}
        {review.images && review.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {review.images.slice(0, 5).map((img: string, index: number) => (
              <button
                key={index}
                onClick={() => handleOpenLightbox(index)}
                className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg
                           overflow-hidden border border-gray-200
                           hover:opacity-80 transition-opacity focus:outline-none
                           focus-visible:ring-2 focus-visible:ring-primary-500"
                aria-label={`Xem anh danh gia ${index + 1}`}
              >
                <Image
                  src={img}
                  alt={`Anh danh gia ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
                {/* Badge "+N" cho anh cuoi */}
                {index === 4 && review.images.length > 5 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center
                                  justify-center">
                    <span className="text-white font-bold text-sm">
                      +{review.images.length - 5}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* === PRODUCT INFO (trong MyReviewsPage) === */}
        {showProductInfo && review.product && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100
                            flex-shrink-0">
              <Image
                src={review.product.image}
                alt={review.product.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 line-clamp-1">
                {review.product.name}
              </p>
              {review.variantInfo && (
                <p className="text-xs text-gray-400">{review.variantInfo}</p>
              )}
            </div>
          </div>
        )}

        {/* === HELPFUL VOTE BUTTONS === */}
        {!showStatus && (
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs text-gray-400">Huu ich?</span>

            <button
              onClick={() => voteMutation.mutate({ type: 'helpful' })}
              disabled={isOwnReview || !user}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full',
                'transition-colors border',
                userVote === 'helpful'
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'text-gray-500 border-gray-200 hover:border-green-200 hover:text-green-600',
                (isOwnReview || !user) && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="Danh gia nay huu ich"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              Huu ich ({localHelpful})
            </button>

            <button
              onClick={() => voteMutation.mutate({ type: 'unhelpful' })}
              disabled={isOwnReview || !user}
              className={cn(
                'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full',
                'transition-colors border',
                userVote === 'unhelpful'
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'text-gray-500 border-gray-200 hover:border-red-200 hover:text-red-600',
                (isOwnReview || !user) && 'opacity-50 cursor-not-allowed'
              )}
              aria-label="Danh gia nay khong huu ich"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
              Khong ({localUnhelpful})
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && review.images && (
        <ImageLightbox
          images={review.images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
```

---

## 4. MyReviewsPage - Danh gia cua toi

> File: `apps/fe/src/app/(customer)/reviews/page.tsx`
> Danh sach tat ca danh gia cua user. Filter theo status, actions: sua, xoa.
> Link den trang san pham.

```tsx
// apps/fe/src/app/(customer)/reviews/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, Edit2, Trash2, Loader2, AlertTriangle, MessageSquare,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewService } from '@/services/reviewService';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { toast } from '@/components/ui/Toast';
import type { ReviewStatus } from '@/types';

const STATUS_TABS = [
  { key: 'ALL', label: 'Tat ca' },
  { key: 'PENDING', label: 'Cho duyet' },
  { key: 'APPROVED', label: 'Da duyet' },
  { key: 'REJECTED', label: 'Bi tu choi' },
] as const;

export default function MyReviewsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch reviews
  const { data, isLoading } = useQuery({
    queryKey: ['myReviews', activeTab],
    queryFn: () =>
      reviewService.getMyReviews({
        status: activeTab === 'ALL' ? undefined : (activeTab as ReviewStatus),
      }),
  });

  const reviews = data?.items || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (reviewId: string) => reviewService.delete(reviewId),
    onSuccess: () => {
      toast.success('Da xoa danh gia thanh cong');
      queryClient.invalidateQueries({ queryKey: ['myReviews'] });
      setShowDeleteConfirm(false);
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Khong the xoa danh gia. Vui long thu lai.');
    },
  });

  const handleDeleteClick = (reviewId: string) => {
    setDeleteId(reviewId);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
        Danh gia cua toi
      </h1>

      {/* === TAB NAVIGATION === */}
      <div className="border-b border-gray-200 mb-6 -mx-4 px-4 overflow-x-auto">
        <nav className="flex gap-1 min-w-max" role="tablist" aria-label="Loc theo trang thai">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap
                transition-colors ${
                  activeTab === tab.key
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="activeReviewTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5
                             bg-primary-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* === DANH SACH === */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <MessageSquare className="w-16 h-16 mx-auto text-gray-200 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-1">
            Chua co danh gia nao
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {activeTab !== 'ALL'
              ? `Ban chua co danh gia nao o trang thai "${
                  STATUS_TABS.find((t) => t.key === activeTab)?.label
                }"`
              : 'Ban chua viet danh gia nao. Hay mua hang va chia se trai nghiem!'}
          </p>
          <Link href="/products">
            <Button>Kham pha san pham</Button>
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="relative">
              <ReviewCard
                review={review}
                showProductInfo
                showStatus
              />

              {/* Action buttons */}
              <div className="flex gap-2 mt-2 ml-auto justify-end">
                {/* Sua (chi khi pending) */}
                {review.status === 'PENDING' && (
                  <Link href={`/reviews/${review.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Sua
                    </Button>
                  </Link>
                )}

                {/* Xoa */}
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 text-xs text-red-600 border-red-200
                             hover:bg-red-50"
                  onClick={() => handleDeleteClick(review.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xoa
                </Button>

                {/* Link den san pham */}
                {review.product && (
                  <Link href={`/products/${review.product.slug}`}>
                    <Button variant="ghost" size="sm" className="text-xs">
                      Xem san pham
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* === DELETE CONFIRMATION DIALOG === */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!deleteMutation.isLoading) {
                  setShowDeleteConfirm(false);
                  setDeleteId(null);
                }
              }}
              className="fixed inset-0 bg-black/50 z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6"
                   role="dialog" aria-modal="true">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center
                                  justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">Xoa danh gia</h3>
                    <p className="text-sm text-gray-500">
                      Ban co chac chan muon xoa danh gia nay?
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteId(null);
                    }}
                    disabled={deleteMutation.isLoading}
                  >
                    Huy
                  </Button>
                  <Button
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleConfirmDelete}
                    disabled={deleteMutation.isLoading}
                  >
                    {deleteMutation.isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Xoa'
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
```

---

## 5. ProductReviewStats - Thong ke danh gia

> File: `apps/fe/src/components/reviews/ProductReviewStats.tsx`
> Hien thi thong ke tong hop: diem trung binh (so lon), sao, tong so danh gia,
> 5 thanh ngang (bar chart) phan tram moi muc sao. Animated bars on mount.

```tsx
// apps/fe/src/components/reviews/ProductReviewStats.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewStatsData {
  averageRating: number;
  totalReviews: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

interface ProductReviewStatsProps {
  stats: ReviewStatsData;
}

export function ProductReviewStats({ stats }: ProductReviewStatsProps) {
  const { averageRating, totalReviews, distribution } = stats;

  // Tinh phan tram moi muc sao
  const getPercentage = (count: number) =>
    totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
        {/* === DIEM TRUNG BINH === */}
        <div className="flex flex-col items-center justify-center sm:min-w-[140px]">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-5xl font-bold text-gray-800"
          >
            {averageRating.toFixed(1)}
          </motion.span>

          {/* 5 sao */}
          <div className="flex items-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={cn(
                  'w-5 h-5',
                  star <= Math.round(averageRating)
                    ? 'fill-amber-400 text-amber-400'
                    : star - 0.5 <= averageRating
                    ? 'fill-amber-400/50 text-amber-400'
                    : 'fill-transparent text-gray-300'
                )}
              />
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-1">
            {totalReviews} danh gia
          </p>
        </div>

        {/* === DISTRIBUTION BARS === */}
        <div className="flex-1 space-y-2.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = distribution[star as keyof typeof distribution] || 0;
            const percentage = getPercentage(count);

            return (
              <div key={star} className="flex items-center gap-3">
                {/* Label */}
                <button
                  className="flex items-center gap-1 text-sm text-gray-600
                             hover:text-primary-600 transition-colors
                             whitespace-nowrap w-12"
                  aria-label={`Loc ${star} sao`}
                >
                  {star}
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </button>

                {/* Bar */}
                <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{
                      duration: 0.8,
                      delay: (5 - star) * 0.1,
                      ease: 'easeOut',
                    }}
                    className={cn(
                      'h-full rounded-full',
                      star >= 4
                        ? 'bg-green-400'
                        : star === 3
                        ? 'bg-amber-400'
                        : 'bg-red-400'
                    )}
                  />
                </div>

                {/* Count */}
                <span className="text-xs text-gray-500 w-10 text-right">
                  {percentage}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

---

## 6. ImageLightbox - Xem anh toan man hinh

> File: `apps/fe/src/components/reviews/ImageLightbox.tsx`
> Full-screen image viewer: navigation arrows, thumbnail strip, pinch-to-zoom mobile,
> close button + Esc key, Framer Motion transitions.

```tsx
// apps/fe/src/components/reviews/ImageLightbox.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex = 0,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentImage = images[currentIndex];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < images.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (canPrev) goToPrev();
          break;
        case 'ArrowRight':
          if (canNext) goToNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Khoa scroll trang
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [canPrev, canNext, onClose]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
    setScale(1);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(images.length - 1, prev + 1));
    setScale(1);
  }, [images.length]);

  const handleZoomIn = () => {
    setScale((s) => Math.min(s + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale((s) => Math.max(s - 0.5, 1));
  };

  // Swipe gesture (mobile)
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100;
    if (info.offset.x > threshold && canPrev) {
      goToPrev();
    } else if (info.offset.x < -threshold && canNext) {
      goToNext();
    }
    setIsDragging(false);
  };

  // Touch pinch-to-zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let initialDistance = 0;
    let initialScale = 1;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialDistance = Math.sqrt(dx * dx + dy * dy);
        initialScale = scale;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const newScale = initialScale * (distance / initialDistance);
        setScale(Math.max(1, Math.min(3, newScale)));
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [scale]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Xem anh"
    >
      {/* === TOP BAR === */}
      <div className="flex items-center justify-between p-3 sm:p-4">
        <span className="text-white/70 text-sm">
          {currentIndex + 1} / {images.length}
        </span>

        <div className="flex items-center gap-2">
          {/* Zoom controls (desktop) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 text-white/70 hover:text-white
                         disabled:opacity-30 transition-colors"
              aria-label="Thu nho"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="text-white/50 text-xs w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="p-2 text-white/70 hover:text-white
                         disabled:opacity-30 transition-colors"
              aria-label="Phong to"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white
                       hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Dong"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* === MAIN IMAGE === */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center justify-center
                   overflow-hidden select-none"
      >
        {/* Navigation arrows */}
        {canPrev && (
          <button
            onClick={goToPrev}
            className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3
                       bg-black/40 hover:bg-black/60 text-white
                       rounded-full transition-colors"
            aria-label="Anh truoc"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {canNext && (
          <button
            onClick={goToNext}
            className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3
                       bg-black/40 hover:bg-black/60 text-white
                       rounded-full transition-colors"
            aria-label="Anh tiep theo"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Image with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            drag={scale === 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.3}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="relative w-full h-full flex items-center justify-center
                       cursor-grab active:cursor-grabbing"
            style={{
              transform: `scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.2s ease',
            }}
          >
            <Image
              src={currentImage}
              alt={`Anh ${currentIndex + 1}`}
              fill
              className="object-contain pointer-events-none"
              sizes="100vw"
              priority
              quality={90}
            />
          </motion.div>
        </AnimatePresence>

        {/* Click outside image to close */}
        <div
          className="absolute inset-0 -z-10"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        />
      </div>

      {/* === THUMBNAIL STRIP === */}
      {images.length > 1 && (
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-center gap-2 overflow-x-auto
                          max-w-full pb-1">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentIndex(index);
                  setScale(1);
                }}
                className={cn(
                  'relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden',
                  'flex-shrink-0 border-2 transition-all',
                  index === currentIndex
                    ? 'border-white opacity-100 scale-105'
                    : 'border-transparent opacity-50 hover:opacity-80'
                )}
                aria-label={`Xem anh ${index + 1}`}
                aria-current={index === currentIndex ? 'true' : 'false'}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
```

---

## Tong ket cac file va component

| Component | File | Chuc nang |
|-----------|------|-----------|
| `WriteReviewForm` | `components/reviews/WriteReviewForm.tsx` | Form viet danh gia: sao, text, upload anh |
| `StarRatingInput` | `components/reviews/StarRatingInput.tsx` | Input chon sao 1-5, hover interactive, label |
| `ReviewsList` | `components/reviews/ReviewsList.tsx` | Danh sach danh gia: stats, filter, sort, pagination |
| `ReviewCard` | `components/reviews/ReviewCard.tsx` | Card 1 danh gia: user, sao, anh, vote huu ich |
| `MyReviewsPage` | `app/(customer)/reviews/page.tsx` | Trang danh gia cua toi: filter status, sua/xoa |
| `ProductReviewStats` | `components/reviews/ProductReviewStats.tsx` | Thong ke: diem trung binh, bar chart distribution |
| `ImageLightbox` | `components/reviews/ImageLightbox.tsx` | Xem anh full-screen: nav, zoom, pinch, thumbnails |
| Review validation | `lib/validations/review.ts` | Zod schema cho form danh gia |

> **Dac diem ky thuat:**
> - `StarRatingInput`: Framer Motion scale animation, keyboard accessible, rating labels.
> - `ReviewCard`: Optimistic update cho vote huu ich/khong huu ich.
> - `ImageLightbox`: Pinch-to-zoom tren mobile, swipe chuyen anh, Esc key dong, keyboard navigation.
> - `ProductReviewStats`: Animated bar chart tren mount bang Framer Motion.
> - Tat ca component deu responsive (mobile-first), ho tro screen reader (aria-label, role).
> - React Query `invalidateQueries` de cap nhat data sau khi gui/xoa danh gia.
