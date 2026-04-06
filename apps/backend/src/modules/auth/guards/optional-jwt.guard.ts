import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<T>(err: Error, user: T): T | null {
    // Khong throw error - tra ve null neu khong co token hop le
    if (err || !user) {
      return null;
    }
    return user;
  }

  canActivate(context: ExecutionContext) {
    // Goi parent canActivate de chay strategy
    return super.canActivate(context);
  }
}
