import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RefreshToken,
  RefreshTokenSchema,
} from '../user/entities/refresh-token.entity';
import { JwtModule } from '@nestjs/jwt';
import { User, UserSchema } from '../user/entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
    ]),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
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
    PassportModule,
    forwardRef(() => UserModule),
  ],
  controllers: [],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
