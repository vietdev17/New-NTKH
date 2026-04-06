import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewStatus } from '../schemas/review.schema';

export class ModerateReviewDto {
  @ApiProperty({
    description: 'Trang thai moderation: approved | rejected | flagged',
    enum: ReviewStatus,
  })
  @IsEnum(ReviewStatus, {
    message: 'Trang thai phai la: approved, rejected, hoac flagged',
  })
  status: ReviewStatus;

  @ApiPropertyOptional({ description: 'Ghi chu cua admin', maxLength: 500 })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  adminNote?: string;
}
