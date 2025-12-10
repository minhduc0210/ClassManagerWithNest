/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import * as multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import * as express from 'express';
// 💡 Các Service cần thiết để tra cứu tên
import { ClassroomService } from '../../modules/classroom/classroom.service';
import { UserService } from '../../modules/user/user.service';
import { Types } from 'mongoose';
import { UnauthorizedException } from '@nestjs/common';

interface AuthenticatedRequest extends express.Request {
  user?: { userId: string };
}

// Đường dẫn gốc để lưu file
const STORAGE_PATH_ROOT = path.join(process.cwd(), 'public', 'uploads');

/**
 * Hàm factory trả về cấu hình Multer để sử dụng trong FileInterceptor.
 * Hàm này nhận các Service cần thiết.
 * * @param classroomService Inject ClassroomService để tra cứu tên
 * @param userService Inject UserService để lấy tên người dùng
 */
export const createDynamicStorage = (
  classroomService: ClassroomService,
  userService: UserService,
): multer.StorageEngine => {
  return multer.diskStorage({
    // --- DESTINATION ---
    destination: async (req: AuthenticatedRequest, file, cb) => {
      const { classroomID, slotID } = req.params as {
        classroomID: string;
        slotID: string;
      };

      if (
        !Types.ObjectId.isValid(classroomID) ||
        !Types.ObjectId.isValid(slotID)
      ) {
        return cb(new Error('ID lớp học hoặc ID slot không hợp lệ.'), '');
      }

      try {
        // 1. Tra cứu Classroom và Slot để lấy TÊN
        const names = await classroomService.getClassroomAndSlotNames(
          classroomID,
          slotID,
        );

        // 2. Tạo đường dẫn dựa trên tên
        const fileDir = path.join(
          STORAGE_PATH_ROOT,
          names.classroomName,
          names.slotTitle,
        );

        // 3. Tạo thư mục nếu chưa tồn tại
        fs.mkdirSync(fileDir, { recursive: true });
        cb(null, fileDir);
      } catch (error) {
        // Xử lý lỗi từ DB hoặc lỗi tạo thư mục
        cb(new Error(`Failed to set upload destination: ${error.message}`), '');
      }
    },

    // --- FILENAME ---
    filename: async (req: AuthenticatedRequest, file, cb) => {
      const userID = req.user?.userId;
      try {
        if (!userID) throw new UnauthorizedException('Unauthorized');
        const studentName = await userService.getUserName(userID);
        const extension = path.extname(file.originalname);
        const originalFileNameWithoutExt = path.basename(
          file.originalname,
          extension,
        );

        // Cấu trúc: tên học sinh - tên file gốc
        const fileName = `${studentName}-${originalFileNameWithoutExt}${extension}`;
        cb(null, fileName);
      } catch (error) {
        cb(new Error(`Failed to generate file name: ${error.message}`), '');
      }
    },
  });
};
