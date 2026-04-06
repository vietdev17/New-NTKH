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
        title="San Pham Ban Chay"
        subtitle="Nhung san pham duoc ua chuong nhat"
        products={featuredProducts || []}
        viewAllHref="/products?sort=soldCount:desc"
        accent="primary"
      />
      <div className="bg-surface-100/80">
        <ProductSection
          title="San Pham Moi"
          subtitle="Nhung mau noi that moi nhat vua cap ben"
          products={newArrivals || []}
          viewAllHref="/products?sort=createdAt:desc"
          accent="secondary"
        />
      </div>
      <ProductSection
        title="Khuyen Mai Hot"
        subtitle="Giam gia soc - so luong co han"
        products={saleProducts || []}
        viewAllHref="/products?sale=true"
        accent="accent"
      />
      <WhyChooseUs />
    </div>
  );
}
