import { IsOptional, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { UserRole } from '../schemas/user.schema';

export class QueryUserDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Loc theo role', enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Loc theo trang thai active', example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Hien thi ca user da xoa (mac dinh: false)', default: false })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean = false;

  @ApiPropertyOptional({ description: 'Tim kiem theo ten hoac email', example: 'nguyen' })
  @IsOptional()
  @IsString()
  search?: string;
}
