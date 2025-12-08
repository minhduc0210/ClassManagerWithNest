import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '../user/entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        // Cấu hình SECRET cho Access Token
        secret: configService.get('SECRET_ACCESS_TOKEN'),
        signOptions: {
          // Cấu hình expires mặc định nếu cần (hoặc cấu hình cụ thể trong service)
          expiresIn: configService.get('ACCESS_TOKEN_EXPIRE'),
        },
      }),
    }),
  ],
  controllers: [],
  providers: [AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
