import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
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
    @InjectModel('User')
    private readonly userModel: Model<UserDocument>,
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
    const userObjectId = new Types.ObjectId(userID);
    const result = await this.refreshTokenModel.findOneAndDelete({
      user: userObjectId,
    });
    if (!result) {
      // Trong NestJS, ném Exception thay vì gọi next(new CustomError)
      throw new InternalServerErrorException('Refresh token is not found');
    }
  }

  async refreshToken(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token!');
    }
    let payload: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('SECRET_REFRESH_TOKEN'),
      });
    } catch (error) {
      throw new UnauthorizedException(error);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const user = await this.userModel.findById(payload._id);
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (!user) {
      throw new UnauthorizedException('Not found user with id.');
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const userObjectId = new Types.ObjectId(user._id);
    const existingRefreshtoken = await this.refreshTokenModel
      .findOne({ user: userObjectId })
      .exec();

    if (
      !existingRefreshtoken ||
      existingRefreshtoken.refreshToken !== refreshToken
    ) {
      throw new UnauthorizedException('Refresh Token not valid.');
    }

    const newAccessToken = this.createAccessToken(user);
    const newRefreshToken = this.createRefreshToken(user);

    await this.saveRefreshToken(user._id.toString(), newRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}
