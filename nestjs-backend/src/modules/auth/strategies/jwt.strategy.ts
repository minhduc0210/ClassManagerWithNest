import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from 'src/modules/user/user.service'; // Giả sử bạn có UserService

// Định nghĩa kiểu dữ liệu cho payload của JWT
interface JwtPayload {
  _id: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService, // Inject UserService
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    super({
      // Lấy JWT từ header 'Authorization: Bearer <token>'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Bỏ qua nếu token hết hạn (chỉ kiểm tra chữ ký)
      ignoreExpiration: false,
      // Secret key để xác thực chữ ký token
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      secretOrKey: configService.get('SECRET_ACCESS_TOKEN'),
    });
  }

  // Phương thức này được gọi sau khi JWT được xác thực thành công
  async validate(payload: JwtPayload) {
    // Tìm người dùng dựa trên ID trong payload
    const user = await this.userService.findById(payload._id);

    if (!user) {
      // Nếu không tìm thấy user, Passport sẽ tự động ném UnauthorizedException
      return null;
    }

    // Trả về đối tượng user hoặc payload.
    // Đối tượng này sẽ được gắn vào request.user
    return { userId: payload._id, email: payload.email, role: payload.role };
  }
}
