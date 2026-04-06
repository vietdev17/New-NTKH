import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '../auth.service';

/**
 * Lay thong tin user tu JWT payload.
 *
 * Su dung:
 *   @CurrentUser() user: TokenPayload           -> lay toan bo payload
 *   @CurrentUser('sub') userId: string           -> lay userId
 *   @CurrentUser('email') email: string          -> lay email
 *   @CurrentUser('role') role: string            -> lay role
 */
export const CurrentUser = createParamDecorator(
  (field: keyof TokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    if (!user) {
      return null;
    }

    return field ? user[field] : user;
  },
);
