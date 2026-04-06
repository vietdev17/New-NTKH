import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { ComparisonResult, ComparisonProduct } from './interfaces/comparison-result.interface';

@Injectable()
export class ComparisonService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async compare(productIds: string[]): Promise<ComparisonResult> {
    if (!productIds || productIds.length < 2) {
      throw new BadRequestException('Can it nhat 2 san pham de so sanh');
    }
    if (productIds.length > 4) {
      throw new BadRequestException('Chi so sanh toi da 4 san pham');
    }

    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length !== productIds.length) {
      throw new BadRequestException('Khong duoc trung san pham');
    }

    const products = await this.productModel
      .find({
        _id: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      })
      .populate('categoryId', 'name slug')
      .lean();

    if (products.length !== uniqueIds.length) {
      const foundIds = products.map((p) => p._id.toString());
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `Khong tim thay san pham: ${missingIds.join(', ')}`,
      );
    }

    const normalizedProducts: ComparisonProduct[] = products.map((p: any) => {
      const prices = (p.variants || []).map((v: any) => v.price);
      return {
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        image: p.images?.[0] || '',
        basePrice: p.basePrice,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : p.basePrice,
          max: prices.length > 0 ? Math.max(...prices) : p.basePrice,
        },
        brand: p.brand || '',
        material: p.material || '',
        origin: p.origin || '',
        colors: p.colors || [],
        dimensions: p.dimensions || [],
        specifications: p.specifications || {},
        rating: {
          average: p.rating?.average || 0,
          count: p.rating?.count || 0,
        },
        totalSold: p.totalSold || 0,
      };
    });

    const comparisonFields = this.findDifferingFields(normalizedProducts);

    return { products: normalizedProducts, comparisonFields };
  }

  private findDifferingFields(products: ComparisonProduct[]): string[] {
    const diffFields: string[] = [];
    const fields = ['basePrice', 'brand', 'material', 'origin', 'totalSold'];

    for (const field of fields) {
      const values = products.map((p) => (p as any)[field]);
      if (new Set(values.map(String)).size > 1) {
        diffFields.push(field);
      }
    }

    const allSpecKeys = new Set<string>();
    products.forEach((p) => Object.keys(p.specifications).forEach((k) => allSpecKeys.add(k)));

    for (const key of allSpecKeys) {
      const values = products.map((p) => p.specifications[key] || '');
      if (new Set(values).size > 1) {
        diffFields.push(`specifications.${key}`);
      }
    }

    return diffFields;
  }
}
