'use client';
import { HeroBanner } from './hero-banner';
import { FeaturedCategories } from './featured-categories';
import { ProductSection } from './product-section';
import { WhyChooseUs } from './why-choose-us';
import { useFeaturedProducts, useNewArrivals, useSaleProducts } from '@/hooks/use-products';
import { useCategoryTree } from '@/hooks/use-categories';

export function HomePage() {
  const { data: featuredProducts } = useFeaturedProducts(8);
  const { data: newArrivals } = useNewArrivals(8);
  const { data: saleProducts } = useSaleProducts(8);
  const { data: categories } = useCategoryTree();

  return (
    <div className="space-y-0">
      <HeroBanner />
      <FeaturedCategories categories={categories || []} />
      <ProductSection
        title="Sản Phẩm Bán Chạy"
        subtitle="Những sản phẩm được ưa chuộng nhất"
        products={featuredProducts || []}
        viewAllHref="/products?sort=soldCount:desc"
        accent="primary"
      />
      <div className="bg-surface-100/80">
        <ProductSection
          title="Sản Phẩm Mới"
          subtitle="Những mẫu nội thất mới nhất vừa cập nhật"
          products={newArrivals || []}
          viewAllHref="/products?sort=createdAt:desc"
          accent="secondary"
        />
      </div>
      <ProductSection
        title="Khuyến Mãi Hot"
        subtitle="Giảm giá sốc - số lượng có hạn"
        products={saleProducts || []}
        viewAllHref="/products?sale=true"
        accent="accent"
      />
      <WhyChooseUs />
    </div>
  );
}
