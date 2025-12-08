import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RegisterDto } from './dto/register.dto';
import express from 'express';
import { LoginDto } from './dto/login.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
        userData,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        message: error || 'Internal server error',
      });
    }
  }

  @Get()
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
