import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RefreshTokenDocument } from '../user/entities/refresh-token.entity';
import { UserDocument } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel('RefreshToken')
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  createAccessToken(user: UserDocument): string {
    const payload = { _id: user._id, email: user.email, role: user.role };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('SECRET_ACCESS_TOKEN'),
      expiresIn: this.configService.get('ACCESS_TOKEN_EXPIRE'),
    });
  }

  createRefreshToken(user: UserDocument): string {
    const payload = { _id: user._id, email: user.email, role: user.role };
    return this.jwtService.sign(payload, {
      secret: this.configService.get('SECRET_REFRESH_TOKEN'),
      expiresIn: this.configService.get('REFRESH_TOKEN_EXPIRE'),
    });
  }

  async saveRefreshToken(userID: string, refreshToken: string): Promise<void> {
    const userObjectId = new Types.ObjectId(userID);
    const existingToken = await this.refreshTokenModel.findOne({
      user: userObjectId,
    });

    if (existingToken) {
      existingToken.refreshToken = refreshToken;
      await existingToken.save();
    } else {
      await this.refreshTokenModel.create({
        user: userObjectId,
        refreshToken: refreshToken,
      });
    }
  }

  async deleteRefreshToken(userID: string): Promise<void> {
    const result = await this.refreshTokenModel.findOneAndDelete({
      user: userID,
    });

    if (!result) {
      // Trong NestJS, ném Exception thay vì gọi next(new CustomError)
      throw new InternalServerErrorException('Refresh token is not found');
    }
  }
}
