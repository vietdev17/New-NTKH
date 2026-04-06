import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsMongoId,
  IsNumber,
  IsBoolean,
  IsArray,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Ten danh muc', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Mo ta danh muc', maxLength: 1000 })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({ description: 'URL anh dai dien danh muc' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({ description: 'ID danh muc cha (MongoDB ID)' })
  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Thu tu hien thi', minimum: 0, default: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Danh muc co hoat dong khong', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'La danh muc combo khong', default: false })
  @IsBoolean()
  @IsOptional()
  isCombo?: boolean;

  @ApiPropertyOptional({ description: 'Cac the tag', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}
