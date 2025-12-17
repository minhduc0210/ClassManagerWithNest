/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpStatus,
  Res,
  Req,
  UnauthorizedException,
  Put,
  NotFoundException,
  UseGuards,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import express from 'express';
import { LoginDto } from './dto/login.dto';
import { AuthService } from '../auth/auth.service';
import { ChangeInformationDto } from './dto/change-information.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { VerifyPasswordDto } from './dto/verify-password.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body() registerDTO: RegisterDto,
    @Res() res: express.Response,
  ) {
    try {
      const newUser = await this.userService.register(registerDTO);
      return res.status(HttpStatus.CREATED).json({
        message: 'User Created',
        user: newUser,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          errors: [
            {
              path: 'email',
              msg: error.message,
            },
          ],
        });
      }

      if (error instanceof BadRequestException) {
        const responseBody = error.getResponse();
        const messages = (responseBody as { message: string[] }).message;

        const errors = Array.isArray(messages)
          ? messages.map((msg) => ({ path: 'validation', msg }))
          : [{ path: 'validation', msg: error.message }];

        return res.status(HttpStatus.BAD_REQUEST).json({ errors });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: error || 'Internal server error',
      });
    }
  }

  @Post('login')
  async login(@Body() loginDTO: LoginDto, @Res() res: express.Response) {
    try {
      const userData = await this.userService.login(loginDTO);
      return res.status(HttpStatus.OK).json({
        id: userData.id,
        name: userData.name,
        lastname: userData.lastname,
        email: userData.email,
        role: userData.role,
        accessToken: userData.accessToken,
        refreshToken: userData.refreshToken,
      });
    } catch (error) {
      // 3. Xử lý lỗi Unauthorized (401)
      if (error instanceof UnauthorizedException) {
        // Lấy thông báo lỗi (đã được đặt là 'Incorrect email or password')
        const errorMessage =
          (error.getResponse() as any).message || 'Lỗi xác thực.';

        // Trả về HTTP 401 và định dạng lỗi theo Express cũ
        return res.status(HttpStatus.UNAUTHORIZED).json({
          errors: [{ msg: errorMessage }],
        });
      }

      // 4. Xử lý lỗi Server (500)
      console.error(error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
      });
    }
  }

  @Get('logout/:id')
  async logout(
    @Param('id') id: string,
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    try {
      await this.authService.deleteRefreshToken(id);
      return res.status(HttpStatus.OK).json({
        success: true,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: error || 'Internal server error',
      });
    }
  }

  @Post('refreshtoken')
  async refreshToken(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const refreshToken = req.headers['refreshtoken'] as string;
    if (!refreshToken) {
      return res.json({ accessToken: '' });
    }
    try {
      const tokens = await this.authService.refreshToken(refreshToken);
      return res.status(HttpStatus.OK).json(tokens);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json({ message: 'Unauthorized!' });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Unauthorized!' });
    }
  }

  @Get('loggedUser')
  @UseGuards(JwtAuthGuard)
  async getUserInformation(
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    // Lấy ID người dùng đã xác thực từ token
    const userId = req.user.userId;

    try {
      const data = await this.userService.getUserInformation(userId);
      return res.status(HttpStatus.OK).json({
        user: data.user,
        classrooms: data.classrooms,
      });
    } catch (error) {
      // 1. Xử lý lỗi Not Found (404) từ Service
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Not found user!' });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Unauthorized!' });
    }
  }

  @Put(':userID')
  async update(
    @Param('userID') userID: string,
    @Body() changeInfoDto: ChangeInformationDto,
    @Res() res: express.Response,
  ) {
    try {
      if (!userID)
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Not found user!' });
      const user = await this.userService.changeInformation(
        userID,
        changeInfoDto,
      );
      if (!user)
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Not found user!' });
      return res.status(HttpStatus.OK).json(user);
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error || 'Internal server error' });
    }
  }

  @Put('profile/change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = changePasswordDto; // Destructuring từ DTO

    try {
      await this.userService.changePassword(userId, oldPassword, newPassword);

      return res
        .status(HttpStatus.OK)
        .json({ message: 'Password updated successfully' });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: error || 'Internal server error' });
    }
  }

  @Post('reset-password')
  @UseGuards(JwtAuthGuard)
  async resetPassword(
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    const email = req.user.email;
    const tempPassword = await this.userService.resetPassword(email);
    return res.status(HttpStatus.OK).json({
      tempPassword,
      message: 'A temporary password has been sent to your email.',
    });
  }

  @Post('verify-password')
  @UseGuards(JwtAuthGuard)
  async verifyPassword(
    @Body() body: VerifyPasswordDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    const email = req.user.email;
    await this.userService.verifyPassword(
      email,
      body.tempPassword,
      body.newPassword,
    );
    return res.status(HttpStatus.OK).json({
      message: 'Password updated successfully!',
    });
  }
}
