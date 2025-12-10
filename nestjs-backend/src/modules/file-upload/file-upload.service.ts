import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ClassroomService } from '../classroom/classroom.service'; // Cần inject
import { UserService } from '../user/user.service'; // Cần inject

const STORAGE_PATH_ROOT = path.join(process.cwd(), 'public', 'uploads');

@Injectable()
export class FileUploadService {
  constructor(
    private readonly classroomService: ClassroomService,
    private readonly userService: UserService,
  ) {}

  /**
   * Xử lý di chuyển file từ thư mục tạm đến vị trí cuối cùng và tạo URL.
   * @param file File thô đã được Multer lưu tạm thời.
   * @param userId ID người dùng (creator).
   * @param classroomId ID lớp học.
   * @param slotId ID slot.
   * @returns URL công khai của file đã lưu.
   */
  async processAndGetFileUrl(
    file: Express.Multer.File,
    userId: string,
    classroomId: string,
    slotId: string,
  ): Promise<string> {
    // 1. Lấy tên động từ DB (Logic tra cứu)
    let names: { classroomName: string; slotTitle: string };
    let studentName: string;

    try {
      names = await this.classroomService.getClassroomAndSlotNames(
        classroomId,
        slotId,
      );
      studentName = await this.userService.getUserName(userId);
    } catch (dbError) {
      // Xử lý lỗi nếu không tìm thấy Class/Slot/User
      if (dbError instanceof NotFoundException) {
        await fs.unlink(file.path).catch(() => {}); // Xóa file tạm
        throw dbError;
      }
      throw new InternalServerErrorException(
        'Không thể tra cứu thông tin file.',
      );
    }

    // 2. Tạo đường dẫn và tên file cuối cùng
    const finalDir = path.join(
      STORAGE_PATH_ROOT,
      names.classroomName,
      names.slotTitle,
    );

    const extension = path.extname(file.originalname);
    const originalFileNameWithoutExt = path.basename(
      file.originalname,
      extension,
    );
    const finalFilename = `${studentName}-${originalFileNameWithoutExt}${extension}`;
    const finalPath = path.join(finalDir, finalFilename);

    try {
      // 3. Tạo thư mục và Di chuyển file (Move)
      await fs.mkdir(finalDir, { recursive: true });
      await fs.rename(file.path, finalPath);

      // 4. Tạo URL công khai
      // URL: /uploads/classroomName/slotTitle/filename
      return `/uploads/${names.classroomName}/${names.slotTitle}/${finalFilename}`;
    } catch (error) {
      console.error('Lỗi khi di chuyển file:', error);
      // Xóa file tạm (nếu rename thất bại) và ném lỗi 500
      await fs.unlink(file.path).catch(() => {});
      throw new InternalServerErrorException(
        'Không thể lưu trữ file vào vị trí cuối cùng.',
      );
    }
  }
}
