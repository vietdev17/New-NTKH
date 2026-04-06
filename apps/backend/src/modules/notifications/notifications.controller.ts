import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import { QueryNotificationDto } from './dto/query-notification.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * Lay danh sach notification cua user dang dang nhap
   * Query params: page, limit, unreadOnly, type
   */
  @Get()
  async findAll(@Request() req, @Query() query: QueryNotificationDto) {
    return this.notificationsService.findByUser(
      req.user._id.toString(),
      query,
    );
  }

  /**
   * GET /notifications/unread-count
   * Dem so thong bao chua doc
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(
      req.user._id.toString(),
    );
    return { unreadCount: count };
  }

  /**
   * PATCH /notifications/read-all
   * Danh dau tat ca thong bao da doc
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(
      req.user._id.toString(),
    );
  }

  /**
   * PATCH /notifications/:id/read
   * Danh dau 1 thong bao da doc
   */
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req) {
    return this.notificationsService.markAsRead(
      id,
      req.user._id.toString(),
    );
  }

  /**
   * DELETE /notifications/:id
   * Xoa thong bao
   */
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    await this.notificationsService.delete(id, req.user._id.toString());
    return { message: 'Da xoa thong bao' };
  }
}
