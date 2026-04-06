import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Return, ReturnSchema } from './schemas/return.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { ShipperLocation, ShipperLocationSchema } from '../shipper/schemas/shipper-location.schema';
import { OrdersService } from './orders.service';
import { ReturnsService } from './returns.service';
import { OrdersController } from './orders.controller';
import { CouponsModule } from '../coupons/coupons.module';
import { SocketModule } from '../socket/socket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Return.name, schema: ReturnSchema },
      { name: Product.name, schema: ProductSchema },
      { name: User.name, schema: UserSchema },
      { name: ShipperLocation.name, schema: ShipperLocationSchema },
    ]),
    forwardRef(() => CouponsModule),
    SocketModule,
    NotificationsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ReturnsService],
  exports: [OrdersService, ReturnsService],
})
export class OrdersModule {}
