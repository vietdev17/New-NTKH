import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class RejectOrderDto {
  @IsNotEmpty({ message: 'Ly do tu choi la bat buoc' })
  @IsString()
  @MaxLength(500)
  reason: string;
}
