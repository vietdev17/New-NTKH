import { IsArray, ArrayMinSize, ArrayMaxSize, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompareProductsDto {
  @ApiProperty({ type: [String], minItems: 2, maxItems: 4 })
  @IsArray()
  @ArrayMinSize(2, { message: 'Can it nhat 2 san pham' })
  @ArrayMaxSize(4, { message: 'Toi da 4 san pham' })
  @IsMongoId({ each: true })
  productIds: string[];
}
