import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VoteHelpfulDto {
  @ApiProperty({ description: 'true = huu ich, false = khong huu ich' })
  @IsBoolean()
  isHelpful: boolean;
}
