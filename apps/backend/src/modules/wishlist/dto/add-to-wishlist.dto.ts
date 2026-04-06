import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiProperty({ description: 'ID san pham can them vao wishlist', example: '6615a2b3c4d5e6f7a8b9c0d1' })
  @IsNotEmpty({ message: 'productId khong duoc de trong' })
  @IsMongoId({ message: 'productId phai la ObjectId hop le' })
  productId: string;
}
