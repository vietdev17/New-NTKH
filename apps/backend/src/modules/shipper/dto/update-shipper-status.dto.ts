import { IsEnum, IsNotEmpty } from 'class-validator';
import {
  ShipperStatus,
} from '../schemas/shipper-location.schema';

export class UpdateShipperStatusDto {
  @IsNotEmpty()
  @IsEnum(ShipperStatus, {
    message: 'Trang thai phai la: available, busy, offline',
  })
  status: ShipperStatus;
}
