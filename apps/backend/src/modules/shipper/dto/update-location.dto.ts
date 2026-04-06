import {
  IsNumber,
  IsOptional,
  IsMongoId,
  Min,
  Max,
} from 'class-validator';

export class UpdateLocationDto {
  @IsNumber()
  @Min(-90, { message: 'Latitude phai tu -90 den 90' })
  @Max(90, { message: 'Latitude phai tu -90 den 90' })
  lat: number;

  @IsNumber()
  @Min(-180, { message: 'Longitude phai tu -180 den 180' })
  @Max(180, { message: 'Longitude phai tu -180 den 180' })
  lng: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  accuracy?: number; // Do chinh xac GPS (met)

  /**
   * [FIXED] Truong nay truoc day bi thieu trong DTO.
   * Can de he thong biet shipper dang giao don nao,
   * phuc vu tracking map cho khach hang.
   */
  @IsOptional()
  @IsMongoId()
  currentOrderId?: string;
}
