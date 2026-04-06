import { IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { UploadCategory } from '../schemas/uploaded-file.schema';

export class QueryUploadDto {
  @IsOptional()
  @IsEnum(UploadCategory)
  category?: UploadCategory;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
