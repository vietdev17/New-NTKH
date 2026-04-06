import { IsArray, ValidateNested, IsMongoId, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ReorderItemDto {
  @ApiProperty({ description: 'MongoDB ID cua danh muc' })
  @IsMongoId()
  id: string;

  @ApiProperty({ description: 'Thu tu moi', minimum: 0 })
  @IsNumber()
  @Min(0)
  sortOrder: number;
}

export class ReorderDto {
  @ApiProperty({ description: 'Danh sach cap nhat thu tu', type: [ReorderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReorderItemDto)
  items: ReorderItemDto[];
}
