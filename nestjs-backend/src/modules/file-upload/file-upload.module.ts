import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ClassroomModule } from '../classroom/classroom.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    // Cấu hình Multer cơ bản (chỉ lưu vào thư mục tạm)
    MulterModule.register({
      storage: diskStorage({
        destination: './temp_uploads',
        filename: (req, file, cb) => {
          cb(null, `${Date.now()}-${file.originalname}`);
        },
      }),
    }),
    ClassroomModule,
    UserModule,
  ],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule {}
