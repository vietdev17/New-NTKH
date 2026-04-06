import { IsArray, IsMongoId, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckMultipleDto {
  @ApiProperty({
    description: 'Mang cac productId can kiem tra (1-50)',
    type: [String],
    example: ['6615a2b3c4d5e6f7a8b9c0d1', '6615a2b3c4d5e6f7a8b9c0d2'],
  })
  @IsArray({ message: 'productIds phai la mang' })
  @IsMongoId({ each: true, message: 'Moi phan tu phai la ObjectId hop le' })
  @ArrayMinSize(1, { message: 'Phai co it nhat 1 productId' })
  @ArrayMaxSize(50, { message: 'Toi da 50 productIds moi lan kiem tra' })
  productIds: string[];
}
