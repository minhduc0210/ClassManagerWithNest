import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs/promises';
import slugify from 'slugify';
import { ClassroomService } from '../classroom/classroom.service';
import { UserService } from '../user/user.service';

const STORAGE_PATH_ROOT = path.join(process.cwd(), 'public', 'uploads');

@Injectable()
export class FileUploadService {
  constructor(
    private readonly classroomService: ClassroomService,
    private readonly userService: UserService,
  ) {}

  /**
   * Chuyển đổi chuỗi thành dạng slug an toàn cho tên thư mục và URL
   * Ví dụ: "Assignment 1: Introduction" -> "assignment-1-introduction"
   */
  private formatSlug(name: string): string {
    return slugify(name, {
      lower: true,
      strict: true,
      locale: 'vi',
    });
  }

  /**
   * Xử lý di chuyển file từ thư mục tạm đến vị trí cuối cùng và tạo URL.
   */
  async processAndGetFileUrl(
    file: Express.Multer.File,
    userId: string,
    classroomId: string,
    slotId: string,
  ): Promise<string> {
    let names: { classroomName: string; slotTitle: string };
    let studentName: string;

    // 1. Tra cứu thông tin từ Database
    try {
      names = await this.classroomService.getClassroomAndSlotNames(
        classroomId,
        slotId,
      );
      studentName = await this.userService.getUserName(userId);
    } catch (dbError) {
      // Nếu có lỗi DB hoặc không tìm thấy thông tin, xóa ngay file tạm của Multer
      await this.deleteTempFile(file.path);

      if (dbError instanceof NotFoundException) {
        throw dbError;
      }
      throw new InternalServerErrorException(
        'Lỗi tra cứu thông tin để lưu file.',
      );
    }

    // 2. Làm sạch tên để tạo đường dẫn an toàn
    const cleanClassroom = this.formatSlug(names.classroomName);
    const cleanSlot = this.formatSlug(names.slotTitle);
    const cleanStudent = this.formatSlug(studentName);

    // 3. Thiết lập đường dẫn vật lý và tên file
    const finalDir = path.join(STORAGE_PATH_ROOT, cleanClassroom, cleanSlot);

    const extension = path.extname(file.originalname);
    const originalName = path.basename(file.originalname, extension);
    const finalFilename = `${cleanStudent}-${this.formatSlug(originalName)}${extension}`;
    const finalPath = path.join(finalDir, finalFilename);

    try {
      // 4. Tạo thư mục (nếu chưa có) và Di chuyển file
      await fs.mkdir(finalDir, { recursive: true });

      // Sử dụng rename để chuyển file từ temp_uploads sang public/uploads
      await fs.rename(file.path, finalPath);

      // 5. Trả về URL công khai (Dùng format slug để URL đẹp và không lỗi)
      console.log(`/uploads/${cleanClassroom}/${cleanSlot}/${finalFilename}`);
      return `/uploads/${cleanClassroom}/${cleanSlot}/${finalFilename}`;
    } catch (error) {
      console.error('File System Error:', error);

      // Xóa file tạm nếu di chuyển thất bại
      await this.deleteTempFile(file.path);

      throw new InternalServerErrorException(
        'Không thể lưu trữ file vào hệ thống. Vui lòng thử lại.',
      );
    }
  }

  /**
   * Hàm helper xóa file tạm an toàn
   */
  private async deleteTempFile(filePath: string) {
    try {
      await fs.unlink(filePath);
    } catch (err) {
      // Chỉ log lỗi nếu file tồn tại mà không xóa được
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (err.code !== 'ENOENT') {
        console.error('Không thể xóa file tạm:', filePath);
      }
    }
  }
}
