import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import {
  ShipperLocation,
  ShipperLocationSchema,
} from './schemas/shipper-location.schema';
import { ShipperService } from './shipper.service';
import { ShipperLocationService } from './shipper-location.service';
import { ShipperController } from './shipper.controller';
import { AdminShipperController } from './admin-shipper.controller';
import { SocketModule } from '../socket/socket.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: ShipperLocation.name, schema: ShipperLocationSchema },
    ]),
    SocketModule,
    NotificationsModule,
    OrdersModule,
  ],
  controllers: [ShipperController, AdminShipperController],
  providers: [ShipperService, ShipperLocationService],
  exports: [ShipperService, ShipperLocationService],
})
export class ShipperModule {}
