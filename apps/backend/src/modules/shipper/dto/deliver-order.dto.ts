import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class DeliverOrderDto {
  @IsNotEmpty({ message: 'Anh chung minh giao hang la bat buoc' })
  @IsString()
  proofImage: string; // URL anh tu Upload module

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string; // Ghi chu khi giao (VD: "De o bao ve")
}
