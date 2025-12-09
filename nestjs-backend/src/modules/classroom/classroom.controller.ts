/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Body,
  Param,
  InternalServerErrorException,
  ConflictException,
  HttpStatus,
  UseGuards,
  Res,
  Req,
  NotFoundException,
  Get,
  BadRequestException,
  Patch,
  Put,
  Delete,
} from '@nestjs/common';
import express from 'express';
import { ClassroomService } from './classroom.service';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/role.guard';
import { UpdateClassroomDto } from './dto/update-classroom.dto';

interface AuthenticatedRequest extends Request {
  user: { userId: string; email: string; role: string };
}

@Controller('classrooms')
export class ClassroomController {
  constructor(private readonly classroomService: ClassroomService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async create(
    @Body() createClassroomDto: CreateClassroomDto,
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    try {
      const teacherID = req.user.userId;
      const newClassroom = await this.classroomService.create(
        createClassroomDto,
        teacherID,
      );
      return res.status(HttpStatus.OK).json({
        success: true,
        classroom: newClassroom,
      });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 11000) {
        throw new ConflictException({
          statusCode: HttpStatus.CONFLICT,
          message:
            'Dữ liệu trùng lặp. Mã truy cập hoặc trường duy nhất khác đã tồn tại.',
        });
      }
      console.error(error);
      throw new InternalServerErrorException(
        'Không thể tạo lớp học do lỗi server nội bộ.',
      );
    }
  }

  @Post('join/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('student')
  async joinClassroom(
    @Param('code') code: string,
    @Req()
    req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    try {
      const studentID = req.user.userId;
      await this.classroomService.joinClassroom(code, studentID);
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res.status(400).json({
          errors: [
            {
              path: 'classroomCode',
              msg: 'Classroom not found. Please check the access code.',
            },
          ],
        });
      }
      if (error instanceof ConflictException) {
        return res.status(400).json({
          errors: [
            {
              path: 'classroomCode',
              msg: 'You have already joined this classroom.',
            },
          ],
        });
      }
      return res.status(500).json({
        errors: [
          {
            path: 'classroomCode',
            msg: 'Something went wrong. Please try again later.',
          },
        ],
      });
    }
  }

  @Get(':classroomID')
  @UseGuards(JwtAuthGuard)
  async getClassroomInformation(
    @Param('classroomID') classroomID: string,
    @Res() res: express.Response,
  ) {
    try {
      const classroom =
        await this.classroomService.getClassroomInfo(classroomID);
      return res.status(HttpStatus.OK).json({ data: classroom });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Invalid ID format' });
      }
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: 'Classroom not found' });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Something went wrong while fetching classroom info',
      });
    }
  }

  @Patch('/:classroomID/:studentID')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async removeStudent(
    @Param('classroomID') classroomID: string,
    @Param('studentID') studentID: string,
    @Res() res: express.Response,
  ): Promise<any> {
    try {
      await this.classroomService.removeStudent(classroomID, studentID);
      return res.status(HttpStatus.OK).json({ success: true });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ success: false, message: 'ID không hợp lệ.' });
      }
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ success: false, message: error.message });
      }
      console.error('Error removing student from classroom:', error);
      throw new InternalServerErrorException(
        'Có lỗi xảy ra khi xóa học sinh khỏi lớp.',
      );
    }
  }

  @Put('/:classroomID')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async changeClassroomInformation(
    @Param('classroomID') classroomID: string,
    @Body() changeInfoData: UpdateClassroomDto,
    @Req()
    req: AuthenticatedRequest,
    @Res() res: express.Response,
  ): Promise<any> {
    try {
      const teacherID = req.user.userId;
      const classroom = await this.classroomService.changeInformation(
        classroomID,
        teacherID,
        changeInfoData,
      );
      return res.status(HttpStatus.OK).json({ classroom });
    } catch (error) {
      if (error instanceof BadRequestException) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Invalid ID' });
      }
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json({ message: error.message });
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }

  @Delete(':classroomID')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('teacher')
  async deleteClassroom(
    @Param('classroomID') classroomID: string,
    @Req() req: AuthenticatedRequest,
    @Res() res: express.Response,
  ) {
    const teacherID = req.user.userId;
    await this.classroomService.deleteClassroom(classroomID, teacherID);
    return res.status(HttpStatus.OK).json({
      success: true,
      status: 200,
      message: 'Classroom deleted successfully!',
    });
  }
}
