import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
// Kế thừa từ AuthGuard với tên chiến lược là 'jwt'
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info: any) {
    if (err || !user) {
      const message = info instanceof Error ? info.message : 'Unauthorized';
      throw err || new UnauthorizedException(message);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return user;
  }
}
