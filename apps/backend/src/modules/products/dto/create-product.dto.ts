import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  IsEnum,
  ValidateNested,
  IsMongoId,
  Min,
  MaxLength,
  IsBoolean,
  Matches,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '../../products/schemas/product.schema';

// ----- Sub DTO: Color -----
export class CreateColorDto {
  @ApiProperty({ description: 'Ten mau sac' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Ma hex mau sac, dang #RRGGBB', example: '#FF5733' })
  @IsString()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'hexCode phai co dang #RRGGBB' })
  hexCode: string;

  @ApiPropertyOptional({ description: 'Nhom mau' })
  @IsString()
  @IsOptional()
  colorFamily?: string;

  @ApiPropertyOptional({ description: 'Phu phi theo mau (VND)', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priceModifier?: number;

  @ApiPropertyOptional({ description: 'Danh sach URL anh cho mau nay', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: 'Mau sac co hien thi khong', default: true })
  @IsBoolean()
  @IsOptional()
  available?: boolean;
}

// ----- Sub DTO: Dimension -----
export class CreateDimensionDto {
  @ApiProperty({ description: 'Nhan kich thuoc, e.g. "Nho", "Lon", "120x60x75cm"' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ description: 'Chieu rong (cm)', minimum: 0 })
  @IsNumber()
  @Min(0)
  width: number;

  @ApiProperty({ description: 'Chieu sau (cm)', minimum: 0 })
  @IsNumber()
  @Min(0)
  depth: number;

  @ApiProperty({ description: 'Chieu cao (cm)', minimum: 0 })
  @IsNumber()
  @Min(0)
  height: number;

  @ApiPropertyOptional({ description: 'Can nang (kg)', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'Phu phi theo kich thuoc (VND)', default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  priceModifier?: number;

  @ApiPropertyOptional({ description: 'Kich thuoc co hien thi khong', default: true })
  @IsBoolean()
  @IsOptional()
  available?: boolean;
}

// ----- Sub DTO: SeoMeta -----
export class SeoMetaDto {
  @ApiPropertyOptional({ description: 'Meta title (toi da 70 ky tu)', maxLength: 70 })
  @IsString()
  @IsOptional()
  @MaxLength(70)
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'Meta description (toi da 160 ky tu)', maxLength: 160 })
  @IsString()
  @IsOptional()
  @MaxLength(160)
  metaDescription?: string;

  @ApiPropertyOptional({ description: 'Meta keywords', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  metaKeywords?: string[];
}

// ----- Main DTO -----
export class CreateProductDto {
  @ApiProperty({ description: 'Ten san pham', maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  name: string;

  @ApiPropertyOptional({ description: 'Mo ta ngan', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  shortDescription?: string;

  @ApiPropertyOptional({ description: 'Mo ta day du (HTML)' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'ID danh muc san pham' })
  @IsMongoId()
  categoryId: string;

  @ApiPropertyOptional({ description: 'ID danh muc combo (neu la san pham combo)' })
  @IsMongoId()
  @IsOptional()
  comboCategoryId?: string;

  @ApiProperty({ description: 'Gia co ban (VND)', minimum: 0 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ description: 'Gia von (VND)', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Thuong hieu' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiPropertyOptional({ description: 'Chat lieu' })
  @IsString()
  @IsOptional()
  material?: string;

  @ApiPropertyOptional({ description: 'Xuat xu' })
  @IsString()
  @IsOptional()
  origin?: string;

  @ApiPropertyOptional({ description: 'Danh sach URL anh san pham', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiPropertyOptional({ description: 'Danh sach mau sac', type: [CreateColorDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateColorDto)
  @IsOptional()
  colors?: CreateColorDto[];

  @ApiPropertyOptional({ description: 'Danh sach kich thuoc', type: [CreateDimensionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDimensionDto)
  @IsOptional()
  dimensions?: CreateDimensionDto[];

  @ApiPropertyOptional({ description: 'Thong so ky thuat', type: 'object' })
  @IsObject()
  @IsOptional()
  specifications?: Record<string, string>;

  @ApiPropertyOptional({ description: 'Trang thai san pham', enum: ProductStatus })
  @IsEnum(ProductStatus)
  @IsOptional()
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Cac the tag', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Thong tin SEO', type: SeoMetaDto })
  @ValidateNested()
  @Type(() => SeoMetaDto)
  @IsOptional()
  seo?: SeoMetaDto;
}
