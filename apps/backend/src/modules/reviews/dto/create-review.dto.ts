import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsMongoId,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID san pham', example: '6615a2b3c4d5e6f7a8b9c0d1' })
  @IsMongoId()
  productId: string;

  @ApiProperty({ description: 'ID don hang', example: '6615a2b3c4d5e6f7a8b9c0d2' })
  @IsMongoId()
  orderId: string;

  @ApiPropertyOptional({ description: 'SKU bien the trong don hang' })
  @IsString()
  @IsOptional()
  orderItemSku?: string;

  @ApiProperty({ description: 'So sao (1-5)', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Tieu de danh gia', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Noi dung danh gia', maxLength: 2000 })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;

  @ApiPropertyOptional({ description: 'Danh sach URL hinh anh (toi da 5)', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @ArrayMaxSize(5, { message: 'Toi da 5 hinh anh cho moi danh gia' })
  images?: string[];
}
