import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Coupon,
  CouponSchema,
} from '../coupons/schemas/coupon.schema';
import {
  ShipperLocation,
  ShipperLocationSchema,
} from '../shipper/schemas/shipper-location.schema';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: Coupon.name, schema: CouponSchema },
      {
        name: ShipperLocation.name,
        schema: ShipperLocationSchema,
      },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
