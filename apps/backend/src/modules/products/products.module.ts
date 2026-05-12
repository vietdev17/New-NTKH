import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schemas/product.schema';
import { Category, CategorySchema } from '../categories/schemas/category.schema';
import { Review, ReviewSchema } from '../reviews/schemas/review.schema';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ComparisonService } from './comparison.service';
import { FakeReviewGeneratorService } from '../reviews/services/fake-review-generator.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Review.name, schema: ReviewSchema },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ComparisonService, FakeReviewGeneratorService],
  exports: [ProductsService, ComparisonService],
})
export class ProductsModule {}
